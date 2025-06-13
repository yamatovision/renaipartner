'use client'

// U-001: ホーム（チャット）ページ
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useBackground } from '@/hooks/useBackground'
import { 
  Message, 
  Partner, 
  SendMessageRequest,
  MessageSender,
  RelationshipMetrics,
  ContinuousTopic,
  MessageListResponse,
  ChatMessageResponse
} from '@/types'
import { chatService, partnersService, memoryService } from '@/services'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    currentBackground, 
    getCurrentBackgroundStyle, 
    cycleThroughBackgrounds,
    isLoading: isLoadingBackground 
  } = useBackground()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [relationshipMetrics, setRelationshipMetrics] = useState<RelationshipMetrics | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [previousMetrics, setPreviousMetrics] = useState<RelationshipMetrics | null>(null)
  const [metricsChanges, setMetricsChanges] = useState<{intimacy?: number} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [continuousTopics, setContinuousTopics] = useState<ContinuousTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showMemoryDialog, setShowMemoryDialog] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([])
  const [memoryTitle, setMemoryTitle] = useState('')
  const [memoryDescription, setMemoryDescription] = useState('')
  const [savingMemory, setSavingMemory] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // モックインジケーター表示は layout.tsx で処理

  // メニューの外側クリックを検知
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // パートナーとメッセージの取得
  useEffect(() => {
    console.log('[HOME PAGE] useEffect triggered, user:', user)
    console.log('[HOME PAGE] User ID:', user?.id)
    console.log('[HOME PAGE] User authenticated:', !!user)
    
    if (!user) {
      console.log('[HOME PAGE] No user found, redirecting to login')
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
      console.log('Partner response:', partnersResponse)
      console.log('partnersResponse.success:', partnersResponse.success)
      console.log('partnersResponse.data:', partnersResponse.data)
      console.log('partnersResponse.data !== null:', partnersResponse.data !== null)
      
      if (partnersResponse.success && partnersResponse.data !== null && partnersResponse.data !== undefined) {
        const partnerData = partnersResponse.data
        setPartner(partnerData)
        console.log('Partner data (should be actual partner):', partnerData)

        // partnerId が undefined でないことを確認
        if (!partnerData.id) {
          console.error('Partner ID is undefined:', partnerData)
          return
        }

        // メッセージ履歴を取得
        console.log('[MESSAGE RESTORE] Fetching messages for partner:', partnerData.id)
        console.log('[MESSAGE RESTORE] API call starting...')
        
        const messagesResponse = await chatService.getMessages({
          partnerId: partnerData.id,
          page: 1,
          limit: 50
        })
        
        console.log('[MESSAGE RESTORE] API Response:', messagesResponse)
        console.log('[MESSAGE RESTORE] Response Success:', messagesResponse.success)
        console.log('[MESSAGE RESTORE] Response Data:', messagesResponse.data)
        console.log('[MESSAGE RESTORE] Response Error:', messagesResponse.error)
        
        if (messagesResponse.success && messagesResponse.data) {
          // 型安全な方法でメッセージを取得
          const responseData = messagesResponse.data as MessageListResponse
          const fetchedMessages = responseData.messages || []
          
          console.log('[MESSAGE RESTORE] Response data structure:', responseData)
          console.log('[MESSAGE RESTORE] 取得したメッセージ:', fetchedMessages)
          console.log('[MESSAGE RESTORE] メッセージ数:', fetchedMessages?.length)
          console.log('[MESSAGE RESTORE] メッセージが配列か確認:', Array.isArray(fetchedMessages))
          
          setMessages(Array.isArray(fetchedMessages) ? fetchedMessages : [])
        } else {
          console.error('[MESSAGE RESTORE] メッセージ取得失敗')
          console.error('[MESSAGE RESTORE] Error details:', messagesResponse.error)
          setMessages([])
        }

        // 関係性メトリクスを取得
        console.log('Loading relationship metrics for partner:', partnerData.id)
        loadRelationshipMetrics(partnerData.id)
        
        // 継続話題を取得
        console.log('Loading continuous topics for partner:', partnerData.id)
        loadContinuousTopics(partnerData.id)
      } else {
        // パートナーがいない場合はオンボーディングへ
        console.log('No partner found, redirecting to onboarding...')
        router.push('/onboarding')
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  // 関係性メトリクス取得
  const loadRelationshipMetrics = async (partnerId: string, showChanges: boolean = false) => {
    if (!partnerId) {
      console.error('PartnerId is undefined in loadRelationshipMetrics')
      return
    }
    
    try {
      setLoadingMetrics(true)
      console.log('Calling getRelationshipMetrics with partnerId:', partnerId)
      
      // 前回の値を保存（変化表示用）
      if (showChanges && relationshipMetrics) {
        setPreviousMetrics(relationshipMetrics)
      }
      
      // 実際のAPIを呼び出し
      const response = await memoryService.getRelationshipMetrics(partnerId)
      console.log('[METRICS DEBUG] API Response:', response)
      console.log('[METRICS DEBUG] Response Success:', response.success)
      console.log('[METRICS DEBUG] Response Data:', response.data)
      console.log('[METRICS DEBUG] Response Data Keys:', response.data ? Object.keys(response.data) : 'no data')
      
      if (response.success && response.data) {
        // 二重ネスト対応: APIレスポンス構造を確認
        let newMetrics = null
        
        // MemoryService形式のレスポンスをチェック
        const responseData = response.data as any
        if (responseData.current && responseData.current.intimacyLevel !== undefined) {
          // response.data.current形式
          newMetrics = responseData.current as RelationshipMetrics
          console.log('[METRICS DEBUG] Using response.data.current:', newMetrics)
        } else if (responseData.intimacyLevel !== undefined) {
          // 直接RelationshipMetrics形式
          newMetrics = responseData as RelationshipMetrics
          console.log('[METRICS DEBUG] Using response.data as RelationshipMetrics:', newMetrics)
        } else {
          console.error('[METRICS DEBUG] Invalid response structure:', response.data)
          newMetrics = null
        }
        
        console.log('[METRICS DEBUG] Final processed metrics:', newMetrics)
        console.log('[METRICS DEBUG] newMetrics.intimacyLevel:', newMetrics?.intimacyLevel)
        
        // 変化を計算
        if (showChanges && relationshipMetrics && newMetrics) {
          const changes = {
            intimacy: newMetrics.intimacyLevel - relationshipMetrics.intimacyLevel
          }
          
          // 変化があった場合のみ表示
          if (changes.intimacy !== 0) {
            setMetricsChanges(changes)
            // 3秒後に変化表示をクリア
            setTimeout(() => setMetricsChanges(null), 3000)
          }
        }
        
        console.log('[METRICS DEBUG] Setting new metrics:', newMetrics)
        if (newMetrics && newMetrics.intimacyLevel !== undefined) {
          console.log('[METRICS DEBUG] About to call setRelationshipMetrics with valid metrics:', newMetrics)
          setRelationshipMetrics(newMetrics)
          console.log('[METRICS DEBUG] setRelationshipMetrics called successfully')
        } else {
          console.error('[METRICS DEBUG] Invalid metrics data, not setting state:', newMetrics)
          console.log('[METRICS DEBUG] Will use fallback data')
          // フォールバックへ
        }
      } else {
        console.error('関係性メトリクスAPI呼び出し失敗:', response.error)
        console.log('[METRICS DEBUG] Using fallback mock data')
        // フォールバック: モックデータを使用
        const mockMetrics = {
          id: partnerId,
          partnerId: partnerId,
          intimacyLevel: 85,
          conversationFrequency: 0,
          lastInteraction: new Date(),
          sharedMemories: 0
        }
        console.log('[METRICS DEBUG] Mock metrics:', mockMetrics)
        setRelationshipMetrics(mockMetrics)
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
      // メッセージIDの配列を作成（最低1つは必要）
      const messageIds = recentMessages
        .filter(msg => msg.id && msg.id.trim() !== '')
        .map(msg => msg.id)

      // メッセージIDが存在しない場合はスキップ
      if (messageIds.length === 0) {
        console.log('要約対象のメッセージがありません')
        return
      }

      const response = await memoryService.createSummary({
        partnerId,
        messageIds,
        summaryType: 'daily'
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
    if (!partnerId) {
      console.error('PartnerId is undefined in loadContinuousTopics')
      return
    }
    
    try {
      setLoadingTopics(true)
      console.log('Calling getContinuousTopics with partnerId:', partnerId)
      
      // 実際のAPIを呼び出し
      const response = await memoryService.getContinuousTopics(partnerId)
      if (response.success && response.data) {
        setContinuousTopics(response.data)
      } else {
        console.error('継続話題API呼び出し失敗:', response.error)
        // フォールバック: モックデータを使用
        const mockTopics = [
          {
            id: 'topic-1',
            partnerId: partnerId,
            topic: '趣味について',
            relatedPeople: [],
            status: 'active' as const,
            emotionalWeight: 0.7,
            updates: [
              {
                date: new Date(),
                content: '初回の会話で趣味について話しました'
              }
            ],
            nextCheckIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1週間後
          }
        ]
        setContinuousTopics(mockTopics)
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

    console.log('🔍 [DEBUG] メッセージ送信開始')
    console.log('🔍 [DEBUG] 送信前のmessages状態:', messages)
    console.log('🔍 [DEBUG] 追加するuserMessage:', userMessage)
    console.log('🔍 [DEBUG] partner.id:', partner.id)
    
    // ユーザーメッセージを即座に画面に追加
    setMessages(prev => {
      const currentMessages = Array.isArray(prev) ? prev : []
      return [...currentMessages, userMessage]
    })
    
    setInputMessage('')
    setSending(true)
    setIsTyping(true)

    try {
      // メッセージ履歴を軽量化（最新3件のみ、必要な情報のみ）
      const lightMessages = messages ? messages.slice(-3).map(msg => ({
        content: msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content,
        sender: msg.sender,
        emotion: msg.emotion
      })) : []

      const request: SendMessageRequest = {
        partnerId: partner.id,
        message: userMessage.content,
        context: {
          intimacyLevel: partner.intimacyLevel,
          lastMessages: lightMessages
        }
      }

      console.log('🔍 [DEBUG] API送信リクエスト:', request)
      const response = await chatService.sendMessage(request)
      console.log('🔍 [DEBUG] API応答全体:', response)
      console.log('🔍 [DEBUG] response.success:', response.success)
      console.log('🔍 [DEBUG] response.data:', response.data)
      
      // 型安全な方法でレスポンスを処理
      const actualData = response.data as ChatMessageResponse
      console.log('🔍 [DEBUG] actualData:', actualData)
      
      if (response.success && actualData) {
        setIsTyping(false)
        
        // AIの返答を追加
        const newMessages = actualData.newMessages
        console.log('🔍 [DEBUG] newMessages:', newMessages)
        console.log('🔍 [DEBUG] newMessages is array:', Array.isArray(newMessages))
        
        if (newMessages && Array.isArray(newMessages)) {
          // APIレスポンスからAIメッセージのみを抽出（ユーザーメッセージは既に追加済み）
          const aiMessages = newMessages.filter(msg => msg.sender === MessageSender.PARTNER)
          console.log('🔍 [DEBUG] AIメッセージのみ抽出:', aiMessages)
          
          setMessages(prev => {
            console.log('🔍 [DEBUG] AIメッセージ追加時のprev:', prev)
            const currentMessages = Array.isArray(prev) ? prev : []
            const updatedMessages = [...currentMessages, ...aiMessages]
            console.log('🔍 [DEBUG] AIメッセージ追加後の状態:', updatedMessages)
            return updatedMessages
          })
        } else {
          console.error('❌ [ERROR] newMessagesが配列ではない:', newMessages)
          console.log('🔍 [DEBUG] APIレスポンス構造を確認してください')
        }

        // 親密度を更新
        if (actualData.intimacyLevel !== partner?.intimacyLevel) {
          setPartner(prev => prev ? { ...prev, intimacyLevel: actualData.intimacyLevel } : null)
          // 関係性メトリクスも更新（変化を表示）
          if (partner) {
            loadRelationshipMetrics(partner.id, true)
          }
        }

        // 長時間会話の場合は要約を作成
        if (newMessages && Array.isArray(newMessages)) {
          setTimeout(() => {
            setMessages(currentMessages => {
              console.log('🔍 [DEBUG] 要約作成時のcurrentMessages長さ:', currentMessages.length)
              
              if (currentMessages.length > 0 && currentMessages.length % 20 === 0) {
                createConversationSummary(partner.id, currentMessages.slice(-20))
              }
              
              return currentMessages // 状態は変更せず、要約作成のみ
            })
          }, 100) // メッセージ追加後に実行
        }
      } else {
        console.error('❌ [ERROR] API応答が失敗:', response.error)
        setIsTyping(false)
      }
    } catch (error) {
      console.error('❌ [ERROR] メッセージ送信エラー:', error)
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

  // 思い出として保存
  const saveAsMemory = async () => {
    if (!partner || selectedMessages.length === 0) return

    setSavingMemory(true)
    try {
      // 選択されたメッセージのIDを取得
      const messageIds = selectedMessages
        .filter(msg => msg.id && msg.id.trim() !== '')
        .map(msg => msg.id)

      if (messageIds.length === 0) {
        alert('保存するメッセージを選択してください')
        return
      }

      // メモリ要約APIを呼び出し（エピソードメモリを作成）
      const response = await memoryService.createSummary({
        partnerId: partner.id,
        messageIds,
        summaryType: 'episode',
        episodeTitle: memoryTitle,
        episodeDescription: memoryDescription
      })

      if (response.success) {
        // 成功メッセージ
        alert('思い出として保存されました！')
        
        // ダイアログを閉じる
        setShowMemoryDialog(false)
        setSelectedMessages([])
        setMemoryTitle('')
        setMemoryDescription('')
        
        // 共有メモリ数を更新
        loadRelationshipMetrics(partner.id)
      } else {
        alert('保存に失敗しました: ' + response.error)
      }
    } catch (error) {
      console.error('思い出の保存エラー:', error)
      alert('思い出の保存中にエラーが発生しました')
    } finally {
      setSavingMemory(false)
    }
  }

  // 画像生成（モック）
  const generateImage = async () => {
    if (!partner) return

    setIsTyping(true)
    
    try {
      const response = await chatService.generateImage(
        partner.id,
        '君を思って作った画像',
        'happy'
      )

      console.log('🎨 [画像生成] API応答:', response)
      console.log('🎨 [画像生成] response全体:', JSON.stringify(response, null, 2))
      console.log('🎨 [画像生成] response.data:', response.data)
      console.log('🎨 [画像生成] response.data?.imageUrl:', response.data?.imageUrl)

      if (response.success && response.data && response.data.imageUrl) {
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

        console.log('🎨 [画像生成] 作成したメッセージ:', imageMessage)
        console.log('🎨 [画像生成] context.imageUrl:', imageMessage.context?.imageUrl)

        setMessages(prev => {
          const currentMessages = Array.isArray(prev) ? prev : []
          return [...currentMessages, imageMessage]
        })
      } else {
        console.error('🎨 [画像生成] エラー: レスポンスに画像URLが含まれていません', response)
        alert('画像生成に失敗しました。しばらく時間をおいてからお試しください。')
      }
    } catch (error) {
      console.error('🎨 [画像生成] エラー:', error)
      alert('画像生成中にエラーが発生しました。')
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
            onClick={() => {
              console.log('パートナーを作成ボタンがクリックされました')
              console.log('現在のURL:', window.location.href)
              console.log('オンボーディングにリダイレクト開始...')
              router.push('/onboarding')
            }}
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
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 md:p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            {/* パートナーアバター */}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 border-3 border-white overflow-hidden flex-shrink-0">
              {partner.appearance?.generatedImageUrl ? (
                <img 
                  src={partner.appearance.generatedImageUrl} 
                  alt={partner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-lg">
                    {partner.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {/* パートナー情報 */}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-medium truncate">{partner.name}</h2>
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm opacity-90">
                <span className="text-green-400 text-xs animate-pulse">●</span>
                <span className="hidden sm:inline">会話中</span>
                {relationshipMetrics && (
                  <span className="ml-1 md:ml-2 px-1 md:px-2 py-1 bg-white/20 rounded-full text-xs">
                    <span className="hidden sm:inline">親密度 </span>{relationshipMetrics.intimacyLevel}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button
              onClick={() => {
                console.log('🎨 [背景変更] ボタンがクリックされました')
                console.log('🎨 [背景変更] isLoadingBackground:', isLoadingBackground)
                console.log('🎨 [背景変更] currentBackground:', currentBackground)
                console.log('🎨 [背景変更] cycleThroughBackgrounds function:', cycleThroughBackgrounds)
                console.log('🎨 [背景変更] 関数呼び出し開始...')
                cycleThroughBackgrounds()
                  .then(() => {
                    console.log('🎨 [背景変更] 関数呼び出し完了')
                  })
                  .catch((error) => {
                    console.error('🎨 [背景変更] エラー:', error)
                  })
              }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-sm md:text-base"
              title="背景変更"
              disabled={isLoadingBackground}
            >
              🎨
            </button>
            <button
              onClick={() => {
                // 最新の10メッセージを自動選択
                const recentMessages = messages.slice(-10)
                setSelectedMessages(recentMessages)
                setShowMemoryDialog(true)
              }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-sm md:text-base"
              title="思い出を作成"
              disabled={messages.length === 0}
            >
              💝
            </button>
            <button
              onClick={generateImage}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-sm md:text-base"
              title="画像生成"
            >
              📸
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                title="メニュー"
              >
                ⋮
              </button>
              
              {/* ドロップダウンメニュー */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ⚙️ 設定
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      router.push('/login')
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    🚪 ログアウト
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* チャットエリア */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-2 md:p-4"
          style={getCurrentBackgroundStyle()}
        >
          <div className="max-w-none md:max-w-3xl mx-auto space-y-3 md:space-y-4">
          {messages && Array.isArray(messages) && messages.length > 0 ? messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === MessageSender.USER ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {message.sender === MessageSender.PARTNER && partner && (
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-200 mr-1 md:mr-2 flex-shrink-0 overflow-hidden">
                  {partner.appearance?.generatedImageUrl ? (
                    <img 
                      src={partner.appearance.generatedImageUrl} 
                      alt={partner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {partner.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className={`max-w-[85%] md:max-w-[70%]`}>
                <div
                  className={`
                    px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-sm text-sm md:text-base
                    ${message.sender === MessageSender.USER 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                    }
                  `}
                >
                  {message.context?.imageUrl ? (
                    <div>
                      <img 
                        src={message.context.imageUrl} 
                        alt="Generated" 
                        className="rounded-lg mb-2 max-w-full w-full max-w-xs"
                        onError={(e) => {
                          console.error('画像読み込みエラー:', message.context?.imageUrl);
                          e.currentTarget.src = '/images/placeholder.jpg'; // フォールバック画像
                        }}
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
          )) : (
            <div className="text-center py-8">
              <p className="text-gray-500">まだメッセージがありません。最初のメッセージを送信してみましょう！</p>
            </div>
          )}
          
          {/* タイピングインジケーター */}
          {isTyping && partner && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-200 mr-1 md:mr-2 overflow-hidden">
                {partner.appearance?.generatedImageUrl ? (
                  <img 
                    src={partner.appearance.generatedImageUrl} 
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-gray-100 px-3 py-2 md:px-4 md:py-3 rounded-2xl">
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

        {/* 関係性メトリクスサイドパネル - デスクトップのみ表示 */}
        <div className="hidden md:block w-80 bg-white/95 backdrop-blur-sm border-l border-gray-200 overflow-y-auto">
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
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">親密度</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-600">{relationshipMetrics?.intimacyLevel || 0}%</span>
                      {metricsChanges?.intimacy && (
                        <span className={`text-sm font-medium animate-pulse ${
                          metricsChanges.intimacy > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metricsChanges.intimacy > 0 ? '+' : ''}{metricsChanges.intimacy}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${relationshipMetrics?.intimacyLevel || 0}%` }}
                    ></div>
                  </div>
                  {/* ステージ表示 */}
                  <div className="mt-2 text-xs text-gray-600">
                    {(relationshipMetrics?.intimacyLevel ?? 0) < 20 ? '👋 知り合い' :
                     (relationshipMetrics?.intimacyLevel ?? 0) < 40 ? '🤝 友達' :
                     (relationshipMetrics?.intimacyLevel ?? 0) < 60 ? '💕 親しい関係' :
                     (relationshipMetrics?.intimacyLevel ?? 0) < 80 ? '💖 恋人' : '💑 深い絆'}
                  </div>
                </div>

                {/* 統計情報 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    📊 統計情報
                    <button
                      onClick={() => partner && loadRelationshipMetrics(partner.id)}
                      className="ml-auto text-xs text-purple-600 hover:text-purple-700"
                      title="統計を更新"
                    >
                      🔄
                    </button>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">💬 会話回数</span>
                      <span className="font-medium">{messages && Array.isArray(messages) ? messages.length : 0}回</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">🧠 共有メモリ</span>
                      <span className="font-medium">{relationshipMetrics?.sharedMemories || 0}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">⏰ 最後の会話</span>
                      <span className="font-medium text-xs">
                        {messages && messages.length > 0 ? 
                          new Date(messages[messages.length - 1].createdAt).toLocaleString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 
                          'まだなし'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">📈 関係の段階</span>
                      <span className="font-medium text-xs">
                        {(relationshipMetrics?.intimacyLevel ?? 0) < 20 ? '初対面' :
                         (relationshipMetrics?.intimacyLevel ?? 0) < 40 ? '友人関係' :
                         (relationshipMetrics?.intimacyLevel ?? 0) < 60 ? '親密な関係' :
                         (relationshipMetrics?.intimacyLevel ?? 0) < 80 ? '恋人関係' : 'パートナー'}
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
      <div className="bg-white border-t border-gray-200 p-2 md:p-4">
        <div className="max-w-none md:max-w-3xl mx-auto flex items-center gap-1 md:gap-2">
          <button
            onClick={generateImage}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-sm md:text-base"
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
            className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm md:text-base"
            disabled={sending}
          />
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || sending}
            className={`
              w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all text-sm md:text-base
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

      {/* 思い出作成ダイアログ */}
      {showMemoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">💝</span>
                思い出を作成
              </h2>
              
              {/* タイトル入力 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  value={memoryTitle}
                  onChange={(e) => setMemoryTitle(e.target.value)}
                  placeholder="例: 初めてのデート計画"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>
              
              {/* 説明入力 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  思い出の説明
                </label>
                <textarea
                  value={memoryDescription}
                  onChange={(e) => setMemoryDescription(e.target.value)}
                  placeholder="この会話の特別な瞬間について書いてください..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  maxLength={200}
                />
              </div>
              
              {/* 選択されたメッセージのプレビュー */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保存する会話（最新10件）
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto text-sm">
                  {selectedMessages.map((msg, index) => (
                    <div key={msg.id || index} className="mb-2 last:mb-0">
                      <span className={`font-medium ${
                        msg.sender === MessageSender.USER ? 'text-purple-600' : 'text-pink-600'
                      }`}>
                        {msg.sender === MessageSender.USER ? 'あなた' : partner?.name}:
                      </span>
                      <span className="ml-2 text-gray-700">
                        {msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* アクションボタン */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowMemoryDialog(false)
                    setMemoryTitle('')
                    setMemoryDescription('')
                    setSelectedMessages([])
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={savingMemory}
                >
                  キャンセル
                </button>
                <button
                  onClick={saveAsMemory}
                  disabled={!memoryTitle.trim() || savingMemory}
                  className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {savingMemory ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                      保存中...
                    </span>
                  ) : (
                    '思い出として保存'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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