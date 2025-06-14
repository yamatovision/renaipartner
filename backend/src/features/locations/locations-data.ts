import { LocationData, SeasonalEvent, ClothingStyle } from '@/types'

// 通常の場所データ
export const locationsData: LocationData[] = [
  // 低親密度（0-40）
  {
    id: 'school_classroom',
    name: '教室',
    description: '放課後の静かな教室。夕日が窓から差し込んでいる。',
    backgroundImage: '/backgrounds/school_classroom.jpg',
    category: 'school',
    clothing: 'school_uniform' as ClothingStyle,
    unlockIntimacy: 0,
    appealPoint: '青春の1ページを感じる懐かしい空間',
    timeOfDay: 'afternoon'
  },
  {
    id: 'school_classroom_morning',
    name: '教室（朝）',
    description: '朝の爽やかな教室。新しい一日の始まりを感じる。',
    backgroundImage: '/backgrounds/school_classroom_morning.jpg',
    category: 'school',
    clothing: 'school_uniform' as ClothingStyle,
    unlockIntimacy: 0,
    appealPoint: '清々しい朝の雰囲気',
    timeOfDay: 'morning'
  },
  {
    id: 'cafe',
    name: 'カフェ',
    description: 'おしゃれなカフェでゆったりとした時間を過ごす。',
    backgroundImage: '/backgrounds/cafe.jpg',
    category: 'leisure',
    clothing: 'casual_date' as ClothingStyle,
    unlockIntimacy: 10,
    appealPoint: '落ち着いた雰囲気でゆっくり話せる空間',
    timeOfDay: 'afternoon'
  },
  {
    id: 'park',
    name: '公園',
    description: '緑豊かな公園。自然の中でリフレッシュ。',
    backgroundImage: '/backgrounds/park.jpg',
    category: 'outdoor',
    clothing: 'casual_outdoor' as ClothingStyle,
    unlockIntimacy: 20,
    appealPoint: '開放的な雰囲気で心も軽くなる',
    timeOfDay: 'afternoon'
  },
  {
    id: 'library',
    name: '図書館',
    description: '静かな図書館。本に囲まれた知的な空間。',
    backgroundImage: '/backgrounds/library.jpg',
    category: 'study',
    clothing: 'casual' as ClothingStyle,
    unlockIntimacy: 30,
    appealPoint: '二人だけの静かな時間',
    timeOfDay: 'afternoon'
  },

  // 中親密度（40-70）
  {
    id: 'office',
    name: 'オフィス',
    description: 'モダンなオフィス空間。プロフェッショナルな雰囲気。',
    backgroundImage: '/backgrounds/office.jpg',
    category: 'work',
    clothing: 'office_suit' as ClothingStyle,
    unlockIntimacy: 40,
    appealPoint: '大人の魅力を感じる空間',
    timeOfDay: 'afternoon'
  },
  {
    id: 'beach',
    name: 'ビーチ',
    description: '青い海と白い砂浜。夏の開放的な雰囲気。',
    backgroundImage: '/backgrounds/beach.jpg',
    category: 'outdoor',
    clothing: 'swimsuit' as ClothingStyle,
    unlockIntimacy: 50,
    appealPoint: '開放的で特別な夏の思い出',
    timeOfDay: 'afternoon'
  },
  {
    id: 'hot_yoga',
    name: 'ホットヨガスタジオ',
    description: '暖かいスタジオでリラックスヨガ。',
    backgroundImage: '/backgrounds/hot_yoga.jpg',
    category: 'fitness',
    clothing: 'yoga_wear' as ClothingStyle,
    unlockIntimacy: 55,
    appealPoint: '健康的で魅力的な一面',
    timeOfDay: 'morning'
  },
  {
    id: 'pool',
    name: 'プール',
    description: '屋内プール。スポーティーな雰囲気。',
    backgroundImage: '/backgrounds/pool.jpg',
    category: 'fitness',
    clothing: 'competition_swimsuit' as ClothingStyle,
    unlockIntimacy: 60,
    appealPoint: 'アクティブで健康的な魅力',
    timeOfDay: 'afternoon'
  },
  {
    id: 'cooking_class',
    name: '料理教室',
    description: '一緒に料理を楽しむアットホームな空間。',
    backgroundImage: '/backgrounds/cooking_class.jpg',
    category: 'activity',
    clothing: 'casual_apron' as ClothingStyle,
    unlockIntimacy: 65,
    appealPoint: '共同作業で深まる絆',
    timeOfDay: 'afternoon'
  },

  // 高親密度（70-90）
  {
    id: 'home_living',
    name: '自宅リビング',
    description: 'くつろげる自宅のリビング。二人だけの空間。',
    backgroundImage: '/backgrounds/home_living.jpg',
    category: 'home',
    clothing: 'loungewear' as ClothingStyle,
    unlockIntimacy: 70,
    appealPoint: 'リラックスした自然体の魅力',
    timeOfDay: 'evening'
  },
  {
    id: 'night_view',
    name: '夜景スポット',
    description: 'ロマンチックな夜景を見下ろす特別な場所。',
    backgroundImage: '/backgrounds/night_view.jpg',
    category: 'date',
    clothing: 'elegant_dress' as ClothingStyle,
    unlockIntimacy: 75,
    appealPoint: 'ロマンチックで特別な夜',
    timeOfDay: 'night'
  },
  {
    id: 'rooftop',
    name: '屋上',
    description: '星空の下、二人だけの秘密の場所。',
    backgroundImage: '/backgrounds/rooftop.jpg',
    category: 'outdoor',
    clothing: 'casual_date' as ClothingStyle,
    unlockIntimacy: 80,
    appealPoint: '特別な二人だけの時間',
    timeOfDay: 'night'
  },

  // 超高親密度（85-100）
  {
    id: 'bedroom_night',
    name: 'ベッドルーム（夜）',
    description: '落ち着いた雰囲気のベッドルーム。',
    backgroundImage: '/backgrounds/bedroom_night.jpg',
    category: 'home',
    clothing: 'pajamas' as ClothingStyle,
    unlockIntimacy: 85,
    appealPoint: '親密で特別な時間',
    timeOfDay: 'night'
  },
  {
    id: 'private_beach_sunset',
    name: 'プライベートビーチ（夕暮れ）',
    description: '二人だけのプライベートビーチ。夕日が美しい。',
    backgroundImage: '/backgrounds/private_beach_sunset.jpg',
    category: 'outdoor',
    clothing: 'premium_swimsuit' as ClothingStyle,
    unlockIntimacy: 90,
    appealPoint: '最高にロマンチックな瞬間',
    timeOfDay: 'evening'
  },
  {
    id: 'onsen',
    name: '温泉',
    description: '静かな温泉旅館。心も体もリラックス。',
    backgroundImage: '/backgrounds/onsen.jpg',
    category: 'travel',
    clothing: 'towel_wrap' as ClothingStyle,
    unlockIntimacy: 95,
    appealPoint: '究極のリラックス空間',
    timeOfDay: 'evening'
  }
]

