import { Router } from 'express';
import { PartnersController } from './partners.controller';
import { requireAuth, requireAdmin } from '@/common/middlewares/auth.middleware';

const router = Router();

// ヘルスチェック（認証不要）
router.get('/health', PartnersController.healthCheck);

// パートナー存在チェック（認証必要）
router.get('/exists', requireAuth, PartnersController.checkPartnerExists);

// パートナー情報取得（認証必要）- API 3.2
router.get('/', requireAuth, PartnersController.getPartners);

// パートナー作成（認証必要）- API 3.1
router.post('/', requireAuth, PartnersController.createPartner);

// プロンプト検証（認証必要）- API 3.5
router.post('/validate-prompt', requireAuth, PartnersController.validatePrompt);

// プロンプトプレビュー（認証必要）- API 3.6
router.post('/preview', requireAuth, PartnersController.previewPrompt);

// パートナー統計取得（管理者認証必要）
router.get('/stats', requireAdmin, PartnersController.getPartnerStats);

// パートナー詳細取得（認証必要）- API 3.3
router.get('/:id', requireAuth, PartnersController.getPartnerById);

// パートナー更新（認証必要）- API 3.4
router.put('/:id', requireAuth, PartnersController.updatePartner);

// パートナー削除（認証必要）
router.delete('/:id', requireAuth, PartnersController.deletePartner);

// プリセット適用（認証必要）
router.post('/:id/apply-preset', requireAuth, PartnersController.applyPreset);

// 親密度更新（認証必要）
router.patch('/:id/intimacy', requireAuth, PartnersController.updateIntimacy);

export default router;