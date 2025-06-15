import { LocationData } from '../../types';

/**
 * 場所-背景マッピングシステム
 * 計画: ext-background-location-integration-2025-01-14.mdに基づく実装
 */

/**
 * 場所IDと対応する背景画像IDのマッピング
 * 時間帯に応じた複数の背景を定義
 */
export const locationBackgroundMap: Record<string, string[]> = {
  // 現在存在する画像（10枚）
  'school_classroom': ['school_classroom_morning', 'school_classroom_afternoon'],
  'cafe': ['cafe_morning', 'cafe_afternoon', 'cafe_evening'],
  'beach': ['beach_morning', 'beach_afternoon', 'beach_sunset'],
  'office': ['office_morning', 'office_afternoon', 'office_evening'],
  
  // 追加された場所
  'school_library': ['school_library_afternoon', 'school_library_evening'],
  'park': ['park_morning', 'park_afternoon', 'park_evening'],
  
  // 追加された場所
  'museum': ['museum_afternoon', 'museum_evening'],
  'amusement_park': ['amusement_park_afternoon', 'amusement_park_evening'],
  'pool': ['pool_afternoon'],
  'gym': ['gym_morning', 'gym_afternoon'],
  'restaurant': ['restaurant_evening', 'restaurant_night'],
  'karaoke': ['karaoke_evening'],
  'spa': ['spa_afternoon', 'spa_evening'],
  'jewelry_shop': ['jewelry_shop_afternoon'],
  'camping': ['camping_afternoon', 'camping_evening', 'camping_night'],
  'jazz_bar': ['jazz_bar_night'],
  'sports_bar': ['sports_bar_evening'],
  'home_living': ['home_living_afternoon', 'home_living_evening'],
  'night_view': ['night_view_night'],
  'private_beach_sunset': ['private_beach_sunset'],
  'bedroom_night': ['bedroom_night'],
  'onsen': ['onsen_evening', 'onsen_night'],
  'luxury_hotel': ['luxury_hotel_evening', 'luxury_hotel_night'],
  
  // 季節イベント
  'cherry_blossoms': ['cherry_blossoms_afternoon'],
  'fireworks_festival': ['fireworks_festival_night'],
  'summer_festival': ['summer_festival_evening', 'summer_festival_night'],
  'beach_house': ['beach_house_afternoon'],
  'autumn_leaves': ['autumn_leaves_afternoon'],
  'halloween_party': ['halloween_party_night'],
  'christmas_illumination': ['christmas_illumination_evening', 'christmas_illumination_night'],
  'christmas_party': ['christmas_party_night'],
  'new_year_shrine': ['new_year_shrine_morning', 'new_year_shrine_afternoon'],
  'valentine_date': ['valentine_date_evening'],
  'ski_resort': ['ski_resort_morning', 'ski_resort_afternoon'],
};

/**
 * 時間帯に基づく背景画像選択の優先度
 */
export interface TimeOfDayMapping {
  hour: number;
  preferredSuffix: string;
  fallbackSuffixes: string[];
}

