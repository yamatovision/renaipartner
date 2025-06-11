import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, JWTPayload, ApiResponse } from '@/types';
import { ENV_CONFIG } from '@/config/env.config';
import { UserModel, BlacklistedTokenModel } from '@/db/models';

// 認証済みリクエストの型定義
export interface AuthRequest extends Request {
  user: JWTPayload;
}

// 認証済みリクエストの型拡張
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// JWT認証ミドルウェア
export async function requireAuth(req: Request, res: Response<ApiResponse<any>>, next: NextFunction): Promise<void> {
  try {
    console.log(`[AUTH] 認証チェック開始: ${req.method} ${req.path}`);
    
    // アクセストークンの取得（複数ソースから）
    let token: string | undefined;
    
    // 1. Cookieから取得
    console.log('[AUTH] Cookieデバッグ:', {
      hasCookies: !!req.cookies,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      accessTokenExists: !!req.cookies?.accessToken,
      accessTokenLength: req.cookies?.accessToken?.length
    });
    
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      console.log('[AUTH] Cookieからトークン取得');
    }
    
    // 2. Authorizationヘッダーから取得
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('[AUTH] Authorizationヘッダーからトークン取得');
      }
    }
    
    if (!token) {
      console.log('[AUTH] トークンが見つかりません');
      res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
      return;
    }
    
    // JWTトークンの検証
    const decoded = jwt.verify(token, ENV_CONFIG.JWT_SECRET) as JWTPayload;
    console.log(`[AUTH] トークン検証成功: userId=${decoded.userId}, role=${decoded.role}`);
    
    // トークンペイロードの検証
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.log('[AUTH] 無効なトークンペイロード');
      res.status(401).json({
        success: false,
        error: '無効なトークンです',
        meta: { code: 'INVALID_TOKEN_PAYLOAD' }
      });
      return;
    }

    // ブラックリストチェック（jtiがある場合のみ）
    if (decoded.jti) {
      const isBlacklisted = await BlacklistedTokenModel.isBlacklisted(decoded.jti);
      if (isBlacklisted) {
        console.log(`[AUTH] ブラックリストトークン検出: jti=${decoded.jti}`);
        res.status(401).json({
          success: false,
          error: 'トークンは無効化されています',
          meta: { code: 'TOKEN_BLACKLISTED' }
        });
        return;
      }
    }
    
    // リクエストオブジェクトにユーザー情報を追加
    req.user = decoded;
    
    console.log(`[AUTH] 認証成功: ${decoded.email} (${decoded.role})`);
    next();
    
  } catch (error) {
    console.error('[AUTH] 認証エラー:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'トークンの有効期限が切れています',
        meta: { code: 'TOKEN_EXPIRED' }
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: '無効なトークンです',
        meta: { code: 'INVALID_TOKEN' }
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: '認証に失敗しました',
      meta: { code: 'AUTH_FAILED' }
    });
  }
}

// ロールベースアクセス制御ミドルウェア
export function requireRole(role: UserRole) {
  return (req: Request, res: Response<ApiResponse<any>>, next: NextFunction): void => {
    console.log(`[AUTH] ロール認証チェック: 必要=${role}, 現在=${req.user?.role}`);
    
    if (!req.user) {
      console.log('[AUTH] ユーザー情報が見つかりません（requireAuthが先に実行されていない可能性）');
      res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
      return;
    }
    
    if (req.user.role !== role) {
      console.log(`[AUTH] 権限不足: ${req.user.email} には ${role} 権限がありません`);
      res.status(403).json({
        success: false,
        error: 'この操作を実行する権限がありません',
        meta: { code: 'PERMISSION_DENIED', requiredRole: role, userRole: req.user.role }
      });
      return;
    }
    
    console.log(`[AUTH] ロール認証成功: ${req.user.email} (${role})`);
    next();
  };
}

// 管理者権限チェック
export const requireAdmin = requireRole(UserRole.ADMIN);

// 自分のリソースまたは管理者権限チェック
export function requireOwnershipOrAdmin(getUserIdFromParams: (req: Request) => string) {
  return async (req: Request, res: Response<ApiResponse<any>>, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '認証が必要です',
          meta: { code: 'AUTH_REQUIRED' }
        });
        return;
      }
      
      // 管理者の場合は無条件で許可
      if (req.user.role === UserRole.ADMIN) {
        console.log(`[AUTH] 管理者権限で許可: ${req.user.email}`);
        next();
        return;
      }
      
      // リソースの所有者チェック
      const targetUserId = getUserIdFromParams(req);
      
      if (req.user.userId !== targetUserId) {
        console.log(`[AUTH] リソース所有権なし: ${req.user.email} が ${targetUserId} のリソースにアクセス試行`);
        res.status(403).json({
          success: false,
          error: 'この操作を実行する権限がありません',
          meta: { code: 'RESOURCE_ACCESS_DENIED' }
        });
        return;
      }
      
      console.log(`[AUTH] リソース所有権確認成功: ${req.user.email}`);
      next();
      
    } catch (error) {
      console.error('[AUTH] 所有権チェックエラー:', error);
      res.status(500).json({
        success: false,
        error: '権限チェック中にエラーが発生しました',
        meta: { code: 'PERMISSION_CHECK_FAILED' }
      });
    }
  };
}

// オプショナル認証（認証情報があれば設定、なくてもエラーにしない）
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, ENV_CONFIG.JWT_SECRET) as JWTPayload;
        req.user = decoded;
        console.log(`[AUTH] オプショナル認証成功: ${decoded.email}`);
      } catch (error) {
        console.log('[AUTH] オプショナル認証トークン無効（続行）');
        // エラーにせず続行
      }
    }
    
    next();
    
  } catch (error) {
    console.error('[AUTH] オプショナル認証エラー（続行）:', error);
    next(); // エラーでも続行
  }
}

// デバッグ用：認証情報をログ出力
export function logAuthInfo(req: Request, res: Response, next: NextFunction): void {
  console.log('[AUTH DEBUG] Request info:', {
    method: req.method,
    path: req.path,
    hasUser: !!req.user,
    userId: req.user?.userId,
    userRole: req.user?.role,
    hasCookie: !!req.cookies?.accessToken,
    hasAuthHeader: !!req.headers.authorization
  });
  next();
}