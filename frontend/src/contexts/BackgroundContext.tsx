'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BackgroundImage, UserSettings } from '@/types';
import { imagesApiService } from '@/services/api/images.api';
import { settingsApiService } from '@/services/api/settings.api';
import { backgroundSelectionService } from '@/services/backgroundSelection.service';

interface BackgroundContextType {
  currentBackground: BackgroundImage | null;
  availableBackgrounds: BackgroundImage[];
  isLoading: boolean;
  error: string | null;
  changeBackground: (backgroundId: string) => Promise<void>;
  refreshBackgrounds: () => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

interface BackgroundProviderProps {
  children: ReactNode;
}

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({ children }) => {
  const [currentBackground, setCurrentBackground] = useState<BackgroundImage | null>(null);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 背景一覧を取得
  const loadBackgrounds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 背景を取得
      const backgrounds = await imagesApiService.getBackgrounds();
      setAvailableBackgrounds(backgrounds);
      
      // 時間帯に基づいたデフォルト背景を設定
      if (backgrounds.length > 0 && !currentBackground) {
        const timeOfDay = backgroundSelectionService.getTimeOfDay();
        
        // 現在の時間帯に一致する背景を探す
        const timeBasedBackgrounds = backgrounds.filter((bg: BackgroundImage) => 
          bg.timeOfDay === timeOfDay
        );
        
        let defaultBg: BackgroundImage;
        
        if (timeBasedBackgrounds.length > 0) {
          // 時間帯に一致する背景がある場合
          defaultBg = timeBasedBackgrounds.find((bg: BackgroundImage) => bg.isDefault) || timeBasedBackgrounds[0];
        } else {
          // フォールバック: デフォルト背景または最初の背景
          defaultBg = backgrounds.find((bg: BackgroundImage) => bg.isDefault) || backgrounds[0];
        }
        
        setCurrentBackground(defaultBg);
      }
    } catch (err) {
      console.error('背景画像の取得に失敗:', err);
      setError('背景画像の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー設定から現在の背景を取得
  const loadUserBackground = async () => {
    try {
      const settings = await settingsApiService.getSettings();
      if (settings.data?.userSettings?.backgroundImage && availableBackgrounds.length > 0) {
        const savedBackground = availableBackgrounds.find(
          (bg: BackgroundImage) => bg.id === settings.data.userSettings.backgroundImage
        );
        if (savedBackground) {
          setCurrentBackground(savedBackground);
        }
      }
    } catch (err) {
      console.error('ユーザー背景設定の取得に失敗:', err);
      // エラーが発生してもデフォルト背景を継続使用
    }
  };

  // 背景を変更
  const changeBackground = async (backgroundId: string) => {
    try {
      setError(null);
      
      const newBackground = availableBackgrounds.find((bg: BackgroundImage) => bg.id === backgroundId);
      if (!newBackground) {
        throw new Error('指定された背景が見つかりません');
      }

      // UIの即座反映
      setCurrentBackground(newBackground);

      // サーバーに保存
      await settingsApiService.updateSettings({
        userSettings: { backgroundImage: backgroundId }
      });

    } catch (err) {
      console.error('背景変更に失敗:', err);
      setError('背景の変更に失敗しました');
      
      // エラー時は前の状態に戻す
      await loadUserBackground();
    }
  };

  // 背景一覧を再取得
  const refreshBackgrounds = async () => {
    await loadBackgrounds();
    await loadUserBackground();
  };

  // 初期化
  useEffect(() => {
    loadBackgrounds();
  }, []);

  // 背景一覧取得後にユーザー設定を読み込み
  useEffect(() => {
    if (availableBackgrounds.length > 0) {
      loadUserBackground();
    }
  }, [availableBackgrounds]);

  const value: BackgroundContextType = {
    currentBackground,
    availableBackgrounds,
    isLoading,
    error,
    changeBackground,
    refreshBackgrounds,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackgroundContext = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackgroundContext must be used within a BackgroundProvider');
  }
  return context;
};