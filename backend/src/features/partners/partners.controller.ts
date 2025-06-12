import { Request, Response } from 'express';
import { PartnersService } from './partners.service';
import { 
  Partner, 
  PartnerCreate, 
  PartnerUpdate, 
  ApiResponse,
  PersonalityType,
  ValidationError as TypeValidationError
} from '@/types';
import { 
  validateRequest, 
  createPartnerSchema, 
  updatePartnerSchema,
  validatePromptSchema,
  previewPromptSchema,
  partnerIdSchema,
  applyPresetSchema,
  createWithOnboardingSchema
} from './partners.validator';
import { asyncHandler } from '@/common/middlewares/error.middleware';

export class PartnersController {
  // オンボーディング完了とパートナー作成（簡素化版）
  static createWithOnboarding = asyncHandler(async (req: Request, res: Response<ApiResponse<Partner>>): Promise<Response | void> => {
    console.log(`[PARTNERS] オンボーディング完了処理: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const onboardingData = validateRequest(createWithOnboardingSchema, req.body);
    
    // パートナー作成処理（ユーザー情報更新も含む）
    const partner = await PartnersService.createWithOnboarding(req.user.userId, onboardingData);
    
    console.log(`[PARTNERS] オンボーディング完了: partnerId=${partner.id}`);
    
    res.status(201).json({
      success: true,
      data: partner,
      meta: {
        message: 'オンボーディングが完了しました',
        partnerId: partner.id
      }
    });
  });

  // パートナー作成（API 3.1）
  static createPartner = asyncHandler(async (req: Request, res: Response<ApiResponse<Partner>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー作成リクエスト: userId=${req.user?.userId}`);
    console.log('[PARTNERS] リクエストボディ:', JSON.stringify(req.body, null, 2));
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const partnerData = validateRequest(createPartnerSchema, req.body);
    
    // パートナー作成処理
    const partner = await PartnersService.createPartner(req.user.userId, partnerData);
    
    console.log(`[PARTNERS] パートナー作成成功: partnerId=${partner.id}, name=${partner.name}`);
    
    res.status(201).json({
      success: true,
      data: partner,
      meta: {
        message: 'パートナーを作成しました',
        partnerId: partner.id
      }
    });
  });

  // パートナー情報取得（API 3.2）
  static getPartners = asyncHandler(async (req: Request, res: Response<ApiResponse<Partner | null>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー情報取得リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // ユーザーのパートナー取得
    const partner = await PartnersService.getPartnerByUserId(req.user.userId);
    
    console.log(`[PARTNERS] パートナー情報取得成功: userId=${req.user.userId}, hasPartner=${partner !== null}`);
    
    res.json({
      success: true,
      data: partner,
      meta: {
        message: partner ? 'パートナー情報を取得しました' : 'パートナーが見つかりませんでした',
        hasPartner: partner !== null
      }
    });
  });

  // パートナー詳細取得（API 3.3）
  static getPartnerById = asyncHandler(async (req: Request, res: Response<ApiResponse<Partner>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー詳細取得リクエスト: partnerId=${req.params.id}, userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // パスパラメータバリデーション
    const { id: partnerId } = validateRequest(partnerIdSchema, req.params);
    
    // パートナー詳細取得
    const partner = await PartnersService.getPartnerById(partnerId, req.user.userId);
    
    console.log(`[PARTNERS] パートナー詳細取得成功: partnerId=${partnerId}, name=${partner.name}`);
    
    res.json({
      success: true,
      data: partner,
      meta: {
        message: 'パートナー詳細情報を取得しました',
        partnerId: partner.id
      }
    });
  });

  // パートナー更新（API 3.4）
  static updatePartner = asyncHandler(async (req: Request, res: Response<ApiResponse<Partner>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー更新リクエスト: partnerId=${req.params.id}, userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // パスパラメータバリデーション
    const { id: partnerId } = validateRequest(partnerIdSchema, req.params);
    
    // 更新データバリデーション
    const updateData = validateRequest(updatePartnerSchema, req.body);
    
    // パートナー更新処理
    const updatedPartner = await PartnersService.updatePartner(partnerId, req.user.userId, updateData);
    
    console.log(`[PARTNERS] パートナー更新成功: partnerId=${partnerId}, name=${updatedPartner.name}`);
    
    res.json({
      success: true,
      data: updatedPartner,
      meta: {
        message: 'パートナー情報を更新しました',
        partnerId: updatedPartner.id
      }
    });
  });

