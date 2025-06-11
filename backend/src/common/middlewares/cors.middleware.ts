import cors from 'cors';
import { ENV_CONFIG } from '@/config/env.config';

// CORS設定
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 開発環境では全てのオリジンを許可
    if (ENV_CONFIG.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // 本番環境では設定されたオリジンのみ許可
    const allowedOrigins = [ENV_CONFIG.CORS_ORIGIN];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true, // Cookieの送信を許可
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // プリフライトリクエストのキャッシュ時間（24時間）
};

export const corsMiddleware = cors(corsOptions);