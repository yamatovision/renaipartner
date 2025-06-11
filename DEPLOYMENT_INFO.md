# 恋AIパートナー（AI彼氏女）デプロイメント情報

作成日: 2025/06/11
作成者: 環境変数設定アシスタント

## プロジェクト概要

- **プロジェクト名**: 恋AIパートナー（AI彼氏女）
- **GitHubリポジトリ**: https://github.com/yamatovision/renaipartner
- **目的**: ユーザーが理想のAIパートナーを作成し、感情的なつながりを持てる対話型システム

## 環境変数設定状況

### ✅ 設定完了した外部サービス

1. **OpenAI**
   - APIキー設定済み
   - モデル: gpt-4-turbo-preview

2. **Pinecone（ベクトルDB）**
   - APIキー設定済み
   - 環境: us-east-1
   - インデックス名: ai-partner-memory

3. **Supabase（PostgreSQL）**
   - プロジェクト名: renaipartner
   - 接続URL設定済み（IPv4対応）
   - パスワード: Mikoto@123

4. **Leonardo AI（画像生成）**
   - APIキー設定済み
   - エンドポイント: https://cloud.leonardo.ai/api/rest/v1

5. **Gmail（メール送信）**
   - メールアドレス: shiraishi.tatsuya@mikoto.co.jp
   - アプリパスワード設定済み

### 🔒 セキュリティキー

- JWT認証キー: 自動生成済み
- セッションキー: 自動生成済み

## ディレクトリ構造

```
/Users/tatsuya/Desktop/AI彼氏女/
├── .git/                    # Git設定（フック設定済み）
├── .gitignore              # Git除外設定
├── CLAUDE.md               # プロジェクト指示書
├── backend/
│   ├── .env               # バックエンド環境変数（機密情報含む）
│   ├── src/
│   │   └── types/
│   │       └── index.ts   # 型定義ファイル
│   └── tests/
│       └── test-db-connection.js  # DB接続テスト
├── frontend/
│   ├── .env.development   # フロントエンド開発環境変数
│   ├── .env.production    # フロントエンド本番環境変数
│   └── src/
│       └── types/
│           └── index.ts   # 型定義ファイル（backendと同一）
├── docs/                   # ドキュメント
├── mockups/               # モックアップHTML
└── SillyTavern/          # 既存のAI対話システム（別管理）
```

## Git設定

- **リモートリポジトリ**: https://github.com/yamatovision/renaipartner
- **デフォルトブランチ**: main
- **Gitフック**: コミットメッセージに日時自動追加（[MM-DD HH:MM]形式）
- **.gitignore**: 環境変数ファイル、node_modules、テストフォルダなどを除外

## 次のステップ

### 1. 開発環境のセットアップ
```bash
# バックエンドの依存関係インストール
cd backend
npm install

# フロントエンドの依存関係インストール
cd ../frontend
npm install
```

### 2. データベースのマイグレーション
Supabaseダッシュボードでテーブルを作成するか、マイグレーションスクリプトを実行

### 3. 開発サーバーの起動
```bash
# バックエンド（ポート8080）
cd backend
npm run dev

# フロントエンド（ポート3000）
cd frontend
npm run dev
```

### 4. 本番環境へのデプロイ
- フロントエンドの.env.productionのAPI URLを実際のドメインに更新
- 各種クラウドサービスにデプロイ

## 重要な注意事項

1. **.envファイルは絶対にGitにコミットしない**（.gitignoreで除外済み）
2. 本番環境では新しいセキュリティキーを生成すること
3. データベースのバックアップを定期的に取ること
4. API利用料金に注意（特にOpenAI）

## トラブルシューティング

### データベース接続エラー
- Supabaseのダッシュボードでパスワードをリセット
- IPv4接続URLを使用していることを確認

### 環境変数が読み込まれない
- .envファイルが正しいディレクトリにあることを確認
- dotenvパッケージが正しくインストールされていることを確認

## 連絡先

プロジェクトオーナー: shiraishi.tatsuya@mikoto.co.jp