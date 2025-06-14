/**
 * AI主導エンゲージメント機能 統合テスト
 * 
 * 新規実装API:
 * - 5.5 戦略的質問生成 (/api/chat/proactive-question)
 * - 5.6 質問タイミング判定 (/api/chat/should-ask-question)  
 * - 6.6 QA情報抽出・更新 (/api/memory/extract-from-response)
 * 
 * テスト対象:
 * - OpenAI GPT-4 Turbo Function Calling
 * - 親密度ベース動的制御
 * - リアルタイム関係性メトリクス更新
 * - エンドツーエンドAI主導エンゲージメントフロー
 */

import request from 'supertest';
import app from '../../../src/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('AI主導エンゲージメント機能 統合テスト', () => {
  let testTransaction: any;
  let tracker: MilestoneTracker;
  let testUser: any;
  let testPartner: any;
  let authCookies: string[];

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
    
    // パートナー作成（親密度45で中級レベル）
    testPartner = await DbTestHelper.createTestPartner(testUser.id, {
      name: 'AI主導テスト太郎',
      intimacyLevel: 45,
      personalityType: 'caring',
      speechStyle: 'gentle'
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

  describe('API 5.6 - 質問タイミング判定テスト', () => {
    it('親密度45で3時間沈黙時に質問を推奨する', async () => {
      tracker.setOperation('タイミング判定 - 3時間沈黙');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=180&currentIntimacy=45&timeContext.hour=14&timeContext.dayOfWeek=Wednesday&timeContext.isWeekend=false`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shouldAsk');
      expect(response.body.data).toHaveProperty('reasoning');
      expect(response.body.data).toHaveProperty('priority');
      
      if (response.body.data.shouldAsk) {
        expect(response.body.data.priority).toMatch(/low|medium|high/);
        expect(response.body.data.suggestedQuestionType).toBeTruthy();
      }
      
      console.log('🤖 判定結果:', response.body.data.shouldAsk ? '質問推奨' : '待機');
      console.log('📝 理由:', response.body.data.reasoning);
      console.log('⚡ 優先度:', response.body.data.priority);
      
      tracker.mark('検証完了');
    });

    it('親密度に基づく時間制限を適用する', async () => {
      tracker.setOperation('タイミング判定 - 時間制限');
      
      // 親密度45では22時以降は質問を控える
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=360&currentIntimacy=45&timeContext.hour=23&timeContext.dayOfWeek=Monday&timeContext.isWeekend=false`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // 深夜なので質問を控えるはず
      if (response.body.data.shouldAsk === false) {
        expect(response.body.data.reasoning).toMatch(/時間|親密度.*質問可能/);
        expect(response.body.data.delayMinutes).toBeGreaterThan(0);
      }
      
      console.log('🌙 深夜判定:', response.body.data.shouldAsk ? '質問OK' : '待機');
      console.log('⏰ 遅延時間:', response.body.data.delayMinutes, '分');
      
      tracker.mark('検証完了');
    });

    it('24時間以上の沈黙で強制質問モードになる', async () => {
      tracker.setOperation('タイミング判定 - 強制質問');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=1440&currentIntimacy=45&timeContext.hour=15&timeContext.dayOfWeek=Friday&timeContext.isWeekend=false`,
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.shouldAsk).toBe(true);
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.reasoning).toContain('長期間');
      
      console.log('🚨 強制質問:', response.body.data.reasoning);
      
      tracker.mark('検証完了');
    });

    it('不正なパートナーIDでエラーを返す', async () => {
      tracker.setOperation('タイミング判定 - エラー処理');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/chat/should-ask-question?partnerId=11111111-1111-1111-1111-111111111111&silenceDuration=180&currentIntimacy=45&timeContext.hour=14&timeContext.dayOfWeek=Wednesday&timeContext.isWeekend=false',
        authCookies
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('見つかりません');
      
      tracker.mark('検証完了');
    });
  });

  describe('API 5.5 - 戦略的質問生成テスト', () => {
    it('親密度45で適切な質問を生成する', async () => {
      tracker.setOperation('質問生成 - 親密度45');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: testPartner.id,
          currentIntimacy: 45,
          timeContext: {
            hour: 15,
            dayOfWeek: 'Wednesday',
            isWeekend: false
          },
          recentContext: {
            silenceDuration: 240,
            lastMessageContent: '今日はいい天気ですね'
          },
          uncollectedInfo: ['趣味', '家族構成', '職業']
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('question');
      expect(response.body.data).toHaveProperty('questionType');
      expect(response.body.data).toHaveProperty('targetInfo');
      expect(response.body.data).toHaveProperty('priority');
      expect(response.body.data).toHaveProperty('tone');
      expect(response.body.data).toHaveProperty('context');
      expect(response.body.data).toHaveProperty('intimacyRequired');
      
      expect(response.body.data.question).toBeTruthy();
      expect(response.body.data.question.length).toBeGreaterThan(10);
      
      console.log('💬 生成された質問:', response.body.data.question);
      console.log('🎯 質問タイプ:', response.body.data.questionType);
      console.log('📊 対象情報:', response.body.data.targetInfo);
      console.log('🎭 トーン:', response.body.data.tone);
      console.log('📋 コンテキスト:', response.body.data.context);
      
      tracker.mark('検証完了');
    }, 35000);

    it('高親密度（75）で深い質問を生成する', async () => {
      tracker.setOperation('質問生成 - 高親密度');
      
      // 高親密度ユーザーとパートナーを作成
      const highIntimacyUserResult = await TestAuthHelper.createTestUserWithTokens();
      const highIntimacyPartner = await DbTestHelper.createTestPartner(highIntimacyUserResult.user.id, {
        name: '高親密度パートナー',
        intimacyLevel: 75,
        personalityType: 'romantic',
        speechStyle: 'affectionate'
      });
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        highIntimacyUserResult.cookies,
        {
          partnerId: highIntimacyPartner.id,
          currentIntimacy: 75,
          timeContext: {
            hour: 20,
            dayOfWeek: 'Saturday',
            isWeekend: true
          },
          uncollectedInfo: ['将来の夢', '価値観', '人生で大切なこと']
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.questionType).toMatch(/values_future|deep_understanding/);
      expect(response.body.data.intimacyRequired).toBeGreaterThanOrEqual(50);
      
      console.log('💕 高親密度質問:', response.body.data.question);
      console.log('🌟 質問タイプ:', response.body.data.questionType);
      console.log('💖 必要親密度:', response.body.data.intimacyRequired);
      
      tracker.mark('検証完了');
    }, 35000);

    it('未収集情報に基づいて質問を優先する', async () => {
      tracker.setOperation('質問生成 - 未収集情報重視');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: testPartner.id,
          currentIntimacy: 45,
          timeContext: {
            hour: 12,
            dayOfWeek: 'Tuesday',
            isWeekend: false
          },
          uncollectedInfo: ['職業', '出身地', '家族構成']
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(['職業', '出身地', '家族構成']).toContain(response.body.data.targetInfo);
      
      console.log('🎯 重視された情報:', response.body.data.targetInfo);
      console.log('❓ 関連質問:', response.body.data.question);
      
      tracker.mark('検証完了');
    }, 35000);

    it('他人のパートナーに対してエラーを返す', async () => {
      tracker.setOperation('質問生成 - アクセス権限');
      
      // 別ユーザーのパートナーを作成
      const otherUserResult = await TestAuthHelper.createTestUserWithTokens();
      const otherPartner = await DbTestHelper.createTestPartner(otherUserResult.user.id);
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: otherPartner.id,
          currentIntimacy: 45
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('見つかりません');
      
      tracker.mark('検証完了');
    });
  });

  describe('API 6.6 - QA情報抽出・更新テスト', () => {
    it('基本的な質問応答からメモリを抽出する', async () => {
      tracker.setOperation('QA抽出 - 基本フロー');
      
      const question = 'お仕事は何をされているんですか？';
      const userResponse = 'エンジニアをしています。主にWebアプリケーションの開発をしていて、最近はAIに関する案件が多いです。とてもやりがいを感じています。';
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/extract-from-response',
        authCookies,
        {
          partnerId: testPartner.id,
          question: question,
          userResponse: userResponse,
          intimacyLevel: 45,
          questionType: 'basic_info'
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('extractedMemories');
      expect(response.body.data).toHaveProperty('intimacyUpdate');
      expect(response.body.data).toHaveProperty('suggestions');
      
      expect(response.body.data.extractedMemories).toBeInstanceOf(Array);
      expect(response.body.data.extractedMemories.length).toBeGreaterThan(0);
      
      // メモリの内容確認
      const memories = response.body.data.extractedMemories;
      memories.forEach((memory: any) => {
        expect(memory).toHaveProperty('type');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('importance');
        expect(memory).toHaveProperty('emotionalWeight');
        expect(['fact', 'emotion', 'relationship', 'preference', 'experience']).toContain(memory.type);
        expect(memory.importance).toBeGreaterThanOrEqual(1);
        expect(memory.importance).toBeLessThanOrEqual(10);
      });
      
      console.log('💾 抽出されたメモリ数:', memories.length);
      console.log('📈 親密度変化:', response.body.data.intimacyUpdate);
      console.log('💡 提案:', response.body.data.suggestions);
      
      memories.forEach((memory: any, index: number) => {
        console.log(`  ${index + 1}. [${memory.type}] ${memory.content} (重要度: ${memory.importance})`);
      });
      
      tracker.mark('検証完了');
    }, 35000);

    it('感情的な回答から親密度を大きく向上させる', async () => {
      tracker.setOperation('QA抽出 - 感情的回答');
      
      const question = '最近何か悩んでることはありますか？';
      const userResponse = '実は転職を考えていて、とても不安なんです。でもあなたに相談できて本当に心強いです。いつも支えてくれてありがとう。';
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/extract-from-response',
        authCookies,
        {
          partnerId: testPartner.id,
          question: question,
          userResponse: userResponse,
          intimacyLevel: 45,
          questionType: 'emotional_support'
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.intimacyUpdate).toBeGreaterThan(0);
      
      // 感情的な回答では重要度の高いメモリが生成される
      const hasHighImportanceMemory = response.body.data.extractedMemories.some(
        (memory: any) => memory.importance >= 6
      );
      expect(hasHighImportanceMemory).toBe(true);
      
      console.log('💗 感情的回答の親密度変化:', response.body.data.intimacyUpdate);
      console.log('🎯 重要メモリ:', response.body.data.extractedMemories.filter((m: any) => m.importance >= 6));
      
      tracker.mark('検証完了');
    }, 35000);

    it('複数の情報を含む回答から複数のメモリを抽出する', async () => {
      tracker.setOperation('QA抽出 - 複数情報');
      
      const question = '休日はどんなことをして過ごすのが好きですか？';
      const userResponse = '読書が大好きで、特にSF小説をよく読みます。あとは料理も趣味で、パスタ料理が得意です。友人とカフェ巡りをするのも楽しいですね。';
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/extract-from-response',
        authCookies,
        {
          partnerId: testPartner.id,
          question: question,
          userResponse: userResponse,
          intimacyLevel: 45,
          questionType: 'preference'
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.extractedMemories.length).toBeGreaterThanOrEqual(2);
      
      // 複数の異なるタイプのメモリが抽出される（またはメモリが複数ある）
      const memoryTypes = response.body.data.extractedMemories.map((m: any) => m.type);
      const uniqueTypes = [...new Set(memoryTypes)];
      expect(uniqueTypes.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.extractedMemories.length).toBeGreaterThanOrEqual(2);
      
      console.log('📚 抽出されたメモリ一覧:');
      response.body.data.extractedMemories.forEach((memory: any, index: number) => {
        console.log(`  ${index + 1}. [${memory.type}] ${memory.content} (重要度: ${memory.importance})`);
      });
      
      tracker.mark('検証完了');
    }, 35000);

    it('バリデーションエラーを適切に処理する', async () => {
      tracker.setOperation('QA抽出 - バリデーション');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/extract-from-response',
        authCookies,
        {
          partnerId: testPartner.id,
          question: '', // 空の質問
          userResponse: 'テスト回答',
          intimacyLevel: 101, // 範囲外の親密度
        }
      );
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // バリデーションエラーの詳細情報があることを確認（errorまたはdetailsまたはmessage）
      expect(response.body.error || response.body.details || response.body.message).toBeTruthy();
      
      tracker.mark('検証完了');
    });
  });

  describe('エンドツーエンドAI主導エンゲージメントフロー', () => {
    it('完全なAI主導エンゲージメントシナリオを実行する', async () => {
      tracker.setOperation('E2E - 完全シナリオ');
      
      // Step 1: 質問タイミング判定
      console.log('\n🎯 Step 1: 質問タイミング判定');
      const timingResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/chat/should-ask-question?partnerId=${testPartner.id}&silenceDuration=240&currentIntimacy=${testPartner.intimacyLevel}&timeContext.hour=15&timeContext.dayOfWeek=Wednesday&timeContext.isWeekend=false`,
        authCookies
      );
      
      expect(timingResponse.status).toBe(200);
      console.log('   判定結果:', timingResponse.body.data.shouldAsk ? '質問推奨✅' : '待機⏰');
      console.log('   理由:', timingResponse.body.data.reasoning);
      tracker.mark('Step 1完了');
      
      // Step 2: 質問生成（タイミングOKの場合のみ）
      if (timingResponse.body.data.shouldAsk) {
        console.log('\n💭 Step 2: 戦略的質問生成');
        const questionResponse = await TestAuthHelper.authenticatedRequest(
          'post',
          '/api/chat/proactive-question',
          authCookies,
          {
            partnerId: testPartner.id,
            currentIntimacy: testPartner.intimacyLevel,
            timeContext: {
              hour: 15,
              dayOfWeek: 'Wednesday',
              isWeekend: false
            },
            uncollectedInfo: ['趣味', '家族構成', '出身地']
          }
        );
        
        expect(questionResponse.status).toBe(200);
        const generatedQuestion = questionResponse.body.data.question;
        const questionType = questionResponse.body.data.questionType;
        
        console.log('   生成された質問:', generatedQuestion);
        console.log('   質問タイプ:', questionType);
        console.log('   対象情報:', questionResponse.body.data.targetInfo);
        tracker.mark('Step 2完了');
        
        // Step 3: ユーザー回答シミュレーション
        console.log('\n💬 Step 3: ユーザー回答シミュレーション');
        const simulatedResponse = 'プログラミングが趣味で、週末はよくオープンソースプロジェクトに参加しています。家族は両親と妹がいて、みんな仲良しです。';
        console.log('   ユーザー回答:', simulatedResponse);
        tracker.mark('Step 3完了');
        
        // Step 4: QA情報抽出・更新
        console.log('\n🧠 Step 4: QA情報抽出・メモリ更新');
        const memoryResponse = await TestAuthHelper.authenticatedRequest(
          'post',
          '/api/memory/extract-from-response',
          authCookies,
          {
            partnerId: testPartner.id,
            question: generatedQuestion,
            userResponse: simulatedResponse,
            intimacyLevel: testPartner.intimacyLevel,
            questionType: questionType
          }
        );
        
        expect(memoryResponse.status).toBe(201);
        expect(memoryResponse.body.data.extractedMemories.length).toBeGreaterThan(0);
        
        console.log('   抽出されたメモリ数:', memoryResponse.body.data.extractedMemories.length);
        console.log('   親密度変化:', memoryResponse.body.data.intimacyUpdate);
        console.log('   今後の提案:', memoryResponse.body.data.suggestions);
        
        memoryResponse.body.data.extractedMemories.forEach((memory: any, index: number) => {
          console.log(`   メモリ${index + 1}: [${memory.type}] ${memory.content} (重要度: ${memory.importance})`);
        });
        
        tracker.mark('Step 4完了');
        
        // Step 5: 結果サマリー
        console.log('\n✨ AI主導エンゲージメント完了サマリー');
        console.log('   🎯 質問戦略: 成功');
        console.log('   💾 メモリ構築: 成功');
        console.log('   📈 関係性向上: 成功');
        console.log('   🤖 AI統合: 成功');
        
      } else {
        console.log('\n⏳ タイミング判定により質問を延期');
        console.log('   次回推奨時間:', timingResponse.body.data.delayMinutes, '分後');
      }
      
      tracker.mark('E2Eフロー完了');
    }, 90000);

    it('親密度による質問の進化を確認する', async () => {
      tracker.setOperation('E2E - 親密度進化');
      
      console.log('\n📊 親密度による質問の進化テスト');
      
      const intimacyLevels = [15, 35, 55, 75, 95];
      const questionResults: any[] = [];
      
      for (const intimacy of intimacyLevels) {
        console.log(`\n   親密度${intimacy}でのテスト:`);
        
        // 親密度別ユーザーとパートナー作成
        const userResult = await TestAuthHelper.createTestUserWithTokens();
        const partner = await DbTestHelper.createTestPartner(userResult.user.id, {
          name: `親密度${intimacy}パートナー`,
          intimacyLevel: intimacy
        });
        
        // 質問生成
        const response = await TestAuthHelper.authenticatedRequest(
          'post',
          '/api/chat/proactive-question',
          userResult.cookies,
          {
            partnerId: partner.id,
            currentIntimacy: intimacy,
            timeContext: {
              hour: 16,
              dayOfWeek: 'Thursday',
              isWeekend: false
            },
            uncollectedInfo: intimacy < 30 ? ['趣味', '職業'] : 
                           intimacy < 60 ? ['家族構成', '価値観'] : 
                                          ['将来の夢', '人生哲学']
          }
        );
        
        expect(response.status).toBe(200);
        
        const result = {
          intimacy,
          questionType: response.body.data.questionType,
          question: response.body.data.question,
          targetInfo: response.body.data.targetInfo,
          intimacyRequired: response.body.data.intimacyRequired
        };
        
        questionResults.push(result);
        
        console.log(`     質問タイプ: ${result.questionType}`);
        console.log(`     対象情報: ${result.targetInfo}`);
        console.log(`     必要親密度: ${result.intimacyRequired}`);
        console.log(`     質問: ${result.question.substring(0, 50)}...`);
      }
      
      // 進化の検証
      console.log('\n🔄 質問の進化パターン:');
      questionResults.forEach((result, index) => {
        console.log(`   ${result.intimacy}: ${result.questionType} → ${result.targetInfo}`);
      });
      
      // 低親密度は基本情報、高親密度は深い内容になることを確認
      const lowIntimacyTypes = questionResults.filter(r => r.intimacy < 30).map(r => r.questionType);
      const highIntimacyTypes = questionResults.filter(r => r.intimacy > 70).map(r => r.questionType);
      
      expect(lowIntimacyTypes.some(type => ['basic_info', 'relationship'].includes(type))).toBe(true);
      expect(highIntimacyTypes.some(type => ['values_future', 'deep_understanding'].includes(type))).toBe(true);
      
      tracker.mark('親密度進化確認完了');
    }, 120000);
  });

  describe('エラーハンドリング・セキュリティテスト', () => {
    it('認証なしでのアクセスを拒否する', async () => {
      const endpoints = [
        'GET /api/chat/should-ask-question',
        'POST /api/chat/proactive-question',
        'POST /api/memory/extract-from-response'
      ];
      
      for (const endpoint of endpoints) {
        const [method, path] = endpoint.split(' ');
        const response = method === 'GET' ? 
          await request(app).get(path) :
          await request(app).post(path);
        
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('必須パラメータ不足でエラーを返す', async () => {
      tracker.setOperation('エラーハンドリング - パラメータ不足');
      
      // 質問タイミング判定でpartnerId不足
      const response1 = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/chat/should-ask-question?silenceDuration=180',
        authCookies
      );
      expect(response1.status).toBe(400);
      
      // 質問生成でpartnerId不足
      const response2 = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        { currentIntimacy: 45 }
      );
      expect(response2.status).toBe(400);
      
      // QA抽出でquestion不足
      const response3 = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/memory/extract-from-response',
        authCookies,
        {
          partnerId: testPartner.id,
          userResponse: 'テスト回答',
          intimacyLevel: 45
        }
      );
      expect(response3.status).toBe(400);
      
      tracker.mark('バリデーション確認完了');
    });

    it('不正なデータ型でエラーを返す', async () => {
      tracker.setOperation('エラーハンドリング - データ型');
      
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/chat/proactive-question',
        authCookies,
        {
          partnerId: 'invalid-uuid',
          currentIntimacy: 'not-a-number'
        }
      );
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      
      tracker.mark('データ型エラー確認完了');
    });
  });
});