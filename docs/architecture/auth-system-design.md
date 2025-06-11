# 認証システム設計書

## 1. 概要

このドキュメントでは恋AIパートナーの認証システムの詳細設計を定義します。

## 2. 認証メカニズム

### 2.1 選定方式
* JWT（JSON Web Token）ベースの認証
* リフレッシュトークンによるアクセストークン再発行

### 2.2 選定理由
* ステートレス性によるスケーラビリティ確保
* フロントエンド/バックエンド分離アーキテクチャとの親和性
* 複数デバイスからの同時ログインのサポート

## 3. 認証フロー

### 3.1 登録（サインアップ）フロー
**重要**: 本システムは管理者による招待制を採用
```
1. 管理者がユーザー情報を作成
   - email, surname, firstName, birthdayを設定
   - 初期パスワード: "aikakumei"
   - ロール: USER（一般ユーザー）
2. DBに直接挿入または管理画面から作成
3. ユーザーに初期認証情報を伝達
```

### 3.2 ログイン（サインイン）フロー
```
1. ユーザーがemail/passwordを入力
2. バックエンドで認証情報を検証
3. 成功時:
   - アクセストークン（有効期限: 15分）を発行
   - リフレッシュトークン（有効期限: 30日）を発行
   - HttpOnly Cookieに保存
4. 失敗時:
   - エラーメッセージを返却
```

### 3.3 パスワードリセットフロー
```
1. ユーザーがパスワードリセットをリクエスト
2. 登録メールアドレスにリセットリンクを送信
3. リンクから新しいパスワードを設定
4. 完了後、既存のトークンを無効化
```

### 3.4 トークン更新フロー
```
1. アクセストークンの有効期限が切れた場合
2. リフレッシュトークンを使用して新しいアクセストークンを取得
3. リフレッシュトークンも期限切れの場合は再ログインを要求
```

## 4. セキュリティ対策

### 4.1 パスワード管理
* ハッシュアルゴリズム: bcrypt (コスト係数 10)
* パスワードポリシー: 最低8文字（緩め）
* 初期パスワード: "aikakumei"
* パスワード変更の強制: なし

### 4.2 トークン管理
* アクセストークン有効期限: 15分
* リフレッシュトークン有効期限: 30日
* トークン保存: HttpOnly, Secure Cookieでの保存
* 複数デバイスログイン: 許可

### 4.3 保護対策
* CSRF対策: Double Submit Cookie Pattern
* レート制限: なし（要件により不要）
* ブルートフォース対策: なし（要件により不要）
* 2要素認証: なし（要件により不要）

## 5. ユーザーロール定義

### 5.1 ロール一覧
```typescript
export enum UserRole {
  ADMIN = 'admin',  // 管理者
  USER = 'user'     // 一般ユーザー
}
```

### 5.2 初期管理者アカウント
```sql
-- 手動でDBに投入する初期管理者アカウント
INSERT INTO users (
  email, 
  password, 
  surname, 
  firstName, 
  nickname, 
  birthday, 
  role
) VALUES (
  'shiraishi.tatsuya@mikoto.co.jp',
  '$2b$10$...', -- bcryptでハッシュ化した'aikakumei'
  '白石',
  '達也',
  'tatsuya',
  '1990-01-01', -- 適切な誕生日に変更してください
  'admin'
);
```

## 6. コード構造とアーキテクチャガイドライン

### 6.1 認証関連コードの構成
* バックエンド側の認証関連コードは `features/auth/` ディレクトリに集約する
* 単一責任の原則に基づき、以下のファイル構造を維持する:
  - `auth.controller.ts`: リクエスト処理とレスポンス整形
  - `auth.service.ts`: 認証ロジックの中核と業務処理
  - `auth.routes.ts`: エンドポイント定義とミドルウェア適用
  - `auth.middleware.ts`: 認証状態検証と権限チェック機能
  - `auth.validator.ts`: 入力検証ルール

### 6.2 フロントエンド認証管理
* 認証状態は専用のコンテキストで管理: `features/auth/AuthContext.tsx`
* トークン管理とセキュアなストレージ: `features/auth/services/tokenService.ts`
* 認証専用フック: `features/auth/hooks/useAuth.ts`
* 保護されたルート処理: `features/auth/components/ProtectedRoute.tsx`

### 6.3 依存関係と責任分離
* 認証モジュールは他の機能モジュールに依存しない（単方向依存）
* 認証状態の変更は適切なイベントシステムを通じて通知する
* 認証関連のエラー処理は専用のエラーハンドラーで一元管理
* 環境ごとの認証設定は設定ファイルから注入（ハードコード禁止）

## 7. API設計ガイドライン

### 7.1 認証が必要なエンドポイント
* すべての `/api/` エンドポイントは認証が必要（以下を除く）
* 認証不要エンドポイント: 
  - `/api/auth/login`
  - `/api/auth/refresh`

### 7.2 権限チェックが必要なエンドポイント
* `/api/admin/*`: ADMIN ロールのみアクセス可能
* `/api/users/:userId`: 
  - 自身のIDと一致する場合のみ更新可能
  - ADMINは全ユーザーアクセス可能
* `/api/partners/*`: 自身のパートナーのみアクセス可能

### 7.3 認証エラーレスポンスの標準形式
* 401 Unauthorized: `{ "error": "認証が必要です", "code": "AUTH_REQUIRED" }`
* 403 Forbidden: `{ "error": "この操作を実行する権限がありません", "code": "PERMISSION_DENIED" }`

## 8. 実装例

### 8.1 JWTペイロード構造
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;  // issued at
  exp: number;  // expiration
}
```

### 8.2 認証ミドルウェア実装例
```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ 
      error: "認証が必要です", 
      code: "AUTH_REQUIRED" 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: "無効なトークンです", 
      code: "INVALID_TOKEN" 
    });
  }
}
```

### 8.3 ロールベースアクセス制御
```typescript
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: "この操作を実行する権限がありません", 
        code: "PERMISSION_DENIED" 
      });
    }
    next();
  };
}
```

## 9. 環境設定

必要な環境変数:
```env
JWT_SECRET=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d
BCRYPT_ROUNDS=10
```

## 10. 今後の拡張ポイント

* 管理画面の実装（ユーザー一覧、無効化機能）
* パスワードリセット機能の実装
* セッション管理機能の強化
* 監査ログの実装