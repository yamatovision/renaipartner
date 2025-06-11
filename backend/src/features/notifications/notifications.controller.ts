/**
 * 通知システム コントローラー
 * 通知設定とスケジューリングのHTTPエンドポイント処理
 */

import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '@/types';
import { NotificationsService } from './notifications.service';
import { NotificationSchedule } from '@/db/models/NotificationSchedule.model';

/**
 * 通知設定を取得（API 8.1）
 * GET /api/notifications/settings
 */
export const getNotificationSettings = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    console.log(`[NotificationsController] ユーザー ${userId} の通知設定取得リクエスト`);

    const settings = await NotificationsService.getUserNotificationSettings(userId);

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('[NotificationsController] 通知設定取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '通知設定の取得に失敗しました',
    });
  }
};

/**
 * 通知設定を更新（API 8.2）
 * PUT /api/notifications/settings
 */
export const updateNotificationSettings = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    const updates = req.body;
    
    console.log(`[NotificationsController] ユーザー ${userId} の通知設定更新リクエスト:`, updates);

    const updatedSettings = await NotificationsService.updateNotificationSettings(userId, updates);

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: '通知設定を更新しました',
    });
  } catch (error) {
    console.error('[NotificationsController] 通知設定更新エラー:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '通知設定の更新に失敗しました',
    });
  }
};

/**
 * 通知スケジュールを作成（API 8.3）
 * POST /api/notifications/schedule
 */
export const createNotificationSchedule = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    const scheduleData = req.body;
    
    console.log(`[NotificationsController] ユーザー ${userId} の通知スケジュール作成リクエスト:`, scheduleData);

    const schedule = await NotificationsService.createNotificationSchedule(userId, scheduleData);

    res.status(201).json({
      success: true,
      data: schedule,
      message: '通知スケジュールを作成しました',
    });
  } catch (error) {
    console.error('[NotificationsController] スケジュール作成エラー:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '通知スケジュールの作成に失敗しました',
    });
  }
};

/**
 * 通知統計情報を取得（管理者用）
 * GET /api/notifications/stats
 */
export const getNotificationStats = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 管理者権限チェック
    if (!req.user?.userId || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'この操作には管理者権限が必要です',
      });
      return;
    }

    console.log('[NotificationsController] 通知統計情報取得リクエスト');

    const stats = await NotificationsService.getNotificationStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[NotificationsController] 統計情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '通知統計の取得に失敗しました',
    });
  }
};

/**
 * ユーザーのスケジュール一覧を取得
 * GET /api/notifications/schedules
 */
export const getUserSchedules = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    const includeCompleted = req.query.includeCompleted === 'true';
    
    console.log(`[NotificationsController] ユーザー ${userId} のスケジュール一覧取得リクエスト`);

    const schedules = await NotificationSchedule.getUserSchedules(userId, includeCompleted);

    res.status(200).json({
      success: true,
      data: schedules.map(schedule => schedule.toJSON()),
      total: schedules.length,
    });
  } catch (error) {
    console.error('[NotificationsController] スケジュール一覧取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'スケジュール一覧の取得に失敗しました',
    });
  }
};

/**
 * スケジュールを削除（キャンセル）
 * DELETE /api/notifications/schedules/:scheduleId
 */
export const deleteSchedule = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    const { scheduleId } = req.params;
    
    console.log(`[NotificationsController] スケジュール ${scheduleId} の削除リクエスト`);

    // UUID形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(scheduleId)) {
      res.status(404).json({
        success: false,
        error: 'スケジュールが見つかりません',
      });
      return;
    }

    // スケジュールを取得
    const schedule = await NotificationSchedule.findByPk(scheduleId);
    
    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'スケジュールが見つかりません',
      });
      return;
    }

    // 所有者確認
    if (schedule.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'このスケジュールへのアクセス権がありません',
      });
      return;
    }

    // スケジュールをキャンセル
    await schedule.cancel();

    res.status(200).json({
      success: true,
      message: 'スケジュールをキャンセルしました',
    });
  } catch (error) {
    console.error('[NotificationsController] スケジュール削除エラー:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'スケジュールの削除に失敗しました',
    });
  }
};

/**
 * 通知設定をリセット
 * POST /api/notifications/settings/reset
 */
export const resetNotificationSettings = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    
    console.log(`[NotificationsController] ユーザー ${userId} の通知設定リセットリクエスト`);

    const resetSettings = await NotificationsService.resetNotificationSettings(userId);

    res.status(200).json({
      success: true,
      data: resetSettings,
      message: '通知設定をデフォルトに戻しました',
    });
  } catch (error) {
    console.error('[NotificationsController] 設定リセットエラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '通知設定のリセットに失敗しました',
    });
  }
};

/**
 * 通知設定の妥当性チェック
 * GET /api/notifications/settings/validate
 */
export const validateSettings = async (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: '認証が必要です',
      });
      return;
    }
    const userId = req.user.userId;
    
    console.log(`[NotificationsController] ユーザー ${userId} の通知設定検証リクエスト`);

    const validation = await NotificationsService.validateUserNotificationSettings(userId);

    res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('[NotificationsController] 設定検証エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '通知設定の検証に失敗しました',
    });
  }
};

export class NotificationsController {
  static getNotificationSettings = getNotificationSettings;
  static updateNotificationSettings = updateNotificationSettings;
  static resetNotificationSettings = resetNotificationSettings;
  static validateSettings = validateSettings;
  static createNotificationSchedule = createNotificationSchedule;
  static getUserSchedules = getUserSchedules;
  static deleteSchedule = deleteSchedule;
  static getNotificationStats = getNotificationStats;
}