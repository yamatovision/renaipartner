# エラー依存関係マップとログ設置計画

## エラーフロー
```
1. frontend/app/home/page.tsx:257 (HomePage.useEffect)
   ↓
2. frontend/app/home/page.tsx:204 (loadMessages関数)
   ↓
3. frontend/src/services/api/chat.api.ts:60 (getMessages)
   ↓
4. frontend/src/services/api/client.ts:102 (apiClient.get)
   ↓
5. GET http://localhost:8080/api/chat/messages?partnerId=a46e795c-52b1-46fc-996a-0237f2150e7e
   ↓
6. 404エラー: "パートナーが見つかりません"
```

## チェックポイント
1. **パートナーID**: a46e795c-52b1-46fc-996a-0237f2150e7e
2. **APIパス**: /api/chat/messages
3. **エラーメッセージ**: パートナーが見つかりません

## ログ設置箇所
### フロントエンド
- page.tsx:loadMessages関数 - APIコール前後のパートナーID確認
- chat.api.ts:getMessages - リクエストパラメータ確認

### バックエンド（確認必要）
- /api/chat/messages ルート定義
- チャットコントローラーのgetMessages実装
- パートナー検証ロジック

## 修正順序
1. バックエンドのエンドポイント実装確認
2. パートナーIDの整合性確認
3. 実装修正
4. ログの恒久設置