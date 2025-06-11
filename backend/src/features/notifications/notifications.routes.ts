/**
 * 通知システム ルート定義
 * 通知設定とスケジューリングのAPIエンドポイント
 */

import { Router } from 'express';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import {
  validateGetNotificationSettings,
  validateUpdateNotificationSettings,
  validateCreateNotificationSchedule,
} from './notifications.validator';
import {
  getNotificationSettings,
  updateNotificationSettings,
  createNotificationSchedule,
  getNotificationStats,
  getUserSchedules,
  deleteSchedule,
  resetNotificationSettings,
  validateSettings,
} from './notifications.controller';

const router = Router();

// 全てのルートに認証ミドルウェアを適用
router.use(requireAuth);

/**
 * 通知設定関連のルート
 */
// GET /api/notifications/settings - 通知設定取得（API 8.1）
router.get(
  '/settings',
  getNotificationSettings
);

// PUT /api/notifications/settings - 通知設定更新（API 8.2）
router.put(
  '/settings',
  ...validateUpdateNotificationSettings,
  updateNotificationSettings
);

// POST /api/notifications/settings/reset - 通知設定リセット
router.post(
  '/settings/reset',
  resetNotificationSettings
);

// GET /api/notifications/settings/validate - 通知設定の妥当性チェック
router.get(
  '/settings/validate',
  validateSettings
);

/**
 * 通知スケジュール関連のルート
 */
// POST /api/notifications/schedule - 通知スケジュール作成（API 8.3）
router.post(
  '/schedule',
  ...validateCreateNotificationSchedule,
  createNotificationSchedule
);

// GET /api/notifications/schedules - ユーザーのスケジュール一覧取得
router.get(
  '/schedules',
  getUserSchedules
);

// DELETE /api/notifications/schedules/:scheduleId - スケジュール削除
router.delete(
  '/schedules/:scheduleId',
  deleteSchedule
);

/**
 * 管理者用ルート
 */
// GET /api/notifications/stats - 通知統計情報取得（管理者のみ）
router.get(
  '/stats',
  getNotificationStats
);

export default router;