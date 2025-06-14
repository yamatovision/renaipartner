# 戦略的背景システム実装コンテキスト

**作成日**: 2025年1月13日  
**作業内容**: 背景システムの戦略的拡張（場所と服装の連携、季節イベント、男女対応）

## 📁 変更・作成したファイル一覧

### 1. 新規作成ファイル

#### ドキュメント
- `/docs/plans/planning/ext-strategic-background-system-2025-01-13.md` - 機能拡張計画書
- `/docs/background-system-handover-2025-01-13.md` - 背景システム引き継ぎ資料
- `/docs/location-clothing-prompt-mapping.md` - 場所別服装プロンプトマッピング表
- `/docs/gender-aware-clothing-system.md` - 性別対応服装システム設計
- `/docs/female-perspective-analysis.md` - 女性視点での男性パートナー魅力度分析
- `/docs/strategic-background-system-context-2025-01-13.md` - 本ファイル

### 2. 更新したファイル

#### 型定義
- `/frontend/src/types/index.ts` - フロントエンド型定義
  - ClothingStyleの拡張（office_suit等追加）
  - LocationData, SeasonalEvent等の新型追加
  - BackgroundImageにlocationId, isSeasonalEvent追加
  - API_PATHS.LOCATIONSの追加

- `/backend/src/types/index.ts` - バックエンド型定義
  - フロントエンドと同一の変更を同期

#### その他
- `/docs/requirements.md` - 要件定義書（背景画像システムの詳細追加）
- `/docs/SCOPE_PROGRESS.md` - タスク管理（T-BG-001追加）

## 🎯 実装の核心コンセプト

### 1. 場所が体験を決める
- 背景は単なる装飾ではなく、デート体験の中核
- AIチャットと画像生成が現在地を認識
- 最終的に「お宝画像」への到達を目指す

### 2. 場所と服装の戦略的マッピング
```typescript
// 例：
'school_classroom': 'school_uniform'      // 制服
'beach': 'swimsuit'                       // 水着  
'office': 'office_suit'                   // ビジネススーツ
'hot_yoga': 'yoga_wear'                   // ヨガウェア
'halloween_party': 'devil_costume'        // デビルコスプレ
```

### 3. 親密度による段階的解放
- 0-40: 教室、カフェ、公園
- 40-70: ビーチ、オフィス、ホットヨガ
- 70-90: 自宅、夜景、屋上
- 85-100: ベッドルーム、温泉、プライベートビーチ

### 4. 季節イベントシステム
- 春：桜並木（3/20-4/15）
- 夏：花火大会、夏祭り（7-8月）
- 秋：ハロウィン、紅葉（10-11月）
- 冬：クリスマス、初詣（12-1月）

### 5. 男女両対応
- 各服装プロンプトに[MALE]と[FEMALE]バリエーション
- 性別に応じた適切な表現（例：男性はビジネススーツ、女性はOLスーツ）

## 🔧 実装に必要な主要コンポーネント

### フロントエンド
1. **LocationContext** - 現在地のグローバル管理
2. **useLocation Hook** - 場所関連の便利関数
3. **locationMapping.service** - 場所と服装のマッピング

### バックエンド  
1. **locations.service** - 場所管理ビジネスロジック
2. **場所情報のAIチャット注入** - chat.service.tsの拡張
3. **場所連動画像生成** - images.service.tsの拡張

## 📋 次の実装ステップ

### フェーズ1: 基盤構築
```bash
# 1. LocationContextの実装
frontend/src/contexts/LocationContext.tsx

# 2. 場所データベースの作成
backend/src/features/locations/locations.data.ts

# 3. APIエンドポイントの実装
backend/src/features/locations/locations.routes.ts
```

### フェーズ2: AIチャット連携
```typescript
// chat.service.tsでシステムプロンプトに場所情報を注入
const systemPrompt = `
あなたは${location.name}にいます。
${location.appealPoint}
現在のパートナーの服装：${getClothingDescription(location.clothing, partner.gender)}
`;
```

### フェーズ3: 画像生成連携
```typescript
// images.service.tsで場所に応じた服装プロンプトを生成
const clothingPrompt = getClothingPrompt(location.clothing, partner.gender);
```

## 🚨 重要な実装上の注意点

1. **BackgroundProviderの統合が未完了**
   - app/layout.tsxまたはproviders.tsxへの追加が必要

2. **男女両対応の徹底**
   - 全ての服装プロンプトで性別チェックを実装

3. **季節イベントの日付チェック**
   - リアルタイムで利用可能な場所を判定

4. **親密度によるアクセス制御**
   - 場所解放時の通知システムも考慮

## 💡 引き継ぎ時の指示文

次のAIエージェントへの指示：

```
戦略的背景システムの実装を継続してください。

1. まず以下のドキュメントを読み込んでください：
   - /docs/plans/planning/ext-strategic-background-system-2025-01-13.md
   - /docs/background-system-handover-2025-01-13.md
   - 本ファイル（strategic-background-system-context-2025-01-13.md）

2. 現在の状況：
   - 型定義は完了（frontend/backend両方）
   - BackgroundContext基盤は実装済み
   - BackgroundProviderの統合が未完了
   - 場所システムの実装が必要

3. 優先実装事項：
   - BackgroundProviderをapp/layout.tsxに統合
   - LocationContextの新規作成
   - 場所APIエンドポイントの実装
   - AIチャットへの場所情報注入

4. 女性視点での追加提案（female-perspective-analysis.md参照）：
   - 体験型デートスポット（料理教室等）の追加検討
   - ジャケットスタイルなど大人の男性服装の追加

場所によって服装が変わり、親密度で解放される恋愛ゲーム的な体験を実現してください。
```