// 実際のファイルパスに基づいた背景画像データ
// location-clothing-list-updated-2025-01-14.mdに基づいて定義
import { BackgroundImage } from '@/types';

export const backgroundsData: BackgroundImage[] = [
  // =============================================================================
  // 現在存在する画像ファイル（10枚）
  // =============================================================================
  
  // 教室（親密度: 0）
  {
    id: 'school_classroom_morning',
    name: '教室（朝）',
    url: '/images/backgrounds/public/school_classroom_morning.jpg',
    category: 'public',
    isDefault: true,
    timeOfDay: 'morning',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'school_classroom'
  },
  {
    id: 'school_classroom_afternoon',
    name: '教室（午後）',
    url: '/images/backgrounds/public/school_classroom_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'school_classroom'
  },
  
  // カフェ（親密度: 10）
  {
    id: 'cafe_morning',
    name: 'カフェ（朝）',
    url: '/images/backgrounds/public/cafe_morning.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'cafe'
  },
  {
    id: 'cafe_afternoon',
    name: 'カフェ（午後）',
    url: '/images/backgrounds/public/cafe_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'cafe'
  },
  {
    id: 'cafe_evening',
    name: 'カフェ（夕方）',
    url: '/images/backgrounds/public/cafe_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'cafe'
  },
  
  // ビーチ（親密度: 40）
  {
    id: 'beach_morning',
    name: 'ビーチ（朝）',
    url: '/images/backgrounds/outdoor/beach_morning.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'beach'
  },
  {
    id: 'beach_afternoon',
    name: 'ビーチ（午後）',
    url: '/images/backgrounds/outdoor/beach_afternoon.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'beach'
  },
  {
    id: 'beach_sunset',
    name: 'ビーチ（夕焼け）',
    url: '/images/backgrounds/outdoor/beach_sunset.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'sunset',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'beach'
  },
  
  // オフィス（親密度: 50）
  {
    id: 'office_morning',
    name: 'オフィス（朝）',
    url: '/images/backgrounds/work/office_morning.jpg',
    category: 'work',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'office'
  },
  {
    id: 'office_afternoon',
    name: 'オフィス（午後）',
    url: '/images/backgrounds/work/office_afternoon.jpg',
    category: 'work',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'office'
  },
  {
    id: 'office_evening',
    name: 'オフィス（夜）',
    url: '/images/backgrounds/work/office_evening.jpg',
    category: 'work',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'office'
  },
  
  // 図書館（親密度: 5）
  {
    id: 'school_library_afternoon',
    name: '図書館（午後）',
    url: '/images/backgrounds/public/school_library_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'school_library'
  },
  {
    id: 'school_library_evening',
    name: '図書館（夕方）',
    url: '/images/backgrounds/public/school_library_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'school_library'
  },
  
  // 公園（親密度: 15）
  {
    id: 'park_morning',
    name: '公園（朝）',
    url: '/images/backgrounds/public/park_morning.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'park'
  },
  {
    id: 'park_afternoon',
    name: '公園（午後）',
    url: '/images/backgrounds/public/park_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'park'
  },
  {
    id: 'park_evening',
    name: '公園（夕方）',
    url: '/images/backgrounds/public/park_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'park'
  },
  
  // 美術館（親密度: 30）
  {
    id: 'museum_afternoon',
    name: '美術館（午後）',
    url: '/images/backgrounds/public/museum_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'museum'
  },
  {
    id: 'museum_evening',
    name: '美術館（夕方）',
    url: '/images/backgrounds/public/museum_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'museum'
  },
  
  // 遊園地（親密度: 35）
  {
    id: 'amusement_park_afternoon',
    name: '遊園地（午後）',
    url: '/images/backgrounds/public/amusement_park_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'amusement_park'
  },
  {
    id: 'amusement_park_evening',
    name: '遊園地（夕方）',
    url: '/images/backgrounds/public/amusement_park_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'low',
    locationId: 'amusement_park'
  },
  
  // プール（親密度: 45）
  {
    id: 'pool_afternoon',
    name: 'プール（午後）',
    url: '/images/backgrounds/outdoor/pool_afternoon.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'pool'
  },
  
  // ジム（親密度: 55）
  {
    id: 'gym_morning',
    name: 'ジム（朝）',
    url: '/images/backgrounds/outdoor/gym_morning.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'gym'
  },
  {
    id: 'gym_afternoon',
    name: 'ジム（午後）',
    url: '/images/backgrounds/outdoor/gym_afternoon.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'gym'
  },
  
  // レストラン（親密度: 60）
  {
    id: 'restaurant_evening',
    name: 'レストラン（夕方）',
    url: '/images/backgrounds/public/restaurant_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'restaurant'
  },
  {
    id: 'restaurant_night',
    name: 'レストラン（夜）',
    url: '/images/backgrounds/public/restaurant_night.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'restaurant'
  },
  
  // カラオケ（親密度: 65）
  {
    id: 'karaoke_evening',
    name: 'カラオケ（夕方）',
    url: '/images/backgrounds/public/karaoke_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'karaoke'
  },
  
  // スパ（親密度: 60）
  {
    id: 'spa_afternoon',
    name: 'スパ（午後）',
    url: '/images/backgrounds/public/spa_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'spa'
  },
  {
    id: 'spa_evening',
    name: 'スパ（夕方）',
    url: '/images/backgrounds/public/spa_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'spa'
  },
  
  // ジュエリーショップ（親密度: 70）
  {
    id: 'jewelry_shop_afternoon',
    name: 'ジュエリーショップ（午後）',
    url: '/images/backgrounds/public/jewelry_shop_afternoon.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'jewelry_shop'
  },
  
  // キャンプ場（親密度: 70）
  {
    id: 'camping_afternoon',
    name: 'キャンプ場（午後）',
    url: '/images/backgrounds/outdoor/camping_afternoon.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'camping'
  },
  {
    id: 'camping_evening',
    name: 'キャンプ場（夕方）',
    url: '/images/backgrounds/outdoor/camping_evening.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'camping'
  },
  {
    id: 'camping_night',
    name: 'キャンプ場（夜）',
    url: '/images/backgrounds/outdoor/camping_night.jpg',
    category: 'outdoor',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'camping'
  },
  
  // ジャズバー（親密度: 65）
  {
    id: 'jazz_bar_night',
    name: 'ジャズバー（夜）',
    url: '/images/backgrounds/public/jazz_bar_night.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'jazz_bar'
  },
  
  // スポーツバー（親密度: 40）
  {
    id: 'sports_bar_evening',
    name: 'スポーツバー（夕方）',
    url: '/images/backgrounds/public/sports_bar_evening.jpg',
    category: 'public',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'medium',
    locationId: 'sports_bar'
  },
  
  // 自宅リビング（親密度: 70）
  {
    id: 'home_living_afternoon',
    name: '自宅リビング（午後）',
    url: '/images/backgrounds/private/home_living_afternoon.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'home_living'
  },
  {
    id: 'home_living_evening',
    name: '自宅リビング（夕方）',
    url: '/images/backgrounds/private/home_living_evening.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'home_living'
  },
  
  // 夜景スポット（親密度: 80）
  {
    id: 'night_view_night',
    name: '夜景スポット（夜）',
    url: '/images/backgrounds/private/night_view_night.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'night_view'
  },
  
  // プライベートビーチ（親密度: 90）
  {
    id: 'private_beach_sunset',
    name: 'プライベートビーチ（夕暮れ）',
    url: '/images/backgrounds/private/private_beach_sunset.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'sunset',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'private_beach_sunset'
  },
  
  // ベッドルーム（親密度: 85）
  {
    id: 'bedroom_night',
    name: 'ベッドルーム（夜）',
    url: '/images/backgrounds/private/bedroom_night.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'bedroom_night'
  },
  
  // 温泉（親密度: 95）
  {
    id: 'onsen_evening',
    name: '温泉（夕方）',
    url: '/images/backgrounds/private/onsen_evening.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'onsen'
  },
  {
    id: 'onsen_night',
    name: '温泉（夜）',
    url: '/images/backgrounds/private/onsen_night.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'onsen'
  },
  
  // 高級ホテル（親密度: 100）
  {
    id: 'luxury_hotel_evening',
    name: '高級ホテル（夕方）',
    url: '/images/backgrounds/private/luxury_hotel_evening.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'luxury_hotel'
  },
  {
    id: 'luxury_hotel_night',
    name: '高級ホテル（夜）',
    url: '/images/backgrounds/private/luxury_hotel_night.jpg',
    category: 'private',
    isDefault: false,
    timeOfDay: 'night',
    season: 'all',
    intimacyLevel: 'high',
    locationId: 'luxury_hotel'
  },
  
  // =============================================================================
  // 季節イベント画像
  // =============================================================================
  
  // 桜並木（親密度: 30）
  {
    id: 'cherry_blossoms_afternoon',
    name: '桜並木（午後）',
    url: '/images/backgrounds/seasonal/cherry_blossoms_afternoon.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'spring',
    intimacyLevel: 'low',
    locationId: 'cherry_blossoms'
  },
  
  // 花火大会（親密度: 55）
  {
    id: 'fireworks_festival_night',
    name: '花火大会（夜）',
    url: '/images/backgrounds/seasonal/fireworks_festival_night.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'night',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'fireworks_festival'
  },
  
  // 夏祭り（親密度: 40）
  {
    id: 'summer_festival_evening',
    name: '夏祭り（夕方）',
    url: '/images/backgrounds/seasonal/summer_festival_evening.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'summer_festival'
  },
  {
    id: 'summer_festival_night',
    name: '夏祭り（夜）',
    url: '/images/backgrounds/seasonal/summer_festival_night.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'night',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'summer_festival'
  },
  
  // ビーチハウス（親密度: 50）
  {
    id: 'beach_house_afternoon',
    name: 'ビーチハウス（午後）',
    url: '/images/backgrounds/seasonal/beach_house_afternoon.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'summer',
    intimacyLevel: 'medium',
    locationId: 'beach_house'
  },
  
  // 紅葉狩り（親密度: 35）
  {
    id: 'autumn_leaves_afternoon',
    name: '紅葉狩り（午後）',
    url: '/images/backgrounds/seasonal/autumn_leaves_afternoon.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'autumn',
    intimacyLevel: 'low',
    locationId: 'autumn_leaves'
  },
  
  // ハロウィンパーティー（親密度: 75）
  {
    id: 'halloween_party_night',
    name: 'ハロウィンパーティー（夜）',
    url: '/images/backgrounds/seasonal/halloween_party_night.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'night',
    season: 'autumn',
    intimacyLevel: 'high',
    locationId: 'halloween_party'
  },
  
  // クリスマスイルミネーション（親密度: 60）
  {
    id: 'christmas_illumination_evening',
    name: 'クリスマスイルミネーション（夕方）',
    url: '/images/backgrounds/seasonal/christmas_illumination_evening.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'winter',
    intimacyLevel: 'medium',
    locationId: 'christmas_illumination'
  },
  {
    id: 'christmas_illumination_night',
    name: 'クリスマスイルミネーション（夜）',
    url: '/images/backgrounds/seasonal/christmas_illumination_night.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'night',
    season: 'winter',
    intimacyLevel: 'medium',
    locationId: 'christmas_illumination'
  },
  
  // クリスマスパーティー（親密度: 80）
  {
    id: 'christmas_party_night',
    name: 'クリスマスパーティー（夜）',
    url: '/images/backgrounds/seasonal/christmas_party_night.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'night',
    season: 'winter',
    intimacyLevel: 'high',
    locationId: 'christmas_party'
  },
  
  // 初詣（親密度: 65）
  {
    id: 'new_year_shrine_morning',
    name: '初詣（朝）',
    url: '/images/backgrounds/seasonal/new_year_shrine_morning.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'winter',
    intimacyLevel: 'medium',
    locationId: 'new_year_shrine'
  },
  {
    id: 'new_year_shrine_afternoon',
    name: '初詣（午後）',
    url: '/images/backgrounds/seasonal/new_year_shrine_afternoon.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'winter',
    intimacyLevel: 'medium',
    locationId: 'new_year_shrine'
  },
  
  // バレンタインデート（親密度: 70）
  {
    id: 'valentine_date_evening',
    name: 'バレンタインデート（夕方）',
    url: '/images/backgrounds/seasonal/valentine_date_evening.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'evening',
    season: 'winter',
    intimacyLevel: 'high',
    locationId: 'valentine_date'
  },
  
  // スキー場（親密度: 55）
  {
    id: 'ski_resort_morning',
    name: 'スキー場（朝）',
    url: '/images/backgrounds/seasonal/ski_resort_morning.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'morning',
    season: 'winter',
    intimacyLevel: 'medium',
    locationId: 'ski_resort'
  },
  {
    id: 'ski_resort_afternoon',
    name: 'スキー場（午後）',
    url: '/images/backgrounds/seasonal/ski_resort_afternoon.jpg',
    category: 'seasonal',
    isDefault: false,
    timeOfDay: 'afternoon',
    season: 'winter',
    intimacyLevel: 'medium',
    locationId: 'ski_resort'
  }
];