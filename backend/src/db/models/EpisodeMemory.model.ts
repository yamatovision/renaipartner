import { pool } from '@/config/database.config';
import { 
  EpisodeMemory,
  ID 
} from '@/types';

class EpisodeMemoryModel {
  // エピソード記憶作成
  static async create(episodeData: Omit<EpisodeMemory, 'id'>): Promise<EpisodeMemory> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO episode_memories (
          partner_id, title, description, emotional_impact, 
          tags, participants, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, partner_id, title, description, emotional_impact,
                  tags, participants, occurred_at
      `;
      
      const values = [
        episodeData.partnerId,
        episodeData.title,
        episodeData.description,
        episodeData.emotionalWeight,
        JSON.stringify(episodeData.tags || []),
        JSON.stringify(episodeData.participants || []),
        episodeData.date
      ];

      const result = await client.query(query, values);
      const row = result.rows[0];
      
      return {
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      };
    } catch (error) {
      console.error('[EpisodeMemory.model] エピソード記憶作成エラー:', error);
      throw new Error('エピソード記憶の作成に失敗しました');
    } finally {
      client.release();
    }
  }

  // パートナーIDでエピソード記憶取得
  static async findByPartnerId(partnerId: ID, limit: number = 20): Promise<EpisodeMemory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, title, description, emotional_impact,
               tags, participants, occurred_at
        FROM episode_memories 
        WHERE partner_id = $1 
        ORDER BY occurred_at DESC, emotional_impact DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [partnerId, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      }));
    } catch (error) {
      console.error('[EpisodeMemory.model] エピソード記憶取得エラー:', error);
      throw new Error('エピソード記憶の取得に失敗しました');
    } finally {
      client.release();
    }
  }

  // 感情重みでエピソード記憶取得（重要なエピソードを優先）
  static async findByEmotionalWeight(
    partnerId: ID, 
    minWeight: number = 3.0, 
    limit: number = 10
  ): Promise<EpisodeMemory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, title, description, emotional_impact,
               tags, participants, occurred_at
        FROM episode_memories 
        WHERE partner_id = $1 AND emotional_impact >= $2
        ORDER BY emotional_impact DESC, occurred_at DESC
        LIMIT $3
      `;
      
      const result = await client.query(query, [partnerId, minWeight, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      }));
    } catch (error) {
      console.error('[EpisodeMemory.model] 感情重み検索エラー:', error);
      throw new Error('感情重みによるエピソード検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // タグでエピソード記憶検索
  static async findByTags(partnerId: ID, tags: string[]): Promise<EpisodeMemory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, title, description, emotional_impact,
               tags, participants, occurred_at
        FROM episode_memories 
        WHERE partner_id = $1 
        AND tags::jsonb ?| $2
        ORDER BY emotional_impact DESC, occurred_at DESC
        LIMIT 20
      `;
      
      const result = await client.query(query, [partnerId, tags]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      }));
    } catch (error) {
      console.error('[EpisodeMemory.model] タグ検索エラー:', error);
      throw new Error('タグによるエピソード検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // 日付範囲でエピソード記憶検索
  static async findByDateRange(
    partnerId: ID, 
    startDate: Date, 
    endDate: Date
  ): Promise<EpisodeMemory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, title, description, emotional_impact,
               tags, participants, occurred_at
        FROM episode_memories 
        WHERE partner_id = $1 
        AND occurred_at BETWEEN $2 AND $3
        ORDER BY occurred_at DESC
      `;
      
      const result = await client.query(query, [partnerId, startDate, endDate]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      }));
    } catch (error) {
      console.error('[EpisodeMemory.model] 日付範囲検索エラー:', error);
      throw new Error('日付範囲によるエピソード検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // 参加者でエピソード記憶検索
  static async findByParticipants(partnerId: ID, participants: string[]): Promise<EpisodeMemory[]> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, title, description, emotional_impact,
               tags, participants, occurred_at
        FROM episode_memories 
        WHERE partner_id = $1 
        AND participants::jsonb ?| $2
        ORDER BY emotional_impact DESC, occurred_at DESC
        LIMIT 20
      `;
      
      const result = await client.query(query, [partnerId, participants]);
      
      return result.rows.map(row => ({
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      }));
    } catch (error) {
      console.error('[EpisodeMemory.model] 参加者検索エラー:', error);
      throw new Error('参加者によるエピソード検索に失敗しました');
    } finally {
      client.release();
    }
  }

  // エピソード記憶更新
  static async update(id: ID, updateData: Partial<Omit<EpisodeMemory, 'id' | 'partnerId'>>): Promise<EpisodeMemory> {
    const client = await pool.connect();
    
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (updateData.title !== undefined) {
        setParts.push(`title = $${paramCount++}`);
        values.push(updateData.title);
      }
      
      if (updateData.description !== undefined) {
        setParts.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }
      
      if (updateData.emotionalWeight !== undefined) {
        setParts.push(`emotional_impact = $${paramCount++}`);
        values.push(updateData.emotionalWeight);
      }
      
      if (updateData.tags !== undefined) {
        setParts.push(`tags = $${paramCount++}`);
        values.push(JSON.stringify(updateData.tags));
      }
      
      if (updateData.participants !== undefined) {
        setParts.push(`participants = $${paramCount++}`);
        values.push(JSON.stringify(updateData.participants));
      }
      
      if (updateData.date !== undefined) {
        setParts.push(`occurred_at = $${paramCount++}`);
        values.push(updateData.date);
      }
      
      if (setParts.length === 0) {
        throw new Error('更新するデータが指定されていません');
      }
      
      values.push(id);
      
      const query = `
        UPDATE episode_memories 
        SET ${setParts.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, partner_id, title, description, emotional_impact,
                  tags, participants, occurred_at
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('エピソード記憶が見つかりません');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description,
        emotionalWeight: row.emotional_impact,
        tags: row.tags || [],
        participants: row.participants || [],
        date: new Date(row.occurred_at)
      };
    } catch (error) {
      console.error('[EpisodeMemory.model] エピソード記憶更新エラー:', error);
      throw new Error('エピソード記憶の更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // エピソード記憶削除
  static async delete(id: ID): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `DELETE FROM episode_memories WHERE id = $1`;
      const result = await client.query(query, [id]);
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('[EpisodeMemory.model] エピソード記憶削除エラー:', error);
      throw new Error('エピソード記憶の削除に失敗しました');
    } finally {
      client.release();
    }
  }

  // エピソード統計取得
  static async getEpisodeStats(partnerId: ID): Promise<{
    totalEpisodes: number;
    averageEmotionalWeight: number;
    mostCommonTags: string[];
    frequentParticipants: string[];
  }> {
    const client = await pool.connect();
    
    try {
      // 基本統計
      const statsQuery = `
        SELECT 
          COUNT(*) as total_episodes,
          AVG(emotional_impact) as avg_emotional_impact
        FROM episode_memories 
        WHERE partner_id = $1
      `;
      
      const statsResult = await client.query(statsQuery, [partnerId]);
      const stats = statsResult.rows[0];
      
      // タグ頻度分析
      const tagsQuery = `
        SELECT jsonb_array_elements_text(tags) as tag, COUNT(*) as frequency
        FROM episode_memories 
        WHERE partner_id = $1
        GROUP BY tag
        ORDER BY frequency DESC
        LIMIT 10
      `;
      
      const tagsResult = await client.query(tagsQuery, [partnerId]);
      const mostCommonTags = tagsResult.rows.map(row => row.tag);
      
      // 参加者頻度分析
      const participantsQuery = `
        SELECT jsonb_array_elements_text(participants) as participant, COUNT(*) as frequency
        FROM episode_memories 
        WHERE partner_id = $1
        GROUP BY participant
        ORDER BY frequency DESC
        LIMIT 10
      `;
      
      const participantsResult = await client.query(participantsQuery, [partnerId]);
      const frequentParticipants = participantsResult.rows.map(row => row.participant);
      
      return {
        totalEpisodes: parseInt(stats.total_episodes) || 0,
        averageEmotionalWeight: parseFloat(stats.avg_emotional_impact) || 0,
        mostCommonTags,
        frequentParticipants
      };
    } catch (error) {
      console.error('[EpisodeMemory.model] エピソード統計取得エラー:', error);
      throw new Error('エピソード統計の取得に失敗しました');
    } finally {
      client.release();
    }
  }
}

export { EpisodeMemoryModel };
export default EpisodeMemoryModel;