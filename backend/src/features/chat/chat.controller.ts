import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ChatService from './chat.service';
import { AuthRequest } from '../../common/middlewares/auth.middleware';
import { 
  SendMessageRequest, 
  ApiResponse, 
  ChatResponse,
  ProactiveQuestionRequest,
  ProactiveQuestionResponse,
  ShouldAskQuestionRequest,
  ShouldAskQuestionResponse
} from '../../types';
import { ImagesService } from '../images/images.service';

export class ChatController {
  private imagesService: ImagesService;

  constructor() {
    console.log('[ChatController] コンストラクタ実行中...');
    this.imagesService = new ImagesService();
    console.log('[ChatController] ImagesService初期化完了');
  }
  /**
   * メッセージ送信
   * POST /api/chat/messages
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const messageRequest: SendMessageRequest = {
        message: req.body.message,
        partnerId: req.body.partnerId,
        context: req.body.context
      };

      console.log(`[${new Date().toISOString()}] ▶️ メッセージ送信開始 - ユーザー: ${userId}, パートナー: ${messageRequest.partnerId}`);

      const response = await ChatService.sendMessage(userId, messageRequest);

      console.log(`[${new Date().toISOString()}] ✅ メッセージ送信完了 - 親密度: ${response.intimacyLevel}, 感情: ${response.emotion}`);

      res.status(200).json({
        success: true,
        data: response
      } as ApiResponse<ChatResponse>);

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ メッセージ送信エラー:`, error);
      
      const statusCode = error.message.includes('見つかりません') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || 'メッセージの送信に失敗しました'
      });
    }
  }

  /**
   * メッセージ履歴取得
   * GET /api/chat/messages?partnerId=xxx&limit=20&offset=0
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const partnerId = req.query.partnerId as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      console.log(`[${new Date().toISOString()}] ▶️ メッセージ履歴取得開始 - パートナー: ${partnerId}, 範囲: ${limit}件(${offset}から)`);

      const result = await ChatService.getMessages(userId, partnerId, limit, offset, startDate, endDate);

      console.log(`[${new Date().toISOString()}] ✅ メッセージ履歴取得完了 - 取得件数: ${result.messages.length}/${result.total}件`);

      res.status(200).json({
        success: true,
        data: {
          messages: result.messages,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore: offset + limit < result.total
          }
        }
      });

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ メッセージ履歴取得エラー:`, error);
      
      const statusCode = error.message.includes('見つかりません') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || 'メッセージ履歴の取得に失敗しました'
      });
    }
  }

  /**
   * タイピング状態通知
   * POST /api/chat/typing
   */
  async handleTyping(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const partnerId = req.body.partnerId;
      const isTyping = req.body.isTyping;
      const message = req.body.message;

      console.log(`[${new Date().toISOString()}] ▶️ タイピング状態更新 - パートナー: ${partnerId}, 状態: ${isTyping ? '入力中' : '停止'}`);

      await ChatService.handleTyping(userId, partnerId, isTyping, message);

      console.log(`[${new Date().toISOString()}] ✅ タイピング状態更新完了`);

      res.status(200).json({
        success: true,
        data: {
          partnerId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ タイピング状態更新エラー:`, error);
      
      const statusCode = error.message.includes('見つかりません') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || 'タイピング状態の更新に失敗しました'
      });
    }
  }

  /**
   * 感情状態取得
   * GET /api/chat/emotion?partnerId=xxx
   */
  async getEmotion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const partnerId = req.query.partnerId as string;

      console.log(`[${new Date().toISOString()}] ▶️ 感情状態取得開始 - パートナー: ${partnerId}`);

      const result = await ChatService.getEmotion(userId, partnerId);

      console.log(`[${new Date().toISOString()}] ✅ 感情状態取得完了 - 感情: ${result.emotion}, 親密度: ${result.intimacyLevel}`);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ 感情状態取得エラー:`, error);
      
      const statusCode = error.message.includes('見つかりません') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || '感情状態の取得に失敗しました'
      });
    }
  }

  /**
   * 画像生成
   * POST /api/chat/generate-image
   */
  generateImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const {
        partnerId,
        message,
        emotion,
        situation,
        useReference = true,
        context
      } = req.body;

      console.log(`[${new Date().toISOString()}] ▶️ 画像生成リクエスト - パートナー: ${partnerId}`);
      console.log(`[${new Date().toISOString()}] 💬 メッセージ: ${message}`);
      console.log(`[${new Date().toISOString()}] 😊 感情: ${emotion || 'なし'}`);
      console.log(`[${new Date().toISOString()}] 📍 状況: ${situation || 'なし'}`);

      // 実際の画像生成サービスを呼び出す
      const generatedImage = await this.imagesService.generateChatImage(
        partnerId,
        message || context || '愛してるよ💕',
        emotion,
        situation,
        useReference
      );

      console.log(`[${new Date().toISOString()}] ✅ 画像生成完了 - ID: ${generatedImage.id}`);
      console.log(`[${new Date().toISOString()}] 🖼️ 画像URL: ${generatedImage.imageUrl}`);
      console.log(`[${new Date().toISOString()}] 📊 一貫性スコア: ${generatedImage.consistencyScore}`);

      res.status(200).json({
        success: true,
        data: {
          imageUrl: generatedImage.imageUrl,
          prompt: generatedImage.prompt,
          consistencyScore: generatedImage.consistencyScore,
          generatedAt: generatedImage.createdAt,
          imageId: generatedImage.id,
          metadata: generatedImage.metadata
        }
      });

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ 画像生成エラー:`, error);
      console.error(`[${new Date().toISOString()}] 🔍 エラー詳細:`, error.stack || error);
      
      let statusCode = 500;
      let errorMessage = '画像生成に失敗しました';

      if (error.message.includes('パートナーが見つかりません')) {
        statusCode = 404;
        errorMessage = 'パートナーが見つかりません';
      } else if (error.message.includes('API呼び出し制限')) {
        statusCode = 429;
        errorMessage = 'API呼び出し制限を超過しました。しばらく時間をおいてからお試しください';
      } else if (error.message.includes('Leonardo AI')) {
        statusCode = 503;
        errorMessage = `画像生成サービスでエラーが発生しました: ${error.message}`;
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: error.message
      });
    }
  }

  /**
   * パフォーマンス統計取得（デバッグ用）
   * GET /api/chat/stats?partnerId=xxx
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const partnerId = req.query.partnerId as string;

      if (!partnerId) {
        res.status(400).json({
          success: false,
          error: 'パートナーIDが必要です'
        });
        return;
      }

      console.log(`[${new Date().toISOString()}] ▶️ チャット統計取得開始 - パートナー: ${partnerId}`);

      // 基本統計の取得
      const stats = {
        partnerId,
        totalMessages: await ChatService.getMessages(userId, partnerId, 1, 0).then(r => r.total),
        lastMessageTime: new Date().toISOString(),
        averageResponseTime: '2.3秒', // プレースホルダー
        conversationStartedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日前
        intimacyProgression: [
          { date: '2025-01-04', level: 0 },
          { date: '2025-01-11', level: 45 }
        ]
      };

      console.log(`[${new Date().toISOString()}] ✅ チャット統計取得完了 - 総メッセージ数: ${stats.totalMessages}`);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ チャット統計取得エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'チャット統計の取得に失敗しました'
      });
    }
  }

  /**
   * 質問タイミング判定 (API 5.6)
   * GET /api/chat/should-ask-question
   */
  async shouldAskQuestion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      
      // クエリパラメータから必要な情報を抽出
      const request: ShouldAskQuestionRequest = {
        partnerId: req.query.partnerId as string,
        silenceDuration: parseInt(req.query.silenceDuration as string),
        currentIntimacy: parseInt(req.query.currentIntimacy as string),
        timeContext: {
          hour: parseInt(req.query['timeContext.hour'] as string),
          dayOfWeek: req.query['timeContext.dayOfWeek'] as string,
          isWeekend: req.query['timeContext.isWeekend'] === 'true'
        },
        lastInteractionTime: req.query.lastInteractionTime ? new Date(req.query.lastInteractionTime as string) : undefined,
        userEmotionalState: req.query.userEmotionalState as string | undefined
      };

      console.log(`[${new Date().toISOString()}] ▶️ 質問タイミング判定開始 - パートナー: ${request.partnerId}, 沈黙: ${request.silenceDuration}分`);

      const result = await ChatService.shouldAskQuestion(userId, request);

      console.log(`[${new Date().toISOString()}] ✅ 質問タイミング判定完了 - 判定: ${result.shouldAsk ? '質問すべき' : '待機'}, 理由: ${result.reasoning}`);

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse<ShouldAskQuestionResponse>);

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ 質問タイミング判定エラー:`, error);
      
      const statusCode = error.message.includes('見つかりません') ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || '質問タイミング判定に失敗しました'
      });
    }
  }

  /**
   * AI主導の戦略的質問生成 (API 5.5)
   * POST /api/chat/proactive-question
   */
  async generateProactiveQuestion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const request: ProactiveQuestionRequest = {
        partnerId: req.body.partnerId,
        currentIntimacy: req.body.currentIntimacy,
        timeContext: req.body.timeContext,
        recentContext: req.body.recentContext,
        uncollectedInfo: req.body.uncollectedInfo
      };

      console.log(`[${new Date().toISOString()}] ▶️ AI主導質問生成開始 - パートナー: ${request.partnerId}, 親密度: ${request.currentIntimacy}`);

      const result = await ChatService.generateProactiveQuestion(userId, request);

      console.log(`[${new Date().toISOString()}] ✅ AI主導質問生成完了 - 質問タイプ: ${result.questionType}, 対象情報: ${result.targetInfo}`);

      res.status(200).json({
        success: true,
        data: result
      } as ApiResponse<ProactiveQuestionResponse>);

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ AI主導質問生成エラー:`, error);
      
      const statusCode = error.message.includes('見つかりません') ? 404 : 
                        error.message.includes('OpenAI') ? 503 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: error.message || 'AI主導質問生成に失敗しました'
      });
    }
  }
}

const chatController = new ChatController();
export default chatController;