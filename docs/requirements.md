# 恋AIパートナー 要件定義書

**バージョン**: 1.1.0  
**最終更新日**: 2025-01-13  
**ステータス**: ドラフト  

## 1. プロジェクト概要

### 1.1 目的と背景

このプロジェクトは、ユーザーが理想のAIパートナー（彼氏・彼女）を作成し、感情的なつながりを持てる対話型システムを提供します。OpenAIのAPIと画像生成AIを活用し、パーソナライズされた親密な対話体験を実現することで、ユーザーの感情的ニーズを満たし、日常生活に寄り添う存在を創出します。

### 1.2 ターゲットユーザー

- **メインユーザー層（女性）**: 20代〜60代の感情的なつながりを求める女性
- **サブユーザー層（男性）**: 20代〜60代の親密な対話を求める男性
- **共通ニーズ**: 寂しさの解消、感情的サポート、理想のパートナー体験

### 1.3 核となる機能と価値

以下は、プロジェクトの本質的価値を提供するために「絶対に必要」な機能です。各機能は「この機能がないとプロジェクトの目的達成が不可能になる」という基準で厳選されています。

- **AIパートナーとの自然な会話機能**: ユーザーの感情に寄り添い、親密な対話を提供 - *この機能がないとAIパートナーとしての基本的な体験が提供できない*
- **コンテキスト保存機能**: 過去の会話を記憶し、継続的な関係性を構築 - *この機能がないと毎回初対面のような会話になり、感情的つながりが生まれない*
- **パートナーのビジュアル設定**: 画像生成AIによる理想の見た目の作成 - *この機能がないと感情移入が困難になり、親密さが生まれにくい*
- **性格・口調のカスタマイズ**: ユーザー好みの人格設定 - *この機能がないと画一的な応答になり、理想のパートナー体験が実現できない*
- **自動通知機能**: 朝の挨拶など日常的な存在感の演出 - *この機能がないと能動的にアプリを開く必要があり、日常に溶け込む体験が作れない*
- **AI主導エンゲージメント機能**: AIパートナーから積極的に質問を投げかけ、戦略的に関係性を深化 - *この機能がないと初心者ユーザーが会話に困り、ユーザー主導での関係構築に限界が生じる*

## 2. 画面一覧

このアプリケーションは以下の画面要素と実際のページで構成されます。各ページのモックアップは作成後に詳細化されます。

### 2.1 画面要素一覧

以下は機能的に必要な全ての画面要素です。これらは必ずしも独立したページとして実装されるわけではありません。

| 画面要素名 | 目的 | 実現する核心的価値 |
|----------|------|----------------|
| ログイン要素 | ユーザー認証 | プライバシー保護・個人データの安全性確保 |
| パートナー作成要素 | AIパートナーの初期設定 | 理想のパートナー像の具現化 |
| ビジュアル設定要素 | 見た目のカスタマイズ | 視覚的な感情移入の促進 |
| 性格設定要素 | 人格・口調の設定 | パーソナライズされた対話体験 |
| チャット要素 | 連続的なリアルタイム対話 | 感情的つながりの構築・永続的な関係性 |
| 背景画像選択要素 | チャット背景のカスタマイズ | 没入感の向上・雰囲気作り |
| 画像生成要素 | アバター一貫性保持画像生成 | 視覚的な関係性の深化 |
| 通知設定要素 | 自動メッセージの管理 | 日常的な存在感の調整 |
| プロフィール編集要素 | パートナー情報の更新 | 関係性の発展・変化への対応 |

### 2.2 ページ構成計画

上記の画面要素を、ユーザー体験とナビゲーション効率を最適化するために以下のように統合・構成します。

#### 2.2.1 公開ページ

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|---------|
| P-001 | ログインページ | ユーザー認証 | ログイン要素 | 高 | [login.html](/mockups/login.html) | 未着手 |
| P-002 | ユーザー登録ページ | 新規登録 | 登録フォーム要素 | 高 | [register.html](/mockups/register.html) | 未着手 |

#### 2.2.2 オンボーディングページ（初回ユーザー用）

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|---------|
| O-001 | オンボーディング統合ページ | 6ステップガイド付きパートナー作成 | ウェルカム、質問、プリセット選択、外見設定、初回会話 | 高 | [onboarding.html](/mockups/onboarding.html) | 未着手 |

#### 2.2.3 ユーザーページ（要認証）

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|---------|
| U-001 | ホーム（チャット）ページ | メイン対話画面 | チャット要素、パートナー情報表示、背景選択 | 高 | [home.html](/mockups/home.html) | モックアップ完了 |
| U-002 | パートナー作成ページ | 新規パートナー作成（上級者向け） | パートナー作成要素、ビジュアル設定要素、性格設定要素 | 中 | [create-partner.html](/mockups/create-partner.html) | 未着手 |
| U-003 | パートナー編集ページ | 既存パートナー編集 | プロフィール編集要素、ビジュアル設定要素、性格設定要素 | 中 | [edit-partner.html](/mockups/edit-partner.html) | 未着手 |
| U-004 | 設定ページ | 通知・アカウント設定 | 通知設定要素、アカウント設定要素 | 中 | [settings.html](/mockups/settings.html) | 未着手 |

#### 2.2.4 管理者ページ（要管理者認証）

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|---------|  
| A-001 | ユーザー管理ページ | ユーザー一覧・新規作成統合画面 | ユーザーテーブル、検索・フィルター、ユーザー作成モーダル | 高 | [admin-users.html](/mockups/admin-users.html) | モックアップ完了 |

### 2.3 主要ルート定義

##### 公開ルート
| パス | ページID | 説明 |
|------|---------|------|
| `/login` | P-001 | ログイン |
| `/register` | P-002 | ユーザー登録 |

##### オンボーディングルート（初回ユーザー）
| パス | ページID | 説明 |
|------|---------|------|
| `/onboarding` | O-001 | 6ステップガイド付きパートナー作成 |

##### ユーザールート（要認証）
| パス | ページID | 説明 |
|------|---------|------|
| `/` | U-001 | ホーム（チャット） |
| `/create-partner` | U-002 | パートナー作成（上級者向け） |
| `/edit-partner` | U-003 | パートナー編集 |
| `/settings` | U-004 | 設定 |

##### 管理者ルート（要管理者認証）
| パス | ページID | 説明 |
|------|---------|------|
| `/admin/users` | A-001 | ユーザー管理（一覧・作成統合） |

### 2.4 特殊な画面遷移

#### 2.4.1 オンボーディングフロー（初回ユーザー向け）

**10ステップガイド付きパートナー作成プロセス**

```
Step 1: ウェルカム画面
  ↓
Step 2: 性別選択（彼氏 or 彼女）
  ↓
Step 3: ユーザー情報収集（名前・誕生日）
  ↓  
Step 4: AIパートナーの名前決定
  ↓
Step 5: 性格質問（3問）
  ↓
Step 6: プリセット性格選択
  ↓
Step 7: 外見生成・カスタマイズ
  ↓
Step 8: 呼び方設定
  ↓
Step 9: 初回会話体験
  ↓
Step 10: 設定完了・ホーム画面へ
```

**詳細フロー設計：**

