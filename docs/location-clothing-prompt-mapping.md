# 場所別服装プロンプトマッピング表

## 概要
このドキュメントは、各場所（背景）に対応する服装の具体的なプロンプト記述をまとめたものです。
画像生成時に使用する詳細なプロンプトテンプレートを定義しています。

## 性別による服装の切り替え
各服装プロンプトは`[MALE]`と`[FEMALE]`のバリエーションを持ち、パートナーの性別（Gender）に応じて適切なプロンプトが選択されます。

## 通常場所の服装プロンプト

### 低親密度（0-40）

#### school_classroom / school_classroom_morning - 教室
- **服装タイプ**: `school_uniform`
- **プロンプト**: 
  ```
  [FEMALE]
  wearing neat Japanese school uniform,
  white blouse with sailor collar,
  navy blue pleated skirt,
  school ribbon,
  knee-high socks,
  school loafers
  
  [MALE]
  wearing neat Japanese school uniform,
  white dress shirt,
  dark blazer jacket,
  school tie,
  dark slacks,
  school shoes
  ```

#### cafe - カフェ
- **服装タイプ**: `casual_date`
- **プロンプト**: 
  ```
  [FEMALE]
  wearing casual cute outfit,
  soft pastel sweater,
  midi skirt or jeans,
  comfortable flats or sneakers,
  small crossbody bag,
  minimal jewelry
  
  [MALE]
  wearing casual date outfit,
  knit sweater or shirt,
  chino pants or jeans,
  leather shoes or clean sneakers,
  wristwatch,
  messenger bag
  ```

#### park - 公園
- **服装タイプ**: `casual_outdoor`
- **プロンプト**: 
  ```
  wearing sporty casual outfit,
  comfortable t-shirt or tank top,
  denim shorts or casual pants,
  walking shoes or sneakers,
  sun hat or cap,
  light cardigan
  ```

### 中親密度（40-70）

#### office - オフィス/職場
- **服装タイプ**: `office_suit`
- **プロンプト**: 
  ```
  [FEMALE]
  wearing professional office lady suit,
  fitted blazer and pencil skirt,
  white blouse,
  black pumps,
  professional hairstyle,
  minimal elegant makeup,
  holding documents or tablet
  
  [MALE]
  wearing professional business suit,
  fitted suit jacket and pants,
  crisp white shirt,
  silk tie,
  leather dress shoes,
  neat hairstyle,
  holding briefcase or laptop
  ```

#### beach - ビーチ
- **服装タイプ**: `swimsuit`
- **プロンプト**: 
  ```
  [FEMALE]
  wearing cute bikini swimsuit,
  floral or solid color design,
  beach cover-up or sarong,
  sun hat,
  beach sandals,
  summer accessories
  
  [MALE]
  wearing swim trunks,
  athletic build visible,
  optional tank top,
  sunglasses,
  beach sandals,
  casual beach style
  ```

#### hot_yoga - ホットヨガ
- **服装タイプ**: `yoga_wear`
- **プロンプト**: 
  ```
  wearing form-fitting yoga outfit,
  sports bra or tank top,
  yoga leggings or shorts,
  barefoot,
  hair tied up,
  yoga mat nearby
  ```

#### pool - プール
- **服装タイプ**: `competition_swimsuit`
- **プロンプト**: 
  ```
  wearing athletic one-piece swimsuit,
  sporty design,
  swimming cap,
  goggles around neck,
  athletic build visible,
  poolside setting
  ```

### 高親密度（70-90）

#### home_living - 自宅リビング
- **服装タイプ**: `loungewear`
- **プロンプト**: 
  ```
  wearing comfortable home clothes,
  oversized hoodie or sweater,
  comfy shorts or sweatpants,
  fuzzy socks,
  relaxed hairstyle,
  cozy atmosphere
  ```

#### night_view - 夜景
- **服装タイプ**: `elegant_dress`
- **プロンプト**: 
  ```
  wearing elegant evening dress,
  sophisticated design,
  high heels,
  elegant jewelry,
  styled hair,
  evening makeup
  ```

### 超高親密度（85-100）

#### bedroom_night - ベッドルーム（夜）
- **服装タイプ**: `pajamas`
- **プロンプト**: 
  ```
  wearing cute pajamas,
  silk or cotton material,
  button-up top and shorts/pants,
  barefoot,
  natural relaxed hair,
  intimate lighting
  ```

