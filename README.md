# 恋AIパートナー 💝

AIとの新しい関係性を築く、次世代の恋愛シミュレーションアプリケーション

## 概要

恋AIパートナーは、最先端のAI技術を活用して、ユーザー一人ひとりに最適化されたAIパートナーとの深い関係性を構築できるWebアプリケーションです。

## 主な機能

- 👤 **パーソナライズされたAIパートナー**: ユーザーの好みに合わせてカスタマイズ可能
- 💬 **自然な会話**: 感情豊かでコンテキストを理解した対話
- 🧠 **記憶システム**: 過去の会話や関係性を記憶し、より深い絆を構築
- 🎨 **ビジュアルカスタマイズ**: パートナーの見た目を自由に設定
- 🔔 **プロアクティブな交流**: AIからの自発的なメッセージや関心の表現
- 🤖 **AI主導エンゲージメント**: 親密度に応じた戦略的な質問生成機能（2025年1月実装）

## 技術スタック

### フロントエンド
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Material-UI (MUI)

### バックエンド
- Node.js / Express
- TypeScript
- PostgreSQL
- Sequelize ORM
- JWT認証

### AI/ML
- OpenAI GPT-4 Turbo
- OpenAI Embeddings (text-embedding-ada-002)
- Leonardo AI (画像生成)

## セットアップ

### 必要な環境
- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

### インストール手順

1. リポジトリのクローン
```bash
git clone [repository-url]
cd ai-partner
```

2. 依存関係のインストール
```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

3. 環境変数の設定
```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_partner
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
LEONARDO_AI_API_KEY=your-leonardo-api-key

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. データベースの初期化
```bash
cd backend
npm run db:init
```

5. 開発サーバーの起動
```bash
# バックエンド (ポート3001)
cd backend
npm run dev

# フロントエンド (ポート3000)
cd frontend
npm run dev
```

## 主要な更新履歴

### 2025年1月14日
- AI主導エンゲージメント機能の実装完了
- emotional_weight制約の拡張（-10～10の範囲でネガティブ感情も表現可能に）
- 統合テスト17件全て成功（100%）

### 2025年1月11日
- メモリシステムAPI実装完了（MemGPT型階層メモリ）
- 画像生成システム実装（Leonardo AI統合）
- 通知システム・設定管理API実装

## ドキュメント

- [要件定義書](/docs/requirements.md)
- [実装進捗](/docs/SCOPE_PROGRESS.md)
- [AI主導エンゲージメント機能](/docs/AI-ENGAGEMENT-IMPLEMENTATION.md)
- [認証システム設計](/docs/architecture/auth-system-design.md)

## ライセンス

本プロジェクトは株式会社ミコトの社内プロジェクトです。

## 開発チーム

- 開発責任者: 白石達也
- AI技術アドバイザー: AppGenius AI Team