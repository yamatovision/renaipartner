// APIクライアント基盤（実API用）
import { API_PATHS } from '@/types'
import { refreshAccessToken } from '@/lib/token-manager'

// APIベースURL
// 環境変数が空の場合の対処
const getApiBaseUrl = () => {
  // ビルド時の環境変数チェック
  if (typeof window === 'undefined') {
    // サーバーサイド（ビルド時）
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  }
  // クライアントサイド
  // 本番環境の場合は本番URLを使用
  if (window.location.hostname === 'renaipartner.web.app') {
    return 'https://renaipartner-backend-235426778039.asia-northeast1.run.app'
  }
  // 開発環境
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
}

const API_BASE_URL = getApiBaseUrl()

// 共通のfetchラッパー
export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  const token = localStorage.getItem('access_token')
  
  // デバッグログ: リクエスト詳細
  console.log('=== API Request Debug ===')
  console.log('Path:', path)
  console.log('URL:', `${API_BASE_URL}${path}`)
  console.log('Token exists:', !!token)
  console.log('Is Retry:', isRetry)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error: any) {
    console.error('Network Error:', error)
    console.error('URL:', `${API_BASE_URL}${path}`)
    console.error('Error Type:', error.name)
    console.error('Error Message:', error.message)
    throw new Error(`ネットワークエラー: ${error.message || 'サーバーに接続できません'}`)
  }
  
  // デバッグログ: レスポンス詳細
  console.log('=== API Response Debug ===')
  console.log('Status:', response.status)
  console.log('Status Text:', response.statusText)
  
  // 401エラー（認証エラー）の処理
  if (response.status === 401 && !isRetry) {
    console.log('[APIClient] 401エラーを検出。トークンのリフレッシュを試みます...')
    
    // リフレッシュAPIへのリクエストは除外（無限ループ防止）
    if (!path.includes('/auth/refresh')) {
      const refreshSuccess = await refreshAccessToken()
      
      if (refreshSuccess) {
        console.log('[APIClient] トークンリフレッシュ成功。リクエストをリトライします...')
        // 新しいトークンでリトライ
        return apiClient<T>(path, options, true)
      } else {
        console.log('[APIClient] トークンリフレッシュ失敗。')
        // リフレッシュ失敗時はログインページへ
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        
        // ログインページ、登録ページ、公開ページでは401エラーでもリダイレクトしない
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const publicPaths = ['/login', '/register', '/', '/onboarding']
          
          if (!publicPaths.includes(currentPath)) {
            console.log('[APIClient] 認証が必要なページから公開ページへリダイレクトします...')
            window.location.href = '/login'
          }
        }
        throw new Error('認証が必要です。再度ログインしてください。')
      }
    }
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'エラーが発生しました' }))
    console.error('API Error Response:', error)
    console.error('Full Response Object:', JSON.stringify(error, null, 2))
    
    // バリデーションエラーの詳細をログに出力
    if (error.meta?.errors) {
      console.error('Validation Errors:', error.meta.errors)
      const validationMessages = error.meta.errors
        .map((err: any) => `${err.path}: ${err.msg}`)
        .join(', ')
      throw new Error(`バリデーションエラー: ${validationMessages}`)
    }
    
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  
  const responseData = await response.json()
  console.log('Success Response Data:', responseData)
  
  return responseData
}

// 型安全なAPIクライアント
export const api = {
  get: <T>(path: string, params?: Record<string, any>) => {
    const url = new URL(`${API_BASE_URL}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }
    return apiClient<T>(url.pathname + url.search)
  },
  
  post: <T>(path: string, data?: any) => 
    apiClient<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T>(path: string, data?: any) => 
    apiClient<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  patch: <T>(path: string, data?: any) => 
    apiClient<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(path: string) => 
    apiClient<T>(path, {
      method: 'DELETE',
    }),
}