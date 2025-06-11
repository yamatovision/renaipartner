// モック設定サービス
import { NotificationSettings, UserSettings, ApiResponse } from '@/types'

export const mockSettingsService = {
  async updateNotificationSettings(
    userId: string, 
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    // モック実装 - 実際のAPIができるまでの暫定対応
    return {
      id: 'notif-1',
      userId,
      morningGreeting: settings.morningGreeting ?? true,
      morningTime: settings.morningTime ?? '08:00',
      reminderMessages: settings.reminderMessages ?? true,
      specialDays: settings.specialDays ?? true
    }
  },

  async setBackground(userId: string, backgroundId: string): Promise<ApiResponse<any>> {
    // モック実装
    return {
      success: true,
      data: { backgroundId }
    }
  },

  async deleteAccount(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    // モック実装
    return {
      success: true,
      message: 'アカウントが削除されました'
    }
  }
}