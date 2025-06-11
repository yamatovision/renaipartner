// モック認証サービス
import { LoginRequest, LoginResponse, RegisterRequest, ApiResponse, User, UserRole } from '@/types'

export const mockAuthService = {
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // モックレスポンス
    return {
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-123',
          email: request.email,
          surname: 'テスト',
          firstName: 'ユーザー',
          birthday: '1990-01-01',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return {
      success: true,
      data: {
        id: 'user-123',
        email: 'test@example.com',
        surname: 'テスト',
        firstName: 'ユーザー',
        birthday: '1990-01-01',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }
}