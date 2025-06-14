import { PartnerModel } from '@/db/models/Partner.model';
import { UserModel } from '@/db/models';
import { 
  Partner, 
  PartnerCreate, 
  PartnerUpdate, 
  ID,
  PersonalityType,
  PERSONALITY_PRESETS
} from '@/types';
import { ENV_CONFIG } from '@/config/env.config';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  ServiceError 
} from '@/common/middlewares/error.middleware';
import { validatePromptContent } from './partners.validator';
// import OpenAI from 'openai'; // TODO: openaiパッケージ追加後にアンコメント

export class PartnersService {
  // private static openai = new OpenAI({
  //   apiKey: ENV_CONFIG.OPENAI_API_KEY,
  // }); // TODO: openaiパッケージ追加後にアンコメント

  // パートナー作成
  static async createPartner(userId: ID, partnerData: Omit<PartnerCreate, 'userId'>): Promise<Partner> {
    console.log(`[PARTNERS] パートナー作成開始: userId=${userId}, name=${partnerData.name}`);
    
    try {
      // ユーザーの存在確認
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('ユーザー');
      }
      
      // 既存パートナーの確認（1ユーザー1パートナー制約）
      const existingPartner = await PartnerModel.findByUserId(userId);
      if (existingPartner) {
        throw new ConflictError('既にパートナーが作成されています。既存のパートナーを編集してください。');
      }
      
      // システムプロンプトの内容検証
      const promptValidation = validatePromptContent(partnerData.systemPrompt);
      if (!promptValidation.isValid) {
        throw new ValidationError('システムプロンプトに問題があります', 
          promptValidation.warnings.map(warning => ({ field: 'systemPrompt', message: warning }))
        );
      }
      
      // パートナー作成データの準備
      const createData: PartnerCreate = {
        userId,
        ...partnerData
      };
      
      // パートナー作成
      const partner = await PartnerModel.create(createData);
      
      console.log(`[PARTNERS] パートナー作成成功: partnerId=${partner.id}, name=${partner.name}`);
      return partner;
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      
      console.error('[PARTNERS] パートナー作成エラー:', error);
      throw new ServiceError('パートナーの作成中にエラーが発生しました');
    }
  }

  // ユーザーのパートナー取得
  static async getPartnerByUserId(userId: ID): Promise<Partner | null> {
    console.log(`[PARTNERS] パートナー取得: userId=${userId}`);
    
    try {
      const partner = await PartnerModel.findByUserId(userId);
      
      if (partner) {
        console.log(`[PARTNERS] パートナー取得成功: partnerId=${partner.id}, name=${partner.name}`);
      } else {
        console.log(`[PARTNERS] パートナーが見つからない: userId=${userId}`);
      }
      
      return partner;
      
    } catch (error) {
      console.error('[PARTNERS] パートナー取得エラー:', error);
      throw new ServiceError('パートナーの取得中にエラーが発生しました');
    }
  }

  // パートナー詳細取得
  static async getPartnerById(partnerId: ID, userId: ID): Promise<Partner> {
    console.log(`[PARTNERS] パートナー詳細取得: partnerId=${partnerId}, userId=${userId}`);
    
    try {
      const partner = await PartnerModel.findById(partnerId);
      
      if (!partner) {
        throw new NotFoundError('パートナー');
      }
      
      // 所有権確認
      if (partner.userId !== userId) {
        throw new ValidationError('このパートナーにアクセスする権限がありません');
      }
      
      console.log(`[PARTNERS] パートナー詳細取得成功: partnerId=${partnerId}, name=${partner.name}`);
      return partner;
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      console.error('[PARTNERS] パートナー詳細取得エラー:', error);
      throw new ServiceError('パートナーの取得中にエラーが発生しました');
    }
  }

  // パートナー更新
  static async updatePartner(partnerId: ID, userId: ID, updateData: PartnerUpdate): Promise<Partner> {
    console.log(`[PARTNERS] パートナー更新開始: partnerId=${partnerId}, userId=${userId}`);
    
    try {
      // パートナーの存在確認と所有権チェック
      const existingPartner = await this.getPartnerById(partnerId, userId);
      
      // システムプロンプトが更新される場合は内容検証
      if (updateData.systemPrompt) {
        const promptValidation = validatePromptContent(updateData.systemPrompt);
        if (!promptValidation.isValid) {
          throw new ValidationError('システムプロンプトに問題があります', 
            promptValidation.warnings.map(warning => ({ field: 'systemPrompt', message: warning }))
          );
        }
      }
      
      // パートナー更新
      const updatedPartner = await PartnerModel.update(partnerId, updateData);
      
      if (!updatedPartner) {
        throw new ServiceError('パートナーの更新に失敗しました');
      }
      
      console.log(`[PARTNERS] パートナー更新成功: partnerId=${partnerId}, name=${updatedPartner.name}`);
      return updatedPartner;
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      
      console.error('[PARTNERS] パートナー更新エラー:', error);
      throw new ServiceError('パートナーの更新中にエラーが発生しました');
    }
  }

  // パートナー削除
  static async deletePartner(partnerId: ID, userId: ID): Promise<void> {
    console.log(`[PARTNERS] パートナー削除開始: partnerId=${partnerId}, userId=${userId}`);
    
    try {
      // パートナーの存在確認と所有権チェック
      await this.getPartnerById(partnerId, userId);
      
      // パートナー削除
      const success = await PartnerModel.delete(partnerId);
      
      if (!success) {
        throw new ServiceError('パートナーの削除に失敗しました');
      }
      
      console.log(`[PARTNERS] パートナー削除成功: partnerId=${partnerId}`);
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      
      console.error('[PARTNERS] パートナー削除エラー:', error);
      throw new ServiceError('パートナーの削除中にエラーが発生しました');
    }
  }

  // システムプロンプト検証
  static async validatePrompt(systemPrompt: string): Promise<{ isValid: boolean; warnings: string[] }> {
    console.log('[PARTNERS] システムプロンプト検証開始');
    
    try {
      // 基本的な内容検証
      const basicValidation = validatePromptContent(systemPrompt);
      
      // OpenAI APIを使った高度な検証（オプション）
      if (ENV_CONFIG.OPENAI_API_KEY && basicValidation.isValid) {
        try {
          // const moderationResponse = await this.openai.moderations.create({
          //   input: systemPrompt,
          // }); // TODO: openaiパッケージ追加後にアンコメント
          const moderationResponse = { results: [{ flagged: false, categories: {} }] }; // 仮実装
          
          const moderation = moderationResponse.results[0];
          if (moderation.flagged) {
            const flaggedCategories = Object.entries(moderation.categories || {})
              .filter(([_, flagged]) => flagged)
              .map(([category, _]) => category);
            
            basicValidation.warnings.push(
              `不適切なコンテンツが検出されました: ${flaggedCategories.join(', ')}`
            );
            basicValidation.isValid = false;
          }
        } catch (error) {
          console.warn('[PARTNERS] OpenAI Moderation API エラー（基本検証を継続）:', error);
        }
      }
      
      console.log(`[PARTNERS] プロンプト検証完了: isValid=${basicValidation.isValid}, warnings=${basicValidation.warnings.length}`);
      return basicValidation;
      
    } catch (error) {
      console.error('[PARTNERS] プロンプト検証エラー:', error);
      return {
        isValid: false,
        warnings: ['プロンプトの検証中にエラーが発生しました']
      };
    }
  }

  // システムプロンプトプレビュー
  static async previewPrompt(systemPrompt: string, testMessage: string = 'こんにちは'): Promise<string> {
    console.log('[PARTNERS] システムプロンプトプレビュー開始');
    
    try {
      if (!ENV_CONFIG.OPENAI_API_KEY) {
        throw new ServiceError('OpenAI APIキーが設定されていません');
      }
      
      // プロンプト検証
      const validation = await this.validatePrompt(systemPrompt);
      if (!validation.isValid) {
        throw new ValidationError('システムプロンプトに問題があります', 
          validation.warnings.map(warning => ({ field: 'systemPrompt', message: warning }))
        );
      }
      
      // OpenAI APIでプレビュー生成
      // const completion = await this.openai.chat.completions.create({ // TODO: openaiパッケージ追加後にアンコメント
      const completion = { choices: [{ message: { content: 'サンプルプレビュー' } }] }; // 仮実装
      /*
        model: ENV_CONFIG.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: testMessage }
        ],
        max_tokens: 200,
        temperature: ENV_CONFIG.OPENAI_TEMPERATURE,
      }); */
      
      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new ServiceError('プレビューの生成に失敗しました');
      }
      
      console.log('[PARTNERS] プロンプトプレビュー生成成功');
      return response;
      
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      
      console.error('[PARTNERS] プロンプトプレビューエラー:', error);
      throw new ServiceError('プロンプトプレビューの生成中にエラーが発生しました');
    }
  }

  // プリセット適用
  static async applyPreset(partnerId: ID, userId: ID, presetType: PersonalityType): Promise<Partner> {
    console.log(`[PARTNERS] プリセット適用開始: partnerId=${partnerId}, presetType=${presetType}`);
    
    try {
      // プリセット取得
      const preset = PERSONALITY_PRESETS[presetType];
      if (!preset) {
        throw new ValidationError('無効なプリセットタイプです');
      }
      
      // パートナー更新
      const updateData: PartnerUpdate = {
        personalityType: preset.personality,
        speechStyle: preset.speechStyle,
        systemPrompt: preset.systemPrompt
      };
      
      const updatedPartner = await this.updatePartner(partnerId, userId, updateData);
      
      console.log(`[PARTNERS] プリセット適用成功: partnerId=${partnerId}, preset=${presetType}`);
      return updatedPartner;
      
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ServiceError) {
        throw error;
      }
      
      console.error('[PARTNERS] プリセット適用エラー:', error);
      throw new ServiceError('プリセットの適用中にエラーが発生しました');
    }
  }

  // 親密度更新
  static async updateIntimacyLevel(partnerId: ID, userId: ID, intimacyChange: number): Promise<void> {
    console.log(`[PARTNERS] 親密度更新: partnerId=${partnerId}, change=${intimacyChange}`);
    
    try {
      // パートナーの存在確認と所有権チェック
      const partner = await this.getPartnerById(partnerId, userId);
      
      // 新しい親密度計算（0-100の範囲でクランプ）
      const newIntimacyLevel = Math.max(0, Math.min(100, partner.intimacyLevel + intimacyChange));
      
      // 親密度更新
      const success = await PartnerModel.updateIntimacyLevel(partnerId, newIntimacyLevel);
      
      if (!success) {
        throw new ServiceError('親密度の更新に失敗しました');
      }
      
      console.log(`[PARTNERS] 親密度更新成功: partnerId=${partnerId}, 前=${partner.intimacyLevel} → 後=${newIntimacyLevel}`);
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      
      console.error('[PARTNERS] 親密度更新エラー:', error);
      throw new ServiceError('親密度の更新中にエラーが発生しました');
    }
  }

  // 画像URL更新
  static async updatePartnerImage(partnerId: ID, userId: ID, imageUrl: string): Promise<void> {
    console.log(`[PARTNERS] パートナー画像更新: partnerId=${partnerId}`);
    
    try {
      // パートナーの存在確認と所有権チェック
      await this.getPartnerById(partnerId, userId);
      
      // 画像URL更新
      const success = await PartnerModel.updateBaseImageUrl(partnerId, imageUrl);
      
      if (!success) {
        throw new ServiceError('画像URLの更新に失敗しました');
      }
      
      console.log(`[PARTNERS] パートナー画像更新成功: partnerId=${partnerId}`);
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      
      console.error('[PARTNERS] パートナー画像更新エラー:', error);
      throw new ServiceError('画像URLの更新中にエラーが発生しました');
    }
  }

  // パートナー統計取得（管理者用）
  static async getPartnerStats(): Promise<{
    totalPartners: number;
    averageIntimacyLevel: number;
    personalityDistribution: Record<PersonalityType, number>;
    recentCreations: number;
  }> {
    console.log('[PARTNERS] パートナー統計取得開始');
    
    try {
      const stats = await PartnerModel.getStats();
      
      // 最近の作成数計算（過去7日間）
      // 現在は基本統計のみ実装、後でクエリを拡張予定
      const recentCreations = 0;
      
      console.log(`[PARTNERS] パートナー統計取得成功: total=${stats.totalPartners}`);
      
      return {
        ...stats,
        recentCreations
      };
      
    } catch (error) {
      console.error('[PARTNERS] パートナー統計取得エラー:', error);
      throw new ServiceError('パートナー統計の取得中にエラーが発生しました');
    }
  }

  // パートナー存在チェック
  static async hasPartner(userId: ID): Promise<boolean> {
    try {
      return await PartnerModel.hasPartner(userId);
    } catch (error) {
      console.error('[PARTNERS] パートナー存在チェックエラー:', error);
      return false;
    }
  }
}