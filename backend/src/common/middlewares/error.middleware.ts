import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';
import { ENV_CONFIG } from '@/config/env.config';

// エラーレスポンスの型
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// グローバルエラーハンドラー
export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): void {
  console.error('[ERROR] エラーが発生しました:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // デフォルトエラー情報
  let status = error.status || 500;
  let message = error.message || 'サーバー内部エラーが発生しました';
  let code = error.code || 'INTERNAL_SERVER_ERROR';
  let details = error.details;

  // PostgreSQLエラーの処理
  if ((error as any).code) {
    switch ((error as any).code) {
      case '23505': // 重複制約違反
        status = 409;
        message = 'データの重複エラーが発生しました';
        code = 'DUPLICATE_ENTRY';
        break;
      case '23503': // 外部キー制約違反
        status = 400;
        message = '関連データが見つかりません';
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      case '23502': // NOT NULL制約違反
        status = 400;
        message = '必須項目が入力されていません';
        code = 'REQUIRED_FIELD_MISSING';
        break;
      case '42P01': // テーブルが存在しない
        status = 500;
        message = 'データベーススキーマエラー';
        code = 'DATABASE_SCHEMA_ERROR';
        break;
    }
  }

  // JWTエラーの処理
  if (error.name === 'JsonWebTokenError') {
    status = 401;
    message = '認証トークンが無効です';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    status = 401;
    message = '認証トークンの有効期限が切れています';
    code = 'TOKEN_EXPIRED';
  }

  // バリデーションエラーの処理
  if (error.name === 'ValidationError') {
    status = 400;
    // オリジナルのメッセージを保持
    message = error.message;
    code = 'VALIDATION_ERROR';
    // ValidationErrorの詳細をログに出力
    if ((error as any).validationErrors) {
      console.error('[ERROR] バリデーションエラー詳細:', (error as any).validationErrors);
      details = (error as any).validationErrors;
    }
  }

  // 本番環境では詳細なエラー情報を隠す
  if (ENV_CONFIG.NODE_ENV === 'production' && status === 500) {
    message = 'サーバー内部エラーが発生しました';
    details = undefined;
  }

  const errorResponse: ApiResponse<any> = {
    success: false,
    error: message,
    meta: {
      code,
      ...(details && { details }),
      ...(ENV_CONFIG.NODE_ENV === 'development' && { 
        stack: error.stack,
        originalError: error.message 
      })
    }
  };

  res.status(status).json(errorResponse);
}

// 404エラーハンドラー
export function notFoundHandler(
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): void {
  console.log(`[404] 存在しないエンドポイント: ${req.method} ${req.url}`);
  
  res.status(404).json({
    success: false,
    error: 'エンドポイントが見つかりません',
    meta: {
      code: 'ENDPOINT_NOT_FOUND',
      method: req.method,
      path: req.url
    }
  });
}

// 非同期エラーをキャッチするラッパー
export function asyncHandler<T extends any[]>(
  fn: (req: Request, res: Response, next: NextFunction, ...args: T) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction, ...args: T) => {
    Promise.resolve(fn(req, res, next, ...args)).catch(next);
  };
}

// ヘルスチェックエラー
export class HealthCheckError extends Error {
  constructor(component: string, details: any) {
    super(`Health check failed for ${component}`);
    this.name = 'HealthCheckError';
    (this as any).code = 'HEALTH_CHECK_FAILED';
    (this as any).details = details;
  }
}

// 認証エラー
export class AuthenticationError extends Error {
  constructor(message: string = '認証に失敗しました') {
    super(message);
    this.name = 'AuthenticationError';
    (this as any).status = 401;
    (this as any).code = 'AUTHENTICATION_FAILED';
  }
}

// 認可エラー
export class AuthorizationError extends Error {
  constructor(message: string = 'この操作を実行する権限がありません') {
    super(message);
    this.name = 'AuthorizationError';
    (this as any).status = 403;
    (this as any).code = 'AUTHORIZATION_FAILED';
  }
}

// バリデーションエラー
export class ValidationError extends Error {
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    (this as any).status = 400;
    (this as any).code = 'VALIDATION_ERROR';
    (this as any).details = details;
  }
}

// リソースが見つからないエラー
export class NotFoundError extends Error {
  constructor(resource: string = 'リソース') {
    super(`${resource}が見つかりません`);
    this.name = 'NotFoundError';
    (this as any).status = 404;
    (this as any).code = 'RESOURCE_NOT_FOUND';
  }
}

// 競合エラー
export class ConflictError extends Error {
  constructor(message: string = 'データの競合が発生しました') {
    super(message);
    this.name = 'ConflictError';
    (this as any).status = 409;
    (this as any).code = 'RESOURCE_CONFLICT';
  }
}

// サービスエラー
export class ServiceError extends Error {
  constructor(message: string = 'サービスエラーが発生しました', status: number = 500) {
    super(message);
    this.name = 'ServiceError';
    (this as any).status = status;
    (this as any).code = 'SERVICE_ERROR';
  }
}