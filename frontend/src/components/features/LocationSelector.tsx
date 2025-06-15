'use client'

import React, { useState } from 'react'
import { LocationData, SeasonalEvent } from '@/types'
import { useLocation } from '@/contexts/LocationContext'
import { useRelationshipMetrics } from '@/contexts/RelationshipMetricsContext'
import { useAuth } from '@/contexts/AuthContext'

interface LocationSelectorProps {
  isOpen: boolean
  onClose: () => void
  onLocationChange: (locationId: string) => void
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationChange
}) => {
  const { user } = useAuth()
  const {
    currentLocation,
    availableLocations,
    seasonalEvents,
    changeLocation,
    isLocationUnlocked,
    isSeasonalEventAvailable,
    isLoading
  } = useLocation()
  
  const { relationshipMetrics } = useRelationshipMetrics()

  const [selectedCategory, setSelectedCategory] = useState<'normal' | 'seasonal'>('normal')

  // 実際の親密度を取得
  const intimacyLevel = relationshipMetrics?.intimacyLevel || 0
  console.log('[LocationSelector] Current intimacy level:', intimacyLevel)

  if (!isOpen) return null

  const handleLocationSelect = async (locationId: string) => {
    console.log('[LocationSelector] handleLocationSelect called with:', locationId)
    try {
      console.log('[LocationSelector] Calling changeLocation...')
      await changeLocation(locationId)
      console.log('[LocationSelector] changeLocation completed')
      onLocationChange(locationId)
      onClose()
    } catch (error) {
      console.error('[LocationSelector] 場所変更エラー:', error)
    }
  }

  const normalLocations = availableLocations.filter(location => !location.isSeasonalEvent)
  const seasonalLocations = seasonalEvents.filter(event => isSeasonalEventAvailable(event))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">場所を選択</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* 現在の場所表示 */}
          {currentLocation && (
            <div className="mt-2 text-sm text-gray-600">
              現在地: <span className="font-medium">{currentLocation.name}</span>
            </div>
          )}
        </div>

        {/* カテゴリ選択 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('normal')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'normal'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              通常の場所
            </button>
            <button
              onClick={() => setSelectedCategory('seasonal')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'seasonal'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              季節イベント ({seasonalLocations.length})
            </button>
          </div>
        </div>

        {/* 場所一覧 */}
        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">読み込み中...</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {selectedCategory === 'normal' ? (
                normalLocations.length > 0 ? (
                  normalLocations.map((location) => {
                    const isUnlocked = isLocationUnlocked(location, intimacyLevel)
                    const isCurrent = currentLocation?.id === location.id
                    
                    console.log(`[LocationSelector] ${location.name} (${location.id}): required=${location.unlockIntimacy}, current=${intimacyLevel}, unlocked=${isUnlocked}`)
                    
                    return (
                      <button
                        key={location.id}
                        onClick={() => isUnlocked && handleLocationSelect(location.id)}
                        disabled={!isUnlocked}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          isCurrent
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                            : isUnlocked
                            ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                            : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{location.emoji}</span>
                              <span className={`font-medium ${
                                isUnlocked ? 'text-gray-800' : 'text-gray-500'
                              }`}>
                                {location.name}
                              </span>
                              {isCurrent && (
                                <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                                  現在地
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${
                              isUnlocked ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {location.description}
                            </p>
                          </div>
                          <div className="text-right">
                            {!isUnlocked && (
                              <div className="text-xs text-gray-500">
                                <div>🔒</div>
                                <div>親密度{location.unlockIntimacy}%必要</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>利用可能な場所がありません</p>
                  </div>
                )
              ) : (
                seasonalLocations.length > 0 ? (
                  seasonalLocations.map((event) => {
                    const isCurrent = currentLocation?.id === event.id
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleLocationSelect(event.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          isCurrent
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{event.emoji}</span>
                              <span className="font-medium text-gray-800">{event.name}</span>
                              {isCurrent && (
                                <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                                  現在地
                                </span>
                              )}
                              <span className="text-xs bg-gradient-to-r from-orange-400 to-red-400 text-white px-2 py-1 rounded-full">
                                期間限定
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            {event.availablePeriod && (
                              <p className="text-xs text-orange-600 mt-1">
                                期間: {event.availablePeriod.start} 〜 {event.availablePeriod.end}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>現在利用可能な季節イベントはありません</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}