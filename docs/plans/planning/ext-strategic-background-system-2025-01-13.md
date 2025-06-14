# 機能拡張計画: 戦略的背景システム [2025-01-13]

## 1. 拡張概要

現在の背景システムを単なる装飾から、デート体験の中核機能へと進化させます。背景と服装を戦略的に連携させ、AIチャットや画像生成と統合することで、没入感のあるデート体験を提供し、最終的には親密度に応じた「お宝画像」への到達を実現します。

## 2. 詳細仕様

### 2.1 現状と課題

**現状**:
- 背景画像は46枚実装済み（親密度・時間帯別）
- BackgroundContextで状態管理は完了
- 背景選択機能は動作している

**課題**:
- AIチャットが現在の場所を認識していない
- 画像生成時に背景と服装の連携がない
- 背景は単なる装飾で、ゲーム性に寄与していない
- 時間帯別の実装が冗長な可能性

### 2.2 拡張内容

**コアコンセプト**: 「場所が体験を決める」

1. **背景状態のグローバル管理**
   - 現在の場所をシステム全体で共有
   - AIチャット、画像生成、UIすべてが同じ場所情報を参照

2. **場所に応じたAI会話**
   - システムプロンプトに現在地情報を注入
   - 場所特有の話題や雰囲気を反映した会話

3. **場所と服装の戦略的マッピング**
   - 各場所に最適な服装を定義
   - 親密度が上がるにつれて露出度や親密さが増す設計

4. **お宝画像への道筋**
   - 高親密度の場所でのみ得られる特別な画像
   - 場所と服装の組み合わせによる段階的な報酬設計

## 3. ディレクトリ構造

