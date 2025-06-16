import { pool } from '@/config/database.config';
import type { GeneratedImage, ID } from '@/types';

/**
 * GeneratedImageモデル - 画像生成履歴とメタデータの管理
 * Leonardo AI連携による画像生成の記録とパートナー一貫性の保持
 */
export class GeneratedImageModel {
  /**
   * 画像生成レコードを作成
   */
  static async create(imageData: {
    partnerId?: ID | null;
    imageUrl: string;
    thumbnailUrl?: string;
    prompt: string;
    context: string;
    consistencyScore: number;
    leonardoGenerationId?: string;
    modelUsed?: string;
    metadata?: Record<string, any>;
  }): Promise<GeneratedImage> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO generated_images (
          partner_id, image_url, thumbnail_url, prompt, context, 
          consistency_score, leonardo_generation_id, model_used, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, partner_id, image_url, thumbnail_url, prompt, context,
                  consistency_score, leonardo_generation_id, model_used, metadata,
                  created_at, updated_at
      `;
      
      const values = [
        imageData.partnerId || null,
        imageData.imageUrl,
        imageData.thumbnailUrl || null,
        imageData.prompt,
        imageData.context,
        imageData.consistencyScore,
        imageData.leonardoGenerationId || null,
        imageData.modelUsed || null,
        imageData.metadata ? JSON.stringify(imageData.metadata) : null
      ];
      
      const result = await client.query(query, values);
      return this.mapDbRowToGeneratedImage(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  /**
   * パートナー別の画像生成履歴を取得
   */
  static async getByPartnerId(partnerId: ID, limit: number = 20): Promise<GeneratedImage[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, image_url, thumbnail_url, prompt, context,
               consistency_score, leonardo_generation_id, model_used, metadata,
               created_at, updated_at
        FROM generated_images 
        WHERE partner_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [partnerId, limit]);
      return result.rows.map(row => this.mapDbRowToGeneratedImage(row));
      
    } finally {
      client.release();
    }
  }

  /**
   * 一貫性スコアが高い画像を取得（参考画像用）
   */
  static async getHighConsistencyImages(partnerId: ID, minScore: number = 0.8): Promise<GeneratedImage[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, image_url, thumbnail_url, prompt, context,
               consistency_score, leonardo_generation_id, model_used, metadata,
               created_at, updated_at
        FROM generated_images 
        WHERE partner_id = $1 AND consistency_score >= $2
        ORDER BY consistency_score DESC, created_at DESC
        LIMIT 5
      `;
      
      const result = await client.query(query, [partnerId, minScore]);
      return result.rows.map(row => this.mapDbRowToGeneratedImage(row));
      
    } finally {
      client.release();
    }
  }

  /**
   * 画像生成統計を取得
   */
  static async getGenerationStats(partnerId: ID): Promise<{
    totalImages: number;
    averageConsistency: number;
    recentImages: number;
  }> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_images,
          AVG(consistency_score) as avg_consistency,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_images
        FROM generated_images 
        WHERE partner_id = $1
      `;
      
      const result = await client.query(query, [partnerId]);
      const stats = result.rows[0];
      
      return {
        totalImages: parseInt(stats.total_images, 10),
        averageConsistency: parseFloat(stats.avg_consistency || '0'),
        recentImages: parseInt(stats.recent_images, 10),
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * IDで画像を検索
   */
  static async findByPk(id: ID): Promise<GeneratedImage | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, image_url, thumbnail_url, prompt, context,
               consistency_score, leonardo_generation_id, model_used, metadata,
               created_at, updated_at
        FROM generated_images 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToGeneratedImage(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  /**
   * 画像を削除
   */
  static async destroy(id: ID): Promise<void> {
    const client = await pool.connect();
    
    try {
      const query = 'DELETE FROM generated_images WHERE id = $1';
      await client.query(query, [id]);
      
    } finally {
      client.release();
    }
  }

  /**
   * データベース行をGeneratedImageオブジェクトにマッピング
   */
  private static mapDbRowToGeneratedImage(row: any): GeneratedImage {
    return {
      id: row.id,
      partnerId: row.partner_id,
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
      prompt: row.prompt,
      context: row.context,
      consistencyScore: parseFloat(row.consistency_score),
      leonardoGenerationId: row.leonardo_generation_id,
      modelUsed: row.model_used,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }


  /**
   * IDで画像を検索（エイリアス）
   */
  static async findById(id: ID): Promise<GeneratedImage | null> {
    return this.findByPk(id);
  }

  /**
   * IDで画像を削除（エイリアス）
   */
  static async deleteById(id: ID): Promise<void> {
    return this.destroy(id);
  }
}