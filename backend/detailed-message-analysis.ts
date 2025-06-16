/**
 * 詳細メッセージ分析スクリプト
 * 
 * 連続PARTNERメッセージの詳細な内容を分析し、
 * AI応答への影響を調査します
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

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: ENV_CONFIG.OPENAI_API_KEY,
});

/**
 * 詳細なメッセージ分析を実行
 */
async function detailedMessageAnalysis(): Promise<void> {
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
    const partner = partnerResult.rows[0];
    
    // 全メッセージを取得（時系列順）
    const messagesQuery = `
      SELECT id, partner_id, content, sender, emotion, context, created_at
      FROM messages 
      WHERE partner_id = $1
      ORDER BY created_at ASC
    `;
    
    const messagesResult = await client.query(messagesQuery, [partner.id]);
    const messages = messagesResult.rows;
    
    console.log('=== 詳細メッセージ分析 ===');
    console.log(`パートナー: ${partner.name} (${partner.personality_type})`);
    console.log(`総メッセージ数: ${messages.length}`);
    console.log('');
    
    // 全メッセージを表示（番号付き）
    console.log('=== 全メッセージ履歴 ===');
    messages.forEach((msg, index) => {
      const timestamp = new Date(msg.created_at).toLocaleString('ja-JP');
      const senderLabel = msg.sender === 'user' ? '[USER]' : '[PARTNER]';
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${senderLabel} ${timestamp}`);
      console.log(`    ${msg.content}`);
      if (msg.emotion) {
        console.log(`    感情: ${msg.emotion}`);
      }
      console.log('');
    });
    
    // 連続PARTNERメッセージの詳細分析
    console.log('=== 連続PARTNERメッセージ詳細分析 ===');
    let consecutiveGroups: Message[][] = [];
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
    
    consecutiveGroups.forEach((group, groupIndex) => {
      console.log(`\n連続グループ ${groupIndex + 1}:`);
      group.forEach((msg, msgIndex) => {
        const timestamp = new Date(msg.created_at).toLocaleString('ja-JP');
        console.log(`  ${msgIndex + 1}. [${timestamp}]`);
        console.log(`     内容: ${msg.content}`);
        console.log(`     感情: ${msg.emotion || 'なし'}`);
        
        // 内容の類似性をチェック
        if (msgIndex > 0) {
          const prevMsg = group[msgIndex - 1];
          const similarity = calculateSimilarity(msg.content, prevMsg.content);
          console.log(`     前メッセージとの類似度: ${(similarity * 100).toFixed(1)}%`);
        }
      });
    });
    
    // 特定の問題メッセージを分析
    console.log('\n=== 特定メッセージ分析 ===');
    const targetMessage = messages.find(msg => 
      msg.content.includes('達也っち') && msg.content.includes('老後')
    );
    
    if (targetMessage) {
      const messageIndex = messages.indexOf(targetMessage);
      console.log(`発見位置: ${messageIndex + 1}番目のメッセージ`);
      console.log(`送信者: ${targetMessage.sender}`);
      console.log(`内容: ${targetMessage.content}`);
      console.log(`感情: ${targetMessage.emotion || 'なし'}`);
      
      // 前後のメッセージを確認
      console.log('\n前後のコンテキスト:');
      for (let i = Math.max(0, messageIndex - 2); i <= Math.min(messages.length - 1, messageIndex + 2); i++) {
        const msg = messages[i];
        const marker = i === messageIndex ? '>>> ' : '    ';
        const senderLabel = msg.sender === 'user' ? '[USER]' : '[PARTNER]';
        console.log(`${marker}${i + 1}. ${senderLabel} ${msg.content.substring(0, 50)}...`);
      }
    }
    
    // AI応答テスト - 問題のあるシーケンスに焦点
    console.log('\n=== 問題シーケンステスト ===');
    
    if (consecutiveGroups.length > 0) {
      const problematicGroup = consecutiveGroups[0];
      const startIndex = messages.indexOf(problematicGroup[0]);
      
      // 問題のあるシーケンス前後を含むテスト
      const contextStart = Math.max(0, startIndex - 5);
      const contextEnd = Math.min(messages.length, startIndex + problematicGroup.length + 3);
      const testMessages = messages.slice(contextStart, contextEnd);
      
      console.log('テスト対象メッセージ範囲:');
      testMessages.forEach((msg, index) => {
        const globalIndex = contextStart + index + 1;
        const senderLabel = msg.sender === 'user' ? '[USER]' : '[PARTNER]';
        const isProblematic = problematicGroup.includes(msg) ? ' *** 問題メッセージ ***' : '';
        console.log(`  ${globalIndex}. ${senderLabel} ${msg.content.substring(0, 60)}...${isProblematic}`);
      });
      
      // AI応答テスト
      await testAIResponseWithProblematicSequence(partner, testMessages);
    }
    
  } catch (error) {
    console.error('分析エラー:', error);
  } finally {
    client.release();
  }
}

/**
 * 文字列の類似度を計算（簡易版）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * レーベンシュタイン距離を計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 問題のあるシーケンスでAI応答をテスト
 */
async function testAIResponseWithProblematicSequence(
  partner: Partner,
  messages: Message[]
): Promise<void> {
  console.log('\n--- AI応答テスト開始 ---');
  
  const systemMessage: OpenAI.ChatCompletionMessageParam = {
    role: 'system',
    content: `あなたは${partner.name}として振る舞ってください。
性格: ${partner.personality_type}
話し方: ${partner.speech_style}
親密度レベル: ${partner.intimacy_level}/100

${partner.system_prompt}

会話履歴を参考に、自然で一貫性のある応答をしてください。重複や矛盾のない回答を心がけてください。`
  };
  
  const conversationMessages: OpenAI.ChatCompletionMessageParam[] = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
  
  // 新しいユーザーメッセージを追加してテスト
  const testUserMessage: OpenAI.ChatCompletionMessageParam = {
    role: 'user',
    content: 'どうしたの？何か心配事があるの？'
  };
  
  const allMessages = [systemMessage, ...conversationMessages, testUserMessage];
  
  try {
    console.log('OpenAI APIに送信するメッセージ数:', allMessages.length);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: allMessages,
      max_tokens: 200,
      temperature: 0.8,
    });
    
    const generatedResponse = response.choices[0]?.message?.content || '';
    console.log('\nAI応答:');
    console.log(generatedResponse);
    
    // 応答の品質分析
    console.log('\n--- 応答品質分析 ---');
    console.log(`応答長: ${generatedResponse.length}文字`);
    console.log(`感情表現: ${generatedResponse.includes('✨') || generatedResponse.includes('😊') ? 'あり' : 'なし'}`);
    console.log(`質問形式: ${generatedResponse.includes('？') ? 'あり' : 'なし'}`);
    
    // 過去のメッセージとの類似度チェック
    const recentPartnerMessages = messages
      .filter(msg => msg.sender === 'partner')
      .slice(-3);
    
    console.log('\n--- 重複度チェック ---');
    recentPartnerMessages.forEach((msg, index) => {
      const similarity = calculateSimilarity(generatedResponse, msg.content);
      console.log(`過去のメッセージ${index + 1}との類似度: ${(similarity * 100).toFixed(1)}%`);
      if (similarity > 0.7) {
        console.log(`  ⚠️ 高い類似度が検出されました`);
      }
    });
    
  } catch (error) {
    console.error('AI応答テストエラー:', error);
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    await detailedMessageAnalysis();
  } catch (error) {
    console.error('実行エラー:', error);
  } finally {
    await pool.end();
    console.log('\n分析完了。データベース接続を閉じました。');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}