export const timeOfDayMappings: TimeOfDayMapping[] = [
  { hour: 6, preferredSuffix: 'morning', fallbackSuffixes: ['afternoon', 'evening'] },
  { hour: 7, preferredSuffix: 'morning', fallbackSuffixes: ['afternoon', 'evening'] },
  { hour: 8, preferredSuffix: 'morning', fallbackSuffixes: ['afternoon', 'evening'] },
  { hour: 9, preferredSuffix: 'morning', fallbackSuffixes: ['afternoon', 'evening'] },
  { hour: 10, preferredSuffix: 'morning', fallbackSuffixes: ['afternoon', 'evening'] },
  { hour: 11, preferredSuffix: 'morning', fallbackSuffixes: ['afternoon', 'evening'] },
  { hour: 12, preferredSuffix: 'afternoon', fallbackSuffixes: ['morning', 'evening'] },
  { hour: 13, preferredSuffix: 'afternoon', fallbackSuffixes: ['morning', 'evening'] },
  { hour: 14, preferredSuffix: 'afternoon', fallbackSuffixes: ['morning', 'evening'] },
  { hour: 15, preferredSuffix: 'afternoon', fallbackSuffixes: ['morning', 'evening'] },
  { hour: 16, preferredSuffix: 'afternoon', fallbackSuffixes: ['evening', 'morning'] },
  { hour: 17, preferredSuffix: 'evening', fallbackSuffixes: ['afternoon', 'sunset'] },
  { hour: 18, preferredSuffix: 'evening', fallbackSuffixes: ['sunset', 'afternoon'] },
  { hour: 19, preferredSuffix: 'evening', fallbackSuffixes: ['sunset', 'night'] },
  { hour: 20, preferredSuffix: 'evening', fallbackSuffixes: ['night', 'sunset'] },
  { hour: 21, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 22, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 23, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 0, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 1, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 2, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 3, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 4, preferredSuffix: 'night', fallbackSuffixes: ['evening', 'sunset'] },
  { hour: 5, preferredSuffix: 'night', fallbackSuffixes: ['morning', 'evening'] },
];

/**
 * 場所と背景統合サービス
 */
export class LocationBackgroundService {
  
  /**
   * 場所と時間帯に基づいて最適な背景画像IDを取得
   */
  static getBackgroundForLocation(locationId: string, timeOfDay?: string): string | null {
    const availableBackgrounds = locationBackgroundMap[locationId];
    if (!availableBackgrounds || availableBackgrounds.length === 0) {
      return null;
    }

    // 時間帯が指定されていない場合は現在時刻を使用
    if (!timeOfDay) {
      const currentHour = new Date().getHours();
      timeOfDay = this.getTimeOfDayFromHour(currentHour);
    }

    // 指定された時間帯に最適な背景を検索
    const preferredBackground = availableBackgrounds.find(bg => 
      bg.includes(`_${timeOfDay}`)
    );

    if (preferredBackground) {
      return preferredBackground;
    }

    // フォールバック: 利用可能な最初の背景を返す
    return availableBackgrounds[0];
  }

  /**
   * 現在時刻に基づいて複数の背景候補を取得
   */
  static getBackgroundCandidatesForLocation(locationId: string): string[] {
    return locationBackgroundMap[locationId] || [];
  }

  /**
   * 時間（時）から時間帯文字列を取得
   */
  private static getTimeOfDayFromHour(hour: number): string {
    const mapping = timeOfDayMappings.find(m => m.hour === hour);
    return mapping?.preferredSuffix || 'afternoon';
  }

  /**
   * 時間帯に基づく背景の優先順位を取得
   */
  static getBackgroundPriorityForTime(locationId: string, hour: number): string[] {
    const availableBackgrounds = locationBackgroundMap[locationId];
    if (!availableBackgrounds) {
      return [];
    }

    const timeMapping = timeOfDayMappings.find(m => m.hour === hour);
    if (!timeMapping) {
      return availableBackgrounds;
    }

    const prioritizedBackgrounds: string[] = [];
    
    // 第一優先: preferred suffix
    const preferred = availableBackgrounds.find(bg => 
      bg.includes(`_${timeMapping.preferredSuffix}`)
    );
    if (preferred) {
      prioritizedBackgrounds.push(preferred);
    }

    // フォールバック: fallback suffixes
    timeMapping.fallbackSuffixes.forEach(suffix => {
      const fallback = availableBackgrounds.find(bg => 
        bg.includes(`_${suffix}`) && !prioritizedBackgrounds.includes(bg)
      );
      if (fallback) {
        prioritizedBackgrounds.push(fallback);
      }
    });

    // 残りの背景
    availableBackgrounds.forEach(bg => {
      if (!prioritizedBackgrounds.includes(bg)) {
        prioritizedBackgrounds.push(bg);
      }
    });

    return prioritizedBackgrounds;
  }

