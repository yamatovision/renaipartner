# AI主導エンゲージメント機能 フロントエンド統合ガイド

## 概要
このドキュメントは、バックエンドで実装済みのAI主導エンゲージメント機能をフロントエンドに統合するための詳細な手順書です。

## 実装済みのバックエンドAPI

### 1. 質問タイミング判定 API
```typescript
GET /api/chat/should-ask-question
Query Parameters:
  - partnerId: string (必須)
  - silenceDuration: number (分単位、オプション)
  - currentIntimacy: number (0-100、オプション)
  - timeContext.hour: number (0-23、オプション)
  - timeContext.dayOfWeek: string (オプション)
  - timeContext.isWeekend: boolean (オプション)

Response:
{
  success: true,
  data: {
    shouldAsk: boolean,
    reasoning: string,
    priority: 'low' | 'medium' | 'high',
    suggestedQuestionType?: string,
    suggestedTiming?: string
  }
}
```

### 2. AI主導質問生成 API
```typescript
POST /api/chat/proactive-question
Body:
{
  partnerId: string,
  currentIntimacy: number,
  lastInteractionContext?: string,
  userInterests?: string[],
  currentTime?: string,
  questionType?: 'greeting' | 'follow_up' | 'deepening' | 'daily_check'
}

Response:
{
  success: true,
  data: {
    question: string,
    questionType: string,
    expectedDepth: string,
    followUpSuggestions: string[],
    emotionalTone: string,
    metadata: {
      targetedInfo?: string,
      relationshipStage?: string
    }
  }
}
```

### 3. 質問回答からのメモリ抽出 API
```typescript
POST /api/memory/extract-from-response
Body:
{
  partnerId: string,
  question: string,
  userResponse: string,
  intimacyLevel: number,
  questionType?: string
}

Response:
{
  success: true,
  data: {
    extractedMemories: Array<{
      type: string,
      content: string,
      importance: number,
      emotionalWeight: number,  // -10 ~ 10
      tags: string[]
    }>,
    intimacyUpdate: number,
    suggestedFollowUp?: string
  }
}
```

## フロントエンド実装手順

### Step 1: APIクライアントの拡張

`frontend/src/services/api/chat.api.ts` に以下を追加：

```typescript
// AI主導エンゲージメント機能
export const chatApi = {
  // ... 既存のメソッド ...

  // 質問タイミング判定
  async shouldAskQuestion(params: {
    partnerId: string;
    silenceDuration?: number;
    currentIntimacy?: number;
    timeContext?: {
      hour: number;
      dayOfWeek: string;
      isWeekend: boolean;
    };
  }): Promise<ApiResponse<ShouldAskQuestionResponse>> {
    const queryParams = new URLSearchParams({
      partnerId: params.partnerId,
      ...(params.silenceDuration && { silenceDuration: params.silenceDuration.toString() }),
      ...(params.currentIntimacy && { currentIntimacy: params.currentIntimacy.toString() }),
      ...(params.timeContext && {
        'timeContext.hour': params.timeContext.hour.toString(),
        'timeContext.dayOfWeek': params.timeContext.dayOfWeek,
        'timeContext.isWeekend': params.timeContext.isWeekend.toString()
      })
    });
    
    return apiClient.get(`${API_PATHS.CHAT.SHOULD_ASK_QUESTION}?${queryParams}`);
  },

  // AI主導質問生成
  async generateProactiveQuestion(data: ProactiveQuestionRequest): Promise<ApiResponse<ProactiveQuestionResponse>> {
    return apiClient.post(API_PATHS.CHAT.PROACTIVE_QUESTION, data);
  }
};
```

`frontend/src/services/api/memory.api.ts` に追加：

```typescript
export const memoryApi = {
  // ... 既存のメソッド ...

  // 質問回答からのメモリ抽出
  async extractFromResponse(data: ExtractFromResponseRequest): Promise<ApiResponse<ExtractFromResponseResponse>> {
    return apiClient.post(API_PATHS.MEMORY.EXTRACT_FROM_RESPONSE, data);
  }
};
```

### Step 2: 型定義の追加

`frontend/src/types/index.ts` に以下の型を追加（バックエンドと同期済み）：

