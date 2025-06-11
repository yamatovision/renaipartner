import request from 'supertest';
import app from '@/app';
import { TestAuthHelper } from '../../utils/test-auth-helper';

describe('画像背景エンドポイント簡易テスト', () => {
  let authTokens: { access: string; refresh: string };

  beforeAll(async () => {
    // テストユーザーとしてログイン
    const loginResult = await TestAuthHelper.loginAsUser();
    authTokens = { access: loginResult.accessToken, refresh: loginResult.refreshToken };
  }, 15000);

  describe('API 7.3: 背景画像一覧取得', () => {
    test('正常に背景画像一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backgrounds');
      expect(Array.isArray(response.body.data.backgrounds)).toBe(true);
      expect(response.body.data.backgrounds.length).toBeGreaterThan(0);
    });

    test('認証なしでアクセスしたときに401エラーが返される', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
});