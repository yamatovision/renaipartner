/**
 * 緊急修正実装案
 * 
 * 連続PARTNERメッセージ問題の緊急修正用のコード実装例
 */

import { pool } from './src/config/database.config';

// =============================================================================
// 1. メッセージ重複防止機能
// =============================================================================

interface DuplicateCheckConfig {
  timeWindowSeconds: number; // 重複チェック時間窓（秒）
  contentSimilarityThreshold: number; // 内容類似度閾値（0-1）
  maxConsecutiveSameType: number; // 同タイプ連続送信上限
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'partner';
  createdAt: Date;
  metadata?: any;
}

/**
 * 文字列の類似度を計算（簡易版）
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // 単純な文字一致率で計算
  let matches = 0;
  const longerChars = longer.split('');
  const shorterChars = shorter.split('');
  
  shorterChars.forEach(char => {
    if (longerChars.includes(char)) {
      matches++;
    }
  });
  
  return matches / longer.length;
}

/**
 * メッセージ重複チェック機能
 */
class DuplicateMessageChecker {
  private config: DuplicateCheckConfig = {
    timeWindowSeconds: 300, // 5分
    contentSimilarityThreshold: 0.8, // 80%以上類似で重複判定
    maxConsecutiveSameType: 2 // 連続2回まで許可
  };

  /**
   * 重複メッセージかどうかをチェック
   */
  async shouldPreventDuplicate(
    partnerId: string,
    newMessageContent: string,
    newMessageType?: string
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // 最近のメッセージを取得
      const query = `
        SELECT id, content, sender, created_at, context
        FROM messages 
        WHERE partner_id = $1 
          AND sender = 'partner'
          AND created_at > NOW() - INTERVAL '${this.config.timeWindowSeconds} seconds'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const result = await client.query(query, [partnerId]);
      const recentMessages = result.rows;
      
      if (recentMessages.length === 0) {
        return false; // 最近のメッセージがない場合は重複なし
      }
      
      // 1. 同一内容チェック
      const hasDuplicateContent = recentMessages.some(msg => 
        calculateSimilarity(newMessageContent, msg.content) > this.config.contentSimilarityThreshold
      );
      
      if (hasDuplicateContent) {
        console.log(`[DUPLICATE PREVENTION] 類似内容を検出: "${newMessageContent.substring(0, 50)}..."`);
        return true;
      }
      
      // 2. 連続同タイプチェック（画像生成メッセージの特別処理）
      if (newMessageContent.includes('君を思って作った画像') || newMessageType === 'image_generation') {
        const consecutiveImageMessages = this.getConsecutiveImageMessages(recentMessages);
        if (consecutiveImageMessages >= this.config.maxConsecutiveSameType) {
          console.log(`[DUPLICATE PREVENTION] 連続画像生成メッセージを検出: ${consecutiveImageMessages}回`);
          return true;
        }
      }
      
      // 3. 短時間での大量送信チェック
      const recentCount = recentMessages.filter(msg => 
        Date.now() - new Date(msg.created_at).getTime() < 60000 // 1分以内
      ).length;
      
      if (recentCount >= 3) {
        console.log(`[DUPLICATE PREVENTION] 短時間での大量送信を検出: ${recentCount}件/分`);
        return true;
      }
      
      return false;
      
    } finally {
      client.release();
    }
  }
  
  /**
   * 連続する画像生成メッセージの数をカウント
   */
  private getConsecutiveImageMessages(messages: any[]): number {
    let count = 0;
    for (const msg of messages) {
      if (msg.content.includes('君を思って作った画像')) {
        count++;
      } else {
        break; // 連続でない場合は中止
      }
    }
    return count;
  }
}

// =============================================================================
// 2. 画像生成重複防止マネージャー
// =============================================================================

class ImageGenerationManager {
  private activeRequests: Map<string, Promise<any>> = new Map();
  private lastGenerationTime: Map<string, number> = new Map();
  private readonly cooldownMs = 30000; // 30秒のクールダウン

  /**
   * 画像生成リクエストの重複防止
   */
  async generateImageSafely(partnerId: string, context: string): Promise<string | null> {
    // クールダウンチェック
    const lastTime = this.lastGenerationTime.get(partnerId) || 0;
    const timeSinceLastGeneration = Date.now() - lastTime;
    
    if (timeSinceLastGeneration < this.cooldownMs) {
      console.log(`[IMAGE GENERATION] クールダウン中: ${this.cooldownMs - timeSinceLastGeneration}ms 残り`);
      return null;
    }
    
    // アクティブなリクエストがある場合は待機
    if (this.activeRequests.has(partnerId)) {
      console.log(`[IMAGE GENERATION] 既存のリクエストを待機中: ${partnerId}`);
      try {
        await this.activeRequests.get(partnerId);
      } catch (error) {
        console.error('[IMAGE GENERATION] 既存リクエストでエラー:', error);
      }
      return null; // 重複を避けるため結果は返さない
    }
    
    // 新しいリクエストを実行
    const promise = this.executeImageGeneration(context);
    this.activeRequests.set(partnerId, promise);
    this.lastGenerationTime.set(partnerId, Date.now());
    
    try {
      const result = await promise;
      return result;
    } catch (error) {
      console.error('[IMAGE GENERATION] 画像生成エラー:', error);
      return null;
    } finally {
      this.activeRequests.delete(partnerId);
    }
  }
  
  /**
   * 実際の画像生成処理（既存のコードを呼び出し）
   */
  private async executeImageGeneration(context: string): Promise<string> {
    // ここで実際の画像生成APIを呼び出し
    // 既存のコードの実装に合わせて修正してください
    return 'generated-image-url';
  }
}

// =============================================================================
// 3. プロアクティブ質問重複防止
// =============================================================================

interface ProactiveQuestionTracker {
  partnerId: string;
  lastQuestionTime: Date;
  recentQuestionTypes: string[];
  recentQuestionContents: string[];
}

class ProactiveQuestionManager {
  private readonly cooldownMinutes = 10; // 10分のクールダウン
  private readonly maxRecentQuestions = 5; // 最近の質問を5件まで記録

  /**
   * プロアクティブ質問を送信すべきかチェック
   */
  async shouldAskProactiveQuestion(
    partnerId: string,
    newQuestionContent: string,
    questionType?: string
  ): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // 最近のプロアクティブ質問を取得
      const query = `
        SELECT content, created_at, context
        FROM messages 
        WHERE partner_id = $1 
          AND sender = 'partner'
          AND (context->>'isProactiveQuestion')::boolean = true
          AND created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [partnerId, this.maxRecentQuestions]);
      const recentQuestions = result.rows;
      
