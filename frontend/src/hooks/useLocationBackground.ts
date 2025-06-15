'use client'

import { useCallback } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import { useBackground } from '@/hooks/useBackground'
import { debugPoolBackground } from '@/debug/testPoolBackground'

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
    // バックエンドのlocation-background-map.tsに完全に一致させる
    const locationBackgroundMap: Record<string, string> = {
      // 通常の場所
      'school_classroom': 'school_classroom',
      'cafe': 'cafe',
      'beach': 'beach',
      'office': 'office',
      'school_library': 'school_library',
      'park': 'park',
      'museum': 'museum',
      'amusement_park': 'amusement_park',
      'pool': 'pool',
      'gym': 'gym',
      'restaurant': 'restaurant',
      'karaoke': 'karaoke',
      'spa': 'spa',
      'jewelry_shop': 'jewelry_shop',
      'camping': 'camping',
      'jazz_bar': 'jazz_bar',
      'sports_bar': 'sports_bar',
      'home_living': 'home_living',
      'night_view': 'night_view',
      'private_beach_sunset': 'private_beach_sunset',
      'bedroom_night': 'bedroom_night',
      'onsen': 'onsen',
      'luxury_hotel': 'luxury_hotel',
      
      // 季節イベント
      'cherry_blossoms': 'cherry_blossoms',
      'fireworks_festival': 'fireworks_festival',
      'summer_festival': 'summer_festival',
      'beach_house': 'beach_house',
      'autumn_leaves': 'autumn_leaves',
      'halloween_party': 'halloween_party',
      'christmas_illumination': 'christmas_illumination',
      'christmas_party': 'christmas_party',
      'new_year_shrine': 'new_year_shrine',
      'valentine_date': 'valentine_date',
      'ski_resort': 'ski_resort'
    }

    const targetBackgroundId = locationBackgroundMap[locationId]
    if (!targetBackgroundId) {
      console.warn(`場所 ${locationId} に対応する背景が見つかりません`)
      return
    }

    // 時間帯に応じた背景選択（バックエンドのロジックと同様）
    const currentHour = new Date().getHours()
    let timeOfDaySuffix = 'afternoon' // デフォルト
    
    if (currentHour >= 6 && currentHour < 12) {
      timeOfDaySuffix = 'morning'
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDaySuffix = 'afternoon'
    } else if (currentHour >= 17 && currentHour < 21) {
      timeOfDaySuffix = 'evening'
    } else {
      timeOfDaySuffix = 'night'
    }

    // デバッグログ追加
    console.log('背景変更リクエスト - 場所ID:', locationId)
    console.log('マッピングされた背景ID:', targetBackgroundId)
    console.log('利用可能な背景リスト:', availableBackgrounds)
    console.log('利用可能な背景ID一覧:', availableBackgrounds.map(bg => bg.id))
    
    // Pool背景の詳細デバッグ
    if (locationId === 'pool') {
      debugPoolBackground(availableBackgrounds)
    }
    
    // その場所で利用可能な背景を全て取得
    const availableBackgroundsForLocation = availableBackgrounds.filter(bg => {
      // 完全一致または "_時間帯" で始まる背景をマッチ
      const exactMatch = bg.id === targetBackgroundId
      const prefixMatch = bg.id.startsWith(`${targetBackgroundId}_`)
      const isMatch = exactMatch || prefixMatch
      console.log(`背景ID確認: ${bg.id} - 完全一致: ${exactMatch}, プリフィックス一致: ${prefixMatch}, 結果: ${isMatch}`)
      return isMatch
    })
    
    if (availableBackgroundsForLocation.length === 0) {
      console.warn(`場所 ${locationId} に対応する背景が見つかりません`)
      console.warn('探していた背景パターン:', `${targetBackgroundId}_`)
      console.warn('poolで始まる背景:', availableBackgrounds.filter(bg => bg.id.includes('pool')))
      return
    }

    // 時間帯に最適な背景を探す
    console.log('時間帯による背景選択:', `${targetBackgroundId}_${timeOfDaySuffix}`)
    
    let targetBackground = availableBackgroundsForLocation.find(bg => 
      bg.id === `${targetBackgroundId}_${timeOfDaySuffix}`
    )
    
    // 時間帯付きが見つからない場合は、完全一致（時間帯なし）を探す
    if (!targetBackground) {
      targetBackground = availableBackgroundsForLocation.find(bg => 
        bg.id === targetBackgroundId
      )
      if (targetBackground) {
        console.log('時間帯なしの背景を使用:', targetBackground.id)
      }
    }
    
    // それでも見つからない場合は利用可能な最初の背景を使用
    if (!targetBackground) {
      targetBackground = availableBackgroundsForLocation[0]
      console.log('デフォルト背景を使用:', targetBackground?.id)
    }
    
    const finalBackgroundId = targetBackground.id

    // 現在の背景と同じ場合はスキップ
    if (currentBackground?.id === finalBackgroundId) {
      console.log(`背景 ${finalBackgroundId} は既に設定されています`)
      return
    }

    try {
      await changeBackground(finalBackgroundId)
      console.log(`場所 ${locationId} に対応する背景 ${finalBackgroundId} に変更しました`)
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