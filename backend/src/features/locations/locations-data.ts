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
    id: 'school_library',
    name: '学校の図書館',
    description: '静かな図書館。勉強に集中できる環境。',
    backgroundImage: '/backgrounds/school_library.jpg',
    category: 'school',
    clothing: 'school_uniform' as ClothingStyle,
    unlockIntimacy: 5,
    appealPoint: '二人で勉強する静かな時間',
    timeOfDay: 'afternoon'
  },
  {
    id: 'museum',
    name: '美術館',
    description: '静寂に包まれた美術館。芸術に触れる時間。',
    backgroundImage: '/backgrounds/museum.jpg',
    category: 'leisure',
    clothing: 'casual_elegant' as ClothingStyle,
    unlockIntimacy: 30,
    appealPoint: '知的で落ち着いた雰囲気',
    timeOfDay: 'afternoon'
  },
  {
    id: 'amusement_park',
    name: '遊園地',
    description: 'わくわくする遊園地。楽しい思い出をたくさん作ろう。',
    backgroundImage: '/backgrounds/amusement_park.jpg',
    category: 'leisure',
    clothing: 'casual_outdoor' as ClothingStyle,
    unlockIntimacy: 35,
    appealPoint: '笑顔があふれる楽しい空間',
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
    id: 'gym',
    name: 'ジム',
    description: 'トレーニングジム。健康的な汗を流そう。',
    backgroundImage: '/backgrounds/gym.jpg',
    category: 'fitness',
    clothing: 'sportswear' as ClothingStyle,
    unlockIntimacy: 55,
    appealPoint: 'スポーティーで健康的な魅力',
    timeOfDay: 'afternoon'
  },
  {
    id: 'restaurant',
    name: 'レストラン',
    description: '落ち着いた雰囲気のレストラン。美味しい料理を楽しもう。',
    backgroundImage: '/backgrounds/restaurant.jpg',
    category: 'leisure',
    clothing: 'elegant_dress' as ClothingStyle,
    unlockIntimacy: 60,
    appealPoint: 'ロマンチックなディナータイム',
    timeOfDay: 'evening'
  },
  {
    id: 'karaoke',
    name: 'カラオケ',
    description: '二人だけのカラオケボックス。思い切り歌おう！',
    backgroundImage: '/backgrounds/karaoke.jpg',
    category: 'leisure',
    clothing: 'casual' as ClothingStyle,
    unlockIntimacy: 65,
    appealPoint: '楽しく盛り上がれる空間',
    timeOfDay: 'evening'
  },
  {
    id: 'spa',
    name: 'スパ',
    description: 'リラックスできるスパ。心も体も癒される。',
    backgroundImage: '/backgrounds/spa.jpg',
    category: 'leisure',
    clothing: 'bathrobe' as ClothingStyle,
    unlockIntimacy: 60,
    appealPoint: '究極のリラクゼーション',
    timeOfDay: 'afternoon'
  },
  {
    id: 'jewelry_shop',
    name: 'ジュエリーショップ',
    description: 'きらめくジュエリーに囲まれた特別な空間。',
    backgroundImage: '/backgrounds/jewelry_shop.jpg',
    category: 'leisure',
    clothing: 'elegant_dress' as ClothingStyle,
    unlockIntimacy: 70,
    appealPoint: '特別な瞬間を演出',
    timeOfDay: 'afternoon'
  },
  {
    id: 'camping',
    name: 'キャンプ場',
    description: '自然の中でのキャンプ。星空の下で過ごす特別な時間。',
    backgroundImage: '/backgrounds/camping.jpg',
    category: 'outdoor',
    clothing: 'outdoor_gear' as ClothingStyle,
    unlockIntimacy: 70,
    appealPoint: '自然の中での特別な体験',
    timeOfDay: 'evening'
  },
  {
    id: 'jazz_bar',
    name: 'ジャズバー',
    description: '大人の雰囲気漂うジャズバー。素敵な音楽に包まれて。',
    backgroundImage: '/backgrounds/jazz_bar.jpg',
    category: 'leisure',
    clothing: 'elegant_dress' as ClothingStyle,
    unlockIntimacy: 65,
    appealPoint: '大人の雰囲気を楽しむ',
    timeOfDay: 'night'
  },
  {
    id: 'sports_bar',
    name: 'スポーツバー',
    description: 'スポーツ観戦を楽しむバー。盛り上がろう！',
    backgroundImage: '/backgrounds/sports_bar.jpg',
    category: 'leisure',
    clothing: 'casual' as ClothingStyle,
    unlockIntimacy: 40,
    appealPoint: 'カジュアルに楽しめる空間',
    timeOfDay: 'evening'
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
  },
  {
    id: 'luxury_hotel',
    name: '高級ホテル',
    description: '最高級のホテルスイート。特別な夜を過ごす。',
    backgroundImage: '/backgrounds/luxury_hotel.jpg',
    category: 'travel',
    clothing: 'elegant_dress' as ClothingStyle,
    unlockIntimacy: 100,
    appealPoint: '最高にラグジュアリーな空間',
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
  {
    id: 'beach_house',
    name: 'ビーチハウス',
    description: '海辺のビーチハウス。夏の特別な時間を過ごそう。',
    backgroundImage: '/backgrounds/beach_house.jpg',
    category: 'seasonal',
    clothing: 'beach_wear' as ClothingStyle,
    unlockIntimacy: 50,
    appealPoint: '夏限定の開放的な空間',
    timeOfDay: 'afternoon',
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
  },
  {
    id: 'ski_resort',
    name: 'スキー場',
    description: '雪山でのスキー。冬のアクティビティを楽しもう。',
    backgroundImage: '/backgrounds/ski_resort.jpg',
    category: 'seasonal',
    clothing: 'ski_wear' as ClothingStyle,
    unlockIntimacy: 55,
    appealPoint: '冬限定のアクティブな体験',
    timeOfDay: 'afternoon',
    isSeasonalEvent: true,
    season: 'winter',
    availablePeriod: {
      start: '12-15',
      end: '03-15'
    }
  }
]

// 全ての場所と季節イベントを統合
export const allLocations = [...locationsData, ...seasonalEventsData]