import { pool } from '@/config/database.config';
import { 
  Memory, 
  MemoryType,
  ID 
} from '@/types';

class MemoryModel {
  // メモリ作成
  static async create(memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO memories (
          partner_id, type, content, vector, importance, 
          emotional_weight, tags, related_people
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, partner_id, type, content, vector, importance,
                  emotional_weight, tags, related_people, created_at, updated_at
      `;
      
      const values = [
        memoryData.partnerId,
        memoryData.type,
        memoryData.content,
        memoryData.vector ? JSON.stringify(memoryData.vector) : null,
        memoryData.importance,
        memoryData.emotionalWeight,
        JSON.stringify(memoryData.tags || []),
        memoryData.relatedPeople ? JSON.stringify(memoryData.relatedPeople) : null
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];
      
      return {
        id: row.id,
        partnerId: row.partner_id,
        type: row.type as MemoryType,
        content: row.content,
        vector: row.vector ? (typeof row.vector === 'string' ? (() => {
          try { return JSON.parse(row.vector); } catch { return null; }
        })() : row.vector) : undefined,
        importance: row.importance,
        emotionalWeight: row.emotional_weight,
        tags: row.tags || [],
        relatedPeople: row.related_people || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('[Memory.model] メモリ作成エラー:', error);
      throw new Error('メモリの作成に失敗しました');
    } finally {
      client.release();
    }
  }

  // パートナーIDでメモリ検索
  static async findByPartnerId(partnerId: ID, limit: number = 50): Promise<Memory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, type, content, vector, importance,
               emotional_weight, tags, related_people, created_at, updated_at
        FROM memories 
        WHERE partner_id = $1 
        ORDER BY created_at DESC, importance DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [partnerId, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        type: row.type as MemoryType,
        content: row.content,
        vector: row.vector ? (typeof row.vector === 'string' ? (() => {
          try { return JSON.parse(row.vector); } catch { return null; }
        })() : row.vector) : undefined,
        importance: row.importance,
        emotionalWeight: row.emotional_weight,
        tags: row.tags || [],
        relatedPeople: row.related_people || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('[Memory.model] メモリ検索エラー:', error);
      throw new Error('メモリの検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // 重要度とタイプによるメモリ検索
  static async findByImportanceAndType(
    partnerId: ID, 
    minImportance: number, 
    types?: MemoryType[]
  ): Promise<Memory[]> {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT id, partner_id, type, content, vector, importance,
               emotional_weight, tags, related_people, created_at, updated_at
        FROM memories 
        WHERE partner_id = $1 AND importance >= $2
      `;
      
      const values: any[] = [partnerId, minImportance];
      
      if (types && types.length > 0) {
        query += ` AND type = ANY($3)`;
        values.push(types);
      }
      
      query += ` ORDER BY importance DESC, created_at DESC LIMIT 100`;
      
      const result = await client.query(query, values);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        type: row.type as MemoryType,
        content: row.content,
        vector: row.vector ? (typeof row.vector === 'string' ? (() => {
          try { return JSON.parse(row.vector); } catch { return null; }
        })() : row.vector) : undefined,
        importance: row.importance,
        emotionalWeight: row.emotional_weight,
        tags: row.tags || [],
        relatedPeople: row.related_people || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('[Memory.model] 重要度検索エラー:', error);
      throw new Error('重要度によるメモリ検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // タグでメモリ検索
  static async findByTags(partnerId: ID, tags: string[]): Promise<Memory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, type, content, vector, importance,
               emotional_weight, tags, related_people, created_at, updated_at
        FROM memories 
        WHERE partner_id = $1 
        AND tags::jsonb ?| $2
        ORDER BY importance DESC, created_at DESC
        LIMIT 50
      `;
      
      const result = await client.query(query, [partnerId, tags]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        type: row.type as MemoryType,
        content: row.content,
        vector: row.vector ? (typeof row.vector === 'string' ? (() => {
          try { return JSON.parse(row.vector); } catch { return null; }
        })() : row.vector) : undefined,
        importance: row.importance,
        emotionalWeight: row.emotional_weight,
        tags: row.tags || [],
        relatedPeople: row.related_people || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('[Memory.model] タグ検索エラー:', error);
      throw new Error('タグによるメモリ検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // メモリ更新（重要度やタグの変更）
  static async updateImportance(id: ID, importance: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE memories 
        SET importance = $1 
        WHERE id = $2
      `;
      
      await client.query(query, [importance, id]);
    } catch (error) {
      console.error('[Memory.model] 重要度更新エラー:', error);
      throw new Error('メモリの重要度更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // 古いメモリの削除（データベース最適化）
  static async deleteOldMemories(partnerId: ID, keepCount: number = 1000): Promise<number> {
    const client = await pool.connect();
    
    try {
      const query = `
        DELETE FROM memories 
        WHERE partner_id = $1 
        AND id NOT IN (
          SELECT id FROM memories 
          WHERE partner_id = $1 
          ORDER BY importance DESC, created_at DESC 
          LIMIT $2
        )
      `;
      
      const result = await client.query(query, [partnerId, keepCount]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('[Memory.model] 古いメモリ削除エラー:', error);
      throw new Error('古いメモリの削除に失敗しました');
    } finally {
      client.release();
    }
  }

  // メモリ統計取得
  static async getMemoryStats(partnerId: ID): Promise<{
    totalMemories: number;
    byType: Record<MemoryType, number>;
    averageImportance: number;
  }> {
    const client = await pool.connect();
    
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_memories,
          type,
          COUNT(*) as type_count,
          AVG(importance) as avg_importance
        FROM memories 
        WHERE partner_id = $1 
        GROUP BY type
      `;
      
      const result = await client.query(statsQuery, [partnerId]);
      
      const byType: Record<MemoryType, number> = {} as Record<MemoryType, number>;
      let totalMemories = 0;
      let totalImportance = 0;
      
      result.rows.forEach(row => {
        byType[row.type as MemoryType] = parseInt(row.type_count);
        totalMemories += parseInt(row.type_count);
        totalImportance += parseFloat(row.avg_importance) * parseInt(row.type_count);
      });
      
      return {
        totalMemories,
        byType,
        averageImportance: totalMemories > 0 ? totalImportance / totalMemories : 0
      };
    } catch (error) {
      console.error('[Memory.model] メモリ統計取得エラー:', error);
      throw new Error('メモリ統計の取得に失敗しました');
    } finally {
      client.release();
    }
  }
}

export { MemoryModel };
export default MemoryModel;