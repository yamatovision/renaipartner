'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { LocationData, RelationshipMetrics, SeasonalEvent, ID } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { partnersApiService } from '@/services/api/partners.api'
import { locationsApi } from '@/services/api/locations.api'
import { memoryApiService } from '@/services/api/memory.api'

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
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [availableLocations, setAvailableLocations] = useState<LocationData[]>([])
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalEvent[]>([])
  const [newUnlocks, setNewUnlocks] = useState<LocationUnlockNotification[]>([])
  const [previousUnlocks, setPreviousUnlocks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [relationshipMetrics, setRelationshipMetrics] = useState<RelationshipMetrics | null>(null)

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
    return intimacyLevel >= location.unlockIntimacy
  }, [])

  // 全場所データを取得
  const fetchLocations = useCallback(async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
      // パートナー情報を取得
      const partnerResponse = await partnersApiService.getPartner()
      if (!partnerResponse.success || !partnerResponse.data) return
      
      const partner = partnerResponse.data
      
      // 関係性メトリクスを取得
      const metricsResponse = await memoryApiService.getRelationshipMetrics(partner.id)
      if (metricsResponse.success && metricsResponse.data) {
        setRelationshipMetrics(metricsResponse.data)
      }
      
      // 場所データを取得
      const locationsData = await locationsApi.getAllLocations()
      setAvailableLocations(locationsData.locations)
      setSeasonalEvents(locationsData.seasonalEvents)
      
      // デフォルトは教室（パートナーオブジェクトにはcurrentLocationIdが含まれていないため）
      const defaultLocation = locationsData.locations.find(l => l.id === 'school_classroom')
      if (defaultLocation) {
        setCurrentLocation(defaultLocation)
        // 初回設定時のみlocation APIを呼び出し（必要に応じて）
        // await locationsApi.updateCurrentLocation(partner.id, 'school_classroom')
      }
      
      // 解放済み場所を記録（メトリクスが取得できた場合のみ）
      if (metricsResponse.success && metricsResponse.data) {
        const metrics = metricsResponse.data
        const unlockedLocationIds = locationsData.locations
          .filter(loc => isLocationUnlocked(loc, metrics.intimacyLevel))
          .map(loc => loc.id)
        setPreviousUnlocks(unlockedLocationIds)
      }
      
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isLocationUnlocked])

  // 場所を変更
  const changeLocation = useCallback(async (locationId: string) => {
    if (!user || !relationshipMetrics) return
    
    const location = availableLocations.find(l => l.id === locationId)
    if (!location) return
    
    // 解放チェック
    if (!isLocationUnlocked(location, relationshipMetrics.intimacyLevel)) {
      console.warn('Location is locked:', locationId)
      return
    }
    
    try {
      const partnerResponse = await partnersApiService.getPartner()
      if (!partnerResponse.success || !partnerResponse.data) return
      
      const partner = partnerResponse.data
      
      // バックエンドに保存
      await locationsApi.updateCurrentLocation(partner.id, locationId)
      
      // ローカル状態を更新
      setCurrentLocation(location)
      
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
    isLoading
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}