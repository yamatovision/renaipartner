/**
 * NotificationSchedule モデル
 * スケジュールされた通知（朝の挨拶、リマインダー、特別な日など）の管理
 * 定期的な通知とワンタイム通知の両方をサポート
 */

import { Model, DataTypes, Sequelize, Op } from 'sequelize';
import { ID, NotificationScheduleResponse } from '@/types';

export interface NotificationScheduleAttributes {
  id: ID;
  userId: ID;
  partnerId?: ID;
  type: 'morning_greeting' | 'reminder' | 'special_day' | 'custom';
  scheduledTime: Date;
  message?: string;
  recurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  lastSentAt?: Date;
  nextRunAt?: Date;
  retryCount?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationScheduleCreationAttributes 
  extends Omit<NotificationScheduleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class NotificationSchedule 
  extends Model<NotificationScheduleAttributes, NotificationScheduleCreationAttributes> 
  implements NotificationScheduleAttributes {
  
  public id!: ID;
  public userId!: ID;
  public partnerId?: ID;
  public type!: 'morning_greeting' | 'reminder' | 'special_day' | 'custom';
  public scheduledTime!: Date;
  public message?: string;
  public recurring!: boolean;
  public recurringPattern?: 'daily' | 'weekly' | 'monthly';
  public status!: 'pending' | 'sent' | 'failed' | 'cancelled';
  public lastSentAt?: Date;
  public nextRunAt?: Date;
  public retryCount!: number;
  public metadata?: Record<string, any>;

  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 関連データは必要に応じて別途取得

  /**
   * NotificationScheduleモデルの初期化
   */
  public static initialize(sequelize: Sequelize): typeof NotificationSchedule {
    NotificationSchedule.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        partnerId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'partners',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        type: {
          type: DataTypes.ENUM('morning_greeting', 'reminder', 'special_day', 'custom'),
          allowNull: false,
          comment: '通知タイプ',
        },
        scheduledTime: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'スケジュールされた送信時刻',
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'カスタムメッセージ（custom typeの場合）',
        },
        recurring: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '定期通知フラグ',
        },
        recurringPattern: {
          type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
          allowNull: true,
          comment: '定期通知のパターン',
        },
        status: {
          type: DataTypes.ENUM('pending', 'sent', 'failed', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
          comment: '通知ステータス',
        },
        lastSentAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '最後に送信した時刻',
        },
        nextRunAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '次回実行予定時刻（定期通知の場合）',
        },
        retryCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '再試行回数',
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {},
          comment: '追加メタデータ（エラー情報など）',
        },
      },
      {
        sequelize,
        modelName: 'NotificationSchedule',
        tableName: 'notification_schedules',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['user_id'],
          },
          {
            fields: ['status', 'scheduled_time'],
            name: 'idx_pending_schedules',
          },
          {
            fields: ['type', 'status'],
            name: 'idx_type_status',
          },
          {
            fields: ['recurring', 'next_run_at'],
            name: 'idx_recurring_schedules',
          },
        ],
      }
    );

    return NotificationSchedule;
  }

  /**
   * アソシエーションの定義
   * 注意: UserModelとPartnerModelは独自のPostgreSQLクラスのため、
   * 直接的なSequelizeアソシエーションは使用できません
   */
  public static associate(): void {
    // 将来的にUserとPartnerがSequelizeモデルに移行された際のための準備
    // 現在は手動でJOINクエリを実行します
    console.log('[NotificationSchedule] アソシエーション設定をスキップ（独自モデル使用のため）');
  }

  /**
   * 通知スケジュールを作成
   */
  public static async createSchedule(
    data: Omit<NotificationScheduleCreationAttributes, 'status' | 'retryCount'>
  ): Promise<NotificationSchedule> {
    try {
      // 定期通知の場合、nextRunAtを設定
      let nextRunAt: Date | undefined;
      if (data.recurring && data.recurringPattern) {
        nextRunAt = this.calculateNextRunTime(data.scheduledTime, data.recurringPattern);
      }

      const schedule = await NotificationSchedule.create({
        ...data,
        status: 'pending',
        retryCount: 0,
        nextRunAt,
      });

      console.log(`[NotificationSchedule] スケジュール作成: ${schedule.id}, タイプ: ${schedule.type}`);
      return schedule;
    } catch (error) {
      console.error('[NotificationSchedule] スケジュール作成エラー:', error);
      throw new Error('通知スケジュールの作成に失敗しました');
    }
  }

  /**
   * 送信待ちの通知を取得
   */
  public static async getPendingSchedules(limit: number = 100): Promise<NotificationSchedule[]> {
    try {
      const now = new Date();
      const schedules = await NotificationSchedule.findAll({
        where: {
          status: 'pending',
          scheduledTime: {
            [Op.lte]: now,
          },
        },
        // include機能は使用せず、必要に応じて別途データを取得
        order: [['scheduledTime', 'ASC']],
        limit,
      });

      console.log(`[NotificationSchedule] 送信待ち通知: ${schedules.length}件`);
      return schedules;
    } catch (error) {
      console.error('[NotificationSchedule] 送信待ち通知取得エラー:', error);
      throw new Error('送信待ち通知の取得に失敗しました');
    }
  }

  /**
   * 定期通知の次回実行時刻を計算
   */
  private static calculateNextRunTime(
    baseTime: Date,
    pattern: 'daily' | 'weekly' | 'monthly'
  ): Date {
    const nextTime = new Date(baseTime);
    
    switch (pattern) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
    }

    return nextTime;
  }

  /**
   * 通知を送信済みにマーク
   */
  public async markAsSent(): Promise<void> {
    try {
      const updates: any = {
        status: 'sent',
        lastSentAt: new Date(),
      };

      // 定期通知の場合、次回実行時刻を更新
      if (this.recurring && this.recurringPattern) {
        updates.nextRunAt = NotificationSchedule.calculateNextRunTime(
          this.scheduledTime,
          this.recurringPattern
        );
        updates.status = 'pending'; // 定期通知は再度pendingに
      }

      await this.update(updates);
      console.log(`[NotificationSchedule] 通知 ${this.id} を送信済みにマーク`);
    } catch (error) {
      console.error('[NotificationSchedule] 送信済みマークエラー:', error);
      throw new Error('通知ステータスの更新に失敗しました');
    }
  }

  /**
   * 通知を失敗にマーク
   */
  public async markAsFailed(errorMessage?: string): Promise<void> {
    try {
      const metadata = this.metadata || {};
      metadata.lastError = errorMessage;
      metadata.lastFailedAt = new Date();

      await this.update({
        status: 'failed',
        retryCount: this.retryCount + 1,
        metadata,
      });

      console.log(`[NotificationSchedule] 通知 ${this.id} を失敗にマーク: ${errorMessage}`);
    } catch (error) {
      console.error('[NotificationSchedule] 失敗マークエラー:', error);
      throw new Error('通知ステータスの更新に失敗しました');
    }
  }

  /**
   * ユーザーのスケジュール一覧を取得
   */
  public static async getUserSchedules(
    userId: ID,
    includeCompleted: boolean = false
  ): Promise<NotificationSchedule[]> {
    try {
      const whereClause: any = { userId };
      
      if (!includeCompleted) {
        whereClause.status = ['pending', 'failed'];
      }

      const schedules = await NotificationSchedule.findAll({
        where: whereClause,
        // include機能は使用せず、必要に応じて別途データを取得
        order: [['scheduledTime', 'ASC']],
      });

      return schedules;
    } catch (error) {
      console.error('[NotificationSchedule] ユーザースケジュール取得エラー:', error);
      throw new Error('スケジュールの取得に失敗しました');
    }
  }

  /**
   * スケジュールをキャンセル
   */
  public async cancel(): Promise<void> {
    try {
      if (this.status === 'sent' || this.status === 'cancelled') {
        throw new Error('既に送信済みまたはキャンセル済みのスケジュールです');
      }

      await this.update({ status: 'cancelled' });
      console.log(`[NotificationSchedule] スケジュール ${this.id} をキャンセル`);
    } catch (error) {
      console.error('[NotificationSchedule] キャンセルエラー:', error);
      throw new Error('スケジュールのキャンセルに失敗しました');
    }
  }

  /**
   * 朝の挨拶スケジュールを作成または更新
   */
  public static async createOrUpdateMorningGreeting(
    userId: ID,
    partnerId: ID,
    time: string // HH:MM format
  ): Promise<NotificationSchedule> {
    try {
      // 既存の朝の挨拶スケジュールを無効化
      await NotificationSchedule.update(
        { status: 'cancelled' },
        {
          where: {
            userId,
            type: 'morning_greeting',
            status: 'pending',
          },
        }
      );

      // 新しいスケジュールを作成
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // 過去の時刻の場合は翌日に設定
      if (scheduledTime <= new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const schedule = await this.createSchedule({
        userId,
        partnerId,
        type: 'morning_greeting',
        scheduledTime,
        recurring: true,
        recurringPattern: 'daily',
      });

      return schedule;
    } catch (error) {
      console.error('[NotificationSchedule] 朝の挨拶スケジュール作成エラー:', error);
      throw new Error('朝の挨拶スケジュールの作成に失敗しました');
    }
  }

  /**
   * JSON出力用のデータ変換
   */
  public toJSON(): NotificationScheduleResponse {
    return {
      id: this.id,
      userId: this.userId,
      partnerId: this.partnerId,
      type: this.type,
      scheduledTime: this.scheduledTime,
      message: this.message,
      recurring: this.recurring,
      recurringPattern: this.recurringPattern,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}