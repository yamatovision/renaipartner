import { Router } from 'express';
import ChatController from './chat.controller';
import { requireAuth } from '../../common/middlewares/auth.middleware';
import { chatValidators, validateDateRange, validateMessageContent } from './chat.validator';

const router = Router();

/**
 * チャット機能のルート定義
 * 全てのエンドポイントに認証が必要
 */

// ===== メッセージ関連 =====

/**
 * メッセージ送信
 * POST /api/chat/messages
 */
router.post('/messages',
  [requireAuth, ...chatValidators.sendMessage, validateMessageContent],
  ChatController.sendMessage
);

/**
 * メッセージ履歴取得
 * GET /api/chat/messages?partnerId=xxx&limit=20&offset=0&startDate=&endDate=
 */
router.get('/messages',
  [requireAuth, ...chatValidators.getMessages, validateDateRange],
  ChatController.getMessages
);

// ===== リアルタイム機能 =====

/**
 * タイピング状態通知
 * POST /api/chat/typing
 */
router.post('/typing',
  [requireAuth, ...chatValidators.typing],
  ChatController.handleTyping
);

/**
 * 感情状態取得
 * GET /api/chat/emotion?partnerId=xxx
 */
router.get('/emotion',
  [requireAuth, ...chatValidators.getEmotion],
  ChatController.getEmotion
);

// ===== 画像生成関連 =====

/**
 * チャット用画像生成
 * POST /api/chat/generate-image
 */
router.post('/generate-image',
  [requireAuth, ...chatValidators.generateImage],
  ChatController.generateImage
);

// ===== 統計・デバッグ用 =====

/**
 * チャット統計取得（デバッグ用）
 * GET /api/chat/stats?partnerId=xxx
 */
router.get('/stats',
  requireAuth,
  ChatController.getStats
);

// ===== エラーハンドリング =====

/**
 * チャット関連のエラーハンドリングミドルウェア
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error(`[${new Date().toISOString()}] ❌ チャットAPI エラー:`, {
    url: req.url,
    method: req.method,
    error: error.message,
    stack: error.stack,
    userId: req.user?.userId,
    body: req.body
  });

  // OpenAI APIエラーの場合
  if (error.name === 'OpenAIError') {
    return res.status(503).json({
      success: false,
      error: 'AI応答サービスが一時的に利用できません。しばらく待ってから再試行してください。',
      code: 'OPENAI_ERROR'
    });
  }

  // データベース接続エラーの場合
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      error: 'データベースに接続できません。しばらく待ってから再試行してください。',
      code: 'DATABASE_ERROR'
    });
  }

  // バリデーションエラーの場合
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '入力データが無効です。',
      details: error.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // 認証エラーの場合
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: '認証が必要です。ログインしてから再試行してください。',
      code: 'AUTH_ERROR'
    });
  }

  // レート制限エラーの場合
  if (error.name === 'TooManyRequestsError') {
    return res.status(429).json({
      success: false,
      error: 'リクエスト数が上限に達しました。しばらく待ってから再試行してください。',
      code: 'RATE_LIMIT_ERROR',
      retryAfter: 60
    });
  }

  // その他の予期しないエラー
  res.status(500).json({
    success: false,
    error: 'チャット機能でエラーが発生しました。サポートにお問い合わせください。',
    code: 'INTERNAL_ERROR'
  });
});

export default router;