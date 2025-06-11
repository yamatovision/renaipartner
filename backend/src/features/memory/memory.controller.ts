import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import MemoryService from './memory.service';
import { AuthRequest } from '@/common/middlewares/auth.middleware';
import { ApiResponse, ID } from '@/types';

export class MemoryController {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
  }

  /**
   * 会話要約作成
   * POST /api/memory/summary
   */
  async createSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const { partnerId, messageIds, summaryType } = req.body;

      console.log(`[${new Date().toISOString()}] ▶️ 会話要約作成開始 - ユーザー: ${userId}, パートナー: ${partnerId}, メッセージ数: ${messageIds.length}`);

      // パートナーの所有者確認は MemoryService 内で実施
      const result = await this.memoryService.createSummary({
        partnerId,
        messageIds,
        summaryType
      });

      console.log(`[${new Date().toISOString()}] ✅ 会話要約作成完了 - 作成メモリ数: ${result.memoriesCreated.length}`);

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.memoriesCreated.length}件のメモリを作成しました`
      } as ApiResponse<typeof result>);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ 会話要約作成エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '会話要約の作成中にエラーが発生しました'
      });
    }
  }

  /**
   * メモリ検索
   * POST /api/memory/search
   */
  async searchMemories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const { partnerId, query, memoryTypes, limit, minImportance } = req.body;

      console.log(`[${new Date().toISOString()}] ▶️ メモリ検索開始 - ユーザー: ${userId}, クエリ: "${query}"`);

      const result = await this.memoryService.searchMemories({
        partnerId,
        query,
        memoryTypes,
        limit,
        minImportance
      });

      console.log(`[${new Date().toISOString()}] ✅ メモリ検索完了 - 結果数: ${result.results.length}/${result.totalFound}`);

      res.status(200).json({
        success: true,
        data: result,
        message: `${result.results.length}件のメモリが見つかりました`
      } as ApiResponse<typeof result>);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ メモリ検索エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'メモリ検索中にエラーが発生しました'
      });
    }
  }

  /**
   * エピソード記憶取得
   * GET /api/memory/episodes/:partnerId
   */
  async getEpisodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const partnerId = req.params.partnerId as ID;
      const { 
        limit = 20, 
        minEmotionalWeight, 
        tags, 
        startDate, 
        endDate 
      } = req.query;

      console.log(`[${new Date().toISOString()}] ▶️ エピソード記憶取得開始 - ユーザー: ${userId}, パートナー: ${partnerId}`);

      // クエリパラメータの型変換
      const options: any = {
        limit: limit ? parseInt(limit as string) : 20
      };

      if (minEmotionalWeight) {
        options.minEmotionalWeight = parseFloat(minEmotionalWeight as string);
      }

      if (tags) {
        options.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }

      if (startDate) {
        options.startDate = new Date(startDate as string);
      }

      if (endDate) {
        options.endDate = new Date(endDate as string);
      }

      const episodes = await this.memoryService.getEpisodes(partnerId, options);

      console.log(`[${new Date().toISOString()}] ✅ エピソード記憶取得完了 - 件数: ${episodes.length}`);

      res.status(200).json({
        success: true,
        data: episodes,
        message: `${episodes.length}件のエピソード記憶を取得しました`
      } as ApiResponse<typeof episodes>);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ エピソード記憶取得エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'エピソード記憶の取得中にエラーが発生しました'
      });
    }
  }

  /**
   * 関係性メトリクス取得
   * GET /api/memory/relationships/:partnerId
   */
  async getRelationshipMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const partnerId = req.params.partnerId as ID;
      const { includeHistory, period } = req.query;

      console.log(`[${new Date().toISOString()}] ▶️ 関係性メトリクス取得開始 - ユーザー: ${userId}, パートナー: ${partnerId}`);

      const options: any = {};
      
      if (includeHistory !== undefined) {
        options.includeHistory = includeHistory === 'true';
      }
      
      if (period) {
        options.period = period as string;
      }

      const result = await this.memoryService.getRelationshipMetrics(partnerId, options);

      console.log(`[${new Date().toISOString()}] ✅ 関係性メトリクス取得完了 - Stage: ${result.stage}`);

      res.status(200).json({
        success: true,
        data: result,
        message: '関係性メトリクスを取得しました'
      } as ApiResponse<typeof result>);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ 関係性メトリクス取得エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '関係性メトリクスの取得中にエラーが発生しました'
      });
    }
  }

  /**
   * 継続話題取得
   * GET /api/memory/topics/:partnerId
   */
  async getOngoingTopics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.userId;
      const partnerId = req.params.partnerId as ID;
      const { limit, status, minImportance } = req.query;

      console.log(`[${new Date().toISOString()}] ▶️ 継続話題取得開始 - ユーザー: ${userId}, パートナー: ${partnerId}`);

      const options: any = {};
      
      if (limit) {
        options.limit = parseInt(limit as string);
      }
      
      if (status) {
        options.status = status as string;
      }
      
      if (minImportance) {
        options.minImportance = parseFloat(minImportance as string);
      }

      const topics = await this.memoryService.getOngoingTopics(partnerId, options);

      console.log(`[${new Date().toISOString()}] ✅ 継続話題取得完了 - 話題数: ${topics.length}`);

      res.status(200).json({
        success: true,
        data: topics,
        message: `${topics.length}件の継続話題を取得しました`
      } as ApiResponse<typeof topics>);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ 継続話題取得エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '継続話題の取得中にエラーが発生しました'
      });
    }
  }

  /**
   * メモリ統計取得（デバッグ・分析用エンドポイント）
   * GET /api/memory/stats/:partnerId
   */
  async getMemoryStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const partnerId = req.params.partnerId as ID;

      console.log(`[${new Date().toISOString()}] ▶️ メモリ統計取得開始 - ユーザー: ${userId}, パートナー: ${partnerId}`);

      // 実装内容をシンプルにするため、ここでは基本統計のみ
      const stats = {
        partnerId,
        timestamp: new Date(),
        note: 'メモリ統計機能は今後の拡張機能として実装予定です'
      };

      console.log(`[${new Date().toISOString()}] ✅ メモリ統計取得完了`);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'メモリ統計を取得しました'
      } as ApiResponse<typeof stats>);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ メモリ統計取得エラー:`, error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'メモリ統計の取得中にエラーが発生しました'
      });
    }
  }
}

export default MemoryController;