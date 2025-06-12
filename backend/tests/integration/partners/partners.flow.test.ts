import request from 'supertest';
import app from '../../../src/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { PersonalityType, Gender, SpeechStyle } from '../../../src/types';

describe('パートナー管理API統合テスト', () => {
  beforeEach(async () => {
    await DbTestHelper.beforeEach();
  });

  afterEach(async () => {
    await DbTestHelper.afterEach();
  });

  describe('パートナー作成機能（API 3.1）', () => {
    it('ユーザーが新規パートナーを作成できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // パートナー作成データ準備
      tracker.setOperation('パートナー作成データ準備');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const partnerData = {
        name: `テスト${uniqueId}`,
        gender: Gender.BOYFRIEND,
        personalityType: PersonalityType.GENTLE,
        speechStyle: SpeechStyle.POLITE,
        systemPrompt: `あなたは優しくて思いやりのある理想的なパートナーです。相手のことを第一に考え、困った時は必ず力になってくれます。穏やかで安心感があり、一緒にいると心が落ち着く存在です。常に相手の気持ちに寄り添い、愛情深く接してください。`,
        avatarDescription: `優しい表情をした魅力的な${Gender.BOYFRIEND}。温かみのある目元と穏やかな笑顔が特徴的で、安心感を与える雰囲気を持っています。`,
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        hobbies: ['読書', 'カフェ巡り', '映画鑑賞'],
        intimacyLevel: 0
      };
      tracker.mark('パートナー作成データ準備完了');

      // パートナー作成実行
      tracker.setOperation('パートナー作成API呼び出し');
      console.log('送信するパートナーデータ:', JSON.stringify(partnerData, null, 2));
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        partnerData
      );
      tracker.mark('パートナー作成レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      console.log('パートナー作成レスポンス:', {
        status: response.status,
        body: JSON.stringify(response.body, null, 2)
      });
      if (response.status !== 201) {
        console.error('エラーレスポンス詳細:', JSON.stringify(response.body, null, 2));
        if (response.body.meta?.details) {
          console.error('バリデーションエラー詳細:', JSON.stringify(response.body.meta.details, null, 2));
        }
      }
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(partnerData.name);
      expect(response.body.data.gender).toBe(partnerData.gender);
      expect(response.body.data.personalityType).toBe(partnerData.personalityType);
      expect(response.body.data.speechStyle).toBe(partnerData.speechStyle);
      expect(response.body.data.systemPrompt).toBe(partnerData.systemPrompt);
      expect(response.body.data.intimacyLevel).toBe(0);
      tracker.mark('レスポンス検証完了');

      // データベース確認
      tracker.setOperation('データベース確認');
      const partnerId = response.body.data.id;
      const partnerDetailResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${partnerId}`,
        userAuth.cookies
      );
      expect(partnerDetailResponse.status).toBe(200);
      expect(partnerDetailResponse.body.data.name).toBe(partnerData.name);
      tracker.mark('データベース確認完了');

      tracker.summary();
    });

    it('重複パートナー作成が拒否される（1ユーザー1パートナー制約）', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 最初のパートナー作成
      tracker.setOperation('最初のパートナー作成');
      const firstPartnerData = {
        name: `最初${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.GIRLFRIEND,
        personalityType: PersonalityType.SWEET,
        speechStyle: SpeechStyle.SWEET,
        systemPrompt: `とても優しく、甘えん坊で、常に愛情表現が豊かな理想的なパートナーです。常にスキンシップを求め、愛情を言葉で伝えるのが好きです。`,
        avatarDescription: `甘い表情をした魅力的な女性。愛らしい目元と優しい笑顔が特徴的です。`,
        appearance: {
          hairStyle: 'long',
          eyeColor: 'brown',
          bodyType: 'slim',
          clothingStyle: 'elegant'
        },
        hobbies: ['お菓子作り', 'ショッピング']
      };

      const firstResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        firstPartnerData
      );
      expect(firstResponse.status).toBe(201);
      tracker.mark('最初のパートナー作成完了');

      // 2番目のパートナー作成試行（失敗するべき）
      tracker.setOperation('重複パートナー作成試行');
      const secondPartnerData = {
        name: `二番目${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.BOYFRIEND,
        personalityType: PersonalityType.COOL,
        speechStyle: SpeechStyle.COOL_TONE,
        systemPrompt: `落ち着いていて知的な性格。普段はクールだが、愛情深い一面を持ちます。論理的で冷静な判断ができ、感情的になりすぎることはありません。仕事や勉強の相談にも的確なアドバイスができます。`,
        avatarDescription: `知的でクールな表情をした魅力的な男性。`,
        appearance: {
          hairStyle: 'short',
          eyeColor: 'blue',
          bodyType: 'athletic',
          clothingStyle: 'formal'
        },
        hobbies: ['読書', '音楽鑑賞']
      };

      console.log('2番目のパートナーデータ:', JSON.stringify(secondPartnerData, null, 2));
      const secondResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        secondPartnerData
      );
      tracker.mark('重複パートナー作成レスポンス受信');
      
      if (secondResponse.status !== 409) {
        console.error('予期しないレスポンス:', JSON.stringify(secondResponse.body, null, 2));
      }

      // レスポンス検証（失敗するべき）
      tracker.setOperation('レスポンス検証');
      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.error).toContain('既にパートナーが作成されています');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('無効なシステムプロンプトで作成が拒否される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 無効なパートナー作成データ準備
      tracker.setOperation('無効なパートナー作成データ準備');
      const invalidPartnerData = {
        name: `無効${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.BOYFRIEND,
        personalityType: PersonalityType.GENTLE,
        speechStyle: SpeechStyle.POLITE,
        systemPrompt: '短すぎるプロンプト', // 50文字未満で無効
        avatarDescription: `テスト用のアバター説明です。`,
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        hobbies: ['テスト']
      };
      tracker.mark('無効なパートナー作成データ準備完了');

      // 無効なパートナー作成試行
      tracker.setOperation('無効なパートナー作成試行');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        invalidPartnerData
      );
      tracker.mark('無効なパートナー作成レスポンス受信');

      // レスポンス検証（失敗するべき）
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('パートナー情報取得機能（API 3.2, 3.3）', () => {
    it('ユーザーがパートナー情報を取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログインしてパートナー作成
      tracker.setOperation('ユーザーログインとパートナー作成');
      const userAuth = await TestAuthHelper.loginAsUser();
      const partnerData = {
        name: `取得${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.GIRLFRIEND,
        personalityType: PersonalityType.CHEERFUL,
        speechStyle: SpeechStyle.CASUAL,
        systemPrompt: `いつも明るく前向きで、周りを笑顔にする元気な性格です。どんな時でもポジティブに考え、相手を励ますのが得意です。一緒にいると自然と楽しい気持ちになれる、太陽のような存在です。`,
        avatarDescription: `明るい笑顔が印象的な魅力的な女性。`,
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        hobbies: ['スポーツ', 'カラオケ', 'アウトドア']
      };

      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        partnerData
      );
      expect(createResponse.status).toBe(201);
      const createdPartner = createResponse.body.data;
      tracker.mark('ユーザーログインとパートナー作成完了');

      // パートナー一覧取得（API 3.2）
      tracker.setOperation('パートナー一覧取得');
      const listResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/partners',
        userAuth.cookies
      );
      tracker.mark('パートナー一覧レスポンス受信');

      // 一覧レスポンス検証
      tracker.setOperation('一覧レスポンス検証');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data).not.toBeNull();
      expect(listResponse.body.data.id).toBe(createdPartner.id);
      expect(listResponse.body.data.name).toBe(partnerData.name);
      tracker.mark('一覧レスポンス検証完了');

      // パートナー詳細取得（API 3.3）
      tracker.setOperation('パートナー詳細取得');
      const detailResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${createdPartner.id}`,
        userAuth.cookies
      );
      tracker.mark('パートナー詳細レスポンス受信');

      // 詳細レスポンス検証
      tracker.setOperation('詳細レスポンス検証');
      expect(detailResponse.status).toBe(200);
      expect(detailResponse.body.success).toBe(true);
      expect(detailResponse.body.data.id).toBe(createdPartner.id);
      expect(detailResponse.body.data.name).toBe(partnerData.name);
      expect(detailResponse.body.data.systemPrompt).toBe(partnerData.systemPrompt);
      expect(detailResponse.body.data.appearance).toEqual({
        ...partnerData.appearance,
        generatedImageUrl: null
      });
      expect(detailResponse.body.data.hobbies).toEqual(partnerData.hobbies);
      tracker.mark('詳細レスポンス検証完了');

      tracker.summary();
    });

    it('パートナーが存在しない場合の取得', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // パートナーを作成していないユーザーでログイン
      tracker.setOperation('新規ユーザーログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      const newUserData = DbTestHelper.generateUniqueTestData('no-partner');
      
      const createUserResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: newUserData.email,
          surname: newUserData.surname,
          firstName: newUserData.firstName,
          birthday: newUserData.birthday,
          password: 'test-password'
        }
      );
      expect(createUserResponse.status).toBe(201);

      const userAuth = await TestAuthHelper.loginAndGetTokens({
        email: newUserData.email,
        password: 'test-password'
      });
      tracker.mark('新規ユーザーログイン完了');

      // パートナー一覧取得（存在しない）
      tracker.setOperation('パートナー一覧取得（存在しない）');
      const listResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/partners',
        userAuth.cookies
      );
      tracker.mark('パートナー一覧レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data).toBeNull();
      expect(listResponse.body.meta.hasPartner).toBe(false);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('パートナー更新機能（API 3.4）', () => {
    it('ユーザーがパートナー情報を更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // ユーザーログインとパートナー作成
      tracker.setOperation('ユーザーログインとパートナー作成');
      const userAuth = await TestAuthHelper.loginAsUser();
      const initialPartnerData = {
        name: `更新${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.BOYFRIEND,
        personalityType: PersonalityType.GENTLE,
        speechStyle: SpeechStyle.POLITE,
        systemPrompt: `初期のシステムプロンプトです。優しくて思いやりのある理想的なパートナーです。相手のことを第一に考え、困った時は必ず力になってくれます。`,
        avatarDescription: `初期のアバター説明です。`,
        appearance: {
          hairStyle: 'short',
          eyeColor: 'brown',
          bodyType: 'slim',
          clothingStyle: 'casual'
        },
        hobbies: ['読書', '映画鑑賞']
      };

      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        initialPartnerData
      );
      expect(createResponse.status).toBe(201);
      const partnerId = createResponse.body.data.id;
      tracker.mark('ユーザーログインとパートナー作成完了');

      // パートナー更新データ準備
      tracker.setOperation('パートナー更新データ準備');
      const updateData = {
        name: `済${Math.random().toString(36).substring(2, 6)}`,
        personalityType: PersonalityType.COOL,
        speechStyle: SpeechStyle.COOL_TONE,
        systemPrompt: `更新されたシステムプロンプトです。落ち着いていて知的な性格です。普段はクールだが、愛情深い一面を持ちます。論理的で冷静な判断ができ、感情的になりすぎることは少ないです。`,
        avatarDescription: `更新されたアバター説明です。知的でクールな印象を与えます。`,
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'blue',
          bodyType: 'athletic',
          clothingStyle: 'formal'
        },
        hobbies: ['音楽鑑賞', 'プログラミング', 'チェス']
      };
      tracker.mark('パートナー更新データ準備完了');

      // パートナー更新実行
      tracker.setOperation('パートナー更新API呼び出し');
      const updateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        `/api/partners/${partnerId}`,
        userAuth.cookies,
        updateData
      );
      tracker.mark('パートナー更新レスポンス受信');

      // 更新レスポンス検証
      tracker.setOperation('更新レスポンス検証');
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.personalityType).toBe(updateData.personalityType);
      expect(updateResponse.body.data.speechStyle).toBe(updateData.speechStyle);
      expect(updateResponse.body.data.systemPrompt).toBe(updateData.systemPrompt);
      expect(updateResponse.body.data.avatarDescription).toBe(updateData.avatarDescription);
      expect(updateResponse.body.data.appearance).toEqual({
        ...updateData.appearance,
        generatedImageUrl: null
      });
      expect(updateResponse.body.data.hobbies).toEqual(updateData.hobbies);
      tracker.mark('更新レスポンス検証完了');

      // 更新後の詳細取得で確認
      tracker.setOperation('更新後の詳細取得確認');
      const confirmResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${partnerId}`,
        userAuth.cookies
      );
      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.name).toBe(updateData.name);
      expect(confirmResponse.body.data.systemPrompt).toBe(updateData.systemPrompt);
      tracker.mark('更新後の詳細取得確認完了');

      tracker.summary();
    });

    it('他人のパートナーは更新できない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 最初のユーザーでパートナー作成
      tracker.setOperation('最初のユーザーでパートナー作成');
      const firstUserAuth = await TestAuthHelper.loginAsUser();
      const partnerData = {
        name: `他人${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.GIRLFRIEND,
        personalityType: PersonalityType.GENTLE,
        speechStyle: SpeechStyle.POLITE,
        systemPrompt: `優しくて思いやりのある理想的なパートナーです。相手のことを第一に考え、困った時は必ず力になってくれます。穏やかで安心感があります。`,
        avatarDescription: `優しい表情をした魅力的な女性。`,
        appearance: {
          hairStyle: 'long',
          eyeColor: 'brown',
          bodyType: 'slim',
          clothingStyle: 'elegant'
        },
        hobbies: ['読書', 'お茶']
      };

      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        firstUserAuth.cookies,
        partnerData
      );
      expect(createResponse.status).toBe(201);
      const partnerId = createResponse.body.data.id;
      tracker.mark('最初のユーザーでパートナー作成完了');

      // 2番目のユーザーを作成してログイン
      tracker.setOperation('2番目のユーザー作成とログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      const secondUserData = DbTestHelper.generateUniqueTestData('second-user');
      
      const createUserResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: secondUserData.email,
          surname: secondUserData.surname,
          firstName: secondUserData.firstName,
          birthday: secondUserData.birthday,
          password: 'test-password'
        }
      );
      expect(createUserResponse.status).toBe(201);

      const secondUserAuth = await TestAuthHelper.loginAndGetTokens({
        email: secondUserData.email,
        password: 'test-password'
      });
      tracker.mark('2番目のユーザー作成とログイン完了');

      // 2番目のユーザーが最初のユーザーのパートナーを更新しようとする（失敗するべき）
      tracker.setOperation('他人のパートナー更新試行');
      const updateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        `/api/partners/${partnerId}`,
        secondUserAuth.cookies,
        { name: '不正な更新' }
      );
      tracker.mark('他人のパートナー更新レスポンス受信');

      // レスポンス検証（失敗するべき）
      tracker.setOperation('レスポンス検証');
      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.success).toBe(false);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('プロンプト検証機能（API 3.5）', () => {
    it('有効なプロンプトの検証が成功する', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 有効なプロンプト検証
      tracker.setOperation('有効なプロンプト検証');
      const validPrompt = `あなたは優しくて思いやりのある理想的なパートナーです。相手のことを第一に考え、困った時は必ず力になってくれます。穏やかで安心感があり、一緒にいると心が落ち着く存在です。常に相手の気持ちに寄り添い、愛情深く接してください。相手の話をよく聞き、適切なアドバイスや励ましの言葉をかけることができます。`;

      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/validate-prompt',
        userAuth.cookies,
        { systemPrompt: validPrompt }
      );
      tracker.mark('プロンプト検証レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(Array.isArray(response.body.data.warnings)).toBe(true);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('無効なプロンプトの検証が警告を返す', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 無効なプロンプト検証（短すぎる）
      tracker.setOperation('無効なプロンプト検証');
      const invalidPrompt = 'あまりに短いプロンプト';

      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/validate-prompt',
        userAuth.cookies,
        { systemPrompt: invalidPrompt }
      );
      tracker.mark('プロンプト検証レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.warnings.length).toBeGreaterThan(0);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('プロンプトプレビュー機能（API 3.6）', () => {
    it('プロンプトプレビューが正常に生成される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // プロンプトプレビュー生成
      tracker.setOperation('プロンプトプレビュー生成');
      const systemPrompt = `あなたは優しくて思いやりのある理想的なパートナーです。相手のことを第一に考え、困った時は必ず力になってくれます。穏やかで安心感があり、一緒にいると心が落ち着く存在です。常に相手の気持ちに寄り添い、愛情深く接してください。`;
      const testMessage = 'こんにちは！今日はどんな一日でしたか？';

      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/preview',
        userAuth.cookies,
        { 
          systemPrompt,
          testMessage 
        }
      );
      tracker.mark('プロンプトプレビューレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.response).toBe('string');
      expect(response.body.data.response.length).toBeGreaterThan(0);
      expect(response.body.meta.testMessage).toBe(testMessage);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('デフォルトテストメッセージでプレビューが生成される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // デフォルトメッセージでプレビュー生成
      tracker.setOperation('デフォルトメッセージプレビュー生成');
      const systemPrompt = `あなたは明るく前向きな性格で、いつも元気いっぱいです。どんな時でもポジティブに考え、相手を励ますのが得意です。一緒にいると自然と楽しい気持ちになれる、太陽のような存在です。`;

      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/preview',
        userAuth.cookies,
        { systemPrompt } // testMessageを省略
      );
      tracker.mark('プレビューレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.response).toBe('string');
      expect(response.body.data.response.length).toBeGreaterThan(0);
      expect(response.body.meta.testMessage).toBe('こんにちは'); // デフォルト値
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('オンボーディング完了とパートナー作成機能（新エンドポイント）', () => {
    it('オンボーディング完了時に一括でユーザー情報更新とパートナー作成ができる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // オンボーディングデータ準備
      tracker.setOperation('オンボーディングデータ準備');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const onboardingData = {
        userData: {
          surname: '田中',
          firstName: `太郎${uniqueId}`,
          birthday: '1995-05-15'
        },
        partnerData: {
          name: `愛${uniqueId}`,
          gender: 'girlfriend',
          personality: 'gentle',
          speechStyle: 'polite',
          prompt: '優しくて思いやりのある理想的なパートナーです。彼らは常に相手を思いやり、困った時は必ず力になってくれます。',
          nickname: `${uniqueId}くん`,
          appearance: {
            hairStyle: 'long',
            eyeColor: 'brown',
            bodyType: 'average',
            clothingStyle: 'elegant'
          }
        }
      };
      tracker.mark('オンボーディングデータ準備完了');

      // オンボーディング完了API呼び出し
      tracker.setOperation('オンボーディング完了API呼び出し');
      console.log('送信するオンボーディングデータ:', JSON.stringify(onboardingData, null, 2));
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/create-with-onboarding',
        userAuth.cookies,
        onboardingData
      );
      tracker.mark('オンボーディング完了レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      console.log('オンボーディング完了レスポンス:', {
        status: response.status,
        body: JSON.stringify(response.body, null, 2)
      });
      if (response.status !== 201) {
        console.error('エラーレスポンス詳細:', JSON.stringify(response.body, null, 2));
        if (response.body.meta?.details) {
          console.error('バリデーションエラー詳細:', JSON.stringify(response.body.meta.details, null, 2));
        }
      }
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(onboardingData.partnerData.name);
      expect(response.body.data.gender).toBe(onboardingData.partnerData.gender);
      expect(response.body.data.personalityType).toBe(onboardingData.partnerData.personality);
      expect(response.body.data.speechStyle).toBe(onboardingData.partnerData.speechStyle);
      expect(response.body.data.appearance.hairStyle).toBe(onboardingData.partnerData.appearance.hairStyle);
      expect(response.body.data.appearance.eyeColor).toBe(onboardingData.partnerData.appearance.eyeColor);
      expect(response.body.data.appearance.bodyType).toBe(onboardingData.partnerData.appearance.bodyType);
      expect(response.body.data.appearance.clothingStyle).toBe(onboardingData.partnerData.appearance.clothingStyle);
      expect(response.body.data.intimacyLevel).toBe(0);
      expect(response.body.meta.message).toBe('オンボーディングが完了しました');
      tracker.mark('レスポンス検証完了');

      // パートナー情報が正常に作成されているかデータベース確認
      tracker.setOperation('パートナー作成確認');
      const partnerId = response.body.data.id;
      const partnerDetailResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${partnerId}`,
        userAuth.cookies
      );
      expect(partnerDetailResponse.status).toBe(200);
      expect(partnerDetailResponse.body.data.name).toBe(onboardingData.partnerData.name);
      expect(partnerDetailResponse.body.data.systemPrompt).toBe(onboardingData.partnerData.prompt);
      tracker.mark('パートナー作成確認完了');

      // ユーザー情報が更新されているか確認（パートナー存在チェック）
      tracker.setOperation('ユーザー情報更新確認');
      const partnerExistsResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/partners/exists',
        userAuth.cookies
      );
      expect(partnerExistsResponse.status).toBe(200);
      expect(partnerExistsResponse.body.data.hasPartner).toBe(true);
      tracker.mark('ユーザー情報更新確認完了');

      tracker.summary();
    });

    it('オンボーディング完了時のバリデーションエラーが適切に処理される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 無効なオンボーディングデータ準備（姓名が空）
      tracker.setOperation('無効なオンボーディングデータ準備');
      const invalidOnboardingData = {
        userData: {
          surname: '', // 空文字でバリデーションエラー
          firstName: '', // 空文字でバリデーションエラー
          birthday: '1995-05-15'
        },
        partnerData: {
          name: `無効${Math.random().toString(36).substring(2, 6)}`,
          gender: 'boyfriend',
          personality: 'cool',
          speechStyle: 'cool_tone',
          appearance: {
            hairStyle: 'short',
            eyeColor: 'blue',
            bodyType: 'athletic',
            clothingStyle: 'formal'
          }
        }
      };
      tracker.mark('無効なオンボーディングデータ準備完了');

      // 無効なオンボーディング完了API呼び出し
      tracker.setOperation('無効なオンボーディング完了API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/create-with-onboarding',
        userAuth.cookies,
        invalidOnboardingData
      );
      tracker.mark('無効なオンボーディング完了レスポンス受信');

      // エラーレスポンス検証
      tracker.setOperation('エラーレスポンス検証');
      console.log('バリデーションエラーレスポンス:', {
        status: response.status,
        body: JSON.stringify(response.body, null, 2)
      });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('入力データが無効です');
      expect(response.body.meta?.details).toBeDefined();
      expect(Array.isArray(response.body.meta.details)).toBe(true);
      expect(response.body.meta.details.length).toBeGreaterThan(0);
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });

    it('既にパートナーが存在する場合のオンボーディング完了が拒否される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 先にパートナーを作成
      tracker.setOperation('先にパートナーを作成');
      const firstPartnerData = {
        name: `先行${Math.random().toString(36).substring(2, 6)}`,
        gender: 'girlfriend',
        personalityType: 'sweet',
        speechStyle: 'sweet',
        systemPrompt: `とても優しく、甘えん坊で、常に愛情表現が豊かな理想的なパートナーです。彼らは常に相手を思いやり、困った時は必ず力になってくれます。`,
        avatarDescription: `甘い表情をした魅力的な女性。温かみのある目元と穏やかな笑顔が特徴的で、安心感を与える雰囲気を持っています。`,
        appearance: {
          hairStyle: 'long',
          eyeColor: 'brown',
          bodyType: 'slim',
          clothingStyle: 'elegant'
        },
        hobbies: ['お菓子作り']
      };

      const firstCreateResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        firstPartnerData
      );
      expect(firstCreateResponse.status).toBe(201);
      tracker.mark('先にパートナーを作成完了');

      // オンボーディング完了を試行（失敗するべき）
      tracker.setOperation('重複オンボーディング完了試行');
      const onboardingData = {
        userData: {
          surname: '鈴木',
          firstName: `花子${Math.random().toString(36).substring(2, 6)}`,
          birthday: '1992-08-20'
        },
        partnerData: {
          name: `二番目${Math.random().toString(36).substring(2, 6)}`,
          gender: 'boyfriend',
          personality: 'gentle',
          speechStyle: 'polite',
          appearance: {
            hairStyle: 'medium',
            eyeColor: 'brown',
            bodyType: 'average',
            clothingStyle: 'casual'
          }
        }
      };

      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/create-with-onboarding',
        userAuth.cookies,
        onboardingData
      );
      tracker.mark('重複オンボーディング完了レスポンス受信');

      // エラーレスポンス検証
      tracker.setOperation('エラーレスポンス検証');
      console.log('重複作成エラーレスポンス:', {
        status: response.status,
        body: JSON.stringify(response.body, null, 2)
      });
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('既にパートナーが作成されています');
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });

    it('カスタムプロンプトなしでデフォルトプロンプトが生成される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // カスタムプロンプトなしのオンボーディングデータ準備
      tracker.setOperation('デフォルトプロンプト用データ準備');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const onboardingData = {
        userData: {
          surname: '山田',
          firstName: `次郎${uniqueId}`,
          birthday: '1990-12-10'
        },
        partnerData: {
          name: `美香${uniqueId}`,
          gender: 'girlfriend',
          personality: 'cheerful',
          speechStyle: 'casual',
          // promptはなし、デフォルトが生成されるべき
          appearance: {
            hairStyle: 'medium',
            eyeColor: 'brown',
            bodyType: 'average',
            clothingStyle: 'casual'
          }
        }
      };
      tracker.mark('デフォルトプロンプト用データ準備完了');

      // オンボーディング完了API呼び出し
      tracker.setOperation('デフォルトプロンプトでオンボーディング完了');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/create-with-onboarding',
        userAuth.cookies,
        onboardingData
      );
      tracker.mark('デフォルトプロンプトオンボーディングレスポンス受信');

      // レスポンス検証
      tracker.setOperation('デフォルトプロンプトレスポンス検証');
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(onboardingData.partnerData.name);
      expect(response.body.data.systemPrompt).toContain(onboardingData.partnerData.name);
      expect(response.body.data.systemPrompt.length).toBeGreaterThan(50); // デフォルトプロンプトが生成されている
      tracker.mark('デフォルトプロンプトレスポンス検証完了');

      // システムプロンプト内容確認
      tracker.setOperation('デフォルトプロンプト内容確認');
      const partnerId = response.body.data.id;
      const partnerDetailResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${partnerId}`,
        userAuth.cookies
      );
      expect(partnerDetailResponse.status).toBe(200);
      expect(partnerDetailResponse.body.data.systemPrompt).toContain('あなたの名前は');
      expect(partnerDetailResponse.body.data.systemPrompt).toContain(onboardingData.partnerData.name);
      tracker.mark('デフォルトプロンプト内容確認完了');

      tracker.summary();
    });
  });

  describe('完全パートナー管理フロー', () => {
    it('パートナー作成から更新・削除まで完全フローが正常に動作する', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('完全フローテスト開始');

      // 1. ユーザーログイン
      tracker.setOperation('ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('ユーザーログイン完了');

      // 2. パートナー作成
      tracker.setOperation('パートナー作成');
      const partnerData = {
        name: `完全${Math.random().toString(36).substring(2, 6)}`,
        gender: Gender.GIRLFRIEND,
        personalityType: PersonalityType.TSUNDERE,
        speechStyle: SpeechStyle.CASUAL,
        systemPrompt: `表面上はクールで素直になれないが、本当は優しくて思いやりがあります。照れると「べ、別にそんなつもりじゃないし！」などと言います。優しさや愛情は遠回しに伝え、二人きりのときは少し甘え上手になります。`,
        avatarDescription: `ツンデレな表情が魅力的な女性。クールな外見だが、時折見せる優しい表情が印象的。`,
        appearance: {
          hairStyle: 'medium',
          eyeColor: 'blue',
          bodyType: 'slim',
          clothingStyle: 'casual'
        },
        hobbies: ['読書', 'お菓子作り（隠れ趣味）', '音楽鑑賞']
      };

      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners',
        userAuth.cookies,
        partnerData
      );
      expect(createResponse.status).toBe(201);
      const partnerId = createResponse.body.data.id;
      tracker.mark('パートナー作成完了');

      // 3. プロンプト検証
      tracker.setOperation('プロンプト検証');
      const validateResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/validate-prompt',
        userAuth.cookies,
        { systemPrompt: partnerData.systemPrompt }
      );
      expect(validateResponse.status).toBe(200);
      expect(validateResponse.body.data.isValid).toBe(true);
      tracker.mark('プロンプト検証完了');

      // 4. プロンプトプレビュー
      tracker.setOperation('プロンプトプレビュー');
      const previewResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/partners/preview',
        userAuth.cookies,
        { 
          systemPrompt: partnerData.systemPrompt,
          testMessage: '今日も会えて嬉しいよ'
        }
      );
      expect(previewResponse.status).toBe(200);
      expect(typeof previewResponse.body.data.response).toBe('string');
      tracker.mark('プロンプトプレビュー完了');

      // 5. パートナー情報取得
      tracker.setOperation('パートナー情報取得');
      const getResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${partnerId}`,
        userAuth.cookies
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.name).toBe(partnerData.name);
      tracker.mark('パートナー情報取得完了');

      // 6. パートナー更新
      tracker.setOperation('パートナー更新');
      const updateData = {
        name: `更新済み-${partnerData.name}`,
        personalityType: PersonalityType.SWEET,
        systemPrompt: `更新されたプロンプト: とても優しく、甘えん坊で、常に愛情表現が豊かです。「俺の大切な人」「ねぇ、今何してる？」など甘い言葉を多用し、常にスキンシップを求め、愛情を言葉で伝えるのが好きです。`
      };

      const updateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        `/api/partners/${partnerId}`,
        userAuth.cookies,
        updateData
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.personalityType).toBe(updateData.personalityType);
      tracker.mark('パートナー更新完了');

      // 7. 親密度更新
      tracker.setOperation('親密度更新');
      const intimacyResponse = await TestAuthHelper.authenticatedRequest(
        'patch',
        `/api/partners/${partnerId}/intimacy`,
        userAuth.cookies,
        { intimacyChange: 10 }
      );
      expect(intimacyResponse.status).toBe(200);
      expect(intimacyResponse.body.data.intimacyLevel).toBe(10);
      tracker.mark('親密度更新完了');

      // 8. 最終確認
      tracker.setOperation('最終確認');
      const finalGetResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/partners/${partnerId}`,
        userAuth.cookies
      );
      expect(finalGetResponse.status).toBe(200);
      expect(finalGetResponse.body.data.name).toBe(updateData.name);
      expect(finalGetResponse.body.data.personalityType).toBe(updateData.personalityType);
      expect(finalGetResponse.body.data.intimacyLevel).toBe(10);
      tracker.mark('最終確認完了');

      tracker.mark('完全フローテスト完了');
      tracker.summary();
    });
  });
});