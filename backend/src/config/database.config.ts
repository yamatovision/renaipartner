import { Pool, PoolConfig } from 'pg';
import { ENV_CONFIG } from './env.config';

const poolConfig: PoolConfig = {
  connectionString: ENV_CONFIG.DATABASE_URL,
  ssl: ENV_CONFIG.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// データベース接続テスト
export async function testDatabaseConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('[DB] Database connection established successfully');
    client.release();
  } catch (error) {
    console.error('[DB] Database connection failed:', error);
    throw new Error(`Database connection failed: ${error}`);
  }
}

// データベース初期化
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('[DB] Initializing database schema...');
    
    // usersテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        surname VARCHAR(50) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        nickname VARCHAR(50),
        birthday DATE NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // refresh_tokensテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // blacklisted_tokensテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jti VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // updated_atの自動更新トリガー
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // partnersテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        personality_type VARCHAR(50) NOT NULL,
        speech_style VARCHAR(50) NOT NULL,
        system_prompt TEXT NOT NULL,
        avatar_description TEXT NOT NULL,
        hair_style VARCHAR(50) NOT NULL,
        eye_color VARCHAR(50) NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        clothing_style VARCHAR(50) NOT NULL,
        generated_image_url TEXT,
        base_image_url TEXT,
        hobbies JSONB DEFAULT '[]',
        intimacy_level INTEGER DEFAULT 0 CHECK (intimacy_level >= 0 AND intimacy_level <= 100),
        created_via_onboarding BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 既存partnersテーブルの列サイズ更新（文字列長制限の解決）
    await client.query(`
      ALTER TABLE partners 
      ALTER COLUMN name TYPE VARCHAR(50),
      ALTER COLUMN hair_style TYPE VARCHAR(50),
      ALTER COLUMN eye_color TYPE VARCHAR(50),
      ALTER COLUMN body_type TYPE VARCHAR(50),
      ALTER COLUMN clothing_style TYPE VARCHAR(50);
    `);
    
    // 古いonboarding_progressテーブルを削除
    await client.query(`DROP TABLE IF EXISTS onboarding_progress CASCADE;`);
    
    // onboarding_progressテーブル作成
    await client.query(`
      CREATE TABLE onboarding_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 10),
        completed_steps JSONB DEFAULT '[]',
        user_data JSONB DEFAULT NULL,
        partner_data JSONB DEFAULT NULL,
        personality_answers JSONB DEFAULT '[]',
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // partnersテーブルのトリガー
    await client.query(`
      DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
      CREATE TRIGGER update_partners_updated_at
          BEFORE UPDATE ON partners
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // onboarding_progressテーブルのトリガー
    await client.query(`
      DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
      CREATE TRIGGER update_onboarding_progress_updated_at
          BEFORE UPDATE ON onboarding_progress
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // messagesテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000),
        sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'partner')),
        emotion VARCHAR(50),
        context JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // messagesテーブルのインデックス作成
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_partner_id ON messages(partner_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_partner_created ON messages(partner_id, created_at);
    `);
    
    // messagesテーブルのトリガー
    await client.query(`
      DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
      CREATE TRIGGER update_messages_updated_at
          BEFORE UPDATE ON messages
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('[DB] Database schema initialized successfully');
    
  } catch (error) {
    console.error('[DB] Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// アプリケーション終了時のクリーンアップ
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('[DB] Database connection pool closed');
  } catch (error) {
    console.error('[DB] Error closing database connection:', error);
  }
}