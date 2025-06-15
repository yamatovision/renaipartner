# Leonardo AI API 400 Bad Request エラー調査レポート

## エラー概要
- **発生箇所**: `/backend/src/features/images/images.service.ts:280` - callLeonardoAPI メソッド
- **エラー内容**: Leonardo AI API呼び出しで 400 Bad Request
- **問題のプロンプト**: `"anime style undefined, happy mood"`

## 根本原因
`chat.controller.ts` の `generateImage` メソッドで、画像生成リクエストに `prompt` プロパティが設定されていなかったため、`undefined` が含まれたプロンプトが生成されていた。

## 関連ファイルと依存関係マップ

```
chat.controller.ts (generateImage)
    ↓ リクエスト
images.service.ts (generateChatImage)
    ↓ プロンプト構築
    ├── buildLocationAwareChatPrompt
    │   ├── clothing-prompts.ts (getClothingPrompt)
    │   └── location-background-map.ts (場所情報)
    └── callLeonardoAPI
        ↓ API呼び出し
        Leonardo AI API
```

## 修正内容

### 1. chat.controller.ts (行246-253)
```typescript
// 修正前
const generatedImage = await this.imagesService.generateChatImage({
  partnerId,
  context: message || context || '愛してるよ💕',
  emotion,
  background: situation,
  useReference
});

// 修正後
const generatedImage = await this.imagesService.generateChatImage({
  partnerId,
  prompt: message || context || '愛してるよ💕', // promptプロパティを追加
  context: message || context || '愛してるよ💕',
  emotion,
  background: situation,
  useReference
});
```

### 2. images.service.ts (行180-183)
```typescript
// 修正前
private async buildLocationAwareChatPrompt(request: ImageGenerationRequest, partner: Partner): Promise<string> {
  let prompt = `anime style ${request.prompt}`;

// 修正後
private async buildLocationAwareChatPrompt(request: ImageGenerationRequest, partner: Partner): Promise<string> {
  const basePrompt = request.prompt || 'character portrait';
  let prompt = `anime style ${basePrompt}`;
```

### 3. images.service.ts (行138-140)
```typescript
// 修正前
private async buildAvatarPrompt(request: ImageGenerationRequest, partner: Partner | null): Promise<string> {
  let prompt = request.prompt || '';

// 修正後
private async buildAvatarPrompt(request: ImageGenerationRequest, partner: Partner | null): Promise<string> {
  let prompt = request.prompt || 'character portrait';
```

## デバッグログ設置箇所

1. **リクエスト受信時**: chat.controller.ts
   - リクエストパラメータの詳細ログ

2. **プロンプト生成時**: images.service.ts
   - 生成されたプロンプトの内容確認

3. **API呼び出し前**: images.service.ts
   - Leonardo AI APIに送信するパラメータの確認

## テスト手順

1. 画像生成エンドポイントにリクエストを送信
2. ログで以下を確認:
   - `prompt` プロパティが正しく設定されているか
   - 生成されたプロンプトに `undefined` が含まれていないか
   - Leonardo AI APIへのリクエストが正常に処理されるか

## 今後の改善点

1. **入力検証の強化**: リクエストパラメータの必須項目チェック
2. **エラーレスポンスの詳細化**: Leonardo AI APIからの詳細なエラー内容の取得と記録
3. **フォールバック処理の改善**: API失敗時の代替処理の実装