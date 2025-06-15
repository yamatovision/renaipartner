# デバッグロードマップ 2025-06-15

## 発生している2つの問題

### 問題1: Leonardo AI APIフィルター問題
**症状**: 画像生成時にLeonardo AIがコンテンツフィルターに引っかかる
```
error: "Our filter indicates that your prompt may include inappropriate references to children or younger persons, and has been blocked."
```

### 問題2: 場所と背景マッピング問題  
**症状**: フロントエンドでuseLocationBackgroundフックがエラーを出す
```
場所 pool に対応する背景が見つかりません
場所 gym に対応する背景が見つかりません
場所 restaurant に対応する背景が見つかりません
```

## 依存関係マップ

### Leonardo AI問題の依存関係
```
chat.controller.ts (エンドポイント)
  → images.service.ts (画像生成サービス)
    → buildLocationAwareChatPrompt() (プロンプト構築)
    → clothing-prompts.ts (服装プロンプト)
    → callLeonardoAPI() (API呼び出し)
```

### 背景マッピング問題の依存関係
```
useLocationBackground.ts (エラー発生箇所)
  → LocationContext.tsx (場所コンテキスト)
    → locations.api.ts → locations.controller.ts → locations.service.ts
  → useBackground.ts (背景管理フック)
    → BackgroundContext
  
location-background-map.ts (バックエンド側マッピング定義)
```

## 調査・修正ロードマップ

### フェーズ1: 問題の詳細調査
- [ ] Leonardo APIに送信されているプロンプトの実際の内容を確認
- [ ] フロントエンドとバックエンドの背景マッピングの不整合を確認

### フェーズ2: Leonardo AI問題の原因特定
- [ ] 親密度による表現部分のチェック（images.service.ts:273-277）
- [ ] 服装プロンプトの内容確認
- [ ] 問題となっている単語・表現の特定

### フェーズ3: 背景マッピング問題の原因特定
- [ ] useLocationBackground.tsのマッピングロジック確認
- [ ] location-background-map.tsとの整合性確認
- [ ] API連携フローの確認

### フェーズ4: 修正実装
- [ ] Leonardo AI向けプロンプトの安全な表現への修正
- [ ] フロントエンド・バックエンド間のマッピング統一
- [ ] エラーハンドリングの改善

### フェーズ5: デバッグログの設置と検証
- [ ] 修正後の動作確認
- [ ] エラー再発防止のためのログ設置