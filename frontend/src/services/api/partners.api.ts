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

  // パートナー情報取得（現在のユーザーのパートナー）
  getPartner: async (): Promise<ApiResponse<Partner>> => {
    try {
      const response = await api.get<Partner>(API_PATHS.PARTNERS.GET)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'パートナー情報の取得に失敗しました',
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
}