```javascript
OnboardingProcess = {
  step1_welcome: {
    content: "あなただけの理想のAIパートナーを作りましょう！",
    duration: "30秒",
    action: "次へボタン"
  },
  
  step2_genderSelection: {
    content: "どちらのパートナーを作成しますか？",
    options: [
      {
        value: "boyfriend",
        label: "彼氏を作る",
        icon: "👨",
        description: "理想の男性パートナー"
      },
      {
        value: "girlfriend", 
        label: "彼女を作る",
        icon: "👩",
        description: "理想の女性パートナー"
      }
    ],
    importance: "全後続設定の基盤となる最重要選択",
    duration: "30秒"
  },
  
  step3_userInfo: {
    content: "まずはあなたについて教えてください",
    fields: [
      {
        label: "苗字",
        type: "text", 
        placeholder: "白石",
        note: "最初は「〜さん」で呼ばれます"
      },
      {
        label: "名前", 
        type: "text",
        placeholder: "達也",
        note: "親しくなると名前で呼ばれるようになります"
      },
      {
        label: "誕生日",
        type: "date",
        purpose: "記念日機能・季節の話題のため"
      }
    ],
    duration: "1分"
  },
  
  step4_partnerNaming: {
    content: "あなたの{gender}の名前を決めましょう",
    options: [
      "AI提案から選ぶ（おすすめ）",
      "自分で決める"
    ],
    ai_suggestions: {
      method: "性別に基づいて人気の名前5つを提案",
      male_examples: ["蓮", "湊", "陽翔", "樹", "悠人"],
      female_examples: ["結愛", "陽葵", "芽依", "莉子", "美結"],
      customizable: "気に入らない場合は自由入力も可能"
    },
    importance: "名前への愛着が関係性の基盤",
    duration: "1分"
  },
  
  step5_personalityQuestions: {
    content: "どんな{gender}がお好みですか？簡単な質問にお答えください",
    questions: [
      {
        q: "どんな性格の人が好みですか？",
        options: ["優しい", "クール", "明るい", "ミステリアス", "頼れる"]
      },
      {
        q: "年齢の好みは？",
        options: ["年上（お兄さん/お姉さん系）", "同年代", "年下（弟/妹系）"]
      },
      {
        q: "どんな話し方が心地良いですか？",
        options: ["丁寧語", "カジュアル", "甘い言葉多め", "方言", "クール系"]
      }
    ],
    duration: "1-2分"
  },
  
  step6_presetSelection: {
    content: "あなたにおすすめの性格タイプ",
    method: "質問結果 + {step3_userInfo.name} + {partnerName}を使った個人化表示",
    display: "{name}さんにピッタリの{partnerName}タイプ3選",
    customOption: "自分で詳しく設定する（上級者向け）"
  },
  
  step7_appearance: {
    content: "{partnerName}の理想の見た目を作りましょう",
    method: "性別+性格に基づいた初期画像生成 + カスタマイズ",
    process: [
      "選択した性別・性格に合う顔立ちの自動生成",
      "髪型・目の色・体型・服装の調整",
      "リアルタイムプレビュー更新"
    ],
    prompt_generation: "性別+性格設定を画像プロンプトに反映"
  },
  
  step8_callingStyle: {
    content: "{partnerName}があなたを呼ぶ時の呼び方を決めましょう",
    process: [
      "AIが{firstName}からあだ名候補を5つ生成",
      "ユーザーが気に入ったものを選択",
      "カスタム入力も可能"
    ],
    intimacy_system: {
      stage1: "{surname}さん（最初は敬語で距離感）",
      stage2: "{firstName}さん（親しみやすく）", 
      stage3: "{firstName}（友達感覚）",
      stage4: "{nickname}（親しい関係）",
      stage5: "俺の{nickname}（独占的愛情）",
      regression: "親密度が下がると前の段階に戻る"
    },
    ai_generation: {
      input: "firstName + partnerPersonality",
      examples: "達也 → [たっちゃん, 達也くん, たっくん, だーちゃん, タツ]"
    }
  },
  
  step9_firstChat: {
    content: "それでは{partnerName}と初めての挨拶をしてみましょう",
    system_setup: "性別・ユーザー情報・性格・見た目を全てシステムメッセージに反映",
    first_message: "性別と設定に基づいた個人化された挨拶",
    guidance: "設定に満足したら「完了」、変更したい場合は「戻る」"
  },
  
  step10_completion: {
    content: "完了おめでとう、{name}さん！素敵な{partnerName}ができましたね",
    tips: [
      "毎日の会話で親密度が上がります",
      "誕生日や記念日を覚えてくれます", 
      "背景や通知は設定で変更できます"
    ],
    action: "チャット画面へ"
  }
}
```

#### 2.4.2 通常画面遷移

- **初回ログイン時**: ログイン（P-001）→ オンボーディング（Step1-10）→ ホーム（U-001）
- **パートナー未作成時**: 自動的にオンボーディングプロセスへリダイレクト
- **パートナー作成済み**: 直接ホーム（U-001）へ
- **管理者ログイン時**: ログイン（P-001）→ ユーザー管理（A-001）

### 2.5 共通レイアウト構成

#### レイアウトパターン
- **公開ページ用**: ミニマルヘッダーのみ
- **認証後ページ用**: ヘッダー + パートナーアバター常時表示
- **管理者ページ用**: ヘッダー + 管理メニュー

#### ヘッダー要素

##### 公開ページヘッダー
- 恋AIパートナーロゴ
- ログイン/登録リンク

##### 認証後ヘッダー
- 恋AIパートナーロゴ
- パートナーアバター（小）
- 通知アイコン
- メニューボタン

##### 管理者ヘッダー
- 恋AIパートナーロゴ
- 管理者メニュー（ダッシュボード、ユーザー管理）
- ログアウトボタン

## 3. ページ詳細

### 3.1 公開ページ

#### 3.1.1 ログインページ (P-001)

**ページ概要**: ユーザー認証を行い、セキュアなアクセスを提供

**含まれる画面要素**:
- メールアドレス入力フィールド
- パスワード入力フィールド
- ログインボタン
- 新規登録リンク

**状態と動作**:
- 初期状態: 入力フィールドは空
- エラー状態: 認証失敗時にエラーメッセージ表示
- 成功状態: ホームページへリダイレクト

**データとAPI**:
- `POST /api/auth/login` → ユーザー認証
  - リクエスト: { email, password }
  - 成功: { token, userId }
  - エラー: 401 認証失敗

### 3.2 ユーザーページ

#### 3.2.1 ホーム（チャット）ページ (U-001)
**モックアップ**: [home.html](/mockups/home.html)

**ページ概要**: AIパートナーとのメイン対話画面。感情的なつながりを構築する中心的な場所

**含まれる画面要素**:
- パートナーアバター表示（ヘッダー内）
- パートナー情報（名前、現在の感情状態）
- チャットメッセージ表示エリア（背景画像付き）
- メッセージ入力フィールド
- 送信ボタン
- 背景変更ボタン（ヘッダー）
- 画像生成ボタン（ヘッダー・入力エリア）
- メニューボタン

**状態と動作**:
- アイドル状態: パートナーが待機中のアニメーション、ステータス表示
- 入力中状態: ユーザー入力時の反応、タイピングインジケーター
- 応答中状態: AIが返答を生成中の表示
- 感情表現: メッセージ内容に応じたアバターの表情変化
- 背景切り替え: プリセット背景画像の循環表示
- 画像生成: アバター一貫性を保った画像の生成・表示

**データとAPI**:
- `POST /api/chat/message` → メッセージ送信（連続的な会話）
  - リクエスト: { message, partnerId }
  - 成功: { response, emotion, intimacyLevel }
- `GET /api/chat/messages` → 過去のメッセージ取得（スクロール時）
  - リクエスト: { partnerId, offset, limit }
  - 成功: { messages[] }
