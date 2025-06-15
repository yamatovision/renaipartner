'use client';

import { useBackgroundContext } from '@/contexts/BackgroundContext';
import { BackgroundImage } from '@/types';
import { backgroundSelectionService } from '@/services/backgroundSelection.service';

export interface UseBackgroundReturn {
  // 状態
  currentBackground: BackgroundImage | null;
  availableBackgrounds: BackgroundImage[];
  isLoading: boolean;
  error: string | null;
  
  // アクション
  changeBackground: (backgroundId: string) => Promise<void>;
  refreshBackgrounds: () => Promise<void>;
  
  // ユーティリティ
  getBackgroundById: (id: string) => BackgroundImage | undefined;
  getBackgroundsByCategory: (category: string) => BackgroundImage[];
  getDefaultBackground: () => BackgroundImage | undefined;
  getCurrentBackgroundStyle: () => React.CSSProperties;
  getTimeBasedBackground: () => BackgroundImage | null;
  getRecommendedBackgrounds: (intimacyLevel?: number) => BackgroundImage[];
}

/**
 * 背景管理のためのカスタムフック
 * BackgroundContextを利用し、背景変更ロジックを抽象化
 */
export const useBackground = (): UseBackgroundReturn => {
  const {
    currentBackground,
    availableBackgrounds,
    isLoading,
    error,
    changeBackground,
    refreshBackgrounds,
  } = useBackgroundContext();

  // 指定IDの背景を取得
  const getBackgroundById = (id: string): BackgroundImage | undefined => {
    return availableBackgrounds.find(bg => bg.id === id);
  };

  // カテゴリ別背景一覧を取得
  const getBackgroundsByCategory = (category: string): BackgroundImage[] => {
    return availableBackgrounds.filter(bg => bg.category === category);
  };

  // デフォルト背景を取得
  const getDefaultBackground = (): BackgroundImage | undefined => {
    return availableBackgrounds.find(bg => bg.isDefault) || availableBackgrounds[0];
  };

  // 現在の背景のCSSスタイルを生成
  const getCurrentBackgroundStyle = (): React.CSSProperties => {
    if (!currentBackground) {
      return {
        backgroundColor: '#f3f4f6', // フォールバック背景色
      };
    }

    return {
      position: 'relative',
      backgroundImage: `
        linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.92) 0%,
          rgba(255, 255, 255, 0.85) 20%,
          rgba(255, 255, 255, 0.82) 80%,
          rgba(255, 255, 255, 0.92) 100%
        ),
        url(${currentBackground.url})
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
    };
  };

  // 現在の時間帯に適した背景を取得
  const getTimeBasedBackground = (): BackgroundImage | null => {
    if (availableBackgrounds.length === 0) {
      return null;
    }

    const timeOfDay = backgroundSelectionService.getTimeOfDay();
    
    // 現在の時間帯に一致する背景を探す
    const timeBasedBackgrounds = availableBackgrounds.filter(bg => 
      bg.timeOfDay === timeOfDay
    );
    
    if (timeBasedBackgrounds.length > 0) {
      // デフォルト背景を優先
      return timeBasedBackgrounds.find(bg => bg.isDefault) || timeBasedBackgrounds[0];
    }
    
    // フォールバック: デフォルト背景を返す
    return getDefaultBackground() || null;
  };

  // 推奨背景を取得（時間帯、季節、親密度を考慮）
  const getRecommendedBackgrounds = (intimacyLevel: number = 50): BackgroundImage[] => {
    if (availableBackgrounds.length === 0) {
      return [];
    }

    return backgroundSelectionService.getRecommendedBackgrounds(
      availableBackgrounds,
      intimacyLevel
    );
  };

  return {
    // 状態
    currentBackground,
    availableBackgrounds,
    isLoading,
    error,
    
    // アクション
    changeBackground,
    refreshBackgrounds,
    
    // ユーティリティ
    getBackgroundById,
    getBackgroundsByCategory,
    getDefaultBackground,
    getCurrentBackgroundStyle,
    getTimeBasedBackground,
    getRecommendedBackgrounds,
  };
};