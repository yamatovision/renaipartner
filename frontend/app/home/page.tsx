'use client'

// U-001: ホーム（チャット）ページ
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Message, 
  Partner, 
  SendMessageRequest,
  MessageSender,
  RelationshipMetrics,
  ContinuousTopic 
} from '@/types'
import { chatService, partnersService, memoryService } from '@/services'

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
  const [relationshipMetrics, setRelationshipMetrics] = useState<RelationshipMetrics | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [continuousTopics, setContinuousTopics] = useState<ContinuousTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
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
      // パートナー情報を取得
      const partnersResponse = await partnersService.getPartner()
      if (partnersResponse.success && partnersResponse.data) {
        setPartner(partnersResponse.data)

        // メッセージ履歴を取得
        const messagesResponse = await chatService.getMessages({
          partnerId: partnersResponse.data.id,
          page: 1,
          limit: 50
        })
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data.messages)
        }

        // 関係性メトリクスを取得
        loadRelationshipMetrics(partnersResponse.data.id)
        
        // 継続話題を取得
        loadContinuousTopics(partnersResponse.data.id)
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

  // 関係性メトリクス取得
  const loadRelationshipMetrics = async (partnerId: string) => {
    try {
      setLoadingMetrics(true)
      const response = await memoryService.getRelationshipMetrics(partnerId)
      if (response.success && response.data) {
        setRelationshipMetrics(response.data)
      }
    } catch (error) {
      console.error('関係性メトリクスの取得に失敗しました:', error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  // 会話要約作成
  const createConversationSummary = async (partnerId: string, recentMessages: Message[]) => {
    try {
      const conversationData = recentMessages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.createdAt
      }))

      const response = await memoryService.createSummary({
        partnerId,
        conversationData,
        timeframe: '最近の会話'
      })

      if (response.success) {
        console.log('会話要約が作成されました:', response.data)
        // 関係性メトリクスを更新（要約により共有メモリが増える可能性）
        loadRelationshipMetrics(partnerId)
      }
    } catch (error) {
      console.error('会話要約の作成に失敗しました:', error)
    }
  }

  // メモリ検索
  const searchMemories = async (query: string) => {
    if (!partner || !query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const response = await memoryService.searchMemory({
        partnerId: partner.id,
        query: query.trim(),
        limit: 10
      })

      if (response.success && response.data) {
        setSearchResults(response.data.memories || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('メモリ検索に失敗しました:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // 継続話題取得
  const loadContinuousTopics = async (partnerId: string) => {
    try {
      setLoadingTopics(true)
      const response = await memoryService.getContinuousTopics(partnerId)
      if (response.success && response.data) {
        setContinuousTopics(response.data)
      }
    } catch (error) {
      console.error('継続話題の取得に失敗しました:', error)
    } finally {
      setLoadingTopics(false)
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
          // 関係性メトリクスも更新
          if (partner) {
            loadRelationshipMetrics(partner.id)
          }
        }

        // 長時間会話の場合は要約を作成
        const totalMessages = [...messages, userMessage, ...(newMessages || [])]
        if (totalMessages.length > 0 && totalMessages.length % 20 === 0) {
          createConversationSummary(partner.id, totalMessages.slice(-20))
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
                {relationshipMetrics && (
                  <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                    親密度 {relationshipMetrics.intimacyLevel}%
                  </span>
                )}
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

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex overflow-hidden">
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

        {/* 関係性メトリクスサイドパネル */}
        <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💝</span>
              関係性
            </h3>
            
            {loadingMetrics ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">読み込み中...</p>
              </div>
            ) : relationshipMetrics ? (
              <div className="space-y-4">
                {/* 親密度 */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">親密度</span>
                    <span className="text-lg font-bold text-purple-600">{relationshipMetrics.intimacyLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${relationshipMetrics.intimacyLevel}%` }}
                    ></div>
                  </div>
                </div>

                {/* 信頼度 */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">信頼度</span>
                    <span className="text-lg font-bold text-blue-600">{relationshipMetrics.trustLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${relationshipMetrics.trustLevel}%` }}
                    ></div>
                  </div>
                </div>

                {/* 感情的つながり */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">感情的つながり</span>
                    <span className="text-lg font-bold text-orange-600">{relationshipMetrics.emotionalConnection}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${relationshipMetrics.emotionalConnection}%` }}
                    ></div>
                  </div>
                </div>

                {/* 統計情報 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">統計情報</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">会話頻度</span>
                      <span className="font-medium">{relationshipMetrics.conversationFrequency}回/週</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">共有メモリ</span>
                      <span className="font-medium">{relationshipMetrics.sharedMemories}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最後の会話</span>
                      <span className="font-medium text-xs">
                        {new Date(relationshipMetrics.lastInteraction).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 更新ボタン */}
                <button
                  onClick={() => partner && loadRelationshipMetrics(partner.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  🔄 メトリクス更新
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">関係性データを読み込み中...</p>
              </div>
            )}

            {/* メモリ検索セクション */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">🔍</span>
                思い出検索
              </h4>
              
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.trim()) {
                      searchMemories(e.target.value)
                    } else {
                      setSearchResults([])
                    }
                  }}
                  placeholder="過去の会話を検索..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  </div>
                )}
              </div>

              {/* 検索結果 */}
              {searchResults.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((memory, index) => (
                    <div key={memory.id || index} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="font-medium text-gray-700 mb-1">{memory.type || '会話'}</div>
                      <div className="text-gray-600 line-clamp-2">{memory.content}</div>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {memory.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="px-1 py-0.5 bg-purple-100 text-purple-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() && !searchLoading ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  検索結果が見つかりませんでした
                </div>
              ) : null}
            </div>

            {/* 継続話題セクション */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">💬</span>
                話題の続き
              </h4>
              
              {loadingTopics ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-xs">読み込み中...</p>
                </div>
              ) : continuousTopics.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {continuousTopics.map((topic, index) => (
                    <div 
                      key={topic.id || index} 
                      className="bg-gray-50 p-2 rounded text-xs border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setInputMessage(`${topic.topic}について、`)
                        inputRef.current?.focus()
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-700">{topic.topic}</div>
                        <span className={`px-1 py-0.5 text-xs rounded ${
                          topic.status === 'active' ? 'bg-green-100 text-green-700' :
                          topic.status === 'dormant' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {topic.status === 'active' ? '継続中' : 
                           topic.status === 'dormant' ? '休眠中' : '解決済み'}
                        </span>
                      </div>
                      
                      {topic.relatedPeople && topic.relatedPeople.length > 0 && (
                        <div className="text-gray-600 mb-1">
                          👥 {topic.relatedPeople.join(', ')}
                        </div>
                      )}

                      {/* 感情の重み表示 */}
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`text-xs ${
                                i < topic.emotionalWeight ? 'text-orange-500' : 'text-gray-300'
                              }`}
                            >
                              ●
                            </span>
                          ))}
                        </div>
                        
                        {topic.nextCheckIn && (
                          <span className="text-xs text-gray-500">
                            次回: {new Date(topic.nextCheckIn).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                      
                      {/* 最新の更新 */}
                      {topic.updates && topic.updates.length > 0 && (
                        <div className="mt-1 text-gray-600 text-xs line-clamp-1">
                          最新: {topic.updates[topic.updates.length - 1].content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  まだ継続話題がありません
                </div>
              )}

              {/* 継続話題更新ボタン */}
              {continuousTopics.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => partner && loadContinuousTopics(partner.id)}
                    disabled={loadingTopics}
                    className="w-full py-1 px-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loadingTopics ? '更新中...' : '🔄 話題を更新'}
                  </button>
                </div>
              )}
            </div>
          </div>
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

      <style>{`
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