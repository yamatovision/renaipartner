import { 
  Partner, 
  PartnerCreate,
  PartnerUpdate,
  ApiResponse,
  PresetPersonality
} from '@/types'
import { MOCK_PARTNERS, MOCK_PERSONALITY_PRESETS, MOCK_PROMPT_VALIDATION, MOCK_PREVIEW_MESSAGES } from './data/partners.mock'

// モックパートナーサービス
export const mockPartnersService = {
  // パートナー一覧取得
  getPartners: async (userId: string): Promise<ApiResponse<Partner[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const partners = MOCK_PARTNERS.filter(p => p.userId === userId)
    
    return {
      success: true,
      data: partners,
    }
  },

  // パートナー詳細取得
  getPartner: async (partnerId: string): Promise<ApiResponse<Partner>> => {
    console.warn('🔧 Using MOCK data for partner detail')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const partner = MOCK_PARTNERS.find(p => p.id === partnerId)
    
    if (!partner) {
      return {
        success: false,
        error: 'パートナーが見つかりません',
      }
    }
    
    return {
      success: true,
      data: partner,
    }
  },

  // パートナー作成
  createPartner: async (data: PartnerCreate): Promise<ApiResponse<Partner>> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newPartner: Partner = {
      id: String(MOCK_PARTNERS.length + 1),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    MOCK_PARTNERS.push(newPartner)
    
    return {
      success: true,
      data: newPartner,
    }
  },

  // パートナー更新
  updatePartner: async (
    partnerId: string, 
    data: PartnerUpdate
  ): Promise<ApiResponse<Partner>> => {
    console.warn('🔧 Using MOCK data for partner update')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = MOCK_PARTNERS.findIndex(p => p.id === partnerId)
    
    if (index === -1) {
      return {
        success: false,
        error: 'パートナーが見つかりません',
      }
    }
    
    const currentPartner = MOCK_PARTNERS[index]
    const updatedPartner: Partner = {
      ...currentPartner,
      ...data,
      appearance: data.appearance ? {
        ...currentPartner.appearance,
        ...data.appearance
      } : currentPartner.appearance,
      updatedAt: new Date(),
    }
    
    MOCK_PARTNERS[index] = updatedPartner
    
    return {
      success: true,
      data: updatedPartner,
    }
  },

  // プロンプト検証
  validatePrompt: async (prompt: string): Promise<ApiResponse<{ isValid: boolean; warnings: string[] }>> => {
    console.warn('🔧 Using MOCK data for prompt validation')
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const warnings: string[] = []
    
    if (prompt.length < 50) {
      warnings.push('プロンプトが短すぎます（50文字以上推奨）')
    }
    
    if (prompt.length > 1000) {
      warnings.push('プロンプトが長すぎます（1000文字以内）')
    }
    
    if (!prompt.includes('性格') && !prompt.includes('話し方')) {
      warnings.push('性格や話し方に関する記述を含めることをお勧めします。')
    }
    
    return {
      success: true,
      data: {
        isValid: warnings.length === 0,
        warnings,
      },
    }
  },

  // 性格プリセット一覧取得
  getPersonalityPresets: async (): Promise<ApiResponse<PresetPersonality[]>> => {
    console.warn('🔧 Using MOCK data for personality presets')
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      success: true,
      data: MOCK_PERSONALITY_PRESETS
    }
  },

  // プレビュー生成
  generatePreview: async (prompt: string): Promise<ApiResponse<{ messages: any[]; metadata: any }>> => {
    console.warn('🔧 Using MOCK data for preview generation')
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    return {
      success: true,
      data: {
        messages: MOCK_PREVIEW_MESSAGES,
        metadata: {
          promptLength: prompt.length,
          generatedAt: new Date()
        }
      }
    }
  },

  // プリセット適用
  applyPreset: async (partnerId: string, presetId: string): Promise<ApiResponse<Partner>> => {
    console.warn('🔧 Using MOCK data for preset application')
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const preset = MOCK_PERSONALITY_PRESETS.find(p => p.id === presetId)
    if (!preset) {
      return {
        success: false,
        error: 'プリセットが見つかりません'
      }
    }
    
    const updates: PartnerUpdate = {
      personalityType: preset.personality,
      speechStyle: preset.speechStyle,
      systemPrompt: preset.prompt
    }
    
    return mockPartnersService.updatePartner(partnerId, updates)
  }
}