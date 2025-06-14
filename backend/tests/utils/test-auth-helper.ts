import request from 'supertest';
import app from '../../src/app';
import { DbTestHelper } from './db-test-helper';

/**
 * テスト用認証ヘルパー
 * ★9統合テスト成功請負人が活用する認証関連ユーティリティ
 */
export class TestAuthHelper {
  // ログイン実行とトークン取得
  static async loginAndGetTokens(credentials: { email: string; password: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    cookies: string[];
  }> {
    console.log(`[TEST AUTH] ログイン試行: ${credentials.email}`);
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect(200);
    
    if (!response.body.success) {
      throw new Error(`ログイン失敗: ${response.body.error}`);
    }
    
    // Cookieからトークンを抽出
    const cookieHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(cookieHeader) ? cookieHeader : (cookieHeader ? [cookieHeader] : []);
    let accessToken = '';
    let refreshToken = '';
    
    cookies.forEach((cookie: string) => {
      if (cookie.startsWith('accessToken=')) {
        accessToken = cookie.split('accessToken=')[1].split(';')[0];
      }
      if (cookie.startsWith('refreshToken=')) {
        refreshToken = cookie.split('refreshToken=')[1].split(';')[0];
      }
    });
    
    console.log(`[TEST AUTH] ログイン成功: ${credentials.email}`);
    
    return {
      accessToken,
      refreshToken,
      user: response.body.data.user,
      cookies
    };
  }

  // 管理者としてログイン
  static async loginAsAdmin(): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    cookies: string[];
  }> {
    const { user, credentials } = await DbTestHelper.createTestAdmin();
    return await this.loginAndGetTokens(credentials);
  }

  // 一般ユーザーとしてログイン
  static async loginAsUser(): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    cookies: string[];
  }> {
    const { user, credentials } = await DbTestHelper.createTestUser();
    return await this.loginAndGetTokens(credentials);
  }

  // テストユーザー作成とトークン取得を一括実行
  static async createTestUserWithTokens(userData?: {
    email?: string;
    password?: string;
    surname?: string;
    firstName?: string;
    birthday?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    cookies: string[];
  }> {
    // まず管理者ユーザーを作成・ログイン
    const { user: adminUser, credentials: adminCredentials } = await DbTestHelper.createTestAdmin();
    const adminAuth = await this.loginAndGetTokens(adminCredentials);

    // ユニークなテストデータを生成
    const testData = DbTestHelper.generateUniqueTestData('user');
    const password = 'TestPassword123!';

    // 管理者APIでテストユーザーを作成
    const userCreateResponse = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminAuth.accessToken}`)
      .send({
        email: userData?.email || testData.email,
        password: userData?.password || password,
        surname: userData?.surname || testData.surname,
        firstName: userData?.firstName || testData.firstName,
        birthday: userData?.birthday || testData.birthday
      });

    if (userCreateResponse.status !== 201) {
      throw new Error(`テストユーザー作成失敗: ${userCreateResponse.body.error}`);
    }

    console.log(`[TEST AUTH] テストユーザー作成成功: ${userCreateResponse.body.data.email}`);

    // 作成したユーザーでログイン
    return await this.loginAndGetTokens({
      email: userCreateResponse.body.data.email,
      password: userData?.password || password
    });
  }

  // Cookieを使用した認証付きリクエスト
  static async authenticatedRequest(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    cookies: string[],
    data?: any
  ) {
    console.log(`[TEST AUTH] 認証付きリクエスト: ${method.toUpperCase()} ${path}`);
    console.log(`[TEST AUTH] 送信Cookie数: ${cookies.length}`);
    cookies.forEach((cookie, index) => {
      console.log(`[TEST AUTH] Cookie ${index}: ${cookie.substring(0, 50)}...`);
    });
    
    let req = request(app)[method](path);
    
    // 複数のCookieを1つのCookieヘッダーに結合
    if (cookies.length > 0) {
      const cookieString = cookies.join('; ');
      console.log(`[TEST AUTH] 結合Cookie: ${cookieString.substring(0, 100)}...`);
      req = req.set('Cookie', cookieString);
    }
    
    // データがある場合は送信
    if (data) {
      console.log(`[TEST AUTH] 送信データ:`, JSON.stringify(data, null, 2));
      req = req.send(data);
    }
    
    return req;
  }

  // Authorizationヘッダーを使用した認証付きリクエスト
  static async tokenRequest(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    accessToken: string,
    data?: any
  ) {
    let req = request(app)[method](path)
      .set('Authorization', `Bearer ${accessToken}`);
    
    if (data) {
      req = req.send(data);
    }
    
    return req;
  }

  // トークンリフレッシュテスト
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    
    if (!response.body.success) {
      throw new Error(`トークンリフレッシュ失敗: ${response.body.error}`);
    }
    
    return {
      accessToken: response.body.data.accessToken,
      refreshToken: response.body.data.refreshToken
    };
  }

  // ログアウトテスト
  static async logout(cookies: string[]): Promise<void> {
    const response = await this.authenticatedRequest('post', '/api/auth/logout', cookies);
    
    if (response.status !== 200) {
      throw new Error(`ログアウト失敗: ${response.body?.error || 'Unknown error'}`);
    }
    
    console.log('[TEST AUTH] ログアウト成功');
  }

  // 現在のユーザー情報取得テスト
  static async getCurrentUser(cookies: string[]): Promise<any> {
    const response = await this.authenticatedRequest('get', '/api/auth/me', cookies);
    
    if (response.status !== 200) {
      throw new Error(`ユーザー情報取得失敗: ${response.body?.error || 'Unknown error'}`);
    }
    
    return response.body.data;
  }

  // 認証状態検証ヘルパー
  static async verifyAuthState(accessToken: string): Promise<{
    valid: boolean;
    user?: any;
  }> {
    const response = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`);
    
    return {
      valid: response.body.data?.valid || false,
      user: response.body.data?.user
    };
  }

  // 無効なトークンでのアクセステスト
  static async testUnauthorizedAccess(path: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch' = 'get'): Promise<void> {
    const response = await request(app)[method](path);
    
    if (response.status !== 401) {
      throw new Error(`認証チェック失敗: ステータス ${response.status} が返されました (期待値: 401)`);
    }
    
    console.log(`[TEST AUTH] 認証チェック成功: ${path} は認証が必要`);
  }

  // 権限不足でのアクセステスト  
  static async testForbiddenAccess(
    path: string, 
    userCookies: string[], 
    method: 'get' | 'post' | 'put' | 'delete' | 'patch' = 'get'
  ): Promise<void> {
    const response = await this.authenticatedRequest(method, path, userCookies);
    
    if (response.status !== 403) {
      throw new Error(`権限チェック失敗: ステータス ${response.status} が返されました (期待値: 403)`);
    }
    
    console.log(`[TEST AUTH] 権限チェック成功: ${path} は管理者権限が必要`);
  }
}

// テストファイルでの利便性のため、小文字でもエクスポート
export const testAuthHelper = TestAuthHelper;