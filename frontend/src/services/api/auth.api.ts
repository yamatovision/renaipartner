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
      const response = await api.post<ApiResponse<LoginResponse>>(API_PATHS.AUTH.LOGIN, request)
      console.log('Raw API response for login:', response)
      
      // バックエンドが既にApiResponse形式で返している場合
      if (response && typeof response === 'object' && 'success' in response) {
        // アクセストークンをlocalStorageに保存
        if (response.success && response.data && response.data.accessToken) {
          localStorage.setItem('access_token', response.data.accessToken)
        }
        return response
      }
      
      // バックエンドが直接LoginResponseオブジェクトを返している場合
      const loginResponse = response as LoginResponse
      if (loginResponse.accessToken) {
        localStorage.setItem('access_token', loginResponse.accessToken)
      }
      
      return {
        success: true,
        data: loginResponse,
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
      const response = await api.get<ApiResponse<User>>(API_PATHS.AUTH.ME)
      console.log('Raw API response for getCurrentUser:', response)
      
      // バックエンドが既にApiResponse形式で返している場合
      if (response && typeof response === 'object' && 'success' in response) {
        return response
      }
      
      // バックエンドが直接Userオブジェクトを返している場合
      return {
        success: true,
        data: response as User,
      }
    } catch (error: any) {
      // 認証エラーの場合はトークンをクリア
      if (error.message && (error.message.includes('無効なトークン') || error.message.includes('401'))) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
      
      return {
        success: false,
        error: error.message || 'ユーザー情報の取得に失敗しました',
      }
    }
  },
}