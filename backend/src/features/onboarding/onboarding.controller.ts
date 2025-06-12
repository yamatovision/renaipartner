import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { onboardingService } from './onboarding.service';
import { ApiResponse } from '../../types';

/**
 * オンボーディングコントローラー
 */
export class OnboardingController {
  /**
   * オンボーディング開始
   * POST /api/onboarding/start
   */
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const userId = req.user!.userId;
      const progress = await onboardingService.startOnboarding(userId);

      const response: ApiResponse<{ progress: typeof progress }> = {
        success: true,
        data: { progress },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 進捗状況取得
   * GET /api/onboarding/progress
   */
  async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const userId = req.user!.userId;
      const progress = await onboardingService.getProgress(userId);

      const response: ApiResponse<{ progress: typeof progress }> = {
        success: true,
        data: { progress },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 進捗更新
   * PUT /api/onboarding/progress
   */
  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[OnboardingController] Validation errors:', errors.array());
        console.log('[OnboardingController] Request body:', req.body);
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const userId = req.user!.userId;
      const updateData = req.body;

      const progress = await onboardingService.updateProgress(userId, updateData);

      const response: ApiResponse<{ progress: typeof progress }> = {
        success: true,
        data: { progress },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * オンボーディング完了
   * POST /api/onboarding/complete
   */
  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const userId = req.user!.userId;
      const { userData, partnerData } = req.body;

      const result = await onboardingService.completeOnboarding(userId, 
        userData || partnerData ? { userData, partnerData } : undefined
      );

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        meta: {
          message: 'オンボーディングが完了しました！素敵なパートナーができましたね。',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * プリセット取得
   * GET /api/onboarding/presets
   */
  async getPresets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'バリデーションエラー',
          validationErrors: errors.array(),
        });
        return;
      }

      const presets = await onboardingService.getPresets();

      const response: ApiResponse<{ presets: typeof presets }> = {
        success: true,
        data: { presets },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 性格診断質問取得
   * GET /api/onboarding/personality-questions
   */
  async getPersonalityQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const questions = onboardingService.getPersonalityQuestions();

      const response: ApiResponse<{ questions: typeof questions }> = {
        success: true,
        data: { questions },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 性格診断結果からおすすめプリセット取得
   * POST /api/onboarding/recommended-presets
   */
  async getRecommendedPresets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { answers } = req.body;

      if (!answers || !Array.isArray(answers)) {
        res.status(400).json({
          success: false,
          error: '性格診断の回答が必要です',
        });
        return;
      }

      const recommendedPresets = onboardingService.getRecommendedPresets(answers);

      const response: ApiResponse<{ recommendedPresets: typeof recommendedPresets }> = {
        success: true,
        data: { recommendedPresets },
        meta: {
          message: 'あなたにおすすめの性格タイプです',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * デバッグ用: オンボーディング進捗の詳細取得
   * GET /api/onboarding/debug/:userId
   * ※本番環境では削除すること
   */
  async debug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'ユーザーIDが必要です',
        });
        return;
      }

      const debugData = await onboardingService.getDebugData(userId);

      const response: ApiResponse<{ debugData: typeof debugData }> = {
        success: true,
        data: { debugData },
        meta: {
          message: 'デバッグデータ取得成功',
          warning: 'このエンドポイントは開発環境専用です。本番環境では削除してください。',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const onboardingController = new OnboardingController();