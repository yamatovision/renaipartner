'use client'

import { useCallback } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import { useBackground } from '@/hooks/useBackground'

/**
 * 場所と背景の連携を管理するカスタムフック
 */
export const useLocationBackground = () => {
  const { currentLocation } = useLocation()
  const { 
    currentBackground, 
    availableBackgrounds, 
    changeBackground, 
    getBackgroundById 
  } = useBackground()

  /**
   * 場所に基づいて背景を自動選択
   */
  const changeBackgroundForLocation = useCallback(async (locationId: string) => {
    if (!availableBackgrounds || availableBackgrounds.length === 0) {
      console.warn('利用可能な背景がありません')
      return
    }

    // 場所IDに対応する背景IDのマッピング
    const locationBackgroundMap: Record<string, string> = {
      // 通常の場所
      'school_classroom': 'school_classroom',
      'cafe': 'cafe',
      'beach': 'beach',
      'office': 'office',
      'home': 'home',
      'park': 'park',
      'museum': 'museum',
      'amusement_park': 'amusement_park',
      'gym': 'gym',
      'restaurant': 'restaurant',
      'karaoke': 'karaoke',
      'night_view': 'night_view',
      'hot_spring': 'hot_spring',
      'luxury_hotel': 'luxury_hotel',
      
      // 季節イベント
      'cherry_blossom': 'cherry_blossom',
      'fireworks_festival': 'fireworks_festival',
      'summer_festival': 'summer_festival',
      'halloween': 'halloween',
      'autumn_leaves': 'autumn_leaves',
      'christmas': 'christmas',
      'new_year_shrine': 'new_year_shrine',
      'valentine': 'valentine',
      'ski_resort': 'ski_resort'
    }

    const targetBackgroundId = locationBackgroundMap[locationId]
    if (!targetBackgroundId) {
      console.warn(`場所 ${locationId} に対応する背景が見つかりません`)
      return
    }

    // 背景が存在するか確認
    const targetBackground = getBackgroundById(targetBackgroundId)
    if (!targetBackground) {
      console.warn(`背景 ${targetBackgroundId} が見つかりません`)
      return
    }

    // 現在の背景と同じ場合はスキップ
    if (currentBackground?.id === targetBackgroundId) {
      console.log(`背景 ${targetBackgroundId} は既に設定されています`)
      return
    }

    try {
      await changeBackground(targetBackgroundId)
      console.log(`場所 ${locationId} に対応する背景 ${targetBackgroundId} に変更しました`)
    } catch (error) {
      console.error('背景変更エラー:', error)
    }
  }, [availableBackgrounds, changeBackground, getBackgroundById, currentBackground])

  /**
   * 現在の場所に応じた背景変更を自動実行
   */
  const syncBackgroundWithLocation = useCallback(async () => {
    if (!currentLocation) {
      console.log('現在地が設定されていません')
      return
    }

    await changeBackgroundForLocation(currentLocation.id)
  }, [currentLocation, changeBackgroundForLocation])

  return {
    currentLocation,
    currentBackground,
    changeBackgroundForLocation,
    syncBackgroundWithLocation
  }
}