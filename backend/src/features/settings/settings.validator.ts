/**
 * 設定管理バリデータ
 * ユーザー設定と通知設定のバリデーションルール
 */

import { body, ValidationChain } from 'express-validator';
import UserSettingModel from '@/db/models/UserSetting.model';
import { NotificationSetting } from '@/db/models/NotificationSetting.model';

// =============================================================================
// 設定更新バリデーション
// =============================================================================

export const validateSettingsUpdate = (): ValidationChain[] => [
  // 通知設定バリデーション
  body('notifications.morningGreeting')
    .optional()
    .isBoolean()
    .withMessage('朝の挨拶設定はboolean値である必要があります'),

  body('notifications.morningTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('朝の時刻はHH:MM形式で入力してください（例: 07:30）')
    .custom((value: string) => {
      if (!NotificationSetting.validateTimeFormat(value)) {
        throw new Error('無効な時刻形式です');
      }
      return true;
    }),

  body('notifications.reminderMessages')
    .optional()
    .isBoolean()
    .withMessage('リマインダーメッセージ設定はboolean値である必要があります'),

  body('notifications.specialDays')
    .optional()
    .isBoolean()
    .withMessage('特別な日の通知設定はboolean値である必要があります'),

  // ユーザー設定バリデーション
  body('userSettings.theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('テーマはlight、dark、autoのいずれかを選択してください')
    .custom((value: string) => {
      if (!UserSettingModel.validateTheme(value)) {
        throw new Error('無効なテーマ設定です');
      }
      return true;
    }),

  body('userSettings.backgroundImage')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('背景画像設定は1〜100文字で入力してください'),

  body('userSettings.soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('音響設定はboolean値である必要があります'),

  body('userSettings.autoSave')
    .optional()
    .isBoolean()
    .withMessage('自動保存設定はboolean値である必要があります'),

  body('userSettings.dataRetentionDays')
    .optional()
    .isInt({ min: 30, max: 9999 })
    .withMessage('データ保持期間は30〜9999日の範囲で設定してください')
    .custom((value: number) => {
      if (!UserSettingModel.validateRetentionDays(value)) {
        throw new Error('データ保持期間が無効です');
      }
      return true;
    }),
];

// =============================================================================
// 通知設定専用バリデーション
// =============================================================================

export const validateNotificationSettings = (): ValidationChain[] => [
  body('morningGreeting')
    .optional()
    .isBoolean()
    .withMessage('朝の挨拶設定はboolean値である必要があります'),

  body('morningTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('朝の時刻はHH:MM形式で入力してください（例: 07:30）')
    .custom((value: string) => {
      return NotificationSetting.validateTimeFormat(value);
    }),

  body('reminderMessages')
    .optional()
    .isBoolean()
    .withMessage('リマインダーメッセージ設定はboolean値である必要があります'),

  body('specialDays')
    .optional()
    .isBoolean()
    .withMessage('特別な日の通知設定はboolean値である必要があります'),
];

// =============================================================================
// ユーザー設定専用バリデーション
// =============================================================================

export const validateUserSettings = (): ValidationChain[] => [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('テーマはlight、dark、autoのいずれかを選択してください'),

  body('backgroundImage')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('背景画像設定は1〜100文字で入力してください'),

  body('soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('音響設定はboolean値である必要があります'),

  body('autoSave')
    .optional()
    .isBoolean()
    .withMessage('自動保存設定はboolean値である必要があります'),

  body('dataRetentionDays')
    .optional()
    .isInt({ min: 30, max: 9999 })
    .withMessage('データ保持期間は30〜9999日の範囲で設定してください'),
];

// =============================================================================
// 背景画像プリセットバリデーション
// =============================================================================

export const validateBackgroundPreset = (): ValidationChain[] => [
  body('category')
    .optional()
    .isIn(['nature', 'indoor', 'fantasy', 'modern', 'romantic', 'abstract', 'minimal'])
    .withMessage('背景カテゴリが無効です'),

  body('style')
    .optional()
    .isIn(['anime', 'realistic', 'watercolor', 'digital'])
    .withMessage('背景スタイルが無効です'),
];

// =============================================================================
// 設定検証ヘルパー関数
// =============================================================================

/**
 * 設定値の妥当性をチェック
 */
export const validateSettingsValues = {
  /**
   * 朝の時刻フォーマット検証
   */
  morningTime: (time: string): boolean => {
    return NotificationSetting.validateTimeFormat(time);
  },

  /**
   * テーマ設定検証
   */
  theme: (theme: string): boolean => {
    return UserSettingModel.validateTheme(theme);
  },

  /**
   * データ保持期間検証
   */
  dataRetentionDays: (days: number): boolean => {
    return UserSettingModel.validateRetentionDays(days);
  },

  /**
   * 背景画像設定検証
   */
  backgroundImage: (image: string): boolean => {
    return typeof image === 'string' && image.length >= 1 && image.length <= 100;
  },

  /**
   * 通知設定の整合性チェック
   */
  notificationConsistency: (settings: {
    morningGreeting?: boolean;
    morningTime?: string;
  }): { valid: boolean; message?: string } => {
    // 朝の挨拶が有効なら時刻も必須
    if (settings.morningGreeting === true && !settings.morningTime) {
      return {
        valid: false,
        message: '朝の挨拶を有効にする場合は、通知時刻の設定が必要です',
      };
    }

    // 時刻が設定されているなら妥当性チェック
    if (settings.morningTime && !NotificationSetting.validateTimeFormat(settings.morningTime)) {
      return {
        valid: false,
        message: '朝の通知時刻の形式が無効です（HH:MM形式で入力してください）',
      };
    }

    return { valid: true };
  },
};

// =============================================================================
// カスタムバリデーションミドルウェア
// =============================================================================

/**
 * 設定更新時の統合バリデーション
 */
export const validateSettingsIntegrity = () => {
  return (req: any, res: any, next: any) => {
    const { notifications, userSettings } = req.body;

    // 通知設定の整合性チェック
    if (notifications) {
      const consistencyCheck = validateSettingsValues.notificationConsistency(notifications);
      if (!consistencyCheck.valid) {
        return res.status(400).json({
          success: false,
          error: '設定値に問題があります',
          message: consistencyCheck.message,
          code: 'VALIDATION_ERROR',
        });
      }
    }

    // データ保持期間の警告チェック
    if (userSettings?.dataRetentionDays && userSettings.dataRetentionDays < 365) {
      req.settingsWarnings = req.settingsWarnings || [];
      req.settingsWarnings.push(
        `データ保持期間が${userSettings.dataRetentionDays}日に設定されています。1年未満の設定では重要な会話履歴が失われる可能性があります。`
      );
    }

    next();
  };
};

// =============================================================================
// エラーレスポンス生成ヘルパー
// =============================================================================

/**
 * バリデーションエラーメッセージを日本語で整形
 */
export const formatValidationErrors = (errors: any[]): string[] => {
  return errors.map((error: any) => {
    const field = error.path || error.param;
    const message = error.msg;

    // フィールド名を日本語に変換
    const fieldNames: Record<string, string> = {
      'notifications.morningGreeting': '朝の挨拶設定',
      'notifications.morningTime': '朝の通知時刻',
      'notifications.reminderMessages': 'リマインダー設定',
      'notifications.specialDays': '特別な日の通知設定',
      'userSettings.theme': 'テーマ設定',
      'userSettings.backgroundImage': '背景画像設定',
      'userSettings.soundEnabled': '音響設定',
      'userSettings.autoSave': '自動保存設定',
      'userSettings.dataRetentionDays': 'データ保持期間',
    };

    const fieldName = fieldNames[field] || field;
    return `${fieldName}: ${message}`;
  });
};

/**
 * 設定バリデーション結果の統一エラーレスポンス
 */
export const createSettingsValidationErrorResponse = (errors: any[]) => {
  const formattedErrors = formatValidationErrors(errors);
  
  return {
    success: false,
    error: '設定データが無効です',
    message: '入力内容を確認してください',
    code: 'SETTINGS_VALIDATION_ERROR',
    validationErrors: formattedErrors,
    details: {
      errorCount: errors.length,
      timestamp: new Date().toISOString(),
    },
  };
};