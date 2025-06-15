import { Router } from 'express'
import { LocationsController } from './locations.controller'
import { requireAuth } from '@/common/middlewares/auth.middleware'

const router = Router()

// 認証が必要なルート
router.use(requireAuth)

// 全場所データを取得（ベースパスでGETリクエスト）
router.get('/', LocationsController.getAllLocations)

// 現在利用可能な季節イベントを取得
router.get('/seasonal', LocationsController.getCurrentSeasonalEvents)

// 親密度に基づいて利用可能な場所を取得
router.get('/available', LocationsController.getAvailableLocations)

// パートナーの現在地を更新
router.put('/set-current', LocationsController.updateCurrentLocation)

// 単一の場所を取得
router.get('/:locationId', LocationsController.getLocationById)

export default router