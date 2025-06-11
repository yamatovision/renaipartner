import { Router } from 'express';
import { ImagesController } from './images.controller';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import { validateRequest } from '@/common/middlewares/validation.middleware';
import {
  validateAvatarGeneration,
  validateChatImageGeneration,
  validateBackgroundList,
  validateImageHistory,
  validateImageDeletion,
  validateImageStats,
} from './images.validator';

/**
 * 画像生成ルート定義
 * Leonardo AI連携によるアバター・チャット画像生成機能
 */
const router = Router();
const imagesController = new ImagesController();

// =============================================================================
// 公開エンドポイント（認証不要）
// =============================================================================

/**
 * GET /api/images/backgrounds
 * 背景画像一覧取得
 */
router.get(
  '/backgrounds',
  ...validateBackgroundList,
  imagesController.getBackgrounds
);

/**
 * GET /api/images/models
 * 利用可能な画像生成モデル一覧取得
 */
router.get(
  '/models',
  imagesController.getAvailableModels
);

// =============================================================================
// 認証必須エンドポイント
// =============================================================================

/**
 * POST /api/images/generate
 * アバター画像生成（API 7.1）
 */
router.post(
  '/generate',
  requireAuth,
  ...validateAvatarGeneration,
  validateRequest,
  imagesController.generateAvatar as any
);

/**
 * POST /api/images/generate-chat
 * チャット用画像生成（API 7.2）
 */
router.post(
  '/generate-chat',
  requireAuth,
  ...validateChatImageGeneration,
  validateRequest,
  imagesController.generateChatImage as any
);

/**
 * GET /api/images/history/:partnerId
 * パートナー別画像履歴取得
 */
router.get(
  '/history/:partnerId',
  requireAuth,
  ...validateImageHistory,
  validateRequest,
  imagesController.getImageHistory as any
);

/**
 * GET /api/images/stats/:partnerId
 * パートナー別画像統計取得
 */
router.get(
  '/stats/:partnerId',
  requireAuth,
  ...validateImageStats,
  validateRequest,
  imagesController.getImageStats as any
);

/**
 * DELETE /api/images/:imageId
 * 画像削除
 */
router.delete(
  '/:imageId',
  requireAuth,
  ...validateImageDeletion,
  validateRequest,
  imagesController.deleteImage as any
);

// =============================================================================
// エラーハンドリングミドルウェア
// =============================================================================

/**
 * 画像生成関連のエラーハンドリング
 */
router.use((error: Error, req: any, res: any, next: any) => {
  console.error('[画像生成ルート] エラー:', error);

  // レート制限エラー
  if (error.message.includes('rate limit') || error.message.includes('制限')) {
    return res.status(429).json({
      success: false,
      error: 'API呼び出し制限を超過しました。しばらく時間をおいてからお試しください',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  // Leonardo AIサービスエラー
  if (error.message.includes('Leonardo') || error.message.includes('画像生成サービス')) {
    return res.status(503).json({
      success: false,
      error: '画像生成サービスが一時的に利用できません',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // その他のエラー
  return res.status(500).json({
    success: false,
    error: '画像生成処理中にエラーが発生しました',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

export { router as imagesRoutes };