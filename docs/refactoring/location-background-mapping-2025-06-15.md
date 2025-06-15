# リファクタリング計画: 場所-背景マッピングシステム 2025-06-15

## 1. 現状分析

### 1.1 対象概要
場所-背景マッピングシステムは、ユーザーが選択した場所に応じて適切な背景画像を自動的に設定する機能。フロントエンドとバックエンドで背景データを管理し、時間帯や場所に応じた背景選択を行う。

### 1.2 問題点と課題
- **カテゴリベースのフィルタリング問題**: `filterByIntimacy`メソッドが`outdoor`カテゴリを認識せず、pool、gym、restaurantなどの背景が利用できない
- **重複した親密度制限**: 場所自体に`unlockIntimacy`があるのに、背景でも親密度フィルタリングを行っている
- **不完全なカテゴリ定義**: `outdoor`、`work`カテゴリが`filterByIntimacy`に含まれていない
- **不要な複雑性**: 場所の親密度制限で十分なのに、追加のフィルタリングロジックが存在

### 1.3 関連ファイル一覧
- `frontend/src/services/backgroundSelection.service.ts`
- `frontend/src/hooks/useLocationBackground.ts`
- `frontend/src/hooks/useBackground.ts`
- `frontend/src/contexts/BackgroundContext.tsx`
- `backend/src/features/images/backgrounds-data.ts`
- `backend/src/features/locations/location-background-map.ts`

### 1.4 依存関係図
```
LocationSelector
  ├── LocationContext (場所の親密度制限)
  └── useLocationBackground
       ├── useBackground
       │    └── BackgroundContext
       │         └── imagesApiService
       └── backgroundSelectionService (不要なフィルタリング)
```

## 2. リファクタリングの目標

### 2.1 期待される成果
- すべての背景画像が適切に利用可能になる
- 不要なフィルタリングロジックの削除によるコードの簡素化
- バグの解消（pool、gym、restaurantなどの背景が表示される）
- より直感的で保守しやすいコード構造

### 2.2 維持すべき機能
- 場所に基づく背景の自動選択
- 時間帯に応じた背景バリエーションの選択
- 場所の親密度によるアクセス制限（LocationContextレベル）
- 推奨背景の提案機能

## 3. 理想的な実装

### 3.1 全体アーキテクチャ
```
場所選択
  ↓
LocationContext（親密度チェック）
  ↓
useLocationBackground（背景選択）
  ↓
背景画像の表示（フィルタリングなし）
```

### 3.2 核心的な改善ポイント
- カテゴリベースのフィルタリングを完全に削除
- 場所の親密度制限のみで十分であることを認識
- シンプルで直感的なデータフロー

### 3.3 新しいディレクトリ構造
変更なし（ファイル構造は維持）

## 4. 実装計画

### フェーズ1: 不要なフィルタリングロジックの削除
- **目標**: カテゴリベースの親密度フィルタリングを削除
- **影響範囲**: `backgroundSelection.service.ts`
- **タスク**:
    1. **T1.1**: `filterByIntimacy`メソッドの削除
       - 対象: `backgroundSelection.service.ts:72-95`
       - 実装: メソッド全体を削除
    2. **T1.2**: `getRecommendedBackgrounds`の修正
       - 対象: `backgroundSelection.service.ts:139-175`
       - 実装: `filterByIntimacy`の呼び出しを削除し、すべての背景を対象に
- **検証ポイント**:
    - TypeScriptのビルドエラーがないこと
    - `getRecommendedBackgrounds`が正常に動作すること

### フェーズ2: 動作確認とテスト
- **目標**: 修正後の動作を確認
- **影響範囲**: アプリケーション全体
- **タスク**:
    1. **T2.1**: 開発環境での動作確認
       - 対象: pool、gym、restaurantなどの場所
       - 実装: 各場所を選択して背景が正しく表示されることを確認
    2. **T2.2**: エラーログの確認
       - 対象: ブラウザコンソール
       - 実装: 「背景が見つかりません」エラーが解消されていることを確認
- **検証ポイント**:
    - すべての場所で背景が正しく表示される
    - エラーが発生しない

## 5. 期待される効果

### 5.1 コード削減
- 削除行数: 約25行（`filterByIntimacy`メソッド）
- 簡素化されたロジック: 1箇所

### 5.2 保守性向上
- 不要な複雑性の排除
- より直感的なデータフロー
- カテゴリ管理の簡素化

### 5.3 拡張性改善
- 新しい背景カテゴリの追加が容易に
- カテゴリ定義を気にせず背景を追加可能

## 6. リスクと対策

### 6.1 潜在的リスク
- 推奨背景機能が親密度を考慮しなくなる
- 将来的に親密度ベースの背景制限が必要になる可能性

### 6.2 対策
- 推奨背景は時間帯と季節のみで十分
- 必要であれば、場所レベルで制限を実装

## 7. 備考
- 実装済み: フェーズ1のタスクは完了
- 今後の課題: カテゴリ定義の見直し（outdoor、work、semi_private、specialなど）を統一する必要があるかもしれない