/**
 * 設定関連のモックサービス
 * 実APIと同じインターフェースで実装
 */

import { 
  MOCK_NOTIFICATION_SETTINGS, 
  MOCK_USER_SETTINGS,
  MOCK_BACKGROUND_IMAGES,
  MOCK_EXPORT_DATA
} from './data/settings.mock';
import { NotificationSettings, UserSettings, BackgroundImage } from '../../types';

// API遅延をシミュレート
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockSettingsService = {
  // 通知設定を取得
  getNotificationSettings: async (userId: string): Promise<NotificationSettings> => {
    console.warn('🔧 Using MOCK data for notification settings');
    await delay(500);
    return { ...MOCK_NOTIFICATION_SETTINGS };
  },

  // 通知設定を更新
  updateNotificationSettings: async (
    userId: string, 
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> => {
    console.warn('🔧 Using MOCK data for updating notification settings');
    await delay(500);
    return { ...MOCK_NOTIFICATION_SETTINGS, ...settings };
  },

  // ユーザー設定を取得
  getUserSettings: async (userId: string): Promise<UserSettings> => {
    console.warn('🔧 Using MOCK data for user settings');
    await delay(500);
    return { ...MOCK_USER_SETTINGS };
  },

  // ユーザー設定を更新
  updateUserSettings: async (
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings> => {
    console.warn('🔧 Using MOCK data for updating user settings');
    await delay(500);
    return { ...MOCK_USER_SETTINGS, ...settings };
  },

  // パスワードを変更
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    console.warn('🔧 Using MOCK data for password change');
    await delay(1000);
    
    // モックでは現在のパスワードが"password"の場合のみ成功
    if (currentPassword === 'password') {
      return { 
        success: true, 
        message: 'パスワードが正常に変更されました'
      };
    } else {
      return { 
        success: false, 
        message: '現在のパスワードが正しくありません'
      };
    }
  },

  // 背景画像一覧を取得
  getBackgroundImages: async (): Promise<BackgroundImage[]> => {
    console.warn('🔧 Using MOCK data for background images');
    await delay(500);
    return [...MOCK_BACKGROUND_IMAGES];
  },

  // 選択した背景を設定
  setBackground: async (
    userId: string,
    backgroundId: string
  ): Promise<{ success: boolean }> => {
    console.warn('🔧 Using MOCK data for setting background');
    await delay(500);
    return { success: true };
  },

  // データをエクスポート
  exportData: async (
    userId: string,
    includeConversations: boolean
  ): Promise<Blob> => {
    console.warn('🔧 Using MOCK data for data export');
    await delay(1500);
    
    const exportData = includeConversations 
      ? MOCK_EXPORT_DATA 
      : { ...MOCK_EXPORT_DATA, conversations: [] };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  },

  // アカウントを削除
  deleteAccount: async (
    userId: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    console.warn('🔧 Using MOCK data for account deletion');
    await delay(2000);
    
    // モックではパスワードが"password"の場合のみ成功
    if (password === 'password') {
      return { 
        success: true, 
        message: 'アカウントが削除されました'
      };
    } else {
      return { 
        success: false, 
        message: 'パスワードが正しくありません'
      };
    }
  }
};