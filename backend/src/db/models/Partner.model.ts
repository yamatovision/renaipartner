import { pool } from '@/config/database.config';
import { 
  Partner, 
  PartnerCreate, 
  PartnerUpdate, 
  Gender, 
  PersonalityType, 
  SpeechStyle, 
  AppearanceSettings,
  ID 
} from '@/types';

class PartnerModel {
  // パートナー作成
  static async create(partnerData: PartnerCreate): Promise<Partner> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO partners (
          user_id, name, gender, personality_type, speech_style, 
          system_prompt, avatar_description, hair_style, hair_color, eye_color, 
          body_type, clothing_style, generated_image_url, hobbies, 
          intimacy_level, base_image_url, current_location_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, user_id, name, gender, personality_type, speech_style,
                  system_prompt, avatar_description, hair_style, hair_color, eye_color,
                  body_type, clothing_style, generated_image_url, hobbies,
                  intimacy_level, base_image_url, current_location_id, created_at, updated_at
      `;
      
      const values = [
        partnerData.userId,
        partnerData.name,
        partnerData.gender,
        partnerData.personalityType,
        partnerData.speechStyle,
        partnerData.systemPrompt,
        partnerData.avatarDescription,
        partnerData.appearance.hairStyle,
        partnerData.appearance.hairColor || null, // 髪色を追加
        partnerData.appearance.eyeColor,
        partnerData.appearance.bodyType,
        partnerData.appearance.clothingStyle,
        partnerData.appearance.generatedImageUrl || null,
        JSON.stringify(partnerData.hobbies),
        partnerData.intimacyLevel || 0,
        null, // base_image_url は後で設定
        partnerData.currentLocationId || 'school_classroom' // デフォルトは教室
      ];
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('パートナーの作成に失敗しました');
      }
      
      return this.mapDbRowToPartner(result.rows[0]);
      
    } catch (error) {
      if ((error as any).code === '23505') { // 重複エラー
        throw new Error('このユーザーは既にパートナーを作成済みです');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // ユーザーIDでパートナー検索（1ユーザー1パートナー）
  static async findByUserId(userId: ID): Promise<Partner | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, name, gender, personality_type, speech_style,
               system_prompt, avatar_description, hair_style, hair_color, eye_color,
               body_type, clothing_style, generated_image_url, hobbies,
               intimacy_level, base_image_url, current_location_id, created_at, updated_at
        FROM partners 
        WHERE user_id = $1
      `;
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToPartner(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // IDでパートナー検索
  static async findById(id: ID): Promise<Partner | null> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, name, gender, personality_type, speech_style,
               system_prompt, avatar_description, hair_style, hair_color, eye_color,
               body_type, clothing_style, generated_image_url, hobbies,
               intimacy_level, base_image_url, current_location_id, created_at, updated_at
        FROM partners 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToPartner(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // パートナー情報更新
  static async update(id: ID, updateData: PartnerUpdate): Promise<Partner | null> {
    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updateData.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(updateData.name);
        paramIndex++;
      }
      
      if (updateData.personalityType !== undefined) {
        updateFields.push(`personality_type = $${paramIndex}`);
        values.push(updateData.personalityType);
        paramIndex++;
      }
      
      if (updateData.speechStyle !== undefined) {
        updateFields.push(`speech_style = $${paramIndex}`);
        values.push(updateData.speechStyle);
        paramIndex++;
      }
      
      if (updateData.systemPrompt !== undefined) {
        updateFields.push(`system_prompt = $${paramIndex}`);
        values.push(updateData.systemPrompt);
        paramIndex++;
      }
      
      if (updateData.avatarDescription !== undefined) {
        updateFields.push(`avatar_description = $${paramIndex}`);
        values.push(updateData.avatarDescription);
        paramIndex++;
      }
      
      if (updateData.appearance) {
        if (updateData.appearance.hairStyle !== undefined) {
          updateFields.push(`hair_style = $${paramIndex}`);
          values.push(updateData.appearance.hairStyle);
          paramIndex++;
        }
        
        if (updateData.appearance.hairColor !== undefined) {
          updateFields.push(`hair_color = $${paramIndex}`);
          values.push(updateData.appearance.hairColor);
          paramIndex++;
        }
        
        if (updateData.appearance.eyeColor !== undefined) {
          updateFields.push(`eye_color = $${paramIndex}`);
          values.push(updateData.appearance.eyeColor);
          paramIndex++;
        }
        
        if (updateData.appearance.bodyType !== undefined) {
          updateFields.push(`body_type = $${paramIndex}`);
          values.push(updateData.appearance.bodyType);
          paramIndex++;
        }
        
        if (updateData.appearance.clothingStyle !== undefined) {
          updateFields.push(`clothing_style = $${paramIndex}`);
          values.push(updateData.appearance.clothingStyle);
          paramIndex++;
        }
        
        if (updateData.appearance.generatedImageUrl !== undefined) {
          updateFields.push(`generated_image_url = $${paramIndex}`);
          values.push(updateData.appearance.generatedImageUrl);
          paramIndex++;
        }
      }
      
      if (updateData.hobbies !== undefined) {
        updateFields.push(`hobbies = $${paramIndex}`);
        values.push(JSON.stringify(updateData.hobbies));
        paramIndex++;
      }
      
      if (updateData.currentLocationId !== undefined) {
        updateFields.push(`current_location_id = $${paramIndex}`);
        values.push(updateData.currentLocationId);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        // 更新する項目がない場合は現在のパートナー情報を返す
        return this.findById(id);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE partners 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, user_id, name, gender, personality_type, speech_style,
                  system_prompt, avatar_description, hair_style, hair_color, eye_color,
                  body_type, clothing_style, generated_image_url, hobbies,
                  intimacy_level, base_image_url, current_location_id, created_at, updated_at
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToPartner(result.rows[0]);
      
    } finally {
      client.release();
    }
  }

  // 親密度更新
  static async updateIntimacyLevel(id: ID, intimacyLevel: number): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // 親密度は0-100の範囲でクランプ
      const clampedLevel = Math.max(0, Math.min(100, intimacyLevel));
      
      const query = `
        UPDATE partners 
        SET intimacy_level = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      const result = await client.query(query, [clampedLevel, id]);
      
      return result.rowCount === 1;
      
    } finally {
      client.release();
    }
  }

  // ベース画像URL更新
  static async updateBaseImageUrl(id: ID, imageUrl: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE partners 
        SET base_image_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      const result = await client.query(query, [imageUrl, id]);
      
      return result.rowCount === 1;
      
    } finally {
      client.release();
    }
  }

  // 生成画像URL更新
  static async updateGeneratedImageUrl(id: ID, imageUrl: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE partners 
        SET generated_image_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      const result = await client.query(query, [imageUrl, id]);
      
      return result.rowCount === 1;
      
    } finally {
      client.release();
    }
  }

  // 現在地更新
  static async updateCurrentLocation(id: ID, locationId: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE partners 
        SET current_location_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      const result = await client.query(query, [locationId, id]);
      
      return result.rowCount === 1;
      
    } finally {
      client.release();
    }
  }

  // パートナー削除
  static async delete(id: ID): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = 'DELETE FROM partners WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rowCount === 1;
      
    } finally {
      client.release();
    }
  }

  // ユーザーが既にパートナーを持っているかチェック
  static async hasPartner(userId: ID): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const query = 'SELECT COUNT(*) as count FROM partners WHERE user_id = $1';
      const result = await client.query(query, [userId]);
      
      return parseInt(result.rows[0].count, 10) > 0;
      
    } finally {
      client.release();
    }
  }

  // パートナー統計情報取得（管理者用）
  static async getStats(): Promise<{
    totalPartners: number;
    averageIntimacyLevel: number;
    personalityDistribution: Record<PersonalityType, number>;
    genderDistribution: Record<Gender, number>;
  }> {
    const client = await pool.connect();
    
    try {
      // 基本統計
      const basicStatsQuery = `
        SELECT 
          COUNT(*) as total_partners,
          AVG(intimacy_level) as average_intimacy
        FROM partners
      `;
      
      const basicResult = await client.query(basicStatsQuery);
      const basicRow = basicResult.rows[0];
      
      // 性格分布
      const personalityQuery = `
        SELECT personality_type, COUNT(*) as count
        FROM partners 
        GROUP BY personality_type
      `;
      
      const personalityResult = await client.query(personalityQuery);
      const personalityDistribution: Record<PersonalityType, number> = {} as any;
      
      personalityResult.rows.forEach(row => {
        personalityDistribution[row.personality_type as PersonalityType] = parseInt(row.count, 10);
      });
      
      // 性別分布
      const genderQuery = `
        SELECT gender, COUNT(*) as count
        FROM partners 
        GROUP BY gender
      `;
      
      const genderResult = await client.query(genderQuery);
      const genderDistribution: Record<Gender, number> = {} as any;
      
      genderResult.rows.forEach(row => {
        genderDistribution[row.gender as Gender] = parseInt(row.count, 10);
      });
      
      return {
        totalPartners: parseInt(basicRow.total_partners, 10),
        averageIntimacyLevel: parseFloat(basicRow.average_intimacy) || 0,
        personalityDistribution,
        genderDistribution
      };
      
    } finally {
      client.release();
    }
  }

  // DBの行データをPartnerオブジェクトにマッピング
  private static mapDbRowToPartner(row: any): Partner {
    const appearance: AppearanceSettings = {
      hairStyle: row.hair_style,
      hairColor: row.hair_color, // 髪色を追加
      eyeColor: row.eye_color,
      bodyType: row.body_type,
      clothingStyle: row.clothing_style,
      generatedImageUrl: row.generated_image_url
    };
    
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      gender: row.gender as Gender,
      personalityType: row.personality_type as PersonalityType,
      personality: row.personality_type as PersonalityType, // テスト互換性のためのエイリアス
      speechStyle: row.speech_style as SpeechStyle,
      systemPrompt: row.system_prompt,
      avatarDescription: row.avatar_description,
      appearance,
      hobbies: Array.isArray(row.hobbies) ? row.hobbies : JSON.parse(row.hobbies || '[]'),
      intimacyLevel: row.intimacy_level,
      baseImageUrl: row.base_image_url,
      currentLocationId: row.current_location_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// エクスポート
export { PartnerModel };
export default PartnerModel;