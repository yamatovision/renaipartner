# モックから実APIへの完全移行計画書

## 現状分析サマリー

### ✅ 完了済み項目
1. **APIサービス層**: すべて実API使用に移行済み
2. **モックファイル**: 削除済み（services/mock/ディレクトリ）
3. **環境設定**: API接続設定完了（localhost:8080）
4. **バックエンド実装**: 全50エンドポイント実装・テスト済み

### ❌ 未完了項目
1. **API定義の不一致**: 型定義と実装のパスが異なる
2. **ハードコードされたデータ**: 設定ページ、ログインページに残存
3. **JWT検証**: ミドルウェアで未実装
4. **一部のAPI統合**: 設定ページの背景画像など

## Phase 1: API定義の修正（推定時間: 1-2時間）

### 1.1 管理者APIパスの修正
**ファイル**: `frontend/src/types/index.ts`, `backend/src/types/index.ts`

```typescript
// 修正前
ADMIN: {
  BASE: '/api/admin',
  USERS: {
    BASE: '/api/admin/users',
    CREATE: '/api/admin/users/create',  // 削除
    LIST: '/api/admin/users/list',      // 削除
    DEACTIVATE: (id: string) => `/api/admin/users/${id}/deactivate`,
    ACTIVATE: (id: string) => `/api/admin/users/${id}/activate`,
  },
  STATS: '/api/admin/stats',  // 削除または修正
}

// 修正後
ADMIN: {
  BASE: '/api/admin',
  USERS: {
    BASE: '/api/admin/users',
    DEACTIVATE: (id: string) => `/api/users/${id}/deactivate`,  // 修正
    ACTIVATE: (id: string) => `/api/users/${id}/activate`,      // 修正
  },
}
```

### 1.2 統計APIパスの修正
```typescript
// 実際のパスに合わせて修正
USERS: {
  // ...
  STATS: '/api/users/stats',  // 追加
}
```

### 1.3 不要なAPI定義の削除
- `/api/auth/register` - 実装なし、削除
- `/api/data/*` - 実装なし、削除

### 1.4 APIサービスファイルの更新
**影響ファイル**:
- `frontend/src/services/api/admin.api.ts`
- `frontend/src/services/api/auth.api.ts`

## Phase 2: セキュリティリスクの除去（推定時間: 1時間）

### 2.1 テスト認証情報の削除
**ファイル**: `frontend/app/login/page.tsx`

```typescript
// 削除対象：行146-185, 279-287
// テストアカウント情報の表示部分を完全削除
```

### 2.2 サンプルデータの改善
**ファイル**: `frontend/app/admin/users/page.tsx`

```typescript
// 行81-83の修正
const newUser = {
  email: '',  // 空文字に変更
  displayName: '',
  role: 'USER' as const,
}
```

## Phase 3: 設定ページの完全実装（推定時間: 2-3時間）

### 3.1 背景画像APIの実装判断
**オプション1**: 背景画像機能を削除
- 行80-86のハードコードされた背景画像リストを削除
- 関連UIを削除

**オプション2**: 実API実装
- `settingsService.getBackgrounds()`が既に実装済み
- バックエンドの`/api/images/backgrounds`を使用

### 3.2 通知設定のデフォルト値処理
```typescript
// 行64-78の改善
useEffect(() => {
  const loadSettings = async () => {
    try {
      const [userResponse, settingsResponse] = await Promise.all([
        authService.getCurrentUser(),
        settingsService.getSettings()
      ])
      
      if (settingsResponse.success && settingsResponse.data) {
        setUserSettings(settingsResponse.data.userSettings)
        setNotificationSettings(settingsResponse.data.notifications)
      }
      
      // 背景画像はAPIから取得
      const bgResponse = await imagesService.getBackgrounds()
      if (bgResponse.success && bgResponse.data) {
        setBackgroundImages(bgResponse.data)
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }
  
  loadSettings()
}, [])
```

### 3.3 [MOCK]表示の削除
- 行445の`[MOCK]`文字列を削除

## Phase 4: JWT検証の実装（推定時間: 2時間）

### 4.1 ミドルウェアの更新
**ファイル**: `frontend/middleware.ts`

```typescript
import { jwtDecode } from 'jwt-decode'

// JWT検証の実装
try {
  const decoded = jwtDecode<{ exp: number }>(token)
  const isExpired = decoded.exp * 1000 < Date.now()
  
  if (isExpired) {
    // トークンが期限切れの場合の処理
    return NextResponse.redirect(new URL('/login', request.url))
  }
} catch (error) {
  // 無効なトークンの場合
  return NextResponse.redirect(new URL('/login', request.url))
}
```

## Phase 5: コードクリーンアップ（推定時間: 1時間）

### 5.1 コンソールログの整理
```bash
# 開発用ログの確認
rg "console\.(log|warn|error)" --type ts --type tsx frontend/

# 本番用に適切なロギングへ置き換え
```

### 5.2 未使用コードの削除
- 管理者ページの空のuseEffect（行122-124）
- その他のコメントアウトされたコード

## 実装スケジュール

| Phase | タスク | 優先度 | 推定時間 | 依存関係 |
|-------|--------|--------|----------|----------|
| 1 | API定義の修正 | 🔴 高 | 1-2時間 | なし |
| 2 | セキュリティリスクの除去 | 🔴 高 | 1時間 | なし |
| 3 | 設定ページの完全実装 | 🟡 中 | 2-3時間 | Phase 1 |
| 4 | JWT検証の実装 | 🟡 中 | 2時間 | なし |
| 5 | コードクリーンアップ | 🟢 低 | 1時間 | Phase 1-4 |

**合計推定時間**: 7-9時間

## テスト計画

### Phase完了ごとのテスト項目
1. **Phase 1完了後**
   - 管理者機能の動作確認
   - APIエラーがないことを確認

2. **Phase 2完了後**
   - ログインページの表示確認
   - セキュリティ情報が露出していないことを確認

3. **Phase 3完了後**
   - 設定ページの全機能テスト
   - 背景画像の選択・保存

4. **Phase 4完了後**
   - トークン期限切れのテスト
   - 不正なトークンのテスト

5. **Phase 5完了後**
   - 全体的な動作確認
   - パフォーマンステスト

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| API定義変更による既存機能の破壊 | 高 | 段階的な変更と即座のテスト |
| JWT実装によるログイン不能 | 高 | 開発環境での十分なテスト |
| 背景画像API実装の工数超過 | 中 | 機能削除の選択肢を検討 |

## 成功基準
1. すべてのモック関連コードが削除されている
2. すべてのAPIが実バックエンドと正常に通信している
3. セキュリティリスクが除去されている
4. エラーハンドリングが適切に実装されている
5. 本番環境へのデプロイ準備が完了している