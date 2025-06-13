// 画像関連API実サービス実装
import {
  ApiResponse,
  API_PATHS,
  BackgroundImage,
  ImageGenerationRequest,
  ImageGenerationResponse
} from '@/types'
import { api } from './client'

// 実画像APIサービス
export const imagesApiService = {
  // 背景画像一覧取得
  getBackgrounds: async (): Promise<BackgroundImage[]> => {
    try {
      const response = await api.get<BackgroundImage[]>(API_PATHS.IMAGES.BACKGROUNDS)
      return response
    } catch (error: any) {
      console.error('背景画像取得エラー:', error)
      // フォールバック背景を返す
      return [{
        id: 'default-1',
        url: '/backgrounds/default.jpg',
        name: 'デフォルト背景',
        category: 'default',
        isDefault: true,
        timeOfDay: 'day',
        season: 'all',
        weather: 'clear'
      }]
    }
  },

  // アバター画像生成
  generateAvatar: async (request: ImageGenerationRequest): Promise<ApiResponse<ImageGenerationResponse>> => {
    try {
      const response = await api.post<ImageGenerationResponse>(API_PATHS.IMAGES.AVATAR, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'アバター画像生成に失敗しました',
      }
    }
  },

  // チャット内画像生成
  generateImage: async (request: ImageGenerationRequest): Promise<ApiResponse<ImageGenerationResponse>> => {
    try {
      const response = await api.post<ImageGenerationResponse>(API_PATHS.IMAGES.GENERATE_CHAT, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '画像生成に失敗しました',
      }
    }
  },

  // オンボーディング用画像生成
  generateOnboardingImage: async (request: ImageGenerationRequest): Promise<ApiResponse<ImageGenerationResponse>> => {
    try {
      const response = await api.post<ImageGenerationResponse>(API_PATHS.IMAGES.GENERATE_ONBOARDING, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'オンボーディング画像生成に失敗しました',
      }
    }
  },
}