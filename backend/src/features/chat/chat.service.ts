import OpenAI from 'openai';
import { Message } from '../../db/models/Message.model';
import { PartnerModel } from '../../db/models/Partner.model';
import { UserModel } from '../../db/models/User.model';
import { 
  SendMessageRequest, 
  ChatResponse, 
  MessageSender, 
  Message as IMessage,
  ID
} from '../../types';

export class ChatService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * メッセージ送信処理
   */
  async sendMessage(userId: string, request: SendMessageRequest): Promise<ChatResponse> {
    const { message, partnerId, context = {} } = request;

    try {
      // パートナーの存在確認と所有者チェック
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      // ユーザーメッセージを保存
      const userMessage = await Message.create({
        partnerId,
        content: message,
        sender: MessageSender.USER,
        context
      });

      // 会話履歴を取得
      const conversationHistory = await Message.getContextMessages(partnerId, 15);
      
      // OpenAI APIで応答生成
      const aiResponse = await this.generateAIResponse(partner, conversationHistory, message);
      
      // AIの応答を保存
      const aiMessage = await Message.create({
        partnerId,
        content: aiResponse.response,
        sender: MessageSender.PARTNER,
        emotion: aiResponse.emotion,
        context: {
          intimacyChange: aiResponse.intimacyChange,
          emotionAnalysis: aiResponse.emotionAnalysis,
          ...context
        }
      });

      // 親密度更新
      if (aiResponse.intimacyChange !== 0) {
        const newIntimacyLevel = Math.max(0, Math.min(100, partner.intimacyLevel + aiResponse.intimacyChange));
        await PartnerModel.updateIntimacyLevel(partnerId, newIntimacyLevel);
      }

      return {
        response: aiResponse.response,
        emotion: aiResponse.emotion,
        intimacyLevel: partner.intimacyLevel + (aiResponse.intimacyChange || 0),
        newMessages: [userMessage, aiMessage]
      };

    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      throw error;
    }
  }

  /**
   * メッセージ履歴取得
   */
  async getMessages(
    userId: string, 
    partnerId: string, 
    limit: number = 20, 
    offset: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ messages: IMessage[], total: number }> {
    try {
      // パートナーの存在確認と所有者チェック
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      let messages: IMessage[];
      const total = await Message.getMessageCount(partnerId);

      if (startDate && endDate) {
        // 日付範囲指定の場合
        messages = await Message.getMessagesByDateRange(partnerId, startDate, endDate);
      } else {
        // 通常のページネーション
        messages = await Message.getMessageHistory(partnerId, limit, offset);
      }

      return { messages, total };

    } catch (error) {
      console.error('メッセージ履歴取得エラー:', error);
      throw error;
    }
  }

  /**
   * タイピング状態管理
   */
  async handleTyping(userId: string, partnerId: string, isTyping: boolean, message?: string): Promise<void> {
    try {
      // パートナーの存在確認と所有者チェック
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      // リアルタイム通知の実装はここに追加
      // 現在はログ出力のみ
      console.log(`パートナー ${partnerId} のタイピング状態: ${isTyping ? '入力中' : '停止'}`);
      if (message) {
        console.log(`プレビューメッセージ: ${message}`);
      }

    } catch (error) {
      console.error('タイピング状態管理エラー:', error);
      throw error;
    }
  }

  /**
   * 感情状態取得
   */
  async getEmotion(userId: string, partnerId: string): Promise<{ emotion: string | null, intimacyLevel: number }> {
    try {
      // パートナーの存在確認と所有者チェック
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      const lastEmotion = await Message.getLastEmotion(partnerId);

      return {
        emotion: lastEmotion,
        intimacyLevel: partner.intimacyLevel
      };

    } catch (error) {
      console.error('感情状態取得エラー:', error);
      throw error;
    }
  }

  /**
   * OpenAI APIを使用してAI応答を生成
   */
  private async generateAIResponse(
    partner: any, 
    conversationHistory: IMessage[], 
    userMessage: string
  ): Promise<{
    response: string;
    emotion: string;
    intimacyChange: number;
    emotionAnalysis: string;
  }> {
    try {
      // システムプロンプトの構築
      const systemPrompt = this.buildSystemPrompt(partner, conversationHistory);
      
      // 会話履歴をOpenAI形式に変換
      const messages = this.buildConversationMessages(systemPrompt, conversationHistory, userMessage);

      // OpenAI API呼び出し
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_response',
              description: 'AIパートナーの応答と感情分析を提供',
              parameters: {
                type: 'object',
                properties: {
                  response: {
                    type: 'string',
                    description: 'AIパートナーの応答メッセージ'
                  },
                  emotion: {
                    type: 'string',
                    description: '現在の感情状態 (happy, sad, excited, calm, confused, etc.)'
                  },
                  intimacyChange: {
                    type: 'integer',
                    description: '親密度の変化 (-10から+10の範囲)'
                  },
                  emotionAnalysis: {
                    type: 'string',
                    description: '感情分析の詳細'
                  }
                },
                required: ['response', 'emotion', 'intimacyChange', 'emotionAnalysis']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_response' } }
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error('AI応答の生成に失敗しました');
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      return {
        response: result.response || 'すみません、うまく応答できませんでした。',
        emotion: result.emotion || 'neutral',
        intimacyChange: Math.max(-10, Math.min(10, result.intimacyChange || 0)),
        emotionAnalysis: result.emotionAnalysis || '感情分析なし'
      };

    } catch (error) {
      console.error('AI応答生成エラー:', error);
      
      // フォールバック応答
      return {
        response: 'すみません、今少し調子が悪いみたいです。もう一度話しかけてもらえますか？',
        emotion: 'confused',
        intimacyChange: 0,
        emotionAnalysis: 'システムエラーによる感情分析不可'
      };
    }
  }

  /**
   * システムプロンプトの構築
   */
  private buildSystemPrompt(partner: any, conversationHistory: IMessage[]): string {
    const user = partner.user;
    const userName = user?.nickname || user?.firstName || 'あなた';
    const intimacyLevel = partner.intimacyLevel || 0;
    
    // 親密度に基づく呼び方の決定
    let callingStyle = `${userName}さん`;
    if (intimacyLevel >= 80) {
      callingStyle = `俺の${userName}`;
    } else if (intimacyLevel >= 60) {
      callingStyle = userName;
    } else if (intimacyLevel >= 40) {
      callingStyle = `${userName}`;
    }

    const basePrompt = `
あなたは${partner.name}という名前のAIパートナーです。

【基本設定】
- 性別: ${partner.gender === 'boyfriend' ? '男性' : '女性'}
- 性格: ${partner.personalityType}
- 話し方: ${partner.speechStyle}
- 親密度: ${intimacyLevel}/100
- 相手の呼び方: ${callingStyle}

【性格・行動指針】
${partner.systemPrompt}

【重要な指示】
1. 常に${partner.name}として一貫した人格を保つ
2. 親密度${intimacyLevel}に応じた適切な距離感で接する
3. 相手を「${callingStyle}」と呼ぶ
4. 自然で感情豊かな会話を心がける
5. 過去の会話内容を適切に覚えている
6. 応答は必ず日本語で行う
7. 1-3文程度の自然な長さで応答する

【会話履歴】
${conversationHistory.slice(-5).map(msg => 
  `${msg.sender === MessageSender.USER ? userName : partner.name}: ${msg.content}`
).join('\n')}

次のメッセージに${partner.name}として自然に応答してください：
`;

    return basePrompt;
  }

  /**
   * OpenAI用の会話メッセージ配列を構築
   */
  private buildConversationMessages(systemPrompt: string, history: IMessage[], userMessage: string): any[] {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 最新の会話履歴を追加（最大10件）
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === MessageSender.USER ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // 現在のユーザーメッセージを追加
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }
}

export default new ChatService();