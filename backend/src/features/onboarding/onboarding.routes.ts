import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { onboardingValidator } from './onboarding.validator';
import { requireAuth } from '../../common/middlewares/auth.middleware';

const router = Router();

// すべてのルートに認証が必要
router.use(requireAuth);

/**
 * オンボーディング開始
 * POST /api/onboarding/start
 */
router.post(
  '/start',
  onboardingValidator.start(),
  onboardingController.start.bind(onboardingController)
);

/**
 * 進捗状況取得
 * GET /api/onboarding/:userId/progress
 */
router.get(
  '/:userId/progress',
  onboardingValidator.getProgress(),
  onboardingController.getProgress.bind(onboardingController)
);

/**
 * 進捗更新
 * PUT /api/onboarding/:userId/progress
 */
router.put(
  '/:userId/progress',
  onboardingValidator.updateProgress(),
  onboardingController.updateProgress.bind(onboardingController)
);

/**
 * オンボーディング完了
 * POST /api/onboarding/:userId/complete
 */
router.post(
  '/:userId/complete',
  onboardingValidator.complete(),
  onboardingController.complete.bind(onboardingController)
);

/**
 * プリセット取得
 * GET /api/onboarding/presets
 */
router.get(
  '/presets',
  onboardingValidator.getPresets(),
  onboardingController.getPresets.bind(onboardingController)
);

/**
 * 性格診断質問取得
 * GET /api/onboarding/personality-questions
 */
router.get(
  '/personality-questions',
  onboardingController.getPersonalityQuestions.bind(onboardingController)
);

/**
 * 性格診断結果からおすすめプリセット取得
 * POST /api/onboarding/recommended-presets
 */
router.post(
  '/recommended-presets',
  onboardingController.getRecommendedPresets.bind(onboardingController)
);

/**
 * デバッグ用: オンボーディング進捗の詳細取得
 * GET /api/onboarding/debug/:userId
 * ※本番環境では削除すること
 */
router.get(
  '/debug/:userId',
  onboardingController.debug.bind(onboardingController)
);

export { router as onboardingRoutes };