// サービス統合層（実API使用）
import { authApiService } from './api/auth.api'
import { adminApiService } from './api/admin.api'
import { usersApiService } from './api/users.api'
import { partnersApiService } from './api/partners.api'
import { chatApiService } from './api/chat.api'
import { onboardingApiService } from './api/onboarding.api'
import { memoryApiService } from './api/memory.api'
import { notificationsApiService } from './api/notifications.api'
import { settingsApiService } from './api/settings.api'

// サービスエクスポート（実APIのみ）
export const authService = authApiService
export const adminService = adminApiService
export const usersService = usersApiService
export const partnersService = partnersApiService
export const onboardingService = onboardingApiService
export const memoryService = memoryApiService
export const chatService = chatApiService
export const notificationsService = notificationsApiService
export const settingsService = settingsApiService