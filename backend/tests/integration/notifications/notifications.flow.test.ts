/**
 * 通知システム 統合テスト
 * 通知設定とスケジューリング機能の完全なフローテスト
 */

import request from 'supertest';
import app from '@/app';
import { DbTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { NotificationSetting } from '@/db/models/NotificationSetting.model';
import { NotificationSchedule } from '@/db/models/NotificationSchedule.model';
import { PartnerModel } from '@/db/models/Partner.model';

describe('通知システム統合テスト', () => {
  let testTransaction: any;
  let testUserId: string;
  let testPartnerId: string;
  let authHeader: Record<string, string>;
  let adminUserId: string;
  let adminAuthHeader: Record<string, string>;

  beforeAll(async () => {
    await DbTestHelper.ensureConnection();
  });

  afterAll(async () => {
    await DbTestHelper.cleanup();
  });

  beforeEach(async () => {
    testTransaction = await DbTestHelper.startTransaction();

    // テストユーザー作成
    const testUserData = await DbTestHelper.createTestUser();
    testUserId = testUserData.user.id;
    const loginResult = await TestAuthHelper.loginAndGetTokens(testUserData.credentials);
    authHeader = { 'Authorization': `Bearer ${loginResult.accessToken}` };

    // 管理者ユーザー作成
    const adminData = await DbTestHelper.createTestAdmin();
    adminUserId = adminData.user.id;
    const adminLoginResult = await TestAuthHelper.loginAndGetTokens(adminData.credentials);
    adminAuthHeader = { 'Authorization': `Bearer ${adminLoginResult.accessToken}` };

    // テスト用パートナー作成
    const partner = await DbTestHelper.createTestPartner(testUserId, {
      name: 'テストパートナー',
      systemPrompt: 'テスト用のシステムプロンプト',
      avatarDescription: 'テスト用の外見説明',
      appearance: {
        hairStyle: 'long',
        eyeColor: 'brown',
        bodyType: 'average',
        clothingStyle: 'casual',
      },
      hobbies: ['読書', '映画鑑賞'],
      intimacyLevel: 50,
    });
    testPartnerId = partner.id;
  });

  afterEach(async () => {
    await DbTestHelper.rollbackTransaction(testTransaction);
  });

  describe('GET /api/notifications/settings - 通知設定取得（API 8.1）', () => {
    it('初回アクセス時にデフォルト設定を作成して返すべき', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      tracker.setOperation('通知設定取得');
      const response = await request(app)
        .get('/api/notifications/settings')
        .set(authHeader);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId: testUserId,
        morningGreeting: false,
        morningTime: '07:00',
        reminderMessages: false,
        specialDays: true,
      });
      tracker.mark('レスポンス検証完了');

      // データベース確認
      tracker.setOperation('DB確認');
      const setting = await NotificationSetting.findOne({
        where: { userId: testUserId },
      });
      expect(setting).toBeTruthy();
      expect(setting!.morningGreeting).toBe(false);
      tracker.mark('DB確認完了');

      tracker.summary();
    });

    it('既存の設定がある場合はそれを返すべき', async () => {
      // 事前に設定を作成
      await NotificationSetting.create({
        userId: testUserId,
        morningGreeting: true,
        morningTime: '08:30',
        reminderMessages: true,
        specialDays: false,
      });

      const response = await request(app)
        .get('/api/notifications/settings')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        morningGreeting: true,
        morningTime: '08:30',
        reminderMessages: true,
        specialDays: false,
      });
    });

    it('認証なしでアクセスした場合は401エラーを返すべき', async () => {
      const response = await request(app)
        .get('/api/notifications/settings');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/settings - 通知設定更新（API 8.2）', () => {
    it('通知設定を正常に更新できるべき', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const updateData = {
        morningGreeting: true,
        morningTime: '06:30',
        reminderMessages: true,
      };

      tracker.setOperation('通知設定更新');
      const response = await request(app)
        .put('/api/notifications/settings')
        .set(authHeader)
        .send(updateData);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
      tracker.mark('レスポンス検証完了');

      // データベース確認
      tracker.setOperation('DB確認');
      const setting = await NotificationSetting.findOne({
        where: { userId: testUserId },
      });
      expect(setting!.morningGreeting).toBe(true);
      expect(setting!.morningTime).toBe('06:30');
      tracker.mark('DB確認完了');

      tracker.summary();
    });

    it('不正な時刻形式の場合はエラーを返すべき', async () => {
      const response = await request(app)
        .put('/api/notifications/settings')
        .set(authHeader)
        .send({
          morningTime: '25:00', // 無効な時刻
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('朝の挨拶時刻の妥当性をチェックすべき', async () => {
      const response = await request(app)
        .put('/api/notifications/settings')
        .set(authHeader)
        .send({
          morningTime: '02:00', // 朝の挨拶には早すぎる
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('4:00から12:00の間');
    });

    it('部分更新が可能であるべき', async () => {
      // 事前に設定を作成
      await NotificationSetting.create({
        userId: testUserId,
        morningGreeting: false,
        morningTime: '07:00',
        reminderMessages: false,
        specialDays: true,
      });

      const response = await request(app)
        .put('/api/notifications/settings')
        .set(authHeader)
        .send({
          morningGreeting: true, // これだけ更新
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        morningGreeting: true,
        morningTime: '07:00', // 変更なし
        reminderMessages: false, // 変更なし
        specialDays: true, // 変更なし
      });
    });
  });

  describe('POST /api/notifications/schedule - 通知スケジュール作成（API 8.3）', () => {
    it('朝の挨拶スケジュールを作成できるべき', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const scheduleData = {
        type: 'morning_greeting',
        scheduledTime: '08:00',
        partnerId: testPartnerId,
        recurring: true,
        recurringPattern: 'daily',
      };

      tracker.setOperation('スケジュール作成');
      const response = await request(app)
        .post('/api/notifications/schedule')
        .set(authHeader)
        .send(scheduleData);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId: testUserId,
        type: 'morning_greeting',
        partnerId: testPartnerId,
        recurring: true,
        recurringPattern: 'daily',
        status: 'pending',
      });
      tracker.mark('レスポンス検証完了');

      tracker.summary();
    });

    it('カスタム通知スケジュールを作成できるべき', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const scheduleData = {
        type: 'custom',
        scheduledTime: futureDate.toISOString(),
        message: '明日は大切な日です！頑張ってね❤️',
        recurring: false,
      };

      const response = await request(app)
        .post('/api/notifications/schedule')
        .set(authHeader)
        .send(scheduleData);

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        type: 'custom',
        message: scheduleData.message,
        recurring: false,
        status: 'pending',
      });
    });

    it('朝の挨拶にパートナーIDがない場合はエラーを返すべき', async () => {
      const response = await request(app)
        .post('/api/notifications/schedule')
        .set(authHeader)
        .send({
          type: 'morning_greeting',
          scheduledTime: '08:00',
          recurring: true,
          recurringPattern: 'daily',
          // partnerId がない
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('パートナーID');
    });

    it('カスタム通知にメッセージがない場合はエラーを返すべき', async () => {
      const response = await request(app)
        .post('/api/notifications/schedule')
        .set(authHeader)
        .send({
          type: 'custom',
          scheduledTime: new Date(Date.now() + 86400000).toISOString(),
          recurring: false,
          // message がない
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('メッセージ');
    });

    it('他ユーザーのパートナーを指定した場合はエラーを返すべき', async () => {
      // 別ユーザーのパートナー作成
      const otherUserData = await DbTestHelper.createTestUser();
      const otherPartner = await DbTestHelper.createTestPartner(otherUserData.user.id, {
        name: '他人のパートナー',
      });

      const response = await request(app)
        .post('/api/notifications/schedule')
        .set(authHeader)
        .send({
          type: 'morning_greeting',
          scheduledTime: '08:00',
          partnerId: otherPartner.id,
          recurring: true,
          recurringPattern: 'daily',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('アクセス権');
    });
  });

  describe('GET /api/notifications/schedules - スケジュール一覧取得', () => {
    beforeEach(async () => {
      // テスト用スケジュール作成
      await NotificationSchedule.createSchedule({
        userId: testUserId,
        partnerId: testPartnerId,
        type: 'morning_greeting',
        scheduledTime: new Date(Date.now() + 86400000),
        recurring: true,
        recurringPattern: 'daily',
      });

      await NotificationSchedule.createSchedule({
        userId: testUserId,
        type: 'custom',
        scheduledTime: new Date(Date.now() + 172800000),
        message: 'カスタムメッセージ',
        recurring: false,
      });
    });

    it('ユーザーのスケジュール一覧を取得できるべき', async () => {
      const response = await request(app)
        .get('/api/notifications/schedules')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        userId: testUserId,
        type: expect.stringMatching(/morning_greeting|custom/),
        status: 'pending',
      });
    });

    it('完了済みスケジュールを含めて取得できるべき', async () => {
      // 完了済みスケジュール作成
      const completedSchedule = await NotificationSchedule.createSchedule({
        userId: testUserId,
        type: 'reminder',
        scheduledTime: new Date(Date.now() - 86400000),
        message: '過去のリマインダー',
        recurring: false,
      });
      await completedSchedule.markAsSent();

      const response = await request(app)
        .get('/api/notifications/schedules?includeCompleted=true')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('DELETE /api/notifications/schedules/:scheduleId - スケジュール削除', () => {
    let scheduleId: string;

    beforeEach(async () => {
      const schedule = await NotificationSchedule.createSchedule({
        userId: testUserId,
        partnerId: testPartnerId,
        type: 'morning_greeting',
        scheduledTime: new Date(Date.now() + 86400000),
        recurring: true,
        recurringPattern: 'daily',
      });
      scheduleId = schedule.id;
    });

    it('自分のスケジュールを削除（キャンセル）できるべき', async () => {
      const response = await request(app)
        .delete(`/api/notifications/schedules/${scheduleId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // データベース確認
      const schedule = await NotificationSchedule.findByPk(scheduleId);
      expect(schedule!.status).toBe('cancelled');
    });

    it('他ユーザーのスケジュールは削除できないべき', async () => {
      // 別ユーザーのスケジュール作成
      const otherUserData = await DbTestHelper.createTestUser();
      const otherSchedule = await NotificationSchedule.createSchedule({
        userId: otherUserData.user.id,
        type: 'reminder',
        scheduledTime: new Date(Date.now() + 86400000),
        message: 'Other user reminder',
        recurring: false,
      });

      const response = await request(app)
        .delete(`/api/notifications/schedules/${otherSchedule.id}`)
        .set(authHeader);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('アクセス権');
    });

    it('存在しないスケジュールの削除は404エラーを返すべき', async () => {
      const response = await request(app)
        .delete('/api/notifications/schedules/invalid-id')
        .set(authHeader);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('見つかりません');
    });
  });

  describe('POST /api/notifications/settings/reset - 設定リセット', () => {
    it('通知設定をデフォルトにリセットできるべき', async () => {
      // 事前にカスタム設定を作成
      await NotificationSetting.create({
        userId: testUserId,
        morningGreeting: true,
        morningTime: '08:30',
        reminderMessages: true,
        specialDays: false,
      });

      const response = await request(app)
        .post('/api/notifications/settings/reset')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        morningGreeting: false,
        morningTime: '07:00',
        reminderMessages: false,
        specialDays: true,
      });
    });
  });

  describe('GET /api/notifications/settings/validate - 設定検証', () => {
    it('設定の妥当性チェック結果を返すべき', async () => {
      // 全て無効な設定を作成
      await NotificationSetting.create({
        userId: testUserId,
        morningGreeting: false,
        morningTime: '07:00',
        reminderMessages: false,
        specialDays: false,
      });

      const response = await request(app)
        .get('/api/notifications/settings/validate')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        isValid: true,
        issues: [],
        recommendations: expect.arrayContaining([
          expect.stringContaining('少なくとも1つの通知'),
        ]),
      });
    });
  });

  describe('GET /api/notifications/stats - 通知統計（管理者のみ）', () => {
    beforeEach(async () => {
      // 複数のユーザーと設定を作成
      for (let i = 0; i < 5; i++) {
        const userData = await DbTestHelper.createTestUser();
        await NotificationSetting.create({
          userId: userData.user.id,
          morningGreeting: i < 3,
          morningTime: i < 2 ? '07:00' : '08:00',
          reminderMessages: i < 2,
          specialDays: true,
        });
      }
    });

    it('管理者は通知統計を取得できるべき', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set(adminAuthHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalUsers: expect.any(Number),
        morningGreetingEnabled: expect.any(Number),
        reminderEnabled: expect.any(Number),
        specialDaysEnabled: expect.any(Number),
        popularMorningTimes: expect.arrayContaining([
          expect.objectContaining({
            time: expect.any(String),
            count: expect.any(Number),
          }),
        ]),
      });
    });

    it('一般ユーザーは通知統計を取得できないべき', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set(authHeader);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('管理者権限');
    });
  });

  describe('完全な通知フローテスト', () => {
    it('通知設定から朝の挨拶スケジュール作成までの完全フロー', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('フローテスト開始');

      // Step 1: 初期設定確認
      tracker.setOperation('初期設定確認');
      const settingsResponse = await request(app)
        .get('/api/notifications/settings')
        .set(authHeader);
      expect(settingsResponse.status).toBe(200);
      expect(settingsResponse.body.data.morningGreeting).toBe(false);
      tracker.mark('初期設定確認完了');

      // Step 2: 朝の挨拶を有効化
      tracker.setOperation('朝の挨拶有効化');
      const updateResponse = await request(app)
        .put('/api/notifications/settings')
        .set(authHeader)
        .send({
          morningGreeting: true,
          morningTime: '07:30',
        });
      expect(updateResponse.status).toBe(200);
      tracker.mark('朝の挨拶有効化完了');

      // Step 3: スケジュール作成
      tracker.setOperation('スケジュール作成');
      const scheduleResponse = await request(app)
        .post('/api/notifications/schedule')
        .set(authHeader)
        .send({
          type: 'morning_greeting',
          scheduledTime: '07:30',
          partnerId: testPartnerId,
          recurring: true,
          recurringPattern: 'daily',
        });
      expect(scheduleResponse.status).toBe(201);
      const scheduleId = scheduleResponse.body.data.id;
      tracker.mark('スケジュール作成完了');

      // Step 4: スケジュール一覧確認
      tracker.setOperation('スケジュール一覧確認');
      const listResponse = await request(app)
        .get('/api/notifications/schedules')
        .set(authHeader);
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);
      tracker.mark('スケジュール一覧確認完了');

      // Step 5: 設定検証
      tracker.setOperation('設定検証');
      const validateResponse = await request(app)
        .get('/api/notifications/settings/validate')
        .set(authHeader);
      expect(validateResponse.status).toBe(200);
      expect(validateResponse.body.data.isValid).toBe(true);
      tracker.mark('設定検証完了');

      tracker.summary();
    });
  });
});