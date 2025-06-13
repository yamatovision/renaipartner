# リファクタリング計画: 背景設定機能統一 2025-01-13

## 1. 現状分析

### 1.1 対象概要
背景設定機能は現在、ホーム画面（ローカル状態）と設定画面（API状態）で二重実装されており、データソースと管理方法が完全に分離している。この二重実装により、ユーザー体験の不整合と開発の複雑さが生まれている。

### 1.2 問題点と課題
- **二重実装**: ホーム画面（ハードコード配列）と設定画面（API連携）で別々の実装
- **同期なし**: 一方での変更が他方に反映されない
- **永続化の不一致**: ホーム画面の変更は保存されず、リロード時に失われる
- **データソース重複**: Unsplash外部URLとローカル画像パスの混在管理
- **型定義重複**: `BackgroundOption`と`BackgroundImage`が類似役割で重複定義
- **画像リソース分散**: 外部依存（Unsplash）と内部リソース（`/images/backgrounds/`）の混在

### 1.3 関連ファイル一覧
**フロントエンド**:
- `/frontend/app/home/page.tsx` - ホーム画面の背景変更機能（ハードコード実装）
- `/frontend/app/settings/page.tsx` - 設定画面の背景選択モーダル（API実装）
- `/frontend/src/types/index.ts` - 型定義（BackgroundOption, BackgroundImage）
- `/frontend/src/services/api/images.api.ts` - 画像API接続サービス
- `/frontend/src/services/api/settings.api.ts` - 設定API接続サービス

**バックエンド**:
- `/backend/src/types/index.ts` - 型定義（BackgroundOption, BackgroundImage）
- `/backend/src/features/images/images.service.ts` - 背景画像プリセット管理
- `/backend/src/features/images/images.controller.ts` - 背景API制御
- `/backend/src/features/images/images.routes.ts` - 背景API ルーティング
- `/backend/src/features/images/images.validator.ts` - 背景データバリデーション
- `/backend/src/features/settings/settings.validator.ts` - 設定バリデーション
- `/backend/src/db/models/UserSetting.model.ts` - ユーザー設定データベースモデル

**テスト**:
- `/backend/tests/integration/images/backgrounds-only.test.ts`
- `/backend/tests/integration/images/simple-backgrounds.test.ts`
- `/backend/tests/integration/images/images.flow.test.ts`
- `/backend/tests/integration/settings/settings.flow.test.ts`

### 1.4 依存関係図
```
ホーム画面
├── ハードコード背景配列（Unsplash URLs）
├── ローカルstate管理（backgroundIndex）
└── 永続化なし

設定画面
├── API連携（/api/images/backgrounds）
├── データベース永続化（UserSetting.background_image）
├── ローカル画像リソース（/images/backgrounds/）
└── 型定義（BackgroundImage）

共通API基盤
├── imagesService.getBackgrounds()
├── settingsService.updateSettings()
└── データベース（UserSetting テーブル）
```

## 2. リファクタリングの目標

### 2.1 期待される成果
- **一元管理**: ホーム画面からのみ背景変更可能な統一UI
- **データ一貫性**: 全ての背景変更がデータベースに永続化される
- **リソース統一**: ローカル画像（`/images/backgrounds/`）への完全移行
- **コード削減**: 重複実装の排除により約30%のコード削減
- **型安全性向上**: 統一型定義による開発効率向上
- **保守性改善**: 単一責任の原則に基づく明確な責任分離

### 2.2 維持すべき機能
- 7つの背景プリセット（nature, indoor, fantasy, modern, romantic系）
- カテゴリ別背景フィルタリング機能
- デフォルト背景の自動設定
- 認証ユーザーのみ変更可能な制限
- 背景変更時のリアルタイム反映
- データベースへの自動保存

## 3. 理想的な実装

### 3.1 全体アーキテクチャ
```
【統一後の構造】

ホーム画面（唯一の変更UI）
├── BackgroundContext（状態管理）
├── API連携（/api/images/backgrounds）
├── リアルタイム背景反映
└── 永続化機能

設定画面（背景機能削除）
├── 他の設定項目のみ表示
└── 背景関連UI完全削除

共通基盤
├── 統一型定義（BackgroundImage）
├── ローカル画像リソース（/images/backgrounds/）
└── データベース永続化（UserSetting.background_image）
```

