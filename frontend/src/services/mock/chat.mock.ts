import { 
  ApiResponse, 
  Message, 
  MessageSender,
  ChatMessageRequest,
  ChatMessageResponse,
  MessageListResponse,
  TypingNotificationRequest,
  EmotionState
} from '@/types'

// モックメッセージデータ
const mockMessages: Message[] = [
  {
    id: '1',
    partnerId: 'partner1',
    content: 'おはよう！今日はどんな一日になるかな？',
    sender: MessageSender.PARTNER,
    emotion: 'happy',
    context: { mood: 'cheerful' },
    createdAt: new Date('2024-01-01T08:00:00Z'),
    updatedAt: new Date('2024-01-01T08:00:00Z')
  },
  {
    id: '2',
    partnerId: 'partner1',
    content: 'おはよう！今日も頑張ろう！',
    sender: MessageSender.USER,
    createdAt: new Date('2024-01-01T08:05:00Z'),
    updatedAt: new Date('2024-01-01T08:05:00Z')
  },
  {
    id: '3',
    partnerId: 'partner1',
    content: 'そうだね！一緒に頑張ろう♪ 何か楽しい予定はある？',
    sender: MessageSender.PARTNER,
    emotion: 'excited',
    context: { mood: 'supportive' },
    createdAt: new Date('2024-01-01T08:06:00Z'),
    updatedAt: new Date('2024-01-01T08:06:00Z')
  }
]

// チャットAPI モックサービス
export const mockChatService = {
  // メッセージ送信
  sendMessage: async (request: ChatMessageRequest): Promise<ApiResponse<ChatMessageResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 800)) // API遅延シミュレーション
    
    // 新しいユーザーメッセージを作成
    const userMessage: Message = {
      id: Date.now().toString(),
      partnerId: request.partnerId,
      content: request.message,
      sender: MessageSender.USER,
      context: request.context,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // パートナーからの返答を生成
    const responses = [
      'そうなんだ！面白いね♪',
      'うんうん、分かる！',
      '本当にそう思う！',
      'へぇ〜、知らなかった！',
      'それは素敵だね！',
      'なるほど、そういうことなんだね',
      'すごいじゃない！',
      'おもしろい話だね〜'
    ]
    
    const partnerResponse = responses[Math.floor(Math.random() * responses.length)]
    const partnerMessage: Message = {
      id: (Date.now() + 1).toString(),
      partnerId: request.partnerId,
      content: partnerResponse,
      sender: MessageSender.PARTNER,
      emotion: 'happy',
      context: { replyTo: request.message },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return {
      success: true,
      data: {
        response: partnerResponse,
        emotion: 'happy',
        intimacyLevel: 75,
        newMessages: [userMessage, partnerMessage]
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
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const page = params?.page || 1
    const limit = params?.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    let filteredMessages = mockMessages
    
    // パートナーIDでフィルタ
    if (params?.partnerId) {
      filteredMessages = mockMessages.filter(msg => msg.partnerId === params.partnerId)
    }
    
    // 日付でフィルタ
    if (params?.since) {
      filteredMessages = filteredMessages.filter(msg => msg.createdAt >= params.since!)
    }
    
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex)
    
    return {
      success: true,
      data: {
        messages: paginatedMessages,
        total: filteredMessages.length,
        page,
        limit,
        hasMore: endIndex < filteredMessages.length
      }
    }
  },

  // タイピング通知送信
  sendTypingNotification: async (request: TypingNotificationRequest): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      success: true,
      data: undefined
    }
  },

  // 感情状態取得
  getEmotion: async (partnerId: string): Promise<ApiResponse<EmotionState>> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const emotions = ['happy', 'excited', 'content', 'thoughtful', 'playful']
    const currentEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    
    return {
      success: true,
      data: {
        current: currentEmotion,
        intensity: Math.floor(Math.random() * 100),
        previousEmotions: emotions.slice(0, 3)
      }
    }
  },

  // 画像生成（チャット用）
  generateImage: async (request: {
    partnerId: string
    context: string
    emotion?: string
  }): Promise<ApiResponse<{ imageUrl: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 2000)) // 画像生成は時間がかかる
    
    return {
      success: true,
      data: {
        imageUrl: `https://picsum.photos/400/600?random=${Date.now()}`
      }
    }
  }
}