// 季節イベントデータ
export const seasonalEventsData: SeasonalEvent[] = [
  // 春のイベント
  {
    id: 'cherry_blossoms',
    name: '桜並木',
    description: '満開の桜の下で特別な時間を。',
    backgroundImage: '/backgrounds/cherry_blossoms.jpg',
    category: 'seasonal',
    clothing: 'spring_dress' as ClothingStyle,
    unlockIntimacy: 30,
    appealPoint: '期間限定の美しい春の風景',
    timeOfDay: 'afternoon',
    isSeasonalEvent: true,
    season: 'spring',
    availablePeriod: {
      start: '03-20',
      end: '04-15'
    }
  },

  // 夏のイベント
  {
    id: 'fireworks_festival',
    name: '花火大会',
    description: '夏の夜空を彩る花火を二人で。',
    backgroundImage: '/backgrounds/fireworks_festival.jpg',
    category: 'seasonal',
    clothing: 'yukata' as ClothingStyle,
    unlockIntimacy: 40,
    appealPoint: '夏の特別な思い出',
    timeOfDay: 'night',
    isSeasonalEvent: true,
    season: 'summer',
    availablePeriod: {
      start: '07-15',
      end: '08-31'
    }
  },
  {
    id: 'summer_festival',
    name: '夏祭り',
    description: '賑やかな夏祭り。屋台や浴衣が似合う。',
    backgroundImage: '/backgrounds/summer_festival.jpg',
    category: 'seasonal',
    clothing: 'casual_yukata' as ClothingStyle,
    unlockIntimacy: 35,
    appealPoint: '日本の夏を満喫',
    timeOfDay: 'evening',
    isSeasonalEvent: true,
    season: 'summer',
    availablePeriod: {
      start: '07-01',
      end: '08-31'
    }
  },

  // 秋のイベント
  {
    id: 'halloween_party',
    name: 'ハロウィンパーティー',
    description: '楽しいハロウィンパーティー。仮装で盛り上がる。',
    backgroundImage: '/backgrounds/halloween_party.jpg',
    category: 'seasonal',
    clothing: 'devil_costume' as ClothingStyle,
    unlockIntimacy: 50,
    appealPoint: '特別な仮装で新しい一面',
    timeOfDay: 'night',
    isSeasonalEvent: true,
    season: 'autumn',
    availablePeriod: {
      start: '10-20',
      end: '10-31'
    }
  },
  {
    id: 'autumn_leaves',
    name: '紅葉狩り',
    description: '美しい紅葉に囲まれて秋を満喫。',
    backgroundImage: '/backgrounds/autumn_leaves.jpg',
    category: 'seasonal',
    clothing: 'autumn_coat' as ClothingStyle,
    unlockIntimacy: 45,
    appealPoint: '秋の美しい景色',
    timeOfDay: 'afternoon',
    isSeasonalEvent: true,
    season: 'autumn',
    availablePeriod: {
      start: '11-01',
      end: '11-30'
    }
  },

  // 冬のイベント
  {
    id: 'christmas_illumination',
    name: 'クリスマスイルミネーション',
    description: 'きらめくイルミネーションの中で。',
    backgroundImage: '/backgrounds/christmas_illumination.jpg',
    category: 'seasonal',
    clothing: 'winter_dress' as ClothingStyle,
    unlockIntimacy: 55,
    appealPoint: 'ロマンチックな冬の夜',
    timeOfDay: 'night',
    isSeasonalEvent: true,
    season: 'winter',
    availablePeriod: {
      start: '12-01',
      end: '12-25'
    }
  },
  {
    id: 'christmas_party',
    name: 'クリスマスパーティー',
    description: '特別なクリスマスパーティー。',
    backgroundImage: '/backgrounds/christmas_party.jpg',
    category: 'seasonal',
    clothing: 'santa_costume' as ClothingStyle,
    unlockIntimacy: 60,
    appealPoint: '聖なる夜の特別な時間',
    timeOfDay: 'night',
    isSeasonalEvent: true,
    season: 'winter',
    availablePeriod: {
      start: '12-20',
      end: '12-25'
    }
  },
  {
    id: 'new_year_shrine',
    name: '初詣',
    description: '新年の願いを込めて神社へ。',
    backgroundImage: '/backgrounds/new_year_shrine.jpg',
    category: 'seasonal',
    clothing: 'kimono' as ClothingStyle,
    unlockIntimacy: 65,
    appealPoint: '新年の特別な装い',
    timeOfDay: 'morning',
    isSeasonalEvent: true,
    season: 'winter',
    availablePeriod: {
      start: '01-01',
      end: '01-10'
    }
  },
  {
    id: 'valentine_date',
    name: 'バレンタインデート',
    description: '特別なバレンタインデー。',
    backgroundImage: '/backgrounds/valentine_date.jpg',
    category: 'seasonal',
    clothing: 'elegant_dress' as ClothingStyle,
    unlockIntimacy: 70,
    appealPoint: '愛を伝える特別な日',
    timeOfDay: 'evening',
    isSeasonalEvent: true,
    season: 'winter',
    availablePeriod: {
      start: '02-10',
      end: '02-14'
    }
  }
]

// 全ての場所と季節イベントを統合
export const allLocations = [...locationsData, ...seasonalEventsData]