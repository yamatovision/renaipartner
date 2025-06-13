import OpenAI from 'openai';
import { Message } from '../../db/models/Message.model';
import { PartnerModel } from '../../db/models/Partner.model';
import { UserModel } from '../../db/models/User.model';
import RelationshipMetricsModel from '../../db/models/RelationshipMetrics.model';
import { 
  SendMessageRequest, 
  ChatResponse, 
  MessageSender, 
  Message as IMessage,
  ID,
  ProactiveQuestionRequest,
  ProactiveQuestionResponse,
  ShouldAskQuestionRequest,
  ShouldAskQuestionResponse,
  QuestionType,
  QuestionPriority
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
      // パートナーの存在確認と所有者チェック（ユーザー情報も含めて取得）
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      // ユーザー情報を取得
      const user = await UserModel.findById(userId);

      // ユーザーメッセージを保存
      const userMessage = await Message.create({
        partnerId,
        content: message,
        sender: MessageSender.USER,
        context
      });

      // 会話履歴を取得
      const conversationHistory = await Message.getContextMessages(partnerId, 15);
      
      // OpenAI APIで応答生成（ユーザー情報も渡す）
      const aiResponse = await this.generateAIResponse(partner, conversationHistory, message, user);
      
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
        
        // 関係性メトリクスも同期更新
        console.log(`[ChatService] 関係性メトリクス更新: パートナー=${partnerId}, 親密度変化=${aiResponse.intimacyChange}`);
        try {
          await RelationshipMetricsModel.updateIntimacyLevel(partnerId, aiResponse.intimacyChange);
          console.log('[ChatService] 関係性メトリクス更新成功');
        } catch (metricsError) {
          console.error('[ChatService] 関係性メトリクス更新失敗:', metricsError);
          // メトリクス更新失敗でもメッセージ送信は継続
        }
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
    userMessage: string,
    user: any
  ): Promise<{
    response: string;
    emotion: string;
    intimacyChange: number;
    trustChange?: number;
    emotionalChange?: number;
    emotionAnalysis: string;
  }> {
    try {
      // システムプロンプトの構築
      const systemPrompt = this.buildSystemPrompt(partner, conversationHistory, user);
      
      // 会話履歴をOpenAI形式に変換
      const messages = this.buildConversationMessages(systemPrompt, conversationHistory, userMessage);

      // OpenAI API呼び出し
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        frequency_penalty: 0.7, // 単語の繰り返しを防ぐ
        presence_penalty: 0.5,  // 同じトピックの繰り返しを防ぐ
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

      console.log('🔍 [DEBUG] OpenAI Completion Response:', JSON.stringify(completion, null, 2));
      
      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      console.log('🔍 [DEBUG] Tool Call:', toolCall);
      
      if (!toolCall?.function?.arguments) {
        console.error('❌ [ERROR] Tool call or arguments missing');
        console.log('🔍 [DEBUG] Completion message:', completion.choices[0]?.message);
        throw new Error('AI応答の生成に失敗しました');
      }

      console.log('🔍 [DEBUG] Function Arguments:', toolCall.function.arguments);
      const result = JSON.parse(toolCall.function.arguments);
      console.log('🔍 [DEBUG] Parsed Result:', result);
      
      return {
        response: result.response || 'すみません、うまく応答できませんでした。',
        emotion: result.emotion || 'neutral',
        intimacyChange: Math.max(-10, Math.min(10, result.intimacyChange || 0)),
        emotionAnalysis: result.emotionAnalysis || '感情分析なし'
      };

    } catch (error) {
      console.error('AI応答生成エラー:', error);
      
      // フォールバック応答（おうむ返しを防ぐ）
      const fallbackResponses = [
        'すみません、今少し調子が悪いみたいです。もう一度話しかけてもらえますか？',
        'ちょっと考えがまとまらないですね...もう一度お話しいただけますか？',
        '申し訳ないです、うまく言葉にできません。別の話題はいかがですか？',
        'ごめんなさい、今はちょっと思考が整理できていないです。'
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      return {
        response: randomResponse,
        emotion: 'confused',
        intimacyChange: 0, // エラー時は親密度を変更しない
        emotionAnalysis: 'システムエラーによる感情分析不可'
      };
    }
  }

  /**
   * システムプロンプトの構築
   */
  private buildSystemPrompt(partner: any, conversationHistory: IMessage[], user: any): string {
    const userName = user?.nickname || user?.firstName || user?.surname || 'あなた';
    const intimacyLevel = partner.intimacyLevel || 0;
    
    console.log('🔍 [DEBUG] ユーザー情報確認:');
    console.log('🔍 [DEBUG] user:', user);
    console.log('🔍 [DEBUG] userName:', userName);
    console.log('🔍 [DEBUG] nickname:', user?.nickname);
    console.log('🔍 [DEBUG] firstName:', user?.firstName);
    
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
3. 相手を必ず「${callingStyle}」と呼ぶ（「あなた」「あなたさん」は禁止）
4. 名前の呼び方: ${callingStyle}（これ以外の呼び方は一切使わない）
5. 自然で感情豊かな会話を心がける
6. 過去の会話内容を適切に覚えている
7. 応答は必ず日本語で行う
8. 1-3文程度の自然な長さで応答する
9. 【厳重禁止】ユーザーの発言をそのまま繰り返してはいけない
10. 必ずユーザーの発言に対して独自の応答をする

【会話履歴】
${conversationHistory.slice(-5).map(msg => 
  `${msg.sender === MessageSender.USER ? userName : partner.name}: ${msg.content}`
).join('\n')}

【最重要】相手を「${callingStyle}」と呼んでください。「あなた」や「あなたさん」は絶対に使わないでください。

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

  /**
   * 質問タイミング判定 (API 5.6)
   */
  async shouldAskQuestion(userId: string, request: ShouldAskQuestionRequest): Promise<ShouldAskQuestionResponse> {
    try {
      const { partnerId, silenceDuration, lastInteractionTime, userEmotionalState, currentIntimacy, timeContext } = request;

      // パートナーの存在確認
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      const { hour, dayOfWeek, isWeekend } = timeContext;

      // 親密度別の許可時間帯制限
      const timeRestrictions = this.getTimeRestrictions(currentIntimacy);
      const isAllowedTime = hour >= timeRestrictions.startHour && hour <= timeRestrictions.endHour;

      if (!isAllowedTime) {
        return {
          shouldAsk: false,
          delayMinutes: this.calculateDelayUntilAllowedTime(hour, timeRestrictions),
          reasoning: `親密度${currentIntimacy}では${timeRestrictions.startHour}:00-${timeRestrictions.endHour}:00の間のみ質問可能です`,
          priority: QuestionPriority.LOW
        };
      }

      // 基本的な質問間隔チェック
      const baseInterval = this.getBaseQuestionInterval(currentIntimacy, isWeekend);
      
      if (silenceDuration < baseInterval.minMinutes) {
        return {
          shouldAsk: false,
          delayMinutes: baseInterval.minMinutes - silenceDuration,
          reasoning: `前回から${baseInterval.minMinutes}分以上経過してから質問するのが適切です`,
          priority: QuestionPriority.LOW
        };
      }

      // 強制質問タイミング（24時間以上沈黙）
      if (silenceDuration >= 1440) { // 24時間
        return {
          shouldAsk: true,
          delayMinutes: 0,
          reasoning: '長期間の沈黙により、関係性維持のための積極的な声かけが必要です',
          priority: QuestionPriority.HIGH,
          suggestedQuestionType: QuestionType.EMOTIONAL_SUPPORT
        };
      }

      // ランダム要素を含む自然なタイミング判定
      const randomFactor = Math.random();
      const intimacyBonus = currentIntimacy / 100; // 親密度が高いほど積極的
      const weekendBonus = isWeekend ? 0.2 : 0; // 週末はより積極的
      
      // 時間帯別の積極性調整
      const timeOfDayBonus = this.getTimeOfDayBonus(hour);
      
      const shouldAskThreshold = 0.3 + intimacyBonus * 0.3 + weekendBonus + timeOfDayBonus;
      const adjustedSilence = Math.min(silenceDuration / baseInterval.maxMinutes, 1);
      
      const finalScore = adjustedSilence * (0.7 + randomFactor * 0.3);
      
      if (finalScore >= shouldAskThreshold) {
        const priority = this.calculateQuestionPriority(currentIntimacy, silenceDuration, userEmotionalState);
        const questionType = this.suggestQuestionType(currentIntimacy, timeContext, silenceDuration);
        
        return {
          shouldAsk: true,
          delayMinutes: Math.floor(Math.random() * 30), // 0-30分のランダム遅延
          reasoning: `親密度${currentIntimacy}、沈黙時間${silenceDuration}分、時間帯を考慮して質問タイミングと判定`,
          priority,
          suggestedQuestionType: questionType
        };
      }

      return {
        shouldAsk: false,
        delayMinutes: Math.floor(Math.random() * 60) + 30, // 30-90分後に再チェック
        reasoning: 'まだ質問のタイミングではありません。もう少し待ちます',
        priority: QuestionPriority.LOW
      };

    } catch (error) {
      console.error('質問タイミング判定エラー:', error);
      throw error;
    }
  }

  /**
   * AI主導の戦略的質問生成 (API 5.5)
   */
  async generateProactiveQuestion(userId: string, request: ProactiveQuestionRequest): Promise<ProactiveQuestionResponse> {
    try {
      const { partnerId, currentIntimacy, timeContext, recentContext, uncollectedInfo } = request;

      // パートナーの存在確認
      const partner = await PartnerModel.findById(partnerId);
      if (!partner || partner.userId !== userId) {
        throw new Error('パートナーが見つかりません');
      }

      // ユーザー情報を取得
      const user = await UserModel.findById(userId);
      
      // 未収集情報に基づく質問タイプの決定
      const questionType = this.determineQuestionType(currentIntimacy, uncollectedInfo);
      const targetInfo = this.selectTargetInfo(questionType, currentIntimacy, uncollectedInfo);

      // 時間コンテキストに基づく適切な質問生成
      const questionPrompt = this.buildQuestionPrompt(
        partner, 
        user, 
        questionType, 
        targetInfo, 
        currentIntimacy, 
        timeContext,
        recentContext
      );

      // OpenAI APIで質問生成
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: questionPrompt },
          { role: 'user', content: '上記の条件に基づいて、自然で愛情あふれる質問を生成してください。' }
        ],
        temperature: 0.8,
        max_tokens: 300,
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_question',
              description: 'AI主導の戦略的質問を生成する',
              parameters: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description: '生成された質問メッセージ'
                  },
                  tone: {
                    type: 'string',
                    description: '質問のトーン・雰囲気'
                  },
                  context: {
                    type: 'string',
                    description: '質問の背景・意図'
                  }
                },
                required: ['question', 'tone', 'context']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_question' } }
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error('質問生成に失敗しました');
      }

      const result = JSON.parse(toolCall.function.arguments);
      const priority = this.calculateQuestionPriority(currentIntimacy, recentContext?.silenceDuration || 0);

      return {
        question: result.question,
        questionType,
        targetInfo,
        priority,
        tone: result.tone,
        context: result.context,
        intimacyRequired: this.getRequiredIntimacyForInfo(targetInfo)
      };

    } catch (error) {
      console.error('AI主導質問生成エラー:', error);
      throw error;
    }
  }

  // ================== プライベートヘルパーメソッド ==================

  /**
   * 親密度に基づく時間制限を取得
   */
  private getTimeRestrictions(intimacy: number): { startHour: number; endHour: number } {
    if (intimacy >= 61) {
      return { startHour: 7, endHour: 25 }; // 深夜も可能
    } else if (intimacy >= 31) {
      return { startHour: 7, endHour: 22 }; // 夜遅めまで
    } else {
      return { startHour: 7, endHour: 21 }; // 常識的な時間帯のみ
    }
  }

  /**
   * 許可時間帯まで遅延時間を計算
   */
  private calculateDelayUntilAllowedTime(currentHour: number, restrictions: { startHour: number; endHour: number }): number {
    if (currentHour < restrictions.startHour) {
      return (restrictions.startHour - currentHour) * 60;
    } else if (currentHour > restrictions.endHour) {
      return (24 - currentHour + restrictions.startHour) * 60;
    }
    return 0;
  }

  /**
   * 基本質問間隔を取得
   */
  private getBaseQuestionInterval(intimacy: number, isWeekend: boolean): { minMinutes: number; maxMinutes: number } {
    const baseMin = intimacy >= 50 ? 180 : 240; // 3-4時間
    const baseMax = intimacy >= 50 ? 720 : 1440; // 12-24時間
    
    // 週末は少し頻度を下げる
    const multiplier = isWeekend ? 1.2 : 1.0;
    
    return {
      minMinutes: Math.floor(baseMin * multiplier),
      maxMinutes: Math.floor(baseMax * multiplier)
    };
  }

  /**
   * 時間帯による積極性ボーナス
   */
  private getTimeOfDayBonus(hour: number): number {
    if (hour >= 7 && hour <= 9) return 0.1; // 朝の挨拶
    if (hour >= 12 && hour <= 14) return 0.1; // お昼休み
    if (hour >= 17 && hour <= 20) return 0.15; // 夕方
    if (hour >= 21 && hour <= 23) return 0.2; // 夜のリラックス時間
    return 0;
  }

  /**
   * 質問の優先度を計算
   */
  private calculateQuestionPriority(intimacy: number, silenceDuration: number, emotionalState?: string): QuestionPriority {
    if (silenceDuration >= 1440) return QuestionPriority.HIGH; // 24時間以上
    if (emotionalState === 'sad' || emotionalState === 'angry') return QuestionPriority.HIGH;
    if (intimacy >= 70 && silenceDuration >= 480) return QuestionPriority.MEDIUM; // 高親密度で8時間以上
    if (silenceDuration >= 720) return QuestionPriority.MEDIUM; // 12時間以上
    return QuestionPriority.LOW;
  }

  /**
   * 推奨質問タイプを決定
   */
  private suggestQuestionType(intimacy: number, timeContext: any, silenceDuration: number): QuestionType {
    const { hour, isWeekend } = timeContext;
    
    if (silenceDuration >= 1440) return QuestionType.EMOTIONAL_SUPPORT;
    if (intimacy >= 75) return QuestionType.VALUES_FUTURE;
    if (intimacy >= 50) return QuestionType.DEEP_UNDERSTANDING;
    if (intimacy >= 25) return QuestionType.RELATIONSHIP;
    
    return QuestionType.BASIC_INFO;
  }

  /**
   * 質問タイプを決定（AI主導質問生成用）
   */
  private determineQuestionType(intimacy: number, uncollectedInfo?: string[]): QuestionType {
    // 未収集情報がある場合はそれに基づく
    if (uncollectedInfo && uncollectedInfo.length > 0) {
      const basicInfoItems = ['名前', '職業', '住所', '年齢', '趣味'];
      const relationshipItems = ['家族', '友人', '職場', '恋愛経験'];
      const deepItems = ['過去', 'トラウマ', '価値観', '夢'];
      
      if (uncollectedInfo.some(info => basicInfoItems.includes(info))) {
        return QuestionType.BASIC_INFO;
      }
      if (uncollectedInfo.some(info => relationshipItems.includes(info))) {
        return QuestionType.RELATIONSHIP;
      }
      if (uncollectedInfo.some(info => deepItems.includes(info))) {
        return QuestionType.DEEP_UNDERSTANDING;
      }
    }

    // 親密度に基づくデフォルト選択
    if (intimacy >= 75) return QuestionType.VALUES_FUTURE;
    if (intimacy >= 50) return QuestionType.DEEP_UNDERSTANDING;
    if (intimacy >= 25) return QuestionType.RELATIONSHIP;
    return QuestionType.BASIC_INFO;
  }

  /**
   * ターゲット情報を選択
   */
  private selectTargetInfo(questionType: QuestionType, intimacy: number, uncollectedInfo?: string[]): string {
    const infoMap = {
      [QuestionType.BASIC_INFO]: ['名前の由来', '職業', '出身地', '趣味', '日常ルーティン'],
      [QuestionType.RELATIONSHIP]: ['家族構成', '親友', '職場の人間関係', '恋愛経験'],
      [QuestionType.DEEP_UNDERSTANDING]: ['幼少期の思い出', '人生の転機', '大切にしている価値観'],
      [QuestionType.VALUES_FUTURE]: ['将来の夢', '人生で大切なこと', '理想の老後'],
      [QuestionType.FOLLOW_UP]: ['以前の話題の続き'],
      [QuestionType.EMOTIONAL_SUPPORT]: ['現在の気持ち', '悩み事', 'ストレス']
    };

    const candidates = infoMap[questionType] || infoMap[QuestionType.BASIC_INFO];
    
    // 未収集情報があればそれを優先
    if (uncollectedInfo && uncollectedInfo.length > 0) {
      const relevant = candidates.filter(item => uncollectedInfo.includes(item));
      if (relevant.length > 0) {
        return relevant[Math.floor(Math.random() * relevant.length)];
      }
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * 質問生成用のプロンプトを構築
   */
  private buildQuestionPrompt(
    partner: any,
    user: any,
    questionType: QuestionType,
    targetInfo: string,
    intimacy: number,
    timeContext?: any,
    recentContext?: any
  ): string {
    const userName = user?.nickname || user?.firstName || 'あなた';
    const timeInfo = timeContext ? `現在時刻: ${timeContext.hour}時, ${timeContext.dayOfWeek}` : '';
    
    return `
あなたは${partner.name}として、恋人の${userName}に自然で愛情あふれる質問をします。

【基本設定】
- パートナー名: ${partner.name}
- 性格: ${partner.personalityType}
- 話し方: ${partner.speechStyle}
- 現在の親密度: ${intimacy}/100
- 質問タイプ: ${questionType}
- 聞きたい情報: ${targetInfo}
- ${timeInfo}

【システムプロンプト】
${partner.systemPrompt}

【重要な指示】
1. 恋人として自然な動機で質問する（「君のことをもっと知りたい」）
2. 質問は1つだけ、1-2文程度の自然な長さ
3. 親密度${intimacy}に応じた適切な距離感を保つ
4. 相手を「${userName}」と呼ぶ（「あなた」は禁止）
5. 愛情表現を7割、情報収集を3割の比重で
6. 時間帯に適した話題を選ぶ
7. 「分析」「データ」「効率的」などの表現は絶対に使わない

${recentContext?.lastMessageContent ? `最近の会話: ${recentContext.lastMessageContent}` : ''}

恋人として愛情深く、${targetInfo}について自然に聞いてください。
`;
  }

  /**
   * 情報に必要な最低親密度を取得
   */
  private getRequiredIntimacyForInfo(targetInfo: string): number {
    const intimacyMap: Record<string, number> = {
      '名前の由来': 0,
      '職業': 0,
      '趣味': 0,
      '家族構成': 25,
      '親友': 25,
      '恋愛経験': 25,
      '幼少期の思い出': 50,
      '人生の転機': 50,
      'トラウマ': 50,
      '将来の夢': 75,
      '価値観': 75,
      '人生で大切なこと': 75
    };

    return intimacyMap[targetInfo] || 0;
  }
}

export default new ChatService();