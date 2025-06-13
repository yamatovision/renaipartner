# パートナー編集リンク修正ドキュメント

## 問題の概要
設定ページのメニューから「パートナー編集」をクリックすると、`/edit-partner`ページではなく`/home`ページにリダイレクトされる。

## 原因
1. `UserLayout`コンポーネントのパートナー編集リンクが`/edit-partner`となっており、パートナーIDパラメータが含まれていなかった
2. `/edit-partner`ページの`EditPartnerContent`コンポーネントは、URLパラメータ`id`からパートナーIDを取得する設計
3. IDパラメータがない場合、35-37行目の処理により`/home`にリダイレクトされる
4. パートナー情報の非同期読み込みのタイミング問題により、リンククリック時にパートナーIDがまだ利用できない可能性

```typescript
// frontend/app/edit-partner/page.tsx の35-37行目
if (!partnerId) {
  router.push('/home')
  return
}
```

## 修正内容

### 1. UserLayoutコンポーネントの修正
`frontend/src/layouts/UserLayout.tsx`の132行目を修正：

**修正前：**
```typescript
<Link href="/edit-partner" ...>
```

**修正後：**
```typescript
<Link href={partner ? `/edit-partner?id=${partner.id}` : '/edit-partner'} ...>
```

### 2. デバッグログの追加
問題特定のため、パートナー情報取得処理にログを追加：

```typescript
const loadPartner = async () => {
  try {
    const response = await partnersService.list()
    console.log('[UserLayout] パートナー一覧取得:', response)
    if (response.success && response.data && response.data.length > 0) {
      setPartner(response.data[0])
      console.log('[UserLayout] パートナー設定:', response.data[0])
    }
  } catch (error) {
    console.error('パートナー情報の取得に失敗しました:', error)
  } finally {
    setLoadingPartner(false)
  }
}
```

## 確認事項
1. ブラウザのコンソールで`[UserLayout] パートナー一覧取得:`のログを確認し、パートナー情報が正しく取得されているか確認
2. パートナーIDが正しくURLパラメータに含まれているか確認
3. `/edit-partner?id=xxx`の形式でアクセスできるか確認

### 3. 設定ページにパートナー編集セクションを追加
`frontend/app/settings/page.tsx`に以下を追加：

1. パートナー情報の取得処理：
```typescript
// パートナー情報を取得
try {
  const partnerResponse = await partnersService.list()
  console.log('[Settings] パートナー一覧取得:', partnerResponse)
  if (partnerResponse.success && partnerResponse.data && partnerResponse.data.length > 0) {
    setPartner(partnerResponse.data[0])
    console.log('[Settings] パートナー設定:', partnerResponse.data[0])
  }
} catch (error) {
  console.error('[Settings] パートナー情報取得エラー:', error)
}
```

2. パートナー編集セクション：
```typescript
<section className="mb-8 pb-8 border-b border-gray-200">
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    <span className="material-icons mr-2 text-blue-500">💑</span>
    パートナー設定
  </h2>
  <div className="flex items-center justify-between py-4">
    <div className="flex-1">
      <div className="font-medium text-gray-800 mb-1">パートナー編集</div>
      <div className="text-sm text-gray-600">
        {partner ? `${partner.name}の性格や見た目を編集できます` : 'パートナー情報を読み込み中...'}
      </div>
    </div>
    <button
      onClick={() => {
        if (partner) {
          console.log('[Settings] パートナー編集ボタンクリック:', partner)
          router.push(`/edit-partner?id=${partner.id}`)
        }
      }}
      disabled={!partner}
      className={`px-6 py-3 rounded-lg border transition-colors flex items-center ${
        partner 
          ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' 
          : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
      }`}
    >
      <span className="material-icons mr-2">✏️</span>
      編集
    </button>
  </div>
</section>
```

## 今後の改善案
- パートナーが複数存在する場合の選択機能を実装
- パートナーが存在しない場合の適切なエラーハンドリング
- パートナー編集ページへの直接アクセス時の処理改善
- パートナー情報の読み込み状態を全体で共有するためのコンテキスト実装