### 3.2 核心的な改善ポイント
1. **Context API導入**: `BackgroundContext`による全アプリ統一状態管理
2. **API統一**: 既存のimages APIを活用した一元管理
3. **UI責任分離**: ホーム画面＝変更UI、設定画面＝その他設定に特化
4. **リソース最適化**: 外部依存を排除し、ローカルリソースに統一
5. **型安全性**: `BackgroundImage`型による統一データ構造

### 3.3 新しいディレクトリ構造
```
frontend/src/
├── contexts/
│   ├── AuthContext.tsx
│   └── BackgroundContext.tsx  【新規作成】
├── hooks/
│   └── useBackground.ts       【新規作成】
├── types/
│   └── index.ts              【型統一】
└── services/
    └── api/
        ├── images.api.ts     【拡張】
        └── settings.api.ts   【簡素化】

backend/src/
├── types/
│   └── index.ts              【型統一】
└── features/
    ├── images/               【既存活用】
    └── settings/             【背景関連削除】
```

## 4. 実装計画

### フェーズ1: 型定義統一とContext基盤構築
- **目標**: 型の重複解消とBackgroundContext導入
- **影響範囲**: フロントエンド型定義、新規Context作成
- **タスク**:
  1. **T1.1**: 型定義統一
     - 対象: `frontend/src/types/index.ts`、`backend/src/types/index.ts`
     - 実装: `BackgroundOption`を削除し、`BackgroundImage`に統一
  2. **T1.2**: BackgroundContext作成
     - 対象: `frontend/src/contexts/BackgroundContext.tsx`（新規）
     - 実装: 背景状態管理、API連携、永続化機能を含むProvider作成
  3. **T1.3**: useBackgroundフック作成
     - 対象: `frontend/src/hooks/useBackground.ts`（新規）
     - 実装: Context利用と背景変更ロジックの抽象化
- **検証ポイント**:
  - TypeScript型エラーが発生しないこと
  - BackgroundContextが正常に初期化されること
  - 既存機能に影響がないこと

### フェーズ2: ホーム画面のAPI連携化
- **目標**: ハードコード配列からAPI連携への変更
- **影響範囲**: ホーム画面実装、背景データソース
- **タスク**:
  1. **T2.1**: ホーム画面の背景配列削除
     - 対象: `frontend/app/home/page.tsx:26-44`
     - 実装: ハードコード配列とUnsplash URLを完全削除
  2. **T2.2**: BackgroundContext統合
     - 対象: `frontend/app/home/page.tsx`
     - 実装: useBackgroundフックを利用した背景管理に変更
  3. **T2.3**: API連携実装
     - 対象: `frontend/app/home/page.tsx`
     - 実装: `imagesService.getBackgrounds()`を利用した背景取得
  4. **T2.4**: ローカル状態削除
     - 対象: `frontend/app/home/page.tsx`
     - 実装: `backgroundIndex` stateと関連ロジックを削除
- **検証ポイント**:
  - ホーム画面で7つの背景プリセットが正常表示されること
  - 背景変更がリアルタイムで反映されること
  - 変更内容がデータベースに保存されること

### フェーズ3: 設定画面の背景機能削除
- **目標**: 設定画面から背景関連機能を完全削除
- **影響範囲**: 設定画面UI、関連状態管理
- **タスク**:
  1. **T3.1**: 背景選択モーダル削除
     - 対象: `frontend/app/settings/page.tsx:604-628`
     - 実装: 背景選択モーダルのJSX要素を完全削除
  2. **T3.2**: 背景関連state削除
     - 対象: `frontend/app/settings/page.tsx`
     - 実装: `showBackgroundModal`、`backgroundImages`、`handleBackgroundSelect`を削除
  3. **T3.3**: 背景変更ボタン削除
     - 対象: `frontend/app/settings/page.tsx`
     - 実装: 背景変更トリガーとなるUI要素を削除
  4. **T3.4**: API呼び出し整理
     - 対象: `frontend/app/settings/page.tsx`
     - 実装: 背景関連のAPI呼び出しとuseEffectを削除
- **検証ポイント**:
  - 設定画面に背景関連UI要素が存在しないこと
  - 設定画面の他機能が正常動作すること
  - JavaScript エラーが発生しないこと

