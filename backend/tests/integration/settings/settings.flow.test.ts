import request from 'supertest';
import app from '../../../src/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { testAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { 
  ID, 
  UserSettings, 
  NotificationSettings, 
  SettingsResponse,
  SettingsUpdateRequest 
} from '../../../src/types';

describe('設定管理API統合テスト', () => {
  let testUserId: ID;
  let authToken: string;
  let adminUserId: ID;
  let adminToken: string;
  const tracker = new MilestoneTracker();

  beforeAll(async () => {
    tracker.mark('テスト環境初期化開始');
    await DbTestHelper.ensureConnection();
    await DbTestHelper.cleanup();
    tracker.mark('データベース初期化完了');
  });

  beforeEach(async () => {
    tracker.setOperation('テストユーザー作成');
    
    // 一般ユーザー作成
    const testUserData = await DbTestHelper.createTestUser();
    testUserId = testUserData.user.id;
    const loginResult = await testAuthHelper.loginAndGetTokens(testUserData.credentials);
    authToken = loginResult.accessToken;

    // 管理者ユーザー作成
    const adminData = await DbTestHelper.createTestAdmin();
    adminUserId = adminData.user.id;
    const adminLoginResult = await testAuthHelper.loginAndGetTokens(adminData.credentials);
    adminToken = adminLoginResult.accessToken;

    tracker.mark('テストユーザー作成完了');
  });

  afterAll(async () => {
    await DbTestHelper.cleanup();
    tracker.summary();
  });

  describe('GET /api/settings - 設定取得', () => {
    it('認証済みユーザーは自分の設定を取得できる', async () => {
      tracker.setOperation('設定取得テスト');

      const response = await request(app)
        .get('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`]);

      tracker.mark('設定取得完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userSettings');
      expect(response.body.data).toHaveProperty('notifications');

      // デフォルト値の確認
      const { userSettings, notifications } = response.body.data;
      expect(userSettings.theme).toBe('light');
      expect(userSettings.backgroundImage).toBe('default');
      expect(userSettings.soundEnabled).toBe(true);
      expect(userSettings.autoSave).toBe(true);
      expect(userSettings.dataRetentionDays).toBe(365);

      expect(notifications.morningGreeting).toBe(true);
      expect(notifications.morningTime).toBe('07:00');
      expect(notifications.reminderMessages).toBe(false);
    });

    it('認証なしでアクセスするとエラーになる', async () => {
      tracker.setOperation('認証なしアクセステスト');

      const response = await request(app)
        .get('/api/settings');

      tracker.mark('エラーレスポンス受信');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('存在しない設定でもデフォルト値が作成される', async () => {
      tracker.setOperation('デフォルト設定作成テスト');

      // 新規ユーザーでアクセス
      const response = await request(app)
        .get('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`]);

      tracker.mark('デフォルト設定作成完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userSettings).toBeDefined();
      expect(response.body.data.notifications).toBeDefined();
    });
  });

  describe('PUT /api/settings - 設定更新', () => {
    it('ユーザー設定を正常に更新できる', async () => {
      tracker.setOperation('ユーザー設定更新テスト');

      const updateData: SettingsUpdateRequest = {
        userSettings: {
          theme: 'dark',
          backgroundImage: 'nature',
          soundEnabled: false,
          autoSave: false,
          dataRetentionDays: 730
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('ユーザー設定更新完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const { userSettings } = response.body.data;
      expect(userSettings.theme).toBe('dark');
      expect(userSettings.backgroundImage).toBe('nature');
      expect(userSettings.soundEnabled).toBe(false);
      expect(userSettings.autoSave).toBe(false);
      expect(userSettings.dataRetentionDays).toBe(730);
    });

    it('通知設定を正常に更新できる', async () => {
      tracker.setOperation('通知設定更新テスト');

      const updateData: SettingsUpdateRequest = {
        notifications: {
          morningGreeting: false,
          morningTime: '09:30',
          reminderMessages: true,
          specialDays: true
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('通知設定更新完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const { notifications } = response.body.data;
      expect(notifications.morningGreeting).toBe(false);
      expect(notifications.morningTime).toBe('09:30');
      expect(notifications.reminderMessages).toBe(true);
      expect(notifications.specialDays).toBe(true);
    });

    it('両方の設定を同時に更新できる', async () => {
      tracker.setOperation('統合設定更新テスト');

      const updateData: SettingsUpdateRequest = {
        userSettings: {
          theme: 'auto',
          soundEnabled: false
        },
        notifications: {
          morningGreeting: false,
          specialDays: false
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('統合設定更新完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const { userSettings, notifications } = response.body.data;
      expect(userSettings.theme).toBe('auto');
      expect(userSettings.soundEnabled).toBe(false);
      expect(notifications.morningGreeting).toBe(false);
      expect(notifications.specialDays).toBe(false);
    });

    it('不正なテーマ値でエラーになる', async () => {
      tracker.setOperation('不正なテーマ値テスト');

      const updateData: SettingsUpdateRequest = {
        userSettings: {
          theme: 'invalid-theme' // 'light', 'dark', 'auto'のみ許可
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('バリデーションエラー受信');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('不正な時刻形式でエラーになる', async () => {
      tracker.setOperation('不正な時刻形式テスト');

      const updateData: SettingsUpdateRequest = {
        notifications: {
          morningTime: '25:00' // 不正な時刻
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('時刻バリデーションエラー受信');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('データ保持期間の範囲外でエラーになる', async () => {
      tracker.setOperation('データ保持期間範囲外テスト');

      const updateData: SettingsUpdateRequest = {
        userSettings: {
          dataRetentionDays: 10 // 最小30日
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('保持期間バリデーションエラー受信');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('認証なしで更新するとエラーになる', async () => {
      tracker.setOperation('認証なし更新テスト');

      const updateData: SettingsUpdateRequest = {
        userSettings: {
          theme: 'dark'
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .send(updateData);

      tracker.mark('認証エラー受信');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('設定の永続性と独立性', () => {
    it('更新した設定が永続化される', async () => {
      tracker.setOperation('設定永続化テスト');

      // 設定を更新
      const updateData: SettingsUpdateRequest = {
        userSettings: {
          theme: 'dark',
          backgroundImage: 'city'
        }
      };

      await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('設定更新完了');

      // 再度取得して確認
      const response = await request(app)
        .get('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`]);

      tracker.mark('設定再取得完了');

      expect(response.status).toBe(200);
      const { userSettings } = response.body.data;
      expect(userSettings.theme).toBe('dark');
      expect(userSettings.backgroundImage).toBe('city');
    });

    it('ユーザー間で設定が独立している', async () => {
      tracker.setOperation('ユーザー間独立性テスト');

      // ユーザー1の設定を更新
      const user1Update: SettingsUpdateRequest = {
        userSettings: {
          theme: 'dark'
        }
      };

      await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(user1Update);

      tracker.mark('ユーザー1設定更新完了');

      // 別のユーザーを作成
      const user2Data = await DbTestHelper.createTestUser();
      const loginResult2 = await testAuthHelper.loginAndGetTokens(user2Data.credentials);
      const authToken2 = loginResult2.accessToken;

      tracker.mark('ユーザー2作成完了');

      // ユーザー2の設定を取得
      const response = await request(app)
        .get('/api/settings')
        .set('Cookie', [`accessToken=${authToken2}`]);

      tracker.mark('ユーザー2設定取得完了');

      // ユーザー2はデフォルト設定のまま
      expect(response.status).toBe(200);
      const { userSettings } = response.body.data;
      expect(userSettings.theme).toBe('light'); // デフォルト値
    });
  });

  describe('背景画像プリセット検証', () => {
    it('有効な背景画像プリセットを受け入れる', async () => {
      tracker.setOperation('背景画像プリセット検証テスト');

      const validPresets = ['default', 'nature', 'city', 'ocean', 'mountain', 'abstract'];
      
      for (const preset of validPresets) {
        const updateData: SettingsUpdateRequest = {
          userSettings: {
            backgroundImage: preset
          }
        };

        const response = await request(app)
          .put('/api/settings')
          .set('Cookie', [`accessToken=${authToken}`])
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.data.userSettings.backgroundImage).toBe(preset);
      }

      tracker.mark('全プリセット検証完了');
    });

    it('無効な背景画像プリセットでエラーになる', async () => {
      tracker.setOperation('無効な背景画像テスト');

      const updateData: SettingsUpdateRequest = {
        userSettings: {
          backgroundImage: 'invalid-preset'
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(updateData);

      tracker.mark('背景画像バリデーションエラー受信');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('部分更新のサポート', () => {
    it('指定したフィールドのみ更新される', async () => {
      tracker.setOperation('部分更新テスト');

      // 初期状態を設定
      await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send({
          userSettings: {
            theme: 'dark',
            soundEnabled: false,
            autoSave: false
          }
        });

      tracker.mark('初期設定完了');

      // themeのみ更新
      const partialUpdate: SettingsUpdateRequest = {
        userSettings: {
          theme: 'light'
          // soundEnabledとautoSaveは更新しない
        }
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', [`accessToken=${authToken}`])
        .send(partialUpdate);

      tracker.mark('部分更新完了');

      expect(response.status).toBe(200);
      const { userSettings } = response.body.data;
      expect(userSettings.theme).toBe('light'); // 更新された
      expect(userSettings.soundEnabled).toBe(false); // 変更なし
      expect(userSettings.autoSave).toBe(false); // 変更なし
    });
  });
});