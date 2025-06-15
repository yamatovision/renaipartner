# 場所-背景マッピング整合性チェックリスト 2025-06-15

## 問題の概要
フロントエンドとバックエンドの場所-背景マッピングに不整合があり、「背景が見つかりません」というエラーが発生している。

## 実際に存在する背景画像（backgrounds-data.tsより）

### 通常の場所
- [x] school_classroom: school_classroom_morning, school_classroom_afternoon
- [x] cafe: cafe_morning, cafe_afternoon, cafe_evening
- [x] beach: beach_morning, beach_afternoon, beach_sunset
- [x] office: office_morning, office_afternoon, office_evening
- [x] school_library: school_library_afternoon, school_library_evening
- [x] park: park_morning, park_afternoon, park_evening
- [x] museum: museum_afternoon, museum_evening
- [x] amusement_park: amusement_park_afternoon, amusement_park_evening
- [x] pool: pool_afternoon
- [x] gym: gym_morning, gym_afternoon
- [x] restaurant: restaurant_evening, restaurant_night
- [x] karaoke: karaoke_evening
- [x] spa: spa_afternoon, spa_evening
- [x] jewelry_shop: jewelry_shop_afternoon
- [x] camping: camping_afternoon, camping_evening, camping_night
- [x] jazz_bar: jazz_bar_night
- [x] sports_bar: sports_bar_evening
- [x] home_living: home_living_afternoon, home_living_evening
- [x] night_view: night_view_night
- [x] private_beach_sunset: private_beach_sunset
- [x] bedroom_night: bedroom_night
- [x] onsen: onsen_evening, onsen_night
- [x] luxury_hotel: luxury_hotel_evening, luxury_hotel_night

### 季節イベント
- [x] cherry_blossoms: cherry_blossoms_afternoon
- [x] fireworks_festival: fireworks_festival_night
- [x] summer_festival: summer_festival_evening, summer_festival_night
- [x] beach_house: beach_house_afternoon
- [x] autumn_leaves: autumn_leaves_afternoon
- [x] halloween_party: halloween_party_night
- [x] christmas_illumination: christmas_illumination_evening, christmas_illumination_night
- [x] christmas_party: christmas_party_night
- [x] new_year_shrine: new_year_shrine_morning, new_year_shrine_afternoon
- [x] valentine_date: valentine_date_evening
- [x] ski_resort: ski_resort_morning, ski_resort_afternoon

## フロントエンドで存在しない場所ID
- [ ] hot_yoga - 背景画像なし
- [ ] cooking_class - 背景画像なし
- [ ] rooftop - 背景画像なし
- [ ] library - 背景画像なし
- [ ] school_classroom_morning - 場所IDとして誤って追加（これは背景ID）

## 修正内容

### 1. フロントエンド（useLocationBackground.ts）の修正
- ✅ 存在しない場所IDを削除（hot_yoga, cooking_class, rooftop, library, school_classroom_morning）

### 2. バックエンド（locations-data.ts）の修正
- ✅ 背景画像が存在しない場所を削除（library, hot_yoga, cooking_class, rooftop）
- ✅ 背景画像が存在する場所を追加（school_library, museum, amusement_park, gym, restaurant, karaoke, spa, jewelry_shop, camping, jazz_bar, sports_bar, beach_house, ski_resort, luxury_hotel）

### 3. 両方で確認すべき点
- ✅ 場所IDと背景IDの命名規則の統一
- ✅ 時間帯サフィックスの統一（morning, afternoon, evening, night, sunset）

## 修正結果
- フロントエンドとバックエンドの場所IDマッピングが完全に一致
- 背景画像が存在しない場所が削除され、整合性が保たれた
- TypeScriptのビルドエラーなし