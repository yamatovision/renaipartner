import { LocationData, SeasonalEvent, ID } from '@/types'
import { locationsData, seasonalEventsData, allLocations } from './locations-data'
import { PartnerModel } from '@/db/models/Partner.model'
import { RelationshipMetricsModel } from '@/db/models/RelationshipMetrics.model'

export class LocationsService {
  // 全場所データを取得
  static async getAllLocations(): Promise<{ locations: LocationData[], seasonalEvents: SeasonalEvent[] }> {
    const result = {
      locations: locationsData,
      seasonalEvents: seasonalEventsData
    }
    // 詳細な場所データのログ出力を削除（ログが長すぎるため）
    // console.log('[LocationsService] Returning:', result)
    return result
  }

  // 単一の場所を取得
  static async getLocationById(locationId: string): Promise<LocationData | null> {
    const location = allLocations.find(loc => loc.id === locationId)
    return location || null
  }

  // 親密度に基づいて利用可能な場所を取得
  static async getAvailableLocations(intimacyLevel: number): Promise<LocationData[]> {
    return locationsData.filter(location => intimacyLevel >= location.unlockIntimacy)
  }

  // 現在利用可能な季節イベントを取得
  static async getCurrentSeasonalEvents(): Promise<SeasonalEvent[]> {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    
    return seasonalEventsData.filter(event => {
      // availablePeriodがない場合は常に利用可能
      if (!event.availablePeriod) {
        return true
      }
      
      const [startMonth, startDay] = event.availablePeriod.start.split('-').map(Number)
      const [endMonth, endDay] = event.availablePeriod.end.split('-').map(Number)
      
      return this.isDateInRange([month, day], [startMonth, startDay], [endMonth, endDay])
    })
  }

  // パートナーの現在地を更新
  static async updatePartnerLocation(partnerId: ID, locationId: string): Promise<void> {
    // 場所が存在するか確認
    const location = await this.getLocationById(locationId)
    if (!location) {
      throw new Error('指定された場所が見つかりません')
    }

    // パートナーの親密度を確認（存在しない場合は作成）
    let metrics = await RelationshipMetricsModel.findByPartnerId(partnerId)
    if (!metrics) {
      // 関係性メトリクスが見つからないため作成
      // デフォルトメトリクスを作成
      metrics = await RelationshipMetricsModel.create(partnerId)
      // メトリクス作成完了
    }

    // 場所が解放されているか確認
    if (metrics.intimacyLevel < location.unlockIntimacy) {
      // 親密度不足
      throw new Error(`この場所はまだ解放されていません。必要な親密度: ${location.unlockIntimacy}`)
    }
    
    // 親密度チェックOK

    // パートナーの現在地を更新
    const updateSuccess = await PartnerModel.updateCurrentLocation(partnerId, locationId)
    if (!updateSuccess) {
      throw new Error('パートナーの現在地更新に失敗しました')
    }
    // Partner location updated
  }

  // 場所に応じた服装を取得
  static async getLocationClothing(locationId: string): Promise<string | null> {
    const location = await this.getLocationById(locationId)
    return location ? location.clothing : null
  }

  // 新規解放された場所をチェック
  static async checkNewUnlocks(partnerId: ID, previousIntimacy: number, currentIntimacy: number): Promise<LocationData[]> {
    if (currentIntimacy <= previousIntimacy) return []

    const previouslyAvailable = await this.getAvailableLocations(previousIntimacy)
    const currentlyAvailable = await this.getAvailableLocations(currentIntimacy)

    const previousIds = new Set(previouslyAvailable.map(loc => loc.id))
    return currentlyAvailable.filter(loc => !previousIds.has(loc.id))
  }

  // 日付が期間内かチェックするヘルパー関数
  private static isDateInRange(
    currentDate: [number, number],
    startDate: [number, number],
    endDate: [number, number]
  ): boolean {
    const current = currentDate[0] * 100 + currentDate[1]
    const start = startDate[0] * 100 + startDate[1]
    const end = endDate[0] * 100 + endDate[1]
    
    // 年またぎの場合
    if (start > end) {
      return current >= start || current <= end
    }
    
    return current >= start && current <= end
  }

  // 場所の詳細情報を含むプロンプト生成用データを取得
  static async getLocationPromptData(locationId: string, gender: 'boyfriend' | 'girlfriend'): Promise<{
    location: LocationData
    clothingPrompt: string
    contextPrompt: string
  } | null> {
    const location = await this.getLocationById(locationId)
    if (!location) return null

    // 服装プロンプトの生成（後で実装）
    const clothingPrompt = this.generateClothingPrompt(location.clothing, gender)
    
    // コンテキストプロンプトの生成
    const contextPrompt = `
現在の場所: ${location.name}
雰囲気: ${location.description}
${location.appealPoint}
時間帯: ${this.getTimeOfDayDescription(location.timeOfDay || 'afternoon')}
    `.trim()

    return {
      location,
      clothingPrompt,
      contextPrompt
    }
  }

  // 服装プロンプトを生成（仮実装）
  private static generateClothingPrompt(clothingStyle: string, gender: 'boyfriend' | 'girlfriend'): string {
    // 実際のプロンプトはlocation-clothing-prompt-mapping.mdに基づいて実装
    return `wearing ${clothingStyle} style clothing`
  }

  // 時間帯の説明を取得
  private static getTimeOfDayDescription(timeOfDay: string): string {
    const descriptions: Record<string, string> = {
      morning: '爽やかな朝の時間',
      afternoon: '穏やかな午後のひととき',
      evening: '夕暮れ時の美しい時間',
      night: '静かでロマンチックな夜'
    }
    return descriptions[timeOfDay] || '穏やかな時間'
  }
}