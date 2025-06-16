'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { LocationData, SeasonalEvent, ID } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useRelationshipMetrics } from '@/contexts/RelationshipMetricsContext'
import { partnersApiService } from '@/services/api/partners.api'
import { locationsApi } from '@/services/api/locations.api'

// 場所解放通知の型定義
interface LocationUnlockNotification {
  locationId: string
  locationName: string
  timestamp: Date
}

// LocationContextの型定義
interface LocationContextType {
  // 現在の場所
  currentLocation: LocationData | null
  // 利用可能な場所一覧
  availableLocations: LocationData[]
  // 季節イベント一覧
  seasonalEvents: SeasonalEvent[]
  // 場所を変更する
  changeLocation: (locationId: string) => Promise<void>
  // 場所が解放されているか確認
  isLocationUnlocked: (location: LocationData, intimacyLevel: number) => boolean
  // 季節イベントが利用可能か確認
  isSeasonalEventAvailable: (event: SeasonalEvent) => boolean
  // 新規解放された場所の通知
  newUnlocks: LocationUnlockNotification[]
  // 通知をクリア
  clearUnlockNotifications: () => void
  // データを再読み込み
  refreshLocations: () => Promise<void>
  // 読み込み中フラグ
  isLoading: boolean
  // 関係性メトリクス（互換性のため）
  relationshipMetrics?: any
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

// カスタムフック
export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider')
  }
  return context
}

