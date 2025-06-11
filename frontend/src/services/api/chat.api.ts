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
      const response = await api.post<ChatMessageResponse>(API_PATHS.CHAT.SEND_MESSAGE, request)
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
      const partnerId = params?.partnerId || ''
      const response = await api.get<MessageListResponse>(
        API_PATHS.CHAT.MESSAGES(partnerId),
        params
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
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
  generateImage: async (prompt: string, emotion?: string): Promise<ApiResponse<{ imageUrl: string }>> => {
    try {
      const response = await api.post<{ imageUrl: string }>(API_PATHS.CHAT.GENERATE_IMAGE, {
        prompt,
        emotion
      })
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