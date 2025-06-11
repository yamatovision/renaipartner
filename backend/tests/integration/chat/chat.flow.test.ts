import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../../setup';
import { dbTestHelper } from '../../utils/db-test-helper';
import { testAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { MessageSender } from '../../../src/types';

describe('チャット機能統合テスト', () => {
  let app: Express;
  let testTransaction: any;
  let authTokens: any;
  let testUser: any;
  let testPartner: any;
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
      email: `chat-test-${uniqueId}@test.com`,
      password: 'TestPassword123!',
      surname: 'テスト',
      firstName: 'チャット',
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
      intimacyLevel: 30
    });
    tracker.mark('テストパートナー作成完了');
  });

  afterEach(async () => {
    tracker.setOperation('テスト環境クリーンアップ');
    
    if (testTransaction) {
      await testTransaction.rollback();
      tracker.mark('トランザクションロールバック完了');
    }
    
    await dbTestHelper.cleanup();
    tracker.mark('DB クリーンアップ完了');
    
    tracker.summary();
  });

  describe('POST /api/chat/messages - メッセージ送信', () => {
    it('正常なメッセージ送信ができる', async () => {
      tracker.setOperation('正常メッセージ送信テスト');
      
      const messageData = {
        message: 'こんにちは！元気ですか？',
        partnerId: testPartner.id,
        context: {
          mood: 'cheerful',
          topic: 'greeting'
        }
      };

      tracker.mark('リクエストデータ準備完了');

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(messageData)
        .expect(200);

      tracker.mark('API呼び出し完了');

      // レスポンス検証
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('emotion');
      expect(response.body.data).toHaveProperty('intimacyLevel');
      expect(response.body.data).toHaveProperty('newMessages');
      expect(response.body.data.newMessages).toHaveLength(2); // ユーザー + AI

      tracker.mark('レスポンス検証完了');

      // データベース確認
      const messages = await dbTestHelper.findMessages(testPartner.id);
      expect(messages.length).toBe(2);
      
      const userMessage = messages.find(m => m.sender === MessageSender.USER);
      const aiMessage = messages.find(m => m.sender === MessageSender.PARTNER);
      
      expect(userMessage?.content).toBe(messageData.message);
      expect(aiMessage?.content).toBeTruthy();
      expect(aiMessage?.emotion).toBeTruthy();

      tracker.mark('データベース確認完了');
    });

    it('長すぎるメッセージは拒否される', async () => {
      tracker.setOperation('長文メッセージ拒否テスト');
      
      const longMessage = 'あ'.repeat(1001); // 1000文字超過
      const messageData = {
        message: longMessage,
        partnerId: testPartner.id
      };

      tracker.mark('長文メッセージ準備完了');

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(messageData)
        .expect(400);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('1000文字以内');

      tracker.mark('バリデーション確認完了');
    });

    it('存在しないパートナーでは送信できない', async () => {
      tracker.setOperation('不正パートナーID拒否テスト');
      
      const messageData = {
        message: 'テストメッセージ',
        partnerId: '00000000-0000-0000-0000-000000000000'
      };

      tracker.mark('不正リクエストデータ準備完了');

      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(messageData)
        .expect(404);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('見つかりません');

      tracker.mark('エラーハンドリング確認完了');
    });

    it('認証なしでは送信できない', async () => {
      tracker.setOperation('認証なし送信拒否テスト');
      
      const messageData = {
        message: 'テストメッセージ',
        partnerId: testPartner.id
      };

      tracker.mark('認証なしリクエスト準備完了');

      const response = await request(app)
        .post('/api/chat/messages')
        .send(messageData)
        .expect(401);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(false);

      tracker.mark('認証チェック確認完了');
    });
  });

  describe('GET /api/chat/messages - メッセージ履歴取得', () => {
    beforeEach(async () => {
      tracker.setOperation('メッセージ履歴テスト用データ準備');
      
      // テスト用メッセージを作成
      await dbTestHelper.createTestMessage(testPartner.id, {
        content: '最初のメッセージです',
        sender: MessageSender.USER
      });
      
      await dbTestHelper.createTestMessage(testPartner.id, {
        content: 'こんにちは！よろしくお願いします。',
        sender: MessageSender.PARTNER,
        emotion: 'happy'
      });

      await dbTestHelper.createTestMessage(testPartner.id, {
        content: '今日はいい天気ですね',
        sender: MessageSender.USER
      });

      tracker.mark('テストメッセージ作成完了');
    });

    it('メッセージ履歴を正常に取得できる', async () => {
      tracker.setOperation('メッセージ履歴取得テスト');
      
      const response = await request(app)
        .get(`/api/chat/messages?partnerId=${testPartner.id}&limit=10&offset=0`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.hasMore).toBe(false);

      // メッセージが時系列順（古い順）に並んでいることを確認
      const messages = response.body.data.messages;
      expect(messages[0].content).toBe('最初のメッセージです');
      expect(messages[1].content).toBe('こんにちは！よろしくお願いします。');
      expect(messages[2].content).toBe('今日はいい天気ですね');

      tracker.mark('メッセージ順序確認完了');
    });

    it('ページネーションが正常に動作する', async () => {
      tracker.setOperation('ページネーション動作テスト');
      
      const response = await request(app)
        .get(`/api/chat/messages?partnerId=${testPartner.id}&limit=2&offset=1`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.hasMore).toBe(false);

      tracker.mark('ページネーション確認完了');
    });

    it('存在しないパートナーでは取得できない', async () => {
      tracker.setOperation('不正パートナーID履歴取得拒否テスト');
      
      const response = await request(app)
        .get('/api/chat/messages?partnerId=00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(404);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('見つかりません');

      tracker.mark('エラーハンドリング確認完了');
    });
  });

  describe('POST /api/chat/typing - タイピング状態通知', () => {
    it('タイピング状態を正常に通知できる', async () => {
      tracker.setOperation('タイピング状態通知テスト');
      
      const typingData = {
        partnerId: testPartner.id,
        isTyping: true,
        message: 'こんにち'
      };

      tracker.mark('タイピングデータ準備完了');

      const response = await request(app)
        .post('/api/chat/typing')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(typingData)
        .expect(200);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.partnerId).toBe(testPartner.id);
      expect(response.body.data.isTyping).toBe(true);
      expect(response.body.data.timestamp).toBeTruthy();

      tracker.mark('タイピング状態確認完了');
    });

    it('タイピング停止状態を正常に通知できる', async () => {
      tracker.setOperation('タイピング停止通知テスト');
      
      const typingData = {
        partnerId: testPartner.id,
        isTyping: false
      };

      tracker.mark('タイピング停止データ準備完了');

      const response = await request(app)
        .post('/api/chat/typing')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(typingData)
        .expect(200);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.isTyping).toBe(false);

      tracker.mark('タイピング停止確認完了');
    });
  });

  describe('GET /api/chat/emotion - 感情状態取得', () => {
    beforeEach(async () => {
      tracker.setOperation('感情状態テスト用データ準備');
      
      // 感情付きメッセージを作成
      await dbTestHelper.createTestMessage(testPartner.id, {
        content: 'とても嬉しいです！',
        sender: MessageSender.PARTNER,
        emotion: 'excited'
      });

      tracker.mark('感情付きメッセージ作成完了');
    });

    it('感情状態を正常に取得できる', async () => {
      tracker.setOperation('感情状態取得テスト');
      
      const response = await request(app)
        .get(`/api/chat/emotion?partnerId=${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data.emotion).toBe('excited');
      expect(response.body.data.intimacyLevel).toBe(30);

      tracker.mark('感情状態確認完了');
    });
  });

  describe('チャット完全フローテスト', () => {
    it('連続的な会話フローが正常に動作する', async () => {
      tracker.setOperation('完全会話フローテスト');
      
      // 1. 最初の挨拶
      const greeting = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          message: 'はじめまして！よろしくお願いします',
          partnerId: testPartner.id
        })
        .expect(200);

      tracker.mark('挨拶メッセージ送信完了');

      expect(greeting.body.data.response).toBeTruthy();
      const initialIntimacy = greeting.body.data.intimacyLevel;

      // 2. 感情状態取得
      const emotion1 = await request(app)
        .get(`/api/chat/emotion?partnerId=${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('感情状態取得完了');

      expect(emotion1.body.data.emotion).toBeTruthy();

      // 3. 継続的な会話
      const conversation = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          message: '今日はとてもいい天気ですね。お散歩でもしませんか？',
          partnerId: testPartner.id
        })
        .expect(200);

      tracker.mark('継続会話送信完了');

      expect(conversation.body.data.response).toBeTruthy();
      const updatedIntimacy = conversation.body.data.intimacyLevel;

      // 4. メッセージ履歴確認
      const history = await request(app)
        .get(`/api/chat/messages?partnerId=${testPartner.id}`)
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      tracker.mark('メッセージ履歴取得完了');

      expect(history.body.data.messages).toHaveLength(4); // ユーザー2 + AI2
      expect(history.body.data.messages[0].content).toBe('はじめまして！よろしくお願いします');

      // 5. 親密度の変化確認（必ずしも上昇するとは限らないため、数値として有効であることを確認）
      expect(typeof updatedIntimacy).toBe('number');
      expect(updatedIntimacy).toBeGreaterThanOrEqual(0);
      expect(updatedIntimacy).toBeLessThanOrEqual(100);

      tracker.mark('完全フローテスト検証完了');

      console.log(`完全フローテスト結果 - 初期親密度: ${initialIntimacy}, 更新後親密度: ${updatedIntimacy}`);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('無効なJSON形式は拒否される', async () => {
      tracker.setOperation('無効JSON拒否テスト');
      
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(false);

      tracker.mark('無効JSON拒否確認完了');
    });

    it('空のメッセージは拒否される', async () => {
      tracker.setOperation('空メッセージ拒否テスト');
      
      const response = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          message: '   ', // 空白のみ
          partnerId: testPartner.id
        })
        .expect(400);

      tracker.mark('API呼び出し完了');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('空白のみ');

      tracker.mark('空メッセージ拒否確認完了');
    });
  });
});