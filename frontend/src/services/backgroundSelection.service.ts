'use client';

import { BackgroundImage } from '@/types';

/**
 * 背景選択サービス
 * 時間帯、親密度、季節を考慮した背景選択ロジックを提供
 */
export class BackgroundSelectionService {
  /**
   * 現在の時間帯を取得
   */
  getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * 現在の季節を取得（北半球前提）
   */
  getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = new Date().getMonth() + 1;
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * 季節イベントを取得
   */
  getSeasonalEvents(): string[] {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const events: string[] = [];

    // 桜シーズン（3月下旬〜4月上旬）
    if ((month === 3 && day >= 20) || (month === 4 && day <= 10)) {
      events.push('cherry_blossoms');
    }

    // ハロウィン（10月）
    if (month === 10) {
      events.push('halloween');
    }

    // クリスマスシーズン（12月）
    if (month === 12) {
      events.push('christmas_illumination');
    }

    // 花火大会（7月〜8月）
    if (month === 7 || month === 8) {
      events.push('fireworks');
    }

    // バレンタイン（2月）
    if (month === 2 && day >= 10 && day <= 14) {
      events.push('valentine');
    }

    return events;
  }

  /**
   * 親密度に基づいてアクセス可能な場所をフィルタリング
   */
  filterByIntimacy(backgrounds: BackgroundImage[], intimacyLevel: number): BackgroundImage[] {
    // 親密度による場所のカテゴリマッピング
    const accessibleCategories: string[] = [];

    if (intimacyLevel >= 0) {
      accessibleCategories.push('public');
    }
    if (intimacyLevel >= 30) {
      accessibleCategories.push('semi_private');
    }
    if (intimacyLevel >= 60) {
      accessibleCategories.push('private');
    }
    if (intimacyLevel >= 85) {
      accessibleCategories.push('special');
    }

    // 季節イベントは親密度に関係なくアクセス可能
    accessibleCategories.push('seasonal');

    return backgrounds.filter(bg => accessibleCategories.includes(bg.category));
  }

  /**
   * 時間帯に基づいて適切な背景バリアントを選択
   */
  getTimeBasedVariant(locationId: string, availableBackgrounds: BackgroundImage[]): BackgroundImage | null {
    const timeOfDay = this.getTimeOfDay();
    
    // 時間帯付きの背景を探す
    const timeVariant = availableBackgrounds.find(
      bg => bg.id === `${locationId}_${timeOfDay}`
    );
    
    if (timeVariant) return timeVariant;

    // フォールバック: 時間帯なしの背景を探す
    const defaultVariant = availableBackgrounds.find(
      bg => bg.id === locationId
    );
    
    return defaultVariant || null;
  }

  /**
   * デフォルト背景を親密度に基づいて取得
   */
  getDefaultBackgroundByIntimacy(intimacyLevel: number, backgrounds: BackgroundImage[]): BackgroundImage | null {
    const defaults = {
      0: 'cafe_afternoon',
      20: 'park_morning',
      40: 'aquarium_afternoon',
      60: 'night_view_evening',
      85: 'hotel_room_evening'
    };

    // 親密度に最も近いデフォルトを探す
    const intimacyKeys = Object.keys(defaults).map(Number).sort((a, b) => b - a);
    const matchedKey = intimacyKeys.find(key => intimacyLevel >= key) || 0;
    const defaultId = defaults[matchedKey as keyof typeof defaults];

    return backgrounds.find(bg => bg.id === defaultId) || backgrounds[0] || null;
  }

  /**
   * 推奨背景を取得（時間帯、季節、親密度を考慮）
   */
  getRecommendedBackgrounds(
    backgrounds: BackgroundImage[],
    intimacyLevel: number
  ): BackgroundImage[] {
    const timeOfDay = this.getTimeOfDay();
    const season = this.getCurrentSeason();
    const seasonalEvents = this.getSeasonalEvents();
    
    // 親密度でフィルタリング
    const accessible = this.filterByIntimacy(backgrounds, intimacyLevel);
    
    // 推奨度スコアを計算
    const scored = accessible.map(bg => {
      let score = 0;
      
      // 時間帯マッチング
      if (bg.id.includes(timeOfDay)) score += 3;
      
      // 季節イベントマッチング
      if (seasonalEvents.some(event => bg.id.includes(event))) score += 5;
      
      // 季節マッチング
      if (bg.id.includes(season)) score += 2;
      
      // デフォルト背景ボーナス
      if (bg.isDefault) score += 1;
      
      return { background: bg, score };
    });
    
    // スコア順でソート
    scored.sort((a, b) => b.score - a.score);
    
    return scored.map(item => item.background);
  }

  /**
   * 背景画像のフルパスを生成
   */
  getBackgroundImagePath(background: BackgroundImage): string {
    // 既にフルURLの場合はそのまま返す
    if (background.url.startsWith('http')) {
      return background.url;
    }
    
    // ローカルパスの場合は適切なプレフィックスを追加
    if (background.url.startsWith('/')) {
      return background.url;
    }
    
    // 相対パスの場合
    return `/images/backgrounds/${background.category}/${background.url}`;
  }
}

// シングルトンインスタンスをエクスポート
export const backgroundSelectionService = new BackgroundSelectionService();