# GitHub Actions CI/CDセットアップガイド

このガイドでは、GitHub Actionsを使用して自動デプロイを設定する方法を説明します。

## 必要なGitHub Secrets

以下のSecretsをGitHubリポジトリに設定する必要があります。

### 設定方法

1. GitHubリポジトリのページを開きます
2. 「Settings」タブをクリックします
3. 左側のメニューから「Secrets and variables」→「Actions」を選択します
4. 「New repository secret」ボタンをクリックします
5. 以下の各Secretを追加します

### フロントエンド用のSecrets

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `FIREBASE_TOKEN` | Firebaseデプロイ用トークン | `firebase login:ci`コマンドで取得 |
| `NEXT_PUBLIC_API_URL` | バックエンドAPIのURL | `https://renaipartner-backend-235426778039.asia-northeast1.run.app` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase APIキー | Firebase Console → プロジェクト設定 → 全般 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase認証ドメイン | Firebase Console → プロジェクト設定 → 全般 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | FirebaseプロジェクトID | `yamatovision-blue-lamp` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebaseストレージバケット | Firebase Console → プロジェクト設定 → 全般 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FirebaseメッセージングID | Firebase Console → プロジェクト設定 → 全般 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | FirebaseアプリID | Firebase Console → プロジェクト設定 → 全般 |

### バックエンド用のSecrets

| Secret名 | 説明 | 現在の値または取得方法 |
|---------|------|---------------------|
| `GCP_SA_KEY` | Google CloudサービスアカウントのJSONキー | 下記の手順で取得 |
| `DATABASE_URL` | PostgreSQLデータベースURL | Supabaseダッシュボードから取得 |
| `JWT_SECRET` | JWT認証用シークレット | backend/.env.yamlの値を使用 |
| `ADMIN_PASSWORD` | 管理者パスワード | backend/.env.yamlの値を使用 |
| `FIREBASE_PROJECT_ID` | FirebaseプロジェクトID | `yamatovision-blue-lamp` |
| `FIREBASE_CLIENT_EMAIL` | Firebaseサービスアカウントメール | backend/.env.yamlの値を使用 |
| `FIREBASE_PRIVATE_KEY` | Firebaseプライベートキー | backend/.env.yamlの値を使用（改行に注意） |
| `ALLOWED_ORIGINS` | CORS許可オリジン | `https://renaipartner.web.app,http://localhost:3000` |
| `LEONARDO_API_KEY` | Leonardo AI APIキー | backend/.env.yamlの値を使用 |
| `LEONARDO_USER_ID` | Leonardo AIユーザーID | backend/.env.yamlの値を使用 |
| `OPENAI_API_KEY` | OpenAI APIキー | backend/.env.yamlの値を使用 |
| `CLAUDE_API_KEY` | Claude APIキー | backend/.env.yamlの値を使用 |

### Google CloudサービスアカウントJSONキーの取得方法

1. [Google Cloud Console](https://console.cloud.google.com)を開きます
2. プロジェクト「yamatovision-blue-lamp」を選択します
3. 左側メニューから「IAMと管理」→「サービスアカウント」を選択します
4. Cloud Run用のサービスアカウントを選択（または新規作成）します
5. 「キー」タブをクリックします
6. 「キーを追加」→「新しいキーを作成」をクリックします
7. 「JSON」を選択して「作成」をクリックします
8. ダウンロードされたJSONファイルの**全内容**を`GCP_SA_KEY`として設定します

### 重要な注意事項

1. **改行の扱い**: 
   - `FIREBASE_PRIVATE_KEY`は改行文字（`\n`）を含みます。GitHubに設定する際は、実際の改行ではなく`\n`という文字列として設定してください
   - `GCP_SA_KEY`はJSONファイルの内容を**そのまま**貼り付けてください

2. **セキュリティ**:
   - これらのSecretsは機密情報です。絶対に公開しないでください
   - 定期的にキーをローテーションすることを推奨します

3. **Firebase Token取得コマンド**:
   ```bash
   npm install -g firebase-tools
   firebase login:ci
   ```

## ワークフローの動作

### フロントエンドデプロイ（deploy-frontend.yml）

- **トリガー**: 
  - `main`ブランチへのプッシュ（`frontend/`配下の変更時）
  - 手動実行

- **処理内容**:
  1. Node.js 18のセットアップ
  2. 依存関係のインストール
  3. 環境変数ファイルの作成
  4. Next.jsアプリケーションのビルド
  5. Firebase Hostingへのデプロイ

### バックエンドデプロイ（deploy-backend.yml）

- **トリガー**: 
  - `main`ブランチへのプッシュ（`backend/`配下の変更時）
  - 手動実行

- **処理内容**:
  1. Google Cloud SDKのセットアップ
  2. GCP認証
  3. 環境変数ファイルの作成
  4. Cloud Runへのデプロイ
  5. クリーンアップ

## トラブルシューティング

### デプロイが失敗する場合

1. **Secrets設定の確認**:
   - すべての必要なSecretsが設定されているか確認
   - 値に余分なスペースや改行が含まれていないか確認

2. **権限の確認**:
   - GCPサービスアカウントに必要な権限があるか確認
   - Cloud Run Admin、Service Account User権限が必要

3. **ログの確認**:
   - GitHub Actionsの実行ログを確認
   - エラーメッセージから原因を特定

### よくある問題

- **Firebase認証エラー**: `FIREBASE_TOKEN`の有効期限切れ → 再取得が必要
- **GCP認証エラー**: `GCP_SA_KEY`のJSON形式が正しくない → 改行やエスケープに注意
- **ビルドエラー**: 型エラーや依存関係の問題 → ローカルでビルドを確認