/**
 * 連続PARTNERメッセージの影響テスト
 * 
 * このスクリプトは以下のテストを実行します：
 * 1. 最新のメッセージ履歴を取得
 * 2. 連続するPARTNERメッセージのパターンを分析
 * 3. 異なるメッセージ履歴でOpenAI APIをテスト
 * 4. 応答の品質と一貫性を比較
 */

import { pool } from './src/config/database.config';
import OpenAI from 'openai';
import { ENV_CONFIG } from './src/config/env.config';

interface Message {
  id: string;
  partner_id: string;
  content: string;
  sender: 'user' | 'partner';
  emotion?: string;
  context?: any;
  created_at: Date;
}

interface Partner {
  id: string;
  user_id: string;
  name: string;
  gender: string;
  personality_type: string;
  speech_style: string;
  system_prompt: string;
  intimacy_level: number;
}

interface TestResult {
  scenario: string;
  messageCount: number;
  consecutivePartnerGroups: number;
  response: string;
  error?: string;
  responseTime?: number;
}

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: ENV_CONFIG.OPENAI_API_KEY,
});

/**
 * 最新のパートナーと関連メッセージを取得
 */
async function fetchLatestPartnerAndMessages(): Promise<{
  partner: Partner;
  messages: Message[];
}> {
  const client = await pool.connect();
  
  try {
    // 最新のパートナーを取得
    const partnerQuery = `
      SELECT id, user_id, name, gender, personality_type, speech_style, 
             system_prompt, intimacy_level
      FROM partners 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const partnerResult = await client.query(partnerQuery);
    
    if (partnerResult.rows.length === 0) {
      throw new Error('パートナーが見つかりません');
    }
    
    const partner = partnerResult.rows[0];
    console.log(`パートナー情報: ${partner.name} (${partner.personality_type})`);
    
    // 関連するメッセージを取得（最新50件）
    const messagesQuery = `
      SELECT id, partner_id, content, sender, emotion, context, created_at
      FROM messages 
      WHERE partner_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    const messagesResult = await client.query(messagesQuery, [partner.id]);
    const messages = messagesResult.rows.reverse(); // 古い順に並び替え
    
    console.log(`取得メッセージ数: ${messages.length}`);
    
    return { partner, messages };
    
  } finally {
    client.release();
  }
}

/**
 * 連続するPARTNERメッセージのパターンを分析
 */
function analyzeConsecutivePatterns(messages: Message[]): {
  consecutiveGroups: Message[][];
  statistics: {
    totalGroups: number;
    maxConsecutiveLength: number;
    averageConsecutiveLength: number;
    targetMessageFound: boolean;
    targetMessageContent?: string;
  };
} {
  const consecutiveGroups: Message[][] = [];
  let currentGroup: Message[] = [];
  
  messages.forEach((msg, index) => {
    if (msg.sender === 'partner') {
      currentGroup.push(msg);
    } else {
      if (currentGroup.length > 1) {
        consecutiveGroups.push([...currentGroup]);
      }
      currentGroup = [];
    }
  });
  
  // 最後のグループをチェック
  if (currentGroup.length > 1) {
    consecutiveGroups.push(currentGroup);
  }
  
  // 「達也っち、将来の老後は...」メッセージを探す
  const targetMessage = messages.find(msg => 
    msg.content.includes('達也っち') && msg.content.includes('老後')
  );
  
  const lengths = consecutiveGroups.map(group => group.length);
  
  const statistics = {
    totalGroups: consecutiveGroups.length,
    maxConsecutiveLength: lengths.length > 0 ? Math.max(...lengths) : 0,
    averageConsecutiveLength: lengths.length > 0 ? 
      lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
    targetMessageFound: !!targetMessage,
    targetMessageContent: targetMessage?.content
  };
  
  return { consecutiveGroups, statistics };
}

/**
 * メッセージ履歴をOpenAI API用のフォーマットに変換
 */
function formatMessagesForAPI(
  partner: Partner, 
  messages: Message[]
): OpenAI.ChatCompletionMessageParam[] {
  const systemMessage: OpenAI.ChatCompletionMessageParam = {
    role: 'system',
    content: `あなたは${partner.name}として振る舞ってください。

性格: ${partner.personality_type}
話し方: ${partner.speech_style}
親密度レベル: ${partner.intimacy_level}/100

${partner.system_prompt}

以下の会話履歴を踏まえて、自然で一貫性のある応答をしてください。`
  };
  
  const conversationMessages: OpenAI.ChatCompletionMessageParam[] = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
  
  return [systemMessage, ...conversationMessages];
}

/**
 * 重複メッセージを除去
 */
