# メッセージ配列のIterationエラー解決策

## 問題の概要
2つの致命的なエラーが発生していました：

### エラー1: `prev is not iterable` (258行目)
```javascript
setMessages(prev => [...prev, userMessage])
```
- **原因**: `prev`パラメータが`undefined`の状態でspread演算子を使用
- **症状**: メッセージ送信時にReactのstateが破綻

### エラー2: `messages is not iterable` (294行目) 
```javascript
const totalMessages = [...messages, userMessage, ...(newMessages || [])]
```
- **原因**: `messages`配列が`undefined`の状態でspread演算子を使用
- **症状**: 会話要約作成時にエラー発生

## 解決策

### 1. setState時の安全性チェック強化
```javascript
setMessages(prev => {
  console.log('setMessages内のprev:', prev)
  if (!Array.isArray(prev)) {
    console.error('prev is not an array:', prev)
    return [userMessage]
  }
  return [...prev, userMessage]
})
```

### 2. 初期化時の配列確保
```javascript
if (messagesResponse.success && messagesResponse.data) {
  const fetchedMessages = messagesResponse.data.messages
  console.log('取得したメッセージ:', fetchedMessages)
  setMessages(Array.isArray(fetchedMessages) ? fetchedMessages : [])
} else {
  console.log('メッセージ取得失敗、空配列で初期化')
  setMessages([])
}
```

### 3. スプレッド演算子使用前の配列チェック
```javascript
const currentMessages = Array.isArray(messages) ? messages : []
const totalMessages = [...currentMessages, userMessage, ...(newMessages || [])]
```

## デバッグログ設置
- 各setState操作前後での状態ログ出力
- 配列かどうかの明示的チェック
- エラー発生時の詳細情報収集

## 修正箇所
- `frontend/app/home/page.tsx:258` - メッセージ送信時のsetState
- `frontend/app/home/page.tsx:87-95` - 初期メッセージ取得時の配列確保
- `frontend/app/home/page.tsx:296-300` - AIメッセージ追加時の安全チェック
- `frontend/app/home/page.tsx:371-374` - 画像メッセージ追加時の安全チェック
- `frontend/app/home/page.tsx:307-309` - 要約作成時の配列安全処理

## テスト方法
1. アプリケーションを起動
2. メッセージ送信を試行
3. コンソールログで状態遷移を確認
4. エラー発生時の詳細情報を収集

## 根本原因の推測
- API からのデータ取得が失敗した場合の fallback 処理が不完全
- React の初期レンダリング時に messages が undefined になる競合状態
- 非同期処理のタイミングによる状態の不整合