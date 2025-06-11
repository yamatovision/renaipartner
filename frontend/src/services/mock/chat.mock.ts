import { 
  Message,
  ChatResponse,
  SendMessageRequest,
  ApiResponse,
  MessageSender 
} from '@/types'
import { generateMockConversation, MOCK_MESSAGES } from './data/messages.mock'

// モックチャットサービス
export const mockChatService = {
  // メッセージ送信
  sendMessage: async (request: SendMessageRequest): Promise<ApiResponse<ChatResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 1000)) // AIの返答を模倣
    
    // モック返答生成
    const responses = [
      { response: 'そうなんだ！もっと詳しく聞かせて♪', emotion: 'curious' },
      { response: 'えへへ、嬉しいな〜！', emotion: 'happy' },
      { response: 'そっか...大丈夫？私がついてるよ', emotion: 'caring' },
      { response: 'すごいね！さすが私の大切な人♪', emotion: 'love' },
      { response: 'ふふっ、そういうところが好き', emotion: 'love' },
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    // 新しいメッセージを作成
    const newMessage: Message = {
      id: String(Date.now()),
      partnerId: request.partnerId,
      content: randomResponse.response,
      sender: MessageSender.PARTNER,
      emotion: randomResponse.emotion,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    return {
      success: true,
      data: {
        response: randomResponse.response,
        emotion: randomResponse.emotion,
        intimacyLevel: 65, // モック親密度
        newMessages: [newMessage],
      },
    }
  },

  // メッセージ履歴取得
  getMessages: async (
    partnerId: string, 
    offset: number = 0, 
    limit: number = 20
  ): Promise<ApiResponse<Message[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // モックデータ生成
    const allMessages = generateMockConversation(partnerId, 50)
    const messages = allMessages.slice(offset, offset + limit)
    
    return {
      success: true,
      data: messages,
      meta: {
        total: allMessages.length,
        offset,
        limit,
      },
    }
  },

  // タイピング状態通知
  notifyTyping: async (partnerId: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return { success: true }
  },

  // 画像生成
  generateImage: async (
    context: string,
    emotion?: string
  ): Promise<ApiResponse<{ imageUrl: string; consistencyScore: number }>> => {
    await new Promise(resolve => setTimeout(resolve, 2000)) // 画像生成を模倣
    
    return {
      success: true,
      data: {
        imageUrl: '/images/generated/sample.png',
        consistencyScore: 0.92,
      },
    }
  },
}