// 日付が期間内かチェックする関数
const isDateInRange = (
  currentDate: [number, number], // [month, day]
  startDate: [number, number],
  endDate: [number, number]
): boolean => {
  const current = currentDate[0] * 100 + currentDate[1]
  const start = startDate[0] * 100 + startDate[1]
  const end = endDate[0] * 100 + endDate[1]
  
  // 年またぎの場合（例：12/20 - 1/10）
  if (start > end) {
    return current >= start || current <= end
  }
  
  return current >= start && current <= end
}

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const { relationshipMetrics } = useRelationshipMetrics()
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [availableLocations, setAvailableLocations] = useState<LocationData[]>([])
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>([])
  const [newUnlocks, setNewUnlocks] = useState<LocationUnlockNotification[]>([])
  const [previousUnlocks, setPreviousUnlocks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 季節イベントが利用可能かチェック
  const isSeasonalEventAvailable = useCallback((event: SeasonalEvent): boolean => {
    // availablePeriodがない場合は常に利用可能
    if (!event.availablePeriod) {
      return true
    }
    
    // ユーザーのタイムゾーンを取得（今はJSTを仮定）
    const userTimezone = 'Asia/Tokyo'
    const now = new Date()
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
    const month = userDate.getMonth() + 1
    const day = userDate.getDate()
    
    const [startMonth, startDay] = event.availablePeriod.start.split('-').map(Number)
    const [endMonth, endDay] = event.availablePeriod.end.split('-').map(Number)
    
    return isDateInRange([month, day], [startMonth, startDay], [endMonth, endDay])
  }, [])

  // 場所が解放されているかチェック
  const isLocationUnlocked = useCallback((location: LocationData, intimacyLevel: number): boolean => {
    const result = intimacyLevel >= location.unlockIntimacy
    console.log(`[LocationContext] isLocationUnlocked: ${location.name} - current: ${intimacyLevel}, required: ${location.unlockIntimacy}, result: ${result}`)
    return result
  }, [])

  // 全場所データを取得
  const fetchLocations = useCallback(async () => {
    console.log('[LocationContext] fetchLocations called, user:', user)
    if (!user) {
      console.log('[LocationContext] No user found, skipping fetch')
      return
    }
    
    try {
      setIsLoading(true)
      
      // パートナー情報を取得
      console.log('[LocationContext] Fetching partner info...')
      let partnerResponse
      try {
        partnerResponse = await partnersApiService.getPartner()
        console.log('[LocationContext] Partner response:', partnerResponse)
      } catch (partnerError) {
        console.log('[LocationContext] Partner API error (expected for new users):', partnerError)
        // 新規ユーザーの場合は認証エラーやパートナー未作成エラーが正常
        return
      }
      
      if (!partnerResponse.success || !partnerResponse.data) {
        console.log('[LocationContext] No partner found, skipping location fetch')
        // パートナーが存在しない場合は処理をスキップ
        return
      }
      
      const partner = partnerResponse.data
      
      // 関係性メトリクスはRelationshipMetricsContextから取得
      
      // 場所データを取得
      console.log('[LocationContext] Fetching locations data...')
      const locationsData = await locationsApi.getAllLocations()
      console.log('[LocationContext] Locations data received:', locationsData)
      setAvailableLocations(locationsData.locations || [])
      setSeasonalEvents(locationsData.seasonalEvents || [])
      
      // デフォルトは自宅（パートナーオブジェクトにはcurrentLocationIdが含まれていないため）
      const defaultLocation = locationsData.locations.find(l => l.id === 'home_living')
      if (defaultLocation) {
        console.log('[LocationContext] Setting default location to:', defaultLocation)
        setCurrentLocation(defaultLocation)
        // 初回設定時のみlocation APIを呼び出し（必要に応じて）
        // await locationsApi.updateCurrentLocation(partner.id, 'home_living')
      }
      
      // 解放済み場所を記録（メトリクスが取得できた場合のみ）
      if (relationshipMetrics) {
        const unlockedLocationIds = locationsData.locations
          .filter(loc => isLocationUnlocked(loc, relationshipMetrics.intimacyLevel))
          .map(loc => loc.id)
        setPreviousUnlocks(unlockedLocationIds)
      }
      
    } catch (error) {
      console.error('[LocationContext] Failed to fetch locations:', error)
    } finally {
      setIsLoading(false)
      console.log('[LocationContext] Loading complete')
    }
  }, [user, relationshipMetrics?.intimacyLevel, isLocationUnlocked])

  // 場所を変更
  const changeLocation = useCallback(async (locationId: string) => {
    console.log('[LocationContext] changeLocation called with:', locationId)
    console.log('[LocationContext] user:', user?.id)
    console.log('[LocationContext] relationshipMetrics:', relationshipMetrics)
    
    if (!user || !relationshipMetrics) {
      console.warn('[LocationContext] Missing user or relationshipMetrics')
      return
    }
    
    const location = availableLocations.find(l => l.id === locationId)
    if (!location) {
      console.warn('[LocationContext] Location not found:', locationId)
      return
    }
    
    console.log('[LocationContext] Found location:', location)
    
    // 解放チェック
    if (!isLocationUnlocked(location, relationshipMetrics.intimacyLevel)) {
      console.warn(`Location is locked: ${locationId} (required: ${location.unlockIntimacy}, current: ${relationshipMetrics.intimacyLevel})`)
      return
    }
    
    try {
      const partnerResponse = await partnersApiService.getPartner()
      if (!partnerResponse.success || !partnerResponse.data) return
      
      const partner = partnerResponse.data
      
      // バックエンドに保存
      console.log('[LocationContext] Calling updateCurrentLocation API...')
      await locationsApi.updateCurrentLocation(partner.id, locationId)
      console.log('[LocationContext] API call completed')
      
      // ローカル状態を更新
      console.log('[LocationContext] Updating local currentLocation state to:', location)
      setCurrentLocation(location)
      console.log('[LocationContext] Local state updated')
      
    } catch (error) {
      console.error('Failed to change location:', error)
    }
  }, [user, availableLocations, relationshipMetrics, isLocationUnlocked])

  // 親密度変更時の解放チェック
  useEffect(() => {
    if (!relationshipMetrics || availableLocations.length === 0) return
    
    const currentlyUnlocked = availableLocations
      .filter(loc => isLocationUnlocked(loc, relationshipMetrics.intimacyLevel))
      .map(loc => loc.id)
    
    // 新規解放をチェック
    const newlyUnlocked = currentlyUnlocked.filter(id => !previousUnlocks.includes(id))
    
    if (newlyUnlocked.length > 0) {
      const notifications = newlyUnlocked.map(id => {
        const location = availableLocations.find(l => l.id === id)!
        return {
          locationId: id,
          locationName: location.name,
          timestamp: new Date()
        }
      })
      
      setNewUnlocks(prev => [...prev, ...notifications])
      setPreviousUnlocks(currentlyUnlocked)
    }
  }, [relationshipMetrics, availableLocations, previousUnlocks, isLocationUnlocked])

  // 通知をクリア
  const clearUnlockNotifications = useCallback(() => {
    setNewUnlocks([])
  }, [])

  // データを再読み込み
  const refreshLocations = useCallback(async () => {
    await fetchLocations()
  }, [fetchLocations])

  // 初期読み込み
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const value: LocationContextType = {
    currentLocation,
    availableLocations,
    seasonalEvents,
    changeLocation,
    isLocationUnlocked,
    isSeasonalEventAvailable,
    newUnlocks,
    clearUnlockNotifications,
    refreshLocations,
    isLoading,
    relationshipMetrics
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}