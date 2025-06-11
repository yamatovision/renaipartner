import { DataTypes, Model, Optional, Sequelize, Op, ModelAttributeColumnOptions } from 'sequelize';
import { ID, Message as IMessage, MessageBase, MessageSender, Timestamps } from '../../types';

interface MessageCreationAttributes extends Optional<IMessage, 'id' | 'createdAt' | 'updatedAt' | 'emotion' | 'context'> {}

export class Message extends Model<IMessage, MessageCreationAttributes> implements IMessage {
  public id!: ID;
  public partnerId!: ID;
  public content!: string;
  public sender!: MessageSender;
  public emotion?: string;
  public context?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: any) {
    Message.belongsTo(models.Partner, {
      foreignKey: 'partnerId',
      as: 'partner'
    });
  }

  static initModel(sequelize: Sequelize): typeof Message {
    Message.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      partnerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'partner_id', // データベースのカラム名
        references: {
          model: 'partners',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 1000]
        }
      },
      sender: {
        type: DataTypes.ENUM('user', 'partner'),
        allowNull: false,
      },
      emotion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      context: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    } as any, {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: true,
      underscored: true, // snake_case カラム名を使用
      indexes: [
        {
          fields: ['partnerId']
        },
        {
          fields: ['createdAt']
        },
        {
          fields: ['partnerId', 'createdAt']
        }
      ]
    });

    return Message;
  }

  /**
   * メッセージ履歴取得（ページネーション対応）
   */
  static async getMessageHistory(partnerId: string, limit: number = 20, offset: number = 0): Promise<IMessage[]> {
    const messages = await Message.findAll({
      where: { partnerId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      raw: true
    });
    
    // 古い順に並び替えて返す
    return messages.reverse();
  }

  /**
   * 最新のメッセージ取得
   */
  static async getLatestMessages(partnerId: string, count: number = 10): Promise<IMessage[]> {
    const messages = await Message.findAll({
      where: { partnerId },
      order: [['createdAt', 'DESC']],
      limit: count,
      raw: true
    });
    
    // 古い順に並び替えて返す
    return messages.reverse();
  }

  /**
   * 会話コンテキスト用のメッセージ取得（最大トークン数を考慮）
   */
  static async getContextMessages(partnerId: string, maxMessages: number = 15): Promise<IMessage[]> {
    return Message.getLatestMessages(partnerId, maxMessages);
  }

  /**
   * パートナーの最後の感情状態取得
   */
  static async getLastEmotion(partnerId: string): Promise<string | null> {
    const lastMessage = await Message.findOne({
      where: { 
        partnerId,
        sender: MessageSender.PARTNER,
        emotion: { [Op.ne]: null } as any
      },
      order: [['createdAt', 'DESC']],
      attributes: ['emotion']
    });

    return lastMessage?.emotion || null;
  }

  /**
   * メッセージ総数取得
   */
  static async getMessageCount(partnerId: string): Promise<number> {
    return Message.count({
      where: { partnerId }
    });
  }

  /**
   * 日付範囲でメッセージ取得
   */
  static async getMessagesByDateRange(
    partnerId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<IMessage[]> {
    return Message.findAll({
      where: {
        partnerId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['createdAt', 'ASC']],
      raw: true
    });
  }

  /**
   * IDの配列でメッセージを取得
   */
  static async findByIds(messageIds: string[]): Promise<IMessage[]> {
    return Message.findAll({
      where: {
        id: {
          [Op.in]: messageIds
        }
      },
      order: [['createdAt', 'ASC']],
      raw: true
    });
  }

  /**
   * メッセージ削除（テスト用）
   */
  static async deleteMessagesForPartner(partnerId: string): Promise<number> {
    return Message.destroy({
      where: { partnerId }
    });
  }
}

// エクスポート
export const MessageModel = Message;
export default Message;