import { pool } from '@/config/database.config';
import { ID } from '@/types';

/**
 * 個性メモリのデータ構造
 */
export interface PersonalityTrait {
  trait: string;           // 特性（例: "優しい", "せっかち"）
  context?: string;        // 文脈（例: "困っている人を見ると"）
  example?: string;        // 具体例
  importance: number;      // 重要度（1-10）
  lastSeen: Date;         // 最後に観察された日時
  frequency: number;       // 観察された頻度
}

export interface PersonalityMemory {
  id: ID;
  partnerId: ID;
  strengths: PersonalityTrait[];      // 良い面（3-5個）
  shadows: PersonalityTrait[];        // 苦手な面・影（3-5個）
  coreValues: string[];               // 大切にしている価値観（2-3個）
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * 個性メモリモデル
 */
export class PersonalityMemoryModel {
  /**
   * 個性メモリを作成または更新
   */
  static async upsert(partnerId: ID, data: Partial<PersonalityMemory>): Promise<PersonalityMemory> {
    const client = await pool.connect();
    
    try {
      // 既存のレコードを確認
      const existingQuery = `
        SELECT * FROM personality_memories 
        WHERE partner_id = $1
      `;
      const existing = await client.query(existingQuery, [partnerId]);
      
      if (existing.rows.length > 0) {
        // 更新
        const updateQuery = `
          UPDATE personality_memories 
          SET 
            strengths = $2,
            shadows = $3,
            core_values = $4,
            last_updated = CURRENT_TIMESTAMP
          WHERE partner_id = $1
          RETURNING *
        `;
        
        const values = [
          partnerId,
          JSON.stringify(data.strengths || existing.rows[0].strengths),
          JSON.stringify(data.shadows || existing.rows[0].shadows),
          JSON.stringify(data.coreValues || existing.rows[0].core_values)
        ];
        
        const result = await client.query(updateQuery, values);
        return this.mapRowToPersonalityMemory(result.rows[0]);
      } else {
        // 新規作成
        const insertQuery = `
          INSERT INTO personality_memories (
            partner_id, strengths, shadows, core_values
          ) VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        const values = [
          partnerId,
          JSON.stringify(data.strengths || []),
          JSON.stringify(data.shadows || []),
          JSON.stringify(data.coreValues || [])
        ];
        
        const result = await client.query(insertQuery, values);
        return this.mapRowToPersonalityMemory(result.rows[0]);
      }
    } catch (error) {
      console.error('[PersonalityMemory.model] 更新エラー:', error);
      throw new Error('個性メモリの更新に失敗しました');
    } finally {
      client.release();
    }
  }

  /**
   * パートナーIDで個性メモリを取得
   */
  static async findByPartnerId(partnerId: ID): Promise<PersonalityMemory | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT * FROM personality_memories 
        WHERE partner_id = $1
      `;
      
      const result = await client.query(query, [partnerId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToPersonalityMemory(result.rows[0]);
    } catch (error) {
      console.error('[PersonalityMemory.model] 取得エラー:', error);
      throw new Error('個性メモリの取得に失敗しました');
    } finally {
      client.release();
    }
  }

  /**
   * 新しい特性を追加（重要度に基づいて既存の特性と入れ替え）
   */
  static async addTrait(
    partnerId: ID, 
    type: 'strength' | 'shadow',
    newTrait: PersonalityTrait,
    maxTraits: number = 5
  ): Promise<PersonalityMemory> {
    const existing = await this.findByPartnerId(partnerId);
    
    if (!existing) {
      // 新規作成
      const data = type === 'strength' 
        ? { strengths: [newTrait], shadows: [] }
        : { strengths: [], shadows: [newTrait] };
      return this.upsert(partnerId, data);
    }
    
    const traits = type === 'strength' ? existing.strengths : existing.shadows;
    
    // 同じ特性が既にある場合は更新
    const existingIndex = traits.findIndex(t => t.trait === newTrait.trait);
    if (existingIndex >= 0) {
      traits[existingIndex] = {
        ...traits[existingIndex],
        importance: Math.min(10, traits[existingIndex].importance + 1),
        frequency: traits[existingIndex].frequency + 1,
        lastSeen: new Date(),
        example: newTrait.example || traits[existingIndex].example,
        context: newTrait.context || traits[existingIndex].context
      };
    } else if (traits.length < maxTraits) {
      // 空きがある場合は追加
      traits.push({
        ...newTrait,
        frequency: 1,
        lastSeen: new Date()
      });
    } else {
      // 重要度が最も低いものと入れ替え
      const lowestImportanceIndex = traits.reduce((minIdx, trait, idx, arr) => 
        trait.importance < arr[minIdx].importance ? idx : minIdx, 0
      );
      
      if (newTrait.importance > traits[lowestImportanceIndex].importance) {
        traits[lowestImportanceIndex] = {
          ...newTrait,
          frequency: 1,
          lastSeen: new Date()
        };
      }
    }
    
    // 重要度でソート
    traits.sort((a, b) => b.importance - a.importance);
    
    const updateData = type === 'strength' 
      ? { strengths: traits }
      : { shadows: traits };
    
    return this.upsert(partnerId, updateData);
  }

  /**
   * 価値観を更新
   */
  static async updateCoreValues(partnerId: ID, values: string[]): Promise<PersonalityMemory> {
    const existing = await this.findByPartnerId(partnerId);
    
    // 最大3個に制限
    const coreValues = values.slice(0, 3);
    
    return this.upsert(partnerId, { 
      ...existing,
      coreValues 
    });
  }

  /**
   * DBの行データをPersonalityMemoryに変換
   */
  private static mapRowToPersonalityMemory(row: any): PersonalityMemory {
    return {
      id: row.id,
      partnerId: row.partner_id,
      strengths: JSON.parse(row.strengths || '[]'),
      shadows: JSON.parse(row.shadows || '[]'),
      coreValues: JSON.parse(row.core_values || '[]'),
      lastUpdated: new Date(row.last_updated),
      createdAt: new Date(row.created_at)
    };
  }
}

export default PersonalityMemoryModel;