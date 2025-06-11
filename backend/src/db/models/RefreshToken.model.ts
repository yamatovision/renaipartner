import { pool } from '@/config/database.config';
import { ID } from '@/types';
import bcrypt from 'bcryptjs';
import { ENV_CONFIG } from '@/config/env.config';

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export class RefreshTokenModel {
  // リフレッシュトークン作成
  static async create(userId: ID, token: string, expiresAt: Date): Promise<RefreshToken> {
    const client = await pool.connect();
    
    try {
      // トークンをハッシュ化して保存
      const tokenHash = await bcrypt.hash(token, ENV_CONFIG.BCRYPT_ROUNDS);
      
      const query = `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, token_hash, expires_at, created_at
      `;
      
      const result = await client.query(query, [userId, tokenHash, expiresAt]);
      
      if (result.rows.length === 0) {
        throw new Error('リフレッシュトークンの作成に失敗しました');
      }
      
      return this.mapDbRowToRefreshToken(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // リフレッシュトークン検証
  static async findAndVerify(userId: ID, token: string): Promise<RefreshToken | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM refresh_tokens 
        WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // 最新のトークンから順番に検証
      for (const row of result.rows) {
        const isValid = await bcrypt.compare(token, row.token_hash);
        if (isValid) {
          return this.mapDbRowToRefreshToken(row);
        }
      }
      
      return null;
      
    } finally {
      client.release();
    }
  }

  // トークンによる検索と検証（ユーザーIDなし）
  static async findByToken(token: string): Promise<RefreshToken | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM refresh_tokens 
        WHERE expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // 全ての有効なトークンから検索
      for (const row of result.rows) {
        const isValid = await bcrypt.compare(token, row.token_hash);
        if (isValid) {
          return this.mapDbRowToRefreshToken(row);
        }
      }
      
      return null;
      
    } finally {
      client.release();
    }
  }

  // 期限切れトークンの削除
  static async deleteExpired(): Promise<number> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM refresh_tokens 
        WHERE expires_at <= CURRENT_TIMESTAMP
      `;
      
      const result = await client.query(query);
      return result.rowCount || 0;
      
    } finally {
      client.release();
    }
  }

  // ユーザーの全トークン削除（ログアウト時）
  static async deleteByUserId(userId: ID): Promise<number> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM refresh_tokens 
        WHERE user_id = $1
      `;
      
      const result = await client.query(query, [userId]);
      return result.rowCount || 0;
      
    } finally {
      client.release();
    }
  }

  // 特定のトークン削除
  static async deleteById(id: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM refresh_tokens 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      return (result.rowCount || 0) > 0;
      
    } finally {
      client.release();
    }
  }

  // 古いトークンのクリーンアップ（定期実行用）
  static async cleanup(retentionDays: number = 30): Promise<number> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM refresh_tokens 
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${retentionDays} days'
      `;
      
      const result = await client.query(query);
      return result.rowCount || 0;
      
    } finally {
      client.release();
    }
  }

  // DBの行データをRefreshTokenオブジェクトにマッピング
  private static mapDbRowToRefreshToken(row: any): RefreshToken {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at)
    };
  }
}