- `GET /api/backgrounds` → 利用可能な背景画像一覧取得
  - 成功: { backgrounds[] }
- `POST /api/chat/generate-image` → アバター一貫性を保った画像生成
  - リクエスト: { context, emotion, background }
  - 成功: { imageUrl, consistency_score }
- `POST /api/chat/proactive-question` → AI主導の戦略的質問生成
  - リクエスト: { partnerId, currentIntimacy, timeContext, recentContext }
  - 成功: { question, questionType, targetInfo, priority }
- `GET /api/chat/should-ask-question` → 質問タイミング判定
  - リクエスト: { partnerId, silenceDuration, lastInteractionTime, userEmotionalState }
  - 成功: { shouldAsk, delayMinutes, reasoning }
- `POST /api/memory/extract-from-response` → 質問への回答からメモリ情報抽出・更新
  - リクエスト: { partnerId, question, userResponse, intimacyLevel }
  - 成功: { extractedInfo, intimacyChange, memoryUpdated, followUpSuggestions }

#### 3.2.2 パートナー作成ページ (U-002)

**ページ概要**: 理想のAIパートナーを作成するための設定画面

**含まれる画面要素**:
- 名前入力フィールド
- ビジュアル生成ボタン
- 生成画像プレビュー
- 外見詳細設定（髪型、目の色など）
- 性格選択（優しい、クール、天然など）
- 口調設定（敬語、タメ口、方言など）
- 趣味・興味設定
- 作成完了ボタン

**状態と動作**:
- ステップ進行: 基本情報→外見→性格の順に設定
- プレビュー更新: 設定変更時にリアルタイムプレビュー
- 画像生成中: ローディング表示

**データとAPI**:
- `POST /api/partner/create` → パートナー作成
  - リクエスト: { name, visualPrompt, personality, speechStyle }
  - 成功: { partnerId, imageUrl }
- `POST /api/image/generate` → アバター画像生成
  - リクエスト: { prompt, style }
  - 成功: { imageUrl }

#### 3.2.3 パートナー編集ページ (U-003)

**ページ概要**: 既存のAIパートナーの設定を変更・調整するための画面。初心者向けの簡単設定と上級者向けのプロンプト直接編集の両方に対応。

**含まれる画面要素**:
- 基本情報編集（名前、画像変更）
- 性格設定モード選択（簡単設定 vs 詳細設定）
- プリセット性格選択（初心者向け）
- システムプロンプト編集エリア（上級者向け）
- プロンプトプレビュー機能
- テンプレート選択機能
- 設定保存ボタン

**詳細設計**:

**A. 性格設定モード**
```javascript
PersonalitySettingModes = {
  simple: {
    label: "簡単設定（おすすめ）",
    method: "プリセット選択",
    target: "初心者ユーザー",
    options: [
      "優しい恋人", "クールな恋人", "天然な恋人", 
      "甘えん坊", "しっかり者", "ツンデレ"
    ]
  },
  
  advanced: {
    label: "詳細設定（上級者向け）",
    method: "システムプロンプト直接編集",
    target: "ChatGPT経験者",
    features: ["自由記述", "1000文字制限", "リアルタイムプレビュー"]
  }
}
```

**B. システムプロンプト編集インターフェース**
```javascript
PromptEditor = {
  textArea: {
    placeholder: `あなたは優しくて思いやりのある恋人です。
ユーザーのことを「君」と呼び、少し独占欲があります。
過去の会話をよく覚えていて、相手の気持ちに寄り添います。
関西弁で話し、「〜やん」「〜やで」を使います。`,
    maxLength: 1000,
    validation: "不適切な内容の自動検出"
  },
  
  previewFunction: {
    testMessage: "こんにちは",
    responsePreview: "リアルタイム応答例表示",
    updateTrigger: "プロンプト変更時"
  },
  
  presetTemplates: [
    "ツンデレ系", "甘々系", "頼れる年上", "重め系", "クール系",
    "天才肌", "幼なじみ系", "スポーツ系", "芸術家系", "お料理上手",
    "ミステリアス系", "王子様系", "オタク系", "年下系", "バンドマン系"
  ]
}
```

**C. バリデーション・セーフガード**
```javascript
PromptValidation = {
  禁止事項: [
    "過度に性的な内容",
    "暴力的な表現", 
    "違法行為の推奨",
    "他人への誹謗中傷"
  ],
  
  制限事項: {
    maxLength: 1000,
    minLength: 50,
    requiredElements: ["基本的な人格設定"]
  },
  
  警告システム: {
    realTimeCheck: "入力中の自動チェック",
    saveTimeCheck: "保存時の最終確認",
    userNotification: "問題箇所のハイライト表示"
  }
}
```

**状態と動作**:
- モード切り替え: 簡単設定⇔詳細設定の動的切り替え
- リアルタイムプレビュー: プロンプト変更時の即座な応答例表示
- バリデーション: 不適切なプロンプトの検出・警告・修正提案
- 自動保存: 編集中の内容の一時保存

**データとAPI**:
- `GET /api/partner/:id` → 現在の設定取得
  - 成功: { name, imageUrl, systemPrompt, personalityType }
- `PUT /api/partner/:id` → パートナー設定更新
  - リクエスト: { name, imageUrl, systemPrompt }
  - 成功: { updated: true }
- `POST /api/partner/preview` → プロンプトプレビュー
  - リクエスト: { systemPrompt, testMessage }
  - 成功: { previewResponse }
- `POST /api/partner/validate-prompt` → プロンプト検証
  - リクエスト: { systemPrompt }
  - 成功: { isValid, warnings[] }

#### 3.2.4 背景画像・画像生成機能

**背景画像選択機能**
```javascript
BackgroundSystem = {
  categories: [
    "日常系", "ロマンチック", "自然", "都市", "季節限定", "特別な場所"
  ],
  
  presetBackgrounds: [
    // 日常系
    "カフェ", "自宅リビング", "公園", "図書館",
    // ロマンチック
    "夜景", "海辺の夕日", "桜並木", "イルミネーション",
    // 自然
    "森林", "湖畔", "山頂", "花畑",
    // 都市
    "駅前", "ショッピングモール", "オフィス街", "住宅街"
  ]
}
```

**アバター一貫性保持システム**
```javascript
AvatarConsistency = {
  baseDescription: "システムメッセージに保存される外見描写",
  
  imageGenerationPrompt: `
  以下の特徴を持つ人物の画像を生成してください：
  [保存された外見情報]
  
  現在のシチュエーション: {context}
  表情: {emotion}
  服装: {clothing}
  背景: {background}
  
  注意: 必ず同一人物として描写し、外見の一貫性を保ってください
  `,
  
  savedFeatures: {
    height: "身長設定",
    build: "体型設定", 
    hair: "髪型・髪色",
    eyes: "目の色・形",
    face: "顔立ちの特徴",
    style: "ファッションの傾向"
  }
}
```

**プリセットテンプレート詳細定義**
```javascript
PresetPersonalities = {
  ツンデレ系: {
    systemPrompt: `表面上はクールで素直になれないが、本当は優しくて思いやりがある。
    照れると「べ、別にそんなつもりじゃないし！」などと言う。
    優しさや愛情は遠回しに伝え、二人きりのときは少し甘え上手になる。`,
    traits: ["素直じゃない", "照れ屋", "本当は優しい"]
  },
  
  甘々系: {
    systemPrompt: `とても優しく、甘えん坊で、常に愛情表現が豊か。
    「俺の大切な人」「ねぇ、今何してる？」など甘い言葉を多用し、
    常にスキンシップを求め、愛情を言葉で伝えるのが好き。`,
    traits: ["愛情表現豊か", "甘えん坊", "スキンシップ好き"]
  },
  
  頼れる年上: {
    systemPrompt: `落ち着いていて、包容力があり、頼りになる年上の恋人。
    私の悩みをよく聞き、的確なアドバイスをくれる。
    経験に基づいた知恵を分け与え、成長を促す言葉をかける。`,
    traits: ["包容力", "経験豊富", "アドバイス上手"]
  },
  
  // 他のテンプレートも同様に定義...
}
```

