'use client'

// U-001: ホーム（チャット）ページ
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useBackground } from '@/hooks/useBackground'
import { useLocation } from '@/contexts/LocationContext'
import { useRelationshipMetrics } from '@/contexts/RelationshipMetricsContext'
import { LocationSelector } from '@/components/features/LocationSelector'
import { useLocationBackground } from '@/hooks/useLocationBackground'
import { 
  Message, 
  Partner, 
  SendMessageRequest,
  MessageSender,
  RelationshipMetrics,
  ContinuousTopic,
  MessageListResponse,
  ChatMessageResponse,
  QuestionType
} from '@/types'
import { chatService, partnersService, memoryService } from '@/services'

// メッセージコンポーネントをメモ化 - プロパティ比較関数追加
const MessageItem = memo(({ message, partner, formatTime }: {
  message: Message
  partner: Partner | null
  formatTime: (date: Date) => string
}) => {
  return (
    <div
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
            px-3 py-2 md:px-4 md:py-3 rounded-2xl text-sm md:text-base
            ${message.sender === MessageSender.USER 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
              : 'bg-white text-gray-800 shadow-md border border-gray-100'
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
                  if (e.currentTarget.src !== 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+') {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+';
                  }
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
  )
}, (prevProps, nextProps) => {
  // カスタム比較関数でプロパティの変更を正確に検知
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.sender === nextProps.message.sender &&
    prevProps.partner?.id === nextProps.partner?.id &&
    prevProps.partner?.name === nextProps.partner?.name &&
    prevProps.partner?.appearance?.generatedImageUrl === nextProps.partner?.appearance?.generatedImageUrl
  )
})

MessageItem.displayName = 'MessageItem'

