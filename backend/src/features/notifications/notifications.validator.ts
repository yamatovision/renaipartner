/**
 * 通知システム バリデーション
 * 通知設定、スケジューリングのデータ検証
 */

import { body, param, ValidationChain } from 'express-validator';
import { NotificationSetting } from '@/db/models/NotificationSetting.model';

/**
 * 通知設定取得用バリデーション
 */
export const validateGetNotificationSettings: ValidationChain[] = [
  // 特別なバリデーションは不要（認証済みユーザーのIDを使用）
];

/**
 * 通知設定更新用バリデーション
 */
export const validateUpdateNotificationSettings: ValidationChain[] = [
  body('morningGreeting')
    .optional()
    .isBoolean()
    .withMessage('朝の挨拶設定は true または false である必要があります'),

  body('morningTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('朝の時刻は HH:MM 形式で入力してください（例: 07:30）')
    .custom((value) => {
      if (value && !NotificationSetting.validateTimeFormat(value)) {
        throw new Error('無効な時刻形式です');
      }
      return true;
    }),

  body('reminderMessages')
    .optional()
    .isBoolean()
    .withMessage('リマインダーメッセージ設定は true または false である必要があります'),

  body('specialDays')
    .optional()
    .isBoolean()
    .withMessage('特別な日の通知設定は true または false である必要があります'),

  // 不正なフィールドのチェック（空のリクエストを許可）
  body()
    .custom((value, { req }) => {
      const allowedFields = ['morningGreeting', 'morningTime', 'reminderMessages', 'specialDays'];
      const receivedFields = Object.keys(req.body);
      const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        throw new Error(`無効なフィールドが含まれています: ${invalidFields.join(', ')}`);
      }
      
      // 部分更新を許可：少なくとも1つの有効なフィールドがあればOK
      return true;
    }),
];

/**
 * 通知スケジュール作成用バリデーション
 */
