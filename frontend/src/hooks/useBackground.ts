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
  cycleThroughBackgrounds: () => Promise<void>;
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
      backgroundImage: `url(${currentBackground.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    };
  };

  // 背景を順番に切り替え（ホーム画面の🎨ボタン用）
  const cycleThroughBackgrounds = async (): Promise<void> => {
    console.log('🔄 [useBackground] cycleThroughBackgrounds開始')
    console.log('🔄 [useBackground] availableBackgrounds:', availableBackgrounds)
    console.log('🔄 [useBackground] availableBackgrounds is array:', Array.isArray(availableBackgrounds))
    console.log('🔄 [useBackground] availableBackgrounds.length:', availableBackgrounds?.length)
    console.log('🔄 [useBackground] currentBackground:', currentBackground)
    
    if (!availableBackgrounds || !Array.isArray(availableBackgrounds) || availableBackgrounds.length === 0) {
      console.warn('🔄 [useBackground] 利用可能な背景がありません')
      return;
    }

    const currentIndex = currentBackground 
      ? availableBackgrounds.findIndex(bg => bg.id === currentBackground.id)
      : -1;
    
    console.log('🔄 [useBackground] currentIndex:', currentIndex)
    
    const nextIndex = (currentIndex + 1) % availableBackgrounds.length;
    const nextBackground = availableBackgrounds[nextIndex];
    
    console.log('🔄 [useBackground] nextIndex:', nextIndex)
    console.log('🔄 [useBackground] nextBackground:', nextBackground)
    
    if (nextBackground) {
      console.log('🔄 [useBackground] changeBackground呼び出し中...')
      await changeBackground(nextBackground.id);
      console.log('🔄 [useBackground] changeBackground完了')
    } else {
      console.error('🔄 [useBackground] nextBackgroundが見つかりません')
    }
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
    cycleThroughBackgrounds,
    getTimeBasedBackground,
    getRecommendedBackgrounds,
  };
};