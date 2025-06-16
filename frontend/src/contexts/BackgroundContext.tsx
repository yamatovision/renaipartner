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
      
      // 背景を取得（imagesApiServiceが配列を返すように修正済み）
      const backgrounds = await imagesApiService.getBackgrounds();
      console.log('🏞️ [BackgroundContext] 取得した背景:', backgrounds);
      console.log('🏞️ [BackgroundContext] 背景は配列か:', Array.isArray(backgrounds));
      console.log('🏞️ [BackgroundContext] 背景の数:', backgrounds.length);
      
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
    } catch (err: any) {
      console.error('🏞️ [BackgroundContext] 背景画像の取得に失敗:', err);
      console.error('🏞️ [BackgroundContext] エラー詳細:', err.message);
      
      // より詳細なエラーメッセージを設定
      const errorMessage = err.message || '背景画像の取得に失敗しました';
      setError(errorMessage);
      
      // 空の配列を設定（フォールバックなし）
      setAvailableBackgrounds([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザー設定から現在の背景を取得
  const loadUserBackground = async () => {
    try {
      // 認証トークンがあるかチェック
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        console.log('[BackgroundContext] No auth token, skipping user settings');
        return;
      }

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
      console.log('[BackgroundContext] Settings API error (expected for new users):', err);
      // 新規ユーザーの場合は認証エラーが正常。デフォルト背景を継続使用
    }
  };

  // 背景を変更
  const changeBackground = async (backgroundId: string) => {
    try {
      console.log('🔧 [BackgroundContext] changeBackground呼び出し:', backgroundId)
      console.log('🔧 [BackgroundContext] availableBackgrounds:', availableBackgrounds)
      console.log('🔧 [BackgroundContext] availableBackgrounds.length:', availableBackgrounds.length)
      
      setError(null);
      
      const newBackground = availableBackgrounds.find((bg: BackgroundImage) => bg.id === backgroundId);
      console.log('🔧 [BackgroundContext] 見つかった背景:', newBackground)
      
      if (!newBackground) {
        console.error('🔧 [BackgroundContext] 背景が見つかりません:', backgroundId)
        throw new Error('指定された背景が見つかりません');
      }

      console.log('🔧 [BackgroundContext] UIに反映中...')
      // UIの即座反映
      setCurrentBackground(newBackground);

      // 認証トークンがある場合のみサーバーに保存
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        console.log('🔧 [BackgroundContext] サーバーに保存中...')
        // サーバーに保存
        await settingsApiService.updateSettings({
          userSettings: { backgroundImage: backgroundId }
        });
        
        console.log('🔧 [BackgroundContext] 背景変更完了')
      } else {
        console.log('🔧 [BackgroundContext] No auth token, skipping server save')
      }

    } catch (err) {
      console.error('🔧 [BackgroundContext] 背景変更に失敗:', err);
      setError('背景の変更に失敗しました');
      
      // エラー時は前の状態に戻す
      await loadUserBackground();
    }
  };

  // 背景一覧を再取得
  const refreshBackgrounds = async () => {
    await loadBackgrounds();
    // 認証トークンがある場合のみユーザー設定を読み込み
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      await loadUserBackground();
    }
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