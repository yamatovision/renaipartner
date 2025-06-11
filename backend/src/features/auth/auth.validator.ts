import Joi from 'joi';
import { ValidationError } from '@/common/middlewares/error.middleware';

// ログインバリデーションスキーマ
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'メールアドレスは必須です',
      'string.email': '有効なメールアドレスを入力してください',
      'any.required': 'メールアドレスは必須です'
    }),
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      'string.empty': 'パスワードは必須です',
      'string.min': 'パスワードは8文字以上で入力してください',
      'string.max': 'パスワードは100文字以内で入力してください',
      'any.required': 'パスワードは必須です'
    })
});

// リフレッシュトークンバリデーションスキーマ
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'リフレッシュトークンは必須です',
      'any.required': 'リフレッシュトークンは必須です'
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
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .messages({
      'string.empty': '新しいパスワードは必須です',
      'string.min': '新しいパスワードは8文字以上で入力してください',
      'string.max': '新しいパスワードは100文字以内で入力してください',
      'string.pattern.base': '新しいパスワードは英数字を含む必要があります',
      'any.required': '新しいパスワードは必須です'
    })
});

// バリデーション実行ヘルパー
export function validateRequest<T>(schema: Joi.ObjectSchema<T>, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false, // 全てのエラーを取得
    stripUnknown: true // 不明なプロパティを削除
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