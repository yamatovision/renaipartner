import { 
  User, 
  UserCreate, 
  UserStatus, 
  UserRole,
  ApiResponse,
  PaginatedResponse 
} from '@/types'
import { MOCK_USERS, MOCK_USER_STATS } from './data/users.mock'

// 管理者用モックサービス
export const mockAdminService = {
  // ユーザー統計情報を取得
  getStats: async (): Promise<ApiResponse<typeof MOCK_USER_STATS>> => {
    // API呼び出しを模倣
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.warn('🔧 Using MOCK data for admin stats')
    
    return {
      success: true,
      data: MOCK_USER_STATS
    }
  },

  // ユーザー一覧を取得（検索・フィルター・ページネーション対応）
  getUsers: async (params?: {
    search?: string
    status?: UserStatus
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    // API呼び出しを模倣
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.warn('🔧 Using MOCK data for users list')
    
    let filteredUsers = MOCK_USERS.filter(user => user.role === UserRole.USER)
    
    // 検索フィルター
    if (params?.search) {
      const search = params.search.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(search) ||
        user.surname.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search)
      )
    }
    
    // ステータスフィルター
    if (params?.status) {
      filteredUsers = filteredUsers.filter(user => user.status === params.status)
    }
    
    // ページネーション
    const page = params?.page || 1
    const limit = params?.limit || 10
    const offset = (page - 1) * limit
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)
    
    return {
      success: true,
      data: {
        items: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    }
  },

  // 新規ユーザー作成
  createUser: async (userData: UserCreate): Promise<ApiResponse<User>> => {
    // API呼び出しを模倣
    await new Promise(resolve => setTimeout(resolve, 800))
    
    console.warn('🔧 Using MOCK data for user creation')
    
    // 既存メールチェック
    const existingUser = MOCK_USERS.find(user => user.email === userData.email)
    if (existingUser) {
      return {
        success: false,
        error: 'このメールアドレスは既に登録されています'
      }
    }
    
    // 新しいユーザーを作成
    const newUser: User = {
      id: (MOCK_USERS.length + 1).toString(),
      email: userData.email,
      surname: userData.surname || '新規',
      firstName: userData.firstName || 'ユーザー',
      nickname: userData.nickname || '',
      birthday: userData.birthday || '',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // モックデータに追加（実際はサーバーサイドで処理）
    MOCK_USERS.push(newUser)
    
    return {
      success: true,
      data: newUser
    }
  },

  // ユーザーステータス更新
  updateUserStatus: async (userId: string, status: UserStatus): Promise<ApiResponse<User>> => {
    // API呼び出しを模倣
    await new Promise(resolve => setTimeout(resolve, 400))
    
    console.warn('🔧 Using MOCK data for user status update')
    
    const userIndex = MOCK_USERS.findIndex(user => user.id === userId)
    if (userIndex === -1) {
      return {
        success: false,
        error: 'ユーザーが見つかりません'
      }
    }
    
    // ステータス更新
    MOCK_USERS[userIndex].status = status
    MOCK_USERS[userIndex].updatedAt = new Date()
    
    return {
      success: true,
      data: MOCK_USERS[userIndex]
    }
  }
}