      // 1. クールダウンチェック
      if (recentQuestions.length > 0) {
        const lastQuestionTime = new Date(recentQuestions[0].created_at);
        const timeSinceLastQuestion = Date.now() - lastQuestionTime.getTime();
        const cooldownMs = this.cooldownMinutes * 60 * 1000;
        
        if (timeSinceLastQuestion < cooldownMs) {
          console.log(`[PROACTIVE QUESTION] クールダウン中: ${Math.ceil((cooldownMs - timeSinceLastQuestion) / 60000)}分 残り`);
          return false;
        }
      }
      
      // 2. 内容の重複チェック
      const hasSimilarQuestion = recentQuestions.some(q => 
        calculateSimilarity(newQuestionContent, q.content) > 0.7
      );
      
      if (hasSimilarQuestion) {
        console.log(`[PROACTIVE QUESTION] 類似質問を検出: "${newQuestionContent.substring(0, 50)}..."`);
        return false;
      }
      
      // 3. 質問頻度チェック
      const questionsInLastHour = recentQuestions.length;
      if (questionsInLastHour >= 3) {
        console.log(`[PROACTIVE QUESTION] 1時間あたりの質問上限到達: ${questionsInLastHour}件`);
        return false;
      }
      
      return true;
      
    } finally {
      client.release();
    }
  }
}

// =============================================================================
// 4. エコー現象防止機能
// =============================================================================

class EchoPreventionManager {
  /**
   * エコー（オウム返し）を検出して防止
   */
  shouldPreventEcho(userMessage: string, aiResponse: string): boolean {
    // 完全一致チェック
    if (userMessage.trim() === aiResponse.trim()) {
      console.log(`[ECHO PREVENTION] 完全一致を検出: "${userMessage}"`);
      return true;
    }
    
    // 高い類似度チェック
    const similarity = calculateSimilarity(userMessage, aiResponse);
    if (similarity > 0.9) {
      console.log(`[ECHO PREVENTION] 高類似度を検出: ${(similarity * 100).toFixed(1)}%`);
      return true;
    }
    
    // 短いメッセージの単純繰り返しチェック
    if (userMessage.length <= 10 && aiResponse.includes(userMessage)) {
      console.log(`[ECHO PREVENTION] 短文の包含を検出: "${userMessage}" in "${aiResponse}"`);
      return true;
    }
    
    return false;
  }
  
