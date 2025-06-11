import { body, param, query } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CONSTANTS } from '../../types';

export const chatValidators = {
  /**
   * メッセージ送信のバリデーション
   */
  sendMessage: [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('メッセージは必須です')
      .isLength({ max: CONSTANTS.MAX_MESSAGE_LENGTH })
      .withMessage(`メッセージは${CONSTANTS.MAX_MESSAGE_LENGTH}文字以内で入力してください`),
    
    body('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    body('context')
      .optional()
      .isObject()
      .withMessage('コンテキストはオブジェクト形式で指定してください')
  ],

  /**
   * メッセージ履歴取得のバリデーション
   */
  getMessages: [
    query('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('リミットは1-100の間で指定してください')
      .toInt(),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('オフセットは0以上で指定してください')
      .toInt(),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('開始日付は有効なISO8601形式で指定してください')
      .toDate(),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('終了日付は有効なISO8601形式で指定してください')
      .toDate()
  ],

  /**
   * タイピング状態のバリデーション
   */
  typing: [
    body('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    body('isTyping')
      .isBoolean()
      .withMessage('タイピング状態はboolean値で指定してください'),
    
    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('プレビューメッセージは500文字以内で指定してください')
  ],

  /**
   * 感情状態取得のバリデーション
   */
  getEmotion: [
    query('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください')
  ],

  /**
   * 画像生成リクエストのバリデーション
   */
  generateImage: [
    body('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    body('context')
      .trim()
      .notEmpty()
      .withMessage('コンテキストは必須です')
      .isLength({ max: 500 })
      .withMessage('コンテキストは500文字以内で指定してください'),
    
    body('emotion')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('感情は50文字以内で指定してください'),
    
    body('background')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('背景は100文字以内で指定してください'),
    
    body('clothing')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('服装は100文字以内で指定してください'),
    
    body('prompt')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('カスタムプロンプトは1000文字以内で指定してください')
  ]
};

/**
 * カスタムバリデーター: 日付範囲チェック
 */
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (start >= end) {
      res.status(400).json({
        success: false,
        error: '開始日付は終了日付より前である必要があります'
      });
      return;
    }
    
    // 最大取得期間を30日に制限
    const maxDays = 30;
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays > maxDays) {
      res.status(400).json({
        success: false,
        error: `取得期間は最大${maxDays}日までです`
      });
      return;
    }
  }
  
  next();
};

/**
 * カスタムバリデーター: メッセージ内容チェック
 */
export const validateMessageContent = (req: Request, res: Response, next: NextFunction): void => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      error: 'メッセージは文字列である必要があります'
    });
    return;
  }
  
  // 空白のみのメッセージをチェック
  if (message.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'メッセージは空白のみにはできません'
    });
    return;
  }
  
  // 禁止ワードチェック（基本的なもの）
  const prohibitedWords = ['spam', 'test spam', 'テストスパム'];
  const lowerMessage = message.toLowerCase();
  
  for (const word of prohibitedWords) {
    if (lowerMessage.includes(word.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: '不適切な内容が含まれています'
      });
      return;
    }
  }
  
  next();
};

export default chatValidators;