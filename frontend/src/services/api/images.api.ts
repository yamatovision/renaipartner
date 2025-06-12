import { api } from './client'
import { 
  ImageGenerationRequest, 
  GeneratedImage,
  BackgroundImage,
  ApiResponse,
  API_PATHS 
} from '../../types'

export const imagesApiService = {
  // アバター画像生成（API 7.1）
  async generateAvatar(request: ImageGenerationRequest): Promise<ApiResponse<GeneratedImage>> {
    return api.post(API_PATHS.IMAGES.GENERATE, request)
  },

  // オンボーディング用画像生成（partnerIdなし）
  async generateOnboardingAvatar(request: Omit<ImageGenerationRequest, 'partnerId'>): Promise<ApiResponse<GeneratedImage>> {
    return api.post('/api/images/generate-onboarding', request)
  },

  // チャット用画像生成（API 7.2）
  async generateChatImage(request: ImageGenerationRequest): Promise<ApiResponse<GeneratedImage>> {
    return api.post(API_PATHS.IMAGES.GENERATE_CHAT, request)
  },

  // 背景画像一覧取得（API 7.3）
  async getBackgrounds(): Promise<BackgroundImage[]> {
    const response = await api.get<BackgroundImage[]>(API_PATHS.IMAGES.BACKGROUNDS)
    // APIレスポンスが配列形式でない場合の対応
    if (response && typeof response === 'object' && 'data' in response) {
      return Array.isArray(response.data) ? response.data : []
    }
    return Array.isArray(response) ? response : []
  },

  // 画像履歴取得（追加機能）
  async getHistory(partnerId: string): Promise<GeneratedImage[]> {
    return api.get(API_PATHS.IMAGES.HISTORY(partnerId))
  },

  // 画像統計取得（追加機能）
  async getStats(partnerId: string): Promise<{ total: number; lastGenerated: Date }> {
    return api.get(API_PATHS.IMAGES.STATS(partnerId))
  },

  // 画像削除（追加機能）
  async deleteImage(imageId: string): Promise<void> {
    return api.delete(API_PATHS.IMAGES.DELETE(imageId))
  },

  // 利用可能モデル一覧取得（追加機能）
  async getModels(): Promise<Array<{ id: string; name: string; description: string }>> {
    return api.get(API_PATHS.IMAGES.MODELS)
  }
}