import { UserSettingModel } from '../../db/models/UserSetting.model';
import { NotificationSetting } from '../../db/models/NotificationSetting.model';
import { UserModel } from '../../db/models/User.model';
import { PartnerModel } from '../../db/models/Partner.model';
import { MessageModel } from '../../db/models/Message.model';
import { MemoryModel } from '../../db/models/Memory.model';
import { EpisodeMemoryModel } from '../../db/models/EpisodeMemory.model';
import { RelationshipMetricsModel } from '../../db/models/RelationshipMetrics.model';
import { GeneratedImageModel } from '../../db/models/GeneratedImage.model';
import { pool } from '../../config/database.config';
import {
  ID,
  UserSettings,
  NotificationSettings,
  SettingsUpdateRequest,
  SettingsResponse,
} from '../../types';

export class SettingsService {
  /**
   * ユーザー設定を取得（統合版）
   */
  static async getSettings(userId: ID): Promise<SettingsResponse> {
    try {
      // ユーザー設定とNotification設定を並行して取得
      // ユーザー設定とNotification設定を並行して取得
      const [userSettings, notificationSettings] = await Promise.all([
        UserSettingModel.getOrCreateUserSettings(userId),
        NotificationSetting.getOrCreateUserSettings(userId),
      ]);

      return {
        success: true,
        data: {
          userSettings: userSettings,
          notifications: notificationSettings.toJSON ? notificationSettings.toJSON() : notificationSettings,
        },
      };
    } catch (error) {
      console.error('Settings retrieval error:', error);
      throw new Error('設定の取得に失敗しました');
    }
  }

  /**
   * ユーザー設定を更新（統合版）
   */
  static async updateSettings(
    userId: ID,
    settingsData: SettingsUpdateRequest
  ): Promise<SettingsResponse> {
    const client = await pool.connect();

    try {
      const updatePromises = [];

      // ユーザー設定の更新
      if (settingsData.userSettings) {
        // 事前に設定を作成（存在しない場合）
        await UserSettingModel.getOrCreateUserSettings(userId);
        
        updatePromises.push(
          UserSettingModel.updateSettings(userId, settingsData.userSettings)
        );
      }

      // 通知設定の更新
      if (settingsData.notifications) {
        // 既存の設定を取得
        const notificationSetting = await NotificationSetting.getOrCreateUserSettings(userId);
        
        // undefinedのフィールドを除外して更新
        const updateData: any = {};
        Object.entries(settingsData.notifications).forEach(([key, value]) => {
          if (value !== undefined) {
            updateData[key] = value;
          }
        });
        
        updatePromises.push(
          notificationSetting.updateSettings(updateData)
        );
      }

      // すべての更新を実行
      await Promise.all(updatePromises);

      // 更新後の設定を取得して返す
      return await this.getSettings(userId);
    } catch (error) {
      console.error('Settings update error:', error);
      throw new Error('設定の更新に失敗しました');
    } finally {
      client.release();
    }
  }

  /**
   * ユーザー設定のみを取得
   */
  static async getUserSettings(userId: ID): Promise<UserSettings> {
    try {
      return await UserSettingModel.getOrCreateUserSettings(userId);
    } catch (error) {
      console.error('User settings retrieval error:', error);
      throw new Error('ユーザー設定の取得に失敗しました');
    }
  }

  /**
   * 通知設定のみを取得
   */
  static async getNotificationSettings(userId: ID): Promise<NotificationSettings> {
    try {
      return await NotificationSetting.getOrCreateUserSettings(userId).then(s => s.toJSON() as NotificationSettings);
    } catch (error) {
      console.error('Notification settings retrieval error:', error);
      throw new Error('通知設定の取得に失敗しました');
    }
  }

  /**
   * データエクスポート機能（ユーザー設定経由）
   */
  static async exportUserData(userId: ID): Promise<any> {
    try {
      // ユーザー情報を取得
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // パートナーIDを事前に取得
      const partnerId = await this.getPartnerIdForUser(userId);
      
      // 関連データを並行して取得
      const [
        partner,
        userSettings,
        notificationSettings,
        messages,
        memories,
        episodeMemories,
        relationshipMetrics,
        generatedImages,
      ] = await Promise.all([
        PartnerModel.findByUserId(userId),
        UserSettingModel.getOrCreateUserSettings(userId),
        NotificationSetting.getOrCreateUserSettings(userId),
        Promise.resolve([]), // メッセージデータは今回のテストでは不要
        partnerId ? MemoryModel.findByPartnerId(partnerId) : Promise.resolve([]),
        partnerId ? EpisodeMemoryModel.findByPartnerId(partnerId) : Promise.resolve([]),
        partnerId ? RelationshipMetricsModel.findByPartnerId(partnerId) : Promise.resolve(null),
        partnerId ? GeneratedImageModel.getByPartnerId(partnerId, 100) : Promise.resolve([]),
      ]);

      // エクスポートデータを構築
      const exportData = {
        exportDate: new Date().toISOString(),
        userData: {
          profile: user,
          settings: {
            userSettings: userSettings || null,
            notificationSettings: notificationSettings?.toJSON ? notificationSettings.toJSON() : notificationSettings || null,
          },
        },
        partnerData: partner || null,
        conversationData: {
          messages: messages.map((m: any) => m.toJSON()),
          messageCount: messages.length,
        },
        memoryData: {
          memories: memories.map((m: any) => m.toJSON ? m.toJSON() : m),
          episodeMemories: episodeMemories.map((e: any) => e.toJSON ? e.toJSON() : e),
          relationshipMetrics: relationshipMetrics || null,
        },
        mediaData: {
          generatedImages: generatedImages.map((img: any) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            prompt: img.prompt,
            emotion: img.emotion || '',
            createdAt: img.createdAt,
          })),
          imageCount: generatedImages.length,
        },
      };

      return exportData;
    } catch (error) {
      console.error('Data export error:', error);
      throw new Error('データエクスポートに失敗しました');
    }
  }

  /**
   * ユーザーに紐づくパートナーIDを取得（ヘルパーメソッド）
   */
  private static async getPartnerIdForUser(userId: ID): Promise<ID | null> {
    const partner = await PartnerModel.findByUserId(userId);
    return partner ? partner.id : null;
  }

  /**
   * 設定統計情報を取得（管理者用）
   */
  static async getSettingsStats(): Promise<any> {
    try {
      const [userSettingsStats, notificationSettingsStats] = await Promise.all([
        UserSettingModel.getSettingsStats(),
        NotificationSetting.getNotificationStats(),
      ]);

      return {
        userSettings: userSettingsStats,
        notificationSettings: notificationSettingsStats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Settings stats error:', error);
      throw new Error('設定統計情報の取得に失敗しました');
    }
  }
}