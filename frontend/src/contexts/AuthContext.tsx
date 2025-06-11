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
      // モック環境での認証チェック
      const mockToken = localStorage.getItem('mockToken')
      const mockUser = localStorage.getItem('mockUser')
      
      if (mockToken && mockUser) {
        console.warn('🔧 Using MOCK authentication')
        setUser(JSON.parse(mockUser))
      } else {
        // 本番環境での認証チェック
        const token = localStorage.getItem('access_token')
        if (token) {
          const response = await authService.getCurrentUser()
          if (response.success && response.data) {
            setUser(response.data)
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // エラー時はローカルストレージをクリア
      localStorage.removeItem('mockToken')
      localStorage.removeItem('mockUser')
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
      // モック環境かどうかを判定
      const isMock = response.data.accessToken.startsWith('mock_')
      
      if (isMock) {
        // モック用トークン保存
        localStorage.setItem('mockToken', response.data.accessToken)
        localStorage.setItem('mockUser', JSON.stringify(response.data.user))
        
        // モック用Cookie保存（ミドルウェア用）
        document.cookie = `mock-auth-token=${response.data.accessToken}; path=/`
      } else {
        // 本番用トークン保存
        localStorage.setItem('access_token', response.data.accessToken)
        localStorage.setItem('refresh_token', response.data.refreshToken)
        
        // Cookieにも保存（ミドルウェア用）
        document.cookie = `auth-token=${response.data.accessToken}; path=/`
      }
      
      setUser(response.data.user)
      
      // ユーザーのロールに応じてリダイレクト先を決定
      if (response.data.user.role === UserRole.ADMIN) {
        router.push('/admin/users')
      } else {
        router.push('/home')
      }
    } else {
      throw new Error(response.error || 'ログインに失敗しました')
    }
  }

  const logout = async () => {
    await authService.logout()
    
    // モック用トークン削除
    localStorage.removeItem('mockToken')
    localStorage.removeItem('mockUser')
    
    // 本番用トークン削除
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    // Cookie削除
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'mock-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
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
    // モック環境の場合はmockUserも更新
    if (localStorage.getItem('mockToken')) {
      localStorage.setItem('mockUser', JSON.stringify(updatedUser))
    }
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