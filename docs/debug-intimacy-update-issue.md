# 親密度更新問題の調査ログ

## 問題の概要
親密度が更新された際に、ホーム画面（http://localhost:3000/home）が自動的に更新されない。

## 調査結果

### 1. 現在の親密度更新フロー

1. **メッセージ送信時の流れ**:
   - ユーザーがメッセージを送信
   - バックエンドがAIから親密度変化を取得（-10〜+10）
   - レスポンスに新しい親密度が含まれる
   - フロントエンドが`setTimeout`で非同期に`updateIntimacyLevel`を呼び出す

2. **Context更新の仕組み**:
   - `RelationshipMetricsContext`が親密度を管理
   - `updateIntimacyLevel`で楽観的更新を実装（即座にUIを更新）
   - その後APIを呼び出してバックエンドに反映

### 2. 親密度表示箇所

`home/page.tsx`で親密度が表示されている場所：

1. **ヘッダー部分**（712行目）:
   ```tsx
   <span className="hidden sm:inline">親密度 </span>{relationshipMetrics.intimacyLevel}%
   ```

2. **サイドメニュー**（843行目、856行目）:
   ```tsx
   <span className="text-lg font-bold text-purple-600">{relationshipMetrics?.intimacyLevel || 0}%</span>
   ```
   プログレスバー:
   ```tsx
   style={{ width: `${relationshipMetrics?.intimacyLevel || 0}%` }}
   ```

3. **関係性ステータス**（861-864行目、906-909行目）:
   親密度に応じてステータステキストが変化

### 3. 問題の原因

**重要な発見**: 親密度の表示は`relationshipMetrics.intimacyLevel`を参照しているが、`partner.intimacyLevel`を参照している箇所もある

**問題点**:
1. **データソースの不一致**: 
   - 更新時は`partner.intimacyLevel`を基準に判定（398行目）
   - 表示時は`relationshipMetrics.intimacyLevel`を使用（712行目、843行目）

2. **Context更新のタイミング**:
   - `updateIntimacyLevel`は`partner`と`relationshipMetrics`の両方を更新するが、非同期

### 4. 実装した解決策

1. **即時反映の確保** ✅:
   - `home/page.tsx`の`setTimeout`を削除（398-406行目）
   - `updateIntimacyLevel`を同期的に実行するように変更

2. **デバッグログの追加** ✅:
   - `home/page.tsx`に親密度更新検知ログを追加
   - `RelationshipMetricsContext.tsx`に状態更新ログを追加
   - `useEffect`で`relationshipMetrics`の変更を監視

3. **実装済みのコード変更**:
   ```typescript
   // home/page.tsx（変更前）
   setTimeout(() => {
     updateIntimacyLevel(actualData.intimacyLevel)
   }, 0)
   
   // home/page.tsx（変更後）
   console.log('[Home] 親密度更新検知:', {...})
   updateIntimacyLevel(actualData.intimacyLevel)
   ```

### 5. 動作確認方法

1. ブラウザの開発者コンソールを開く
2. メッセージを送信する
3. 以下のログが順番に表示されることを確認：
   - `[Home] 親密度更新検知:`
   - `[RelationshipMetrics] Updating intimacy level:`
   - `[RelationshipMetrics] Partner state updated:`
   - `[RelationshipMetrics] Metrics state updated:`
   - `[Home] relationshipMetrics変更検知:`
   - `[Home] 親密度表示レンダリング:`

4. 画面上の親密度表示が即座に更新されることを確認

### 6. 追加の注意事項

- バックエンドのchat.service.tsも親密度更新ロジックが改善されている（86-100行目）
- 親密度はpartnersテーブルで一元管理されている
- RelationshipMetricsContextは楽観的更新を実装しているため、API失敗時は元の値に戻る