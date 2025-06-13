# 背景設定統一システム実装引き継ぎ資料

**作成日**: 2025年1月13日  
**プロジェクト**: 恋AIパートナー - 背景設定統一化  
**現在のフェーズ**: フェーズ2完了、BackgroundProvider統合待ち

## 🎯 プロジェクト概要

恋愛ゲーム風AIチャットアプリの背景設定機能を統一し、リアルタイム時間連動・親密度制御・季節イベント自動表示を実装するプロジェクトです。

### 完了済みフェーズ
- ✅ **フェーズ1**: 型定義統一とContext基盤構築
- ✅ **フェーズ2**: ホーム画面のAPI連携化

### 次のタスク
- 🔄 **BackgroundProviderの統合**: アプリケーションルートへの組み込み

## 📁 実装済みファイル

### 1. BackgroundContext (`/frontend/src/contexts/BackgroundContext.tsx`)
```typescript
// 主な機能:
- 背景状態の一元管理
- API連携によるbackground一覧取得
- ユーザー設定の永続化
- エラーハンドリング
```

### 2. useBackground Hook (`/frontend/src/hooks/useBackground.ts`)
```typescript
// 提供する機能:
- getCurrentBackgroundStyle() - 現在の背景CSSスタイル生成
- cycleThroughBackgrounds() - 背景の順次切り替え
- getBackgroundsByCategory() - カテゴリ別背景取得
- getDefaultBackground() - デフォルト背景取得
```

### 3. backgroundSelectionService (`/frontend/src/services/backgroundSelection.service.ts`)
```typescript
// 背景選択ロジック:
- getTimeOfDay() - 現在時刻から時間帯を判定
- getCurrentSeason() - 現在の季節を取得
- getSeasonalEvents() - 季節イベント（桜、クリスマス等）を検出
- filterByIntimacy() - 親密度によるアクセス制御
- getRecommendedBackgrounds() - 時間・季節・親密度を考慮した推奨背景
```

### 4. 更新済みホーム画面 (`/frontend/app/home/page.tsx`)
```typescript
// 変更内容:
- ハードコードされたUnsplash背景を削除
- useBackgroundフックを導入
- cycleThroughBackgrounds()で背景切り替え
- getCurrentBackgroundStyle()でスタイル適用
```

## 🔧 次の実装タスク: BackgroundProvider統合

### 実装場所の特定
1. **app/layout.tsx**を確認
2. **app/providers.tsx**が存在するか確認
3. AuthProviderの実装場所を特定

### 実装手順

#### パターンA: layout.tsxに直接追加
```typescript
// app/layout.tsx
import { BackgroundProvider } from '@/contexts/BackgroundContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <BackgroundProvider>
            {children}
          </BackgroundProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### パターンB: providers.tsxを使用
```typescript
// app/providers.tsx
'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { BackgroundProvider } from '@/contexts/BackgroundContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BackgroundProvider>
        {children}
      </BackgroundProvider>
    </AuthProvider>
  )
}
```

### 実装時の注意点

1. **'use client'ディレクティブ**
   - BackgroundProviderはuseState/useEffectを使用するため、クライアントコンポーネント
   - layout.tsxがサーバーコンポーネントの場合、providers.tsxパターンを使用

2. **Provider順序**
   - AuthProvider → BackgroundProvider の順序を維持
   - BackgroundProviderは認証状態に依存する可能性があるため

3. **エラーハンドリング**
   - BackgroundProvider内でAPIエラーが発生してもアプリがクラッシュしないよう設計済み
   - デフォルト背景へのフォールバック機能あり

## 🎨 背景画像の構造

### 期待される画像配置
```
/frontend/public/images/backgrounds/
├── public/              # 親密度0-40
│   ├── cafe_morning.jpg
│   ├── cafe_afternoon.jpg
│   └── cafe_evening.jpg
├── semi_private/        # 親密度30-70
│   ├── restaurant_afternoon.jpg
│   └── restaurant_evening.jpg
├── private/             # 親密度60-100
│   ├── bedroom_morning.jpg
│   └── bedroom_evening.jpg
├── special/             # 親密度85-100
│   └── hotel_room_evening.jpg
└── seasonal/            # 季節イベント
    ├── cherry_blossoms_morning.jpg
    └── christmas_illumination_evening.jpg
```

### 背景画像の命名規則
- フォーマット: `{場所}_{時間帯}.jpg`
- 時間帯: morning, afternoon, evening, night
- 例: `cafe_morning.jpg`, `bedroom_evening.jpg`

## 🚨 トラブルシューティング

### 問題1: 背景が表示されない
```typescript
// 確認事項:
1. BackgroundProviderが正しくwrapされているか
2. imagesService.getBackgrounds()が正しくデータを返しているか
3. 画像ファイルが正しいパスに配置されているか
```

### 問題2: TypeScriptエラー
```typescript
// 対処法:
1. BackgroundImageの型定義を確認
2. useBackgroundの返り値の型を確認
3. getCurrentBackgroundStyle()の返り値がReact.CSSPropertiesか確認
```

### 問題3: 親密度による制御が効かない
```typescript
// 確認事項:
1. バックエンドでintimacyLevelが正しく取得されているか
2. filterByIntimacy()のロジックを確認
3. backgroundカテゴリが正しく設定されているか
```

## 📊 現在の状態サマリー

### 完了済み
- ✅ 型定義統一（BackgroundOption削除、BackgroundImageに統一）
- ✅ BackgroundContext作成（状態管理、API連携、永続化）
- ✅ useBackgroundフック作成（UI連携用の便利関数群）
- ✅ backgroundSelectionService作成（時間・季節・親密度ロジック）
- ✅ ホーム画面の統合（ハードコード削除、Context利用）

### 未実装
- ❌ BackgroundProviderのアプリケーションルートへの統合
- ❌ 設定画面からの背景選択機能削除（フェーズ3）
- ❌ バックエンドAPIの親密度フィルタリング実装
- ❌ 実際の背景画像ファイルの配置

## 💡 実装のポイント

1. **BackgroundProviderの統合が最優先**
   - これがないと背景機能が動作しない
   - layout.tsxまたはproviders.tsxで実装

2. **画像ファイルの準備**
   - 現在はプレースホルダーパスのみ
   - 実際の画像ファイルを配置する必要あり

3. **API拡張の検討**
   - 現在は静的リストを返すのみ
   - 親密度・時間帯による動的フィルタリングの実装が理想

## 🔗 関連ドキュメント

- `/docs/requirements.md` - 全体要件定義（背景システム含む）
- `/docs/refactoring/background-settings-unification-2025-01-13.md` - リファクタリング計画書

この資料により、次の実装者がスムーズにBackgroundProvider統合を完了できるはずです。