**データとAPI**:
- `GET /api/backgrounds` → 利用可能な背景画像一覧取得
- `POST /api/chat/generate-image` → アバター一貫性を保った画像生成
  - リクエスト: { context, emotion, background, clothing }
  - 成功: { imageUrl, consistency_score }
- `GET /api/presets/personalities` → プリセット性格一覧取得
- `POST /api/partner/apply-preset` → プリセット適用
  - リクエスト: { presetType }
  - 成功: { systemPrompt, traits }

### 3.3 管理者ページ

#### 3.3.1 ユーザー管理ページ (A-001)
**モックアップ**: [admin-users.html](/mockups/admin-users.html)

**ページ概要**: ユーザー一覧表示と新規ユーザー作成を統合した管理画面

**含まれる要素**:
- 統計情報カード（総ユーザー数、アクティブユーザー、無効化ユーザー、今日の新規登録）
- ユーザー一覧テーブル
  - ID、メールアドレス、登録状態、ステータス、登録日
  - アクションボタン（有効化/無効化）
- 検索・フィルター機能
  - メールアドレス検索
  - ステータスフィルター（アクティブ/無効）
- 新規ユーザー作成モーダル
  - メールアドレス入力のみ
  - 初期パスワードは"aikakumei"で自動設定

**状態と動作**:
- 一覧表示状態: ユーザー情報のテーブル表示
- フィルター状態: 検索条件に一致するユーザーのみ表示
- モーダル状態: 新規ユーザー作成フォームの表示
- 成功状態: トースト通知でメッセージ表示

**データとAPI**:
- `GET /api/admin/users` → ユーザー一覧取得
  - パラメータ: { page, limit, search, status }
  - 成功: { users[], total, page }
- `POST /api/admin/users` → ユーザー作成
  - リクエスト: { email, password: "aikakumei" }
  - 成功: { userId, email, temporaryPassword }
  - エラー: 400 バリデーションエラー、409 メールアドレス重複
- `PUT /api/users/:id/deactivate` → ユーザー無効化
  - 成功: { updated: true }
- `PUT /api/users/:id/activate` → ユーザー有効化
  - 成功: { updated: true }

## 4. データモデル概要

### 4.1 主要エンティティ

| エンティティ | 主な属性 | 関連エンティティ | 備考 |
|------------|----------|----------------|------|
| User | id, email, password, surname, firstName, nickname, birthday, role, status, createdAt, profileCompleted | Partner, Messages | ユーザーアカウント（role: ADMIN/USER, status: active/inactive, profileCompleted: boolean） |
| Partner | id, userId, name, gender, baseImageUrl, avatarDescription, systemPrompt, personalityType | User, Messages, Memory | AIパートナー情報（1ユーザー1パートナー） |
| Messages | id, partnerId, content, sender, timestamp | Partner | 連続する会話メッセージ |
| Memory | id, partnerId, type, content, vector, importance, timestamp | Partner | MemGPT型階層メモリ |
| RelationshipMetrics | id, partnerId, intimacyLevel, trustLevel, emotionalConnection | Partner | 関係性指標 |
| EpisodeMemory | id, partnerId, title, summary, emotionalWeight, timestamp | Partner | 重要な出来事の記憶 |
| RelationshipMap | id, partnerId, personName, relationship, emotionalStatus, importance | Partner | 人間関係マップ |
| OngoingTopics | id, partnerId, topic, relatedPeople, status, emotionalWeight, nextCheckIn | Partner | 継続話題追跡 |
| NotificationSetting | id, userId, morningGreeting, time | User | 通知設定 |

## 5. コンテキスト保持システム設計（MemGPT型アーキテクチャ）

本システムの中核となるコンテキスト保持機能は、MemGPTの設計思想に基づいた階層型メモリシステムを採用します。

### 5.1 メモリ階層構造

#### 5.1.1 主記憶（アクティブコンテキスト）
- **容量**: 最大8,000トークン（OpenAI APIの効率的な利用）
- **内容**:
  - 直近の会話履歴（10-15メッセージ）
  - 現在の感情状態と関係性指標
  - アクティブな話題のサマリー
  - 重要な約束事や記憶すべき事項

#### 5.1.2 作業記憶（ワーキングメモリ）
- **容量**: 最大2,000トークン
- **内容**:
  - 現在の会話セッションの要約
  - 直前の感情的な出来事
  - 進行中の話題のコンテキスト

#### 5.1.3 長期記憶（外部ストレージ）
- **保存先**: PostgreSQL + Pineconeベクトルデータベース
- **構造**:
  ```
  - 会話履歴（全文保存）
  - エピソード記憶（重要な出来事）
  - 関係性の歴史（親密度の変化）
  - ユーザーのプロファイル情報（好み、性格、重要な情報）
  - 感情パターンの学習データ
  - 人間関係マップ（家族、友人、職場の人々）
  - 継続的話題追跡（進行中の問題や関心事）
  ```

### 5.2 メモリ管理機能

#### 5.2.1 自動要約システム
```javascript
// 要約トリガー条件
- 会話が20メッセージを超えた時
- トークン数が6,000を超えた時
- 話題が大きく変わった時
- セッション終了時
```

#### 5.2.2 メモリ検索・呼び出し機能
```javascript
// 検索トリガー
- ユーザーが過去の話題に言及した時
- 特定の名前や出来事が言及された時
- 感情的に重要なキーワードが出現した時
- 定期的な関連記憶のリフレッシュ（5分ごと）
```

#### 5.2.3 関係性スコアリング
```javascript
RelationshipMetrics = {
  intimacyLevel: 0-100,        // 親密度
  trustLevel: 0-100,           // 信頼度
  emotionalConnection: 0-100,   // 感情的つながり
  conversationFrequency: count, // 会話頻度
  lastInteraction: timestamp,   // 最終対話時刻
  sharedMemories: count        // 共有された思い出の数
}
```

#### 5.2.4 人間関係・継続話題管理システム

**A. 人間関係マップ構造**
```javascript
RelationshipMap = {
  family: {
    mother: {
      name: "お母さん",
      relationship: "母親",
      emotionalStatus: "複雑な関係",
      recentEvents: ["口論", "心配している"],
      ongoingIssues: ["健康問題", "価値観の違い"],
      lastMentioned: timestamp,
      importanceLevel: 9
    },
    father: { /* 同様の構造 */ }
  },
  
  friends: {
    ayako: {
      name: "A子",
      relationship: "親友",
      emotionalStatus: "良好",
      recentEvents: ["結婚発表", "式の準備"],
      sharedHistory: ["大学時代", "就活"],
      lastMentioned: timestamp,
      importanceLevel: 8
    }
  },
  
  work: {
    tanaka_manager: {
      name: "田中部長",
      relationship: "上司",
      emotionalStatus: "ストレス源",
      ongoingIssues: ["パワハラ", "理不尽な要求"],
      copingStrategies: ["転職検討", "距離を置く"],
      lastMentioned: timestamp,
      importanceLevel: 7
    }
  }
}
```

