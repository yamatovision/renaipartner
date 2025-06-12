import Joi from 'joi';
import { ValidationError } from '@/common/middlewares/error.middleware';
import { 
  Gender, 
  PersonalityType, 
  SpeechStyle, 
  HairStyle, 
  EyeColor, 
  BodyType, 
  ClothingStyle 
} from '@/types';

// 外見設定バリデーションスキーマ
const appearanceSchema = Joi.object({
  hairStyle: Joi.string()
    .valid('short', 'medium', 'long')
    .required()
    .messages({
      'any.only': '髪型は short, medium, long のいずれかを選択してください',
      'any.required': '髪型は必須です'
    }),
  eyeColor: Joi.string()
    .valid('brown', 'black', 'blue', 'green')
    .required()
    .messages({
      'any.only': '目の色は brown, black, blue, green のいずれかを選択してください',
      'any.required': '目の色は必須です'
    }),
  bodyType: Joi.string()
    .valid('slim', 'average', 'athletic')
    .required()
    .messages({
      'any.only': '体型は slim, average, athletic のいずれかを選択してください',
      'any.required': '体型は必須です'
    }),
  clothingStyle: Joi.string()
    .valid('casual', 'formal', 'sporty', 'elegant')
    .required()
    .messages({
      'any.only': '服装は casual, formal, sporty, elegant のいずれかを選択してください',
      'any.required': '服装は必須です'
    }),
  generatedImageUrl: Joi.string()
    .uri()
    .optional()
    .allow(null, '')
    .messages({
      'string.uri': '有効なURL形式で入力してください'
    })
});

// パートナー作成バリデーションスキーマ
export const createPartnerSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(20)
    .required()
    .messages({
      'string.empty': 'パートナーの名前は必須です',
      'string.min': 'パートナーの名前は1文字以上で入力してください',
      'string.max': 'パートナーの名前は20文字以内で入力してください',
      'any.required': 'パートナーの名前は必須です'
    }),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .required()
    .messages({
      'any.only': '性別は boyfriend または girlfriend を選択してください',
      'any.required': '性別は必須です'
    }),
  personalityType: Joi.string()
    .valid(...Object.values(PersonalityType))
    .required()
    .messages({
      'any.only': '有効な性格タイプを選択してください',
      'any.required': '性格タイプは必須です'
    }),
  speechStyle: Joi.string()
    .valid(...Object.values(SpeechStyle))
    .required()
    .messages({
      'any.only': '有効な話し方を選択してください',
      'any.required': '話し方は必須です'
    }),
  systemPrompt: Joi.string()
    .min(50)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'システムプロンプトは必須です',
      'string.min': 'システムプロンプトは50文字以上で入力してください',
      'string.max': 'システムプロンプトは1000文字以内で入力してください',
      'any.required': 'システムプロンプトは必須です'
    }),
  avatarDescription: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'アバターの説明は必須です',
      'string.min': 'アバターの説明は10文字以上で入力してください',
      'string.max': 'アバターの説明は500文字以内で入力してください',
      'any.required': 'アバターの説明は必須です'
    }),
  appearance: appearanceSchema.required(),
  hobbies: Joi.array()
    .items(Joi.string().min(1).max(50))
    .max(10)
    .default([])
    .messages({
      'array.max': '趣味は10個まで登録できます',
      'string.min': '趣味は1文字以上で入力してください',
      'string.max': '趣味は50文字以内で入力してください'
    }),
  intimacyLevel: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .default(0)
    .messages({
      'number.min': '親密度は0以上で入力してください',
      'number.max': '親密度は100以下で入力してください',
      'number.integer': '親密度は整数で入力してください'
    })
});

// パートナー更新バリデーションスキーマ
export const updatePartnerSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(20)
    .optional()
    .messages({
      'string.empty': 'パートナーの名前は1文字以上で入力してください',
      'string.min': 'パートナーの名前は1文字以上で入力してください',
      'string.max': 'パートナーの名前は20文字以内で入力してください'
    }),
  personalityType: Joi.string()
    .valid(...Object.values(PersonalityType))
    .optional()
    .messages({
      'any.only': '有効な性格タイプを選択してください'
    }),
  speechStyle: Joi.string()
    .valid(...Object.values(SpeechStyle))
    .optional()
    .messages({
      'any.only': '有効な話し方を選択してください'
    }),
  systemPrompt: Joi.string()
    .min(50)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'システムプロンプトは50文字以上で入力してください',
      'string.max': 'システムプロンプトは1000文字以内で入力してください'
    }),
  avatarDescription: Joi.string()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'アバターの説明は10文字以上で入力してください',
      'string.max': 'アバターの説明は500文字以内で入力してください'
    }),
  appearance: Joi.object({
    hairStyle: Joi.string()
      .valid('short', 'medium', 'long')
      .optional()
      .messages({
        'any.only': '髪型は short, medium, long のいずれかを選択してください'
      }),
    eyeColor: Joi.string()
      .valid('brown', 'black', 'blue', 'green')
      .optional()
      .messages({
        'any.only': '目の色は brown, black, blue, green のいずれかを選択してください'
      }),
    bodyType: Joi.string()
      .valid('slim', 'average', 'athletic')
      .optional()
      .messages({
        'any.only': '体型は slim, average, athletic のいずれかを選択してください'
      }),
    clothingStyle: Joi.string()
      .valid('casual', 'formal', 'sporty', 'elegant')
      .optional()
      .messages({
        'any.only': '服装は casual, formal, sporty, elegant のいずれかを選択してください'
      }),
    generatedImageUrl: Joi.string()
      .uri()
      .optional()
      .allow(null, '')
      .messages({
        'string.uri': '有効なURL形式で入力してください'
      })
  }).optional(),
  hobbies: Joi.array()
    .items(Joi.string().min(1).max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': '趣味は10個まで登録できます',
      'string.min': '趣味は1文字以上で入力してください',
      'string.max': '趣味は50文字以内で入力してください'
    })
});

