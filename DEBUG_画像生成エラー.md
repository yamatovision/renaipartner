# 画像生成エラー デバッグドキュメント

## エラー概要
- **発生場所**: オンボーディングStep7 (外観設定)
- **エラー**: POST /api/images/generate 400 Bad Request - バリデーションエラー
- **原因**: partnerIdのフォーマット不一致

## 依存関係マップ

```
フロントエンド:
1. Step7Appearance.tsx:119 
   - partnerId: 'temp-onboarding' を送信

2. images.api.ts:9-16
   - generateAvatar関数がリクエストを送信

バックエンド:
3. images.routes.ts:10
   - POSTルートでバリデーション実行

4. images.validator.ts:6-12
   - partnerId: z.string().uuid() を要求
   - 'temp-onboarding'はUUID形式ではないため拒否
```

## 実装した解決策

### ✅ オンボーディング専用エンドポイントの作成
1. **バックエンド変更**:
   - `images.validator.ts`: `validateOnboardingImageGeneration`を追加（partnerIdなし）
   - `images.routes.ts`: `/api/images/generate-onboarding`ルートを追加
   - `images.controller.ts`: `generateOnboardingAvatar`メソッドを追加

2. **フロントエンド変更**:
   - `images.api.ts`: `generateOnboardingAvatar`メソッドを追加
   - `Step7Appearance.tsx`: 新しいエンドポイントを使用するよう修正
   - `client.ts`: バリデーションエラーの詳細表示を改善

## テスト方法
1. フロントエンドとバックエンドを再起動
2. オンボーディングのStep7で画像生成をテスト
3. エラーが解消されていることを確認

## 追加修正（2回目）

### 問題
`generateOnboardingAvatar`が`generateAvatarImage`を呼び出すが、このメソッドがpartnerIdを必須としていた

### 修正内容
1. **images.service.ts**:
   - `generateAvatarImage`メソッドをpartnerIdがnullの場合も処理できるように修正
   - オンボーディング時は一貫性スコアを1.0に固定
   - DBに保存せず、一時的なGeneratedImageオブジェクトを返すように変更