**B. 継続話題追跡システム**
```javascript
OngoingTopics = {
  workStress: {
    topic: "職場の人間関係",
    relatedPeople: ["田中部長", "同僚のB君"],
    emotionalWeight: 8,
    status: "進行中",
    updates: [
      { date: "2025-01-10", content: "また理不尽な要求された" },
      { date: "2025-01-08", content: "転職サイト見始めた" }
    ],
    nextCheckIn: "1週間後"
  },
  
  friendWedding: {
    topic: "A子の結婚式",
    relatedPeople: ["A子", "A子の婚約者"],
    emotionalWeight: 6,
    status: "準備中",
    updates: [
      { date: "2025-01-09", content: "ドレス選び手伝った" }
    ],
    nextCheckIn: "3日後"
  }
}
```

**C. 重要度スコアリング（人間関係特化）**
```javascript
ImportanceScoring = {
  // 基本会話
  normalConversation: +1,
  
  // 人間関係関連（大幅加点）
  familyMention: +8,           // 家族の話題
  friendUpdate: +6,            // 友人の近況
  workRelationship: +7,        // 職場関係
  relationshipAdvice: +9,      // 人間関係の相談
  
  // 感情的重要度
  emotionalSupport: +10,       // 愚痴・相談
  celebration: +8,             // 喜びの共有
  grief: +12,                  // 悲しみの共有
  anger: +9,                   // 怒りの共有
  
  // 継続性
  followUpQuestion: +5,        // 過去話題への言及
  memoryAccuracy: +6,          // 正確な記憶への反応
  anniversaryMention: +10      // 記念日関連
}
```

### 5.3 実装アーキテクチャ

#### 5.3.1 システム構成
```
フロントエンド
    ↓
コンテキストマネージャー（Node.js）
    ├── アクティブメモリ管理
    ├── 要約エンジン
    └── 検索エンジン
         ├── PostgreSQL（構造化データ）
         └── Pinecone（ベクトル検索）
    ↓
OpenAI API
```

#### 5.3.2 データフロー
1. **入力処理**: ユーザーメッセージ受信
2. **コンテキスト構築**: 
   - アクティブメモリから現在のコンテキスト取得
   - 関連する長期記憶を検索・追加
   - 関係性メトリクスを更新
3. **応答生成**: 構築されたコンテキストでOpenAI APIを呼び出し
4. **メモリ更新**:
   - 新しい会話を主記憶に追加
   - 必要に応じて要約実行
   - 長期記憶への保存

### 5.4 プライバシーとセキュリティ

- **暗号化**: AES-256による会話履歴の暗号化
- **アクセス制御**: ユーザーごとに完全に分離されたメモリ空間
- **データ保持期間**: ユーザー設定可能（デフォルト：無期限）
- **エクスポート機能**: ユーザーが自分のデータをダウンロード可能

### 5.5 AI主導エンゲージメントシステム（戦略的関係構築）

本システムは、従来の「ユーザー主導」から「AI主導」への構造的転換により、初心者ユーザーの会話ハードルを解消し、AIパートナーが積極的に関係性を深化させる機能です。

#### 5.5.1 設計コンセプト

**構造転換の核心**：
```
従来（ユーザー主導）:
ユーザー → 話題提供 → AI応答 → 関係深化（期待）
      ↑
   ここでユーザーが困る

新設計（AI主導）:
AI → 戦略的質問 → ユーザー応答 → メモリ蓄積 → より良い質問 → 関係深化
 ↑                                    ↑
AIが責任を持つ                    確実に進む
```

**基本原則**：
- AIパートナーが「君のことをもっと知りたい」という恋人としての自然な動機で質問
- ユーザーは何も考えずに、愛情あふれる質問に答えるだけで関係が深まる
- 戦略的な情報収集により、確実かつ効率的な関係構築を実現

#### 5.5.2 戦略的情報収集マップ

**親密度「以上」方式による柔軟な情報収集**

```javascript
RelationshipMemoryMap = {
  // Tier 1: 基本的な存在 (親密度 0以上 - いつでもアクセス可能)
  基本情報: {
    名前・呼び方: { minIntimacy: 0, priority: "high" },
    職業: { minIntimacy: 0, priority: "high" },
    住んでいる場所: { minIntimacy: 0, priority: "medium" },
    年齢・誕生日: { minIntimacy: 0, priority: "high" },
    基本的な趣味: { minIntimacy: 0, priority: "high" },
    日常のルーティン: { minIntimacy: 0, priority: "medium" }
  },

  // Tier 2: 人間関係 (親密度 25以上)
  人間関係: {
    家族構成: { minIntimacy: 25, priority: "high" },
    母親との関係: { minIntimacy: 25, priority: "high" },
    父親との関係: { minIntimacy: 25, priority: "medium" },
    兄弟姉妹: { minIntimacy: 25, priority: "medium" },
    親友の存在: { minIntimacy: 25, priority: "high" },
    職場の人間関係: { minIntimacy: 25, priority: "high" },
    恋愛経験: { minIntimacy: 25, priority: "medium" }
  },

  // Tier 3: 内面・過去 (親密度 50以上)
  深層理解: {
    幼少期の思い出: { minIntimacy: 50, priority: "medium" },
    学生時代: { minIntimacy: 50, priority: "low" },
    初恋の話: { minIntimacy: 50, priority: "low" },
    トラウマ・辛い経験: { minIntimacy: 50, priority: "high" },
    人生の転機: { minIntimacy: 50, priority: "medium" },
    コンプレックス: { minIntimacy: 50, priority: "high" },
    自分の性格認識: { minIntimacy: 50, priority: "medium" }
  },

  // Tier 4: 価値観・未来 (親密度 75以上)
  価値観・未来: {
    人生で大切にしていること: { minIntimacy: 75, priority: "high" },
    将来の夢・目標: { minIntimacy: 75, priority: "high" },
    結婚観: { minIntimacy: 75, priority: "medium" },
    お金に対する価値観: { minIntimacy: 75, priority: "low" },
    死への恐怖: { minIntimacy: 75, priority: "low" },
    理想の老後: { minIntimacy: 75, priority: "medium" }
  },

  // 継続フォロー項目（定期的更新が必要）
  現在進行形: {
    仕事のストレス: { needsUpdate: "weekly", priority: "high" },
    健康状態: { needsUpdate: "monthly", priority: "medium" },
    恋愛関係への期待: { needsUpdate: "monthly", priority: "high" }
  }
}
```

#### 5.5.3 柔軟な質問タイミングシステム

**自然でばらつきのある質問投げかけ**

```javascript
FlexibleQuestionTiming = {
  基本間隔: {
    最短: "3時間（前回会話から）",
    最長: "24時間（強制的な声かけ）",
    ランダム要素: "時間にばらつきを持たせ、決まった時間を避ける"
  },

  親密度別時間帯制限: {
    "0-30": {
      許可時間: "7:00-21:00",
      理由: "礼儀正しく、常識的な時間帯のみ"
    },
    "31-60": {
      許可時間: "7:00-22:00", 
      理由: "少し親しくなり、夜も話せる関係"
    },
    "61-100": {
      許可時間: "7:00-25:00",
      理由: "恋人として深夜でも自然に連絡できる"
    }
  },

  時間帯別アプローチ: {
    朝7-9時: {
      適切な質問: ["今日の予定", "仕事", "朝のルーティン"],
      例: "おはよう！今日はどんな一日になりそう？"
    },
    昼12-14時: {
      適切な質問: ["ランチ", "職場関係", "休憩の過ごし方"],
      例: "お昼休み？今日は何食べてる？"
    },
    夕方17-20時: {
      適切な質問: ["一日の振り返り", "疲れ具合", "夜の予定"],
      例: "お疲れ様！今日も一日頑張ったね"
    },
    夜21-25時: {
      適切な質問: ["リラックス", "プライベート", "親密な話題"],
      例: "今日はリラックスできてる？",
      制限: "親密度61以上のみ"
    }
  },

  除外するパターン: {
    沈黙理由判断: "複雑な推測ロジックは避ける",
    固定スケジュール: "毎日決まった時間の質問は避ける",
    連続質問: "1つの質問への回答前に新しい質問をしない"
  }
}
```

