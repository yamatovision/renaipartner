import { pool } from '@/config/database.config';
import { 
  RelationshipMetrics,
  ID 
} from '@/types';

class RelationshipMetricsModel {
  // 関係性メトリクス作成（パートナー作成時に初期化）
  static async create(partnerId: ID): Promise<RelationshipMetrics> {
    const client = await pool.connect();
    
    try {
      // パートナー存在確認
      const partnerCheck = await client.query('SELECT id FROM partners WHERE id = $1', [partnerId]);
      if (partnerCheck.rows.length === 0) {
        throw new Error(`パートナーID ${partnerId} が存在しません`);
      }
      const query = `
        INSERT INTO relationship_metrics (
          partner_id, intimacy_level, trust_level, emotional_connection,
          communication_frequency, last_interaction, shared_experiences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, partner_id, intimacy_level, trust_level, emotional_connection,
                  communication_frequency, last_interaction, shared_experiences
      `;
      
      const initialValues = [
        partnerId,
        0,                          // intimacy_level: 初期値0
        50,                         // trust_level: 初期値50（中立）
        0,                          // emotional_connection: 初期値0
        0,                          // communication_frequency: 初期値0
        new Date(),                 // last_interaction: 現在時刻
        0                           // shared_experiences: 初期値0
      ];

      const result = await client.query(query, initialValues);
      const row = result.rows[0];
      
      return {
        id: row.id,
        partnerId: row.partner_id,
        intimacyLevel: row.intimacy_level,
        conversationFrequency: row.communication_frequency,
        lastInteraction: new Date(row.last_interaction),
        sharedMemories: row.shared_experiences
      };
    } catch (error) {
      console.error('[RelationshipMetrics.model] 関係性メトリクス作成エラー:', error);
      throw new Error('関係性メトリクスの作成に失敗しました');
    } finally {
      client.release();
    }
  }

  // パートナーIDで関係性メトリクス取得
  static async findByPartnerId(partnerId: ID): Promise<RelationshipMetrics | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, partner_id, intimacy_level, trust_level, emotional_connection,
               communication_frequency, last_interaction, shared_experiences
        FROM relationship_metrics 
        WHERE partner_id = $1
      `;
      
      const result = await client.query(query, [partnerId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partnerId: row.partner_id,
        intimacyLevel: row.intimacy_level,
        conversationFrequency: row.communication_frequency,
        lastInteraction: new Date(row.last_interaction),
        sharedMemories: row.shared_experiences
      };
    } catch (error) {
      console.error('[RelationshipMetrics.model] 関係性メトリクス取得エラー:', error);
      throw new Error('関係性メトリクスの取得に失敗しました');
    } finally {
      client.release();
    }
  }

  // 親密度更新
  static async updateIntimacyLevel(partnerId: ID, intimacyChange: number): Promise<RelationshipMetrics> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE relationship_metrics 
        SET 
          intimacy_level = GREATEST(0, LEAST(100, intimacy_level + $1)),
          last_interaction = CURRENT_TIMESTAMP
        WHERE partner_id = $2
        RETURNING id, partner_id, intimacy_level, trust_level, emotional_connection,
                  communication_frequency, last_interaction, shared_experiences
      `;
      
      const result = await client.query(query, [intimacyChange, partnerId]);
      
