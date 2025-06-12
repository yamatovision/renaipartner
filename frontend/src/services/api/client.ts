// APIクライアント基盤（実API用）
import { API_PATHS } from '@/types'

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
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')
  
  // デバッグログ: リクエスト詳細
  console.log('=== API Request Debug ===')
  console.log('Path:', path)
  console.log('URL:', `${API_BASE_URL}${path}`)
  console.log('Token exists:', !!token)
  console.log('Token preview:', token ? `${token.substring(0, 10)}...` : 'none')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  console.log('Headers:', headers)
  
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
  console.log('Headers:', Object.fromEntries(response.headers.entries()))
  
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
  
  delete: <T>(path: string) => 
    apiClient<T>(path, {
      method: 'DELETE',
    }),
}