import { Request, Response } from 'express'
import { LocationsService } from './locations.service'

export class LocationsController {
  // 全場所データを取得
  static async getAllLocations(req: Request, res: Response) {
    try {
      const data = await LocationsService.getAllLocations()
      return res.json(data)
    } catch (error) {
      console.error('[Locations.controller] Error getting all locations:', error)
      return res.status(500).json({ error: '場所データの取得に失敗しました' })
    }
  }

  // 単一の場所を取得
  static async getLocationById(req: Request, res: Response) {
    try {
      const { locationId } = req.params
      const location = await LocationsService.getLocationById(locationId)
      
      if (!location) {
        return res.status(404).json({ success: false, error: '場所が見つかりません' })
      }
      
      return res.json({ success: true, data: location })
    } catch (error) {
      console.error('[Locations.controller] Error getting location:', error)
      return res.status(500).json({ success: false, error: '場所データの取得に失敗しました' })
    }
  }

  // 親密度に基づいて利用可能な場所を取得
  static async getAvailableLocations(req: Request, res: Response) {
    try {
      const intimacyLevel = parseInt(req.query.intimacyLevel as string) || 0
      const locations = await LocationsService.getAvailableLocations(intimacyLevel)
      return res.json({ success: true, data: locations })
    } catch (error) {
      console.error('[Locations.controller] Error getting available locations:', error)
      return res.status(500).json({ success: false, error: '利用可能な場所の取得に失敗しました' })
    }
  }

  // 現在利用可能な季節イベントを取得
  static async getCurrentSeasonalEvents(req: Request, res: Response) {
    try {
      const events = await LocationsService.getCurrentSeasonalEvents()
      return res.json(events)
    } catch (error) {
      console.error('[Locations.controller] Error getting seasonal events:', error)
      return res.status(500).json({ error: '季節イベントの取得に失敗しました' })
    }
  }

  // パートナーの現在地を更新
  static async updateCurrentLocation(req: Request, res: Response) {
    try {
      const { partnerId, locationId } = req.body
      
      if (!partnerId || !locationId) {
        return res.status(400).json({ error: 'パートナーIDと場所IDが必要です' })
      }
      
      await LocationsService.updatePartnerLocation(partnerId, locationId)
      return res.json({ success: true })
    } catch (error: any) {
      console.error('[Locations.controller] Error updating location:', error)
      
      if (error.message.includes('解放されていません')) {
        return res.status(403).json({ error: error.message })
      }
      
      return res.status(500).json({ error: '場所の更新に失敗しました' })
    }
  }
}