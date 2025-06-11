import { pool } from '@/config/database.config';
import { User, UserCreate, UserRole, UserStatus, ID } from '@/types';
import bcrypt from 'bcryptjs';
import { ENV_CONFIG } from '@/config/env.config';

class UserModel {
  // ユーザー作成
  static async create(userData: UserCreate): Promise<User> {
    const client = await pool.connect();
    
    try {
      // パスワードのハッシュ化
      const passwordHash = userData.password 
        ? await bcrypt.hash(userData.password, ENV_CONFIG.BCRYPT_ROUNDS)
        : await bcrypt.hash('aikakumei', ENV_CONFIG.BCRYPT_ROUNDS); // デフォルトパスワード

      const query = `
        INSERT INTO users (
          email, password_hash, surname, first_name, nickname, birthday, role, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, surname, first_name, nickname, birthday, role, status, 
                  profile_completed, created_at, updated_at
      `;
      
      const values = [
        userData.email,
        passwordHash,
        userData.surname || '',
        userData.firstName || '',
        userData.nickname || null,
        userData.birthday || '1990-01-01',
        userData.role || UserRole.USER,
        UserStatus.ACTIVE
      ];
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('ユーザーの作成に失敗しました');
      }
      
      return this.mapDbRowToUser(result.rows[0]);
      
    } catch (error) {
      if ((error as any).code === '23505') { // 重複エラー
        throw new Error('このメールアドレスは既に使用されています');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // メールアドレスでユーザー検索（認証用、パスワードハッシュを含む）
  static async findByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, email, password_hash, surname, first_name, nickname, birthday, 
               role, status, profile_completed, created_at, updated_at
        FROM users 
        WHERE email = $1 AND status = $2
      `;
      
      const result = await client.query(query, [email, UserStatus.ACTIVE]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const user = this.mapDbRowToUser(row);
      
      return {
        ...user,
        passwordHash: row.password_hash
      };
      
    } finally {
      client.release();
    }
  }

  // IDでユーザー検索
  static async findById(id: ID): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, email, surname, first_name, nickname, birthday, role, status, 
               profile_completed, created_at, updated_at
        FROM users 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToUser(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // メールアドレスでユーザー検索（パスワードハッシュなし）
  static async findByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, email, surname, first_name, nickname, birthday, role, status, 
               profile_completed, created_at, updated_at
        FROM users 
        WHERE email = $1
      `;
      
      const result = await client.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToUser(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // ユーザー一覧取得（管理者用）
  static async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
  } = {}): Promise<{ users: User[]; total: number }> {
    const client = await pool.connect();
    
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;
      
      let whereConditions = [];
      let queryParams: any[] = [];
      let paramIndex = 1;
      
      // 検索条件
      if (options.search) {
        whereConditions.push(`(email ILIKE $${paramIndex} OR surname ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex})`);
        queryParams.push(`%${options.search}%`);
        paramIndex++;
      }
      
      if (options.status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(options.status);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // ユーザー一覧取得
      const usersQuery = `
        SELECT id, email, surname, first_name, nickname, birthday, role, status, 
               profile_completed, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      const usersResult = await client.query(usersQuery, queryParams);
      
      // 総数取得
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countParams = queryParams.slice(0, -2); // limit, offsetを除く
      const countResult = await client.query(countQuery, countParams);
      
      const users = usersResult.rows.map(row => this.mapDbRowToUser(row));
      const total = parseInt(countResult.rows[0].total, 10);
      
      return { users, total };
      
    } finally {
      client.release();
    }
  }

  // ユーザーステータス更新
  static async updateStatus(id: ID, status: UserStatus): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE users 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, surname, first_name, nickname, birthday, role, status, 
                  profile_completed, created_at, updated_at
      `;
      
      const result = await client.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToUser(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // パスワード更新
  static async updatePassword(id: ID, newPassword: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const passwordHash = await bcrypt.hash(newPassword, ENV_CONFIG.BCRYPT_ROUNDS);
      
      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      const result = await client.query(query, [passwordHash, id]);
      
      return result.rowCount === 1;
      
    } finally {
      client.release();
    }
  }

  // パスワード検証
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // プロフィール更新
  static async updateProfile(id: ID, profileData: {
    surname?: string;
    firstName?: string;
    nickname?: string;
    birthday?: string;
  }): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (profileData.surname !== undefined) {
        updateFields.push(`surname = $${paramIndex}`);
        values.push(profileData.surname);
        paramIndex++;
      }
      
      if (profileData.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        values.push(profileData.firstName);
        paramIndex++;
      }
      
      if (profileData.nickname !== undefined) {
        updateFields.push(`nickname = $${paramIndex}`);
        values.push(profileData.nickname);
        paramIndex++;
      }
      
      if (profileData.birthday !== undefined) {
        updateFields.push(`birthday = $${paramIndex}`);
        values.push(profileData.birthday);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        // 更新する項目がない場合は現在のユーザー情報を返す
        return this.findById(id);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, surname, first_name, nickname, birthday, role, status, 
                  profile_completed, created_at, updated_at
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToUser(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // ユーザーデータ エクスポート用の詳細情報取得
  static async getExportData(id: ID): Promise<{
    user: User;
    partners?: any[];
    messages?: any[];
    settings?: any;
  } | null> {
    const client = await pool.connect();
    
    try {
      // ユーザー基本情報
      const user = await this.findById(id);
      if (!user) {
        return null;
      }
      
      // パートナー情報（将来実装）
      const partnersQuery = `
        SELECT id, name, gender, personality_type, speech_style, 
               system_prompt, avatar_description, intimacy_level, created_at
        FROM partners 
        WHERE user_id = $1
      `;
      
      let partners = [];
      try {
        const partnersResult = await client.query(partnersQuery, [id]);
        partners = partnersResult.rows;
      } catch (error) {
        // partnersテーブルがまだ存在しない場合は空配列
        console.log('Partners table not yet created, skipping...');
      }
      
      // メッセージ履歴（将来実装）
      let messages: any[] = [];
      try {
        // メッセージ履歴を取得する予定（パートナーIDが必要）
        // 現在は空配列を返す
      } catch (error) {
        console.log('Messages table not yet created, skipping...');
      }
      
      // 設定情報（将来実装）
      let settings: any = null;
      try {
        // ユーザー設定を取得する予定
        // 現在はnullを返す
      } catch (error) {
        console.log('Settings table not yet created, skipping...');
      }
      
      return {
        user,
        partners,
        messages,
        settings
      };
      
    } finally {
      client.release();
    }
  }

  // 統計情報取得（管理者用）
  static async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    todayRegistrations: number;
  }> {
    const client = await pool.connect();
    
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_registrations
        FROM users
      `;
      
      const result = await client.query(statsQuery);
      const row = result.rows[0];
      
      return {
        totalUsers: parseInt(row.total_users, 10),
        activeUsers: parseInt(row.active_users, 10),
        inactiveUsers: parseInt(row.inactive_users, 10),
        todayRegistrations: parseInt(row.today_registrations, 10)
      };
      
    } finally {
      client.release();
    }
  }

  // DBの行データをUserオブジェクトにマッピング
  private static mapDbRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      surname: row.surname,
      firstName: row.first_name,
      nickname: row.nickname,
      birthday: row.birthday,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// エクスポート
export { UserModel };
export default UserModel;