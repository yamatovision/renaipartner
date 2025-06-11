/**
 * 通知システム サービス
 * 通知設定の管理、スケジューリング機能
 */

import { NotificationSetting } from '@/db/models/NotificationSetting.model';
import { NotificationSchedule } from '@/db/models/NotificationSchedule.model';
import PartnerModel from '@/db/models/Partner.model';
import { NotificationSettings, ID, Partner as IPartner, NotificationScheduleResponse } from '@/types';
import { 
  validateCompleteNotificationUpdate, 
  validateScheduleCreation,
  notificationValidationHelpers 
} from './notifications.validator';

/**
 * 通知サービス実装
 */
export class NotificationsService {
  /**
   * ユーザーの通知設定を取得
   */
  public static async getUserNotificationSettings(userId: ID): Promise<NotificationSettings> {
    try {
      console.log(`[NotificationsService] ユーザー ${userId} の通知設定を取得中`);
      
      const settings = await NotificationSetting.getOrCreateUserSettings(userId);
      
      console.log(`[NotificationsService] 通知設定取得完了: ${notificationValidationHelpers.createSettingsSummary(settings)}`);
      return settings.toJSON();
    } catch (error) {
      console.error('[NotificationsService] 通知設定取得エラー:', error);
      throw new Error('通知設定の取得に失敗しました');
    }
  }

  /**
   * 通知設定を更新
   */
  public static async updateNotificationSettings(
    userId: ID, 
    updates: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    try {
      console.log(`[NotificationsService] ユーザー ${userId} の通知設定更新開始`);
      
      // バリデーション実行
      const validation = validateCompleteNotificationUpdate(updates);
      if (!validation.isValid) {
        throw new Error(`設定の検証に失敗: ${validation.errors.join(', ')}`);
      }

      // 時刻文字列の正規化
      if (updates.morningTime) {
        updates.morningTime = notificationValidationHelpers.normalizeTimeString(updates.morningTime);
      }

      // 設定を取得または作成
      const settings = await NotificationSetting.getOrCreateUserSettings(userId);
      
      // 設定を更新
      const updatedSettings = await settings.updateSettings(updates);
      
      console.log(`[NotificationsService] 通知設定更新完了: ${notificationValidationHelpers.createSettingsSummary(updatedSettings)}`);
      
      // 朝の挨拶が有効になった場合、次回スケジュールを作成
      if (updates.morningGreeting === true && updates.morningTime) {
        await this.scheduleNextMorningGreeting(userId, updates.morningTime);
      }
      
      return updatedSettings.toJSON();
    } catch (error) {
      console.error('[NotificationsService] 通知設定更新エラー:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('通知設定の更新に失敗しました');
    }
  }

  /**
   * 通知スケジュールを作成
   */
  public static async createNotificationSchedule(
    userId: ID,
    scheduleData: Omit<NotificationScheduleResponse, 'id' | 'userId' | 'status' | 'createdAt'>
  ): Promise<NotificationScheduleResponse> {
    try {
      console.log(`[NotificationsService] ユーザー ${userId} の通知スケジュール作成開始`);
      
      // バリデーション実行
      const validation = validateScheduleCreation(scheduleData);
      if (!validation.isValid) {
        throw new Error(`スケジュール検証に失敗: ${validation.errors.join(', ')}`);
      }

      // パートナーIDが指定されている場合、存在確認
      if (scheduleData.partnerId) {
        const partner = await PartnerModel.findById(scheduleData.partnerId);
        
        // パートナーの所有者確認
        if (partner && partner.userId !== userId) {
          throw new Error('指定されたパートナーへのアクセス権がありません');
        }
        
        if (!partner) {
          throw new Error('指定されたパートナーが見つかりません');
        }
      }

      // スケジュール時刻の処理
      let scheduledTime: Date;
      const timeInput = scheduleData.scheduledTime as Date | string;
      
      if (timeInput instanceof Date) {
        // Dateオブジェクトの場合
        scheduledTime = timeInput;
      } else if (typeof timeInput === 'string') {
        if (timeInput.includes(':')) {
          // HH:MM形式の場合、次回発生時刻を計算
          scheduledTime = notificationValidationHelpers.getNextOccurrence(timeInput);
        } else {
          // ISO文字列などの場合
          scheduledTime = new Date(timeInput);
        }
      } else {
        // デフォルトは現在時刻
        scheduledTime = new Date();
      }

      // NotificationScheduleモデルを使用してDB保存
      const schedule = await NotificationSchedule.createSchedule({
        userId,
        partnerId: scheduleData.partnerId,
        type: scheduleData.type,
        scheduledTime,
        message: scheduleData.message,
        recurring: scheduleData.recurring || false,
        recurringPattern: scheduleData.recurringPattern,
      });

      console.log(`[NotificationsService] 通知スケジュール作成完了: ${schedule.type} at ${schedule.scheduledTime.toISOString()}`);
      
      return schedule.toJSON();
    } catch (error) {
      console.error('[NotificationsService] 通知スケジュール作成エラー:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('通知スケジュールの作成に失敗しました');
    }
  }

  /**
   * 朝の挨拶の次回スケジュールを作成
   */
  private static async scheduleNextMorningGreeting(userId: ID, morningTime: string): Promise<void> {
    try {
      // ユーザーのパートナーを取得
      const partner = await PartnerModel.findByUserId(userId);

      if (!partner) {
        console.log(`[NotificationsService] ユーザー ${userId} にパートナーが見つからないため、朝の挨拶をスキップ`);
        return;
      }

      // 朝の挨拶スケジュールを作成
      await this.createNotificationSchedule(userId, {
        partnerId: partner.id,
        type: 'morning_greeting',
        scheduledTime: notificationValidationHelpers.getNextOccurrence(morningTime),
        recurring: true,
        recurringPattern: 'daily',
      });

      console.log(`[NotificationsService] ${morningTime} の朝の挨拶スケジュールを作成`);
    } catch (error) {
      console.error('[NotificationsService] 朝の挨拶スケジュール作成エラー:', error);
      // 朝の挨拶スケジュール作成の失敗は、設定更新全体を失敗させない
    }
  }


  /**
   * 朝の挨拶メッセージを生成
   */
  public static async generateMorningGreetingMessage(partnerId: ID): Promise<string> {
    try {
      const partner = await PartnerModel.findById(partnerId);
      
      if (!partner) {
        throw new Error('パートナーが見つかりません');
      }

      // 基本的な朝の挨拶メッセージ（将来的にはAI生成に拡張）
      const greetingTemplates = [
        'おはよう！今日も一日頑張ろうね❤️',
        'おはようございます☀️ 素敵な一日になりますように',
        'おはよう、今日もあなたに会えて嬉しいです💕',
        'おはようございます！今日は何をする予定ですか？',
        'おはよう❤️ あなたのことを想って目が覚めました',
      ];

      const randomMessage = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)];
      
      console.log(`[NotificationsService] パートナー ${partner.name} の朝の挨拶メッセージ生成: ${randomMessage}`);
      return randomMessage;
    } catch (error) {
      console.error('[NotificationsService] 朝の挨拶メッセージ生成エラー:', error);
      return 'おはよう！今日も素敵な一日を過ごしてね❤️';
    }
  }

