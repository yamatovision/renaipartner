import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../../setup';
import { dbTestHelper } from '../../utils/db-test-helper';
import { testAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { MemoryType, MessageSender } from '../../../src/types';

describe('メモリシステム統合テスト', () => {
  let app: Express;
  let testTransaction: any;
  let authTokens: any;
  let testUser: any;
  let testPartner: any;
  let testMessages: any[] = [];
  const tracker = new MilestoneTracker();

  beforeEach(async () => {
    tracker.setOperation('テスト環境セットアップ');
    
    // アプリケーション初期化
    app = await createTestApp();
    tracker.mark('アプリ初期化完了');

    // データベーストランザクション開始
    testTransaction = await dbTestHelper.startTransaction();
    tracker.mark('トランザクション開始');

    // 認証テストヘルパーでテストユーザー作成
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    authTokens = await testAuthHelper.createTestUserWithTokens({
      email: `memory-test-${uniqueId}@test.com`,
      password: 'TestPassword123!',
      surname: 'テスト',
      firstName: 'メモリ',
      birthday: '1990-01-01'
    });
    
    testUser = authTokens.user;
    tracker.mark('テストユーザー作成完了');

    // テスト用パートナー作成
    testPartner = await dbTestHelper.createTestPartner(testUser.id, {
      name: `AIパートナー-${uniqueId}`,
      gender: 'boyfriend',
      personalityType: 'gentle',
      speechStyle: 'polite',
      systemPrompt: 'あなたは優しくて思いやりのある恋人です。相手のことを大切に思い、いつも支えてくれる存在です。',
      avatarDescription: 'やさしい笑顔の男性',
      intimacyLevel: 50
    });
    console.log('[TEST DEBUG] 作成されたパートナー:', {
      id: testPartner.id,
      userId: testPartner.userId,
      name: testPartner.name
    });
    
    // データベース内のパートナー存在確認
    const { pool } = require('../../../src/config/database.config');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, user_id, name FROM partners WHERE id = $1', [testPartner.id]);
      console.log('[TEST DEBUG] DB内パートナー確認:', result.rows);
    } catch (error) {
      console.error('[TEST DEBUG] DB確認エラー:', error);
    } finally {
      client.release();
    }
    
    tracker.mark('テストパートナー作成完了');

    // テスト用メッセージ作成（会話要約のテスト用）
    const conversationData = [
      { content: 'こんにちは！今日はとても良い天気ですね。', sender: MessageSender.USER },
      { content: 'こんにちは！本当に素晴らしい天気ですね。散歩でもしませんか？', sender: MessageSender.PARTNER },
      { content: '良いアイデアですね。実は今度の誕生日の計画を考えているんです。', sender: MessageSender.USER },
      { content: 'そうなんですね！どんな計画を考えているか教えてください。', sender: MessageSender.PARTNER },
      { content: '家族みんなでお食事会をしたいと思っています。お母さんが料理好きなので。', sender: MessageSender.USER }
    ];

    for (const msgData of conversationData) {
      console.log('[TEST DEBUG] メッセージ作成試行:', {
        partnerId: testPartner.id,
        content: msgData.content.substring(0, 20) + '...',
        sender: msgData.sender
      });
      const message = await dbTestHelper.createTestMessage(testPartner.id, {
        content: msgData.content,
        sender: msgData.sender
      });
      testMessages.push(message);
    }
    tracker.mark('テストメッセージ作成完了');

    tracker.setOperation('テスト実行準備完了');
  });

  afterEach(async () => {
    tracker.setOperation('テスト環境クリーンアップ');
    
    // テスト環境クリーンアップ
    if (testTransaction) {
      await dbTestHelper.rollbackTransaction(testTransaction);
      tracker.mark('トランザクションロールバック完了');
    }
    
    tracker.summary();
  });

  describe('API 6.1: 会話要約作成', () => {
    it('正常に会話要約を作成できる', async () => {
      tracker.setOperation('会話要約作成テスト');

      const messageIds = testMessages.map(msg => msg.id);
      const response = await request(app)
        .post('/api/memory/summary')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: testPartner.id,
          messageIds: messageIds,
          summaryType: 'daily'
        });

      tracker.mark('API呼び出し完了');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('memoriesCreated');
      expect(response.body.data).toHaveProperty('summaryText');
      expect(Array.isArray(response.body.data.memoriesCreated)).toBe(true);
      
      tracker.mark('レスポンス検証完了');

      // 作成されたメモリの内容検証
      const memories = response.body.data.memoriesCreated;
      expect(memories.length).toBeGreaterThan(0);
      
      memories.forEach((memory: any) => {
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('partnerId', testPartner.id);
        expect(memory).toHaveProperty('type');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('importance');
        expect(memory.importance).toBeGreaterThanOrEqual(0);
        expect(memory.importance).toBeLessThanOrEqual(10);
      });

      tracker.mark('メモリ内容検証完了');
    }, 30000); // OpenAI API呼び出しのため長めのタイムアウト

    it('無効なパートナーIDでエラーが返される', async () => {
      tracker.setOperation('無効パートナーIDエラーテスト');

      const response = await request(app)
        .post('/api/memory/summary')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: '00000000-0000-0000-0000-000000000000',
          messageIds: testMessages.map(msg => msg.id),
          summaryType: 'daily'
        });

      tracker.mark('エラーAPI呼び出し完了');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      tracker.mark('エラーレスポンス検証完了');
    });
  });

  describe('API 6.2: メモリ検索', () => {
    let createdMemory: any;

    beforeEach(async () => {
      // 検索テスト用のメモリを事前作成
      const summaryResponse = await request(app)
        .post('/api/memory/summary')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: testPartner.id,
          messageIds: testMessages.map(msg => msg.id),
          summaryType: 'daily'
        });

      if (summaryResponse.body.data?.memoriesCreated?.length > 0) {
        createdMemory = summaryResponse.body.data.memoriesCreated[0];
      }
      tracker.mark('検索用メモリ準備完了');
    });

    it('正常にメモリ検索ができる', async () => {
      if (!createdMemory) {
        console.log('検索用メモリが作成されていないため、テストをスキップします');
        return;
      }

      tracker.setOperation('メモリ検索テスト');

      const response = await request(app)
        .post('/api/memory/search')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: testPartner.id,
          query: '誕生日',
          limit: 10,
          minImportance: 0
        });

      tracker.mark('検索API呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('relevanceScores');
      expect(response.body.data).toHaveProperty('totalFound');
      expect(Array.isArray(response.body.data.results)).toBe(true);

      tracker.mark('検索レスポンス検証完了');
    }, 20000);

    it('メモリタイプフィルターが正常に動作する', async () => {
      tracker.setOperation('メモリタイプフィルターテスト');

      const response = await request(app)
        .post('/api/memory/search')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: testPartner.id,
          query: '会話',
          memoryTypes: [MemoryType.CONVERSATION],
          limit: 5
        });

      tracker.mark('フィルター検索API呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      tracker.mark('フィルター検索レスポンス検証完了');
    }, 20000);
  });

  describe('API 6.3: エピソード記憶取得', () => {
    it('正常にエピソード記憶を取得できる', async () => {
      tracker.setOperation('エピソード記憶取得テスト');

      const response = await request(app)
        .get(`/api/memory/episodes/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .query({
          limit: 10,
          minEmotionalWeight: 0
        });

      tracker.mark('エピソードAPI呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      tracker.mark('エピソードレスポンス検証完了');
    });

    it('感情重みフィルターが正常に動作する', async () => {
      tracker.setOperation('感情重みフィルターテスト');

      const response = await request(app)
        .get(`/api/memory/episodes/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .query({
          minEmotionalWeight: 5.0
        });

      tracker.mark('感情重みフィルターAPI呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      tracker.mark('感情重みフィルターレスポンス検証完了');
    });
  });

  describe('API 6.4: 関係性メトリクス取得', () => {
    it('正常に関係性メトリクスを取得できる', async () => {
      tracker.setOperation('関係性メトリクス取得テスト');

      const response = await request(app)
        .get(`/api/memory/relationships/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      tracker.mark('関係性API呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('current');
      expect(response.body.data).toHaveProperty('stage');
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('recommendations');

      const metrics = response.body.data.current;
      if (metrics) {
        expect(metrics).toHaveProperty('intimacyLevel');
        expect(metrics).toHaveProperty('trustLevel');
        expect(metrics).toHaveProperty('emotionalConnection');
        expect(metrics.intimacyLevel).toBeGreaterThanOrEqual(0);
        expect(metrics.intimacyLevel).toBeLessThanOrEqual(100);
      }

      tracker.mark('関係性レスポンス検証完了');
    });

    it('関係性段階が正しく判定される', async () => {
      tracker.setOperation('関係性段階判定テスト');

      const response = await request(app)
        .get(`/api/memory/relationships/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      tracker.mark('関係性段階API呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.data.stage).toMatch(/^(stranger|acquaintance|friend|close_friend|intimate)$/);

      tracker.mark('関係性段階検証完了');
    });
  });

  describe('API 6.5: 継続話題取得', () => {
    it('正常に継続話題を取得できる', async () => {
      tracker.setOperation('継続話題取得テスト');

      const response = await request(app)
        .get(`/api/memory/topics/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .query({
          limit: 5,
          status: 'all',
          minImportance: 0
        });

      tracker.mark('継続話題API呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // 話題が存在する場合の検証
      if (response.body.data.length > 0) {
        const topic = response.body.data[0];
        expect(topic).toHaveProperty('id');
        expect(topic).toHaveProperty('partnerId', testPartner.id);
        expect(topic).toHaveProperty('title');
        expect(topic).toHaveProperty('status');
        expect(topic.status).toMatch(/^(active|resolved|dormant)$/);
      }

      tracker.mark('継続話題レスポンス検証完了');
    });

    it('ステータスフィルターが正常に動作する', async () => {
      tracker.setOperation('ステータスフィルターテスト');

      const response = await request(app)
        .get(`/api/memory/topics/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .query({
          status: 'active'
        });

      tracker.mark('ステータスフィルターAPI呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      tracker.mark('ステータスフィルターレスポンス検証完了');
    });
  });

  describe('メモリ統計取得（デバッグ用）', () => {
    it('正常にメモリ統計を取得できる', async () => {
      tracker.setOperation('メモリ統計取得テスト');

      const response = await request(app)
        .get(`/api/memory/stats/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      tracker.mark('統計API呼び出し完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('partnerId', testPartner.id);

      tracker.mark('統計レスポンス検証完了');
    });
  });

  describe('エラーハンドリング', () => {
    it('認証なしでアクセスしたときに401エラーが返される', async () => {
      tracker.setOperation('認証なしアクセステスト');

      const response = await request(app)
        .post('/api/memory/summary')
        .send({
          partnerId: testPartner.id,
          messageIds: testMessages.map(msg => msg.id)
        });

      tracker.mark('認証なしAPI呼び出し完了');

      expect(response.status).toBe(401);

      tracker.mark('認証エラーレスポンス検証完了');
    });

    it('バリデーションエラーが正常に処理される', async () => {
      tracker.setOperation('バリデーションエラーテスト');

      const response = await request(app)
        .post('/api/memory/search')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: 'invalid-uuid',
          query: ''
        });

      tracker.mark('バリデーションエラーAPI呼び出し完了');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');

      tracker.mark('バリデーションエラーレスポンス検証完了');
    });

    it('存在しないエンドポイントで404エラーが返される', async () => {
      tracker.setOperation('404エラーテスト');

      const response = await request(app)
        .get('/api/memory/nonexistent')
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      tracker.mark('404エラーAPI呼び出し完了');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('availableEndpoints');

      tracker.mark('404エラーレスポンス検証完了');
    });
  });

  describe('完全なメモリワークフロー', () => {
    it('会話→要約→検索→分析の完全フローが正常に動作する', async () => {
      tracker.setOperation('完全メモリワークフロー');

      // Step 1: 会話要約作成
      const summaryResponse = await request(app)
        .post('/api/memory/summary')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: testPartner.id,
          messageIds: testMessages.map(msg => msg.id),
          summaryType: 'important'
        });

      tracker.mark('Step 1: 会話要約完了');

      expect(summaryResponse.status).toBe(201);
      expect(summaryResponse.body.data.memoriesCreated.length).toBeGreaterThan(0);

      // Step 2: メモリ検索
      const searchResponse = await request(app)
        .post('/api/memory/search')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          partnerId: testPartner.id,
          query: '誕生日',
          limit: 5
        });

      tracker.mark('Step 2: メモリ検索完了');

      expect(searchResponse.status).toBe(200);

      // Step 3: 関係性分析
      const relationshipResponse = await request(app)
        .get(`/api/memory/relationships/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      tracker.mark('Step 3: 関係性分析完了');

      expect(relationshipResponse.status).toBe(200);
      expect(relationshipResponse.body.data).toHaveProperty('stage');

      // Step 4: 継続話題分析
      const topicsResponse = await request(app)
        .get(`/api/memory/topics/${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`);

      tracker.mark('Step 4: 継続話題分析完了');

      expect(topicsResponse.status).toBe(200);

      tracker.mark('完全ワークフロー検証完了');
    }, 45000); // 複数のOpenAI API呼び出しのため長めのタイムアウト
  });
});