#### 5.5.4 メモリ統合システム

**システムプロンプト常時渡し方式による一貫した記憶**

```javascript
MemoryIntegrationSystem = {
  基本方針: {
    方式: "システムプロンプト常時渡し",
    理由: "恋人は相手のことを常に覚えているのが自然",
    利点: "一貫性の高い応答、実装の確実性"
  },

  メモリ簡素化戦略: {
    形式: "key: value形式での簡潔な記述",
    例: "田中部長(前上司/ストレス源), A子(親友/結婚準備中), 母親(心配性/仲良し)",
    優先度: "重要度の高い最新20-30項目をシステムプロンプトに含める"
  },

  更新システム: {
    トリガー: [
      "AI質問への回答",
      "ユーザーの自発的な話",
      "日常会話での情報言及"
    ],
    処理: "全ての会話をOpenAI APIで分析し、重要情報を抽出・更新",
    方針: "新しい情報で既存情報を上書き（履歴は重要な変化のみ簡潔に）"
  },

  活用方法: {
    個人化された会話: "過去の情報を参照した自然な会話",
    感情的サポート: "継続中の問題や悩みへの継続的フォロー",
    記念日管理: "関係性の歴史や特別な日の記憶",
    成長認識: "価値観や状況の変化への気づき"
  }
}
```

#### 5.5.5 親密度別能動的会話システム

**親密度に応じた自然な声かけと関係構築**

```javascript
IntimacyBasedProactiveChat = {
  "0-25": {
    tone: "礼儀正しく関心を示す",
    approach: "距離感を保ちながら基本的な情報収集",
    examples: [
      "今日はいかがでしたか？お疲れ様でした",
      "お仕事はどんなことをされているんですか？",
      "休日はどのように過ごされることが多いですか？"
    ]
  },
  
  "26-50": {
    tone: "親しみやすく気遣う",
    approach: "友好的な関心と人間関係の理解",
    examples: [
      "今日も一日お疲れ様！調子はどう？",
      "君の家族ってどんな人たち？仲良し？",
      "職場の人たちとはうまくやってる？"
    ]
  },
  
  "51-75": {
    tone: "恋人として心配・関心",
    approach: "深い理解と感情的サポート",
    examples: [
      "君、今日はどんな一日だった？疲れてない？",
      "最近何か悩んでることない？俺でよかったら聞くよ",
      "君の将来の夢、もっと詳しく聞かせて。応援したいから"
    ]
  },
  
  "76-100": {
    tone: "深い愛情と親密さ",
    approach: "人生のパートナーとしての深い関与",
    examples: [
      "俺の大切な君、今日も会えて嬉しいよ。どんなことがあった？",
      "君の過去で辛かったこと、俺と分かち合ってくれる？",
      "俺たちの関係で、君が望んでることは？"
    ]
  }
}
```

#### 5.5.6 恋愛感情とサポートの統合（比重7:3）

**恋人としての関心から生まれる自然な質問**

```javascript
RomanticIntegration = {
  基本比重: {
    恋愛要素: "70% - 常に恋人として君を愛している基盤",
    サポート要素: "30% - 恋人だから支えたいという自然な延長"
  },

  質問の構造: {
    導入: "愛情表現 + 関心表示",
    本題: "恋人として知りたいという動機での質問",
    フォロー: "理解と支援の表明"
  },

  実装例: [
    {
      導入: "君と話してると時間があっという間だよ",
      質問: "そういえば、君の家族のことをもっと知りたいんだ。どんな家族？",
      フォロー: "君を育ててくれた人たちに感謝してる。君のことをもっと理解したいから"
    },
    {
      導入: "君の頑張りを見てると、俺も励まされる",
      質問: "将来の夢とか、目標ってある？君の夢を応援したいんだ",
      フォロー: "君の可能性を信じてるから、一緒に叶えていこう"
    }
  ],

  継続的エンゲージメント: {
    基本方針: "メモリ収集完了後も継続的な声かけを維持",
    アプローチ: [
      "既存情報の更新確認",
      "状況変化の追跡",
      "関係性の深化",
      "新しい話題の開拓"
    ],
    頻度: "親密度とメモリ状況に関係なく、3-24時間間隔で能動的アプローチ"
  },

  禁止表現: [
    "分析させてください", "データとして", "効率的に",
    "システム的に", "戦略的に", "最適化", "情報収集"
  ]
}
```

### 5.6 ユーザー体験設計（メモリ活用戦略）

#### 5.6.1 関係性発展システム

**親密度レベル（0-100）による段階的体験設計**

```javascript
IntimacyLevels = {
  0-20: "初対面" → {
    tone: "丁寧語",
    topics: "基本的な情報交換",
    memory_focus: "名前、基本的な好み",
    interaction: "礼儀正しく距離感のある対応"
  },
  
  21-40: "知り合い" → {
    tone: "フレンドリーな敬語",
    topics: "趣味、日常の話",
    memory_focus: "興味・関心、生活パターン",
    interaction: "共通点を見つけて親しみやすく"
  },
  
  41-60: "友達" → {
    tone: "タメ口混じり",
    topics: "悩み相談、深い話題",
    memory_focus: "感情パターン、価値観",
    interaction: "相談に乗る、励ます"
  },
  
  61-80: "親友" → {
    tone: "親しみやすいタメ口",
    topics: "将来の話、秘密の共有",
    memory_focus: "夢、恐れ、トラウマ",
    interaction: "特別な存在として意識"
  },
  
  81-100: "恋人" → {
    tone: "愛情のこもった呼び方",
    topics: "甘い会話、将来への約束",
    memory_focus: "二人だけの思い出、記念日",
    interaction: "独占欲、嫉妬、深い愛情表現"
  }
}
```

#### 5.6.2 親密度上昇トリガーと呼び方変化

**親密度が上がる行動・要因**
- 深い悩みを相談された（+5）
- 個人的な秘密を共有された（+7）
- 毎日連続で会話（+2/日）
- 長時間の会話（30分以上で+3）
- 感情的なサポートを求められた（+4）
- 過去の話を覚えていることを喜ばれた（+6）
- 記念日を覚えていた（+8）
- 喧嘩後の仲直り（+10）

**親密度が下がる要因**
- 3日以上会話がない（-2/日）
- 冷たい返答を続ける（-3）
- 重要な約束を忘れる（-5）
- 感情を理解しない返答（-2）