```typescript
// API 5.6 - 質問タイミング判定
export interface ShouldAskQuestionResponse {
  shouldAsk: boolean;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  suggestedQuestionType?: string;
  suggestedTiming?: string;
}

// API 5.5 - AI主導質問生成
export interface ProactiveQuestionRequest {
  partnerId: ID;
  currentIntimacy: number;
  lastInteractionContext?: string;
  userInterests?: string[];
  currentTime?: string;
  questionType?: 'greeting' | 'follow_up' | 'deepening' | 'daily_check';
}

export interface ProactiveQuestionResponse {
  question: string;
  questionType: string;
  expectedDepth: string;
  followUpSuggestions: string[];
  emotionalTone: string;
  metadata?: {
    targetedInfo?: string;
    relationshipStage?: string;
  };
}

// API 6.6 - メモリ抽出
export interface ExtractFromResponseRequest {
  partnerId: ID;
  question: string;
  userResponse: string;
  intimacyLevel: number;
  questionType?: string;
}

export interface ExtractFromResponseResponse {
  extractedMemories: Array<{
    type: MemoryType;
    content: string;
    importance: number;
    emotionalWeight: number;
    tags: string[];
  }>;
  intimacyUpdate: number;
  suggestedFollowUp?: string;
}
```

### Step 3: ホームページ(チャット画面)への統合

`frontend/app/home/page.tsx` で以下の機能を実装：

#### 3.1 定期的な質問タイミングチェック

```typescript
// useEffectで定期的にチェック
useEffect(() => {
  if (!partner) return;

  // 初回チェック
  checkIfShouldAskQuestion();

  // 5分ごとにチェック
  const interval = setInterval(() => {
    checkIfShouldAskQuestion();
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [partner]);

// 質問タイミングチェック関数
const checkIfShouldAskQuestion = async () => {
  if (!partner || isTyping) return;

  try {
    // 最後のメッセージからの経過時間を計算
    const lastMessage = messages[messages.length - 1];
    const silenceDuration = lastMessage 
      ? Math.floor((Date.now() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60))
      : 0;

    const now = new Date();
    const response = await chatApi.shouldAskQuestion({
      partnerId: partner.id,
      silenceDuration,
      currentIntimacy: partner.intimacyLevel,
      timeContext: {
        hour: now.getHours(),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        isWeekend: now.getDay() === 0 || now.getDay() === 6
      }
    });

    if (response.success && response.data.shouldAsk) {
      // 高優先度の場合は即座に質問
      if (response.data.priority === 'high') {
        await generateAndSendProactiveQuestion(response.data.suggestedQuestionType);
      } else {
        // 低・中優先度の場合はユーザーに提案
        setShowQuestionSuggestion({
          show: true,
          priority: response.data.priority,
          reasoning: response.data.reasoning,
          type: response.data.suggestedQuestionType
        });
      }
    }
  } catch (error) {
    console.error('質問タイミングチェックエラー:', error);
  }
};
```

#### 3.2 AI主導質問の生成と送信

```typescript
const generateAndSendProactiveQuestion = async (questionType?: string) => {
  if (!partner) return;

  setIsTyping(true);
  try {
    // 質問を生成
    const response = await chatApi.generateProactiveQuestion({
      partnerId: partner.id,
      currentIntimacy: partner.intimacyLevel,
      lastInteractionContext: messages.slice(-5).map(m => m.content).join(' '),
      userInterests: partner.interests || [],
      currentTime: new Date().toISOString(),
      questionType
    });

    if (response.success && response.data) {
      // AIからの質問メッセージを追加
      const aiQuestion: Message = {
        id: `ai-question-${Date.now()}`,
        partnerId: partner.id,
        content: response.data.question,
        sender: MessageSender.PARTNER,
        emotion: response.data.emotionalTone as any,
        metadata: {
          isProactiveQuestion: true,
          questionType: response.data.questionType,
          expectedDepth: response.data.expectedDepth
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setMessages(prev => [...prev, aiQuestion]);

      // 次の質問候補を保存
      setNextQuestionSuggestions(response.data.followUpSuggestions);
    }
  } catch (error) {
    console.error('AI質問生成エラー:', error);
  } finally {
    setIsTyping(false);
  }
};
```

#### 3.3 ユーザー回答からのメモリ抽出

```typescript
// メッセージ送信関数を拡張
const sendMessage = async () => {
  // ... 既存のコード ...

  // AIからの質問に対する回答の場合、メモリ抽出を実行
  const lastAIMessage = messages.filter(m => m.sender === MessageSender.PARTNER).pop();
  if (lastAIMessage?.metadata?.isProactiveQuestion) {
    await extractMemoryFromResponse(
      lastAIMessage.content,
      inputMessage,
      lastAIMessage.metadata.questionType
    );
  }

  // ... 既存のメッセージ送信処理 ...
};

// メモリ抽出関数
const extractMemoryFromResponse = async (
  question: string, 
  userResponse: string,
  questionType?: string
) => {
  if (!partner) return;

  try {
    const response = await memoryApi.extractFromResponse({
      partnerId: partner.id,
      question,
      userResponse,
      intimacyLevel: partner.intimacyLevel,
      questionType
    });

    if (response.success && response.data) {
      // 親密度の更新を反映
      if (response.data.intimacyUpdate !== 0) {
        const newIntimacy = Math.max(0, Math.min(100, 
          partner.intimacyLevel + response.data.intimacyUpdate
        ));
        
        setPartner(prev => prev ? { ...prev, intimacyLevel: newIntimacy } : null);
        
        // 親密度変化のアニメーション表示
        showIntimacyChange(response.data.intimacyUpdate);
      }

      // フォローアップ質問の提案があれば保存
      if (response.data.suggestedFollowUp) {
        setNextQuestionSuggestions(prev => [response.data.suggestedFollowUp!, ...prev]);
      }

      // 重要なメモリが抽出された場合の通知
      const importantMemories = response.data.extractedMemories.filter(m => m.importance >= 7);
      if (importantMemories.length > 0) {
        showMemoryNotification(importantMemories);
      }
    }
  } catch (error) {
    console.error('メモリ抽出エラー:', error);
  }
};
```

