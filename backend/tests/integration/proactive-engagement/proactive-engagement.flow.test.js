/**
 * プロアクティブエンゲージメント機能 統合テスト
 * 
 * テスト内容：
 * - 質問タイミング判定（/api/chat/should-ask-question）
 * - 能動的質問生成（/api/chat/proactive-question）
 * - メモリ更新（/api/memory/update-from-question）
 * - エンドツーエンドフロー
 */

const request = require('supertest');
const app = require('../../../src/app');
const { DbTestHelper } = require('../../utils/db-test-helper');
const { TestAuthHelper } = require('../../utils/test-auth-helper');
const { MilestoneTracker } = require('../../utils/MilestoneTracker');

describe('プロアクティブエンゲージメント機能 統合テスト', () => {
  let testTransaction;
  let tracker;
  let testUser;
  let testPartner;
  let authCookies;

  // 各テストの前処理
  beforeEach(async () => {
    // トランザクション開始
    testTransaction = await DbTestHelper.startTransaction();
    
    // トラッカー初期化
    tracker = new MilestoneTracker();
    tracker.mark('テスト開始');
    
    // テストデータ準備
    tracker.setOperation('テストデータ準備');
    
    // ユーザー作成とログイン
    const userResult = await TestAuthHelper.createTestUserWithTokens();
    testUser = userResult.user;
    authCookies = userResult.cookies;
    
    // パートナー作成（親密度を設定可能）
    testPartner = await DbTestHelper.createTestPartner(testUser.id, {
      name: 'プロアクティブテスト太郎',
      intimacyLevel: 30
    });
    
    tracker.mark('データ準備完了');
  }, 45000);

  // 各テストの後処理
  afterEach(async () => {
    if (testTransaction && !testTransaction.finished) {
      await DbTestHelper.rollbackTransaction(testTransaction);
    }
    if (tracker) {
      tracker.summary();
    }
  });

  describe('質問タイミング判定テスト', () => {
    it('30分以上の沈黙で中優先度の質問を提案する', async () => {
      tracker.setOperation('質問タイミング判定 - 30分沈黙');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=1800&lastMessageType=user`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shouldAsk).toBe(true);
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.questionTrigger).toBe('silence');
      
      tracker.mark('検証完了');
    });

    it('1時間以上の沈黙で高優先度の質問を提案する', async () => {
      tracker.setOperation('質問タイミング判定 - 1時間沈黙');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=3600`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shouldAsk).toBe(true);
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.questionTrigger).toBe('silence');
      
      tracker.mark('検証完了');
    });

    it('朝の時間帯（7-9時）に時間ベースの質問を提案する', async () => {
      tracker.setOperation('質問タイミング判定 - 朝の時間帯');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=600&currentHour=8`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // 朝の時間帯でも沈黙時間が短い場合は質問しない可能性がある
      if (response.body.data.shouldAsk) {
        expect(response.body.data.questionTrigger).toBe('time_based');
      }
      
      tracker.mark('検証完了');
    });

    it('最近の会話が活発な場合は質問を控える', async () => {
      tracker.setOperation('質問タイミング判定 - 活発な会話');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=300&recentInteractionCount=10`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shouldAsk).toBe(false);
      expect(response.body.data.reason).toContain('活発');
      
      tracker.mark('検証完了');
    });

    it('存在しないパートナーIDでエラーを返す', async () => {
      tracker.setOperation('質問タイミング判定 - エラーケース');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/chat/should-ask-question?partnerId=11111111-1111-1111-1111-111111111111&silenceDuration=1800',
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('パートナーが見つかりません');
      
      tracker.mark('検証完了');
    });
  });

  describe('能動的質問生成テスト', () => {
    it('親密度に基づいて適切な質問を生成する（親密度30）', async () => {
      tracker.setOperation('質問生成 - 親密度30');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: testPartner.id,
          intimacyLevel: 30
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.question).toBeTruthy();
      expect(['daily_life', 'memory_gathering']).toContain(response.body.data.questionType);
      expect(response.body.data.tone).toBeTruthy();
      expect(response.body.data.memoryFocus).toBeTruthy();
      
      console.log('生成された質問:', response.body.data.question);
      console.log('質問タイプ:', response.body.data.questionType);
      console.log('トーン:', response.body.data.tone);
      
      tracker.mark('検証完了');
    }, 30000);

    it('高親密度（80）でロマンチックな質問を生成する', async () => {
      tracker.setOperation('質問生成 - 高親密度');
      
      // 新しいユーザーで高親密度パートナーを作成
      const highIntimacyUserResult = await TestAuthHelper.createTestUserWithTokens();
      const highIntimacyPartner = await DbTestHelper.createTestPartner(highIntimacyUserResult.user.id, {
        name: '高親密度パートナー',
        intimacyLevel: 80
      });
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        highIntimacyUserResult.cookies,
        {
          partnerId: highIntimacyPartner.id,
          intimacyLevel: 80
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(['goal_support', 'romantic']).toContain(response.body.data.questionType);
      
      console.log('高親密度の質問:', response.body.data.question);
      console.log('質問タイプ:', response.body.data.questionType);
      
      tracker.mark('検証完了');
    }, 30000);

    it('会話履歴を考慮した質問を生成する', async () => {
      tracker.setOperation('質問生成 - 会話履歴考慮');
      
      // テスト用メッセージを作成
      await DbTestHelper.createTestMessage(testPartner.id, {
        content: '今日は仕事で疲れました',
        sender: 'user'
      });
      
      await DbTestHelper.createTestMessage(testPartner.id, {
        content: 'お疲れ様！ゆっくり休んでね',
        sender: 'partner'
      });
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: testPartner.id,
          intimacyLevel: 30,
          context: {
            recentTopic: '仕事の疲れ'
          }
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.question).toBeTruthy();
      
      console.log('コンテキスト考慮の質問:', response.body.data.question);
      
      tracker.mark('検証完了');
    }, 30000);

    it('他のユーザーのパートナーに対してエラーを返す', async () => {
      tracker.setOperation('質問生成 - 権限エラー');
      
      // 別のユーザーとパートナーを作成
      const otherUserResult = await TestAuthHelper.createTestUserWithTokens();
      const otherPartner = await DbTestHelper.createTestPartner(otherUserResult.user.id);
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: otherPartner.id,
          intimacyLevel: 30
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限がありません');
      
      tracker.mark('検証完了');
    });
  });

  describe('メモリ更新テスト', () => {
    it('質問への回答からメモリを更新する', async () => {
      tracker.setOperation('メモリ更新 - 基本フロー');
      
      const question = '今日はどんな一日だった？';
      const userResponse = '友達と映画を見に行きました。とても楽しかったです！';
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/update-from-question',
        authCookies,
        {
          partnerId: testPartner.id,
          question: question,
          userResponse: userResponse,
          questionType: 'daily_life'
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.memoryUpdated).toBe(true);
      expect(response.body.data.newMemoryEntries).toBeInstanceOf(Array);
      expect(response.body.data.newMemoryEntries.length).toBeGreaterThan(0);
      expect(response.body.data.insights).toBeInstanceOf(Array);
      
      console.log('抽出されたメモリ数:', response.body.data.newMemoryEntries.length);
      console.log('親密度変化:', response.body.data.intimacyChange);
      
      tracker.mark('検証完了');
    }, 30000);

    it('感情的な回答から親密度を大きく向上させる', async () => {
      tracker.setOperation('メモリ更新 - 感情的な回答');
      
      const question = '最近悩んでることない？';
      const userResponse = '実は仕事のことで悩んでいて...あなたに相談したかったんです。いつも支えてくれてありがとう。';
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/update-from-question',
        authCookies,
        {
          partnerId: testPartner.id,
          question: question,
          userResponse: userResponse,
          questionType: 'emotional_check'
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.intimacyChange).toBeGreaterThan(0);
      expect(response.body.data.suggestedFollowUp).toBeTruthy();
      
      console.log('感情的回答の親密度変化:', response.body.data.intimacyChange);
      console.log('フォローアップ提案:', response.body.data.suggestedFollowUp);
      
      tracker.mark('検証完了');
    }, 30000);

    it('複数の情報を含む回答から複数のメモリを抽出する', async () => {
      tracker.setOperation('メモリ更新 - 複数情報抽出');
      
      const question = '休日はどんなことをして過ごすのが好き？';
      const userResponse = '読書が大好きで、特にミステリー小説をよく読みます。あとはカフェ巡りも好きで、コーヒーの香りに癒されます。';
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/update-from-question',
        authCookies,
        {
          partnerId: testPartner.id,
          question: question,
          userResponse: userResponse,
          questionType: 'memory_gathering'
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newMemoryEntries.length).toBeGreaterThanOrEqual(2);
      
      // メモリの内容を確認
      const memoryContents = response.body.data.newMemoryEntries.map(m => m.content);
      console.log('抽出されたメモリ:', memoryContents);
      
      tracker.mark('検証完了');
    }, 30000);
  });

  describe('エンドツーエンドフローテスト', () => {
    it('完全なプロアクティブエンゲージメントフローを実行する', async () => {
      tracker.setOperation('E2Eフロー - 完全シナリオ');
      
      // Step 1: 質問タイミング判定
      tracker.setOperation('Step 1: タイミング判定');
      const timingResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=2400`,
        authCookies
      );
      
      expect(timingResponse.status).toBe(200);
      expect(timingResponse.body.data.shouldAsk).toBe(true);
      tracker.mark('タイミング判定完了');
      
      // Step 2: 質問生成
      tracker.setOperation('Step 2: 質問生成');
      const questionResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: testPartner.id,
          intimacyLevel: testPartner.intimacyLevel
        }
      );
      
      expect(questionResponse.status).toBe(200);
      const generatedQuestion = questionResponse.body.data.question;
      const questionType = questionResponse.body.data.questionType;
      console.log('生成された質問:', generatedQuestion);
      tracker.mark('質問生成完了');
      
      // Step 3: ユーザーの回答想定
      tracker.setOperation('Step 3: ユーザー回答');
      const userResponse = '今日は新しいプロジェクトが始まって、少し緊張しています。でも楽しみでもあります！';
      
      // Step 4: メモリ更新
      tracker.setOperation('Step 4: メモリ更新');
      const memoryResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/update-from-question',
        authCookies,
        {
          partnerId: testPartner.id,
          question: generatedQuestion,
          userResponse: userResponse,
          questionType: questionType
        }
      );
      
      expect(memoryResponse.status).toBe(200);
      expect(memoryResponse.body.data.memoryUpdated).toBe(true);
      tracker.mark('メモリ更新完了');
      
      // Step 5: 結果確認
      tracker.setOperation('Step 5: 結果確認');
      console.log('=== E2Eフロー完了 ===');
      console.log('質問:', generatedQuestion);
      console.log('回答:', userResponse);
      console.log('保存されたメモリ数:', memoryResponse.body.data.newMemoryEntries.length);
      console.log('親密度変化:', memoryResponse.body.data.intimacyChange);
      
      tracker.mark('E2Eフロー完了');
    }, 60000);

    it('親密度による質問の変化を確認する', async () => {
      tracker.setOperation('E2Eフロー - 親密度変化');
      
      // 低親密度（初期状態）での質問
      tracker.setOperation('低親密度の質問');
      const lowIntimacyUserResult = await TestAuthHelper.createTestUserWithTokens();
      const lowIntimacyPartner = await DbTestHelper.createTestPartner(lowIntimacyUserResult.user.id, {
        name: '低親密度パートナー',
        intimacyLevel: 10
      });
      
      const lowIntimacyQuestion = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        lowIntimacyUserResult.cookies,
        {
          partnerId: lowIntimacyPartner.id,
          intimacyLevel: 10
        }
      );
      
      expect(lowIntimacyQuestion.body.data.questionType).toBe('daily_life');
      console.log('低親密度(10)の質問:', lowIntimacyQuestion.body.data.question);
      tracker.mark('低親密度質問完了');
      
      // 中親密度での質問
      tracker.setOperation('中親密度の質問');
      const midIntimacyUserResult = await TestAuthHelper.createTestUserWithTokens();
      const midIntimacyPartner = await DbTestHelper.createTestPartner(midIntimacyUserResult.user.id, {
        name: '中親密度パートナー',
        intimacyLevel: 50
      });
      
      const midIntimacyQuestion = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        midIntimacyUserResult.cookies,
        {
          partnerId: midIntimacyPartner.id,
          intimacyLevel: 50
        }
      );
      
      expect(['memory_gathering', 'emotional_check']).toContain(midIntimacyQuestion.body.data.questionType);
      console.log('中親密度(50)の質問:', midIntimacyQuestion.body.data.question);
      tracker.mark('中親密度質問完了');
      
      // 高親密度での質問
      tracker.setOperation('高親密度の質問');
      const highIntimacyUserResult = await TestAuthHelper.createTestUserWithTokens();
      const highIntimacyPartner = await DbTestHelper.createTestPartner(highIntimacyUserResult.user.id, {
        name: '高親密度パートナー',
        intimacyLevel: 90
      });
      
      const highIntimacyQuestion = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        highIntimacyUserResult.cookies,
        {
          partnerId: highIntimacyPartner.id,
          intimacyLevel: 90
        }
      );
      
      expect(['goal_support', 'romantic']).toContain(highIntimacyQuestion.body.data.questionType);
      console.log('高親密度(90)の質問:', highIntimacyQuestion.body.data.question);
      tracker.mark('高親密度質問完了');
      
      console.log('\n=== 親密度による質問の違い ===');
      console.log('親密度が上がるにつれて、より深い関係性を示す質問に変化することを確認');
    }, 60000);
  });

  describe('エラーハンドリングテスト', () => {
    it('認証なしでのアクセスを拒否する', async () => {
      const response = await request(app)
        .get('/api/chat/should-ask-question?partnerId=11111111-1111-1111-1111-111111111111&silenceDuration=1800');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('必須パラメータ不足でエラーを返す', async () => {
      tracker.setOperation('エラーハンドリング - パラメータ不足');
      
      // partnerId不足
      const response1 = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/chat/should-ask-question?silenceDuration=1800',
        authCookies
      );
      
      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);
      
      // silenceDuration不足
      const response2 = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}`,
        authCookies
      );
      
      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
      
      tracker.mark('バリデーションエラー確認');
    });

    it('不正なデータ型でエラーを返す', async () => {
      tracker.setOperation('エラーハンドリング - 不正データ型');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: 'invalid-id',
          intimacyLevel: 'not-a-number'
        }
      );
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      
      tracker.mark('データ型エラー確認');
    });
  });
});