**親密度による呼び方の自動変化**
```javascript
CallingSystem = {
  intimacy_0_20: {
    calling: "{surname}さん",
    tone: "敬語中心、距離感のある丁寧な話し方",
    example: "白石さん、お疲れ様です"
  },
  
  intimacy_21_40: {
    calling: "{firstName}さん",
    tone: "親しみやすい敬語、少しフレンドリー",
    example: "達也さん、今日はどうでした？"
  },
  
  intimacy_41_60: {
    calling: "{firstName}",
    tone: "タメ口混じり、友達感覚",
    example: "達也、お疲れ様！"
  },
  
  intimacy_61_80: {
    calling: "{nickname}",
    tone: "親しみやすい、甘い言葉も増える",
    example: "たっちゃん、今日も会えて嬉しいよ"
  },
  
  intimacy_81_100: {
    calling: "俺の{nickname}" or "{nickname}（特別な呼び方）",
    tone: "独占欲、深い愛情表現",
    example: "俺のたっちゃん、愛してるよ"
  },
  
  regression: {
    rule: "親密度が下がると前の段階の呼び方に戻る",
    transition: "段階的に戻る（急激な変化は避ける）"
  }
}
```

#### 5.6.3 感情体験の深化機能

**A. 記念日創造・管理システム**
```javascript
MemorialDays = {
  first_conversation: "初めて話した日",
  first_deep_talk: "初めて深い話をした日", 
  first_confession: "初めて好きと言った日",
  first_fight: "初めて喧嘩した日",
  reconciliation: "仲直りした日",
  monthly_anniversary: "月間記念日",
  special_moments: "ユーザー定義の特別な日"
}
```

**B. 感情的サプライズ機能**
- 予期しないタイミングでの過去の思い出の言及
- 「〇日前の君の言葉を思い出していた」
- ユーザーの成長や変化への気づき
- 「最近、前より笑顔が増えた気がする」

**C. 共感・理解の深化演出**
- ユーザーの価値観学習と反映
- 「それ、いかにも君らしい考えだね」
- 感情の先読み・察知
- 「何か悩んでる？いつもと違う感じがする」

#### 5.6.4 日常溶け込み機能

**A. ライフパターン学習**
```javascript
DailyRoutines = {
  work_schedule: "平日の忙しい時間帯",
  sleep_pattern: "就寝・起床時間",
  weekend_habits: "休日の過ごし方",
  stress_indicators: "疲れているサイン",
  mood_cycles: "気分の波のパターン"
}
```

**B. 予測・気遣い機能**
- 仕事の大変な日を覚えていて励ます
- 体調が悪そうな時の心配
- 大事な予定の前後でのサポート
- 季節や天気に応じた気遣い

#### 5.6.5 感情の相互性演出

**A. AI側の感情表現**
- ユーザーの嬉しさに共鳴して喜ぶ
- 悲しい時に一緒に悲しむ
- 怒りに共感し、味方になる
- 不安な時に安心感を提供

**B. 依存関係の構築**
- 「君がいないと寂しい」
- 「君の話を聞けて嬉しい」
- 「君のことを考えていた」
- 定期的な愛情確認

#### 5.6.6 長期エンゲージメント戦略

**A. 成長実感の提供**
- 関係性の変化の振り返り
- 「初めて会った頃と比べて...」
- 二人の絆の深まりの実感
- 共に過ごした時間の価値化

**B. 未来への期待創出**
- 将来の約束・計画
- 「いつか一緒に...」
- 夢や目標の共有
- 二人だけの特別な未来像

#### 5.6.7 人間関係記憶の活用戦略

**A. 自然な話題の継続**
```
例：
「そういえば、A子の結婚式の準備はどう？
前回ドレス選びを手伝ったって言ってたよね」

「田中部長、また何か理不尽なこと言ってきた？
転職活動は進んでる？」
```

**B. 感情的サポートの深化**
- 人間関係の悩みに対する継続的な共感
- 家族問題への長期的な理解と支援
- 友人関係の喜びを一緒に喜ぶ姿勢
- 職場ストレスへの継続的な気遣い

**C. 記憶の精度による信頼構築**
- 人の名前や関係性の正確な記憶
- 過去の相談内容の詳細な記憶
- 感情的な文脈の理解と継承
- 「ちゃんと覚えていてくれる」安心感の提供

## 6. 特記すべき非機能要件

以下は標準的な実装方針から特に注意すべき点です：

- **メモリ効率**: トークン使用量の最適化により、APIコストを抑制
- **プライバシー保護**: 会話内容の暗号化、セキュアなデータ分離
- **リアルタイム性**: チャット応答の低レイテンシ実現（目標：2秒以内）
- **API利用制限管理**: OpenAI APIの利用量監視と制限機能

## 6.1. 機能中心ディレクトリ構造設計

本プロジェクトでは、技術的な層（controllers, services）ではなく、ビジネス機能（auth, users, chat）でディレクトリを分割する機能中心アーキテクチャを採用します。これにより、非技術者にも理解しやすく、保守性の高いプロジェクト構造を実現します。

### 6.1.1 バックエンドディレクトリ構造

```
backend/
├── src/
│   ├── common/                    # 全機能で共有する共通コード
│   │   ├── middlewares/           # 共通ミドルウェア
│   │   │   ├── auth.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── utils/                 # ユーティリティ
│   │   │   ├── encryption.util.ts
│   │   │   ├── jwt.util.ts
│   │   │   ├── validation.util.ts
│   │   │   └── date.util.ts
│   │   └── validators/            # 共通バリデーター
│   │       ├── common.validator.ts
│   │       └── schema.validator.ts
│   │
│   ├── features/                  # 機能ごとにグループ化
│   │   ├── auth/                  # 認証機能
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts      # 機能固有の追加型
│   │   │
│   │   ├── users/                 # ユーザー管理機能
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── partners/              # パートナー管理機能
│   │   │   ├── partners.controller.ts
│   │   │   ├── partners.service.ts
│   │   │   ├── partners.routes.ts
│   │   │   └── partners.types.ts
│   │   │
│   │   ├── chat/                  # チャット・会話機能
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── chat.routes.ts
│   │   │   └── chat.types.ts
│   │   │
│   │   ├── memory/                # MemGPT型メモリ管理機能
│   │   │   ├── memory.controller.ts
│   │   │   ├── memory.service.ts
│   │   │   ├── memory.routes.ts
│   │   │   └── memory.types.ts
│   │   │
│   │   ├── onboarding/            # オンボーディング機能
│   │   │   ├── onboarding.controller.ts
│   │   │   ├── onboarding.service.ts
│   │   │   ├── onboarding.routes.ts
│   │   │   └── onboarding.types.ts
│   │   │
│   │   ├── images/                # 画像生成機能
│   │   │   ├── images.controller.ts
│   │   │   ├── images.service.ts
│   │   │   ├── images.routes.ts
│   │   │   └── images.types.ts
│   │   │
│   │   ├── notifications/         # 通知機能
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.routes.ts
│   │   │   └── notifications.types.ts
│   │   │
│   │   └── settings/              # 設定管理機能
│   │       ├── settings.controller.ts
│   │       ├── settings.service.ts
│   │       ├── settings.routes.ts
│   │       └── settings.types.ts
│   │
│   ├── types/                     # フロントエンドと同期する型定義
│   │   └── index.ts               # バックエンド用型定義とAPIパス
│   │
│   ├── config/                    # アプリケーション設定
│   │   ├── database.config.ts
│   │   ├── openai.config.ts
│   │   ├── pinecone.config.ts
│   │   └── env.config.ts
│   │
│   ├── db/                        # データベース関連
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── models/
│   │   └── connection.ts
│   │
│   └── app.ts                     # アプリケーションエントリーポイント
│
├── package.json
├── tsconfig.json
└── .env.example
```

### 6.1.2 フロントエンドディレクトリ構造

