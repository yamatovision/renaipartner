import { body, param, ValidationChain } from 'express-validator';
import { Gender, PersonalityType, SpeechStyle } from '../../types';

export const onboardingValidator = {
  /**
   * オンボーディング開始のバリデーション
   */
  start: (): ValidationChain[] => [
    // 開始時は特別な入力は不要
  ],

  /**
   * 進捗取得のバリデーション
   */
  getProgress: (): ValidationChain[] => [
    // 認証ミドルウェアでユーザーIDが設定されているため、追加のバリデーションは不要
  ],

  /**
   * 進捗更新のバリデーション
   */
  updateProgress: (): ValidationChain[] => [
    body('step')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('ステップは1から10の間で指定してください'),
    
    body('currentStep')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('現在のステップは1から10の間で指定してください'),
    
    body('completedSteps')
      .optional()
      .isArray()
      .withMessage('完了したステップは配列で指定してください')
      .custom((value: number[]) => {
        if (!Array.isArray(value)) return true;
        return value.every(step => Number.isInteger(step) && step >= 1 && step <= 10);
      })
      .withMessage('ステップ番号は1から10の整数で指定してください'),
    
    // ユーザーデータのバリデーション
    body('userData.surname')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('苗字は1文字以上10文字以内で入力してください'),
    
    body('userData.firstName')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('名前は1文字以上10文字以内で入力してください'),
    
    body('userData.birthday')
      .optional()
      .isISO8601()
      .withMessage('誕生日は有効な日付形式で入力してください'),
    
    // パートナーデータのバリデーション
    body('partnerData.gender')
      .optional()
      .isIn(Object.values(Gender))
      .withMessage('性別は有効な値を選択してください'),
    
    body('partnerData.name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('パートナーの名前は1文字以上20文字以内で入力してください'),
    
    body('partnerData.personality')
      .optional()
      .isIn(Object.values(PersonalityType))
      .withMessage('性格タイプは有効な値を選択してください'),
    
    body('partnerData.speechStyle')
      .optional()
      .isIn(Object.values(SpeechStyle))
      .withMessage('話し方は有効な値を選択してください'),
    
    body('partnerData.prompt')
      .optional()
      .isString()
      .trim()
      .withMessage('プロンプトは文字列で入力してください'),
    
    body('partnerData.nickname')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 20 })
      .withMessage('ニックネームは20文字以内で入力してください'),
    
    // 外見設定のバリデーション
    body('partnerData.appearance.hairStyle')
      .optional()
      .isIn(['short', 'medium', 'long'])
      .withMessage('髪型は有効な値を選択してください'),
    
    body('partnerData.appearance.eyeColor')
      .optional()
      .isIn(['brown', 'black', 'blue', 'green'])
      .withMessage('目の色は有効な値を選択してください'),
    
    body('partnerData.appearance.bodyType')
      .optional()
      .isIn(['slim', 'average', 'athletic'])
      .withMessage('体型は有効な値を選択してください'),
    
    body('partnerData.appearance.clothingStyle')
      .optional()
      .isIn(['casual', 'formal', 'sporty', 'elegant'])
      .withMessage('服装スタイルは有効な値を選択してください'),
    
    // 性格質問の回答バリデーション
    body('personalityAnswers')
      .optional()
      .isArray()
      .withMessage('性格質問の回答は配列で指定してください'),
    
    body('personalityAnswers.*.id')
      .optional()
      .isString()
      .withMessage('質問IDは文字列で指定してください'),
    
    body('personalityAnswers.*.question')
      .optional()
      .isString()
      .withMessage('質問内容は文字列で指定してください'),
    
    body('personalityAnswers.*.answer')
      .optional()
      .isString()
      .withMessage('回答は文字列で指定してください'),
  ],

  /**
   * オンボーディング完了のバリデーション
   */
  complete: (): ValidationChain[] => [
    // すべての必須データが揃っているかチェック
    body('userData.surname')
      .notEmpty()
      .withMessage('苗字を入力してください'),
    
    body('userData.firstName')
      .notEmpty()
      .withMessage('名前を入力してください'),
    
    body('userData.birthday')
      .notEmpty()
      .isISO8601()
      .withMessage('誕生日を入力してください'),
    
    body('partnerData.gender')
      .notEmpty()
      .isIn(Object.values(Gender))
      .withMessage('パートナーの性別を選択してください'),
    
    body('partnerData.name')
      .notEmpty()
      .isLength({ min: 1, max: 20 })
      .withMessage('パートナーの名前を入力してください'),
    
    body('partnerData.personality')
      .notEmpty()
      .isIn(Object.values(PersonalityType))
      .withMessage('パートナーの性格を選択してください'),
    
    body('partnerData.speechStyle')
      .notEmpty()
      .isIn(Object.values(SpeechStyle))
      .withMessage('パートナーの話し方を選択してください'),
    
    body('partnerData.nickname')
      .notEmpty()
      .isLength({ min: 1, max: 20 })
      .withMessage('ニックネームを入力してください'),
  ],

  /**
   * プリセット取得のバリデーション
   */
  getPresets: (): ValidationChain[] => [
    // 特別な入力は不要
  ],

  /**
   * 性格診断結果に基づくステップ更新のバリデーション
   */
  updatePersonalityStep: (): ValidationChain[] => [
    body('answers')
      .isArray({ min: 3, max: 3 })
      .withMessage('性格診断の回答は3つ必要です'),
    
    body('answers.*.questionId')
      .isString()
      .notEmpty()
      .withMessage('質問IDは必須です'),
    
    body('answers.*.answer')
      .isString()
      .notEmpty()
      .withMessage('回答は必須です'),
  ],
};