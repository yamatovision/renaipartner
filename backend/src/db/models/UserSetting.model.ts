import { pool } from '@/config/database.config';
import { UserSettings, ID } from '@/types';

class UserSettingModel {
  // デフォルト設定の作成
  static async createDefaultSettings(userId: ID): Promise<UserSettings> {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO user_settings (
          user_id, theme, background_image, sound_enabled, auto_save, data_retention_days, ai_model
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id, user_id, theme, background_image, sound_enabled, 
                  auto_save, data_retention_days, ai_model, created_at, updated_at
      `;
      
      const defaultAiModel = { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.8, maxTokens: 2000 };
      const values = [userId, 'light', 'default', true, true, 365, JSON.stringify(defaultAiModel)];
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        // 既に存在する場合は取得
        const existingQuery = `
          SELECT id, user_id, theme, background_image, sound_enabled,
                 auto_save, data_retention_days, ai_model, created_at, updated_at
          FROM user_settings
          WHERE user_id = $1
        `;
        const existing = await client.query(existingQuery, [userId]);
        return this.mapDbRowToUserSettings(existing.rows[0]);
      }
      
      return this.mapDbRowToUserSettings(result.rows[0]);
      
    } catch (error) {
      console.error('[UserSetting] デフォルト設定作成エラー:', error);
      throw new Error('ユーザー設定の作成に失敗しました');
    } finally {
      client.release();
    }
  }

  // ユーザー設定を取得（存在しない場合はデフォルト作成）
  static async getOrCreateUserSettings(userId: ID): Promise<UserSettings> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT id, user_id, theme, background_image, sound_enabled,
               auto_save, data_retention_days, ai_model, created_at, updated_at
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return await this.createDefaultSettings(userId);
      }
      
      return this.mapDbRowToUserSettings(result.rows[0]);
      
    } catch (error) {
      console.error('[UserSetting] 設定取得エラー:', error);
      throw new Error('ユーザー設定の取得に失敗しました');
    } finally {
      client.release();
    }
  }

  // ユーザー設定を更新
  static async updateSettings(userId: ID, updates: Partial<UserSettings>): Promise<UserSettings> {
    const client = await pool.connect();
    
    try {
      const allowedFields = ['theme', 'backgroundImage', 'soundEnabled', 'autoSave', 'dataRetentionDays', 'aiModel'];
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // 許可されたフィールドのみ更新
      Object.entries(updates).forEach(([key, value]) => {
        if (allowedFields.includes(key)) {
          const dbColumn = this.camelToSnake(key);
          updateFields.push(`${dbColumn} = $${valueIndex}`);
          // aiModelの場合はJSONとして保存
          if (key === 'aiModel') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
          valueIndex++;
        }
      });

      if (updateFields.length === 0) {
        // 更新対象がない場合は現在の設定を返す
        return await this.getOrCreateUserSettings(userId);
      }

      values.push(userId); // WHERE句用
      
      const query = `
        UPDATE user_settings
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${valueIndex}
        RETURNING id, user_id, theme, background_image, sound_enabled,
                  auto_save, data_retention_days, created_at, updated_at
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('ユーザー設定が見つかりません');
      }
      
      console.log(`[UserSetting] ユーザー ${userId} の設定を更新:`, updates);
      return this.mapDbRowToUserSettings(result.rows[0]);
      
    } catch (error) {
      console.error('[UserSetting] 設定更新エラー:', error);
      throw new Error('ユーザー設定の更新に失敗しました');
    } finally {
      client.release();
    }
  }

  // 設定統計情報を取得
  static async getSettingsStats(): Promise<{
    totalUsers: number;
    themeStats: Array<{ theme: string; count: number }>;
    soundEnabledCount: number;
    autoSaveEnabledCount: number;
    averageRetentionDays: number;
  }> {
    const client = await pool.connect();
    
    try {
      // 全体統計
      const statsQuery = `
        SELECT 
          COUNT(*)::integer as total_users,
          COUNT(CASE WHEN sound_enabled = true THEN 1 END)::integer as sound_enabled_count,
          COUNT(CASE WHEN auto_save = true THEN 1 END)::integer as auto_save_enabled_count,
          COALESCE(AVG(data_retention_days)::integer, 365) as average_retention_days
        FROM user_settings
      `;
      
      const statsResult = await client.query(statsQuery);
      const stats = statsResult.rows[0];
      
      // テーマ別統計
      const themeQuery = `
        SELECT theme, COUNT(*)::integer as count
        FROM user_settings
        GROUP BY theme
        ORDER BY count DESC
      `;
      
      const themeResult = await client.query(themeQuery);
      
      return {
        totalUsers: stats.total_users,
        themeStats: themeResult.rows,
        soundEnabledCount: stats.sound_enabled_count,
        autoSaveEnabledCount: stats.auto_save_enabled_count,
        averageRetentionDays: stats.average_retention_days,
      };
      
    } catch (error) {
      console.error('[UserSetting] 統計情報取得エラー:', error);
      throw new Error('設定統計の取得に失敗しました');
    } finally {
      client.release();
    }
  }

  // データ保持期間が過ぎたユーザーを取得
  static async getUsersWithExpiredData(): Promise<Array<{ userId: ID; retentionDays: number }>> {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT user_id, data_retention_days
        FROM user_settings
        WHERE data_retention_days < 9999
      `;
      
      const result = await client.query(query);
      
      return result.rows.map(row => ({
        userId: row.user_id,
        retentionDays: row.data_retention_days,
      }));
      
    } catch (error) {
      console.error('[UserSetting] 期限切れユーザー取得エラー:', error);
      throw new Error('期限切れユーザーの取得に失敗しました');
    } finally {
      client.release();
    }
  }

  // テーマ設定の検証
  static validateTheme(theme: string): boolean {
    const validThemes = ['light', 'dark', 'auto'];
    return validThemes.includes(theme);
  }

  // データ保持期間の検証
  static validateRetentionDays(days: number): boolean {
    return days >= 30 && days <= 9999;
  }

  // DBレコードをUserSettings型にマッピング
  private static mapDbRowToUserSettings(row: any): UserSettings {
    let aiModel;
    try {
      if (row.ai_model) {
        // 既にオブジェクトの場合はそのまま使用、文字列の場合はパース
        if (typeof row.ai_model === 'string') {
          aiModel = JSON.parse(row.ai_model);
        } else if (typeof row.ai_model === 'object') {
          aiModel = row.ai_model;
        } else {
          aiModel = undefined;
        }
      } else {
        aiModel = undefined;
      }
    } catch (error) {
      console.error('[UserSetting] aiModel JSON parse error:', error);
      console.error('[UserSetting] Problematic ai_model value:', row.ai_model);
      aiModel = undefined;
    }

    return {
      id: row.id,
      userId: row.user_id,
      theme: row.theme,
      backgroundImage: row.background_image,
      soundEnabled: row.sound_enabled,
      autoSave: row.auto_save,
      dataRetentionDays: row.data_retention_days,
      aiModel: aiModel,
    };
  }

  // キャメルケースをスネークケースに変換
  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export { UserSettingModel };
export default UserSettingModel;