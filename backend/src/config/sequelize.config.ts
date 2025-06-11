import { Sequelize } from 'sequelize';
import { ENV_CONFIG } from './env.config';
import { initOnboardingProgressModel } from '../db/models/OnboardingProgress.model';
import { Message } from '../db/models/Message.model';

// Sequelizeインスタンスを作成
export const sequelize = new Sequelize(ENV_CONFIG.DATABASE_URL, {
  dialect: 'postgres',
  logging: ENV_CONFIG.NODE_ENV === 'development' ? console.log : false,
  ssl: ENV_CONFIG.NODE_ENV === 'production',
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// すべてのモデルを初期化
export const initializeModels = async (): Promise<void> => {
  try {
    console.log('[Sequelize] Initializing models...');
    
    // OnboardingProgressモデルを初期化
    initOnboardingProgressModel(sequelize);
    
    // Messageモデルを初期化
    Message.initModel(sequelize);
    
    // データベース接続をテスト
    await sequelize.authenticate();
    console.log('[Sequelize] Database connection has been established successfully.');
    
    // 必要に応じてテーブルを同期（開発環境のみ）
    if (ENV_CONFIG.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // 既存テーブルは変更しない
      console.log('[Sequelize] All models were synchronized successfully.');
    }
    
  } catch (error) {
    console.error('[Sequelize] Unable to connect to the database:', error);
    throw error;
  }
};

// データベース接続を閉じる
export const closeSequelizeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('[Sequelize] Database connection closed successfully.');
  } catch (error) {
    console.error('[Sequelize] Error closing database connection:', error);
    throw error;
  }
};