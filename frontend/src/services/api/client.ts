// APIクライアント基盤（実API用）
import { API_PATHS } from '@/types'

// APIベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// 共通のfetchラッパー
export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'エラーが発生しました' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

// 型安全なAPIクライアント
export const api = {
  get: <T>(path: string, params?: Record<string, any>) => {
    const url = new URL(`${API_BASE_URL}${path}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
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