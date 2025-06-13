import { Router } from 'express';
import MemoryController from './memory.controller';
import { requireAuth } from '@/common/middlewares/auth.middleware';
import { memoryValidators, handleValidationErrors } from './memory.validator';

const router = Router();
const memoryController = new MemoryController();

/**
 * メモリシステム機能のルート定義
 * 全てのエンドポイントに認証が必要
 * MemGPT型階層メモリシステムによる高度なメモリ管理
 */

// ===== メモリ作成・管理 =====

/**
 * 会話要約作成
 * POST /api/memory/summary
 * 
 * メッセージ群から重要な記憶を抽出してMemoryとして保存
 * OpenAI APIを使用してインテリジェントな要約・記憶抽出を実行
 */
router.post('/summary',
  [
    requireAuth,
    ...memoryValidators.createSummary,
    handleValidationErrors
  ],
  memoryController.createSummary.bind(memoryController) as any
);

// ===== メモリ検索・取得 =====

/**
 * メモリ検索
 * POST /api/memory/search
 * 
 * ベクトル検索とキーワード検索を組み合わせた高度な検索
 * OpenAI Embeddingsを使用したセマンティック検索対応
 */
router.post('/search',
  [
    requireAuth,
    ...memoryValidators.searchMemories,
    handleValidationErrors
  ],
  memoryController.searchMemories.bind(memoryController) as any
);

/**
 * エピソード記憶取得
 * GET /api/memory/episodes/:partnerId
 * 
 * 重要な出来事や体験のエピソード記憶を取得
 * フィルタリング：感情重み、タグ、日付範囲、参加者
 */
router.get('/episodes/:partnerId',
  [
    requireAuth,
    ...memoryValidators.getEpisodes,
    handleValidationErrors
  ],
  memoryController.getEpisodes.bind(memoryController) as any
);

/**
 * 関係性メトリクス取得
 * GET /api/memory/relationships/:partnerId
 * 
 * 親密度、信頼度、感情接続等の関係性指標を取得
 * 関係性の段階（stranger, acquaintance, friend, close_friend, intimate）を判定
 */
router.get('/relationships/:partnerId',
  [
    requireAuth,
    ...memoryValidators.getRelationships,
    handleValidationErrors
  ],
  memoryController.getRelationshipMetrics.bind(memoryController) as any
);

/**
 * 継続話題取得
 * GET /api/memory/topics/:partnerId
 * 
 * 会話で継続している話題を抽出・分類
 * ステータス：active（活発）、dormant（休眠）、resolved（解決済み）
 */
router.get('/topics/:partnerId',
  [
    requireAuth,
    ...memoryValidators.getTopics,
    handleValidationErrors
  ],
  memoryController.getOngoingTopics.bind(memoryController) as any
);

// ===== AI主導エンゲージメント連携 =====

/**
 * 質問回答からメモリ抽出・更新（API 6.6）
 * POST /api/memory/extract-from-response
 * 
 * AI主導質問の回答から重要な情報を自動抽出
 * 親密度の動的更新と戦略的メモリ構築
 * リアルタイム関係性メトリクス連動
 */
router.post('/extract-from-response',
  [
    requireAuth,
    ...memoryValidators.extractFromResponse,
    handleValidationErrors
  ],
  memoryController.extractFromResponse.bind(memoryController) as any
);

// ===== 分析・統計 =====

/**
 * メモリ統計取得（デバッグ・分析用）
 * GET /api/memory/stats/:partnerId
 * 
 * メモリシステムの統計情報を取得
 * 開発・デバッグ・パフォーマンス分析用途
 */
router.get('/stats/:partnerId',
  [
    requireAuth,
    ...memoryValidators.partnerIdParam,
    handleValidationErrors
  ],
  memoryController.getMemoryStats.bind(memoryController) as any
);

// ===== エラーハンドリング =====

/**
 * 404 エラーハンドリング
 * 存在しないメモリAPIエンドポイントへのアクセス
 */
router.all('*', (req, res) => {
  console.warn(`[Memory.routes] 存在しないエンドポイントへのアクセス: ${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    error: 'エンドポイントが見つかりません',
    availableEndpoints: [
      'POST /api/memory/summary - 会話要約作成',
      'POST /api/memory/search - メモリ検索',
      'POST /api/memory/extract-from-response - QA情報抽出・更新',
      'GET /api/memory/episodes/:partnerId - エピソード記憶取得',
      'GET /api/memory/relationships/:partnerId - 関係性メトリクス取得',
      'GET /api/memory/topics/:partnerId - 継続話題取得',
      'GET /api/memory/stats/:partnerId - メモリ統計取得'
    ]
  });
});

export default router;