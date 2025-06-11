import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { requireAuth } from '../../common/middlewares/auth.middleware';
import { 
  validateSettingsUpdate,
  validateSettingsIntegrity,
} from './settings.validator';

const router = Router();

/**
 * 設定管理ルート
 * すべてのエンドポイントは認証が必要
 */

// ユーザー設定取得（統合版）
router.get(
  '/',
  requireAuth,
  SettingsController.getSettings
);

// ユーザー設定更新（統合版）
router.put(
  '/',
  requireAuth,
  ...validateSettingsUpdate(),
  validateSettingsIntegrity(),
  SettingsController.updateSettings
);

export const settingsRoutes = router;