// ユーザープロフィール管理API実サービス実装
import {
  User,
  UserUpdateRequest,
  PasswordChangeRequest,
  UserExportData,
  ApiResponse,
  API_PATHS
} from '@/types'
import { api } from './client'

// 実ユーザーAPIサービス
export const usersApiService = {
  // プロフィール取得
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get<User>(API_PATHS.USERS.PROFILE)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'プロフィール情報の取得に失敗しました',
      }
    }
  },

  // プロフィール更新
  updateProfile: async (request: UserUpdateRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put<User>(API_PATHS.USERS.PROFILE, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'プロフィールの更新に失敗しました',
      }
    }
  },

  // パスワード変更
  changePassword: async (request: PasswordChangeRequest): Promise<ApiResponse<void>> => {
    try {
      await api.put<void>(API_PATHS.USERS.PASSWORD, request)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || error.error || 'パスワードの変更に失敗しました',
        meta: error.meta
      }
    }
  },

  // データエクスポート
  exportUserData: async (): Promise<ApiResponse<UserExportData>> => {
    try {
      const response = await api.get<UserExportData>(API_PATHS.USERS.EXPORT)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'データエクスポートに失敗しました',
      }
    }
  },
}