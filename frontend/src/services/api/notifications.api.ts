import { api } from './client'
import { 
  NotificationSettings, 
  NotificationScheduleRequest, 
  NotificationScheduleResponse,
  NotificationStatsResponse,
  ApiResponse,
  API_PATHS 
} from '../../types'

export const notificationsApiService = {
  // 通知設定取得（API 8.1）
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    return api.get(API_PATHS.NOTIFICATIONS.SETTINGS)
  },

  // 通知設定更新（API 8.2）
  async updateSettings(settings: Partial<Omit<NotificationSettings, 'id' | 'userId'>>): Promise<ApiResponse<NotificationSettings>> {
    return api.put(API_PATHS.NOTIFICATIONS.SETTINGS, settings)
  },

  // 通知スケジュール作成（API 8.3）
  async createSchedule(schedule: NotificationScheduleRequest): Promise<ApiResponse<NotificationScheduleResponse>> {
    return api.post(API_PATHS.NOTIFICATIONS.SCHEDULE, schedule)
  },

  // 通知統計取得（管理者のみ）
  async getStats(): Promise<NotificationStatsResponse> {
    return api.get(API_PATHS.NOTIFICATIONS.STATS)
  },

  // スケジュール一覧取得（追加機能）
  async getSchedules(): Promise<NotificationScheduleResponse[]> {
    return api.get(API_PATHS.NOTIFICATIONS.SCHEDULE)
  },

  // スケジュール削除（追加機能）
  async deleteSchedule(scheduleId: string): Promise<void> {
    return api.delete(`${API_PATHS.NOTIFICATIONS.SCHEDULE}/${scheduleId}`)
  },

  // 設定リセット（追加機能）
  async resetSettings(): Promise<NotificationSettings> {
    return api.post(`${API_PATHS.NOTIFICATIONS.SETTINGS}/reset`)
  },

  // 設定検証（追加機能）
  async validateSettings(): Promise<{ isValid: boolean; warnings: string[] }> {
    return api.get(`${API_PATHS.NOTIFICATIONS.SETTINGS}/validate`)
  }
}