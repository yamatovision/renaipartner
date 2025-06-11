import { pool } from '../../src/config/database.config';
import { UserModel, PartnerModel, MessageModel } from '../../src/db/models';
import { sequelize } from '../../src/config/sequelize.config';
import { UserRole, MessageSender, Gender, PersonalityType, SpeechStyle } from '../../src/types';

/**
 * テスト用データベースヘルパー
 * ★9統合テスト成功請負人が活用するDB操作ユーティリティ
 */
export class DbTestHelper {
  // テスト用データベース接続確認
  static async ensureConnection(): Promise<void> {
    try {
      const client = await pool.connect();
      console.log('[TEST DB] データベース接続確認完了');
      client.release();
    } catch (error) {
      console.error('[TEST DB] データベース接続失敗:', error);
      throw new Error(`テスト用データベースに接続できません: ${error}`);
    }
  }

  // ユニークなテストデータ生成
  static generateUniqueTestData(prefix: string = 'test') {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const uniqueId = `${prefix}-${timestamp}-${randomStr}`;
    
    return {
      email: `${uniqueId}@test.example.com`,
      surname: `${prefix}姓`,
      firstName: `${prefix}名`,
      nickname: `${prefix}ニック`,
      birthday: '1990-01-01',
      uniqueId
    };
  }

  // テスト用管理者ユーザー作成
  static async createTestAdmin(): Promise<{
    user: any;
    credentials: { email: string; password: string };
  }> {
    const testData = this.generateUniqueTestData('admin');
    const password = 'test-admin-password';
    
    try {
      const user = await UserModel.create({
        email: testData.email,
        surname: testData.surname,
        firstName: testData.firstName,
        birthday: testData.birthday,
        password: password,
        role: UserRole.ADMIN
      });
      
      console.log(`[TEST DB] テスト管理者ユーザー作成: ${user.email}`);
      
      return {
        user,
        credentials: {
          email: testData.email,
          password: password
        }
      };
    } catch (error) {
      console.error('[TEST DB] テスト管理者ユーザー作成失敗:', error);
      throw error;
    }
  }

  // テスト用一般ユーザー作成
  static async createTestUser(): Promise<{
    user: any;
    credentials: { email: string; password: string };
  }> {
    const testData = this.generateUniqueTestData('user');
    const password = 'test-user-password';
    
    try {
      const user = await UserModel.create({
        email: testData.email,
        surname: testData.surname,
        firstName: testData.firstName,
        birthday: testData.birthday,
        password: password,
        role: UserRole.USER
      });
      
      console.log(`[TEST DB] テスト一般ユーザー作成: ${user.email} (ID: ${user.id})`);
      
      return {
        user,
        credentials: {
          email: testData.email,
          password: password
        }
      };
    } catch (error) {
      console.error('[TEST DB] テスト一般ユーザー作成失敗:', error);
      throw error;
    }
  }

