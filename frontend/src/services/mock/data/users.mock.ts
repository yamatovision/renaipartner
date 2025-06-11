import { User, UserRole, UserStatus } from '@/types'

// モックユーザーデータ（管理者機能用）
export const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    surname: '白石',
    firstName: '達也',
    nickname: 'たっちゃん',
    birthday: '1990-01-01',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: '2',
    email: 'admin@example.com',
    surname: '管理',
    firstName: '太郎',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    birthday: '1985-05-15',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: '3',
    email: 'user1@example.com',
    surname: '田中',
    firstName: '花子',
    nickname: 'はなちゃん',
    birthday: '1992-03-15',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: '4',
    email: 'user2@example.com',
    surname: '佐藤',
    firstName: '次郎',
    nickname: 'じろう',
    birthday: '1988-07-22',
    role: UserRole.USER,
    status: UserStatus.INACTIVE,
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2025-01-05'),
  },
  {
    id: '5',
    email: 'user3@example.com',
    surname: '鈴木',
    firstName: '美咲',
    nickname: 'みーちゃん',
    birthday: '1995-11-08',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-11'),
  },
  {
    id: '6',
    email: 'user4@example.com',
    surname: '高橋',
    firstName: '健太',
    nickname: 'けんちゃん',
    birthday: '1991-09-12',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2024-11-30'),
    updatedAt: new Date('2024-12-15'),
  },
  {
    id: '7',
    email: 'user5@example.com',
    surname: '山田',
    firstName: 'あかり',
    nickname: 'あかちゃん',
    birthday: '1993-04-25',
    role: UserRole.USER,
    status: UserStatus.INACTIVE,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-12-01'),
  },
]

// 管理者統計情報用のモックデータ
export const MOCK_USER_STATS = {
  totalUsers: MOCK_USERS.filter(u => u.role === UserRole.USER).length,
  activeUsers: MOCK_USERS.filter(u => u.role === UserRole.USER && u.status === UserStatus.ACTIVE).length,
  inactiveUsers: MOCK_USERS.filter(u => u.role === UserRole.USER && u.status === UserStatus.INACTIVE).length,
  todayNewUsers: MOCK_USERS.filter(u => {
    const today = new Date()
    const userDate = new Date(u.createdAt)
    return userDate.toDateString() === today.toDateString()
  }).length,
}

// モック認証トークン生成関数
export const generateMockTokens = (userRole: UserRole) => ({
  accessToken: `mock_${userRole}_token_${Date.now()}`,
  refreshToken: 'mock-refresh-token-67890',
})

// デフォルトモック認証トークン
export const MOCK_TOKENS = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
}