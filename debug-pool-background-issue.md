# プール背景エラー調査ロードマップ

## エラー概要
- **症状**: `pool`を選択時に「場所 pool に対応する背景が見つかりません」エラー
- **影響**: ビーチとオフィスは正常に表示される
- **発生箇所**: `useLocationBackground.ts:96`

## 依存関係マップ

```
バックエンド（データ定義）
├── backgrounds-data.ts（背景画像定義）
├── location-background-map.ts（場所→背景マッピング）
└── images.service.ts（背景データ提供）
     ↓ API
フロントエンド（データ利用）
├── BackgroundContext.tsx（背景管理）
├── useBackground.ts（背景フック）
└── useLocationBackground.ts（場所×背景連携）← エラー発生
```

## データフロー

1. バックエンド: `backgrounds-data.ts` → `images.service.ts` → API
2. フロントエンド: API → `BackgroundContext` → `useLocationBackground`
3. 場所変更時: `LocationSelector` → `LocationContext` → `useLocationBackground`

## 発見された問題

### マッピングの不一致
- **バックエンド**: `'pool': ['pool_afternoon']`
- **フロントエンド**: `'pool': 'pool'` を探す → `pool_afternoon`が見つからない

### 他の場所との違い
- beach: `beach_morning`, `beach_afternoon`, `beach_sunset` → `beach`で始まるので見つかる
- office: `office_morning`, `office_afternoon`, `office_evening` → `office`で始まるので見つかる
- pool: `pool_afternoon` のみ → フィルタリングで見つかるはず

## 調査手順

1. ✅ 依存関係の把握
2. ✅ 背景データの実際の取得状況確認
3. ✅ ログ設置による問題箇所の特定
4. ⏳ 修正と検証

## 特定された問題

### 根本原因
バックエンドAPIはlimitパラメータのデフォルトが20に設定されている。`pool_afternoon`は背景データの247行目に定義されているが、APIが20件のみ返しているため、pool背景が含まれていない。

### 解決策
1. フロントエンドからAPIを呼び出す際にlimitパラメータを100に設定
2. デバッグログを追加して実際に取得できるデータを確認