# 背景画像ディレクトリ

このディレクトリには、チャット画面の背景画像を配置します。

## ディレクトリ構造（要件定義準拠）

```
backgrounds/
├── daily/      # 日常系
├── romantic/   # ロマンチック
├── nature/     # 自然
├── urban/      # 都市
├── seasonal/   # 季節限定
└── special/    # 特別な場所
```

## 必要な画像

各カテゴリに以下のような画像を配置してください：

### daily/（日常系）
- cafe.jpg - カフェ
- living-room.jpg - 自宅リビング
- park.jpg - 公園
- library.jpg - 図書館

### romantic/（ロマンチック）
- night-view.jpg - 夜景
- sunset-beach.jpg - 海辺の夕日
- sakura-path.jpg - 桜並木（デフォルト背景）
- illumination.jpg - イルミネーション

### nature/（自然）
- forest.jpg - 森林
- lakeside.jpg - 湖畔
- mountain-top.jpg - 山頂
- flower-field.jpg - 花畑

### urban/（都市）
- station.jpg - 駅前
- shopping-mall.jpg - ショッピングモール
- office-district.jpg - オフィス街
- residential.jpg - 住宅街

### seasonal/（季節限定）
- （将来の拡張用：春夏秋冬の特別な背景）

### special/（特別な場所）
- （将来の拡張用：親密度による特別な場所）

## 画像仕様

- 推奨サイズ: 1920x1080px 以上
- 形式: JPEG
- ファイルサイズ: 500KB以下を推奨（パフォーマンスのため）
- 半透明の白いオーバーレイを前提とした画像（テキストの可読性確保）