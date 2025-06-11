import { Pool, PoolConfig } from 'pg';
import { ENV_CONFIG } from './env.config';

const poolConfig: PoolConfig = {
  connectionString: ENV_CONFIG.DATABASE_URL,
  ssl: ENV_CONFIG.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
    
    // memoriesテーブル作成（MemGPT型階層メモリシステム）
    await client.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('conversation', 'fact', 'emotion', 'event', 'relationship', 'preference')),
        content TEXT NOT NULL CHECK (LENGTH(content) > 0),
        vector JSONB,
        importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
        emotional_weight INTEGER DEFAULT 5 CHECK (emotional_weight >= 1 AND emotional_weight <= 10),
        tags JSONB DEFAULT '[]',
        related_people JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // memoriesテーブルのインデックス作成
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memories_partner_id ON memories(partner_id);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_memories_partner_importance ON memories(partner_id, importance);
    `);
    
    // relationship_metricsテーブル作成（関係性メトリクス）
    await client.query(`
      CREATE TABLE IF NOT EXISTS relationship_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        intimacy_level INTEGER DEFAULT 0 CHECK (intimacy_level >= 0 AND intimacy_level <= 100),
        trust_level INTEGER DEFAULT 0 CHECK (trust_level >= 0 AND trust_level <= 100),
        communication_frequency INTEGER DEFAULT 0,
        emotional_connection INTEGER DEFAULT 0 CHECK (emotional_connection >= 0 AND emotional_connection <= 100),
        shared_experiences INTEGER DEFAULT 0,
        conflict_resolution INTEGER DEFAULT 0 CHECK (conflict_resolution >= 0 AND conflict_resolution <= 100),
        relationship_stage VARCHAR(20) DEFAULT 'stranger' CHECK (relationship_stage IN ('stranger', 'acquaintance', 'friend', 'close_friend', 'intimate')),
        last_interaction TIMESTAMP WITH TIME ZONE,
        total_interactions INTEGER DEFAULT 0,
        positive_interactions INTEGER DEFAULT 0,
        negative_interactions INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // episode_memoriesテーブル作成（エピソード記憶）
    await client.query(`
      CREATE TABLE IF NOT EXISTS episode_memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        emotional_impact INTEGER DEFAULT 5 CHECK (emotional_impact >= 1 AND emotional_impact <= 10),
        participants JSONB DEFAULT '[]',
        location VARCHAR(100),
        duration_minutes INTEGER,
        tags JSONB DEFAULT '[]',
        related_memories JSONB DEFAULT '[]',
        occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // メモリ関連テーブルのインデックス作成
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_relationship_metrics_partner_id ON relationship_metrics(partner_id);
      CREATE INDEX IF NOT EXISTS idx_episode_memories_partner_id ON episode_memories(partner_id);
      CREATE INDEX IF NOT EXISTS idx_episode_memories_occurred_at ON episode_memories(occurred_at);
      CREATE INDEX IF NOT EXISTS idx_episode_memories_emotional_impact ON episode_memories(emotional_impact);
    `);
    
    // メモリ関連テーブルのトリガー
    await client.query(`
      DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
      CREATE TRIGGER update_memories_updated_at
          BEFORE UPDATE ON memories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
          
      DROP TRIGGER IF EXISTS update_relationship_metrics_updated_at ON relationship_metrics;
      CREATE TRIGGER update_relationship_metrics_updated_at
          BEFORE UPDATE ON relationship_metrics
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
          
      DROP TRIGGER IF EXISTS update_episode_memories_updated_at ON episode_memories;
      CREATE TRIGGER update_episode_memories_updated_at
          BEFORE UPDATE ON episode_memories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // notification_settingsテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        morning_greeting BOOLEAN DEFAULT false,
        morning_time VARCHAR(5) DEFAULT '07:00' CHECK (morning_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'),
        reminder_messages BOOLEAN DEFAULT false,
        special_days BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // notification_schedulesテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL CHECK (type IN ('morning_greeting', 'reminder', 'special_day', 'custom')),
        scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
        message TEXT,
        recurring BOOLEAN DEFAULT false,
        recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
        retry_count INTEGER DEFAULT 0,
        last_sent_at TIMESTAMP WITH TIME ZONE,
        next_run_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // user_settingsテーブル作成
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
        background_image VARCHAR(100) DEFAULT 'default',
        sound_enabled BOOLEAN DEFAULT true,
        auto_save BOOLEAN DEFAULT true,
        data_retention_days INTEGER DEFAULT 365 CHECK (data_retention_days >= 30 AND data_retention_days <= 9999),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // generated_imagesテーブル作成（画像生成機能）
    await client.query(`
      CREATE TABLE IF NOT EXISTS generated_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        prompt TEXT NOT NULL,
        context TEXT,
        consistency_score DECIMAL(3,2) DEFAULT 0.0 CHECK (consistency_score >= 0 AND consistency_score <= 1),
        leonardo_generation_id VARCHAR(255),
        model_used VARCHAR(100) DEFAULT 'leonardo-diffusion-xl',
        type VARCHAR(20) DEFAULT 'avatar' CHECK (type IN ('avatar', 'chat', 'background')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 設定・画像テーブルのインデックス作成
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_notification_settings_morning ON notification_settings(morning_greeting, morning_time);
      CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_id ON notification_schedules(user_id);
      CREATE INDEX IF NOT EXISTS idx_notification_schedules_scheduled_time ON notification_schedules(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_notification_schedules_status ON notification_schedules(status);
      CREATE INDEX IF NOT EXISTS idx_notification_schedules_type ON notification_schedules(type);
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme);
      CREATE INDEX IF NOT EXISTS idx_generated_images_partner_id ON generated_images(partner_id);
      CREATE INDEX IF NOT EXISTS idx_generated_images_type ON generated_images(type);
      CREATE INDEX IF NOT EXISTS idx_generated_images_consistency ON generated_images(consistency_score);
      CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at);
    `);
    
    // 設定テーブルのトリガー
    await client.query(`
      DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
      CREATE TRIGGER update_notification_settings_updated_at
          BEFORE UPDATE ON notification_settings
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
          
      DROP TRIGGER IF EXISTS update_notification_schedules_updated_at ON notification_schedules;
      CREATE TRIGGER update_notification_schedules_updated_at
          BEFORE UPDATE ON notification_schedules
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
          
      DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
      CREATE TRIGGER update_user_settings_updated_at
          BEFORE UPDATE ON user_settings
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
          
      DROP TRIGGER IF EXISTS update_generated_images_updated_at ON generated_images;
      CREATE TRIGGER update_generated_images_updated_at
          BEFORE UPDATE ON generated_images
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