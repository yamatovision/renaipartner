import { Router } from 'express';
import { UsersController } from './users.controller';
import { 
  requireAuth, 
  requireAdmin, 
  requireOwnershipOrAdmin 
} from '@/common/middlewares/auth.middleware';

const router = Router();

// ヘルスチェック（認証不要）
router.get('/health', UsersController.healthCheck);

// ===== 静的ルート（動的ルートより前に配置） =====

// ユーザー統計情報取得（管理者のみ）
router.get('/stats', requireAuth, requireAdmin, UsersController.getUserStats);

// メールアドレス重複チェック（管理者のみ）
router.get('/check-email', requireAuth, requireAdmin, UsersController.checkEmailExists);

// 自分のプロフィール取得（認証必要）
router.get('/profile', requireAuth, UsersController.getMyProfile);

// データエクスポート（認証必要）
router.get('/export', requireAuth, UsersController.exportUserData);

// ===== 管理者専用エンドポイント =====

// ユーザー作成（管理者のみ）
router.post('/', requireAuth, requireAdmin, UsersController.createUser);

// ユーザー一覧取得（管理者のみ）
router.get('/', requireAuth, requireAdmin, UsersController.getUsers);

// ===== ユーザー自身のプロフィール管理 =====

// 自分のプロフィール更新（認証必要）
router.put('/profile', requireAuth, UsersController.updateProfile);

// パスワード変更（認証必要）
router.put('/password', requireAuth, UsersController.changePassword);

// 自分のアカウント削除（認証必要）
router.delete('/profile', requireAuth, UsersController.deleteMyAccount);

// ===== 動的ルート（静的ルートより後に配置） =====

// ユーザー詳細取得（管理者または本人）
router.get('/:id', requireAuth, requireOwnershipOrAdmin(req => req.params.id), UsersController.getUserById);

// ユーザーアクティベート（管理者のみ）
router.put('/:id/activate', requireAuth, requireAdmin, UsersController.activateUser);

// ユーザー無効化（管理者のみ）
router.put('/:id/deactivate', requireAuth, requireAdmin, UsersController.deactivateUser);

export default router;