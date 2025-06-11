import { body, param, query } from 'express-validator';
import { MemoryType } from '@/types';

export const memoryValidators = {
  /**
   * 会話要約作成のバリデーション（API 6.1）
   */
  createSummary: [
    body('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    body('messageIds')
      .isArray({ min: 1 })
      .withMessage('メッセージIDの配列は必須です（最低1つ）'),
    
    body('messageIds.*')
      .isUUID()
      .withMessage('有効なメッセージIDを指定してください'),
    
    body('summaryType')
      .optional()
      .isIn(['daily', 'weekly', 'important'])
      .withMessage('要約タイプはdaily、weekly、importantのいずれかです')
  ],

  /**
   * メモリ検索のバリデーション（API 6.2）
   */
  searchMemories: [
    body('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    body('query')
      .trim()
      .notEmpty()
      .withMessage('検索クエリは必須です')
      .isLength({ max: 500 })
      .withMessage('検索クエリは500文字以内で入力してください'),
    
    body('memoryTypes')
      .optional()
      .isArray()
      .withMessage('メモリタイプは配列で指定してください'),
    
    body('memoryTypes.*')
      .optional()
      .isIn(Object.values(MemoryType))
      .withMessage('有効なメモリタイプを指定してください'),
    
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('検索結果の上限は1から100の間で指定してください'),
    
    body('minImportance')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('最低重要度は0から10の間で指定してください')
  ],

  /**
   * エピソード記憶取得のバリデーション（API 6.3）
   */
  getEpisodes: [
    param('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('取得件数は1から50の間で指定してください'),
    
    query('minEmotionalWeight')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('最低感情重みは0から10の間で指定してください'),
    
    query('tags')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch {
            throw new Error('タグはJSON配列形式で指定してください');
          }
        }
        if (Array.isArray(value)) {
          return true;
        }
        throw new Error('タグは配列またはJSON文字列で指定してください');
      }),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('開始日はISO8601形式で指定してください'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('終了日はISO8601形式で指定してください')
      .custom((value, { req }) => {
        if (req.query?.startDate && value) {
          const start = new Date(req.query.startDate as string);
          const end = new Date(value);
          if (end < start) {
            throw new Error('終了日は開始日より後の日付を指定してください');
          }
        }
        return true;
      })
  ],

  /**
   * 関係性メトリクス取得のバリデーション（API 6.4）
   */
  getRelationships: [
    param('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    query('includeHistory')
      .optional()
      .isBoolean()
      .withMessage('履歴を含めるかは真偽値で指定してください'),
    
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year', 'all'])
      .withMessage('期間はweek、month、quarter、year、allのいずれかです')
  ],

  /**
   * 継続話題取得のバリデーション（API 6.5）
   */
  getTopics: [
    param('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('取得件数は1から20の間で指定してください'),
    
    query('status')
      .optional()
      .isIn(['active', 'resolved', 'dormant', 'all'])
      .withMessage('ステータスはactive、resolved、dormant、allのいずれかです'),
    
    query('minImportance')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('最低重要度は0から10の間で指定してください')
  ],

  /**
   * パートナーIDパラメータの基本バリデーション
   */
  partnerIdParam: [
    param('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください')
  ],

  /**
   * カスタムメモリ作成バリデーション（内部使用）
   */
  createMemory: [
    body('partnerId')
      .notEmpty()
      .withMessage('パートナーIDは必須です')
      .isUUID()
      .withMessage('有効なパートナーIDを指定してください'),
    
    body('type')
      .isIn(Object.values(MemoryType))
      .withMessage('有効なメモリタイプを指定してください'),
    
    body('content')
      .trim()
      .notEmpty()
      .withMessage('メモリ内容は必須です')
      .isLength({ max: 2000 })
      .withMessage('メモリ内容は2000文字以内で入力してください'),
    
    body('importance')
      .isFloat({ min: 0, max: 10 })
      .withMessage('重要度は0から10の間で指定してください'),
    
    body('emotionalWeight')
      .isFloat({ min: -10, max: 10 })
      .withMessage('感情重みは-10から10の間で指定してください'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('タグは配列で指定してください'),
    
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('各タグは1から50文字の間で指定してください'),
    
    body('relatedPeople')
      .optional()
      .isArray()
      .withMessage('関連する人物は配列で指定してください'),
    
    body('relatedPeople.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('人物名は1から100文字の間で指定してください')
  ]
};

/**
 * バリデーション結果チェック用のミドルウェア
 */
export const handleValidationErrors = (req: any, res: any, next: any) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.error('[Memory.validator] バリデーションエラー:', {
      endpoint: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      params: req.params,
      query: req.query
    });
    
    return res.status(400).json({
      success: false,
      message: 'バリデーションエラーが発生しました',
      errors: errors.array().map((error: any) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

export default memoryValidators;