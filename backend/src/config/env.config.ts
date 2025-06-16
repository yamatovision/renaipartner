import dotenv from 'dotenv';

dotenv.config();

export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.BACKEND_PORT || '8080', 10),
  
  // データベース設定
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // JWT設定
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h',
  JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d',
  
  // パスワード設定
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  
  // CORS設定
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // セッション設定
  SESSION_SECRET: process.env.SESSION_SECRET || '',
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
  
  // ログ設定
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
  
  // OpenAI設定
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'),
  OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
  
  // 画像生成設定
  IMAGE_GENERATION_API_KEY: process.env.IMAGE_GENERATION_API_KEY || '',
  IMAGE_GENERATION_ENDPOINT: process.env.IMAGE_GENERATION_ENDPOINT || '',
  IMAGE_GENERATION_MODEL: process.env.IMAGE_GENERATION_MODEL || '',
  
  // Pinecone設定
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'ai-partner-memory',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || '',
  
  // レート制限設定
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

// 必須環境変数のチェック
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
] as const;

export function validateEnvironment(): void {
  const missingVars = requiredEnvVars.filter(envVar => !ENV_CONFIG[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }
}