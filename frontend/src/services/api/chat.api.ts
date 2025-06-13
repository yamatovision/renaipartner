// チャットAPI実サービス実装
import {
  Message,
  ChatMessageRequest,
  ChatMessageResponse,
  MessageListResponse,
  TypingNotificationRequest,
  EmotionState,
  ApiResponse,
  API_PATHS
} from '@/types'
import { api } from './client'

// 実チャットAPIサービス
export const chatApiService = {
  // メッセージ送信
  sendMessage: async (request: ChatMessageRequest): Promise<ApiResponse<ChatMessageResponse>> => {
    try {
      const response = await api.post<any>(API_PATHS.CHAT.SEND_MESSAGE, request)
      
      // APIレスポンスが既に{success, data}形式の場合はそのまま返す
      if (response && (response as any).success !== undefined) {
        return response as ApiResponse<ChatMessageResponse>
      }
      
      // そうでない場合は従来の形式でラップ
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'メッセージの送信に失敗しました',
      }
    }
  },

  // メッセージ履歴取得
  getMessages: async (params?: {
    partnerId?: string
    page?: number
    limit?: number
    since?: Date
  }): Promise<ApiResponse<MessageListResponse>> => {
    try {
      console.log('[CHAT API] getMessages called with params:', params)
      console.log('[CHAT API] API path:', API_PATHS.CHAT.MESSAGES)
      
      const response = await api.get<any>(
        API_PATHS.CHAT.MESSAGES,
        params
      )
      
      console.log('[CHAT API] Raw API response:', response)
      console.log('[CHAT API] Response type:', typeof response)
      console.log('[CHAT API] Response keys:', Object.keys(response || {}))
      
      // APIレスポンスが既に{success, data}形式の場合はそのまま返す
      if (response && (response as any).success !== undefined) {
        return response as ApiResponse<MessageListResponse>
      }
      
      // そうでない場合は従来の形式でラップ
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('[CHAT API] getMessages error:', error)
      console.error('[CHAT API] Error details:', error.message)
      return {
        success: false,
        error: error.message || 'メッセージ履歴の取得に失敗しました',
      }
    }
  },

  // タイピング状態通知
  sendTypingNotification: async (request: TypingNotificationRequest): Promise<ApiResponse<void>> => {
    try {
      await api.post<void>(API_PATHS.CHAT.TYPING(request.partnerId), request)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'タイピング通知の送信に失敗しました',
      }
    }
  },

  // 感情状態取得
  getEmotionState: async (partnerId: string): Promise<ApiResponse<EmotionState>> => {
    try {
      const response = await api.get<EmotionState>(API_PATHS.CHAT.EMOTION, { partnerId })
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '感情状態の取得に失敗しました',
      }
    }
  },

  // 画像生成
  generateImage: async (partnerId: string, context: string, emotion?: string): Promise<ApiResponse<{ imageUrl: string }>> => {
    try {
      const response = await api.post<any>(API_PATHS.CHAT.GENERATE_IMAGE, {
        partnerId,
        context,
        emotion
      })
      
      console.log('[CHAT API] generateImage raw response:', response)
      
      // APIレスポンスが既に{success, data}形式の場合はそのまま返す
      if (response && (response as any).success !== undefined) {
        return response as ApiResponse<{ imageUrl: string }>
      }
      
      // そうでない場合は従来の形式でラップ
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '画像生成に失敗しました',
      }
    }
  },
}