  /**
   * 通知設定の統計情報を取得（管理者向け）
   */
  public static async getNotificationStatistics(): Promise<{
    totalUsers: number;
    morningGreetingEnabled: number;
    reminderEnabled: number;
    specialDaysEnabled: number;
    popularMorningTimes: Array<{ time: string; count: number }>;
  }> {
    try {
      console.log('[NotificationsService] 通知統計情報取得開始');
      
      const stats = await NotificationSetting.getNotificationStats();
      
      console.log(`[NotificationsService] 通知統計取得完了: 総ユーザー ${stats.totalUsers}名, 朝の挨拶有効 ${stats.morningGreetingEnabled}名`);
      return stats;
    } catch (error) {
      console.error('[NotificationsService] 通知統計取得エラー:', error);
      throw new Error('通知統計の取得に失敗しました');
    }
  }

  /**
   * 指定時刻の朝の挨拶対象ユーザーを取得
   */
  public static async getMorningGreetingUsers(time: string): Promise<Array<{
    userId: ID;
    partnerId: ID;
    userName: string;
    partnerName: string;
  }>> {
    try {
      console.log(`[NotificationsService] ${time} の朝の挨拶対象ユーザー取得開始`);
      
      const settingsWithUsers = await NotificationSetting.getUsersByMorningTime(time);
      
      const result = await Promise.all(
        settingsWithUsers.map(async (setting) => {
          const partner = await PartnerModel.findByUserId(setting.userId);
          
          if (!partner) {
            console.warn(`[NotificationsService] ユーザー ${setting.userId} にパートナーが見つかりません`);
            return null;
          }

          return {
            userId: setting.userId,
            partnerId: partner.id,
            userName: `User ${setting.userId}`, // TODO: ユーザー情報を取得
            partnerName: partner.name,
          };
        })
      );

      const validUsers = result.filter((user): user is NonNullable<typeof user> => user !== null);
      
      console.log(`[NotificationsService] ${time} の朝の挨拶対象: ${validUsers.length}名`);
      return validUsers;
    } catch (error) {
      console.error('[NotificationsService] 朝の挨拶対象ユーザー取得エラー:', error);
      throw new Error('朝の挨拶対象ユーザーの取得に失敗しました');
    }
  }

  /**
   * 通知設定をリセット（デフォルトに戻す）
   */
  public static async resetNotificationSettings(userId: ID): Promise<NotificationSettings> {
    try {
      console.log(`[NotificationsService] ユーザー ${userId} の通知設定をリセット`);
      
      const defaultSettings = {
        morningGreeting: false,
        morningTime: '07:00',
        reminderMessages: false,
        specialDays: true,
      };

      return await this.updateNotificationSettings(userId, defaultSettings);
    } catch (error) {
      console.error('[NotificationsService] 通知設定リセットエラー:', error);
      throw new Error('通知設定のリセットに失敗しました');
    }
  }

  /**
   * 通知設定の妥当性チェック
   */
  public static async validateUserNotificationSettings(userId: ID): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const settings = await NotificationSetting.getOrCreateUserSettings(userId);
      const issues: string[] = [];
      const recommendations: string[] = [];

      // 設定の妥当性チェック
      if (settings.morningGreeting && !settings.morningTime) {
        issues.push('朝の挨拶が有効ですが、時刻が設定されていません');
      }

      // おすすめの改善提案
      if (!settings.morningGreeting && !settings.reminderMessages && !settings.specialDays) {
        recommendations.push('少なくとも1つの通知を有効にすることをお勧めします');
      }

      if (settings.morningGreeting) {
        const [hours] = settings.morningTime.split(':').map(Number);
        if (hours < 6 || hours > 10) {
          recommendations.push('朝の挨拶時刻は6:00-10:00の間が効果的です');
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('[NotificationsService] 通知設定検証エラー:', error);
      throw new Error('通知設定の検証に失敗しました');
    }
  }
}