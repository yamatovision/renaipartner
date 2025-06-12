import Joi from 'joi';
import { ValidationError } from '@/common/middlewares/error.middleware';

// ユーザー作成バリデーションスキーマ（管理者用）
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'メールアドレスは必須です',
      'string.email': '有効なメールアドレスを入力してください',
      'any.required': 'メールアドレスは必須です'
    }),
  surname: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': '姓は必須です',
      'string.min': '姓は1文字以上で入力してください',
      'string.max': '姓は50文字以内で入力してください',
      'any.required': '姓は必須です'
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': '名は必須です',
      'string.min': '名は1文字以上で入力してください',
      'string.max': '名は50文字以内で入力してください',
      'any.required': '名は必須です'
    }),
  nickname: Joi.string()
    .max(50)
    .allow('')
    .optional()
    .messages({
      'string.max': 'ニックネームは50文字以内で入力してください'
    }),
  birthday: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.base': '有効な日付を入力してください',
      'date.format': '日付の形式が正しくありません（YYYY-MM-DD）',
      'date.max': '生年月日は現在より前の日付を入力してください',
      'any.required': '生年月日は必須です'
    }),
  password: Joi.string()
    .min(8)
    .max(100)
    .optional()
    .default('aikakumei')
    .messages({
      'string.min': 'パスワードは8文字以上で入力してください',
      'string.max': 'パスワードは100文字以内で入力してください'
    }),
  role: Joi.string()
    .valid('admin', 'user')
    .optional()
    .default('user')
    .messages({
      'any.only': 'ロールは admin または user を指定してください'
    })
});

// ユーザー一覧取得バリデーションスキーマ
export const getUsersQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'ページ番号は数値で指定してください',
      'number.integer': 'ページ番号は整数で指定してください',
      'number.min': 'ページ番号は1以上で指定してください'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': '取得件数は数値で指定してください',
      'number.integer': '取得件数は整数で指定してください',
      'number.min': '取得件数は1以上で指定してください',
      'number.max': '取得件数は100以下で指定してください'
    }),
  search: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': '検索キーワードは255文字以内で入力してください'
    }),
  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
    .messages({
      'any.only': 'ステータスは active または inactive を指定してください'
    })
});

// ユーザーIDバリデーションスキーマ
export const userIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.empty': 'ユーザーIDは必須です',
      'string.uuid': '有効なユーザーIDを指定してください',
      'any.required': 'ユーザーIDは必須です'
    })
});

// プロフィール更新バリデーションスキーマ
export const updateProfileSchema = Joi.object({
  surname: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': '姓は1文字以上で入力してください',
      'string.min': '姓は1文字以上で入力してください',
      'string.max': '姓は50文字以内で入力してください'
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': '名は1文字以上で入力してください',
      'string.min': '名は1文字以上で入力してください',
      'string.max': '名は50文字以内で入力してください'
    }),
  nickname: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'ニックネームは50文字以内で入力してください'
    }),
  birthday: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': '有効な日付を入力してください',
      'date.format': '日付の形式が正しくありません（YYYY-MM-DD）',
      'date.max': '生年月日は現在より前の日付を入力してください'
    })
});

// パスワード変更バリデーションスキーマ
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': '現在のパスワードは必須です',
      'any.required': '現在のパスワードは必須です'
    }),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      'string.empty': '新しいパスワードは必須です',
      'string.min': 'パスワードは8文字以上で入力してください',
      'string.max': 'パスワードは100文字以内で入力してください',
      'any.required': '新しいパスワードは必須です'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'パスワード確認が一致しません',
      'any.required': 'パスワード確認は必須です'
    })
});

// メールアドレス重複チェックバリデーションスキーマ
export const checkEmailSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'メールアドレスは必須です',
      'string.email': '有効なメールアドレスを入力してください',
      'any.required': 'メールアドレスは必須です'
    })
});

// バリデーション実行ヘルパー
export function validateRequest<T>(schema: Joi.ObjectSchema<T>, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // 全てのエラーを取得
    stripUnknown: true, // 不明なプロパティを削除
    convert: true // 型変換を有効化
  });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    throw new ValidationError('入力データが無効です', validationErrors);
  }

  return value;
}