import { api } from './client'
import { 
  SettingsResponse, 
  SettingsUpdateRequest,
  BackgroundImage,
  API_PATHS 
} from '../../types'

export const settingsApiService = {
  // ユーザー設定取得（統合版）（API 9.1）
  async getSettings(): Promise<SettingsResponse> {
    return api.get(API_PATHS.SETTINGS.BASE)
  },

  // ユーザー設定更新（統合版）（API 9.2）
  async updateSettings(updates: SettingsUpdateRequest): Promise<SettingsResponse> {
    return api.put(API_PATHS.SETTINGS.BASE, updates)
  },

  // 背景画像一覧取得（追加機能）
  async getBackgrounds(): Promise<BackgroundImage[]> {
    return api.get(API_PATHS.SETTINGS.BACKGROUNDS)
  }
}