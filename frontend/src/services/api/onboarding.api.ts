// オンボーディングAPI実サービス実装
import {
  OnboardingProgress,
  OnboardingStartRequest,
  OnboardingUpdateRequest,
  OnboardingCompleteRequest,
  PersonalityPreset,
  PersonalityQuestion,
  RecommendedPresetsRequest,
  ApiResponse,
  API_PATHS
} from '@/types'
import { api } from './client'

// 実オンボーディングAPIサービス
export const onboardingApiService = {
  // オンボーディング開始
  startOnboarding: async (request: OnboardingStartRequest): Promise<ApiResponse<OnboardingProgress>> => {
    try {
      const response = await api.post<OnboardingProgress>(API_PATHS.ONBOARDING.START, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'オンボーディングの開始に失敗しました',
      }
    }
  },

  // 進捗状況取得
  getProgress: async (userId: string): Promise<ApiResponse<OnboardingProgress>> => {
    try {
      console.log('getProgress API call:', { userId, path: API_PATHS.ONBOARDING.PROGRESS(userId) })
      const response = await api.get<OnboardingProgress>(API_PATHS.ONBOARDING.PROGRESS(userId))
      console.log('getProgress API response:', response)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('getProgress API error:', error)
      return {
        success: false,
        error: error.message || '進捗状況の取得に失敗しました',
      }
    }
  },

  // 進捗更新
  updateProgress: async (userId: string, request: OnboardingUpdateRequest): Promise<ApiResponse<OnboardingProgress>> => {
    try {
      console.log('updateProgress API call:', { userId, path: API_PATHS.ONBOARDING.PROGRESS(userId), request })
      const response = await api.put<OnboardingProgress>(API_PATHS.ONBOARDING.PROGRESS(userId), request)
      console.log('updateProgress API response:', response)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('updateProgress API error:', error)
      return {
        success: false,
        error: error.message || '進捗の更新に失敗しました',
      }
    }
  },

  // オンボーディング完了
  completeOnboarding: async (userId: string, request: OnboardingCompleteRequest): Promise<ApiResponse<void>> => {
    try {
      await api.post<void>(API_PATHS.ONBOARDING.COMPLETE(userId), request)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'オンボーディングの完了に失敗しました',
      }
    }
  },

  // プリセット取得
  getPresets: async (): Promise<ApiResponse<PersonalityPreset[]>> => {
    try {
      const response = await api.get<PersonalityPreset[]>(API_PATHS.ONBOARDING.PRESETS)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'プリセットの取得に失敗しました',
      }
    }
  },

  // 性格診断質問取得
  getPersonalityQuestions: async (): Promise<ApiResponse<PersonalityQuestion[]>> => {
    try {
      const response = await api.get<PersonalityQuestion[]>(API_PATHS.ONBOARDING.PERSONALITY_QUESTIONS)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '性格診断質問の取得に失敗しました',
      }
    }
  },

  // おすすめプリセット取得
  getRecommendedPresets: async (request: RecommendedPresetsRequest): Promise<ApiResponse<PersonalityPreset[]>> => {
    try {
      const response = await api.post<PersonalityPreset[]>(
        API_PATHS.ONBOARDING.RECOMMENDED_PRESETS,
        request
      )
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'おすすめプリセットの取得に失敗しました',
      }
    }
  },
}