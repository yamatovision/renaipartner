'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, RegisterRequest, UserRole } from '@/types'
import { authService } from '@/services'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 初期認証チェック
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // 認証チェック
      const token = localStorage.getItem('access_token')
      if (token) {
        const response = await authService.getCurrentUser()
        if (response.success && response.data) {
          setUser(response.data)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // エラー時はローカルストレージをクリア
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const loginRequest: LoginRequest = { email, password }
    const response = await authService.login(loginRequest)
    
    if (response.success && response.data) {
      // APIレスポンスから必要なデータを取得
      const { accessToken, refreshToken, user } = response.data
      
      // APIレスポンスから必要なデータを取得
      
      // アクセストークンがあるかチェック
      if (!accessToken) {
        throw new Error('認証情報が取得できませんでした')
      }
      
      // 本番用トークン保存
      localStorage.setItem('access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }
      
      // Cookieにも保存（ミドルウェア用）
      document.cookie = `auth-token=${accessToken}; path=/`
      
      setUser(user)
      
      // ログイン成功処理
      
      // ユーザーのロールに応じてリダイレクト先を決定
      if (user.role === UserRole.ADMIN) {
        // 管理者ページへリダイレクト
        router.push('/admin/users')
      } else {
        // ホームページへリダイレクト
        router.push('/home')
      }
    } else {
      throw new Error(response.error || 'ログインに失敗しました')
    }
  }

  const logout = async () => {
    await authService.logout()
    
    // トークン削除
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    // Cookie削除
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    setUser(null)
    router.push('/login')
  }

  const register = async (data: RegisterRequest) => {
    const response = await authService.register(data)
    
    if (response.success) {
      // 登録成功後は自動ログイン
      await login(data.email, data.password)
    } else {
      throw new Error(response.error || '登録に失敗しました')
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated,
      login, 
      logout, 
      register,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}