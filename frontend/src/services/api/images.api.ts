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
      const response = await api.get<any>(API_PATHS.IMAGES.BACKGROUNDS)
      console.log('📸 [imagesApiService] API応答:', response)
      
      // APIレスポンスが {success: true, data: {backgrounds: [...]}} 形式の場合
      if (response && response.success && response.data && response.data.backgrounds) {
        console.log('📸 [imagesApiService] backgrounds配列を返します:', response.data.backgrounds)
        return response.data.backgrounds
      }
      
      // レスポンスが直接配列の場合
      if (Array.isArray(response)) {
        return response
      }
      
      // 予期しない形式の場合はフォールバック
      console.warn('📸 [imagesApiService] 予期しない応答形式、フォールバックを使用')
      throw new Error('Invalid response format')
    } catch (error: any) {
      console.error('背景画像取得エラー:', error)
      // フォールバック背景を返す（実際に存在するファイルパス）
      return [
        {
          id: 'cafe_morning',
          url: '/images/backgrounds/public/cafe_morning.jpg',
          name: 'カフェ（朝）',
          category: 'public',
          isDefault: true,
          timeOfDay: 'morning',
          season: 'all',
          weather: 'clear'
        },
        {
          id: 'cafe_afternoon',
          url: '/images/backgrounds/public/cafe_afternoon.jpg',
          name: 'カフェ（昼）',
          category: 'public',
          isDefault: false,
          timeOfDay: 'afternoon',
          season: 'all',
          weather: 'clear'
        },
        {
          id: 'park_morning',
          url: '/images/backgrounds/public/park_morning.jpg',
          name: '公園（朝）',
          category: 'public',
          isDefault: false,
          timeOfDay: 'morning',
          season: 'all',
          weather: 'clear'
        },
        {
          id: 'home_living_afternoon',
          url: '/images/backgrounds/private/home_living_afternoon.jpg',
          name: 'リビング（昼）',
          category: 'private',
          isDefault: false,
          timeOfDay: 'afternoon',
          season: 'all',
          weather: 'clear'
        }
      ]
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