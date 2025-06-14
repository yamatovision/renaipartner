# AI主導エンゲージメント機能 実装ドキュメント

## 概要
AI主導エンゲージメント機能は、AIパートナーが主体的にユーザーとの関係を深める機能です。
実装日: 2025-01-14
テスト成功率: 100% (17/17テスト)

## 実装された機能

### 1. 質問タイミング判定 (API 5.6)
**エンドポイント**: `GET /api/chat/should-ask-question`

AIが質問をすべきタイミングを判定します：
- 親密度に基づく判定
- 沈黙時間の考慮
- 時間帯制限（深夜は控える）
- 24時間以上の沈黙で強制質問モード

### 2. 戦略的質問生成 (API 5.5)
**エンドポイント**: `POST /api/chat/proactive-question`

親密度に応じた適切な質問を生成：
- **低親密度（0-30）**: 基本的な趣味・好みの質問
- **中親密度（31-60）**: 日常生活・感情の質問
- **高親密度（61-100）**: 深い価値観・将来の質問

### 3. 質問回答からのメモリ抽出 (API 6.6)
**エンドポイント**: `POST /api/memory/extract-from-response`

ユーザーの回答から重要な情報を自動抽出：
- 感情分析（emotionalWeight: -10～10）
- 重要度判定（importance: 1～10）
- タグ自動生成
- 親密度の動的更新

## 技術的な改善点

### 1. Emotional Weight の拡張
データベース制約を修正し、ネガティブな感情も表現可能に：
```sql
-- 変更前: 1～10（ポジティブのみ）
-- 変更後: -10～10（ネガティブ～ポジティブ）
ALTER TABLE memories 
ADD CONSTRAINT memories_emotional_weight_check 
CHECK (emotional_weight >= -10 AND emotional_weight <= 10);
```

感情スケール：
- **-10**: 非常にネガティブ（深い悲しみ、強い不安）
- **-5**: ネガティブ（不安、心配）
- **0**: 中立
- **5**: ポジティブ（嬉しい、楽しい）
- **10**: 非常にポジティブ（大きな喜び、深い愛情）

### 2. RelationshipMetrics の自動作成
メトリクスが存在しない場合の自動作成処理を追加し、テストの安定性を向上。

## 使用技術
- **OpenAI GPT-4 Turbo**: Function Calling による構造化データ抽出
- **PostgreSQL**: JSONB型でのメタデータ管理
- **TypeScript**: 型安全な実装

## 統合テスト結果
```
✅ API 5.6 - 質問タイミング判定テスト (4/4)
✅ API 5.5 - 戦略的質問生成テスト (4/4)
✅ API 6.6 - QA情報抽出・更新テスト (4/4)
✅ エンドツーエンドフロー (2/2)
✅ エラーハンドリング・セキュリティ (3/3)

合計: 17/17テスト成功 (100%)
```

## 今後の拡張可能性
1. 質問の多様性向上（季節・イベント連動）
2. マルチモーダル質問（画像を含む質問）
3. 質問頻度の学習・最適化
4. グループ会話での質問生成

## 関連ファイル
- `/backend/src/features/chat/chat.service.ts` - チャットサービス
- `/backend/src/features/chat/chat.controller.ts` - APIエンドポイント
- `/backend/src/features/memory/memory.service.ts` - メモリ管理
- `/backend/migrations/update_emotional_weight_constraint.sql` - DB制約更新
- `/backend/tests/integration/proactive-engagement/` - 統合テスト