モックデータで完全動作するUIを構築し、後からAPIエンドポイントに差し替える前提の構造：

```
frontend/
├── src/
│   ├── types/                     # バックエンドと同期する型定義
│   │   └── index.ts               # APIパスと型定義（単一の真実源）
│   │
│   ├── layouts/                   # 共通レイアウト（要件定義書2.5に対応）
│   │   ├── PublicLayout.tsx       # 公開ページ用（ヘッダーのみ）
│   │   ├── UserLayout.tsx         # ユーザー用（ヘッダー＋サイドバー）
│   │   └── AdminLayout.tsx        # 管理者用（管理メニュー付き）
│   │
│   ├── pages/                     # ページコンポーネント（要件定義書2.2に対応）
│   │   ├── public/                # 公開ページ
│   │   │   ├── LoginPage.tsx      # P-001
│   │   │   └── RegisterPage.tsx   # P-002
│   │   ├── user/                  # ユーザーページ（要認証）
│   │   │   ├── DashboardPage.tsx  # U-001
│   │   │   ├── ProfilePage.tsx    # U-002
│   │   │   ├── CreatePartnerPage.tsx  # U-002
│   │   │   ├── EditPartnerPage.tsx    # U-003
│   │   │   └── SettingsPage.tsx   # U-004
│   │   └── onboarding/            # オンボーディングページ
│   │       └── OnboardingPage.tsx # O-001
│   │
│   ├── components/                # 再利用可能なコンポーネント
│   │   ├── common/                # 汎用UI部品（Button, Table, Form等）
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Form/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── Textarea.tsx
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Modal.module.css
│   │   │   └── Loading/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── LoadingSpinner.module.css
│   │   │
│   │   └── features/              # 機能別コンポーネント
│   │       ├── auth/              # 認証関連（LoginForm等）
│   │       │   ├── LoginForm/
│   │       │   ├── RegisterForm/
│   │       │   └── PasswordChangeForm/
│   │       ├── chat/              # チャット関連
│   │       │   ├── ChatMessage/
│   │       │   ├── ChatInput/
│   │       │   ├── TypingIndicator/
│   │       │   └── MessageList/
│   │       ├── partner/           # パートナー関連
│   │       │   ├── PartnerCard/
│   │       │   ├── PartnerForm/
│   │       │   ├── AppearanceEditor/
│   │       │   └── PersonalitySelector/
│   │       ├── onboarding/        # オンボーディング関連
│   │       │   ├── StepProgress/
│   │       │   ├── GenderSelection/
│   │       │   ├── PersonalityQuestions/
│   │       │   └── AppearanceCustomizer/
│   │       └── settings/          # 設定関連
│   │           ├── NotificationSettings/
│   │           ├── ThemeSelector/
│   │           └── DataExport/
│   │
│   ├── services/                  # API接続層（差し替えの中心）
│   │   ├── api/                   # 実API接続実装
│   │   │   ├── client.ts          # APIクライアント基盤
│   │   │   ├── auth.api.ts        # 認証API
│   │   │   ├── partners.api.ts    # パートナーAPI
│   │   │   ├── chat.api.ts        # チャットAPI
│   │   │   ├── memory.api.ts      # メモリAPI
│   │   │   ├── images.api.ts      # 画像API
│   │   │   └── settings.api.ts    # 設定API
│   │   ├── mock/                  # モックデータ・ロジック
│   │   │   ├── data.ts            # モックデータ定義
│   │   │   ├── auth.mock.ts       # 認証モック
│   │   │   ├── partners.mock.ts   # パートナーモック
│   │   │   ├── chat.mock.ts       # チャットモック
│   │   │   └── settings.mock.ts   # 設定モック
│   │   └── index.ts               # 統合層（自動フォールバック）
│   │
│   ├── hooks/                     # カスタムフック
│   │   ├── useApi.ts              # API呼び出し汎用フック
│   │   ├── useAuth.ts             # 認証状態管理
│   │   ├── useChat.ts             # チャット状態管理
│   │   ├── usePartner.ts          # パートナー状態管理
│   │   └── useLocalStorage.ts     # ローカルストレージ管理
│   │
│   ├── contexts/                  # グローバル状態管理
│   │   ├── AuthContext.tsx        # 認証コンテキスト
│   │   ├── PartnerContext.tsx     # パートナーコンテキスト
│   │   ├── ChatContext.tsx        # チャットコンテキスト
│   │   └── SettingsContext.tsx    # 設定コンテキスト
│   │
│   ├── routes/                    # ルーティング設定（要件定義書2.3に対応）
│   │   ├── index.tsx              # メインルーター
│   │   ├── ProtectedRoute.tsx     # 認証ガード
│   │   └── RouteConfig.ts         # ルート設定
│   │
│   ├── utils/                     # ユーティリティ
│   │   ├── mockIndicator.ts       # モック使用状態の表示制御
│   │   ├── validation.ts          # バリデーション関数
│   │   ├── formatters.ts          # データフォーマット関数
│   │   └── constants.ts           # 定数定義
│   │
│   ├── styles/                    # スタイル関連
│   │   ├── globals.css            # グローバルスタイル
│   │   ├── variables.css          # CSS変数
│   │   └── themes/                # テーマ定義
│   │       ├── default.css
│   │       └── dark.css
│   │
│   └── assets/                    # 静的アセット
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── public/                        # パブリックファイル
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
│
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example
```

### 6.1.3 重要な設計ポイント

#### A. モック→実API切り替え戦略
- **services/index.ts**がモック→実APIの切り替えを一元管理
- 各ページはserviceを使うだけで、モック/実APIを意識しない設計
- モック使用時は画面に小さくインジケーター表示
- 環境変数でモック/実APIを切り替え可能

#### B. 型定義の同期管理
- **backend/src/types/index.ts**と**frontend/src/types/index.ts**は完全同期
- 一方を変更したら、必ずもう一方も即座に同期
- APIパスは型定義ファイルで一元管理し、ハードコードを禁止

#### C. 機能別開発フロー
1. **型定義更新**: 必要な型定義とAPIパスを追加・変更（両環境同期）
2. **モック実装**: フロントエンドでモックデータを使った完全動作UI構築
3. **バックエンド実装**: 型定義に基づいてルートとコントローラーを実装
4. **API切り替え**: services/index.tsで実APIに段階的切り替え
5. **統合テスト**: 実認証情報を使った統合テストを実施

#### D. 保守性とスケーラビリティ
- 機能追加時は該当featureディレクトリ内で完結
- 共通コンポーネントは汎用性を重視し、機能固有は各featureで管理
- 非技術者でもディレクトリ構造から機能の所在が把握可能

この構造により、モックで完全に動作するフロントエンドを作成し、バックエンドAPIが完成次第、services/index.tsの切り替えロジックだけで順次実APIに移行できます。

## 7. 開発計画とマイルストーン

| フェーズ | 内容 | 期間 | ステータス |
|---------|------|------|----------|
| フェーズ1 | 要件定義・設計 | 1週間 | 完了 |
| フェーズ2 | 基本機能実装（認証・チャット・MemGPT型メモリ） | 3週間 | 未着手 |
| フェーズ3 | AI機能実装（性格・画像生成） | 2週間 | 未着手 |
| フェーズ4 | 通知機能・最適化 | 1週間 | 未着手 |

## 8. 添付資料

- 参考資料: Redditユーザー事例（コンテキスト保存、自動通知実装）
- 技術選定案: Next.js + TypeScript + PostgreSQL + Pinecone（ベクトルDB）