// プロンプト検証バリデーションスキーマ
export const validatePromptSchema = Joi.object({
  systemPrompt: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'システムプロンプトは必須です',
      'string.min': 'システムプロンプトを入力してください',
      'string.max': 'システムプロンプトは1000文字以内で入力してください',
      'any.required': 'システムプロンプトは必須です'
    })
});

// プロンプトプレビューバリデーションスキーマ
export const previewPromptSchema = Joi.object({
  systemPrompt: Joi.string()
    .min(50)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'システムプロンプトは必須です',
      'string.min': 'システムプロンプトは50文字以上で入力してください',
      'string.max': 'システムプロンプトは1000文字以内で入力してください',
      'any.required': 'システムプロンプトは必須です'
    }),
  testMessage: Joi.string()
    .min(1)
    .max(200)
    .default('こんにちは')
    .messages({
      'string.min': 'テストメッセージは1文字以上で入力してください',
      'string.max': 'テストメッセージは200文字以内で入力してください'
    })
});

// パスパラメータバリデーションスキーマ
export const partnerIdSchema = Joi.object({
  id: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': '有効なパートナーIDを指定してください',
      'any.required': 'パートナーIDは必須です'
    })
});

// プリセット適用バリデーションスキーマ
export const applyPresetSchema = Joi.object({
  presetType: Joi.string()
    .valid(...Object.values(PersonalityType))
    .required()
    .messages({
      'any.only': '有効なプリセットタイプを選択してください',
      'any.required': 'プリセットタイプは必須です'
    })
});

// オンボーディング完了バリデーションスキーマ
export const createWithOnboardingSchema = Joi.object({
  userData: Joi.object({
    surname: Joi.string()
      .min(1)
      .max(20)
      .required()
      .messages({
        'string.empty': '姓は必須です',
        'string.min': '姓は1文字以上で入力してください',
        'string.max': '姓は20文字以内で入力してください',
        'any.required': '姓は必須です'
      }),
    firstName: Joi.string()
      .min(1)
      .max(20)
      .required()
      .messages({
        'string.empty': '名は必須です',
        'string.min': '名は1文字以上で入力してください',
        'string.max': '名は20文字以内で入力してください',
        'any.required': '名は必須です'
      }),
    birthday: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required()
      .messages({
        'string.pattern.base': '生年月日はYYYY-MM-DD形式で入力してください',
        'any.required': '生年月日は必須です'
      })
  }).required(),
  partnerData: Joi.object({
    name: Joi.string()
      .min(1)
      .max(20)
      .required()
      .messages({
        'string.empty': 'パートナーの名前は必須です',
        'string.min': 'パートナーの名前は1文字以上で入力してください',
        'string.max': 'パートナーの名前は20文字以内で入力してください',
        'any.required': 'パートナーの名前は必須です'
      }),
    gender: Joi.string()
      .valid(...Object.values(Gender))
      .required()
      .messages({
        'any.only': '性別は boyfriend または girlfriend を選択してください',
        'any.required': '性別は必須です'
      }),
    personality: Joi.string()
      .valid(...Object.values(PersonalityType))
      .required()
      .messages({
        'any.only': '有効な性格タイプを選択してください',
        'any.required': '性格タイプは必須です'
      }),
    speechStyle: Joi.string()
      .valid(...Object.values(SpeechStyle))
      .required()
      .messages({
        'any.only': '有効な話し方を選択してください',
        'any.required': '話し方は必須です'
      }),
    prompt: Joi.string()
      .min(0)
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'カスタムプロンプトは500文字以内で入力してください'
      }),
    nickname: Joi.string()
      .min(0)
      .max(20)
      .optional()
      .allow('')
      .messages({
        'string.max': 'ニックネームは20文字以内で入力してください'
      }),
    appearance: appearanceSchema.required()
  }).required()
});

// バリデーション実行ヘルパー
export function validateRequest<T>(schema: Joi.ObjectSchema<T>, data: any): T {
  console.log('[VALIDATION] 検証開始:', {
    dataKeys: Object.keys(data || {}),
    dataLength: JSON.stringify(data || {}).length
  });

  const { error, value } = schema.validate(data, {
    abortEarly: false, // 全てのエラーを取得
    stripUnknown: true // 不明なプロパティを削除
  });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    console.log('[VALIDATION] エラー詳細:', {
      data: JSON.stringify(data, null, 2),
      errors: validationErrors
    });

    throw new ValidationError('入力データが無効です', validationErrors);
  }

  return value;
}

// 不適切なコンテンツ検証ヘルパー
export function validatePromptContent(prompt: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // 禁止ワードのチェック（基本的なもの）
  const forbiddenWords = [
    // 過度に性的な表現
    '性的', 'エロ', 'H',
    // 暴力的表現
    '殺', '暴力', '傷つけ',
    // 違法行為
    '違法', '薬物', '犯罪'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  
  forbiddenWords.forEach(word => {
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    if (regex.test(prompt)) {
      warnings.push(`不適切な表現が含まれている可能性があります: "${word}"`);
    }
  });
  
  // 長すぎる文の警告
  const sentences = prompt.split(/[。！？]/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => s.length > 100);
  
  if (longSentences.length > 0) {
    warnings.push('一部の文が長すぎます。短く分割することをお勧めします。');
  }
  
  // 空のプロンプトチェック
  if (prompt.trim().length < 10) {
    warnings.push('プロンプトが短すぎます。より詳細な設定をお勧めします。');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}