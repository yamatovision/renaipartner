import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User,
  UserRole,
  ApiResponse 
} from '@/types'
import { MOCK_USERS, MOCK_TOKENS, generateMockTokens } from './data/users.mock'

// モック認証サービス
export const mockAuthService = {
  // ログイン
  login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    // 遅延を入れて実APIを模倣
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // モックユーザーを検索
    const user = MOCK_USERS.find(u => u.email === request.email)
    
    if (!user || request.password !== 'password123') {
      return {
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません',
      }
    }
    
    // ログイン成功 - ユーザーのロールに応じたトークン生成
    const tokens = generateMockTokens(user.role)
    return {
      success: true,
      data: {
        user,
        ...tokens,
      },
    }
  },

  // 登録
  register: async (request: RegisterRequest): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // メールアドレス重複チェック
    const exists = MOCK_USERS.some(u => u.email === request.email)
    if (exists) {
      return {
        success: false,
        error: 'このメールアドレスは既に使用されています',
      }
    }
    
    // 新規ユーザー作成
    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email: request.email,
      surname: request.surname,
      firstName: request.firstName,
      birthday: request.birthday,
      role: request.role || UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    MOCK_USERS.push(newUser)
    
    return {
      success: true,
      data: newUser,
    }
  },

  // ログアウト
  logout: async (): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // モックなので特に処理なし
    return { success: true }
  },

  // トークンリフレッシュ
  refresh: async (): Promise<ApiResponse<LoginResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // モックなので常に成功
    return {
      success: true,
      data: {
        user: MOCK_USERS[0],
        ...MOCK_TOKENS,
      },
    }
  },

  // 現在のユーザー取得
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // モックなので最初のユーザーを返す
    return {
      success: true,
      data: MOCK_USERS[0],
    }
  },
}