  // 全テストデータクリーンアップ（危険：本番データベースでは使用禁止）
  static async cleanupTestData(): Promise<void> {
    const client = await pool.connect();
    
    try {
      // テスト用メールアドレスパターンのデータのみ削除
      // 外部キー制約の順序に注意して削除
      
      // onboarding_progressテーブルのテストデータ削除
      await client.query(`
        DELETE FROM onboarding_progress 
        WHERE user_id IN (
          SELECT id FROM users WHERE email LIKE '%@test.example.com'
        )
      `);
      
      // generated_imagesテーブルのテストデータ削除
      await client.query(`
        DELETE FROM generated_images 
        WHERE partner_id IN (
          SELECT id FROM partners WHERE user_id IN (
            SELECT id FROM users WHERE email LIKE '%@test.example.com'
          )
        )
      `);
      
      // partnersテーブルのテストデータ削除
      await client.query(`
        DELETE FROM partners 
        WHERE user_id IN (
          SELECT id FROM users WHERE email LIKE '%@test.example.com'
        )
      `);
      
      // blacklisted_tokensテーブルのテストデータ削除
      await client.query(`
        DELETE FROM blacklisted_tokens 
        WHERE user_id IN (
          SELECT id FROM users WHERE email LIKE '%@test.example.com'
        )
      `);
      
      // refresh_tokensテーブルのテストデータ削除
      await client.query(`
        DELETE FROM refresh_tokens 
        WHERE user_id IN (
          SELECT id FROM users WHERE email LIKE '%@test.example.com'
        )
      `);
      
      // 最後にusersテーブルのテストデータ削除
      await client.query(`
        DELETE FROM users 
        WHERE email LIKE '%@test.example.com'
      `);
      
      console.log('[TEST DB] テストデータクリーンアップ完了');
      
    } catch (error) {
      console.error('[TEST DB] テストデータクリーンアップ失敗:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // テスト実行前の初期化
  static async beforeEach(): Promise<void> {
    await this.ensureConnection();
    // テスト前にもクリーンアップを実行して、前のテストのデータを確実に削除
    await this.cleanupTestData();
  }

  // テスト実行後のクリーンアップ
  static async afterEach(): Promise<void> {
    await this.cleanupTestData();
  }

  // 特定ユーザーの存在確認
  static async userExists(email: string): Promise<boolean> {
    try {
      const user = await UserModel.findByEmail(email);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  // データベース統計取得（デバッグ用）
  static async getDbStats(): Promise<{
    totalUsers: number;
    testUsers: number;
    refreshTokens: number;
  }> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE email LIKE '%@test.example.com') as test_users,
          (SELECT COUNT(*) FROM refresh_tokens) as refresh_tokens
      `);
      
      return {
        totalUsers: parseInt(result.rows[0].total_users, 10),
        testUsers: parseInt(result.rows[0].test_users, 10),
        refreshTokens: parseInt(result.rows[0].refresh_tokens, 10)
      };
    } finally {
      client.release();
    }
  }

  // ===== チャット機能テスト用メソッド =====

  // テスト用パートナー作成（PostgreSQL直接クエリ版）
  static async createTestPartner(userId: string, partnerData?: Partial<any>): Promise<any> {
    const client = await pool.connect();
    
    try {
      const timestamp = Date.now().toString().slice(-4);
      const defaultData = {
        name: `太郎${timestamp}`,
        gender: 'boyfriend',
        personalityType: 'gentle',
        speechStyle: 'polite',
        systemPrompt: 'テストプロンプト',
        avatarDescription: 'テスト',
        appearance: {
          hairStyle: 'short',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        hobbies: ['読書', '映画鑑賞'],
        intimacyLevel: 0
      };
      
      // partnerDataとマージ（appearanceフィールドは深くマージ）
      const mergedData = {
        ...defaultData,
        ...partnerData,
        appearance: {
          ...defaultData.appearance,
          ...(partnerData?.appearance || {})
        }
      };

      const query = `
        INSERT INTO partners (
          user_id, name, gender, personality_type, speech_style,
          system_prompt, avatar_description, hair_style, eye_color,
          body_type, clothing_style, hobbies, intimacy_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, user_id, name, gender, personality_type, speech_style,
                  system_prompt, avatar_description, intimacy_level, created_at
      `;
      
      const values = [
        userId,
        mergedData.name,
        mergedData.gender,
        mergedData.personalityType,
        mergedData.speechStyle,
        mergedData.systemPrompt,
        mergedData.avatarDescription,
        mergedData.appearance.hairStyle,
        mergedData.appearance.eyeColor,
        mergedData.appearance.bodyType,
        mergedData.appearance.clothingStyle,
        JSON.stringify(mergedData.hobbies),
        mergedData.intimacyLevel
      ];

      const result = await client.query(query, values);
      const partner = result.rows[0];
      
      console.log(`[TEST DB] テストパートナー作成: ${partner.name} (ID: ${partner.id})`);
      
      return {
        id: partner.id,
        userId: partner.user_id,
        name: partner.name,
        gender: partner.gender,
        personalityType: partner.personality_type,
        speechStyle: partner.speech_style,
        systemPrompt: partner.system_prompt,
        avatarDescription: partner.avatar_description,
        intimacyLevel: partner.intimacy_level,
        createdAt: partner.created_at
      };
    } catch (error) {
      console.error('[TEST DB] テストパートナー作成失敗:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // テスト用メッセージ作成
  static async createTestMessage(partnerId: string, messageData: {
    content: string;
    sender: MessageSender;
    emotion?: string;
    context?: Record<string, any>;
  }): Promise<any> {
    try {
      const message = await MessageModel.create({
        partnerId,
        content: messageData.content,
        sender: messageData.sender,
        emotion: messageData.emotion,
        context: messageData.context || {}
      });
      
      console.log(`[TEST DB] テストメッセージ作成: ${message.content.substring(0, 20)}...`);
      return message;
    } catch (error) {
      console.error('[TEST DB] テストメッセージ作成失敗:', error);
      throw error;
    }
  }

  // パートナーのメッセージ取得
  static async findMessages(partnerId: string): Promise<any[]> {
    try {
      return await MessageModel.getMessageHistory(partnerId);
    } catch (error) {
      console.error('[TEST DB] メッセージ取得失敗:', error);
      throw error;
    }
  }

  // パートナー取得
  static async findPartner(partnerId: string): Promise<any | null> {
    try {
      return await PartnerModel.findById(partnerId);
    } catch (error) {
      console.error('[TEST DB] パートナー取得失敗:', error);
      throw error;
    }
  }

  // トランザクション開始
  static async startTransaction(): Promise<any> {
    try {
      return await sequelize.transaction();
    } catch (error) {
      console.error('[TEST DB] トランザクション開始失敗:', error);
      throw error;
    }
  }

  // トランザクションロールバック
  static async rollbackTransaction(transaction: any): Promise<void> {
    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
        console.log('[TEST DB] トランザクションロールバック完了');
      }
    } catch (error) {
      console.error('[TEST DB] トランザクションロールバック失敗:', error);
      throw error;
    }
  }

  // クリーンアップ（トランザクション用）
  static async cleanup(): Promise<void> {
    // トランザクション使用時は自動的にロールバックされるため、特別な処理は不要
    console.log('[TEST DB] クリーンアップ完了（トランザクション使用）');
  }
}

export const dbTestHelper = DbTestHelper;