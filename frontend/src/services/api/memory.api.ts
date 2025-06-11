// メモリシステムAPI実サービス実装
import {
  Memory,
  MemorySummaryRequest,
  MemorySearchRequest,
  MemorySearchResponse,
  EpisodeMemory,
  RelationshipMetrics,
  ContinuousTopic,
  ApiResponse,
  API_PATHS
} from '@/types'
import { api } from './client'

// 実メモリシステムAPIサービス
export const memoryApiService = {
  // 会話要約作成
  createSummary: async (request: MemorySummaryRequest): Promise<ApiResponse<Memory>> => {
    try {
      const response = await api.post<Memory>(API_PATHS.MEMORY.SUMMARY, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '会話要約の作成に失敗しました',
      }
    }
  },

  // メモリ検索
  searchMemory: async (request: MemorySearchRequest): Promise<ApiResponse<MemorySearchResponse>> => {
    try {
      const response = await api.post<MemorySearchResponse>(API_PATHS.MEMORY.SEARCH, request)
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'メモリ検索に失敗しました',
      }
    }
  },

  // エピソード記憶取得
  getEpisodes: async (partnerId: string): Promise<ApiResponse<EpisodeMemory[]>> => {
    try {
      const response = await api.get<EpisodeMemory[]>(API_PATHS.MEMORY.EPISODES(partnerId))
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'エピソード記憶の取得に失敗しました',
      }
    }
  },

  // 関係性メトリクス取得
  getRelationshipMetrics: async (partnerId: string): Promise<ApiResponse<RelationshipMetrics>> => {
    try {
      const response = await api.get<RelationshipMetrics>(API_PATHS.MEMORY.RELATIONSHIPS(partnerId))
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '関係性メトリクスの取得に失敗しました',
      }
    }
  },

  // 継続話題取得
  getContinuousTopics: async (partnerId: string): Promise<ApiResponse<ContinuousTopic[]>> => {
    try {
      const response = await api.get<ContinuousTopic[]>(API_PATHS.MEMORY.TOPICS(partnerId))
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '継続話題の取得に失敗しました',
      }
    }
  },
}