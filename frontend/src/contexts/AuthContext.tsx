'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { User, LoginRequest, RegisterRequest, UserRole } from '@/types'
import { authService } from '@/services'
import { useRouter } from 'next/navigation'
import { refreshAccessToken } from '@/lib/token-manager'

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
  // SSRとCSRで一貫性を保つため、初期値をfalseに設定
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // トークンの自動更新をスケジュール
  const scheduleTokenRefresh = (accessToken: string) => {
    try {
      // 既存のタイマーをクリア
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      // JWTトークンのペイロードを解析
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const expiresAt = payload.exp * 1000 // ミリ秒に変換
      const now = Date.now()
      
      // 有効期限の5分前にリフレッシュ（最小1分前）
      const refreshTime = Math.max(expiresAt - now - 5 * 60 * 1000, 60 * 1000)
      
      console.log('[AUTH] トークン自動更新をスケジュール:', {
        expiresAt: new Date(expiresAt).toLocaleString(),
        refreshAt: new Date(now + refreshTime).toLocaleString(),
        minutesUntilRefresh: Math.round(refreshTime / 1000 / 60)
      })

      refreshTimerRef.current = setTimeout(async () => {
        console.log('[AUTH] トークン自動更新を実行中...')
        const success = await refreshAccessToken()
        
        if (success) {
          console.log('[AUTH] トークン自動更新成功')
          // 新しいトークンで再度スケジュール
          const newToken = localStorage.getItem('access_token')
          if (newToken) {
            scheduleTokenRefresh(newToken)
          }
        } else {
          console.log('[AUTH] トークン自動更新失敗。ログアウトします。')
          await logout()
        }
      }, refreshTime)
    } catch (error) {
      console.error('[AUTH] トークン更新スケジュールエラー:', error)
    }
  }

  // 初期認証チェック
  useEffect(() => {
    console.log('[AUTH PROVIDER] useEffect triggered, typeof window:', typeof window)
    
    // 公開ページでは認証チェックをスキップ
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const publicPaths = ['/login', '/register', '/', '/onboarding']
      
      if (publicPaths.includes(currentPath)) {
        console.log('[AUTH PROVIDER] Skipping auth check on public page:', currentPath)
        setLoading(false)
        return
      }
    }
    
    // クライアントサイドでのみ認証チェックを実行
    console.log('[AUTH PROVIDER] Window is defined, calling checkAuth')
    setLoading(true) // 認証チェック開始時にのみtrueに設定
    checkAuth()
    
    // タイムアウトを設定して確実にloadingをfalseにする
    const timeout = setTimeout(() => {
      console.log('[AUTH PROVIDER] Timeout reached, forcing loading to false')
      setLoading(false)
    }, 3000) // 3秒後に強制的にloadingをfalseに
    
    return () => {
      clearTimeout(timeout)
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const checkAuth = async () => {
    console.log('[AUTH PROVIDER] checkAuth called')
    try {
      // 認証チェック
      const token = localStorage.getItem('access_token')
      if (token) {
        console.log('[AUTH DEBUG] Token found, checking validity...')
        
        // トークンの有効期限をローカルでチェック
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const now = Math.floor(Date.now() / 1000)
          console.log('[AUTH DEBUG] Token payload:', { exp: payload.exp, now, expired: payload.exp < now })
          
          if (payload.exp < now) {
            console.log('[AUTH DEBUG] Token expired locally, clearing storage')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setLoading(false)
            return
          }
        } catch (parseError) {
          console.log('[AUTH DEBUG] Token parsing failed, clearing storage')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setLoading(false)
          return
        }
        
        const response = await authService.getCurrentUser()
        console.log('getCurrentUser response:', response)
        if (response.success && response.data) {
          console.log('Setting user to:', response.data)
          setUser(response.data)
          
          // トークンの自動更新をスケジュール
          scheduleTokenRefresh(token)
        } else if (response.error === 'トークンの有効期限が切れています') {
          console.log('[AUTH DEBUG] Server reported token expired, clearing storage')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
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
      
      // トークンの自動更新をスケジュール
      scheduleTokenRefresh(accessToken)
      
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
    // トークン更新タイマーをクリア
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
    
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