```
backend/src/features/
├── locations/                    # 新規：場所管理システム
│   ├── locations.service.ts      # 場所と服装のマッピング管理
│   ├── locations.types.ts        # 場所関連の型定義
│   └── locations.data.ts         # 場所データベース
├── images/
│   └── images.service.ts         # 既存：画像生成（場所対応追加）
└── chats/
    └── chat.service.ts           # 既存：チャット（場所認識追加）

frontend/src/
├── contexts/
│   └── LocationContext.tsx       # 新規：現在地のグローバル管理
├── hooks/
│   └── useLocation.ts           # 新規：場所関連のフック
└── services/
    └── locationMapping.service.ts # 新規：場所と服装のマッピング
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: 
  - BackgroundContext拡張（現在地情報の追加）
  - 新規LocationContextの作成
  - ホーム画面での場所選択UI

- **バックエンド**: 
  - chat.service.ts（システムプロンプトに場所情報追加）
  - images.service.ts（場所に応じた服装・ポーズ）
  - 新規locations.service.ts

- **データモデル**: 
  - Location型の追加
  - ClothingStyle型の追加
  - 場所と服装のマッピングデータ

### 4.2 変更が必要なファイル

```
- frontend/src/types/index.ts: Location型、ClothingStyle型の追加
- backend/src/types/index.ts: 同上の型定義同期
- frontend/src/contexts/BackgroundContext.tsx: 現在地情報の追加
- backend/src/features/chats/chat.service.ts: システムプロンプトに場所注入
- backend/src/features/images/images.service.ts: 場所別服装の実装
- frontend/app/home/page.tsx: 場所選択UIの追加
```

## 5. タスクリスト

### フェーズ1: 基盤構築
- [ ] **T1.1**: Location型とClothingStyle型の定義（両types/index.ts）
- [ ] **T1.2**: 場所データベースの作成（locations.data.ts）
- [ ] **T1.3**: LocationContextの実装
- [ ] **T1.4**: useLocationフックの作成

### フェーズ2: AIチャット連携
- [ ] **T2.1**: chat.service.tsにlocationパラメータ追加
- [ ] **T2.2**: システムプロンプトに場所情報の注入
- [ ] **T2.3**: 場所を考慮した会話ロジックの実装

### フェーズ3: 画像生成連携
- [ ] **T3.1**: locationMapping.serviceの実装
- [ ] **T3.2**: images.service.tsに場所別服装ロジック追加
- [ ] **T3.3**: プロンプト生成に場所と服装の反映

### フェーズ4: UI統合
- [ ] **T4.1**: ホーム画面に現在地表示
- [ ] **T4.2**: 場所変更時のトランジション演出
- [ ] **T4.3**: 親密度による場所アンロック表示

## 6. 場所と服装のマッピング案

```typescript
const locationClothingMap = {
  // 低親密度（0-40）- 初期から解放
  'school_classroom_morning': {
    name: '教室（朝）',
    clothing: 'school_uniform',  // 制服
    appealPoint: '清楚な朝の登校シーン',
    timeSpecific: true,
    unlockIntimacy: 0
  },
  'school_classroom': {
    name: '教室',
    clothing: 'school_uniform',  // 制服
    appealPoint: '清楚な学生服',
    unlockIntimacy: 0
  },
  'cafe': {
    name: 'カフェ',
    clothing: 'casual_date',     // カジュアルな私服
    appealPoint: 'リラックスした雰囲気',
    unlockIntimacy: 10
  },
  'park': {
    name: '公園',
    clothing: 'casual_outdoor',  // アウトドアカジュアル
    appealPoint: '健康的なデート',
    unlockIntimacy: 15
  },
  
  // 中親密度（40-70）- 関係が深まってから解放
  'office': {
    name: 'オフィス',
    clothing: 'office_suit',     // ビジネススーツ
    appealPoint: 'ビジネスパーソンの魅力',
    unlockIntimacy: 35
  },
  'beach': {
    name: 'ビーチ',
    clothing: 'swimsuit',        // 水着
    appealPoint: '夏のデート',
    unlockIntimacy: 40
  },
  'hot_yoga': {
    name: 'ホットヨガ',
    clothing: 'yoga_wear',       // ヨガウェア（キャミソール等）
    appealPoint: 'アクティブでセクシーな姿',
    unlockIntimacy: 45
  },
  'pool': {
    name: 'プール',
    clothing: 'competition_swimsuit', // 競泳水着
    appealPoint: 'スポーティーな魅力',
    unlockIntimacy: 50
  },
  
  // 高親密度（70-90）- 親密な関係で解放
  'home_living': {
    name: '自宅リビング',
    clothing: 'loungewear',      // 部屋着
    appealPoint: 'リラックスした二人きり',
    unlockIntimacy: 70
  },
  'night_view': {
    name: '夜景',
    clothing: 'elegant_dress',   // エレガントなドレス
    appealPoint: 'ロマンチックな夜',
    timeSpecific: true,
    unlockIntimacy: 80
  },
  
  // 超高親密度（85-100）- 最も親密な関係で解放
  'bedroom_night': {
    name: 'ベッドルーム（夜）',
    clothing: 'pajamas',         // パジャマ
    appealPoint: '親密な夜の時間',
    timeSpecific: true,
    unlockIntimacy: 85
  },
  'private_beach_sunset': {
    name: 'プライベートビーチ（夕暮れ）',
    clothing: 'premium_swimsuit', // 特別な水着
    appealPoint: '二人だけのサンセット',
    timeSpecific: true,
    unlockIntimacy: 90
  },
  'onsen': {
    name: '温泉',
    clothing: 'towel_wrap',      // タオル巻き
    appealPoint: '究極のリラックス',
    unlockIntimacy: 95
  }
}
```

### 6.1 親密度による場所解放システム

```typescript
interface LocationUnlockSystem {
  // 親密度チェック
  checkUnlock: (intimacyLevel: number, locationId: string) => boolean;
  
  // 解放可能な場所リスト取得
  getAvailableLocations: (intimacyLevel: number) => Location[];
  
  // 新規解放通知
  notifyNewUnlock: (locationId: string) => void;
  
