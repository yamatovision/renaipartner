/**
 * NotificationSetting モデル
 * ユーザーの通知設定を管理
 * 朝の挨拶、リマインダー、特別な日の通知設定
 */

import { Model, DataTypes, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
import { NotificationSettings, ID } from '@/types';
import { UserModel } from './User.model';

export class NotificationSetting extends Model<NotificationSettings, Omit<NotificationSettings, 'id'>> implements NotificationSettings {
  public id!: ID;
  public userId!: ID;
  public morningGreeting!: boolean;
  public morningTime!: string; // HH:MM format
  public reminderMessages!: boolean;
  public specialDays!: boolean;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // associations
  public getUser!: BelongsToGetAssociationMixin<UserModel>;

  /**
   * NotificationSettingモデルの初期化
   */
  public static initialize(sequelize: Sequelize): typeof NotificationSetting {
    NotificationSetting.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true, // 1ユーザー1設定
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        morningGreeting: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '朝の挨拶通知の有効/無効',
        },
        morningTime: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '07:00',
          validate: {
            is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/i, // HH:MM形式
          },
          comment: '朝の挨拶通知時刻（HH:MM形式）',
        },
        reminderMessages: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'リマインダーメッセージの有効/無効',
        },
        specialDays: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: '特別な日（誕生日等）の通知有効/無効',
        },
      },
      {
        sequelize,
        modelName: 'NotificationSetting',
        tableName: 'notification_settings',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['user_id'],
            unique: true,
          },
          {
            fields: ['morning_greeting', 'morning_time'],
            name: 'idx_morning_notifications',
          },
        ],
      }
    );

    return NotificationSetting;
  }

  /**
   * アソシエーションの定義
   */
  public static associate(): void {
    // User との多対一関係
    NotificationSetting.belongsTo(UserModel as any, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  }

  /**
   * ユーザーのデフォルト通知設定を作成
   */
  public static async createDefaultSettings(userId: ID): Promise<NotificationSetting> {
    try {
      const defaultSettings = await NotificationSetting.create({
        userId,
        morningGreeting: true, // デフォルトは有効
        morningTime: '07:00',
        reminderMessages: false,
        specialDays: true, // 特別な日の通知はデフォルトで有効
      });

      console.log(`[NotificationSetting] ユーザー ${userId} のデフォルト通知設定を作成`);
      return defaultSettings;
    } catch (error) {
      console.error('[NotificationSetting] デフォルト設定作成エラー:', error);
      throw new Error('通知設定の作成に失敗しました');
    }
  }

  /**
   * ユーザーの通知設定を取得（存在しない場合はデフォルト作成）
   */
  public static async getOrCreateUserSettings(userId: ID): Promise<NotificationSetting> {
    try {
      let settings = await NotificationSetting.findOne({
        where: { userId },
      });

      if (!settings) {
        settings = await NotificationSetting.createDefaultSettings(userId);
      }

      return settings;
    } catch (error) {
      console.error('[NotificationSetting] 設定取得エラー:', error);
      throw new Error('通知設定の取得に失敗しました');
    }
  }

  /**
   * 通知設定を更新
   */
  public async updateSettings(updates: Partial<NotificationSettings>): Promise<NotificationSetting> {
    try {
      const allowedFields = ['morningGreeting', 'morningTime', 'reminderMessages', 'specialDays'];
      const filteredUpdates: Partial<NotificationSettings> = {};

      // 許可されたフィールドのみ更新
      Object.keys(updates).forEach((key) => {
        if (allowedFields.includes(key)) {
          (filteredUpdates as any)[key] = (updates as any)[key];
        }
      });

      await this.update(filteredUpdates);
      await this.reload();

      console.log(`[NotificationSetting] ユーザー ${this.userId} の通知設定を更新:`, filteredUpdates);
      return this;
    } catch (error) {
      console.error('[NotificationSetting] 設定更新エラー:', error);
      throw new Error('通知設定の更新に失敗しました');
    }
  }

  /**
   * 朝の挨拶が有効なユーザーを取得
   */
  public static async getUsersWithMorningGreeting(): Promise<NotificationSetting[]> {
    try {
      const users = await NotificationSetting.findAll({
        where: {
          morningGreeting: true,
        },
        include: [
          {
            model: UserModel as any,
            as: 'user',
            attributes: ['id', 'firstName', 'surname'],
          },
        ],
        order: [['morningTime', 'ASC']],
      });

      console.log(`[NotificationSetting] 朝の挨拶有効ユーザー: ${users.length}名`);
      return users;
    } catch (error) {
      console.error('[NotificationSetting] 朝の挨拶ユーザー取得エラー:', error);
      throw new Error('朝の挨拶ユーザーの取得に失敗しました');
    }
  }

  /**
   * 指定時刻の朝の挨拶対象ユーザーを取得
   */
  public static async getUsersByMorningTime(time: string): Promise<NotificationSetting[]> {
    try {
      const users = await NotificationSetting.findAll({
        where: {
          morningGreeting: true,
          morningTime: time,
        },
        include: [
          {
            model: UserModel as any,
            as: 'user',
            attributes: ['id', 'firstName', 'surname'],
          },
        ],
      });

      console.log(`[NotificationSetting] ${time} の朝の挨拶対象ユーザー: ${users.length}名`);
      return users;
    } catch (error) {
      console.error('[NotificationSetting] 時刻別ユーザー取得エラー:', error);
      throw new Error('時刻別ユーザーの取得に失敗しました');
    }
  }

  /**
   * 通知設定の統計情報を取得
   */
  public static async getNotificationStats(): Promise<{
    totalUsers: number;
    morningGreetingEnabled: number;
    reminderEnabled: number;
    specialDaysEnabled: number;
    popularMorningTimes: Array<{ time: string; count: number }>;
  }> {
    try {
      const [totalUsers, morningGreetingEnabled, reminderEnabled, specialDaysEnabled] = await Promise.all([
        NotificationSetting.count(),
        NotificationSetting.count({ where: { morningGreeting: true } }),
        NotificationSetting.count({ where: { reminderMessages: true } }),
        NotificationSetting.count({ where: { specialDays: true } }),
      ]);

      // 人気の朝の時刻トップ5
      const popularTimesResult = await NotificationSetting.findAll({
        attributes: [
          'morningTime',
          [Sequelize.fn('COUNT', Sequelize.col('morning_time')), 'count'],
        ],
        where: {
          morningGreeting: true,
        },
        group: ['morning_time'],
        order: [[Sequelize.literal('count'), 'DESC']],
        limit: 5,
        raw: true,
      });

      const popularMorningTimes = popularTimesResult.map((item: any) => ({
        time: item.morningTime,
        count: parseInt(item.count),
      }));

      return {
        totalUsers,
        morningGreetingEnabled,
        reminderEnabled,
        specialDaysEnabled,
        popularMorningTimes,
      };
    } catch (error) {
      console.error('[NotificationSetting] 統計情報取得エラー:', error);
      throw new Error('通知統計の取得に失敗しました');
    }
  }

  /**
   * 時刻文字列の検証
   */
  public static validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * JSON出力用のデータ変換
   */
  public toJSON(): NotificationSettings {
    return {
      id: this.id,
      userId: this.userId,
      morningGreeting: this.morningGreeting,
      morningTime: this.morningTime,
      reminderMessages: this.reminderMessages,
      specialDays: this.specialDays,
    };
  }
}