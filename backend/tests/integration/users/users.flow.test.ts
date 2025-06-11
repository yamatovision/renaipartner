import request from 'supertest';
import app from '../../../src/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('ユーザー管理API統合テスト', () => {
  beforeEach(async () => {
    await DbTestHelper.beforeEach();
  });

  afterEach(async () => {
    await DbTestHelper.afterEach();
  });

  describe('管理者ユーザー管理機能', () => {
    it('管理者が新規ユーザーを作成できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 管理者でログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // 新規ユーザーデータ準備
      tracker.setOperation('テストデータ準備');
      const newUserData = DbTestHelper.generateUniqueTestData('admin-created');
      tracker.mark('テストデータ準備完了');

      // ユーザー作成実行
      tracker.setOperation('ユーザー作成API呼び出し');
      const response = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: newUserData.email,
          surname: newUserData.surname,
          firstName: newUserData.firstName,
          birthday: newUserData.birthday,
          password: 'admin-set-password'
        }
      );
      tracker.mark('ユーザー作成レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.role).toBe('user');
      tracker.mark('レスポンス検証完了');

      // データベース確認
      tracker.setOperation('データベース確認');
      const userExists = await DbTestHelper.userExists(newUserData.email);
      expect(userExists).toBe(true);
      tracker.mark('データベース確認完了');

      tracker.summary();
    });

    it('一般ユーザーが管理者機能にアクセスできない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 管理者機能へのアクセス試行（権限不足で拒否されるべき）
      tracker.setOperation('権限チェック');
      await TestAuthHelper.testForbiddenAccess('/api/admin/users', userAuth.cookies, 'post');
      tracker.mark('権限チェック完了');

      tracker.summary();
    });

    it('管理者がユーザー一覧を取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 管理者でログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // テストユーザーを複数作成
      tracker.setOperation('テストユーザー複数作成');
      const testUsers = [];
      for (let i = 0; i < 3; i++) {
        const userData = DbTestHelper.generateUniqueTestData(`list-test-${i}`);
        const createResponse = await TestAuthHelper.authenticatedRequest(
          'post',
          '/api/admin/users',
          adminAuth.cookies,
          {
            email: userData.email,
            surname: userData.surname,
            firstName: userData.firstName,
            birthday: userData.birthday
          }
        );
        expect(createResponse.status).toBe(201);
        testUsers.push(createResponse.body.data);
      }
      tracker.mark('テストユーザー複数作成完了');

      // ユーザー一覧取得
      tracker.setOperation('ユーザー一覧取得');
      const listResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/admin/users',
        adminAuth.cookies
      );
      tracker.mark('ユーザー一覧レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toBeInstanceOf(Array);
      expect(listResponse.body.data.total).toBeGreaterThanOrEqual(3);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('管理者がユーザーの無効化/有効化を実行できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 管理者でログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // テストユーザー作成
      tracker.setOperation('テストユーザー作成');
      const userData = DbTestHelper.generateUniqueTestData('status-test');
      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: userData.email,
          surname: userData.surname,
          firstName: userData.firstName,
          birthday: userData.birthday
        }
      );
      expect(createResponse.status).toBe(201);
      const createdUser = createResponse.body.data;
      tracker.mark('テストユーザー作成完了');

      // ユーザー無効化
      tracker.setOperation('ユーザー無効化');
      const deactivateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        `/api/admin/users/${createdUser.id}/deactivate`,
        adminAuth.cookies
      );
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body.data.status).toBe('inactive');
      tracker.mark('ユーザー無効化完了');

      // ユーザー有効化
      tracker.setOperation('ユーザー有効化');
      const activateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        `/api/admin/users/${createdUser.id}/activate`,
        adminAuth.cookies
      );
      expect(activateResponse.status).toBe(200);
      expect(activateResponse.body.data.status).toBe('active');
      tracker.mark('ユーザー有効化完了');

      tracker.summary();
    });
  });

  describe('ユーザー統計情報', () => {
    it('管理者がユーザー統計情報を取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 管理者でログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // 統計情報取得
      tracker.setOperation('統計情報取得');
      const statsResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/admin/users/stats',
        adminAuth.cookies
      );
      tracker.mark('統計情報レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toHaveProperty('totalUsers');
      expect(statsResponse.body.data).toHaveProperty('activeUsers');
      expect(statsResponse.body.data).toHaveProperty('inactiveUsers');
      expect(statsResponse.body.data).toHaveProperty('todayRegistrations');
      expect(typeof statsResponse.body.data.totalUsers).toBe('number');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('メールアドレス重複チェック', () => {
    it('既存メールアドレスの重複が正しく検出される', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 管理者でログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // テストユーザー作成
      tracker.setOperation('テストユーザー作成');
      const userData = DbTestHelper.generateUniqueTestData('duplicate-test');
      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: userData.email,
          surname: userData.surname,
          firstName: userData.firstName,
          birthday: userData.birthday
        }
      );
      expect(createResponse.status).toBe(201);
      tracker.mark('テストユーザー作成完了');

      // 重複チェック（既存メール）
      tracker.setOperation('重複チェック（既存）');
      const duplicateResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/admin/users/check-email?email=${encodeURIComponent(userData.email)}`,
        adminAuth.cookies
      );
      expect(duplicateResponse.status).toBe(200);
      expect(duplicateResponse.body.data.exists).toBe(true);
      tracker.mark('重複チェック（既存）完了');

      // 重複チェック（新規メール）
      tracker.setOperation('重複チェック（新規）');
      const newEmail = `new-${Date.now()}@test.example.com`;
      const newResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/admin/users/check-email?email=${encodeURIComponent(newEmail)}`,
        adminAuth.cookies
      );
      expect(newResponse.status).toBe(200);
      expect(newResponse.body.data.exists).toBe(false);
      tracker.mark('重複チェック（新規）完了');

      tracker.summary();
    });
  });

  describe('ユーザープロフィール管理機能', () => {
    it('ユーザーが自分のプロフィールを取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // プロフィール取得
      tracker.setOperation('プロフィール取得');
      const profileResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/users/profile',
        userAuth.cookies
      );
      tracker.mark('プロフィール取得レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data).toHaveProperty('email');
      expect(profileResponse.body.data).toHaveProperty('surname');
      expect(profileResponse.body.data).toHaveProperty('firstName');
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('ユーザーが自分のプロフィールを更新できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // プロフィール更新データ準備
      tracker.setOperation('プロフィール更新データ準備');
      const updateData = {
        surname: `更新済姓-${Date.now()}`,
        firstName: `更新済名-${Date.now()}`,
        nickname: `更新済ニックネーム-${Date.now()}`,
        birthday: '1995-05-15'
      };
      tracker.mark('プロフィール更新データ準備完了');

      // プロフィール更新実行
      tracker.setOperation('プロフィール更新');
      const updateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/users/profile',
        userAuth.cookies,
        updateData
      );
      tracker.mark('プロフィール更新レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.surname).toBe(updateData.surname);
      expect(updateResponse.body.data.firstName).toBe(updateData.firstName);
      expect(updateResponse.body.data.nickname).toBe(updateData.nickname);
      tracker.mark('レスポンス検証完了');

      // 更新後のプロフィール再取得で確認
      tracker.setOperation('プロフィール再取得確認');
      const confirmResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/users/profile',
        userAuth.cookies
      );
      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.surname).toBe(updateData.surname);
      tracker.mark('プロフィール再取得確認完了');

      tracker.summary();
    });
  });

  describe('パスワード変更機能', () => {
    it('ユーザーが自分のパスワードを変更できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // テストユーザー作成
      tracker.setOperation('テストユーザー作成');
      const userData = DbTestHelper.generateUniqueTestData('password-test');
      const initialPassword = 'InitialPass123';
      
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: userData.email,
          surname: userData.surname,
          firstName: userData.firstName,
          birthday: userData.birthday,
          password: initialPassword
        }
      );
      expect(createResponse.status).toBe(201);
      tracker.mark('テストユーザー作成完了');

      // 作成したユーザーでログイン
      tracker.setOperation('テストユーザーログイン');
      const userAuth = await TestAuthHelper.loginAndGetTokens({
        email: userData.email,
        password: initialPassword
      });
      tracker.mark('テストユーザーログイン完了');

      // パスワード変更
      tracker.setOperation('パスワード変更');
      const newPassword = 'NewSecurePass456';
      const changePasswordResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/users/password',
        userAuth.cookies,
        {
          currentPassword: initialPassword,
          newPassword: newPassword,
          confirmPassword: newPassword
        }
      );
      tracker.mark('パスワード変更レスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(changePasswordResponse.status).toBe(200);
      expect(changePasswordResponse.body.success).toBe(true);
      tracker.mark('レスポンス検証完了');

      // 新しいパスワードでログイン試行
      tracker.setOperation('新パスワードログイン試行');
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: newPassword
        });
      expect(newLoginResponse.status).toBe(200);
      expect(newLoginResponse.body.success).toBe(true);
      tracker.mark('新パスワードログイン試行完了');

      // 古いパスワードでのログイン失敗確認
      tracker.setOperation('旧パスワードログイン失敗確認');
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: initialPassword
        });
      expect(oldLoginResponse.status).toBe(401);
      tracker.mark('旧パスワードログイン失敗確認完了');

      tracker.summary();
    });

    it('間違った現在のパスワードでは変更できない', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // 間違ったパスワードで変更試行
      tracker.setOperation('間違ったパスワードで変更試行');
      const changePasswordResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        '/api/users/password',
        userAuth.cookies,
        {
          currentPassword: 'WrongPassword123',
          newPassword: 'NewSecurePass456',
          confirmPassword: 'NewSecurePass456'
        }
      );
      tracker.mark('パスワード変更レスポンス受信');

      // レスポンス検証（失敗するべき）
      tracker.setOperation('レスポンス検証');
      expect(changePasswordResponse.status).toBe(400);
      expect(changePasswordResponse.body.success).toBe(false);
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });
  });

  describe('データエクスポート機能', () => {
    it('ユーザーが自分のデータをエクスポートできる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 一般ユーザーでログイン
      tracker.setOperation('一般ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAsUser();
      tracker.mark('一般ユーザーログイン完了');

      // データエクスポート実行
      tracker.setOperation('データエクスポート');
      const exportResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        '/api/users/export',
        userAuth.cookies
      );
      tracker.mark('データエクスポートレスポンス受信');

      // レスポンス検証
      tracker.setOperation('レスポンス検証');
      expect(exportResponse.status).toBe(200);
      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.data).toHaveProperty('user');
      expect(exportResponse.body.data).toHaveProperty('partners');
      expect(exportResponse.body.data).toHaveProperty('chatHistory');
      expect(exportResponse.body.data).toHaveProperty('settings');
      expect(exportResponse.body.data).toHaveProperty('exportInfo');
      expect(exportResponse.body.data.exportInfo).toHaveProperty('exportedAt');
      expect(exportResponse.body.data.exportInfo).toHaveProperty('version');
      tracker.mark('レスポンス検証完了');

      // エクスポートデータの詳細検証
      tracker.setOperation('エクスポートデータ詳細検証');
      const userData = exportResponse.body.data.user;
      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('surname');
      expect(userData).toHaveProperty('firstName');
      expect(Array.isArray(exportResponse.body.data.partners)).toBe(true);
      expect(Array.isArray(exportResponse.body.data.chatHistory)).toBe(true);
      tracker.mark('エクスポートデータ詳細検証完了');

      tracker.summary();
    });
  });

  describe('完全ユーザー管理フロー', () => {
    it('ユーザー作成から無効化まで完全フローが正常に動作する', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('完全フローテスト開始');

      // 1. 管理者ログイン
      tracker.setOperation('管理者ログイン');
      const adminAuth = await TestAuthHelper.loginAsAdmin();
      tracker.mark('管理者ログイン完了');

      // 2. ユーザー作成
      tracker.setOperation('ユーザー作成');
      const userData = DbTestHelper.generateUniqueTestData('complete-flow');
      const createResponse = await TestAuthHelper.authenticatedRequest(
        'post',
        '/api/admin/users',
        adminAuth.cookies,
        {
          email: userData.email,
          surname: userData.surname,
          firstName: userData.firstName,
          birthday: userData.birthday,
          password: 'flow-test-password'
        }
      );
      expect(createResponse.status).toBe(201);
      const createdUser = createResponse.body.data;
      tracker.mark('ユーザー作成完了');

      // 3. 作成されたユーザーでログイン
      tracker.setOperation('作成ユーザーログイン');
      const userAuth = await TestAuthHelper.loginAndGetTokens({
        email: userData.email,
        password: 'flow-test-password'
      });
      tracker.mark('作成ユーザーログイン完了');

      // 4. ユーザー自身の情報取得
      tracker.setOperation('ユーザー情報取得');
      const userInfo = await TestAuthHelper.getCurrentUser(userAuth.cookies);
      expect(userInfo.email).toBe(userData.email);
      tracker.mark('ユーザー情報取得完了');

      // 5. 管理者がユーザー詳細取得
      tracker.setOperation('管理者によるユーザー詳細取得');
      const adminGetResponse = await TestAuthHelper.authenticatedRequest(
        'get',
        `/api/admin/users/${createdUser.id}`,
        adminAuth.cookies
      );
      expect(adminGetResponse.status).toBe(200);
      expect(adminGetResponse.body.data.email).toBe(userData.email);
      tracker.mark('管理者によるユーザー詳細取得完了');

      // 6. ユーザー無効化
      tracker.setOperation('ユーザー無効化');
      const deactivateResponse = await TestAuthHelper.authenticatedRequest(
        'put',
        `/api/admin/users/${createdUser.id}/deactivate`,
        adminAuth.cookies
      );
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body.data.status).toBe('inactive');
      tracker.mark('ユーザー無効化完了');

      // 7. 無効化されたユーザーのログイン試行（失敗するべき）
      tracker.setOperation('無効化ユーザーログイン試行');
      const failedLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'flow-test-password'
        })
        .expect(401);
      expect(failedLoginResponse.body.success).toBe(false);
      tracker.mark('無効化ユーザーログイン試行完了');

      tracker.mark('完全フローテスト完了');
      tracker.summary();
    });
  });
});