#### private_beach_sunset - プライベートビーチ（夕暮れ）
- **服装タイプ**: `premium_swimsuit`
- **プロンプト**: 
  ```
  wearing designer swimsuit,
  elegant bikini or one-piece,
  beach jewelry,
  flowing beach wrap,
  sunset lighting on skin,
  romantic atmosphere
  ```

#### onsen - 温泉
- **服装タイプ**: `towel_wrap`
- **プロンプト**: 
  ```
  wearing white bath towel,
  wrapped around body,
  hair pinned up,
  natural no-makeup look,
  steam effect,
  traditional Japanese onsen setting
  ```

## 季節イベントの服装プロンプト

### 春イベント

#### cherry_blossoms - 桜並木
- **服装タイプ**: `spring_dress`
- **プロンプト**: 
  ```
  wearing light spring dress,
  floral pattern,
  light cardigan,
  comfortable walking shoes,
  spring accessories,
  cherry blossom petals in hair
  ```

### 夏イベント

#### fireworks_festival - 花火大会
- **服装タイプ**: `yukata`
- **プロンプト**: 
  ```
  wearing traditional yukata,
  colorful floral pattern,
  obi belt,
  geta sandals,
  hair ornaments,
  holding small purse and fan
  ```

#### summer_festival - 夏祭り
- **服装タイプ**: `casual_yukata`
- **プロンプト**: 
  ```
  wearing casual modern yukata,
  bright summer colors,
  simplified obi,
  comfortable sandals,
  festival accessories,
  holding festival food
  ```

### 秋イベント

#### halloween_party - ハロウィンパーティー
- **服装タイプ**: `devil_costume`
- **プロンプト**: 
  ```
  wearing sexy devil costume,
  red and black color scheme,
  devil horns headband,
  tail accessory,
  thigh-high boots,
  Halloween makeup
  ```

#### autumn_leaves - 紅葉狩り
- **服装タイプ**: `autumn_coat`
- **プロンプト**: 
  ```
  wearing stylish autumn coat,
  warm scarf,
  boots,
  autumn color coordination,
  holding warm drink,
  surrounded by fall foliage
  ```

### 冬イベント

#### christmas_illumination - クリスマスイルミネーション
- **服装タイプ**: `winter_dress`
- **プロンプト**: 
  ```
  wearing elegant winter dress,
  fur-trimmed coat,
  knee-high boots,
  winter accessories,
  sparkly jewelry,
  Christmas lights reflection
  ```

#### christmas_party - クリスマスパーティー
- **服装タイプ**: `santa_costume`
- **プロンプト**: 
  ```
  wearing cute Santa costume,
  red dress with white trim,
  Santa hat,
  black belt,
  Christmas themed accessories,
  festive makeup
  ```

#### new_year_shrine - 初詣
- **服装タイプ**: `kimono`
- **プロンプト**: 
  ```
  wearing formal kimono,
  traditional patterns,
  elaborate obi,
  zori sandals,
  traditional hair ornaments,
  holding omamori charm
  ```

#### valentine_date - バレンタインデート
- **服装タイプ**: `elegant_dress`
- **プロンプト**: 
  ```
  wearing romantic dress,
  red or pink tones,
  elegant heels,
  heart-themed accessories,
  holding chocolate box,
  romantic styling
  ```

## プロンプト生成時の注意事項

1. **親密度による調整**
   - 低親密度: 控えめで清楚な表現
   - 中親密度: 親しみやすく魅力的な表現
   - 高親密度: リラックスした自然な表現
   - 超高親密度: 親密で特別な雰囲気の表現

2. **時間帯の考慮**
   - 朝: 爽やかで清潔感のある印象
   - 昼: 明るく活動的な印象
   - 夕: ロマンチックで柔らかい印象
   - 夜: 大人っぽく落ち着いた印象

3. **季節感の演出**
   - 春: 軽やかで華やかな要素
   - 夏: 涼しげで開放的な要素
   - 秋: 温かみのある落ち着いた要素
   - 冬: 暖かく包まれるような要素

4. **キャラクター性の維持**
   - パートナーの性格に応じた服装の着こなし
   - 一貫性のあるスタイル表現
   - 自然な振る舞いとポーズ