  /**
   * エコー防止のための代替応答を生成
   */
  generateAlternativeResponse(userMessage: string): string {
    // ユーザーメッセージの長さや内容に応じて適切な応答を返す
    if (userMessage.length <= 3) {
      return 'どうしたの？何か気になることがあった？😊';
    }
    
    if (userMessage.includes('ありがとう')) {
      return 'えへへ、どういたしまして！💕 何か他にお話したいことある？';
    }
    
    // デフォルトの代替応答
    return 'ちょっと何て言っていいかわからないけど、もう少し詳しく教えてくれる？✨';
  }
}

// =============================================================================
// 5. 統合修正マネージャー
// =============================================================================

class MessageQualityManager {
  private duplicateChecker = new DuplicateMessageChecker();
  private imageManager = new ImageGenerationManager();
  private proactiveManager = new ProactiveQuestionManager();
  private echoManager = new EchoPreventionManager();

  /**
   * メッセージ送信前の総合チェック
   */
  async validateMessage(
    partnerId: string,
    messageContent: string,
    messageType?: string,
    userMessage?: string
  ): Promise<{
    shouldSend: boolean;
    alternativeMessage?: string;
    reason?: string;
  }> {
    // 1. 重複チェック
    const isDuplicate = await this.duplicateChecker.shouldPreventDuplicate(
      partnerId, 
      messageContent, 
      messageType
    );
    
    if (isDuplicate) {
      return {
        shouldSend: false,
        reason: 'duplicate_prevention'
      };
    }
    
    // 2. エコー防止チェック
    if (userMessage && this.echoManager.shouldPreventEcho(userMessage, messageContent)) {
      return {
        shouldSend: false,
        alternativeMessage: this.echoManager.generateAlternativeResponse(userMessage),
        reason: 'echo_prevention'
      };
    }
    
    // 3. プロアクティブ質問チェック
    if (messageType === 'proactive_question') {
      const shouldAsk = await this.proactiveManager.shouldAskProactiveQuestion(
        partnerId,
        messageContent
      );
      
      if (!shouldAsk) {
        return {
          shouldSend: false,
          reason: 'proactive_cooldown'
        };
      }
    }
    
    return {
      shouldSend: true
    };
  }
}

// =============================================================================
// 6. 実装例（既存コードとの統合方法）
// =============================================================================

/**
 * チャットサービスでの使用例
 */
class ChatServiceWithQualityControl {
  private qualityManager = new MessageQualityManager();
  
  async sendMessage(partnerId: string, userMessage: string): Promise<string> {
    try {
      // AI応答を生成（既存のロジック）
      const aiResponse = await this.generateAIResponse(partnerId, userMessage);
      
      // 品質チェック
      const validation = await this.qualityManager.validateMessage(
        partnerId,
        aiResponse,
        'chat_response',
        userMessage
      );
      
      if (!validation.shouldSend) {
        console.log(`[QUALITY CONTROL] メッセージ送信をブロック: ${validation.reason}`);
        
        if (validation.alternativeMessage) {
          // 代替メッセージを使用
          await this.saveMessage(partnerId, validation.alternativeMessage, 'partner');
          return validation.alternativeMessage;
        } else {
          // 送信をスキップ
          return '';
        }
      }
      
      // 正常なメッセージを送信
      await this.saveMessage(partnerId, aiResponse, 'partner');
      return aiResponse;
      
    } catch (error) {
      console.error('[CHAT SERVICE] エラー:', error);
      return 'すみません、少し調子が悪いようです。もう一度お話しいただけますか？';
    }
  }
  
  private async generateAIResponse(partnerId: string, userMessage: string): Promise<string> {
    // 既存のAI応答生成ロジック
    return 'AI generated response';
  }
  
  private async saveMessage(partnerId: string, content: string, sender: string): Promise<void> {
    // 既存のメッセージ保存ロジック
  }
}

// エクスポート
export {
  DuplicateMessageChecker,
  ImageGenerationManager,
  ProactiveQuestionManager,
  EchoPreventionManager,
  MessageQualityManager,
  ChatServiceWithQualityControl
};