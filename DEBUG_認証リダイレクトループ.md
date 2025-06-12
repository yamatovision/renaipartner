# 認証リダイレクトループ デバッグドキュメント

## 問題概要
- **症状**: 本番環境でログインページから進めない（リダイレクトループ）
- **ローカル環境**: 正常動作
- **本番環境**: ログインページでスタック

## エラーログ分析

### ローカル環境のログ
```
page.tsx:14 Root page - checking auth: {token: true, isAuthenticated: true}
page.tsx:17 Root page - redirecting to /home
AuthContext.tsx:40 [AUTH DEBUG] Token found, checking validity...
AuthContext.tsx:46 [AUTH DEBUG] Token payload: {exp: 1749723821, now: 1749724005, expired: true}
AuthContext.tsx:49 [AUTH DEBUG] Token expired locally, clearing storage
page.tsx:14 Root page - checking auth: {token: false, isAuthenticated: false}
page.tsx:20 Root page - redirecting to /login
```

### 本番環境のログ
```
page-14fb1f63e6c089cc.js:1 Root page - checking auth: Object
page-14fb1f63e6c089cc.js:1 Root page - redirecting to /login
```

## 認証フロー依存関係

### フロントエンド
1. `app/page.tsx` → localStorage確認 → リダイレクト判定
2. `AuthContext.tsx` → 認証状態管理、トークン検証
3. `login/page.tsx` → ログインUI
4. `auth.api.ts` → API通信、トークン管理

### バックエンド
1. `auth.routes.ts` → 認証エンドポイント定義
2. `auth.controller.ts` → リクエスト/レスポンス処理
3. `auth.service.ts` → JWT生成・検証
4. `auth.middleware.ts` → 認証保護

## 修正内容

### 1. ClientOnlyコンポーネントの削除
- `app/layout.tsx`から`ClientOnly`コンポーネントを削除
- `AuthProvider`が常にレンダリングされるように修正

### 2. app/page.tsxの修正
- localStorageの直接チェックから`useAuth`フックを使用した認証チェックに変更
- loading状態を考慮したリダイレクト処理に改善

### 3. 完了した作業
- [x] ClientOnlyコンポーネントを削除
- [x] app/page.tsxをuseAuthフック使用に修正
- [x] フロントエンドのビルド実行
- [x] Firebase Hostingへのデプロイ完了

### 4. デプロイ結果
- デプロイ先URL: https://renaipartner.web.app
- デプロイ完了時刻: 2025-06-12T03:28:00

### 5. 確認事項
- [ ] 本番環境でリダイレクトループが解消されたか確認
- [ ] ログイン機能が正常に動作するか確認

## 根本原因の特定

### 問題の核心
**ClientOnlyコンポーネントがSSR時にAuthProviderをレンダリングしないため、本番環境で認証状態が正しく初期化されない**

### 詳細な分析
1. **app/layout.tsx**で`ClientOnly`コンポーネントが`AuthProvider`をラップしている
2. 本番環境（Firebase Hosting）では、SSR時に`ClientOnly`が`children`をレンダリングしない
3. その結果、`AuthProvider`が初期化されず、`app/page.tsx`のリダイレクト処理が正しく動作しない
4. ローカル環境では、開発サーバーの挙動により問題が顕在化しない

### 環境変数の問題
- CORS設定の不一致（本番: `https://renaipartner-webapp.web.app`, 開発: `http://localhost:3000`）
- これも修正が必要だが、現在のリダイレクトループの直接的な原因ではない