  // プロンプト検証（API 3.5）
  static validatePrompt = asyncHandler(async (req: Request, res: Response<ApiResponse<{ isValid: boolean; warnings: string[] }>>): Promise<Response | void> => {
    console.log(`[PARTNERS] プロンプト検証リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const { systemPrompt } = validateRequest(validatePromptSchema, req.body);
    
    // プロンプト検証処理
    const validationResult = await PartnersService.validatePrompt(systemPrompt);
    
    console.log(`[PARTNERS] プロンプト検証完了: isValid=${validationResult.isValid}, warnings=${validationResult.warnings.length}`);
    
    res.json({
      success: true,
      data: validationResult,
      meta: {
        message: validationResult.isValid ? 'プロンプトは適切です' : 'プロンプトに問題があります',
        warningCount: validationResult.warnings.length
      }
    });
  });

  // プロンプトプレビュー（API 3.6）
  static previewPrompt = asyncHandler(async (req: Request, res: Response<ApiResponse<{ response: string }>>): Promise<Response | void> => {
    console.log(`[PARTNERS] プロンプトプレビューリクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // バリデーション
    const { systemPrompt, testMessage } = validateRequest(previewPromptSchema, req.body);
    
    // プロンプトプレビュー生成
    const previewResponse = await PartnersService.previewPrompt(systemPrompt, testMessage);
    
    console.log(`[PARTNERS] プロンプトプレビュー生成成功: userId=${req.user.userId}`);
    
    res.json({
      success: true,
      data: { response: previewResponse },
      meta: {
        message: 'プレビューを生成しました',
        testMessage: testMessage || 'こんにちは'
      }
    });
  });

  // プリセット適用（補助API）
  static applyPreset = asyncHandler(async (req: Request, res: Response<ApiResponse<Partner>>): Promise<Response | void> => {
    console.log(`[PARTNERS] プリセット適用リクエスト: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // パスパラメータバリデーション
    const { id: partnerId } = validateRequest(partnerIdSchema, req.params);
    
    // プリセットタイプバリデーション
    const { presetType } = validateRequest(applyPresetSchema, req.body);
    
    // プリセット適用処理
    const updatedPartner = await PartnersService.applyPreset(partnerId, req.user.userId, presetType as PersonalityType);
    
    console.log(`[PARTNERS] プリセット適用成功: partnerId=${partnerId}, preset=${presetType}`);
    
    res.json({
      success: true,
      data: updatedPartner,
      meta: {
        message: 'プリセットを適用しました',
        appliedPreset: presetType
      }
    });
  });

  // パートナー削除
  static deletePartner = asyncHandler(async (req: Request, res: Response<ApiResponse<null>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー削除リクエスト: partnerId=${req.params.id}, userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // パスパラメータバリデーション
    const { id: partnerId } = validateRequest(partnerIdSchema, req.params);
    
    // パートナー削除処理
    await PartnersService.deletePartner(partnerId, req.user.userId);
    
    console.log(`[PARTNERS] パートナー削除成功: partnerId=${partnerId}`);
    
    res.json({
      success: true,
      data: null,
      meta: {
        message: 'パートナーを削除しました',
        deletedPartnerId: partnerId
      }
    });
  });

  // 親密度更新（補助API）
  static updateIntimacy = asyncHandler(async (req: Request, res: Response<ApiResponse<{ intimacyLevel: number }>>): Promise<Response | void> => {
    console.log(`[PARTNERS] 親密度更新リクエスト: partnerId=${req.params.id}, userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // パスパラメータバリデーション
    const { id: partnerId } = validateRequest(partnerIdSchema, req.params);
    
    // 親密度変更値の取得
    const { intimacyChange } = req.body;
    
    if (typeof intimacyChange !== 'number') {
      return res.status(400).json({
        success: false,
        error: '親密度の変更値は数値で指定してください',
        meta: { code: 'INVALID_INTIMACY_CHANGE' }
      });
    }
    
    // 親密度更新処理
    await PartnersService.updateIntimacyLevel(partnerId, req.user.userId, intimacyChange);
    
    // 更新後のパートナー情報取得
    const updatedPartner = await PartnersService.getPartnerById(partnerId, req.user.userId);
    
    console.log(`[PARTNERS] 親密度更新成功: partnerId=${partnerId}, newLevel=${updatedPartner.intimacyLevel}`);
    
    res.json({
      success: true,
      data: { intimacyLevel: updatedPartner.intimacyLevel },
      meta: {
        message: '親密度を更新しました',
        intimacyChange: intimacyChange
      }
    });
  });

  // パートナー統計取得（管理者用）
  static getPartnerStats = asyncHandler(async (req: Request, res: Response<ApiResponse<any>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー統計取得リクエスト: userId=${req.user?.userId}, role=${req.user?.role}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '管理者権限が必要です',
        meta: { code: 'ADMIN_REQUIRED' }
      });
    }
    
    // パートナー統計取得
    const stats = await PartnersService.getPartnerStats();
    
    console.log(`[PARTNERS] パートナー統計取得成功: totalPartners=${stats.totalPartners}`);
    
    res.json({
      success: true,
      data: stats,
      meta: {
        message: 'パートナー統計を取得しました',
        generatedAt: new Date().toISOString()
      }
    });
  });

  // パートナー存在チェック
  static checkPartnerExists = asyncHandler(async (req: Request, res: Response<ApiResponse<{ hasPartner: boolean }>>): Promise<Response | void> => {
    console.log(`[PARTNERS] パートナー存在チェック: userId=${req.user?.userId}`);
    
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です',
        meta: { code: 'AUTH_REQUIRED' }
      });
    }
    
    // パートナー存在チェック
    const hasPartner = await PartnersService.hasPartner(req.user.userId);
    
    console.log(`[PARTNERS] パートナー存在チェック完了: userId=${req.user.userId}, hasPartner=${hasPartner}`);
    
    res.json({
      success: true,
      data: { hasPartner },
      meta: {
        message: hasPartner ? 'パートナーが存在します' : 'パートナーが存在しません'
      }
    });
  });

  // ヘルスチェック（認証不要）
  static healthCheck = asyncHandler(async (req: Request, res: Response<ApiResponse<{ status: string; timestamp: string }>>) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      meta: {
        service: 'partners',
        version: '1.0.0'
      }
    });
  });
}