  /**
   * 場所変更時の背景自動切り替え
   */
  static suggestBackgroundChange(
    currentLocationId: string, 
    newLocationId: string, 
    currentTime?: Date
  ): {
    shouldChange: boolean;
    suggestedBackground: string | null;
    reason: string;
  } {
    const currentTime_ = currentTime || new Date();
    const hour = currentTime_.getHours();

    const newBackground = this.getBackgroundForLocation(newLocationId);
    
    if (!newBackground) {
      return {
        shouldChange: false,
        suggestedBackground: null,
        reason: '新しい場所に対応する背景が見つかりません'
      };
    }

    // 場所が変わった場合は基本的に背景も変更
    if (currentLocationId !== newLocationId) {
      return {
        shouldChange: true,
        suggestedBackground: newBackground,
        reason: `場所が${currentLocationId}から${newLocationId}に変更されました`
      };
    }

    return {
      shouldChange: false,
      suggestedBackground: null,
      reason: '場所が変更されていません'
    };
  }

  /**
   * 季節イベント背景の自動適用チェック
   */
  static checkSeasonalEventBackground(currentDate?: Date): {
    isSeasonalEvent: boolean;
    eventLocationId: string | null;
    eventName: string | null;
    suggestedBackground: string | null;
  } {
    const now = currentDate || new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();

    // 季節イベントの期間マッピング
    const seasonalEvents = [
      {
        locationId: 'cherry_blossoms',
        name: '桜の季節',
        period: { start: { month: 3, day: 20 }, end: { month: 4, day: 10 } }
      },
      {
        locationId: 'summer_festival',
        name: '夏祭り',
        period: { start: { month: 7, day: 1 }, end: { month: 8, day: 31 } }
      },
      {
        locationId: 'halloween_party',
        name: 'ハロウィン',
        period: { start: { month: 10, day: 25 }, end: { month: 10, day: 31 } }
      },
      {
        locationId: 'christmas_illumination',
        name: 'クリスマス',
        period: { start: { month: 12, day: 1 }, end: { month: 12, day: 25 } }
      },
      {
        locationId: 'new_year_shrine',
        name: '初詣',
        period: { start: { month: 1, day: 1 }, end: { month: 1, day: 7 } }
      }
    ];

    for (const event of seasonalEvents) {
      const { start, end } = event.period;
      
      // 年またぎの処理
      let isInPeriod = false;
      if (start.month <= end.month) {
        // 通常の期間（年またぎなし）
        isInPeriod = (month > start.month || (month === start.month && day >= start.day)) &&
                     (month < end.month || (month === end.month && day <= end.day));
      } else {
        // 年またぎの期間
        isInPeriod = (month > start.month || (month === start.month && day >= start.day)) ||
                     (month < end.month || (month === end.month && day <= end.day));
      }

      if (isInPeriod) {
        return {
          isSeasonalEvent: true,
          eventLocationId: event.locationId,
          eventName: event.name,
          suggestedBackground: this.getBackgroundForLocation(event.locationId)
        };
      }
    }

    return {
      isSeasonalEvent: false,
      eventLocationId: null,
      eventName: null,
      suggestedBackground: null
    };
  }

  /**
   * 場所に利用可能な全ての背景バリエーションを取得
   */
  static getAllBackgroundVariations(locationId: string): {
    morning: string[];
    afternoon: string[];
    evening: string[];
    night: string[];
    sunset: string[];
    other: string[];
  } {
    const backgrounds = locationBackgroundMap[locationId] || [];
    
    return {
      morning: backgrounds.filter(bg => bg.includes('_morning')),
      afternoon: backgrounds.filter(bg => bg.includes('_afternoon')),
      evening: backgrounds.filter(bg => bg.includes('_evening')),
      night: backgrounds.filter(bg => bg.includes('_night')),
      sunset: backgrounds.filter(bg => bg.includes('_sunset')),
      other: backgrounds.filter(bg => 
        !bg.includes('_morning') && 
        !bg.includes('_afternoon') && 
        !bg.includes('_evening') && 
        !bg.includes('_night') && 
        !bg.includes('_sunset')
      )
    };
  }
}

export default LocationBackgroundService;