# デバッグ分析レポート

## エラー概要
1. **400 Bad Request**: GET http://localhost:8080/api/partners/current
2. **リダイレクト問題**: 管理者アカウントでログイン時に `/home` へリダイレクトされる

## 依存関係マップ

### 1. ログインフロー
```
login/page.tsx (L79) 
  → AuthContext.tsx (L50-83) login()
    → authService.login()
    → ユーザーロールチェック (L75-79)
      - admin → /admin/users ✗ (実際は/homeへ)
      - user → /home ✓
```

### 2. ホームページフロー
```
home/page.tsx (L46)
  → loadPartnerAndMessages() (L49-76)
    → partnersService.getPartner() (L54)
      → GET /api/partners/current ✗ (400エラー)
```

## 根本原因分析

### 問題1: パートナー取得エラー (400 Bad Request)
- **エンドポイント**: `/api/partners/current` が存在しない
- **実際のルート**: `/api/partners/` (partners.routes.ts L14)
- **API定義の不一致**: types/index.tsで`/api/partners/current`と定義されているが、バックエンドに該当ルートなし

### 問題2: 管理者リダイレクト
- **原因**: 管理者がログイン後も `/home` にリダイレクトされている
- **期待**: 管理者は `/admin/users` へリダイレクトされるべき
- **推測**: AuthContext内でリダイレクト処理が上書きされている可能性

## 実施した修正

### 1. APIパスの修正 ✅
- **フロントエンド**: `frontend/src/types/index.ts` L780
  - 変更前: `GET: '/api/partners/current'`
  - 変更後: `GET: '/api/partners'`
- **バックエンド**: `backend/src/types/index.ts` L779
  - 同様の修正を実施

### 2. デバッグログの追加 ✅
- **AuthContext.tsx** (L59-64, L75-88)
  - APIレスポンスのユーザー情報確認ログ
  - リダイレクト処理の詳細ログ

## 修正後の動作確認事項
1. パートナー取得API（GET /api/partners）が正常に動作すること
2. 管理者アカウントでログイン時に正しく `/admin/users` へリダイレクトされること
3. 一般ユーザーでログイン時に `/home` へリダイレクトされること

## ログ出力で確認すべき内容
- `[AuthContext] API レスポンス:` - user.roleが正しく設定されているか
- `[AuthContext] ログイン成功:` - isAdminが正しく判定されているか
- `[AuthContext] 管理者としてリダイレクト:` - 管理者の場合に出力されるか