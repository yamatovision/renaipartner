'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { RelationshipMetrics, Partner, ID } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { partnersService, memoryService } from '@/services'
import { partnersApiService } from '@/services/api/partners.api'

// RelationshipMetricsContextの型定義
interface RelationshipMetricsContextType {
  // 現在のパートナー情報
  partner: Partner | null
  // 関係性メトリクス
  relationshipMetrics: RelationshipMetrics | null
  // 読み込み状態
  isLoading: boolean
  // エラー状態
  error: string | null
  // パートナーと関係性メトリクスを同期読み込み
  loadPartnerAndMetrics: () => Promise<void>
  // 親密度を更新（パートナーとメトリクス両方を同期更新）
  updateIntimacyLevel: (newLevel: number) => Promise<void>
  // メトリクスのみを再読み込み
  refreshMetrics: () => Promise<void>
  // エラーをクリア
  clearError: () => void
}

const RelationshipMetricsContext = createContext<RelationshipMetricsContextType | undefined>(undefined)

// カスタムフック
export const useRelationshipMetrics = () => {
  const context = useContext(RelationshipMetricsContext)
  if (!context) {
    throw new Error('useRelationshipMetrics must be used within RelationshipMetricsProvider')
  }
  return context
}

export const RelationshipMetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [relationshipMetrics, setRelationshipMetrics] = useState<RelationshipMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // パートナーと関係性メトリクスを同期読み込み
  const loadPartnerAndMetrics = useCallback(async () => {
    if (!user) {
      console.log('[RelationshipMetrics] No user found')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('[RelationshipMetrics] Loading partner and metrics...')
      
      // 1. パートナー情報を取得（PartnerGuardと同じAPIを使用）
      const partnerResponse = await partnersApiService.getPartner()
      console.log('[RelationshipMetrics] Partner API response:', partnerResponse)
      
      if (!partnerResponse.success || !partnerResponse.data) {
        console.log('[RelationshipMetrics] No partner found, skipping metrics load')
        // パートナーが存在しない場合はエラーを投げずに終了
        setPartner(null)
        setRelationshipMetrics(null)
        setIsLoading(false)
        return
      }

      const partnerData = partnerResponse.data
      setPartner(partnerData)
      console.log('[RelationshipMetrics] Partner loaded:', partnerData.name, 'Intimacy:', partnerData.intimacyLevel)

      // 2. 関係性メトリクスを取得（partnersテーブルの親密度を基準とする）
      const metricsResponse = await memoryService.getRelationshipMetrics(partnerData.id)
      
      let metricsData: RelationshipMetrics
      
      if (metricsResponse.success && metricsResponse.data) {
        const responseData = metricsResponse.data as any
        let baseMetrics = null
        
        // API応答の構造を安全に処理
        if (responseData.current) {
          baseMetrics = responseData.current
        } else {
          baseMetrics = responseData
        }
        
        // partnersテーブルの親密度を優先してメトリクスを構築
        metricsData = {
          id: baseMetrics?.id || partnerData.id,
          partnerId: partnerData.id,
          intimacyLevel: partnerData.intimacyLevel, // partnersテーブルから取得した値を使用
          conversationFrequency: baseMetrics?.conversationFrequency || 0,
          lastInteraction: baseMetrics?.lastInteraction ? new Date(baseMetrics.lastInteraction) : new Date(),
          sharedMemories: baseMetrics?.sharedMemories || 0
        }
        
        console.log('[RelationshipMetrics] Metrics constructed with partner intimacy:', metricsData)
      } else {
        // フォールバック: partnersテーブルのデータのみを使用
        metricsData = {
          id: partnerData.id,
          partnerId: partnerData.id,
          intimacyLevel: partnerData.intimacyLevel,
          conversationFrequency: 0,
          lastInteraction: new Date(),
          sharedMemories: 0
        }
        console.log('[RelationshipMetrics] Using fallback metrics:', metricsData)
      }
      
      setRelationshipMetrics(metricsData)
      
    } catch (error) {
      console.error('[RelationshipMetrics] Failed to load data:', error)
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 親密度を更新（パートナーとメトリクス両方を同期更新）
  const updateIntimacyLevel = useCallback(async (newLevel: number) => {
    if (!partner || !relationshipMetrics) {
      console.warn('[RelationshipMetrics] No partner or metrics available for update')
      return
    }

    try {
      // 0-100の範囲でクランプ
      const clampedLevel = Math.max(0, Math.min(100, newLevel))
      
      console.log('[RelationshipMetrics] Updating intimacy level:', {
        from: partner.intimacyLevel,
        to: clampedLevel,
        change: clampedLevel - partner.intimacyLevel
      })
      
      // パートナーオブジェクトを即座に更新（楽観的更新）
      setPartner(prev => {
        const updated = prev ? { ...prev, intimacyLevel: clampedLevel } : null
        console.log('[RelationshipMetrics] Partner state updated:', updated?.intimacyLevel)
        return updated
      })
      setRelationshipMetrics(prev => {
        const updated = prev ? { ...prev, intimacyLevel: clampedLevel } : null
        console.log('[RelationshipMetrics] Metrics state updated:', updated?.intimacyLevel)
        return updated
      })
      
      // バックエンドに反映（相対値で更新）
      const intimacyChange = clampedLevel - partner.intimacyLevel
      const updateResponse = await partnersApiService.updateIntimacyLevel(partner.id, intimacyChange)
      
      if (!updateResponse.success) {
        console.error('親密度更新APIエラー:', updateResponse.error)
        // APIエラー時は元の値に戻す
        setPartner(prev => prev ? { ...prev, intimacyLevel: partner.intimacyLevel } : null)
        setRelationshipMetrics(prev => prev ? { ...prev, intimacyLevel: partner.intimacyLevel } : null)
        throw new Error(updateResponse.error)
      }
      
    } catch (error) {
      console.error('[RelationshipMetrics] Failed to update intimacy level:', error)
      // エラー時は元の値に戻す（再読み込みはしない）
      setPartner(prev => prev ? { ...prev, intimacyLevel: partner.intimacyLevel } : null)
      setRelationshipMetrics(prev => prev ? { ...prev, intimacyLevel: partner.intimacyLevel } : null)
    }
  }, [partner, relationshipMetrics])

  // メトリクスのみを再読み込み
  const refreshMetrics = useCallback(async () => {
    if (!partner) {
      console.warn('[RelationshipMetrics] No partner available for metrics refresh')
      return
    }

    try {
      setError(null)
      
      const metricsResponse = await memoryService.getRelationshipMetrics(partner.id)
      
      if (metricsResponse.success && metricsResponse.data) {
        const responseData = metricsResponse.data as any
        let baseMetrics = null
        
        if (responseData.current) {
          baseMetrics = responseData.current
        } else {
          baseMetrics = responseData
        }
        
        // partnersテーブルの親密度を保持してメトリクスを更新
        const updatedMetrics: RelationshipMetrics = {
          id: baseMetrics?.id || partner.id,
          partnerId: partner.id,
          intimacyLevel: partner.intimacyLevel, // partnersテーブルの値を維持
          conversationFrequency: baseMetrics?.conversationFrequency || 0,
          lastInteraction: baseMetrics?.lastInteraction ? new Date(baseMetrics.lastInteraction) : new Date(),
          sharedMemories: baseMetrics?.sharedMemories || 0
        }
        
        setRelationshipMetrics(updatedMetrics)
        console.log('[RelationshipMetrics] Metrics refreshed:', updatedMetrics)
      }
    } catch (error) {
      console.error('[RelationshipMetrics] Failed to refresh metrics:', error)
      setError('メトリクスの更新に失敗しました')
    }
  }, [partner])

  // 初期読み込み
  useEffect(() => {
    if (user) {
      loadPartnerAndMetrics()
    }
  }, [user, loadPartnerAndMetrics])

  const value: RelationshipMetricsContextType = {
    partner,
    relationshipMetrics,
    isLoading,
    error,
    loadPartnerAndMetrics,
    updateIntimacyLevel,
    refreshMetrics,
    clearError
  }

  return (
    <RelationshipMetricsContext.Provider value={value}>
      {children}
    </RelationshipMetricsContext.Provider>
  )
}