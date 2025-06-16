import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth, optionalAuth } from '@/common/middlewares/auth.middleware';

const router = Router();

// ヘルスチェック（認証不要）
router.get('/health', AuthController.healthCheck);

// ログイン（認証不要）
router.post('/login', AuthController.login);

// トークンリフレッシュ（認証不要）
router.post('/refresh', AuthController.refresh);

// ログアウト（認証不要 - リフレッシュトークンで処理）
router.post('/logout', AuthController.logout);

// 現在のユーザー情報取得（認証必要）
router.get('/me', requireAuth, AuthController.getCurrentUser);

// パスワード変更（認証必要）
router.put('/change-password', requireAuth, AuthController.changePassword);

// トークン検証（開発用、オプショナル認証）
router.get('/verify', optionalAuth, AuthController.verifyToken);

export default router;