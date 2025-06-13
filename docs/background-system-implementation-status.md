# 背景画像システム実装状況分析レポート

**作成日**: 2025-01-13  
**ステータス**: 分析完了

## 1. 要件定義からの背景画像システム要件（requirements.md）

### 1.1 主要要件
- **背景画像選択要素**: チャット背景のカスタマイズ（画面要素ID: 44行目）
- **ページ内での実装**: ホーム（チャット）ページ（U-001）に背景変更ボタン（351行目）
- **背景切り替え機能**: プリセット背景画像の循環表示（360行目）

### 1.2 詳細仕様（509-529行目）
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

### 1.3 APIエンドポイント要件
- `GET /api/backgrounds` → 利用可能な背景画像一覧取得（371行目、588行目）

## 2. 現在の実装状況

### 2.1 実装済み機能

#### バックエンド側
1. **APIエンドポイント**
   - `GET /api/images/backgrounds` - 実装済み（認証不要）
   - ImagesService.getBackgroundImages() - 静的データを返す実装

2. **背景画像データ構造**
   - カテゴリ: `nature`, `indoor`, `fantasy`, `modern`, `romantic`
   - デフォルト背景: 「桜並木」（nature-01）
   - 画像パス形式: `/images/backgrounds/{category}/{name}.jpg`

#### フロントエンド側
1. **新規実装ファイル**（gitで巻き戻る前に追加）
   - `BackgroundContext.tsx` - 背景管理のコンテキスト
   - `useBackground.ts` - 背景操作のカスタムフック
   - `backgroundSelection.service.ts` - 選択ロジックサービス

2. **実装済み機能**
   - 時間帯による自動背景選択
   - 季節・イベントによる背景推奨
   - 親密度に基づくアクセス制御
   - 背景の循環切り替え機能
   - ユーザー設定の保存・読み込み

### 2.2 型定義の状況
```typescript
// 両環境で同期済み
export interface BackgroundImage {
  id: string;
  name: string;
  url: string;
  category: string;
  isDefault: boolean;
  thumbnail?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}
```

## 3. 未実装・要修正項目

### 3.1 BackgroundProviderの統合
- **問題**: BackgroundProviderがアプリケーションのルートレイアウトに統合されていない
- **影響**: useBackgroundフックが使用できない
- **対応**: app/layout.tsxまたは適切な親コンポーネントでProviderをラップする必要

### 3.2 ホーム画面での背景変更UI
- **要件**: ヘッダーに背景変更ボタン（🎨）
- **現状**: BackgroundContextは実装済みだが、UIからの呼び出しが未実装
- **対応**: home/page.tsxでuseBackgroundフックを使用してUIを実装

### 3.3 画像ファイルの配置
- **問題**: 実際の背景画像ファイルが配置されていない可能性
- **必要なディレクトリ**: `frontend/public/images/backgrounds/`
- **対応**: 各カテゴリごとに画像ファイルを配置

### 3.4 カテゴリ名の不一致
- **要件定義**: "日常系", "ロマンチック", "自然", "都市", "季節限定", "特別な場所"
- **実装**: "nature", "indoor", "fantasy", "modern", "romantic"
- **対応**: カテゴリ名を要件定義に合わせるか、マッピングを実装

### 3.5 親密度システムとの連携
- **実装済み**: backgroundSelectionServiceに親密度フィルタリング機能
- **未実装**: 実際の親密度データの取得・連携
- **対応**: パートナーの親密度レベルを取得して背景フィルタリングに使用

## 4. 推奨実装手順

### Step 1: BackgroundProviderの統合
```typescript
// app/layout.tsx または適切な親コンポーネント
import { BackgroundProvider } from '@/contexts/BackgroundContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <BackgroundProvider>
          {children}
        </BackgroundProvider>
      </body>
    </html>
  );
}
```

### Step 2: ホーム画面での背景変更UI実装
```typescript
// app/home/page.tsx
import { useBackground } from '@/hooks/useBackground';

// ヘッダー内に背景切り替えボタンを追加
const { cycleThroughBackgrounds, currentBackground } = useBackground();

<button onClick={cycleThroughBackgrounds}>
  🎨
</button>
```

### Step 3: 背景画像の配置
- `frontend/public/images/backgrounds/` に各カテゴリのディレクトリを作成
- 要件定義に合わせた画像ファイルを配置

### Step 4: カテゴリマッピングの実装
- バックエンドのカテゴリ名を要件定義に合わせて更新
- または、フロントエンドでマッピング処理を実装

## 5. 実装優先度

1. **高**: BackgroundProviderの統合（基盤となるため）
2. **高**: ホーム画面での背景変更UI（ユーザー体験の中核）
3. **中**: 背景画像ファイルの配置
4. **低**: カテゴリ名の統一（動作には影響しない）
5. **低**: 親密度システムとの連携（将来的な拡張）

## 6. 備考

- 時間帯・季節による背景選択ロジックは既に高度に実装されている
- ユーザー設定の保存機能も実装済み
- 主な課題は、実装済みコンポーネントの統合とUI側での活用