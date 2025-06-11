// 認証API実サービス実装
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User,
  ApiResponse,
  API_PATHS 
} from '@/types'
import { api } from './client'

// 実認証APIサービス
export const authApiService = {
  // ログイン
  login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.post<LoginResponse>(API_PATHS.AUTH.LOGIN, request)
      
      // アクセストークンをlocalStorageに保存
      if (response.accessToken) {
        localStorage.setItem('access_token', response.accessToken)
      }
      
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ログインに失敗しました',
      }
    }
  },

  // 登録（管理者による招待制のため、実際には使用されない）
  register: async (request: RegisterRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post<User>(API_PATHS.AUTH.REGISTER, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登録に失敗しました',
      }
    }
  },

  // ログアウト
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      
      await api.post<void>(API_PATHS.AUTH.LOGOUT, { refreshToken })
      
      // トークンをlocalStorageから削除
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      return { success: true }
    } catch (error: any) {
      // ログアウトは失敗してもトークンを削除
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      return {
        success: false,
        error: error.message || 'ログアウトに失敗しました',
      }
    }
  },

  // トークンリフレッシュ
  refresh: async (): Promise<ApiResponse<LoginResponse>> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'リフレッシュトークンが見つかりません',
        }
      }
      
      const response = await api.post<LoginResponse>(API_PATHS.AUTH.REFRESH, {
        refreshToken,
      })
      
      // 新しいアクセストークンを保存
      if (response.accessToken) {
        localStorage.setItem('access_token', response.accessToken)
      }
      
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      // リフレッシュ失敗時はトークンを削除
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      return {
        success: false,
        error: error.message || 'トークンの更新に失敗しました',
      }
    }
  },

  // 現在のユーザー取得
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get<User>(API_PATHS.AUTH.ME)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ユーザー情報の取得に失敗しました',
      }
    }
  },
}