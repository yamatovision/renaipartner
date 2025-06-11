// モック管理者サービス
import { 
  User, 
  UserCreate, 
  CreateUserRequest, 
  UserListResponse, 
  ApiResponse,
  UserStatus,
  UserRole
} from '@/types'

export const mockAdminService = {
  async getStats(): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: {
        totalUsers: 156,
        activeUsers: 142,
        inactiveUsers: 14,
        newUsersThisMonth: 23
      }
    }
  },

  async createUser(request: CreateUserRequest): Promise<ApiResponse<User>> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: request.email,
      surname: request.surname || '',
      firstName: request.firstName || '',
      birthday: request.birthday || '',
      role: request.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return {
      success: true,
      data: newUser
    }
  },

  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    status?: 'all' | 'active' | 'inactive'
  }): Promise<ApiResponse<UserListResponse>> {
    // モックユーザーデータ
    const mockUsers: User[] = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        surname: '田中',
        firstName: '太郎',
        birthday: '1990-01-01',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        surname: '佐藤',
        firstName: '花子',
        birthday: '1985-05-15',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ]

    return {
      success: true,
      data: {
        users: mockUsers,
        total: mockUsers.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalPages: Math.ceil(mockUsers.length / (params?.limit || 20))
      }
    }
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<ApiResponse<User>> {
    return {
      success: true,
      data: {
        id: userId,
        email: 'updated@example.com',
        surname: '更新',
        firstName: 'ユーザー',
        birthday: '1990-01-01',
        role: UserRole.USER,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  },

  async deactivateUser(userId: string): Promise<ApiResponse<User>> {
    return this.updateUserStatus(userId, UserStatus.INACTIVE)
  },

  async activateUser(userId: string): Promise<ApiResponse<User>> {
    return this.updateUserStatus(userId, UserStatus.ACTIVE)
  }
}