  // 次の解放場所プレビュー
  getNextUnlockPreview: (intimacyLevel: number) => {
    location: Location;
    requiredIntimacy: number;
  };
}
```

### 6.2 時間帯考慮が必要な場所

- **朝限定**: 教室（朝）- 登校シーンの特別感
- **夕方限定**: プライベートビーチ（夕暮れ）
- **夜限定**: 夜景、ベッドルーム（夜）
- **その他**: 通常の場所は時間帯を問わない

### 6.3 季節限定イベント場所

```typescript
const seasonalLocations = {
  // 春（3-5月）
  'cherry_blossoms': {
    name: '桜並木',
    clothing: 'spring_dress',          // 春らしいワンピース
    appealPoint: '満開の桜の下でデート',
    availablePeriod: { start: '03-20', end: '04-15' },
    unlockIntimacy: 30
  },
  
  // 夏（6-8月）
  'fireworks_festival': {
    name: '花火大会',
    clothing: 'yukata',               // 浴衣
    appealPoint: '夏祭りの特別な夜',
    availablePeriod: { start: '07-15', end: '08-31' },
    unlockIntimacy: 55
  },
  'summer_festival': {
    name: '夏祭り',
    clothing: 'casual_yukata',        // カジュアル浴衣
    appealPoint: '屋台と花火の思い出',
    availablePeriod: { start: '07-01', end: '08-31' },
    unlockIntimacy: 40
  },
  
  // 秋（9-11月）
  'halloween_party': {
    name: 'ハロウィンパーティー',
    clothing: 'devil_costume',        // デビルコスプレ
    appealPoint: '大胆な仮装パーティー',
    availablePeriod: { start: '10-15', end: '11-01' },
    unlockIntimacy: 75
  },
  'autumn_leaves': {
    name: '紅葉狩り',
    clothing: 'autumn_coat',          // 秋のコート
    appealPoint: '紅葉デート',
    availablePeriod: { start: '10-15', end: '11-30' },
    unlockIntimacy: 35
  },
  
  // 冬（12-2月）
  'christmas_illumination': {
    name: 'クリスマスイルミネーション',
    clothing: 'winter_dress',         // 冬のドレス
    appealPoint: 'ロマンチックな聖夜',
    availablePeriod: { start: '12-01', end: '12-26' },
    unlockIntimacy: 60
  },
  'christmas_party': {
    name: 'クリスマスパーティー',
    clothing: 'santa_costume',        // サンタコスプレ
    appealPoint: 'プライベートパーティー',
    availablePeriod: { start: '12-20', end: '12-25' },
    unlockIntimacy: 80
  },
  'new_year_shrine': {
    name: '初詣',
    clothing: 'kimono',              // 振袖/着物
    appealPoint: '新年の特別な装い',
    availablePeriod: { start: '12-31', end: '01-07' },
    unlockIntimacy: 65
  },
  'valentine_date': {
    name: 'バレンタインデート',
    clothing: 'elegant_dress',        // エレガントなドレス
    appealPoint: '特別な告白の日',
    availablePeriod: { start: '02-10', end: '02-15' },
    unlockIntimacy: 70
  }
}
```

### 6.4 季節イベントシステム

```typescript
interface SeasonalEventSystem {
  // 現在利用可能な季節イベントを取得
  getAvailableSeasonalEvents: (currentDate: Date, intimacyLevel: number) => SeasonalLocation[];
  
  // 次の季節イベント予告
  getUpcomingEvents: (currentDate: Date) => {
    event: SeasonalLocation;
    daysUntil: number;
    requiredIntimacy: number;
  }[];
  
  // 季節イベント限定報酬
  getSeasonalRewards: (eventId: string) => {
    specialImage: boolean;
    uniqueDialogue: boolean;
    memoryBonus: number;
  };
}
```

## 7. テスト計画

1. **場所状態の同期テスト**
   - 背景変更時のLocationContext更新確認
   - AIチャットへの場所情報伝達確認

2. **AI会話テスト**
   - 各場所での会話内容の適切性
   - 場所に応じた話題の変化

3. **画像生成テスト**
   - 場所と服装の組み合わせ確認
   - 親密度による服装変化の確認

## 8. SCOPE_PROGRESSへの統合

```markdown
- [ ] **T-BG-001**: 戦略的背景システムの実装
  - 目標: 2025-01-20
  - 参照: [/docs/plans/planning/ext-strategic-background-system-2025-01-13.md]
  - 内容: 背景と服装の連携、AIチャット・画像生成との統合
```

## 9. 今後の拡張可能性

1. **季節イベントの拡充**
   - 期間限定の特別な背景と服装
   - イベント限定の会話内容
   - 季節ごとの特別報酬

2. **場所別ミニゲーム**
   - カフェでの会話ゲーム
   - ビーチでのアクティビティ
   - 季節イベントでの特別ミッション

3. **場所コレクション要素**
   - 訪れた場所の記録
   - 季節イベント参加バッジ
   - 年間を通じたコンプリート報酬

## 10. 備考

- 時間帯別の実装は一旦簡略化し、特定の場所（夜景等）のみ時間を考慮
- 季節イベントは期間限定でリアルタイムの日付と連動
- 服装の露出度は段階的に、ユーザーの期待値を適切にコントロール
- 「お宝画像」は親密度と場所（通常＋季節イベント）の組み合わせで自然に到達できる設計
- 季節イベントを逃しても翌年また楽しめる循環型設計