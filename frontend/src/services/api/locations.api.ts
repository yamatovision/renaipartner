import { api } from './client'
import { API_PATHS, LocationData, SeasonalEvent, ID } from '@/types'

interface LocationsResponse {
  locations: LocationData[]
  seasonalEvents: SeasonalEvent[]
}

export const locationsApi = {
  // 全場所データを取得
  getAllLocations: async (): Promise<LocationsResponse> => {
    console.log('[LocationsAPI] Fetching all locations from:', API_PATHS.LOCATIONS.BASE)
    try {
      const response = await api.get<LocationsResponse>(API_PATHS.LOCATIONS.BASE)
      console.log('[LocationsAPI] Response received:', response)
      return response
    } catch (error) {
      console.error('[LocationsAPI] Failed to fetch locations:', error)
      throw error
    }
  },

  // 単一の場所を取得
  getLocationById: async (locationId: string): Promise<LocationData | null> => {
    try {
      const response = await api.get<LocationData>(`${API_PATHS.LOCATIONS.BASE}/${locationId}`)
      return response
    } catch (error) {
      console.error('Failed to fetch location:', error)
      return null
    }
  },

  // 現在地を更新
  updateCurrentLocation: async (partnerId: ID, locationId: string): Promise<void> => {
    console.log('[LocationsAPI] Updating location:', { partnerId, locationId, path: API_PATHS.LOCATIONS.SET_CURRENT })
    try {
      await api.put(API_PATHS.LOCATIONS.SET_CURRENT, {
        partnerId,
        locationId
      })
      console.log('[LocationsAPI] Location updated successfully')
    } catch (error) {
      console.error('[LocationsAPI] Failed to update current location:', error)
      throw error
    }
  },

  // 親密度に基づいて利用可能な場所を取得
  getAvailableLocations: async (intimacyLevel: number): Promise<LocationData[]> => {
    try {
      const response = await api.get<LocationData[]>(API_PATHS.LOCATIONS.AVAILABLE, {
        params: { intimacyLevel }
      })
      return response
    } catch (error) {
      console.error('Failed to fetch available locations:', error)
      throw error
    }
  },

  // 現在利用可能な季節イベントを取得
  getCurrentSeasonalEvents: async (): Promise<SeasonalEvent[]> => {
    try {
      const response = await api.get<SeasonalEvent[]>(API_PATHS.LOCATIONS.SEASONAL)
      return response
    } catch (error) {
      console.error('Failed to fetch seasonal events:', error)
      throw error
    }
  }
}