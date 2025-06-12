import request from 'supertest';
import app from '@/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('画像生成システム統合テスト', () => {
  let authTokens: { access: string; refresh: string };
  let testUserId: string;
  let testPartnerId: string;
  const tracker = new MilestoneTracker();

  beforeAll(async () => {
    await DbTestHelper.ensureConnection();
    tracker.setOperation('テストデータ準備');
    
    // テストユーザーとパートナーを作成
    const { user, credentials } = await DbTestHelper.createTestUser();
    testUserId = user.id;
    
    // データベースコミットを確実にするための待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const loginResult = await TestAuthHelper.loginAndGetTokens(credentials);
    authTokens = { access: loginResult.accessToken, refresh: loginResult.refreshToken };
    
    // 認証トークン取得後の待機
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const partner = await DbTestHelper.createTestPartner(testUserId, {
      name: 'レオナ',
      gender: 'female' as any,
      personalityType: 'gentle' as any,
      appearance: {
        hairColor: 'brown',
        hairStyle: 'long',
        eyeColor: 'green',
        bodyType: 'slim',
        clothingStyle: 'casual'
      }
    });
    testPartnerId = partner.id;
    
    tracker.mark('テストデータ準備完了');
  }, 45000);

  afterAll(async () => {
    await DbTestHelper.cleanupTestData();
  });

  describe('API 7.1: アバター画像生成', () => {
    test('正常にアバター画像を生成できる', async () => {
      tracker.setOperation('アバター画像生成テスト');
      
      const imageRequest = {
        partnerId: testPartnerId,
        prompt: 'beautiful anime girl with brown hair and green eyes',
        useAppearance: true,
        width: 512,
        height: 512
      };
      
      tracker.mark('Leonardo APIリクエスト開始');
      
      const response = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send(imageRequest);
      
      if (response.status !== 200) {
        console.error('API Error - Status:', response.status);
        console.error('API Error - Body:', JSON.stringify(response.body, null, 2));
        throw new Error(`API returned ${response.status}: ${JSON.stringify(response.body)}`);
      }
      
      expect(response.status).toBe(200);
      
      tracker.mark('レスポンス受信');
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('imageId');
      expect(response.body.data).toHaveProperty('imageUrl');
      expect(response.body.data).toHaveProperty('consistencyScore');
      expect(response.body.data.consistencyScore).toBeGreaterThan(0);
      
      tracker.mark('アバター画像生成テスト完了');
    }, 90000);

    test('パートナー外見設定を使用した画像生成ができる', async () => {
      tracker.setOperation('外見設定画像生成テスト');
      
      const imageRequest = {
        partnerId: testPartnerId,
        useAppearance: true,
        width: 512,
        height: 512
      };
      
      const response = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send(imageRequest)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.consistencyScore).toBeGreaterThan(0.5);
      
      tracker.mark('外見設定画像生成テスト完了');
    }, 90000);

    test('無効なパートナーIDでエラーが返される', async () => {
      const imageRequest = {
        partnerId: 'invalid-partner-id',
        prompt: 'test prompt',
        width: 512,
        height: 512
      };
      
      const response = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send(imageRequest)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('バリデーション');
    });
  });

  describe('API 7.2: チャット用画像生成', () => {
    test('正常にチャット用画像を生成できる', async () => {
      tracker.setOperation('チャット画像生成テスト');
      
      const chatImageRequest = {
        partnerId: testPartnerId,
        message: '今日は公園でピクニックをしています',
        emotion: 'happy',
        useReference: true,
        width: 512,
        height: 512
      };
      
      tracker.mark('チャットコンテキスト解析開始');
      
      const response = await request(app)
        .post('/api/images/generate-chat')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send(chatImageRequest)
        .expect(201);
      
      tracker.mark('チャット画像生成完了');
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('image');
      expect(response.body.data.image).toHaveProperty('id');
      expect(response.body.data.image).toHaveProperty('imageUrl');
      expect(response.body.data.image).toHaveProperty('prompt');
      expect(response.body.data.image.prompt).toContain('ピクニック');
      
      tracker.mark('チャット画像生成テスト完了');
    }, 90000);

    test('感情状態に基づく画像生成ができる', async () => {
      const emotions = ['happy', 'sad', 'excited', 'calm'];
      
      for (const emotion of emotions) {
        const chatImageRequest = {
          partnerId: testPartnerId,
          message: `${emotion}な気分です`,
          emotion: emotion,
          useReference: true
        };
        
        const response = await request(app)
          .post('/api/images/generate-chat')
          .set('Authorization', `Bearer ${authTokens.access}`)
          .send(chatImageRequest)
          .expect(201);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.image.prompt).toContain(emotion);
      }
    }, 180000);
  });

  describe('API 7.3: 背景画像一覧取得', () => {
    test('正常に背景画像一覧を取得できる', async () => {
      tracker.setOperation('背景画像一覧取得テスト');
      
      const response = await request(app)
        .get('/api/images/backgrounds')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      tracker.mark('背景画像データ取得完了');
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backgrounds');
      expect(Array.isArray(response.body.data.backgrounds)).toBe(true);
      expect(response.body.data.backgrounds.length).toBeGreaterThan(0);
      
      // 背景画像カテゴリの確認
      const categories = response.body.data.backgrounds.map((bg: any) => bg.category);
      const expectedCategories = ['nature', 'indoor', 'fantasy', 'modern', 'romantic'];
      
      expectedCategories.forEach(category => {
        expect(categories).toContain(category);
      });
      
      tracker.mark('背景画像一覧取得テスト完了');
    });

    test('カテゴリフィルターが正常に動作する', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds?category=nature')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      const natureBackgrounds = response.body.data.backgrounds;
      
      natureBackgrounds.forEach((bg: any) => {
        expect(bg.category).toBe('nature');
      });
    });
  });

  describe('画像履歴と統計機能', () => {
    test('正常に画像履歴を取得できる', async () => {
      const response = await request(app)
        .get(`/api/images/history/${testPartnerId}`)
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('images');
      expect(Array.isArray(response.body.data.images)).toBe(true);
    });

    test('正常に画像統計を取得できる', async () => {
      const response = await request(app)
        .get(`/api/images/stats/${testPartnerId}`)
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalImages');
      expect(response.body.data.stats).toHaveProperty('averageConsistency');
    });

    test('利用可能モデル一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/images/models')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('models');
      expect(Array.isArray(response.body.data.models)).toBe(true);
      
      // Leonardo AIのアニメモデルが含まれていることを確認
      const modelNames = response.body.data.models.map((model: any) => model.id);
      expect(modelNames).toContain('leonardo-diffusion-xl'); // Leonardo Diffusion XL
    });
  });

  describe('エラーハンドリング', () => {
    test('認証なしでアクセスしたときに401エラーが返される', async () => {
      const response = await request(app)
        .post('/api/images/generate')
        .send({ partnerId: testPartnerId, prompt: 'test' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    test('バリデーションエラーが正常に処理される', async () => {
      const response = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send({ partnerId: testPartnerId }) // プロンプトまたはuseAppearanceが必要
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('プロンプトまたは外見設定の使用が必要です');
    });

    test('Leonardo API制限エラーの処理', async () => {
      // 大量リクエストで制限に達する場合のテスト
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/images/generate')
          .set('Authorization', `Bearer ${authTokens.access}`)
          .send({
            partnerId: testPartnerId,
            prompt: 'stress test image',
            width: 512,
            height: 512
          })
      );
      
      const responses = await Promise.allSettled(promises);
      
      // 少なくとも1つは成功、エラーがあってもハンドリングされていることを確認
      const successCount = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      expect(successCount).toBeGreaterThan(0);
    }, 120000);
  });

  describe('完全な画像生成ワークフロー', () => {
    test('画像生成→履歴保存→統計更新の完全フローが正常に動作する', async () => {
      tracker.setOperation('完全画像生成ワークフロー');
      
      // 1. アバター画像生成
      tracker.mark('アバター画像生成開始');
      const avatarResponse = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send({
          partnerId: testPartnerId,
          prompt: 'workflow test avatar',
          useAppearance: true
        })
        .expect(200);
      
      const avatarImageId = avatarResponse.body.data.imageId;
      
      // 2. チャット画像生成
      tracker.mark('チャット画像生成開始');
      const chatResponse = await request(app)
        .post('/api/images/generate-chat')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send({
          partnerId: testPartnerId,
          message: 'workflow test context',
          emotion: 'happy',
          useReference: true
        })
        .expect(201);
      
      const chatImageId = chatResponse.body.data.image.id;
      
      // 3. 画像履歴確認
      tracker.mark('画像履歴確認開始');
      const historyResponse = await request(app)
        .get(`/api/images/history/${testPartnerId}`)
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      const images = historyResponse.body.data.images;
      const avatarImage = images.find((img: any) => img.id === avatarImageId);
      const chatImage = images.find((img: any) => img.id === chatImageId);
      
      expect(avatarImage).toBeDefined();
      expect(chatImage).toBeDefined();
      // contextフィールドで判別（チャット画像は"chat_message:"で始まる）
      expect(avatarImage.context).toBe('');
      expect(chatImage.context).toContain('chat_message:');
      
      // 4. 統計情報確認
      tracker.mark('統計情報確認開始');
      const statsResponse = await request(app)
        .get(`/api/images/stats/${testPartnerId}`)
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(statsResponse.body.data.stats.totalImages).toBeGreaterThanOrEqual(2);
      expect(statsResponse.body.data.stats.averageConsistency).toBeGreaterThan(0);
      
      // 5. 画像削除テスト
      tracker.mark('画像削除テスト開始');
      const deleteResponse = await request(app)
        .delete(`/api/images/${avatarImageId}`)
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(deleteResponse.body.success).toBe(true);
      
      tracker.mark('完全画像生成ワークフロー完了');
    }, 180000);
  });

  describe('一貫性システム', () => {
    test('参考画像を使用した一貫性向上が動作する', async () => {
      tracker.setOperation('一貫性システムテスト');
      
      // 最初の画像を生成
      const firstResponse = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send({
          partnerId: testPartnerId,
          prompt: 'consistency test first image',
          useAppearance: true
        })
        .expect(200);
      
      const firstImageId = firstResponse.body.data.imageId;
      const firstConsistencyScore = firstResponse.body.data.consistencyScore;
      
      // 参考画像を指定して2番目の画像を生成
      const secondResponse = await request(app)
        .post('/api/images/generate')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .send({
          partnerId: testPartnerId,
          prompt: 'consistency test second image',
          useAppearance: true,
          referenceImageId: firstImageId
        })
        .expect(200);
      
      const secondConsistencyScore = secondResponse.body.data.consistencyScore;
      
      // 参考画像を使用した場合の一貫性スコアがより高いことを確認
      expect(secondConsistencyScore).toBeGreaterThanOrEqual(firstConsistencyScore);
      
      tracker.mark('一貫性システムテスト完了');
    }, 120000);
  });
});