// formatTime関数を外に移動
const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    currentBackground, 
    getCurrentBackgroundStyle, 
    isLoading: isLoadingBackground,
    error: backgroundError 
  } = useBackground()
  const { currentLocation } = useLocation()
  const { partner, relationshipMetrics, isLoading: isLoadingRelationship, error: relationshipError, updateIntimacyLevel, refreshMetrics, clearError } = useRelationshipMetrics()
  
  const { changeBackgroundForLocation } = useLocationBackground()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false)
  const [previousMetrics, setPreviousMetrics] = useState<RelationshipMetrics | null>(null)
  const [metricsChanges, setMetricsChanges] = useState<{intimacy?: number} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [continuousTopics, setContinuousTopics] = useState<ContinuousTopic[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLocationSelector, setShowLocationSelector] = useState(false)
  
  // AI主導エンゲージメント機能のstate
  const [showQuestionSuggestion, setShowQuestionSuggestion] = useState<{
    show: boolean;
    priority?: string;
    reasoning?: string;
    type?: string;
  }>({ show: false })
  const [nextQuestionSuggestions, setNextQuestionSuggestions] = useState<string[]>([])
  const [intimacyAnimation, setIntimacyAnimation] = useState<{
    show: boolean;
    value?: number;
    x?: number;
    y?: number;
  }>({ show: false })
  const [lastQuestionTime, setLastQuestionTime] = useState<Date | null>(null)
  const [lastAIQuestion, setLastAIQuestion] = useState<Message | null>(null)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // モックインジケーター表示は layout.tsx で処理

  // 親密度の変更を監視
  useEffect(() => {
    console.log('[Home] relationshipMetrics変更検知:', {
      intimacyLevel: relationshipMetrics?.intimacyLevel,
      partnerId: relationshipMetrics?.partnerId
    })
  }, [relationshipMetrics?.intimacyLevel])

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

  const loadMessages = useCallback(async () => {
    if (!user || !partner) return

    console.log('[DEBUG] loadMessages開始')

    // 既存のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 新しいAbortControllerを作成
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const messagesResponse = await chatService.getMessages({
        partnerId: partner.id,
        page: 1,
        limit: 50
      })
      
      console.log('[DEBUG] APIレスポンス受信:', messagesResponse.success)
      console.log('[DEBUG] controller.signal.aborted:', controller.signal.aborted)
      console.log('[DEBUG] abortControllerRef.current === controller:', abortControllerRef.current === controller)
      
      if (messagesResponse.success && messagesResponse.data) {
        const responseData = messagesResponse.data as MessageListResponse
        const fetchedMessages = responseData.messages || []
        console.log('[DEBUG] メッセージ数:', fetchedMessages.length)
        console.log('[DEBUG] 最初のメッセージ:', fetchedMessages[0])
        setMessages(Array.isArray(fetchedMessages) ? fetchedMessages : [])
        
        // 継続話題は初回読み込み時のみ（後で非同期で読み込む）
        if (fetchedMessages.length > 0) {
          setTimeout(() => {
            loadContinuousTopics(partner.id)
          }, 100)
        }
      } else {
        setMessages([])
      }
      
    } catch (error) {
      console.log('[DEBUG] エラー発生:', error)
      if (!controller.signal.aborted) {
        setMessages([])
      }
    } finally {
      console.log('[DEBUG] finally実行 - aborted:', controller.signal.aborted)
      // 現在のコントローラーがまだアクティブな場合のみローディングを解除
      if (abortControllerRef.current === controller) {
        console.log('[DEBUG] setLoading(false)実行')
        setLoading(false)
      }
    }
  }, [user, partner])

  // メッセージの取得
  useEffect(() => {
    console.log('[DEBUG] useEffect実行: user=', !!user, 'partner=', !!partner, 'hasLoadedMessages=', hasLoadedMessages)
    
    if (!user) {
      router.push('/login')
      return
    }

    if (partner && !hasLoadedMessages) {
      console.log('[DEBUG] useEffect: メッセージ読み込み開始')
      loadMessages()
      setHasLoadedMessages(true)
    }

    // クリーンアップ: コンポーネントアンマウント時にリクエストをキャンセル
    return () => {
      console.log('[DEBUG] useEffect: クリーンアップ実行')
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [user, partner, hasLoadedMessages])

  // 関係性メトリクスはRelationshipMetricsContextで管理

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
        refreshMetrics()
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

  // 継続話題取得 - 軽量化
  const loadContinuousTopics = useCallback(async (partnerId: string) => {
    if (!partnerId) return
    
    try {
      setLoadingTopics(true)
      const response = await memoryService.getContinuousTopics(partnerId)
      if (response.success && response.data) {
        setContinuousTopics(response.data)
      } else {
        setContinuousTopics([]) // モックデータは削除して軽量化
      }
    } catch (error) {
      setContinuousTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }, [])

  // メッセージ送信 - useCallbackで最適化
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !partner || sending) return

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      partnerId: partner.id,
      content: inputMessage,
      sender: MessageSender.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // state更新をバッチ化
    setMessages(prev => [...(Array.isArray(prev) ? prev : []), userMessage])
    setInputMessage('')
    setSending(true)
    setIsTyping(true)
    
    // AIからの質問に対する回答の場合、メモリ抽出を実行
    if (lastAIQuestion?.metadata?.isProactiveQuestion) {
      await extractMemoryFromResponse(
        lastAIQuestion.content,
        inputMessage,
        lastAIQuestion.metadata.questionType as QuestionType
      )
      setLastAIQuestion(null) // リセット
    }

    try {
      const request: SendMessageRequest = {
        partnerId: partner.id,
        message: userMessage.content,
        context: {
          intimacyLevel: partner.intimacyLevel,
          lastMessages: [] // 軽量化のため空配列に
        },
        locationId: currentLocation?.id
      }

      const response = await chatService.sendMessage(request)
      const actualData = response.data as ChatMessageResponse
      
      if (response.success && actualData) {
        const newMessages = actualData?.newMessages
        
        if (newMessages && Array.isArray(newMessages)) {
          // APIレスポンスからAIメッセージのみを抽出
          const aiMessages = newMessages.filter(msg => msg.sender === MessageSender.PARTNER)
          
          // state更新をバッチ化
          setIsTyping(false)
          setMessages(prev => [...(Array.isArray(prev) ? prev : []), ...aiMessages])
        } else {
          setIsTyping(false)
        }

        // 親密度を更新（即座に実行してUIに反映）
        if (actualData?.intimacyLevel !== undefined && actualData.intimacyLevel !== partner?.intimacyLevel) {
          console.log('[Home] 親密度更新検知:', {
            current: partner?.intimacyLevel,
            new: actualData.intimacyLevel,
            change: actualData.intimacyLevel - (partner?.intimacyLevel || 0)
          })
          // RelationshipMetricsContext経由で親密度を即座に更新
          updateIntimacyLevel(actualData.intimacyLevel)
        }

        // 要約作成は軽量化のため一時的に無効化
        // if (messages.length % 20 === 0) {
        //   createConversationSummary(partner.id, messages.slice(-20))
        // }
      } else {
        setIsTyping(false)
      }
    } catch (error) {
      setIsTyping(false)
    } finally {
      setSending(false)
    }
  }, [inputMessage, partner, sending, lastAIQuestion])

  // スクロールを最下部に - 軽量化
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])


  // AI主導エンゲージメント: 質問タイミングチェック関数
  const checkIfShouldAskQuestion = useCallback(async () => {
    if (!partner || isTyping) return

    try {
      // silenceDurationは簡略化（常に0として扱う）
      const silenceDuration = 0

      const now = new Date()
      const response = await chatService.shouldAskQuestion({
        partnerId: partner.id,
        silenceDuration,
        currentIntimacy: partner.intimacyLevel,
        timeContext: {
          hour: now.getHours(),
          dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend: now.getDay() === 0 || now.getDay() === 6
        }
      })

      if (response.success && response.data?.shouldAsk) {
        // 高優先度の場合は即座に質問
        if (response.data?.priority === 'high') {
          await generateAndSendProactiveQuestion(response.data?.suggestedQuestionType)
        } else {
          // 低・中優先度の場合はユーザーに提案
          setShowQuestionSuggestion({
            show: true,
            priority: response.data?.priority,
            reasoning: response.data?.reasoning,
            type: response.data?.suggestedQuestionType
          })
        }
      }
    } catch (error) {
      console.error('質問タイミングチェックエラー:', error)
    }
  }, [partner, isTyping])

  // AI主導エンゲージメント: AI主導質問の生成と送信
  const generateAndSendProactiveQuestion = async (questionType?: string) => {
    if (!partner) return

    setIsTyping(true)
    try {
      // 質問を生成
      const response = await chatService.generateProactiveQuestion({
        partnerId: partner.id,
        currentIntimacy: partner.intimacyLevel,
        lastInteractionContext: {
          topic: '', // 軽量化のため空文字
          depth: 'medium',
          emotionalTone: 'neutral'
        }
      })

      if (response.success && response.data) {
        // AIからの質問メッセージを追加
        const aiQuestion: Message = {
          id: `ai-question-${Date.now()}`,
          partnerId: partner.id,
          content: response.data?.question || '',
          sender: MessageSender.PARTNER,
          emotion: response.data?.emotionalTone as any,
          metadata: {
            isProactiveQuestion: true,
            questionType: response.data?.questionType,
            expectedDepth: response.data?.expectedDepth
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setMessages(prev => [...prev, aiQuestion])
        setLastAIQuestion(aiQuestion)
        setLastQuestionTime(new Date())

        // 次の質問候補を保存
        setNextQuestionSuggestions(response.data?.followUpSuggestions || [])
      }
    } catch (error) {
      console.error('AI質問生成エラー:', error)
    } finally {
      setIsTyping(false)
    }
  }

  // AI主導エンゲージメント: メモリ抽出関数
  const extractMemoryFromResponse = async (
    question: string, 
    userResponse: string,
    questionType?: QuestionType
  ) => {
    if (!partner) return

    try {
      const response = await memoryService.extractFromResponse({
        partnerId: partner.id,
        question,
        userResponse,
        intimacyLevel: partner.intimacyLevel,
        questionType
      })

      if (response.success && response.data) {
        // 親密度の更新を反映
        if (response.data?.intimacyUpdate) {
          const intimacyUpdate = response.data.intimacyUpdate
          const intimacyChange = intimacyUpdate.after - intimacyUpdate.before
          
          // RelationshipMetricsContext経由で親密度を更新
          updateIntimacyLevel(intimacyUpdate.after)
          
          // 親密度変化のアニメーション表示
          showIntimacyChange(intimacyChange)
        }

        // フォローアップ質問の提案があれば保存
        if (response.data?.suggestedFollowUp) {
          setNextQuestionSuggestions(prev => [response.data!.suggestedFollowUp!, ...prev])
        }

        // 重要なメモリが抽出された場合の通知
        const importantMemories = response.data?.extractedMemories?.filter(m => m.importance >= 7) || []
        if (importantMemories.length > 0) {
          console.log('重要なメモリが抽出されました:', importantMemories)
        }
      }
    } catch (error) {
      console.error('メモリ抽出エラー:', error)
    }
  }

  // AI主導エンゲージメント: 親密度変化アニメーション
  const showIntimacyChange = (change: number) => {
    setIntimacyAnimation({
      show: true,
      value: change,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })

    setTimeout(() => {
      setIntimacyAnimation({ show: false })
    }, 2000)
  }

  // 画像生成（モック）
  const generateImage = async () => {
    if (!partner) return

    setIsTyping(true)
    
    try {
      const response = await chatService.generateImage(
        partner.id,
        '君を思って作った画像',
        'happy',
        currentLocation?.id // 現在の場所IDを渡す
      )


      if (response.success && response.data?.imageUrl) {
        // 画像メッセージを直接追加（再読み込み不要）
        const imageMessage: Message = {
          id: `image-${Date.now()}`,
          partnerId: partner.id,
          content: '君を思って作った画像',
          sender: MessageSender.PARTNER,
          context: { imageUrl: response.data.imageUrl },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setMessages(prev => [...(Array.isArray(prev) ? prev : []), imageMessage])
      } else {
        alert('画像生成に失敗しました。')
      }
    } catch (error) {
      alert('画像生成中にエラーが発生しました。')
    } finally {
      setIsTyping(false)
    }
  }


  // エラー表示
  // エラー表示（背景エラーも含む）
  if ((relationshipError || backgroundError) && !isLoadingRelationship && !isLoadingBackground) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-red-500 text-4xl">⚠️</span>
          </div>
          <p className="text-red-600 mb-4">{relationshipError || backgroundError}</p>
          <button
            onClick={() => {
              clearError()
              window.location.reload()
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90 transition-opacity"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (loading || isLoadingRelationship) {
    console.log('[DEBUG] Loading state:', { loading, isLoadingRelationship, hasLoadedMessages, partner: !!partner })
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
          <p className="text-xs text-gray-500 mt-2">
            loading: {String(loading)}, isLoadingRelationship: {String(isLoadingRelationship)}
          </p>
          {relationshipError && (
            <p className="text-red-500 text-sm mt-2">データ読み込み中に問題が発生しました</p>
          )}
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
                {currentLocation && (
                  <span className="ml-1 md:ml-2 px-1 md:px-2 py-1 bg-white/20 rounded-full text-xs flex items-center gap-1">
                    <span>📍</span>
                    <span className="hidden sm:inline">{currentLocation.name}</span>
                    <span className="sm:hidden">{currentLocation.name.slice(0, 5)}...</span>
                  </span>
                )}
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
              onClick={() => setShowLocationSelector(true)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-sm md:text-base"
              title="場所変更"
            >
              📍
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
          {messages && Array.isArray(messages) && messages.length > 0 ? (
            <>
              {messages.map((message) => (
                <MessageItem 
                  key={message.id} 
                  message={message} 
                  partner={partner} 
                  formatTime={formatTime}
                />
              ))}
            </>
          ) : (
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
              <div className="bg-white px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-md border border-gray-100">
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
            
            {isLoadingRelationship ? (
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
                     (relationshipMetrics?.intimacyLevel ?? 0) < 80 ? '💖 恋人' : '💑 唯一無二の存在'}
                  </div>
                </div>

                {/* 統計情報 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    📊 統計情報
                    <button
                      onClick={() => refreshMetrics()}
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
                         (relationshipMetrics?.intimacyLevel ?? 0) < 80 ? '恋人関係' : '唯一無二の存在'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 更新ボタン */}
                <button
                  onClick={() => refreshMetrics()}
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


      {/* 場所選択モーダル */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationChange={async (locationId) => {
          console.log('場所が変更されました:', locationId)
          // 場所変更に伴う背景の自動切り替え
          await changeBackgroundForLocation(locationId)
        }}
      />

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
        
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }
        
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}