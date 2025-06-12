// 管理者API実サービス実装
import {
  User,
  CreateUserRequest,
  PaginatedResponse,
  AdminStats,
  UserStatus,
  ApiResponse,
  API_PATHS
} from '@/types'
import { api } from './client'

// 実管理者APIサービス
export const adminApiService = {
  // ユーザー作成
  createUser: async (request: CreateUserRequest): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post<User>(API_PATHS.ADMIN.USERS.BASE, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ユーザーの作成に失敗しました',
      }
    }
  },

  // ユーザー一覧取得
  getUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    try {
      const response = await api.get<any>(
        API_PATHS.ADMIN.USERS.BASE,
        params
      )
      return {
        success: true,
        data: response.data, // APIレスポンスのdataプロパティを取得
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ユーザー一覧の取得に失敗しました',
      }
    }
  },

  // ユーザー無効化
  deactivateUser: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put<User>(
        API_PATHS.ADMIN.USERS.DEACTIVATE(userId)
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ユーザーの無効化に失敗しました',
      }
    }
  },

  // ユーザー有効化
  activateUser: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put<User>(
        API_PATHS.ADMIN.USERS.ACTIVATE(userId)
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ユーザーの有効化に失敗しました',
      }
    }
  },

  // 管理者統計情報取得
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    try {
      const response = await api.get<any>(API_PATHS.USERS.STATS)
      return {
        success: true,
        data: response.data, // APIレスポンスのdataプロパティを取得
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '統計情報の取得に失敗しました',
      }
    }
  },

  // ユーザーステータス更新
  updateUserStatus: async (userId: string, status: UserStatus): Promise<ApiResponse<User>> => {
    try {
      const endpoint = status === UserStatus.ACTIVE 
        ? API_PATHS.ADMIN.USERS.ACTIVATE(userId)
        : API_PATHS.ADMIN.USERS.DEACTIVATE(userId)
      
      const response = await api.put<User>(endpoint)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'ユーザーステータスの更新に失敗しました',
      }
    }
  },
}