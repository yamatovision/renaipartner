# リファクタリング計画: オンボーディングプロセス簡素化 [2025-01-12]

## 1. 現状分析

### 1.1 対象概要
恋AIパートナーアプリのオンボーディングプロセス。ユーザーが初回ログイン後、パートナーを作成するための10ステップの設定フロー。現在は各ステップごとにAPIを呼び出し、進捗をデータベースに保存している。

### 1.2 問題点と課題
- **過剰なAPI通信**: 各ステップごとに`updateProgress` APIを呼び出し（最大10回）
- **複雑なエンドポイント構成**: 8つものエンドポイントが存在
- **データベースへの頻繁な書き込み**: 毎ステップごとにDB更新で負荷が高い
- **二重の状態管理**: フロントエンドとバックエンドで同じデータを重複管理
- **エラー処理の複雑化**: 各ステップでエラーが発生する可能性があり、復旧が困難
- **不要なテーブル**: `onboarding_progress`テーブルは一時的なデータ保存にのみ使用

### 1.3 関連ファイル一覧
**バックエンド**
- backend/src/features/onboarding/onboarding.routes.ts
- backend/src/features/onboarding/onboarding.controller.ts
- backend/src/features/onboarding/onboarding.service.ts
- backend/src/features/onboarding/onboarding.validator.ts
- backend/src/db/models/OnboardingProgress.model.ts
- backend/src/types/index.ts

**フロントエンド**
- frontend/app/onboarding/page.tsx
- frontend/app/onboarding/components/Step*.tsx (10ファイル)
- frontend/src/services/api/onboarding.api.ts
- frontend/src/types/index.ts

### 1.4 依存関係図
```
フロントエンド
  └─ onboarding/page.tsx
       ├─ Step1-10コンポーネント
       └─ onboardingService (API呼び出し)
            └─ バックエンドAPI
                 ├─ onboarding.routes.ts
                 ├─ onboarding.controller.ts
                 └─ onboarding.service.ts
                      └─ OnboardingProgressモデル (DB)
```

## 2. リファクタリングの目標

### 2.1 期待される成果
- **API呼び出し削減**: 10回以上 → 2回（プリセット取得と最終保存のみ）
- **コード削減**: バックエンドコード約70%削減（エンドポイント8→2）
- **DB負荷軽減**: テーブル削除によりDB書き込み10回→1回
- **エラー処理の単純化**: ネットワークエラーのリスクを最小化
- **保守性向上**: シンプルな設計により理解・修正が容易に

### 2.2 維持すべき機能
- 10ステップのオンボーディングフロー
- 性格診断によるプリセット推薦機能
- ユーザー情報とパートナー情報の収集
- 最終的なパートナー作成機能

## 3. 理想的な実装

### 3.1 全体アーキテクチャ
```
フロントエンド（ローカル状態管理）
  └─ onboarding/page.tsx
       ├─ Step1-10コンポーネント（状態はpropsで渡す）
       └─ API呼び出し（2回のみ）
            ├─ GET /api/onboarding/presets （プリセット取得）
            └─ POST /api/partners/create-with-user （一括作成）
```

### 3.2 核心的な改善ポイント
1. **状態管理の一元化**: フロントエンドのローカルステートのみで管理
2. **API統合**: 最終保存時にユーザー情報更新とパートナー作成を一括実行
3. **DB設計の簡素化**: `onboarding_progress`テーブルを完全削除
4. **エンドポイント削減**: 8つ→2つに削減

### 3.3 新しいディレクトリ構造
```
backend/src/features/
├─ onboarding/          # 削除予定
├─ partners/
│   ├─ partners.service.ts      # createWithUserメソッド追加
│   └─ partners.controller.ts   # 新エンドポイント追加
└─ presets/             # 新規作成
    ├─ presets.routes.ts
    ├─ presets.controller.ts
    └─ presets.service.ts
```

## 4. 実装計画

### フェーズ1: フロントエンド状態管理の簡素化
- **目標**: API呼び出しを削除し、ローカル状態管理に移行
- **影響範囲**: frontend/app/onboarding/page.tsx, frontend/src/services/api/onboarding.api.ts
- **タスク**:
  1. **T1.1**: onboarding/page.tsxからAPI呼び出しを削除
     - 対象: frontend/app/onboarding/page.tsx:86-210, 213-279
     - 実装: loadProgress, nextStep内のAPI呼び出しをコメントアウト
  2. **T1.2**: ローカル状態管理の強化
     - 対象: frontend/app/onboarding/page.tsx:54-79
     - 実装: onboardingDataステートですべてを管理
