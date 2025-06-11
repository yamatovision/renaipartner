import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { 
  User, 
  UserCreate, 
  PaginatedResponse,
  ApiResponse 
} from '@/types';
import { 
  validateRequest,
  createUserSchema,
  getUsersQuerySchema,
  userIdSchema,
  updateProfileSchema,
  checkEmailSchema,
  changePasswordSchema
} from './users.validator';
import { asyncHandler } from '@/common/middlewares/error.middleware';

export class UsersController {
  // ユーザー作成（管理者機能）
  static createUser = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>) => {
    console.log(`[USERS] ユーザー作成リクエスト: ${req.body.email || 'Unknown'}`);
    
    // バリデーション
    const userData = validateRequest(createUserSchema, req.body);
    
    // ユーザー作成
    const newUser = await UsersService.createUser(userData);
    
    console.log(`[USERS] ユーザー作成成功レスポンス: ${newUser.email}`);
    
    res.status(201).json({
      success: true,
      data: newUser,
      meta: {
        message: 'ユーザーを作成しました',
        userId: newUser.id,
        initialPassword: userData.password || 'aikakumei'
      }
    });
  });

  // ユーザー一覧取得（管理者機能）
  static getUsers = asyncHandler(async (req: Request, res: Response<ApiResponse<PaginatedResponse<User>>>) => {
    console.log('[USERS] ユーザー一覧取得リクエスト');
    
    // バリデーション
    const queryParams = validateRequest(getUsersQuerySchema, req.query);
    
    // ユーザー一覧取得
    const result = await UsersService.getUsers(queryParams);
    
    console.log(`[USERS] ユーザー一覧取得成功: ${result.items.length}件/${result.total}件`);
    
    res.json({
      success: true,
      data: result,
      meta: {
        message: 'ユーザー一覧を取得しました',
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  });

  // ユーザー詳細取得
  static getUserById = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>) => {
    console.log(`[USERS] ユーザー詳細取得リクエスト: userId=${req.params.id}`);
    
    // バリデーション
    const { id } = validateRequest(userIdSchema, req.params);
    
    // ユーザー詳細取得
    const user = await UsersService.getUserById(id);
    
    console.log(`[USERS] ユーザー詳細取得成功: ${user.email}`);
    
    res.json({
      success: true,
      data: user,
      meta: {
        message: 'ユーザー情報を取得しました'
      }
    });
  });

  // ユーザーアクティベート（管理者機能）
  static activateUser = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>) => {
    console.log(`[USERS] ユーザーアクティベートリクエスト: userId=${req.params.id}`);
    
    // バリデーション
    const { id } = validateRequest(userIdSchema, req.params);
    
    // ユーザーアクティベート
    const user = await UsersService.activateUser(id);
    
    console.log(`[USERS] ユーザーアクティベート成功: ${user.email}`);
    
    res.json({
      success: true,
      data: user,
      meta: {
        message: 'ユーザーをアクティベートしました'
      }
    });
  });

  // ユーザー無効化（管理者機能）
  static deactivateUser = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>) => {
    console.log(`[USERS] ユーザー無効化リクエスト: userId=${req.params.id}`);
    
    // バリデーション
    const { id } = validateRequest(userIdSchema, req.params);
    
    // ユーザー無効化
    const user = await UsersService.deactivateUser(id);
    
    console.log(`[USERS] ユーザー無効化成功: ${user.email}`);
    
    res.json({
      success: true,
      data: user,
      meta: {
        message: 'ユーザーを無効化しました'
      }
    });
  });

  // ユーザー統計情報取得（管理者機能）
  static getUserStats = asyncHandler(async (req: Request, res: Response<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    todayRegistrations: number;
  }>>) => {
    console.log('[USERS] ユーザー統計情報取得リクエスト');
    
    // 統計情報取得
    const stats = await UsersService.getUserStats();
    
    console.log('[USERS] ユーザー統計情報取得成功:', stats);
    
    res.json({
      success: true,
      data: stats,
      meta: {
        message: '統計情報を取得しました',
        timestamp: new Date().toISOString()
      }
    });
  });

  // メールアドレス重複チェック
  static checkEmailExists = asyncHandler(async (req: Request, res: Response<ApiResponse<{ exists: boolean }>>) => {
    console.log(`[USERS] メールアドレス重複チェックリクエスト: ${req.query.email || 'Unknown'}`);
    
    // バリデーション
    const { email } = validateRequest(checkEmailSchema, req.query);
    
    // 重複チェック
    const exists = await UsersService.checkEmailExists(email);
    
    console.log(`[USERS] メールアドレス重複チェック結果: ${email} => ${exists ? '重複あり' : '利用可能'}`);
    
    res.json({
      success: true,
      data: { exists },
      meta: {
        message: exists ? 'このメールアドレスは既に使用されています' : 'このメールアドレスは利用可能です',
        email
      }
    });
  });

  // プロフィール更新
  static updateProfile = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>): Promise<Response | void> => {
    console.log(`[USERS] プロフィール更新リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const profileData = validateRequest(updateProfileSchema, req.body);
    
    // プロフィール更新
    const updatedUser = await UsersService.updateProfile(req.user.userId, profileData);
    
    console.log(`[USERS] プロフィール更新成功: ${updatedUser.email}`);
    
    res.json({
      success: true,
      data: updatedUser,
      meta: {
        message: 'プロフィールを更新しました'
      }
    });
  });

  // 自分の情報取得
  static getMyProfile = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>): Promise<Response | void> => {
    console.log(`[USERS] 自分の情報取得リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // 自分の情報取得
    const user = await UsersService.getUserById(req.user.userId);
    
    console.log(`[USERS] 自分の情報取得成功: ${user.email}`);
    
    res.json({
      success: true,
      data: user,
      meta: {
        message: 'プロフィール情報を取得しました'
      }
    });
  });

  // アカウント削除（論理削除）
  static deleteMyAccount = asyncHandler(async (req: Request, res: Response<ApiResponse<null>>): Promise<Response | void> => {
    console.log(`[USERS] アカウント削除リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // アカウント削除（論理削除）
    await UsersService.deleteUser(req.user.userId);
    
    // Cookieをクリア
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    console.log(`[USERS] アカウント削除成功: userId=${req.user.userId}`);
    
    res.json({
      success: true,
      data: null,
      meta: {
        message: 'アカウントを削除しました'
      }
    });
  });

  // パスワード変更
  static changePassword = asyncHandler(async (req: Request, res: Response<ApiResponse<null>>): Promise<Response | void> => {
    console.log(`[USERS] パスワード変更リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const passwordData = validateRequest(changePasswordSchema, req.body);
    
    // パスワード変更
    await UsersService.changePassword(req.user.userId, passwordData.currentPassword, passwordData.newPassword);
    
    console.log(`[USERS] パスワード変更成功: userId=${req.user.userId}`);
    
    res.json({
      success: true,
      data: null,
      meta: {
        message: 'パスワードを変更しました'
      }
    });
  });

  // データエクスポート
  static exportUserData = asyncHandler(async (req: Request, res: Response<ApiResponse<any>>): Promise<Response | void> => {
    console.log(`[USERS] データエクスポートリクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // データエクスポート
    const exportData = await UsersService.exportUserData(req.user.userId);
    
    console.log(`[USERS] データエクスポート成功: userId=${req.user.userId}`);
    
    res.json({
      success: true,
      data: exportData,
      meta: {
        message: 'データをエクスポートしました',
        exportedAt: new Date().toISOString()
      }
    });
  });

  // ヘルスチェック
  static healthCheck = asyncHandler(async (req: Request, res: Response<ApiResponse<{ status: string; timestamp: string }>>) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      meta: {
        service: 'users',
        version: '1.0.0'
      }
    });
  });
}