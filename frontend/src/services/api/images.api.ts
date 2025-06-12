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

  // チャット用画像生成（API 7.2）
  async generateChatImage(request: ImageGenerationRequest): Promise<ApiResponse<GeneratedImage>> {
    return api.post(API_PATHS.IMAGES.GENERATE_CHAT, request)
  },

  // 背景画像一覧取得（API 7.3）
  async getBackgrounds(): Promise<BackgroundImage[]> {
    return api.get(API_PATHS.IMAGES.BACKGROUNDS)
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