export const validateCreateNotificationSchedule: ValidationChain[] = [
  body('type')
    .notEmpty()
    .withMessage('通知タイプは必須です')
    .isIn(['morning_greeting', 'reminder', 'special_day', 'custom'])
    .withMessage('有効な通知タイプを指定してください'),

  body('scheduledTime')
    .notEmpty()
    .withMessage('スケジュール時刻は必須です')
    .custom((value) => {
      // Unix timestamp、ISO 8601文字列、HH:MM形式をサポート
      if (typeof value === 'number') {
        // Unix timestamp
        if (value < Date.now() / 1000) {
          throw new Error('スケジュール時刻は未来の時刻である必要があります');
        }
      } else if (typeof value === 'string') {
        if (value.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
          // HH:MM形式（今日または明日の指定時刻）
          return true;
        } else {
          // ISO 8601形式
          const scheduledDate = new Date(value);
          if (isNaN(scheduledDate.getTime())) {
            throw new Error('無効な日時形式です');
          }
          if (scheduledDate.getTime() < Date.now()) {
            throw new Error('スケジュール時刻は未来の時刻である必要があります');
          }
        }
      } else {
        throw new Error('スケジュール時刻は文字列または数値である必要があります');
      }
      return true;
    }),

  body('message')
    .optional()
    .isString()
    .withMessage('メッセージは文字列である必要があります')
    .isLength({ min: 1, max: 500 })
    .withMessage('メッセージは1文字以上500文字以下である必要があります'),

  body('partnerId')
    .optional()
    .isUUID()
    .withMessage('パートナーIDは有効なUUID形式である必要があります'),

  body('recurring')
    .optional()
    .isBoolean()
    .withMessage('繰り返し設定は true または false である必要があります'),

  body('recurringPattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('繰り返しパターンは daily, weekly, monthly のいずれかである必要があります')
    .custom((value, { req }) => {
      if (value && !req.body.recurring) {
        throw new Error('繰り返しパターンを設定する場合は recurring を true にしてください');
      }
      return true;
    }),
];

/**
 * 時刻形式の検証ヘルパー
 */
export const validateTimeFormat = (time: string): boolean => {
  return NotificationSetting.validateTimeFormat(time);
};

/**
 * 通知設定のビジネスロジック検証
 */
export const validateNotificationBusinessRules = {
  /**
   * 朝の挨拶時刻の妥当性チェック
   */
  validateMorningTime: (time: string): { isValid: boolean; message?: string } => {
    // 時刻が空や未定義の場合はスキップ
    if (!time) {
      return { isValid: true };
    }

    if (!validateTimeFormat(time)) {
      return { isValid: false, message: '時刻形式が正しくありません' };
    }

    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    // 朝の挨拶は4:00-12:00の範囲が妥当
    if (timeInMinutes < 4 * 60 || timeInMinutes > 12 * 60) {
      return { 
        isValid: false, 
        message: '朝の挨拶時刻は4:00から12:00の間で設定してください' 
      };
    }

    return { isValid: true };
  },

  /**
   * 通知頻度の制限チェック
   */
  validateNotificationFrequency: (settings: any): { isValid: boolean; message?: string } => {
    let activeNotifications = 0;
    
    if (settings.morningGreeting) activeNotifications++;
    if (settings.reminderMessages) activeNotifications++;
    if (settings.specialDays) activeNotifications++;

    // 実用的な制限（必要に応じて調整）
    if (activeNotifications === 0) {
      return { 
        isValid: false, 
        message: '少なくとも1つの通知を有効にしてください' 
      };
    }

    return { isValid: true };
  },

  /**
   * 設定の一貫性チェック
   */
  validateSettingsConsistency: (settings: any): { isValid: boolean; message?: string } => {
    // 朝の挨拶を有効にする場合は時刻も必須
    if (settings.morningGreeting && !settings.morningTime) {
      return { 
        isValid: false, 
        message: '朝の挨拶を有効にする場合は時刻の設定が必要です' 
      };
    }

    return { isValid: true };
  },
};

/**
 * 通知設定更新の完全バリデーション
 */
export const validateCompleteNotificationUpdate = (settings: any): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 朝の時刻の検証
  if (settings.morningTime) {
    const timeValidation = validateNotificationBusinessRules.validateMorningTime(settings.morningTime);
    if (!timeValidation.isValid) {
      errors.push(timeValidation.message!);
    }
  }

  // 設定の一貫性検証
  const consistencyValidation = validateNotificationBusinessRules.validateSettingsConsistency(settings);
  if (!consistencyValidation.isValid) {
    errors.push(consistencyValidation.message!);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * スケジュール作成の詳細バリデーション
 */
export const validateScheduleCreation = (scheduleData: any): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 朝の挨拶の特別検証
  if (scheduleData.type === 'morning_greeting') {
    if (!scheduleData.partnerId) {
      errors.push('朝の挨拶通知にはパートナーIDが必要です');
    }
    
    // 時刻の妥当性
    if (typeof scheduleData.scheduledTime === 'string' && scheduleData.scheduledTime.includes(':')) {
      const timeValidation = validateNotificationBusinessRules.validateMorningTime(scheduleData.scheduledTime);
      if (!timeValidation.isValid) {
        errors.push(timeValidation.message!);
      }
    }
  }

  // カスタム通知の場合はメッセージが必要
  if (scheduleData.type === 'custom' && !scheduleData.message) {
    errors.push('カスタム通知にはメッセージが必要です');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 共通バリデーションヘルパー
 */
export const notificationValidationHelpers = {
  /**
   * 時刻文字列を標準化
   */
  normalizeTimeString: (time: string): string => {
    if (!time || !validateTimeFormat(time)) {
      throw new Error('無効な時刻形式です');
    }
    
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  },

  /**
   * 現在時刻と比較して次の発生時刻を計算
   */
  getNextOccurrence: (time: string, timezone = 'Asia/Tokyo'): Date => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const nextOccurrence = new Date(now);
    nextOccurrence.setHours(hours, minutes, 0, 0);
    
    // 指定時刻が過去の場合は翌日にする
    if (nextOccurrence <= now) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }
    
    return nextOccurrence;
  },

  /**
   * 通知設定のサマリー作成
   */
  createSettingsSummary: (settings: any): string => {
    const enabledFeatures: string[] = [];
    
    if (settings.morningGreeting) {
      enabledFeatures.push(`朝の挨拶(${settings.morningTime})`);
    }
    if (settings.reminderMessages) {
      enabledFeatures.push('リマインダーメッセージ');
    }
    if (settings.specialDays) {
      enabledFeatures.push('特別な日の通知');
    }
    
    return enabledFeatures.length > 0 
      ? `有効: ${enabledFeatures.join(', ')}` 
      : '通知は無効です';
  },
};