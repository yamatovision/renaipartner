// パートナー関連のモックサービス
import { 
  Partner, 
  PartnerCreateRequest, 
  PartnerUpdateRequest,
  ApiResponse,
  PromptValidationRequest,
  PromptValidationResponse,
  PromptPreviewRequest,
  PromptPreviewResponse,
  Gender,
  PersonalityType,
  SpeechStyle
} from '@/types'

export const mockPartnersService = {
  // パートナー作成
  async createPartner(request: PartnerCreateRequest): Promise<ApiResponse<Partner>> {
    const mockPartner: Partner = {
      id: 'partner-123',
      userId: 'user-123',
      name: request.name,
      gender: request.gender,
      personalityType: request.personalityType,
      speechStyle: request.speechStyle,
      systemPrompt: request.systemPrompt,
      avatarDescription: request.avatarDescription,
      appearance: request.appearance,
      hobbies: request.hobbies || [],
      intimacyLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return {
      success: true,
      data: mockPartner
    }
  },

  // パートナー取得
  async getPartners(): Promise<ApiResponse<Partner[]>> {
    const mockPartners: Partner[] = [
      {
        id: 'partner-123',
        userId: 'user-123',
        name: 'レン',
        gender: Gender.BOYFRIEND,
        personalityType: PersonalityType.GENTLE,
        speechStyle: SpeechStyle.POLITE,
        systemPrompt: 'あなたは優しくて思いやりのある理想的なパートナーです。',
        avatarDescription: '優しい表情をした魅力的な男性。',
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        hobbies: ['読書', '映画鑑賞'],
        intimacyLevel: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    return {
      success: true,
      data: mockPartners
    }
  },

  // 現在のパートナー取得
  async getPartner(): Promise<ApiResponse<Partner>> {
    const mockPartner: Partner = {
      id: 'partner-123',
      userId: 'user-123',
      name: 'レン',
      gender: Gender.BOYFRIEND,
      personalityType: PersonalityType.GENTLE,
      speechStyle: SpeechStyle.POLITE,
      systemPrompt: 'あなたは優しくて思いやりのある理想的なパートナーです。',
      avatarDescription: '優しい表情をした魅力的な男性。',
      appearance: {
        hairStyle: 'medium',
        eyeColor: 'brown',
        bodyType: 'average',
        clothingStyle: 'casual'
      },
      hobbies: ['読書', '映画鑑賞'],
      intimacyLevel: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return {
      success: true,
      data: mockPartner
    }
  },

  // パートナー詳細取得
  async getPartnerDetail(partnerId: string): Promise<ApiResponse<Partner>> {
    const mockPartner: Partner = {
      id: partnerId,
      userId: 'user-123',
      name: 'レン',
      gender: Gender.BOYFRIEND,
      personalityType: PersonalityType.GENTLE,
      speechStyle: SpeechStyle.POLITE,
      systemPrompt: 'あなたは優しくて思いやりのある理想的なパートナーです。',
      avatarDescription: '優しい表情をした魅力的な男性。',
      appearance: {
        hairStyle: 'medium',
        eyeColor: 'brown',
        bodyType: 'average',
        clothingStyle: 'casual'
      },
      hobbies: ['読書', '映画鑑賞'],
      intimacyLevel: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return {
      success: true,
      data: mockPartner
    }
  },

  // パートナー更新
  async updatePartner(partnerId: string, request: PartnerUpdateRequest): Promise<ApiResponse<Partner>> {
    const mockPartner: Partner = {
      id: partnerId,
      userId: 'user-123',
      name: request.name || 'レン',
      gender: Gender.BOYFRIEND,
      personalityType: request.personalityType || PersonalityType.GENTLE,
      speechStyle: request.speechStyle || SpeechStyle.POLITE,
      systemPrompt: request.systemPrompt || 'あなたは優しくて思いやりのある理想的なパートナーです。',
      avatarDescription: request.avatarDescription || '優しい表情をした魅力的な男性。',
      appearance: {
        hairStyle: 'medium',
        eyeColor: 'brown',
        bodyType: 'average',
        clothingStyle: 'casual',
        ...request.appearance
      },
      hobbies: request.hobbies || ['読書', '映画鑑賞'],
      intimacyLevel: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return {
      success: true,
      data: mockPartner
    }
  },

  // パートナー削除
  async deletePartner(partnerId: string): Promise<ApiResponse<void>> {
    return {
      success: true
    }
  },

  // プロンプト検証
  async validatePrompt(request: PromptValidationRequest): Promise<ApiResponse<PromptValidationResponse>> {
    return {
      success: true,
      data: {
        isValid: request.systemPrompt.length >= 50,
        warnings: request.systemPrompt.length < 50 ? ['プロンプトが短すぎます'] : [],
        score: 85
      }
    }
  },

  // プロンプトプレビュー
  async previewPrompt(request: PromptPreviewRequest): Promise<ApiResponse<PromptPreviewResponse>> {
    return {
      success: true,
      data: {
        response: 'こんにちは！今日はどんな一日でしたか？',
        isValid: true
      }
    }
  }
}