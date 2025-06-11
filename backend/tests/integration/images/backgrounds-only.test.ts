import request from 'supertest';
import app from '@/app';
import { TestAuthHelper } from '../../utils/test-auth-helper';

describe('画像背景APIテスト（独立実行）', () => {
  let authTokens: { access: string; refresh: string };

  beforeAll(async () => {
    // テストユーザーとしてログイン（パートナー作成不要）
    const loginResult = await TestAuthHelper.loginAsUser();
    authTokens = { access: loginResult.accessToken, refresh: loginResult.refreshToken };
  }, 15000);

  describe('GET /api/images/backgrounds - 背景画像一覧取得', () => {
    test('認証ありで正常に背景画像一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      console.log('[Test] 背景画像レスポンス:', JSON.stringify(response.body, null, 2));
      
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backgrounds');
      expect(Array.isArray(response.body.data.backgrounds)).toBe(true);
      
      if (response.body.data.backgrounds.length > 0) {
        const firstBackground = response.body.data.backgrounds[0];
        expect(firstBackground).toHaveProperty('id');
        expect(firstBackground).toHaveProperty('category');
        expect(firstBackground).toHaveProperty('url');
        expect(firstBackground).toHaveProperty('name');
      }
    });

    test('認証なしでアクセスしたときに401エラーが返される', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds')
        .expect(401);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
    });

    test('カテゴリフィルターが動作する', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds?category=nature')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backgrounds');
      
      if (response.body.data.backgrounds.length > 0) {
        response.body.data.backgrounds.forEach((bg: any) => {
          expect(bg.category).toBe('nature');
        });
      }
    });

    test('無効なカテゴリでも400エラーにならない（空配列を返す）', async () => {
      const response = await request(app)
        .get('/api/images/backgrounds?category=invalid_category')
        .set('Authorization', `Bearer ${authTokens.access}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backgrounds');
      expect(Array.isArray(response.body.data.backgrounds)).toBe(true);
    });
  });
});