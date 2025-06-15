// パートナーAPI実サービス実装
import {
  Partner,
  PartnerCreateRequest,
  PartnerUpdateRequest,
  PromptValidationRequest,
  PromptValidationResponse,
  PromptPreviewRequest,
  PromptPreviewResponse,
  ApiResponse,
  API_PATHS
} from '@/types'
import { api } from './client'

// オンボーディング完了リクエスト型
interface CreateWithOnboardingRequest {
  userData: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  partnerData: {
    name: string;
    gender: string;
    personality: string;
    speechStyle: string;
    prompt?: string;
    nickname?: string;
    appearance: {
      hairStyle: string;
      eyeColor: string;
      bodyType: string;
      clothingStyle: string;
      generatedImageUrl?: string;
    };
  };
}

// 実パートナーAPIサービス
export const partnersApiService = {
  // パートナー作成
  createPartner: async (request: PartnerCreateRequest): Promise<ApiResponse<Partner>> => {
    try {
      const response = await api.post<Partner>(API_PATHS.PARTNERS.BASE, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パートナーの作成に失敗しました',
      }
    }
  },

  // オンボーディング完了パートナー作成（新API）
  createWithOnboarding: async (request: CreateWithOnboardingRequest): Promise<ApiResponse<Partner>> => {
    try {
      const response = await api.post<any>(API_PATHS.PARTNERS.CREATE_WITH_ONBOARDING, request)
      return response
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'オンボーディングの完了に失敗しました',
      }
    }
  },

  // パートナー情報取得（現在のユーザーのパートナー）
  getPartner: async (): Promise<ApiResponse<Partner>> => {
    try {
      const response = await api.get<any>(API_PATHS.PARTNERS.GET)
      // バックエンドが既にApiResponse形式で返すため、そのまま返す
      return response
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パートナー情報の取得に失敗しました',
      }
    }
  },

  // パートナー一覧取得（実際は単一パートナーを返すAPI）
  list: async (): Promise<ApiResponse<Partner[]>> => {
    try {
      const response = await api.get<any>(API_PATHS.PARTNERS.LIST)
      console.log('[PARTNERS API] パートナー取得レスポンス:', response)
      
      // バックエンドからのレスポンスを処理
      if (response && response.success && response.data) {
        // 単一のパートナーを配列として返す
        return {
          success: true,
          data: [response.data],
        }
      } else if (response && response.success && response.data === null) {
        // パートナーが存在しない場合は空配列
        return {
          success: true,
          data: [],
        }
      } else {
        // バックエンドがApiResponse形式でない場合の対応
        return {
          success: true,
          data: response ? [response] : [],
        }
      }
    } catch (error: any) {
      console.error('[PARTNERS API] パートナー取得エラー:', error)
      return {
        success: false,
        error: error.message || 'パートナー一覧の取得に失敗しました',
      }
    }
  },

  // パートナー詳細取得
  getPartnerDetail: async (partnerId: string): Promise<ApiResponse<Partner>> => {
    try {
      const response = await api.get<Partner>(API_PATHS.PARTNERS.DETAIL(partnerId))
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パートナー詳細の取得に失敗しました',
      }
    }
  },

  // パートナー更新
  updatePartner: async (partnerId: string, request: PartnerUpdateRequest): Promise<ApiResponse<Partner>> => {
    try {
      const response = await api.put<Partner>(API_PATHS.PARTNERS.UPDATE(partnerId), request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パートナーの更新に失敗しました',
      }
    }
  },

  // プロンプト検証
  validatePrompt: async (request: PromptValidationRequest): Promise<ApiResponse<PromptValidationResponse>> => {
    try {
      const response = await api.post<PromptValidationResponse>(
        API_PATHS.PARTNERS.VALIDATE_PROMPT,
        request
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'プロンプトの検証に失敗しました',
      }
    }
  },

  // プロンプトプレビュー
  previewPrompt: async (request: PromptPreviewRequest): Promise<ApiResponse<PromptPreviewResponse>> => {
    try {
      const response = await api.post<PromptPreviewResponse>(
        API_PATHS.PARTNERS.PREVIEW,
        request
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'プロンプトのプレビュー生成に失敗しました',
      }
    }
  },

  // 親密度更新
  updateIntimacyLevel: async (partnerId: string, intimacyChange: number): Promise<ApiResponse<{ intimacyLevel: number }>> => {
    try {
      const response = await api.patch<any>(
        API_PATHS.PARTNERS.UPDATE_INTIMACY(partnerId),
        { intimacyChange }
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '親密度の更新に失敗しました',
      }
    }
  },
}