      if (result.rows.length === 0) {
        throw new Error('関係性メトリクスが見つかりません');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partnerId: row.partner_id,
        intimacyLevel: row.intimacy_level,
        conversationFrequency: row.communication_frequency,
        lastInteraction: new Date(row.last_interaction),
        sharedMemories: row.shared_experiences
      };
    } catch (error) {
      console.error('[RelationshipMetrics.model] 親密度更新エラー:', error);
      throw new Error('親密度の更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // 信頼度更新 (将来の拡張用・現在未使用)
  // static async updateTrustLevel(partnerId: ID, trustChange: number): Promise<RelationshipMetrics>

  // 感情接続更新 (将来の拡張用・現在未使用)
  // static async updateEmotionalConnection(partnerId: ID, connectionChange: number): Promise<RelationshipMetrics>

  // 会話頻度更新（メッセージごとにインクリメント）
  static async incrementConversationFrequency(partnerId: ID): Promise<RelationshipMetrics> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE relationship_metrics 
        SET 
          communication_frequency = communication_frequency + 1,
          last_interaction = CURRENT_TIMESTAMP
        WHERE partner_id = $1
        RETURNING id, partner_id, intimacy_level, trust_level, emotional_connection,
                  communication_frequency, last_interaction, shared_experiences
      `;
      
      const result = await client.query(query, [partnerId]);
      
      if (result.rows.length === 0) {
        throw new Error('関係性メトリクスが見つかりません');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partnerId: row.partner_id,
        intimacyLevel: row.intimacy_level,
        conversationFrequency: row.communication_frequency,
        lastInteraction: new Date(row.last_interaction),
        sharedMemories: row.shared_experiences
      };
    } catch (error) {
      console.error('[RelationshipMetrics.model] 会話頻度更新エラー:', error);
      throw new Error('会話頻度の更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // 共有記憶数更新（重要なメモリが作成されたときに呼び出し）
  static async incrementSharedMemories(partnerId: ID): Promise<RelationshipMetrics> {
    const client = await pool.connect();
    
    try {
      // まず既存レコードを更新試行
      const updateQuery = `
        UPDATE relationship_metrics 
        SET 
          shared_experiences = shared_experiences + 1,
          last_interaction = CURRENT_TIMESTAMP
        WHERE partner_id = $1
        RETURNING id, partner_id, intimacy_level, trust_level, emotional_connection,
                  communication_frequency, last_interaction, shared_experiences
      `;
      
      let result = await client.query(updateQuery, [partnerId]);
      
      // レコードが存在しない場合は新規作成
      if (result.rows.length === 0) {
        const insertQuery = `
          INSERT INTO relationship_metrics (
            partner_id, intimacy_level, trust_level, emotional_connection,
            communication_frequency, last_interaction, shared_experiences
          ) VALUES ($1, 30, 30, 30, 1, CURRENT_TIMESTAMP, 1)
          RETURNING id, partner_id, intimacy_level, trust_level, emotional_connection,
                    communication_frequency, last_interaction, shared_experiences
        `;
        
        result = await client.query(insertQuery, [partnerId]);
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partnerId: row.partner_id,
        intimacyLevel: row.intimacy_level,
        conversationFrequency: row.communication_frequency,
        lastInteraction: new Date(row.last_interaction),
        sharedMemories: row.shared_experiences
      };
    } catch (error) {
      console.error('[RelationshipMetrics.model] 共有記憶数更新エラー:', error);
      throw new Error('共有記憶数の更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // 複合更新（一度に複数の指標を更新）
  static async updateMultipleMetrics(
    partnerId: ID, 
    updates: {
      intimacyChange?: number;
      trustChange?: number;
      connectionChange?: number;
      incrementFrequency?: boolean;
      incrementMemories?: boolean;
    }
  ): Promise<RelationshipMetrics> {
    const client = await pool.connect();
    
    try {
      let query = `
        UPDATE relationship_metrics 
        SET 
          intimacy_level = GREATEST(0, LEAST(100, intimacy_level + $2)),
          trust_level = GREATEST(0, LEAST(100, trust_level + $3)),
          emotional_connection = GREATEST(0, LEAST(100, emotional_connection + $4)),
          communication_frequency = communication_frequency + $5,
          shared_experiences = shared_experiences + $6,
          last_interaction = CURRENT_TIMESTAMP
        WHERE partner_id = $1
        RETURNING id, partner_id, intimacy_level, trust_level, emotional_connection,
                  communication_frequency, last_interaction, shared_experiences
      `;
      
      const values = [
        partnerId,
        updates.intimacyChange || 0,
        updates.trustChange || 0,
        updates.connectionChange || 0,
        updates.incrementFrequency ? 1 : 0,
        updates.incrementMemories ? 1 : 0
      ];
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('関係性メトリクスが見つかりません');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        partnerId: row.partner_id,
        intimacyLevel: row.intimacy_level,
        conversationFrequency: row.communication_frequency,
        lastInteraction: new Date(row.last_interaction),
        sharedMemories: row.shared_experiences
      };
    } catch (error) {
      console.error('[RelationshipMetrics.model] 複合更新エラー:', error);
      throw new Error('関係性メトリクスの更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // 関係性の段階判定
  static getRelationshipStage(metrics: RelationshipMetrics): string {
    const { intimacyLevel } = metrics;
    
    if (intimacyLevel < 20) return 'stranger';      // 知らない人
    if (intimacyLevel < 40) return 'acquaintance';  // 知り合い
    if (intimacyLevel < 60) return 'friend';        // 友達
    if (intimacyLevel < 80) return 'close_friend';  // 親しい友達
    return 'intimate';                             // 親密な関係
  }
}

export { RelationshipMetricsModel };
export default RelationshipMetricsModel;