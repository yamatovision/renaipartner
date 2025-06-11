import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest,
  RefreshTokenResponse,
  PasswordChangeRequest,
  ApiResponse,
  User 
} from '@/types';
import { 
  validateRequest, 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema 
} from './auth.validator';
import { asyncHandler } from '@/common/middlewares/error.middleware';

export class AuthController {
  // ログイン
  static login = asyncHandler(async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
    console.log(`[AUTH] ログインリクエスト: ${req.body.email || 'Unknown'}`);
    
    // バリデーション
    const loginData = validateRequest(loginSchema, req.body);
    
    // ログイン処理
    const result = await AuthService.login(loginData);
    
    // Cookieにトークンを設定
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };
    
    // アクセストークン（短期間）
    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15分
    });
    
    // リフレッシュトークン（長期間）
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30日
    });
    
    console.log(`[AUTH] ログイン成功レスポンス: ${result.user.email}`);
    
    res.json({
      success: true,
      data: result,
      meta: {
        message: 'ログインに成功しました',
        userId: result.user.id
      }
    });
  });

  // トークンリフレッシュ
  static refresh = asyncHandler(async (req: Request, res: Response<ApiResponse<RefreshTokenResponse>>): Promise<Response | void> => {
    console.log('[AUTH] トークンリフレッシュリクエスト');
    
    // リフレッシュトークンの取得（複数ソースから）
    let refreshToken: string;
    
    // 1. Cookieから取得
    if (req.cookies?.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }
    // 2. リクエストボディから取得
    else if (req.body?.refreshToken) {
      const refreshData = validateRequest(refreshTokenSchema, req.body);
      refreshToken = refreshData.refreshToken;
    }
    else {
      return res.status(401).json({
        success: false,
        error: 'リフレッシュトークンが必要です',
        meta: { code: 'REFRESH_TOKEN_REQUIRED' }
      });
    }
    
    // トークンリフレッシュ処理
    const result = await AuthService.refreshToken({ refreshToken });
    
    // 新しいトークンをCookieに設定
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };
    
    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15分
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30日
    });
    
    console.log('[AUTH] トークンリフレッシュ成功');
    
    res.json({
      success: true,
      data: result,
      meta: {
        message: 'トークンを更新しました'
      }
    });
  });

  // ログアウト
  static logout = asyncHandler(async (req: Request, res: Response<ApiResponse<null>>) => {
    console.log(`[AUTH] ログアウトリクエスト: userId=${req.user?.userId}`);
    
    if (req.user?.userId) {
      // アクセストークンを取得
      let accessToken: string | undefined;
      if (req.cookies?.accessToken) {
        accessToken = req.cookies.accessToken;
      } else if (req.headers.authorization?.startsWith('Bearer ')) {
        accessToken = req.headers.authorization.substring(7);
      }
      
      // データベースからリフレッシュトークンを削除し、アクセストークンをブラックリストに追加
      await AuthService.logout(req.user.userId, accessToken);
    }
    
    // Cookieをクリア
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    console.log('[AUTH] ログアウト完了');
    
    res.json({
      success: true,
      data: null,
      meta: {
        message: 'ログアウトしました'
      }
    });
  });

  // 現在のユーザー情報取得
  static getCurrentUser = asyncHandler(async (req: Request, res: Response<ApiResponse<User>>): Promise<Response | void> => {
    console.log(`[AUTH] 現在のユーザー情報取得: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    const user = await AuthService.getCurrentUser(req.user.userId);
    
    console.log(`[AUTH] ユーザー情報取得成功: ${user.email}`);
    
    res.json({
      success: true,
      data: user,
      meta: {
        message: 'ユーザー情報を取得しました'
      }
    });
  });

  // パスワード変更
  static changePassword = asyncHandler(async (req: Request, res: Response<ApiResponse<null>>): Promise<Response | void> => {
    console.log(`[AUTH] パスワード変更リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const passwordData = validateRequest(changePasswordSchema, req.body);
    
    // パスワード変更処理
    await AuthService.changePassword(
      req.user.userId,
      passwordData.currentPassword,
      passwordData.newPassword
    );
    
    // セキュリティのため、Cookieをクリア（再ログインが必要）
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    console.log(`[AUTH] パスワード変更成功: userId=${req.user.userId}`);
    
    res.json({
      success: true,
      data: null,
      meta: {
        message: 'パスワードを変更しました。再度ログインしてください。'
      }
    });
  });

  // トークン検証（開発用）
  static verifyToken = asyncHandler(async (req: Request, res: Response<ApiResponse<{ valid: boolean; user?: any }>>): Promise<Response | void> => {
    console.log('[AUTH] トークン検証リクエスト（開発用）');
    
    if (!req.user) {
      return res.json({
        success: true,
        data: { valid: false },
        meta: {
          message: 'トークンが無効です'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          userId: req.user.userId,
          email: req.user.email,
          role: req.user.role,
          exp: req.user.exp,
          iat: req.user.iat
        }
      },
      meta: {
        message: 'トークンは有効です'
      }
    });
  });

  // ヘルスチェック（認証不要）
  static healthCheck = asyncHandler(async (req: Request, res: Response<ApiResponse<{ status: string; timestamp: string }>>) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      meta: {
        service: 'auth',
        version: '1.0.0'
      }
    });
  });
}