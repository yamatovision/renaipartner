// サービス統合層（モック/実API自動切り替え）
import { IS_MOCK_MODE, showMockIndicator } from './mock'
import { mockAuthService } from './mock/auth.mock'
import { mockPartnersService } from './mock/partners.mock'
import { mockChatService } from './mock/chat.mock'
import { mockAdminService } from './mock/admin.mock'

// 実APIサービス（今後実装）
// import { authService } from './api/auth.api'
// import { partnersService } from './api/partners.api'
// import { chatService } from './api/chat.api'
// import { adminService } from './api/admin.api'

// モックインジケーター表示（ブラウザ環境のみ）
if (typeof window !== 'undefined' && IS_MOCK_MODE) {
  showMockIndicator()
}

// サービスエクスポート（モック/実APIの切り替え）
export const authService = IS_MOCK_MODE 
  ? mockAuthService 
  : mockAuthService // TODO: 実API実装後に authService に置き換え

export const partnersService = IS_MOCK_MODE 
  ? mockPartnersService 
  : mockPartnersService // TODO: 実API実装後に partnersService に置き換え

export const chatService = IS_MOCK_MODE 
  ? mockChatService 
  : mockChatService // TODO: 実API実装後に chatService に置き換え

export const adminService = IS_MOCK_MODE 
  ? mockAdminService 
  : mockAdminService // TODO: 実API実装後に adminService に置き換え

// その他のエクスポート
export { IS_MOCK_MODE } from './mock'