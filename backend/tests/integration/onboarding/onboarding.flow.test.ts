import request from 'supertest';
import app from '../../../src/app';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { OnboardingProgress, OnboardingProgressHelpers, PartnerModel } from '../../../src/db/models';
import { Gender, PersonalityType, SpeechStyle } from '../../../src/types';

/**
 * オンボーディング統合テスト
 * ★9統合テスト成功請負人用
 * 
 * 実データベース使用（モックなし）
 * 外部API実際使用（OpenAI API含む）
 * 完全分離型テストケース
 */
describe('オンボーディングAPI統合テスト', () => {
  let userAuth: any;
  
  beforeEach(async () => {
    await DbTestHelper.beforeEach();
    // 認証済みユーザーを準備
    userAuth = await TestAuthHelper.loginAsUser();
  });

  afterEach(async () => {
    await DbTestHelper.afterEach();
  });

  describe('POST /api/onboarding/start - オンボーディング開始', () => {
    it('新規ユーザーのオンボーディングを正常に開始できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('オンボーディング開始API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/start',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('progress');
      expect(response.body.data.progress).toHaveProperty('userId');
      expect(response.body.data.progress).toHaveProperty('currentStep');
      expect(response.body.data.progress.currentStep).toBe(1);
      tracker.mark('レスポンス検証完了');

      tracker.setOperation('データベース確認');
      const savedProgress = await OnboardingProgress.findOne({ where: { userId: userAuth.user.id } });
      expect(savedProgress).toBeTruthy();
      expect(savedProgress?.currentStep).toBe(1);
      tracker.mark('データベース確認完了');

      tracker.summary();
    });

    it('既にパートナーを持つユーザーはオンボーディングを開始できない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // まず既存パートナーを作成
      tracker.setOperation('既存パートナー作成');
      await PartnerModel.create({
        userId: userAuth.user.id,
        name: 'テストパートナー',
        gender: Gender.GIRLFRIEND,
        personalityType: PersonalityType.SWEET,
        speechStyle: SpeechStyle.CASUAL,
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        systemPrompt: 'テスト用プロンプト',
        avatarDescription: 'テスト用アバター',
        hobbies: [],
        intimacyLevel: 0
      });
      tracker.mark('既存パートナー作成完了');

      tracker.setOperation('オンボーディング開始API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/start',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('エラーレスポンス検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('既にパートナーが存在します');
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });

    it('既にオンボーディング進捗がある場合は開始できない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 既存の進捗を作成
      tracker.setOperation('既存進捗作成');
      await OnboardingProgress.create({
        userId: userAuth.user.id,
        currentStep: 3,
        userData: { surname: 'テスト', firstName: '次郎', birthday: '1985-03-15' },
        partnerData: {
          name: 'テストパートナー',
          gender: Gender.BOYFRIEND,
          personality: PersonalityType.GENTLE,
          speechStyle: SpeechStyle.POLITE,
          prompt: 'テスト用プロンプト',
          nickname: 'くん',
          appearance: {
            hairStyle: 'short' as const,
            eyeColor: 'brown' as const,
            bodyType: 'average' as const,
            clothingStyle: 'casual' as const
          }
        },
        personalityAnswers: []
      });
      tracker.mark('既存進捗作成完了');

      tracker.setOperation('オンボーディング開始API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/start',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('エラーレスポンス検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('既にオンボーディングが開始されています');
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('GET /api/onboarding/progress - 進捗状況取得', () => {
    it('オンボーディング進捗を正常に取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 進捗を作成
      tracker.setOperation('進捗データ作成');
      const testData = {
        userId: userAuth.user.id,
        currentStep: 5,
        completedSteps: [1, 2, 3, 4],
        userData: { surname: 'テスト', firstName: '太郎', birthday: '1990-01-01' },
        partnerData: { 
          name: 'テストちゃん', 
          gender: Gender.GIRLFRIEND,
          personality: PersonalityType.SWEET,
          speechStyle: SpeechStyle.CASUAL,
          prompt: 'テスト用プロンプト',
          nickname: 'ちゃん',
          appearance: {
            hairStyle: 'medium' as const,
            eyeColor: 'brown' as const,
            bodyType: 'average' as const,
            clothingStyle: 'casual' as const
          }
        },
        personalityAnswers: [{ id: '1', question: 'Question 1', answer: 'a' }],
        completed: false
      };
      await OnboardingProgress.create(testData);
      tracker.mark('進捗データ作成完了');

      tracker.setOperation('進捗取得API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/onboarding/progress',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.currentStep).toBe(5);
      expect(response.body.data.progress.userData).toBeDefined();
      expect(response.body.data.progress.partnerData.name).toBe('テストちゃん');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('進捗が存在しない場合は404エラーを返す', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('進捗取得API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/onboarding/progress',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('エラーレスポンス検証');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('オンボーディング進捗が見つかりません');
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('PUT /api/onboarding/progress - 進捗更新', () => {
    beforeEach(async () => {
      // 各テストで基本進捗を作成
      await OnboardingProgress.create({
        userId: userAuth.user.id,
        currentStep: 1,
        userData: { surname: 'テスト', firstName: '花子', birthday: '1995-05-05' },
        partnerData: {
          name: 'テストパートナー',
          gender: Gender.BOYFRIEND,
          personality: PersonalityType.GENTLE,
          speechStyle: SpeechStyle.POLITE,
          prompt: 'テスト用プロンプト',
          nickname: 'くん',
          appearance: {
            hairStyle: 'short' as const,
            eyeColor: 'brown' as const,
            bodyType: 'average' as const,
            clothingStyle: 'casual' as const
          }
        },
        personalityAnswers: []
      });
    });

    it('ステップ2（性別選択）を正常に更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        step: 2,
        userData: {}
      };

      tracker.setOperation('進捗更新API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        updateData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.currentStep).toBe(2);
      tracker.mark('レスポンス検証完了');

      tracker.setOperation('データベース確認');
      const updatedProgress = await OnboardingProgress.findOne({ where: { userId: userAuth.user.id } });
      expect(updatedProgress?.currentStep).toBe(2);
      expect(updatedProgress?.userData).toBeDefined();
      tracker.mark('データベース確認完了');

      tracker.summary();
    });

    it('ステップ3（ユーザー情報）を正常に更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        step: 3,
        userData: {
          surname: 'テスト',
          firstName: '三郎',
          birthday: '1992-07-20',
          age: 28
        }
      };

      tracker.setOperation('進捗更新API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        updateData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.currentStep).toBe(3);
      expect(response.body.data.progress.userData.age).toBe(28);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('ステップ4（パートナー名前）を正常に更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        step: 4,
        partnerData: {
          name: 'あいちゃん',
          gender: 'FEMALE'
        }
      };

      tracker.setOperation('進捗更新API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        updateData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.currentStep).toBe(4);
      expect(response.body.data.progress.partnerData.name).toBe('あいちゃん');
      expect(response.body.data.progress.partnerData.gender).toBe('FEMALE');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('ステップ5（性格選択）を正常に更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        step: 5,
        partnerData: {
          name: 'みくちゃん',
          gender: Gender.GIRLFRIEND,
          personality: PersonalityType.TSUNDERE
        }
      };

      tracker.setOperation('進捗更新API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        updateData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.currentStep).toBe(5);
      expect(response.body.data.progress.partnerData.personality).toBe(PersonalityType.TSUNDERE);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('外見設定（ステップ7）を正常に更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        step: 7,
        partnerData: {
          name: 'ゆいちゃん',
          gender: Gender.GIRLFRIEND,
          personality: PersonalityType.SWEET,
          appearance: {
            hairColor: '茶色',
            eyeColor: 'blue' as const,
            bodyType: 'slim' as const,
            height: '160cm',
            style: 'カジュアル'
          }
        }
      };

      tracker.setOperation('進捗更新API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        updateData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.progress.currentStep).toBe(7);
      expect(response.body.data.progress.partnerData.appearanceSettings.hairColor).toBe('茶色');
      expect(response.body.data.progress.partnerData.appearanceSettings.eyeColor).toBe('blue');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('無効なステップ番号の場合はエラーを返す', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        step: 15, // 無効なステップ
        userData: { gender: 'female' }
      };

      tracker.setOperation('進捗更新API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        updateData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('エラーレスポンス検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('GET /api/onboarding/presets - プリセット取得', () => {
    it('性格プリセット一覧を正常に取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('プリセット取得API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/onboarding/presets',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.presets).toBeInstanceOf(Array);
      expect(response.body.data.presets.length).toBeGreaterThan(0);
      
      // 代表的なプリセットの存在確認
      const presetIds = response.body.data.presets.map((p: any) => p.id);
      expect(presetIds).toContain('tsundere');
      expect(presetIds).toContain('sweet'); // cuteではなくsweet
      expect(presetIds).toContain('cool');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('GET /api/onboarding/personality-questions - 性格診断質問取得', () => {
    it('性格診断質問を正常に取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('性格診断質問取得API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/onboarding/personality-questions',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toBeInstanceOf(Array);
      expect(response.body.data.questions.length).toBe(3); // 3つの質問
      
      // 質問形式の確認
      const firstQuestion = response.body.data.questions[0];
      expect(firstQuestion).toHaveProperty('id');
      expect(firstQuestion).toHaveProperty('question');
      expect(firstQuestion).toHaveProperty('options');
      expect(firstQuestion.options).toBeInstanceOf(Array);
      expect(firstQuestion.options.length).toBe(5); // 5つの選択肢
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('POST /api/onboarding/recommended-presets - おすすめプリセット取得', () => {
    it('性格診断結果に基づいてプリセットを推薦できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const requestData = {
        answers: [
          { id: '1', question: 'Question 1', answer: 'a' },
          { id: '2', question: 'Question 2', answer: 'b' },
          { id: '3', question: 'Question 3', answer: 'c' }
        ]
      };

      tracker.setOperation('おすすめプリセット取得API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/recommended-presets',
        userAuth.cookies,
        requestData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedPresets).toBeInstanceOf(Array);
      expect(response.body.data.recommendedPresets.length).toBeGreaterThan(0);
      expect(response.body.data.recommendedPresets.length).toBeLessThanOrEqual(3);
      
      // プリセット情報の確認
      const firstPreset = response.body.data.recommendedPresets[0];
      expect(firstPreset).toHaveProperty('id');
      expect(firstPreset).toHaveProperty('name');
      expect(firstPreset).toHaveProperty('description');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('無効な回答の場合はエラーを返す', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const requestData = {
        answers: [
          { questionId: 1, answer: 'invalid' }, // 無効な回答
          { questionId: 2, answer: 'b' }
        ]
      };

      tracker.setOperation('おすすめプリセット取得API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/recommended-presets',
        userAuth.cookies,
        requestData
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('エラーレスポンス検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('POST /api/onboarding/complete - オンボーディング完了', () => {
    beforeEach(async () => {
      // 完了に必要な全データを持つ進捗を作成
      await OnboardingProgress.create({
        userId: userAuth.user.id,
        currentStep: 10,
        userData: {
          surname: 'テスト',
          firstName: '三郎',
          birthday: '1992-07-20',
        },
        partnerData: {
          name: 'あいちゃん',
          gender: Gender.GIRLFRIEND,
          personality: PersonalityType.SWEET,
          speechStyle: SpeechStyle.CASUAL,
          prompt: 'テスト用プロンプト',
          nickname: 'あいちゃん',
          appearance: {
            hairStyle: 'medium' as const,
            eyeColor: 'blue' as const,
            bodyType: 'slim' as const,
            clothingStyle: 'casual' as const
          }
        },
        personalityAnswers: [
          { id: '1', question: 'Question 1', answer: 'a' },
          { id: '2', question: 'Question 2', answer: 'b' },
          { id: '3', question: 'Question 3', answer: 'c' }
        ]
      });
    });

    it('オンボーディングを正常に完了できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('オンボーディング完了API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/complete',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('partner');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.partner.name).toBe('あいちゃん');
      expect(response.body.data.partner.personality).toBe(PersonalityType.SWEET);
      expect(response.body.data.partner.intimacyLevel).toBe(0);
      tracker.mark('レスポンス検証完了');

      tracker.setOperation('パートナー作成確認');
      const createdPartner = await PartnerModel.findByUserId(userAuth.user.id);
      expect(createdPartner).toBeTruthy();
      expect(createdPartner?.name).toBe('あいちゃん');
      expect(createdPartner?.systemPrompt).toContain('あいちゃん'); // システムプロンプト生成確認
      expect(createdPartner?.avatarDescription).toContain('茶色'); // アバター説明生成確認
      tracker.mark('パートナー作成確認完了');

      tracker.setOperation('進捗削除確認');
      const deletedProgress = await OnboardingProgress.findOne({ where: { userId: userAuth.user.id } });
      expect(deletedProgress).toBeNull(); // 完了後に進捗は削除される
      tracker.mark('進捗削除確認完了');

      tracker.summary();
    });

    it('不完全なデータでは完了できない', async () => {
      // 不完全な進捗データで上書き
      await OnboardingProgressHelpers.updateUserData(userAuth.user.id, {
        surname: 'テスト',
        firstName: '花子',
        birthday: '1995-05-05'
      });

      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('オンボーディング完了API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/complete',
        userAuth.cookies
      );
      tracker.mark('APIレスポンス受信');

      tracker.setOperation('エラーレスポンス検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('オンボーディングが完了していません');
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('完全フローテスト', () => {
    it('オンボーディング全体の流れを正常に実行できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('フローテスト開始');

      // ステップ1: オンボーディング開始
      tracker.setOperation('オンボーディング開始');
      const startResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/start',
        userAuth.cookies
      );
      expect(startResponse.status).toBe(201);
      tracker.mark('オンボーディング開始完了');

      // ステップ2: 性別選択
      tracker.setOperation('性別選択');
      const genderResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        { step: 2, userData: {} }
      );
      expect(genderResponse.status).toBe(200);
      tracker.mark('性別選択完了');

      // ステップ3: ユーザー情報入力
      tracker.setOperation('ユーザー情報入力');
      const userInfoResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 3,
          userData: {
            age: 24
          }
        }
      );
      expect(userInfoResponse.status).toBe(200);
      tracker.mark('ユーザー情報入力完了');

      // ステップ4: パートナー名前設定
      tracker.setOperation('パートナー名前設定');
      const nameResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 4,
          partnerData: {
            name: 'りんちゃん',
            gender: 'FEMALE'
          }
        }
      );
      expect(nameResponse.status).toBe(200);
      tracker.mark('パートナー名前設定完了');

      // ステップ5: 性格選択
      tracker.setOperation('性格選択');
      const personalityResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 5,
          partnerData: {
            name: 'りんちゃん',
            gender: Gender.GIRLFRIEND,
            personality: PersonalityType.GENTLE
          }
        }
      );
      expect(personalityResponse.status).toBe(200);
      tracker.mark('性格選択完了');

      // ステップ6: 性格質問取得と回答
      tracker.setOperation('性格質問取得');
      const questionsResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/onboarding/personality-questions',
        userAuth.cookies
      );
      expect(questionsResponse.status).toBe(200);
      tracker.mark('性格質問取得完了');

      // ステップ7: 外見設定
      tracker.setOperation('外見設定');
      const appearanceResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 7,
          partnerData: {
            name: 'りんちゃん',
            gender: Gender.GIRLFRIEND,
            personality: PersonalityType.GENTLE,
            appearance: {
              hairColor: '黒',
              eyeColor: '茶色',
              bodyType: '普通',
              height: '155cm',
              style: 'ナチュラル'
            }
          }
        }
      );
      expect(appearanceResponse.status).toBe(200);
      tracker.mark('外見設定完了');

      // ステップ8: ニックネーム設定
      tracker.setOperation('ニックネーム設定');
      const nicknameResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 8,
          partnerData: {
            name: 'りんちゃん',
            gender: Gender.GIRLFRIEND,
            personality: PersonalityType.GENTLE,
            speechStyle: 'polite',
            nickname: 'りんちゃん'
          }
        }
      );
      expect(nicknameResponse.status).toBe(200);
      tracker.mark('ニックネーム設定完了');

      // ステップ9: 初期チャット設定
      tracker.setOperation('初期チャット設定');
      const chatResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 9,
          partnerData: {
            name: 'りんちゃん',
            gender: Gender.GIRLFRIEND,
            personality: PersonalityType.GENTLE,
            speechStyle: 'polite',
            nickname: 'りんちゃん',
            appearance: {
              hairColor: '黒',
              eyeColor: '茶色',
              bodyType: '普通'
            }
          }
        }
      );
      expect(chatResponse.status).toBe(200);
      tracker.mark('初期チャット設定完了');

      // ステップ10: 最終確認と完了準備
      tracker.setOperation('最終確認準備');
      const finalResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/onboarding/progress',
        userAuth.cookies,
        {
          step: 10,
          partnerData: {
            name: 'りんちゃん',
            gender: Gender.GIRLFRIEND,
            personality: PersonalityType.GENTLE,
            speechStyle: 'polite',
            nickname: 'りんちゃん',
            appearance: {
              hairColor: '黒',
              eyeColor: '茶色',
              bodyType: '普通',
              height: '155cm',
              style: 'ナチュラル'
            }
          },
          personalityAnswers: [
            { questionId: 1, answer: 'a' },
            { questionId: 2, answer: 'b' },
            { questionId: 3, answer: 'c' }
          ]
        }
      );
      expect(finalResponse.status).toBe(200);
      tracker.mark('最終確認準備完了');

      // オンボーディング完了
      tracker.setOperation('オンボーディング完了');
      const completeResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/onboarding/complete',
        userAuth.cookies
      );
      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.partner.name).toBe('りんちゃん');
      tracker.mark('オンボーディング完了');

      // 最終検証
      tracker.setOperation('最終データ検証');
      const createdPartner = await PartnerModel.findByUserId(userAuth.user.id);
      expect(createdPartner).toBeTruthy();
      expect(createdPartner?.name).toBe('りんちゃん');
      expect(createdPartner?.personalityType).toBe('gentle');
      expect(createdPartner?.systemPrompt).toBeTruthy();
      expect(createdPartner?.avatarDescription).toBeTruthy();
      
      const deletedProgress = await OnboardingProgress.findOne({ where: { userId: userAuth.user.id } });
      expect(deletedProgress).toBeNull();
      tracker.mark('最終データ検証完了');

      tracker.summary();
    });
  });

  describe('認証とアクセス制御', () => {
    it('認証なしではアクセスできない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const endpoints = [
        { method: 'post', path: '/api/onboarding/start' },
        { method: 'get', path: '/api/onboarding/progress' },
        { method: 'put', path: '/api/onboarding/progress' },
        { method: 'post', path: '/api/onboarding/complete' },
        { method: 'get', path: '/api/onboarding/presets' },
        { method: 'get', path: '/api/onboarding/personality-questions' },
        { method: 'post', path: '/api/onboarding/recommended-presets' }
      ];

      tracker.setOperation('認証チェック');
      for (const endpoint of endpoints) {
        await TestAuthHelper.testUnauthorizedAccess(endpoint.path, endpoint.method as any);
      }
      tracker.mark('認証チェック完了');

      tracker.summary();
    });
  });
});