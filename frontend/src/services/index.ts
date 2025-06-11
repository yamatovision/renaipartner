// サービス統合層（モック/実API自動切り替え）
import { IS_MOCK_MODE, showMockIndicator } from './mock'
import { mockAuthService } from './mock/auth.mock'
import { mockPartnersService } from './mock/partners.mock'
import { mockChatService } from './mock/chat.mock'
import { mockAdminService } from './mock/admin.mock'

// 実APIサービス
import { authApiService } from './api/auth.api'
import { adminApiService } from './api/admin.api'
import { usersApiService } from './api/users.api'
import { partnersApiService } from './api/partners.api'
// import { chatService } from './api/chat.api'

// モックインジケーター表示（ブラウザ環境のみ）
if (typeof window !== 'undefined' && IS_MOCK_MODE) {
  showMockIndicator()
}

// サービスエクスポート（モック/実APIの切り替え）
// 認証API群 - 実APIに統合済み
export const authService = authApiService

// 管理者API群 - 実APIに統合済み  
export const adminService = adminApiService

// ユーザープロフィール管理API群 - 実APIに統合済み
export const usersService = usersApiService

// パートナー基盤API群 - 実APIに統合済み
export const partnersService = partnersApiService

// 未統合API群 - モック継続使用
export const chatService = IS_MOCK_MODE 
  ? mockChatService 
  : mockChatService // TODO: 実API実装後に chatService に置き換え

// その他のエクスポート
export { IS_MOCK_MODE } from './mock'