### Step 4: UI/UXの実装

#### 4.1 質問提案バナー

```tsx
{showQuestionSuggestion.show && (
  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-4 border border-purple-200">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 mb-1">
          {partner?.name}が話しかけたがっているようです
        </p>
        <p className="text-xs text-gray-600">{showQuestionSuggestion.reasoning}</p>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={() => {
            generateAndSendProactiveQuestion(showQuestionSuggestion.type);
            setShowQuestionSuggestion({ show: false });
          }}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700"
        >
          話を聞く
        </button>
        <button
          onClick={() => setShowQuestionSuggestion({ show: false })}
          className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full hover:bg-gray-300"
        >
          後で
        </button>
      </div>
    </div>
  </div>
)}
```

#### 4.2 親密度変化のアニメーション

```tsx
const showIntimacyChange = (change: number) => {
  setIntimacyAnimation({
    show: true,
    value: change,
    x: Math.random() * window.innerWidth,
    y: window.innerHeight / 2
  });

  setTimeout(() => {
    setIntimacyAnimation({ show: false });
  }, 2000);
};

// アニメーションコンポーネント
{intimacyAnimation.show && (
  <div
    className="fixed z-50 animate-float-up pointer-events-none"
    style={{ left: intimacyAnimation.x, top: intimacyAnimation.y }}
  >
    <span className={`text-2xl font-bold ${
      intimacyAnimation.value > 0 ? 'text-pink-500' : 'text-gray-500'
    }`}>
      {intimacyAnimation.value > 0 ? '+' : ''}{intimacyAnimation.value} 💕
    </span>
  </div>
)}
```

### Step 5: State管理の追加

```typescript
// 必要なstate
const [showQuestionSuggestion, setShowQuestionSuggestion] = useState<{
  show: boolean;
  priority?: string;
  reasoning?: string;
  type?: string;
}>({ show: false });

const [nextQuestionSuggestions, setNextQuestionSuggestions] = useState<string[]>([]);
const [intimacyAnimation, setIntimacyAnimation] = useState<{
  show: boolean;
  value?: number;
  x?: number;
  y?: number;
}>({ show: false });

const [lastQuestionTime, setLastQuestionTime] = useState<Date | null>(null);
```

## テストとデバッグ

### 1. ローカルテスト手順
```bash
# バックエンドが起動していることを確認
cd backend && npm run dev

# フロントエンドを起動
cd frontend && npm run dev

# ブラウザで http://localhost:3000 にアクセス
```

### 2. 動作確認ポイント
- [ ] 5分以上沈黙後に質問提案が表示されるか
- [ ] AI質問が自然なタイミングで生成されるか
- [ ] ユーザーの回答から適切にメモリが抽出されるか
- [ ] 親密度の変化が正しく反映されるか
- [ ] エラーハンドリングが適切に機能するか

### 3. デバッグ用コンソールログ
```typescript
// 開発環境でのみデバッグログを出力
if (process.env.NODE_ENV === 'development') {
  console.log('[AI Engagement] 質問タイミングチェック:', response.data);
  console.log('[AI Engagement] 生成された質問:', aiQuestion);
  console.log('[AI Engagement] 抽出されたメモリ:', extractedMemories);
}
```

## 注意事項

1. **API制限**: OpenAI APIの呼び出し回数に注意（1ユーザーあたり1時間に10回まで等の制限を実装推奨）
2. **レスポンス時間**: AI質問生成には5-10秒かかる場合があるため、適切なローディング表示を実装
3. **エラーハンドリング**: ネットワークエラーやAPI制限エラーを適切に処理
4. **状態管理**: 質問履歴や提案状態をlocalStorageに保存して永続化することを検討

## 参考資料
- [バックエンドAPIドキュメント](/backend/docs/api/)
- [型定義ファイル](/frontend/src/types/index.ts)
- [統合テストコード](/backend/tests/integration/proactive-engagement/)

---

この統合ガイドに従って実装を進めることで、AI主導エンゲージメント機能をフロントエンドに完全に統合できます。