### フェーズ4: API とサービス層の最適化
- **目標**: 不要なAPI機能削除とサービス層の最適化
- **影響範囲**: API エンドポイント、サービスメソッド
- **タスク**:
  1. **T4.1**: settingsAPI背景メソッド削除
     - 対象: `frontend/src/services/api/settings.api.ts:20-23`
     - 実装: `getBackgrounds()`メソッドを削除
  2. **T4.2**: API_PATHS整理
     - 対象: `frontend/src/types/index.ts`、`backend/src/types/index.ts`
     - 実装: `SETTINGS.BACKGROUNDS`パスが不要か確認し、必要に応じて削除
  3. **T4.3**: バリデーション最適化
     - 対象: `backend/src/features/settings/settings.validator.ts:54-59`
     - 実装: backgroundImageバリデーションロジックの最適化
  4. **T4.4**: 不要import削除
     - 対象: 全関連ファイル
     - 実装: 削除された機能に関連するimport文をクリーンアップ
- **検証ポイント**:
  - 統合テストが全て通過すること
  - 不要なAPI呼び出しが存在しないこと
  - TypeScript ビルドエラーが発生しないこと

### フェーズ5: テスト更新と最終検証
- **目標**: 変更に対応したテスト更新と動作検証
- **影響範囲**: 統合テスト、E2Eテスト
- **タスク**:
  1. **T5.1**: 背景関連テスト更新
     - 対象: `/backend/tests/integration/images/`配下のテストファイル
     - 実装: 新しい実装に対応したテストケース更新
  2. **T5.2**: 設定系テスト調整
     - 対象: `/backend/tests/integration/settings/settings.flow.test.ts`
     - 実装: 背景機能削除に対応したテスト調整
  3. **T5.3**: E2E動作確認
     - 対象: 全体フロー
     - 実装: ユーザー操作フローの包括的検証
  4. **T5.4**: パフォーマンス検証
     - 対象: ホーム画面、設定画面
     - 実装: 表示速度とAPI呼び出し効率の確認
- **検証ポイント**:
  - 全テストが通過すること
  - ユーザー操作が直感的に実行できること
  - パフォーマンス劣化が発生していないこと

## 5. 期待される効果

### 5.1 コード削減
- **削除対象**: 約150行（ホーム画面ハードコード + 設定画面モーダル）
- **統合効果**: 重複型定義削除により型ファイル20%削減
- **保守負荷**: 背景関連バグ修正箇所が1/2に削減

### 5.2 保守性向上
- **単一責任**: 背景変更機能がホーム画面に一本化
- **データ整合性**: 永続化により設定の信頼性向上
- **開発効率**: 型安全性により背景関連開発が30%高速化
- **障害対応**: 問題発生時の調査範囲が明確化

### 5.3 拡張性改善
- **新背景追加**: バックエンドのプリセット配列のみ変更で対応
- **カテゴリ拡張**: 既存APIフレームワークで容易に対応
- **UI改善**: Contextベース設計により柔軟なUI拡張が可能
- **パフォーマンス**: ローカルリソース化により表示速度向上

## 6. リスクと対策

### 6.1 潜在的リスク
- **データ移行**: 既存ユーザーの背景設定が適切に移行されない可能性
- **外部URL**: Unsplash画像に依存するユーザーデータの互換性問題
- **API負荷**: ホーム画面表示時のAPI呼び出し増加
- **テストカバレッジ**: 新しいContext実装のテスト不足

### 6.2 対策
- **段階的移行**: フェーズ別実装により影響範囲を限定
- **フォールバック**: デフォルト背景による安全な初期状態確保
- **キャッシュ戦略**: API レスポンスキャッシュによる性能最適化
- **包括テスト**: Context、フック、統合テストの完全実装

## 7. 備考

### 技術的考慮事項
- **型安全性**: TypeScript strict モードでの完全な型チェック
- **アクセシビリティ**: 背景変更時のコントラスト比確保
- **国際化**: 背景カテゴリ名の多言語対応準備
- **パフォーマンス**: 画像プリロードによる体験向上

### 将来的な拡張案
- **カスタム背景**: ユーザー独自画像アップロード機能
- **背景効果**: アニメーションやパララックス効果
- **時間別背景**: 時刻に応じた自動背景変更
- **気分連動**: AIパートナーの気分に応じた背景提案