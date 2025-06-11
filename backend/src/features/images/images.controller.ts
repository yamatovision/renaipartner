import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ImagesService } from './images.service';
import type { 
  ImageGenerationRequest, 
  ID 
} from '@/types';
import type { AuthRequest } from '@/common/middlewares/auth.middleware';

/**
 * 画像生成コントローラー - Leonardo AI連携とパートナー一貫性保持
 */
export class ImagesController {
  private imagesService: ImagesService;

  constructor() {
    this.imagesService = new ImagesService();
  }

  /**
   * アバター画像生成 (POST /api/images/generate)
   */
  generateAvatar = async (req: Request, res: Response): Promise<void> => {
    try {

      const {
        partnerId,
        prompt,
        useAppearance = false,
        context,
        emotion,
        background,
        clothing,
        referenceImageId,
        modelId,
        width,
        height,
        guidanceScale,
        numImages,
      } = req.body;

      console.log(`[画像生成] アバター生成開始 - Partner: ${partnerId}, User: ${(req as any).user?.userId}`);

      // promptまたはuseAppearanceのいずれかが必要
      if (!prompt && !useAppearance) {
        res.status(400).json({
          success: false,
          error: 'プロンプトまたは外見設定の使用が必要です',
        });
        return;
      }

      // 画像生成リクエスト作成
      const generationRequest = {
        partnerId,
        prompt,
        useAppearance,
        context: context || '',
        emotion,
        background,
        clothing,
        referenceImageId,
        modelId,
        width,
        height,
        guidanceScale,
        numImages,
      };

      // 画像生成実行
      const generatedImage = await this.imagesService.generateAvatarImage(generationRequest);

      console.log(`[画像生成] アバター生成完了 - Image ID: ${generatedImage.id}, 一貫性スコア: ${generatedImage.consistencyScore}`);

      res.status(200).json({
        success: true,
        data: {
          imageId: generatedImage.id,
          imageUrl: generatedImage.imageUrl,
          consistencyScore: generatedImage.consistencyScore,
          prompt: generatedImage.prompt,
          context: generatedImage.context,
        },
      });

    } catch (error) {
      console.error('[画像生成] アバター生成エラー:', error);
      
      let errorMessage = '画像生成に失敗しました';
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('パートナーが見つかりません')) {
          errorMessage = 'パートナーが見つかりません';
          statusCode = 404;
        } else if (error.message.includes('API呼び出し制限')) {
          errorMessage = 'API呼び出し制限を超過しました。しばらく時間をおいてからお試しください';
          statusCode = 429;
        } else if (error.message.includes('Leonardo AI')) {
          errorMessage = '画像生成サービスでエラーが発生しました';
          statusCode = 503;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: 'IMAGE_GENERATION_FAILED',
      });
    }
  };

  /**
   * チャット用画像生成 (POST /api/images/generate-chat)
   */
  generateChatImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const {
        partnerId,
        message,
        emotion,
        situation,
        useReference = true,
      } = req.body;

      console.log(`[画像生成] チャット画像生成開始 - Partner: ${partnerId}, Message: "${message.substring(0, 50)}..."`);

      const generatedImage = await this.imagesService.generateChatImage(
        partnerId,
        message,
        emotion,
        situation,
        useReference
      );

      console.log(`[画像生成] チャット画像生成完了 - Image ID: ${generatedImage.id}`);

      res.status(201).json({
        success: true,
        data: {
          image: generatedImage,
          message: 'チャット用画像を生成しました',
        },
      });

    } catch (error) {
      console.error('[画像生成] チャット画像生成エラー:', error);
      
      let errorMessage = 'チャット画像生成に失敗しました';
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('パートナーが見つかりません')) {
          errorMessage = 'パートナーが見つかりません';
          statusCode = 404;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: 'CHAT_IMAGE_GENERATION_FAILED',
      });
    }
  };

  /**
   * 背景画像一覧取得 (GET /api/images/backgrounds)
   */
  getBackgrounds = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const category = req.query.category as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      console.log(`[画像生成] 背景画像一覧取得 - Category: ${category || 'all'}, Limit: ${limit}`);

      const backgrounds = await this.imagesService.getBackgroundImages(category, limit);

      res.status(200).json({
        success: true,
        data: {
          backgrounds,
          total: backgrounds.length,
          category,
        },
      });

    } catch (error) {
      console.error('[画像生成] 背景画像取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '背景画像の取得に失敗しました',
        code: 'BACKGROUND_FETCH_FAILED',
      });
    }
  };

  /**
   * 画像履歴取得 (GET /api/images/history/:partnerId)
   */
  getImageHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const partnerId = req.params.partnerId as ID;
      const limit = parseInt(req.query.limit as string) || 20;
      const minConsistency = req.query.minConsistency ? 
        parseFloat(req.query.minConsistency as string) : undefined;

      console.log(`[画像生成] 画像履歴取得 - Partner: ${partnerId}, Limit: ${limit}, MinConsistency: ${minConsistency}`);

      const images = await this.imagesService.getImageHistory(partnerId, limit, minConsistency);

      res.status(200).json({
        success: true,
        data: {
          images,
          total: images.length,
          partnerId,
          filters: {
            limit,
            minConsistency,
          },
        },
      });

    } catch (error) {
      console.error('[画像生成] 画像履歴取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '画像履歴の取得に失敗しました',
        code: 'IMAGE_HISTORY_FETCH_FAILED',
      });
    }
  };

  /**
   * 画像統計取得 (GET /api/images/stats/:partnerId)
   */
  getImageStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const partnerId = req.params.partnerId as ID;

      console.log(`[画像生成] 画像統計取得 - Partner: ${partnerId}`);

      const stats = await this.imagesService.getImageStats(partnerId);

      res.status(200).json({
        success: true,
        data: {
          stats,
          partnerId,
        },
      });

    } catch (error) {
      console.error('[画像生成] 画像統計取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: '画像統計の取得に失敗しました',
        code: 'IMAGE_STATS_FETCH_FAILED',
      });
    }
  };

  /**
   * 画像削除 (DELETE /api/images/:imageId)
   */
  deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const imageId = req.params.imageId as ID;

      console.log(`[画像生成] 画像削除 - Image ID: ${imageId}, User: ${req.user?.userId}`);

      await this.imagesService.deleteImage(imageId);

      console.log(`[画像生成] 画像削除完了 - Image ID: ${imageId}`);

      res.status(200).json({
        success: true,
        data: {
          message: '画像を削除しました',
          imageId,
        },
      });

    } catch (error) {
      console.error('[画像生成] 画像削除エラー:', error);
      
      let errorMessage = '画像の削除に失敗しました';
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('画像が見つかりません')) {
          errorMessage = '画像が見つかりません';
          statusCode = 404;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: 'IMAGE_DELETE_FAILED',
      });
    }
  };

  /**
   * 画像生成モデル一覧取得 (GET /api/images/models)
   */
  getAvailableModels = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[画像生成] 利用可能モデル一覧取得');

      // Leonardo AIで利用可能なアニメ風モデル一覧
      const models = [
        {
          id: 'leonardo-diffusion-xl',
          name: 'Leonardo Diffusion XL',
          description: '高品質なアニメスタイル画像生成に最適',
          category: 'anime',
          isDefault: true,
        },
        {
          id: 'anime-pastel-dream',
          name: 'Anime Pastel Dream',
          description: 'パステル調の美しいアニメ画像',
          category: 'anime',
          isDefault: false,
        },
        {
          id: 'absolute-reality',
          name: 'Absolute Reality',
          description: 'リアリスティックなアニメスタイル',
          category: 'anime',
          isDefault: false,
        },
      ];

      res.status(200).json({
        success: true,
        data: {
          models,
          total: models.length,
        },
      });

    } catch (error) {
      console.error('[画像生成] モデル一覧取得エラー:', error);
      
      res.status(500).json({
        success: false,
        error: 'モデル一覧の取得に失敗しました',
        code: 'MODELS_FETCH_FAILED',
      });
    }
  };
}