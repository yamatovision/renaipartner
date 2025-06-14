import { ClothingStyle, Gender, Season, SeasonalClothingMapping, ClothingPromptRequest, ClothingPromptResponse } from '../../types';

/**
 * 季節対応服装プロンプト生成サービス
 * 計画: ext-background-location-integration-2025-01-14.mdに基づく実装
 */
export class ClothingPromptsService {
  
  /**
   * 服装プロンプト生成のメインメソッド
   */
  static getPrompt(request: ClothingPromptRequest): ClothingPromptResponse {
    const { clothingStyle, gender, season } = request;
    const currentSeason = season || this.getCurrentSeason();
    
    // 季節対応が必要な服装タイプかチェック
    if (this.isSeasonalClothing(clothingStyle)) {
      const seasonalPrompt = this.getSeasonalPrompt(clothingStyle, gender, currentSeason);
      return {
        prompt: seasonalPrompt,
        season: currentSeason,
        isSeasonallyAdjusted: true
      };
    }
    
    // 通常の服装プロンプト
    const basicPrompt = this.getBasicClothingPrompt(clothingStyle, gender);
    return {
      prompt: basicPrompt,
      season: currentSeason,
      isSeasonallyAdjusted: false
    };
  }

  /**
   * 現在の季節を取得
   */
  private static getCurrentSeason(): Season {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * 季節対応が必要な服装タイプかチェック
   */
  private static isSeasonalClothing(clothingStyle: ClothingStyle): boolean {
    return ['casual_date', 'casual_outdoor'].includes(clothingStyle);
  }

  /**
   * 季節対応服装プロンプト生成
   */
  private static getSeasonalPrompt(clothingStyle: ClothingStyle, gender: Gender, season: Season): string {
    if (clothingStyle === 'casual_date') {
      return this.getSeasonalCasualDate(gender, season);
    }
    
    if (clothingStyle === 'casual_outdoor') {
      return this.getSeasonalCasualOutdoor(gender, season);
    }
    
    // フォールバック
    return this.getBasicClothingPrompt(clothingStyle, gender);
  }

  /**
   * カジュアルデート服装（季節対応）
   */
  private static getSeasonalCasualDate(gender: Gender, season: Season): string {
    const prompts: SeasonalClothingMapping = {
      male: {
        spring: 'soft knit sweater, chino pants, casual leather shoes, light cardigan, fresh spring colors',
        summer: 'short sleeve polo shirt, lightweight chino pants, canvas sneakers, summer casual style',
        autumn: 'soft knit sweater, chino pants, casual leather shoes, autumn colors, cozy atmosphere',
        winter: 'thick wool sweater, dark chino pants, warm boots, winter coat, cozy winter style'
      },
      female: {
        spring: 'soft pastel sweater, midi flare skirt, comfortable flats, light spring jacket, cherry blossom colors',
        summer: 'sleeveless blouse, summer skirt, comfortable sandals, light and airy summer style',
        autumn: 'soft knit sweater, midi skirt, comfortable flats, autumn colors, warm and cozy',
        winter: 'thick cozy sweater, warm skirt or pants, winter boots, winter coat, warm winter style'
      }
    };
    
    const genderKey = gender === 'boyfriend' ? 'male' : 'female';
    return prompts[genderKey][season];
  }

  /**
   * カジュアルアウトドア服装（季節対応）
   */
  private static getSeasonalCasualOutdoor(gender: Gender, season: Season): string {
    const prompts: SeasonalClothingMapping = {
      male: {
        spring: 'outdoor jacket, cargo pants, hiking boots, spring outdoor gear, comfortable and practical',
        summer: 'quick-dry t-shirt, outdoor shorts, trail running shoes, summer outdoor style',
        autumn: 'fleece jacket, outdoor pants, hiking boots, autumn outdoor gear, warm and functional',
        winter: 'down jacket, thermal pants, winter hiking boots, cold weather gear, warm outdoor style'
      },
      female: {
        spring: 'active wear top, outdoor leggings, comfortable sneakers, spring outdoor style',
        summer: 'moisture-wicking tank top, outdoor shorts, sport shoes, summer active style',
        autumn: 'fleece jacket, active leggings, comfortable sneakers, autumn outdoor style',
        winter: 'insulated jacket, thermal leggings, warm outdoor boots, winter active gear'
      }
    };
    
    const genderKey = gender === 'boyfriend' ? 'male' : 'female';
    return prompts[genderKey][season];
  }

  /**
   * 基本的な服装プロンプト（季節非対応）
   */
  private static getBasicClothingPrompt(clothingStyle: ClothingStyle, gender: Gender): string {
    const genderKey = gender === 'boyfriend' ? 'male' : 'female';
    
    const clothingPrompts: Record<ClothingStyle, { male: string; female: string }> = {
      casual: {
        male: 'casual t-shirt, jeans, sneakers, relaxed comfortable style',
        female: 'casual blouse, comfortable pants, sneakers, relaxed everyday style'
      },
      formal: {
        male: 'dress shirt, suit jacket, dress pants, leather shoes, professional formal style',
        female: 'formal blouse, business skirt or pants, professional heels, elegant business style'
      },
      sporty: {
        male: 'athletic wear, sports shorts, running shoes, sporty active style',
        female: 'athletic top, sports leggings, running shoes, sporty active style'
      },
      elegant: {
        male: 'elegant shirt, dress pants, leather shoes, sophisticated style',
        female: 'elegant dress, high heels, sophisticated jewelry, refined elegant style'
      },
      school_uniform: {
        male: 'school uniform, dress shirt, tie, school blazer, student style',
        female: 'school uniform, blouse, skirt, school blazer, cute student style'
      },
      swimsuit: {
        male: 'swim trunks, beach style, summer swimwear',
        female: 'stylish swimsuit, beach style, summer swimwear'
      },
      yukata: {
        male: 'traditional yukata, geta sandals, Japanese summer festival style',
        female: 'beautiful yukata, traditional obi, geta sandals, Japanese summer festival style'
      },
      kimono: {
        male: 'formal kimono, traditional Japanese formal wear',
        female: 'elegant kimono, beautiful obi, traditional Japanese formal wear'
      },
      loungewear: {
        male: 'comfortable loungewear, relaxed home clothes, cozy style',
        female: 'comfortable loungewear, relaxed home clothes, cozy cute style'
      },
      yoga_wear: {
        male: 'yoga pants, fitted tank top, barefoot, yoga practice style',
        female: 'yoga leggings, sports bra, barefoot, yoga practice style'
      },
      devil_costume: {
        male: 'devil costume, horns, dark colors, Halloween style',
        female: 'cute devil costume, horns, tail, playful Halloween style'
      },
      santa_costume: {
        male: 'Santa costume, red and white, Christmas holiday style',
        female: 'cute Santa costume, red and white, Christmas holiday style'
      },
      pajamas: {
        male: 'comfortable pajamas, bedtime clothes, relaxed sleep style',
        female: 'cute pajamas, comfortable sleepwear, cozy bedtime style'
      },
      spring_dress: {
        male: 'light spring jacket, casual pants, spring casual style',
        female: 'beautiful spring dress, light colors, spring fashion style'
      },
      winter_dress: {
        male: 'warm winter jacket, thick pants, winter casual style',
        female: 'winter dress, warm tights, winter fashion style'
      },
      autumn_coat: {
        male: 'autumn coat, warm layers, fall fashion style',
        female: 'stylish autumn coat, fall fashion, cozy autumn style'
      },
      competition_swimsuit: {
        male: 'competition swim trunks, athletic swimwear, competitive style',
        female: 'competition swimsuit, athletic swimwear, competitive style'
      },
      premium_swimsuit: {
        male: 'premium swim trunks, high-end swimwear, luxury beach style',
        female: 'premium swimsuit, luxury swimwear, high-end beach style'
      },
      towel_wrap: {
        male: 'towel wrapped around waist, post-shower style',
        female: 'towel wrap, post-bath style, spa-like atmosphere'
      },
      casual_date: {
        male: 'casual date outfit, comfortable and stylish, date night style',
        female: 'casual date outfit, cute and comfortable, date night style'
      },
      casual_outdoor: {
        male: 'outdoor casual wear, practical and comfortable, outdoor style',
        female: 'outdoor casual wear, practical and cute, outdoor style'
      },
      casual_yukata: {
        male: 'casual yukata, relaxed Japanese summer style',
        female: 'casual yukata, cute Japanese summer style'
      },
      office_suit: {
        male: 'business suit, tie, professional office style',
        female: 'office suit, professional blouse, business professional style'
      },
      ski_wear: {
        male: 'ski jacket, ski pants, winter sports gear, mountain style',
        female: 'ski jacket, ski pants, winter sports gear, cute mountain style'
      }
    };

    return clothingPrompts[clothingStyle]?.[genderKey] || 'casual comfortable clothing';
  }

  /**
   * 季節と場所に基づく服装推奨システム
   */
  static getRecommendedClothing(locationId: string, season?: Season, gender?: Gender): ClothingStyle {
    const currentSeason = season || this.getCurrentSeason();
    
    // ジムの場合、性別によって服装を変える
    if (locationId === 'gym' && gender === 'girlfriend') {
      return 'yoga_wear';
    }
    
    // 場所に基づく基本的な服装マッピング
    const locationClothingMap: Record<string, ClothingStyle> = {
      'school_classroom': 'school_uniform',
      'cafe': 'casual_date',
      'beach': 'swimsuit',
      'office': 'office_suit',
      'home_living': 'loungewear',
      'bedroom': 'pajamas',
      'park': 'casual_outdoor',
      'museum': 'casual',
      'amusement_park': 'casual',
      'gym': 'sporty',
      'restaurant': 'elegant',
      'karaoke': 'casual',
      'sports_bar': 'casual',
      'spa': 'loungewear',
      'jewelry_shop': 'elegant',
      'camping': 'casual_outdoor',
      'jazz_bar': 'formal',
      'night_view': 'elegant',
      'onsen': 'towel_wrap',
      'luxury_hotel': 'elegant',
      'ski_resort': 'ski_wear',
      'private_beach_sunset': 'premium_swimsuit',
      'bedroom_night': 'pajamas'
    };

    // 季節イベント用の特別な服装
    const seasonalEventClothing: Record<string, ClothingStyle> = {
      'cherry_blossoms': 'spring_dress',
      'fireworks_festival': 'yukata',
      'summer_festival': 'casual_yukata',
      'beach_house': 'swimsuit',
      'autumn_leaves': 'autumn_coat',
      'christmas_illumination': 'winter_dress',
      'christmas_party': 'santa_costume',
      'halloween_party': 'devil_costume',
      'new_year_shrine': 'kimono',
      'valentine_date': 'elegant',
      'ski_resort': 'ski_wear'
    };

    // 季節イベントの場所かチェック
    if (seasonalEventClothing[locationId]) {
      return seasonalEventClothing[locationId];
    }

    // 通常の場所の場合
    return locationClothingMap[locationId] || 'casual';
  }

  /**
   * 場所と時間帯に基づく背景要素を取得
   */
  static getLocationBackgroundElements(locationId: string, timeOfDay: string = 'afternoon'): string {
    const locationBackgrounds: Record<string, Record<string, string>> = {
      'cafe': {
        morning: 'cozy morning cafe, warm lighting, coffee steam, peaceful atmosphere',
        afternoon: 'bustling afternoon cafe, natural lighting, social atmosphere',
        evening: 'romantic evening cafe, dim lighting, intimate atmosphere'
      },
      'beach': {
        morning: 'sunrise beach, golden light, peaceful waves, morning breeze',
        afternoon: 'sunny beach, blue sky, white sand, tropical atmosphere',
        evening: 'sunset beach, romantic lighting, golden hour, peaceful waves'
      },
      'park': {
        morning: 'fresh morning park, dew on grass, bird songs, peaceful nature',
        afternoon: 'sunny park, green trees, blue sky, outdoor activities',
        evening: 'evening park, soft lighting, romantic atmosphere, twilight'
      }
    };

    const timeBackgrounds = locationBackgrounds[locationId];
    if (timeBackgrounds) {
      return timeBackgrounds[timeOfDay] || timeBackgrounds['afternoon'];
    }

    // デフォルトの背景要素
    return `${locationId} setting, natural lighting, atmospheric background`;
  }
}

export default ClothingPromptsService;