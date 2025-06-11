import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '@/types';

/**
 * バリデーションエラーチェックミドルウェア
 * express-validatorの検証結果をチェックし、エラーがある場合は400エラーを返す
 */
export function validateRequest(
  req: Request,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('[VALIDATION] バリデーションエラー:', {
      path: req.path,
      errors: errors.array()
    });
    
    res.status(400).json({
      success: false,
      error: 'バリデーションエラー',
      meta: {
        errors: errors.array()
      }
    });
    return;
  }
  
  next();
}