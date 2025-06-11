import { pool } from '@/config/database.config';
import { ID } from '@/types';

export interface BlacklistedToken {
  id: ID;
  jti: string;
  userId: ID;
  createdAt: Date;
  expiresAt: Date;
}

export class BlacklistedTokenModel {
  // 無効化されたトークンを追加
  static async create(jti: string, userId: ID, expiresAt: Date): Promise<void> {
    console.log(`[DB] ブラックリスト追加: jti=${jti}, userId=${userId}`);
    
    const result = await pool.query(
      `INSERT INTO blacklisted_tokens (jti, user_id, expires_at) 
       VALUES ($1, $2, $3)`,
      [jti, userId, expiresAt]
    );
    
    console.log(`[DB] ブラックリスト追加完了: 影響行数=${result.rowCount}`);
  }

  // JTIがブラックリストに含まれているかチェック
  static async isBlacklisted(jti: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM blacklisted_tokens 
       WHERE jti = $1 AND expires_at > NOW()`,
      [jti]
    );
    
    const isBlacklisted = (result.rowCount ?? 0) > 0;
    console.log(`[DB] ブラックリストチェック: jti=${jti}, blacklisted=${isBlacklisted}`);
    
    return isBlacklisted;
  }

  // ユーザーの全ブラックリストトークンを削除
  static async deleteByUserId(userId: ID): Promise<number> {
    console.log(`[DB] ユーザーブラックリスト削除: userId=${userId}`);
    
    const result = await pool.query(
      'DELETE FROM blacklisted_tokens WHERE user_id = $1',
      [userId]
    );
    
    console.log(`[DB] ユーザーブラックリスト削除完了: 削除行数=${result.rowCount}`);
    return result.rowCount ?? 0;
  }

  // 有効期限切れのブラックリストエントリを削除（メンテナンス用）
  static async cleanupExpired(): Promise<number> {
    console.log('[DB] 期限切れブラックリストエントリ削除開始');
    
    const result = await pool.query(
      'DELETE FROM blacklisted_tokens WHERE expires_at <= NOW()'
    );
    
    console.log(`[DB] 期限切れブラックリストエントリ削除完了: 削除行数=${result.rowCount}`);
    return result.rowCount ?? 0;
  }
}