function removeDuplicateMessages(messages: Message[]): Message[] {
  const seen = new Set<string>();
  return messages.filter(msg => {
    // 内容とタイムスタンプで重複判定
    const key = `${msg.content}-${msg.sender}-${msg.created_at.getTime()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 連続PARTNERメッセージの最後のもの以外を除去
 */
function removeConsecutiveDuplicates(messages: Message[]): Message[] {
  const result: Message[] = [];
  let lastSender: string | null = null;
  
  for (const msg of messages) {
    if (msg.sender !== lastSender || msg.sender === 'user') {
      result.push(msg);
      lastSender = msg.sender;
    } else if (msg.sender === 'partner') {
      // 連続するPARTNERメッセージの場合、最後のものに更新
      result[result.length - 1] = msg;
    }
  }
  
  return result;
}

/**
 * OpenAI APIでテスト応答を生成
 */
async function generateTestResponse(
  partner: Partner,
  messages: Message[],
  scenario: string
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const apiMessages = formatMessagesForAPI(partner, messages);
    
    console.log(`\n=== ${scenario} ===`);
    console.log(`メッセージ数: ${messages.length}`);
    
    // 連続パターンを分析
    const { consecutiveGroups } = analyzeConsecutivePatterns(messages);
    console.log(`連続PARTNERメッセージグループ数: ${consecutiveGroups.length}`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      max_tokens: 200,
      temperature: 0.8,
    });
    
    const responseTime = Date.now() - startTime;
    const generatedResponse = response.choices[0]?.message?.content || '';
    
    console.log(`応答時間: ${responseTime}ms`);
    console.log(`生成された応答: ${generatedResponse.substring(0, 100)}...`);
    
    return {
      scenario,
      messageCount: messages.length,
      consecutivePartnerGroups: consecutiveGroups.length,
      response: generatedResponse,
      responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`エラー発生: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      scenario,
      messageCount: messages.length,
      consecutivePartnerGroups: 0,
      response: '',
      error: error instanceof Error ? error.message : String(error),
      responseTime
    };
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    console.log('=== 連続PARTNERメッセージ影響テスト開始 ===\n');
    
    // 1. データベースからメッセージ履歴を取得
    const { partner, messages } = await fetchLatestPartnerAndMessages();
    
    if (messages.length === 0) {
      console.log('メッセージ履歴が見つかりません。テストを終了します。');
      return;
    }
    
    // 2. 連続パターンを分析
    const { consecutiveGroups, statistics } = analyzeConsecutivePatterns(messages);
    
    console.log('\n=== 連続パターン分析結果 ===');
    console.log(`総連続グループ数: ${statistics.totalGroups}`);
    console.log(`最大連続長: ${statistics.maxConsecutiveLength}`);
    console.log(`平均連続長: ${statistics.averageConsecutiveLength.toFixed(2)}`);
    console.log(`特定メッセージ発見: ${statistics.targetMessageFound}`);
    
    if (statistics.targetMessageFound) {
      console.log(`特定メッセージ内容: ${statistics.targetMessageContent}`);
    }
    
    // 連続グループの詳細表示
    consecutiveGroups.forEach((group, index) => {
      console.log(`\n連続グループ ${index + 1} (${group.length}件):`);
      group.forEach((msg, msgIndex) => {
        console.log(`  ${msgIndex + 1}. ${msg.content.substring(0, 50)}...`);
      });
    });
    
    // 3. 異なるシナリオでテスト実行
    const testResults: TestResult[] = [];
    
    // シナリオ1: 元のメッセージ履歴
    console.log('\n=== テストシナリオ実行 ===');
    const originalResult = await generateTestResponse(
      partner, 
      messages, 
      'オリジナル履歴（連続PARTNERメッセージ含む）'
    );
    testResults.push(originalResult);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // API制限回避
    
    // シナリオ2: 連続PARTNERメッセージを最後のもの以外除去
    const dedupedMessages = removeConsecutiveDuplicates(messages);
    const dedupedResult = await generateTestResponse(
      partner, 
      dedupedMessages, 
      '連続PARTNERメッセージ除去版'
    );
    testResults.push(dedupedResult);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // API制限回避
    
    // シナリオ3: 完全重複除去
    const uniqueMessages = removeDuplicateMessages(messages);
    const uniqueResult = await generateTestResponse(
      partner, 
      uniqueMessages, 
      '完全重複除去版'
    );
    testResults.push(uniqueResult);
    
    // 4. 結果比較と分析
    console.log('\n=== テスト結果比較 ===');
    testResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.scenario}`);
      console.log(`   メッセージ数: ${result.messageCount}`);
      console.log(`   連続グループ数: ${result.consecutivePartnerGroups}`);
      console.log(`   応答時間: ${result.responseTime}ms`);
      console.log(`   エラー: ${result.error || 'なし'}`);
      console.log(`   応答品質: ${result.response.length > 0 ? '正常' : 'エラー'}`);
      
      if (result.response) {
        console.log(`   応答内容: ${result.response.substring(0, 100)}...`);
      }
    });
    
    console.log('\n=== 推奨事項 ===');
    
    if (statistics.totalGroups > 0) {
      console.log('- 連続するPARTNERメッセージが検出されました');
      console.log('- メッセージ送信前に重複チェック機能の実装を推奨');
      console.log('- 会話履歴の前処理で連続メッセージをマージすることを検討');
    }
    
    const errorResults = testResults.filter(r => r.error);
    if (errorResults.length > 0) {
      console.log('- 一部のシナリオでエラーが発生しました');
      console.log('- メッセージ履歴の品質向上が必要です');
    }
    
    const responseTimeAvg = testResults
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / testResults.length;
    
    console.log(`- 平均応答時間: ${responseTimeAvg.toFixed(0)}ms`);
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
  } finally {
    // データベース接続を閉じる
    await pool.end();
    console.log('\nテスト完了。データベース接続を閉じました。');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}