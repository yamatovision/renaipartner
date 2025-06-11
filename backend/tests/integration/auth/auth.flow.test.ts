import request from 'supertest';
import app from '../../../src/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('認証API統合テスト', () => {
  beforeEach(async () => {
    await DbTestHelper.beforeEach();
  });

  afterEach(async () => {
    await DbTestHelper.afterEach();
  });

  describe('ログインフロー', () => {
    it('正常なユーザーでログインできる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // テストユーザー作成
      tracker.setOperation('テストユーザー作成');
      const { user, credentials } = await DbTestHelper.createTestUser();
      tracker.mark('テストユーザー作成完了');

      // ログイン実行
      tracker.setOperation('ログイン実行');
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);
      tracker.mark('ログインレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(credentials.email);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();
      tracker.mark('レスポンス検証完了');

      // Cookieの確認
      tracker.setOperation('Cookie確認');
      const cookieHeader = loginResponse.headers['set-cookie'];
      const cookies = Array.isArray(cookieHeader) ? cookieHeader : (cookieHeader ? [cookieHeader] : []);
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.some((cookie: string) => cookie.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.startsWith('refreshToken='))).toBe(true);
      tracker.mark('Cookie確認完了');

      tracker.summary();
    });

    it('無効な認証情報でログインが拒否される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // テストユーザー作成
      tracker.setOperation('テストユーザー作成');
      const { user, credentials } = await DbTestHelper.createTestUser();
      tracker.mark('テストユーザー作成完了');

      // 間違ったパスワードでログイン試行
      tracker.setOperation('不正ログイン試行');
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: credentials.email,
          password: 'wrong-password'
        })
        .expect(401);
      tracker.mark('不正ログインレスポンス受信');

      // エラーレスポンス検証
      tracker.setOperation('エラーレスポンス検証');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('メールアドレスまたはパスワードが正しくありません');
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('トークンリフレッシュフロー', () => {
    it('有効なリフレッシュトークンで新しいアクセストークンを取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // ログイン実行
      tracker.setOperation('初回ログイン');
      const authData = await TestAuthHelper.loginAsUser();
      tracker.mark('初回ログイン完了');

      // トークン生成時刻を確実に変更するため少し待機
      await new Promise(resolve => setTimeout(resolve, 1001)); // 1秒以上待機

      // リフレッシュトークンで新しいトークンを取得
      tracker.setOperation('トークンリフレッシュ');
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: authData.refreshToken })
        .expect(200);
      tracker.mark('リフレッシュレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();
      expect(refreshResponse.body.data.accessToken).not.toBe(authData.accessToken);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('無効なリフレッシュトークンが拒否される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 無効なリフレッシュトークンでリクエスト
      tracker.setOperation('無効トークンリフレッシュ試行');
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
      tracker.mark('無効トークンリフレッシュレスポンス受信');

      // エラーレスポンス検証
      tracker.setOperation('エラーレスポンス検証');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      tracker.mark('エラーレスポンス検証完了');

      tracker.summary();
    });
  });

  describe('認証が必要なエンドポイントのアクセス制御', () => {
    it('認証済みユーザーが自分の情報を取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // ログイン実行
      tracker.setOperation('ログイン');
      const authData = await TestAuthHelper.loginAsUser();
      tracker.mark('ログイン完了');

      // 現在のユーザー情報取得
      tracker.setOperation('ユーザー情報取得');
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/auth/me',
        authData.cookies
      );
      tracker.mark('ユーザー情報レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(authData.user.email);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('未認証ユーザーが認証が必要なエンドポイントにアクセスできない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 認証なしでアクセス試行
      tracker.setOperation('未認証アクセス試行');
      await TestAuthHelper.testUnauthorizedAccess('/api/auth/me');
      tracker.mark('未認証アクセス検証完了');

      tracker.summary();
    });
  });

  describe('ログアウトフロー', () => {
    it('ログアウト後にトークンが無効化される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // ログイン実行
      tracker.setOperation('ログイン');
      const authData = await TestAuthHelper.loginAsUser();
      tracker.mark('ログイン完了');

      // ログアウト実行
      tracker.setOperation('ログアウト');
      await TestAuthHelper.logout(authData.cookies);
      tracker.mark('ログアウト完了');

      // ログアウト後のアクセス試行（失敗するべき）
      tracker.setOperation('ログアウト後アクセス試行');
      const response = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/auth/me',
        authData.cookies
      );
      tracker.mark('ログアウト後アクセスレスポンス受信');

      // アクセス拒否の確認
      tracker.setOperation('アクセス拒否確認');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      tracker.mark('アクセス拒否確認完了');

      tracker.summary();
    });
  });

  describe('完全認証フロー', () => {
    it('ユーザー作成からログアウトまでの完全フローが正常に動作する', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('完全フローテスト開始');

      // 1. 管理者でログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // 2. 新規ユーザー作成（管理者機能）
      tracker.setOperation('新規ユーザー作成');
      const newUserData = DbTestHelper.generateUniqueTestData('flow-test');
      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: newUserData.email,
          surname: newUserData.surname,
          firstName: newUserData.firstName,
          birthday: newUserData.birthday,
          password: 'test-password-123'
        }
      );
      expect(createResponse.status).toBe(201);
      tracker.mark('新規ユーザー作成完了');

      // 3. 作成されたユーザーでログイン
      tracker.setOperation('新規ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAndGetTokens({
        email: newUserData.email,
        password: 'test-password-123'
      });
      tracker.mark('新規ユーザーログイン完了');

      // 4. ユーザー情報確認
      tracker.setOperation('ユーザー情報確認');
      const userInfo = await TestAuthHelper.getCurrentUser(userAuth.cookies);
      expect(userInfo.email).toBe(newUserData.email);
      tracker.mark('ユーザー情報確認完了');

      // 5. ユーザーログアウト
      tracker.setOperation('ユーザーログアウト');
      await TestAuthHelper.logout(userAuth.cookies);
      tracker.mark('ユーザーログアウト完了');

      // 6. 管理者ログアウト
      tracker.setOperation('管理者ログアウト');
      await TestAuthHelper.logout(adminAuth.cookies);
      tracker.mark('管理者ログアウト完了');

      tracker.mark('完全フローテスト完了');
      tracker.summary();
    });
  });
});