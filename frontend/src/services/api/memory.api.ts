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
  API_PATHS,
  ExtractFromResponseRequest,
  ExtractFromResponseResponse
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
  getRelationshipMetrics: async (partnerId: string): Promise<ApiResponse<any>> => {
    try {
      console.log('[MEMORY API] getRelationshipMetrics called for partnerId:', partnerId)
      console.log('[MEMORY API] API path:', API_PATHS.MEMORY.RELATIONSHIPS(partnerId))
      
      const response = await api.get<any>(API_PATHS.MEMORY.RELATIONSHIPS(partnerId))
      
      console.log('[MEMORY API] Raw response:', response)
      console.log('[MEMORY API] Response type:', typeof response)
      console.log('[MEMORY API] Response keys:', Object.keys(response || {}))
      
      // APIレスポンスが既に{success, data, message}形式の場合はそのまま返す
      if (response && response.success !== undefined) {
        return response
      }
      
      // そうでない場合は従来の形式でラップ
      return {
        success: true,
        data: response,
      }
    } catch (error: any) {
      console.error('[MEMORY API] getRelationshipMetrics error:', error)
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

  // 質問回答からのメモリ抽出
  extractFromResponse: async (data: ExtractFromResponseRequest): Promise<ApiResponse<ExtractFromResponseResponse>> => {
    try {
      const response = await api.post<any>(API_PATHS.MEMORY.EXTRACT_FROM_RESPONSE, data);
      
      // APIレスポンスが既に{success, data}形式の場合はそのまま返す
      if (response && (response as any).success !== undefined) {
        return response as ApiResponse<ExtractFromResponseResponse>;
      }
      
      // そうでない場合は従来の形式でラップ
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'メモリ抽出に失敗しました',
      };
    }
  },
}