- **検証ポイント**:
  - オンボーディングフローが正常に動作すること
  - ステップ間の遷移がスムーズであること

### フェーズ2: バックエンドAPI簡素化
- **目標**: 新しい一括作成エンドポイントを実装
- **影響範囲**: backend/src/features/partners/
- **タスク**:
  1. **T2.1**: partners.service.tsに`createWithUser`メソッド追加
     - 対象: backend/src/features/partners/partners.service.ts
     - 実装: ユーザー情報更新とパートナー作成を一括実行
  2. **T2.2**: 新エンドポイント`POST /api/partners/create-with-user`追加
     - 対象: backend/src/features/partners/partners.routes.ts
     - 実装: 認証必須、バリデーション付き
  3. **T2.3**: プリセット用の新サービス作成
     - 対象: backend/src/features/presets/ (新規)
     - 実装: 性格プリセットと質問を返すシンプルなAPI
- **検証ポイント**:
  - 新APIが正常に動作すること
  - ユーザー情報とパートナーが同時に作成されること

### フェーズ3: フロントエンド統合
- **目標**: 新APIを使用するように変更
- **影響範囲**: frontend/app/onboarding/page.tsx, frontend/src/services/api/
- **タスク**:
  1. **T3.1**: createPartner関数を新APIに接続
     - 対象: frontend/app/onboarding/page.tsx:356-418
     - 実装: partnersService.createWithUserを呼び出し
  2. **T3.2**: API定義の更新
     - 対象: frontend/src/types/index.ts, backend/src/types/index.ts
     - 実装: 新エンドポイントの型定義追加
- **検証ポイント**:
  - オンボーディング完了時にパートナーが作成されること
  - エラーハンドリングが適切に動作すること

### フェーズ4: クリーンアップ
- **目標**: 不要なコードとテーブルを削除
- **影響範囲**: backend全体
- **タスク**:
  1. **T4.1**: onboarding関連ファイルの削除
     - 対象: backend/src/features/onboarding/
     - 実装: ディレクトリごと削除
  2. **T4.2**: OnboardingProgressモデルの削除
     - 対象: backend/src/db/models/OnboardingProgress.model.ts
     - 実装: ファイル削除とインデックスから除外
  3. **T4.3**: データベースマイグレーション
     - 対象: データベース
     - 実装: onboarding_progressテーブルをDROP
  4. **T4.4**: 型定義のクリーンアップ
     - 対象: frontend/src/types/index.ts, backend/src/types/index.ts
     - 実装: OnboardingProgress関連の型を削除
- **検証ポイント**:
  - アプリケーション全体が正常に動作すること
  - 型エラーが発生しないこと

## 5. 期待される効果

### 5.1 コード削減
- バックエンドコード: 約600行削減（70%削減）
- API定義: 約100行削減
- 合計: 約700行削減

### 5.2 保守性向上
- エンドポイント数: 8→2（75%削減）
- 状態管理: 二重管理→フロントエンドのみ
- デバッグ: シンプルな構造により問題特定が容易

### 5.3 拡張性改善
- 新しいステップの追加が容易（フロントエンドのみの変更）
- プリセットの追加・変更が独立して可能
- パートナー作成ロジックの拡張が容易

## 6. リスクと対策

### 6.1 潜在的リスク
- **進捗の永続化なし**: ブラウザリロードで進捗が失われる
- **既存データの移行**: onboarding_progressテーブルに既存データがある場合
- **エラー時の復旧**: 最終保存時のエラーで全データが失われる可能性

### 6.2 対策
- **LocalStorage活用**: 重要なデータは一時的にLocalStorageに保存
- **段階的移行**: 新規ユーザーから順次新フローに移行
- **リトライ機能**: 最終保存時のエラーでリトライ可能にする
- **バックアップ**: 削除前にonboarding_progressテーブルをバックアップ

## 7. 備考
- マイグレーションは慎重に実施（既存ユーザーへの影響を確認）
- フロントエンドのテストを充実させる（E2Eテスト推奨）
- 性能改善の効果測定を実施（API呼び出し回数、レスポンスタイム）