# アクセス制御マトリックス

## 1. ユーザーロール定義

| ロールID | ロール名 | 説明 |
|---------|---------|-----|
| ADMIN   | 管理者   | システム全体の管理権限を持つ |
| USER    | 一般ユーザー | 基本的な機能を利用する権限を持つ |

## 2. リソースアクション定義

各リソースに対して以下のアクションを定義:
- C: Create (作成)
- R: Read (読取)
- U: Update (更新)
- D: Delete (削除)

## 3. アクセス制御マトリックス

| リソース | アクション | ADMIN | USER |
|---------|-----------|-------|------|
| **ユーザー管理** |  |  |  |
| ユーザー | C | ✓ | ✗ |
| ユーザー | R | ✓ | ✓* |
| ユーザー | U | ✓ | ✓* |
| ユーザー | D | ✓ | ✗ |
| ユーザー一覧 | R | ✓ | ✗ |
| ユーザー無効化 | U | ✓ | ✗ |
| **パートナー管理** |  |  |  |
| パートナー | C | ✓ | ✓* |
| パートナー | R | ✓ | ✓* |
| パートナー | U | ✓ | ✓* |
| パートナー | D | ✓ | ✓* |
| **チャット・メッセージ** |  |  |  |
| メッセージ送信 | C | ✓ | ✓* |
| メッセージ履歴 | R | ✓ | ✓* |
| 画像生成 | C | ✓ | ✓* |
| **メモリ・関係性** |  |  |  |
| メモリ | R | ✓ | ✓* |
| 関係性情報 | R | ✓ | ✓* |
| **設定** |  |  |  |
| 通知設定 | R | ✓ | ✓* |
| 通知設定 | U | ✓ | ✓* |
| 背景画像 | R | ✓ | ✓ |
| データエクスポート | R | ✓ | ✓* |
| **システム管理** |  |  |  |
| システム統計 | R | ✓ | ✗ |
| システム設定 | R | ✓ | ✗ |
| システム設定 | U | ✓ | ✗ |

凡例:
- ✓: 許可
- ✗: 禁止
- *: 自分自身のリソースのみ

## 4. 特殊条件

### 4.1 ユーザー関連
* ユーザーの閲覧 (R): USERは自分のプロフィールのみ閲覧可能
* ユーザーの更新 (U): USERは自分のプロフィールのみ更新可能（ただしロール変更は不可）
* ユーザー作成 (C): ADMINのみが新規ユーザーを作成可能（招待制）

### 4.2 パートナー関連
* パートナーの全操作: USERは自分が作成したパートナーのみ操作可能
* 1ユーザーにつき1パートナーの制限あり

### 4.3 チャット・メッセージ関連
* メッセージ送信・履歴: USERは自分のパートナーとの会話のみアクセス可能
* 画像生成: USERは自分のパートナーの画像のみ生成可能

### 4.4 データプライバシー
* ADMINであってもユーザーのプライベートな会話内容への直接アクセスは制限
* 統計情報は匿名化されたデータのみ

## 5. 実装ガイドライン

### 5.1 バックエンド実装方式
```typescript
// ミドルウェアとしての権限チェック実装例
export function checkPermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const userId = req.user.userId;
    const resourceId = req.params.id;
    
    // ADMINは基本的に全権限を持つ
    if (userRole === UserRole.ADMIN) {
      return next();
    }
    
    // リソースごとの権限チェック
    switch (resource) {
      case 'user':
        if (action === 'read' || action === 'update') {
          // 自分自身のリソースのみ許可
          if (resourceId === userId) {
            return next();
          }
        }
        break;
        
      case 'partner':
        // パートナーの所有者チェックが必要
        // checkPartnerOwnership(resourceId, userId)
        break;
        
      case 'chat':
        // パートナーの所有者チェックが必要
        break;
    }
    
    return res.status(403).json({ 
      error: '権限がありません',
      code: 'PERMISSION_DENIED'
    });
  };
}

// ルーティングでの使用例
router.get('/users', 
  requireAuth, 
  requireRole(UserRole.ADMIN), 
  userController.listUsers
);

router.put('/users/:id', 
  requireAuth, 
  checkPermission('user', 'update'), 
  userController.updateUser
);

router.post('/partners', 
  requireAuth, 
  checkPermission('partner', 'create'), 
  partnerController.createPartner
);
```

### 5.2 フロントエンド権限制御
```typescript
// カスタムフックでの権限チェック
export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = (resource: string, action: string, resourceId?: string) => {
    if (!user) return false;
    
    // ADMINは全権限
    if (user.role === UserRole.ADMIN) return true;
    
    // リソース別の権限チェック
    switch (resource) {
      case 'user':
        if ((action === 'read' || action === 'update') && resourceId === user.id) {
          return true;
        }
        break;
        
      case 'partner':
      case 'chat':
        // 自分のリソースかチェック
        return true; // 実際の実装では所有者チェックが必要
        
      default:
        return false;
    }
    
    return false;
  };
  
  const isAdmin = () => user?.role === UserRole.ADMIN;
  
  return { hasPermission, isAdmin };
}

// UIコンポーネントでの使用例
function UserProfile({ userId }: { userId: string }) {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('user', 'read', userId)) {
    return <div>アクセス権限がありません</div>;
  }
  
  return (
    <div>
      {/* プロフィール表示 */}
      {hasPermission('user', 'update', userId) && (
        <button>編集</button>
      )}
    </div>
  );
}

// 管理者専用コンポーネント
function AdminDashboard() {
  const { isAdmin } = usePermissions();
  
  if (!isAdmin()) {
    return <Navigate to="/" />;
  }
  
  return <div>管理者ダッシュボード</div>;
}
```

## 6. APIエンドポイント別アクセス制御

| エンドポイント | メソッド | 必要なロール | 追加条件 |
|--------------|---------|------------|---------|
| `/api/auth/login` | POST | なし | - |
| `/api/auth/refresh` | POST | なし | 有効なリフレッシュトークン |
| `/api/auth/logout` | POST | USER/ADMIN | - |
| `/api/auth/change-password` | POST | USER/ADMIN | - |
| `/api/users` | GET | ADMIN | - |
| `/api/users/:id` | GET | USER/ADMIN | USERは自分のみ |
| `/api/users/:id` | PUT | USER/ADMIN | USERは自分のみ |
| `/api/users/:id` | DELETE | ADMIN | - |
| `/api/partners` | POST | USER/ADMIN | 1ユーザー1パートナー制限 |
| `/api/partners/:id` | GET | USER/ADMIN | USERは自分のパートナーのみ |
| `/api/partners/:id` | PUT | USER/ADMIN | USERは自分のパートナーのみ |
| `/api/partners/:id` | DELETE | USER/ADMIN | USERは自分のパートナーのみ |
| `/api/chat/message` | POST | USER/ADMIN | 自分のパートナーのみ |
| `/api/chat/:partnerId/messages` | GET | USER/ADMIN | 自分のパートナーのみ |

## 7. セキュリティ考慮事項

1. **最小権限の原則**: ユーザーには必要最小限の権限のみを付与
2. **リソース所有者の検証**: 全てのリクエストでリソースの所有者を確認
3. **管理者権限の制限**: 管理者でもプライバシーに配慮した制限を設定
4. **監査ログ**: 管理者の操作は全て記録（将来実装）

## 8. 今後の拡張ポイント

* より細かい権限設定（読み取り専用管理者など）
* グループベースのアクセス制御
* APIレート制限の実装
* 一時的な権限付与機能