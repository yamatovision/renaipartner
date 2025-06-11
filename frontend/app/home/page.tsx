'use client'

// U-001: ホーム（チャット）ページ
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Message, 
  Partner, 
  SendMessageRequest,
  MessageSender 
} from '@/types'
import { chatService, partnersService } from '@/services'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 背景画像のプリセット
  const backgrounds = [
    'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&q=80)',
    'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80)',
    'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80)',
    'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80)',
    'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=800&q=80)'
  ]

  // モックインジケーター表示は layout.tsx で処理

  // パートナーとメッセージの取得
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadPartnerAndMessages()
  }, [user])

  const loadPartnerAndMessages = async () => {
    if (!user) return

    try {
      // パートナー一覧を取得
      const partnersResponse = await partnersService.getPartners(user.id)
      if (partnersResponse.success && partnersResponse.data && partnersResponse.data.length > 0) {
        const firstPartner = partnersResponse.data[0]
        setPartner(firstPartner)

        // メッセージ履歴を取得
        const messagesResponse = await chatService.getMessages(firstPartner.id)
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data)
        }
      } else {
        // パートナーがいない場合はオンボーディングへ
        router.push('/onboarding')
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // メッセージ送信
  const sendMessage = async () => {
    if (!inputMessage.trim() || !partner || sending) return

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      partnerId: partner.id,
      content: inputMessage,
      sender: MessageSender.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)
    setIsTyping(true)

    try {
      const request: SendMessageRequest = {
        partnerId: partner.id,
        message: userMessage.content,
        context: {
          intimacyLevel: partner.intimacyLevel,
          lastMessages: messages.slice(-5)
        }
      }

      const response = await chatService.sendMessage(request)
      
      if (response.success && response.data) {
        setIsTyping(false)
        
        // AIの返答を追加
        const newMessages = response.data.newMessages
        if (newMessages && Array.isArray(newMessages)) {
          setMessages(prev => [...prev, ...newMessages])
        }

        // 親密度を更新
        if (response.data.intimacyLevel !== partner?.intimacyLevel) {
          setPartner(prev => prev ? { ...prev, intimacyLevel: response.data!.intimacyLevel } : null)
        }
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      setIsTyping(false)
    } finally {
      setSending(false)
    }
  }

  // スクロールを最下部に
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // 背景変更
  const changeBackground = () => {
    setBackgroundIndex((prev) => (prev + 1) % backgrounds.length)
  }

  // 画像生成（モック）
  const generateImage = async () => {
    if (!partner) return

    setIsTyping(true)
    
    try {
      const response = await chatService.generateImage(
        '君を思って作った画像',
        'happy'
      )

      if (response.success && response.data) {
        const imageMessage: Message = {
          id: `img-${Date.now()}`,
          partnerId: partner.id,
          content: `君のこと思って、こんな画像を作ってみたよ💕`,
          sender: MessageSender.PARTNER,
          emotion: 'happy',
          context: {
            imageUrl: response.data.imageUrl,
            isGenerated: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setMessages(prev => [...prev, imageMessage])
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
    } finally {
      setIsTyping(false)
    }
  }

  // 現在時刻の取得
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">パートナーが見つかりません</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90 transition-opacity"
          >
            パートナーを作成
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* パートナーアバター */}
            <div className="w-12 h-12 rounded-full bg-white/20 border-3 border-white flex items-center justify-center">
              <span className="text-2xl">
                {partner.gender === 'boyfriend' ? '👨' : '👩'}
              </span>
            </div>
            
            {/* パートナー情報 */}
            <div>
              <h2 className="text-xl font-medium">{partner.name}</h2>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span className="text-green-400 text-xs animate-pulse">●</span>
                <span>会話中</span>
              </div>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center gap-2">
            <button
              onClick={changeBackground}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="背景変更"
            >
              🎨
            </button>
            <button
              onClick={generateImage}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="画像生成"
            >
              📸
            </button>
            <button
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="メニュー"
            >
              ⋮
            </button>
          </div>
        </div>
      </header>

      {/* チャットエリア */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{
          backgroundImage: backgrounds[backgroundIndex],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === MessageSender.USER ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {message.sender === MessageSender.PARTNER && (
                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-lg">
                    {partner.gender === 'boyfriend' ? '👨' : '👩'}
                  </span>
                </div>
              )}
              
              <div className={`max-w-[70%]`}>
                <div
                  className={`
                    px-4 py-3 rounded-2xl shadow-sm
                    ${message.sender === MessageSender.USER 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {message.context?.imageUrl ? (
                    <div>
                      <img 
                        src={`https://picsum.photos/300/200?random=${message.id}`} 
                        alt="Generated" 
                        className="rounded-lg mb-2 max-w-full"
                      />
                      <p>{message.content}</p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                <p className={`
                  text-xs text-gray-500 mt-1
                  ${message.sender === MessageSender.USER ? 'text-right' : 'text-left'}
                `}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}
          
          {/* タイピングインジケーター */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center mr-2">
                <span className="text-lg">
                  {partner.gender === 'boyfriend' ? '👨' : '👩'}
                </span>
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 入力エリア */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <button
            onClick={generateImage}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="画像生成"
          >
            <span className="text-gray-600">🖼️</span>
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            disabled={sending}
          />
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || sending}
            className={`
              w-11 h-11 rounded-full flex items-center justify-center transition-all
              ${inputMessage.trim() && !sending
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            📤
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}