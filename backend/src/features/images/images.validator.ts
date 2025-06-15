import { body, param, query } from 'express-validator';
import type { ValidationChain } from 'express-validator';

/**
 * 画像生成API用バリデーションルール
 * Leonardo AI連携と一貫性保持のための入力検証
 */

/**
 * アバター画像生成バリデーション (POST /api/images/generate)
 */
export const validateAvatarGeneration: ValidationChain[] = [
  body('partnerId')
    .isUUID()
    .withMessage('パートナーIDは有効なUUID形式である必要があります'),
  
  body('prompt')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('カスタムプロンプトは2000文字以下で入力してください'),
  
  body('useAppearance')
    .optional()
    .isBoolean()
    .withMessage('外見設定使用フラグは真偽値で指定してください'),
  
  body('context')
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('文脈は1文字以上500文字以下で入力してください'),
  
  body('emotion')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('感情は50文字以下で入力してください'),
  
  body('background')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('背景は100文字以下で入力してください'),
  
  body('clothing')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('服装は100文字以下で入力してください'),
  
  body('referenceImageId')
    .optional()
    .isUUID()
    .withMessage('参照画像IDは有効なUUID形式である必要があります'),
  
  body('modelId')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('モデルIDは100文字以下で入力してください'),
  
  body('width')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('幅は256-2048の間で指定してください'),
  
  body('height')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('高さは256-2048の間で指定してください'),
  
  body('guidanceScale')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('ガイダンススケールは1-20の間で指定してください'),
  
  body('numImages')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('生成画像数は1-4の間で指定してください'),
];

/**
 * チャット用画像生成バリデーション (POST /api/images/generate-chat)
 */
export const validateChatImageGeneration: ValidationChain[] = [
  body('partnerId')
    .isUUID()
    .withMessage('パートナーIDは有効なUUID形式である必要があります'),
  
  body('message')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('メッセージは1文字以上1000文字以下で入力してください'),
  
  body('emotion')
    .optional()
    .isString()
    .isIn(['happy', 'sad', 'angry', 'surprised', 'neutral', 'excited', 'thoughtful', 'romantic', 'calm'])
    .withMessage('感情は指定された値の中から選択してください'),
  
  body('situation')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('シチュエーションは500文字以下で入力してください'),
  
  body('useReference')
    .optional()
    .isBoolean()
    .withMessage('参考画像使用フラグは真偽値で指定してください'),
  
  body('width')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('幅は256-2048の間で指定してください'),
  
  body('height')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('高さは256-2048の間で指定してください'),
];

/**
 * 背景画像一覧取得バリデーション (GET /api/images/backgrounds)
 */
export const validateBackgroundList: ValidationChain[] = [
  query('category')
    .optional()
    .isString()
    .isIn(['nature', 'indoor', 'fantasy', 'modern', 'romantic'])
    .withMessage('カテゴリは指定された値の中から選択してください'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('取得件数は1-100の間で指定してください'),
];

/**
 * 画像履歴取得バリデーション (GET /api/images/history/:partnerId)
 */
export const validateImageHistory: ValidationChain[] = [
  param('partnerId')
    .isUUID()
    .withMessage('パートナーIDは有効なUUID形式である必要があります'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('取得件数は1-100の間で指定してください'),
  
  query('minConsistency')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('最小一貫性スコアは0-1の間で指定してください'),
];

/**
 * 画像削除バリデーション (DELETE /api/images/:imageId)
 */
export const validateImageDeletion: ValidationChain[] = [
  param('imageId')
    .isUUID()
    .withMessage('画像IDは有効なUUID形式である必要があります'),
];

/**
 * 画像統計取得バリデーション (GET /api/images/stats/:partnerId)
 */
export const validateImageStats: ValidationChain[] = [
  param('partnerId')
    .isUUID()
    .withMessage('パートナーIDは有効なUUID形式である必要があります'),
];

/**
 * オンボーディング用画像生成バリデーション (POST /api/images/generate-onboarding)
 */
export const validateOnboardingImageGeneration: ValidationChain[] = [
  // partnerIdは不要（オンボーディング中のため）
  
  body('prompt')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('カスタムプロンプトは2000文字以下で入力してください'),
  
  body('context')
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('文脈は1文字以上500文字以下で入力してください'),
  
  body('emotion')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('感情は50文字以下で入力してください'),
  
  body('background')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('背景は100文字以下で入力してください'),
  
  body('clothing')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('服装は100文字以下で入力してください'),
  
  body('modelId')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('モデルIDは100文字以下で入力してください'),
  
  body('width')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('幅は256-2048の間で指定してください'),
  
  body('height')
    .optional()
    .isInt({ min: 256, max: 2048 })
    .withMessage('高さは256-2048の間で指定してください'),
  
  body('guidanceScale')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('ガイダンススケールは1-20の間で指定してください'),
  
  body('numImages')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('生成画像数は1-4の間で指定してください'),
];

/**
 * Leonardo AI設定バリデーション（共通設定項目）
 */
export const LEONARDO_AI_CONSTRAINTS = {
  MAX_PROMPT_LENGTH: 2000,
  SUPPORTED_EMOTIONS: ['happy', 'sad', 'angry', 'surprised', 'neutral', 'excited', 'thoughtful', 'romantic'],
  SUPPORTED_BACKGROUNDS: ['nature', 'indoor', 'fantasy', 'modern', 'romantic'],
  IMAGE_DIMENSIONS: {
    MIN: 256,
    MAX: 2048,
    DEFAULTS: {
      WIDTH: 512,
      HEIGHT: 768, // ポートレート向け
    }
  },
  GENERATION_LIMITS: {
    MAX_IMAGES_PER_REQUEST: 4,
    MAX_REQUESTS_PER_MINUTE: 10,
    MAX_REQUESTS_PER_HOUR: 100,
  },
  ANIME_MODELS: {
    // Leonardo AIのアニメ風モデルID（実際の値）
    DEFAULT_ANIME_MODEL: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8', // Leonardo Anime XL
    ALTERNATIVE_MODELS: ['1aa0f478-51be-4efd-94e8-76bfc8f533af', 'e316348f-7773-490e-adcd-46757c738eb7'], // Anime Pastel Dream, Absolute Reality v1.6
  }
} as const;

/**
 * バリデーションエラーメッセージの統一
 */
export const IMAGE_VALIDATION_MESSAGES = {
  INVALID_PARTNER_ID: 'パートナーIDが無効です',
  INVALID_CONTEXT: '文脈の入力が無効です',
  INVALID_EMOTION: '感情の指定が無効です',
  INVALID_DIMENSIONS: '画像サイズが無効です',
  INVALID_PROMPT: 'プロンプトが無効です',
  INVALID_MODEL_ID: 'モデルIDが無効です',
  RATE_LIMIT_EXCEEDED: 'API呼び出し制限を超過しました',
  GENERATION_FAILED: '画像生成に失敗しました',
  CONSISTENCY_CHECK_FAILED: '一貫性チェックに失敗しました',
} as const;