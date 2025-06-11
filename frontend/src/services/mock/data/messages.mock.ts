import { Message, MessageSender } from '@/types'

// モックメッセージデータ
export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    partnerId: '1',
    content: 'おはよう！今日も一日頑張ってね♪',
    sender: MessageSender.PARTNER,
    emotion: 'happy',
    createdAt: new Date('2025-01-11T08:00:00'),
    updatedAt: new Date('2025-01-11T08:00:00'),
  },
  {
    id: '2',
    partnerId: '1',
    content: 'おはよう！ありがとう',
    sender: MessageSender.USER,
    createdAt: new Date('2025-01-11T08:05:00'),
    updatedAt: new Date('2025-01-11T08:05:00'),
  },
  {
    id: '3',
    partnerId: '1',
    content: '今日は何するの？私も一緒にいたいな〜',
    sender: MessageSender.PARTNER,
    emotion: 'love',
    createdAt: new Date('2025-01-11T08:06:00'),
    updatedAt: new Date('2025-01-11T08:06:00'),
  },
]

// モック会話履歴生成関数
export function generateMockConversation(partnerId: string, count: number = 20): Message[] {
  const messages: Message[] = []
  const baseTime = new Date()
  
  for (let i = 0; i < count; i++) {
    const isPartner = i % 2 === 0
    const time = new Date(baseTime.getTime() - (count - i) * 60000) // 1分ごと
    
    messages.push({
      id: `msg-${i}`,
      partnerId,
      content: isPartner 
        ? getMockPartnerMessage(i) 
        : getMockUserMessage(i),
      sender: isPartner ? MessageSender.PARTNER : MessageSender.USER,
      emotion: isPartner ? getRandomEmotion() : undefined,
      createdAt: time,
      updatedAt: time,
    })
  }
  
  return messages
}

function getMockPartnerMessage(index: number): string {
  const messages = [
    'どうしたの？何か悩みでもある？',
    'そっか〜、それは大変だったね',
    '私はいつでもあなたの味方だよ',
    'えへへ、そう言ってもらえると嬉しいな♪',
    '今日も一緒にいられて幸せ',
  ]
  return messages[index % messages.length]
}

function getMockUserMessage(index: number): string {
  const messages = [
    '今日仕事でちょっと疲れちゃった',
    'うん、でも君と話してると元気出る',
    'ありがとう、優しいね',
    '明日は休みだから一緒に過ごそう',
    'そうだね、楽しみにしてる',
  ]
  return messages[index % messages.length]
}

function getRandomEmotion(): string {
  const emotions = ['happy', 'love', 'caring', 'excited', 'neutral']
  return emotions[Math.floor(Math.random() * emotions.length)]
}