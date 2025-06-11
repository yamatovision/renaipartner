import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV_CONFIG, validateEnvironment } from '@/config/env.config';
import { 
  testDatabaseConnection, 
  initializeDatabase, 
  closeDatabaseConnection 
} from '@/config/database.config';
import { initializeModels, closeSequelizeConnection } from '@/config/sequelize.config';
import { 
  corsMiddleware,
  errorHandler,
  notFoundHandler,
  logAuthInfo
} from '@/common/middlewares';

// フィーチャールート
import authRoutes from '@/features/auth/auth.routes';
import usersRoutes from '@/features/users/users.routes';
import partnersRoutes from '@/features/partners/partners.routes';
import { onboardingRoutes } from '@/features/onboarding/onboarding.routes';
import chatRoutes from '@/features/chat/chat.routes';
import memoryRoutes from '@/features/memory/memory.routes';
import { imagesRoutes } from '@/features/images/images.routes';
import { settingsRoutes } from '@/features/settings/settings.routes';
import notificationsRoutes from '@/features/notifications/notifications.routes';

const app = express();

// ===== アプリケーション初期化 =====
async function initializeApp(): Promise<void> {
  try {
    console.log('[APP] アプリケーション初期化開始');
    
    // 環境変数の検証
    validateEnvironment();
    console.log('[APP] 環境変数検証完了');
    
    // データベース接続テスト
    await testDatabaseConnection();
    console.log('[APP] データベース接続確認完了');
    
    // データベーススキーマ初期化
    await initializeDatabase();
    console.log('[APP] データベーススキーマ初期化完了');
    
    // Sequelizeモデル初期化
    await initializeModels();
    console.log('[APP] Sequelizeモデル初期化完了');
    
    console.log('[APP] アプリケーション初期化完了');
    
  } catch (error) {
    console.error('[APP] アプリケーション初期化エラー:', error);
    process.exit(1);
  }
}

// ===== ミドルウェア設定 =====

// セキュリティミドルウェア
app.use(helmet({
  crossOriginEmbedderPolicy: false, // フロントエンドとの互換性のため
  contentSecurityPolicy: false // 開発時は無効化
}));

// CORS設定
app.use(corsMiddleware);

// レート制限
const limiter = rateLimit({
  windowMs: ENV_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: ENV_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
    meta: { code: 'RATE_LIMIT_EXCEEDED' }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// ボディパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookieパーサー
app.use(cookieParser());

// デバッグ用認証情報ログ（開発環境のみ）
if (ENV_CONFIG.NODE_ENV === 'development') {
  app.use(logAuthInfo);
}

// ===== ルーティング =====

// ヘルスチェック（認証不要）
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    },
    meta: {
      service: 'ai-partner-backend',
      environment: ENV_CONFIG.NODE_ENV
    }
  });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', usersRoutes); // 管理者ユーザー管理（より具体的なパスを先に）
app.use('/api/users', usersRoutes); // 一般ユーザー機能
app.use('/api/partners', partnersRoutes); // パートナー管理機能
app.use('/api/onboarding', onboardingRoutes); // オンボーディング機能
app.use('/api/chat', chatRoutes); // チャット機能
app.use('/api/memory', memoryRoutes); // メモリシステム機能
app.use('/api/images', imagesRoutes); // 画像生成機能
app.use('/api/settings', settingsRoutes); // 設定管理機能
app.use('/api/notifications', notificationsRoutes); // 通知システム機能

// ===== エラーハンドリング =====

// 404エラーハンドラー
app.use(notFoundHandler);

// グローバルエラーハンドラー
app.use(errorHandler);

// ===== サーバー起動 =====
async function startServer(): Promise<void> {
  try {
    // アプリケーション初期化
    await initializeApp();
    
    // サーバー起動
    const server = app.listen(ENV_CONFIG.PORT, () => {
      console.log(`[APP] サーバーが起動しました`);
      console.log(`[APP] ポート: ${ENV_CONFIG.PORT}`);
      console.log(`[APP] 環境: ${ENV_CONFIG.NODE_ENV}`);
      console.log(`[APP] API URL: http://localhost:${ENV_CONFIG.PORT}`);
      console.log(`[APP] ヘルスチェック: http://localhost:${ENV_CONFIG.PORT}/health`);
    });
    
    // graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[APP] SIGTERM受信、graceful shutdownを開始');
      
      server.close(async () => {
        console.log('[APP] HTTPサーバーをクローズしました');
        
        try {
          await closeDatabaseConnection();
          await closeSequelizeConnection();
          console.log('[APP] データベース接続をクローズしました');
          process.exit(0);
        } catch (error) {
          console.error('[APP] graceful shutdownエラー:', error);
          process.exit(1);
        }
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('[APP] SIGINT受信、graceful shutdownを開始');
      
      server.close(async () => {
        console.log('[APP] HTTPサーバーをクローズしました');
        
        try {
          await closeDatabaseConnection();
          console.log('[APP] データベース接続をクローズしました');
          process.exit(0);
        } catch (error) {
          console.error('[APP] graceful shutdownエラー:', error);
          process.exit(1);
        }
      });
    });
    
  } catch (error) {
    console.error('[APP] サーバー起動エラー:', error);
    process.exit(1);
  }
}

// アプリケーション起動
if (require.main === module) {
  startServer();
}

export default app;