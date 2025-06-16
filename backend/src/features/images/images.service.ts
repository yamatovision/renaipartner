import axios from 'axios';
import { PartnerModel } from '@/db/models/Partner.model';
import { GeneratedImageModel } from '@/db/models/GeneratedImage.model';
import { LocationsService } from '../locations/locations.service';
import ClothingPromptsService from './clothing-prompts';
import type { 
  ImageGenerationRequest, 
  GeneratedImage, 
  BackgroundImage, 
  Partner,
  ID 
} from '@/types';
import { LEONARDO_AI_CONSTRAINTS } from './images.validator';
import { backgroundsData } from './backgrounds-data';

/**
 * 画像生成サービス - Leonardo AI連携とパートナー一貫性保持
 */
export class ImagesService {
  private leonardoApiKey: string;
  private leonardoBaseUrl: string = 'https://cloud.leonardo.ai/api/rest/v1';

  constructor() {
    this.leonardoApiKey = process.env.LEONARDO_API_KEY || '';
    if (!this.leonardoApiKey) {
      console.warn('[画像生成] Leonardo AI APIキーが設定されていません');
    } else {
      console.log('[画像生成] Leonardo AI APIキーが設定されています');
    }
  }

  /**
   * アバター画像を生成（パートナー外見保持）
   */
  async generateAvatarImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // パートナー情報を取得（外見特徴の一貫性保持）
      let partner: Partner | null = null;
      if (request.partnerId) {
        partner = await PartnerModel.findById(request.partnerId);
        if (!partner) {
          throw new Error('パートナーが見つかりません');
        }
      }

      // プロンプト構築（パートナー外見を優先）
      const finalPrompt = await this.buildAvatarPrompt(request, partner);

      // Leonardo AI API呼び出し
      const imageUrl = await this.callLeonardoAPI({
        prompt: finalPrompt,
        modelId: request.modelId || LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        width: request.width || 512,
        height: request.height || 768,
        guidanceScale: request.guidanceScale || 7,
        numImages: request.numImages || 1,
      });

      // 生成結果を保存（オンボーディング時はpartner_idなしで保存）
      const generatedImage = await GeneratedImageModel.create({
        partnerId: request.partnerId || null,
        imageUrl,
        prompt: request.prompt || 'Generated image',
        context: request.context || 'Avatar generation',
        consistencyScore: 0.8, // Default score
        modelUsed: request.modelId || LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        metadata: {
          modelId: request.modelId,
          width: request.width,
          height: request.height,
          emotion: request.emotion,
          background: request.background,
          clothing: request.clothing,
          imageType: 'avatar'
        },
      });

      return generatedImage as GeneratedImage;
    } catch (error) {
      console.error('[画像生成] アバター画像生成エラー:', error);
      throw new Error('アバター画像生成に失敗しました');
    }
  }

  /**
   * チャット用画像を生成
   */
  async generateChatImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // パートナー情報を取得
      const partner = await PartnerModel.findById(request.partnerId);
      if (!partner) {
        throw new Error('パートナーが見つかりません');
      }

      // プロンプト構築（場所連動対応）
      console.log('[画像生成] プロンプト構築開始:', {
        partnerId: request.partnerId,
        requestPrompt: request.prompt,
        context: request.context,
        emotion: request.emotion,
        background: request.background
      });
      const finalPrompt = await this.buildLocationAwareChatPrompt(request, partner);
      console.log('[画像生成] 最終プロンプト:', finalPrompt);

      // Leonardo AI API呼び出し（小サイズで高速化）
      console.log('[画像生成] API呼び出し前の確認:', {
        prompt: finalPrompt,
        hasUndefined: finalPrompt.includes('undefined'),
        promptLength: finalPrompt.length
      });
      const imageUrl = await this.callLeonardoAPI({
        prompt: finalPrompt,
        modelId: request.modelId || LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        width: 512,
        height: 768,
        guidanceScale: 5,
        numImages: 1,
      });

      // 生成結果を保存
      const generatedImage = await GeneratedImageModel.create({
        partnerId: request.partnerId,
        imageUrl,
        prompt: finalPrompt, // 実際に構築されたプロンプトを保存
        context: request.context || 'Chat image generation',
        consistencyScore: 0.8,
        modelUsed: request.modelId || LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        metadata: {
          modelId: request.modelId,
          emotion: request.emotion,
          context: request.context,
          imageType: 'chat',
          locationId: request.locationId,
          season: request.season,
          originalPrompt: request.prompt
        },
      });

      return generatedImage as GeneratedImage;
    } catch (error) {
      console.error('[画像生成] チャット画像生成エラー:', error);
      throw new Error('チャット画像生成に失敗しました');
    }
  }

  /**
   * アバター用プロンプトを構築
   */
  private async buildAvatarPrompt(request: ImageGenerationRequest, partner: Partner | null): Promise<string> {
    // promptがundefinedまたは空の場合のデフォルト値を設定
    let prompt = request.prompt || 'character portrait';

    // パートナー外見特徴を追加（パートナーがある場合）
    if (request.useAppearance && partner?.appearance) {
      const appearance = partner.appearance;
      const appearanceDetails = [
        (appearance.hairColor && appearance.hairStyle) && `${appearance.hairColor} ${appearance.hairStyle} hair`,
        (!appearance.hairColor && appearance.hairStyle) && `${appearance.hairStyle} hair`,
        appearance.eyeColor && `${appearance.eyeColor} eyes`,
        appearance.bodyType && this.mapBodyTypeToPrompt(appearance.bodyType, partner?.gender),
      ].filter(Boolean).join(', ');

      if (appearanceDetails) {
        prompt = `${prompt}, ${appearanceDetails}`;
      }
    }
    
    // オンボーディング時はリクエストから直接外見情報を取得
    if (!partner && request) {
      console.log('[画像生成] オンボーディング用外見情報:', {
        hairColor: request.hairColor,
        hairStyle: request.hairStyle,
        eyeColor: request.eyeColor,
        bodyType: request.bodyType,
        gender: request.gender
      });
      
      const appearanceDetails = [
        (request.hairColor && request.hairStyle) && `${request.hairColor} ${request.hairStyle} hair`,
        (!request.hairColor && request.hairStyle) && `${request.hairStyle} hair`,
        (request.hairColor && !request.hairStyle) && `${request.hairColor} hair`,
        request.eyeColor && `${request.eyeColor} eyes`,
        request.bodyType && this.mapBodyTypeToPrompt(request.bodyType, request.gender),
      ].filter(Boolean).join(', ');
      
      console.log('[画像生成] 構築された外見詳細:', appearanceDetails);

      if (appearanceDetails) {
        prompt = `${prompt}, ${appearanceDetails}`;
      }
    }

    // 感情表現を追加
    if (request.emotion) {
      prompt = `${prompt}, ${request.emotion} expression`;
    }

    // 背景を追加
    if (request.background) {
      prompt = `${prompt}, ${request.background} background`;
    }

    // 服装を追加
    if (request.clothing) {
      prompt = `${prompt}, wearing ${request.clothing}`;
    }

    // アニメスタイルを強調
    prompt = `anime style, ${prompt}, high quality, detailed`;
    
    console.log('[画像生成] 構築されたプロンプト:', prompt);

    return prompt;
  }

  /**
   * 場所連動チャット用プロンプトを構築
   */
  private async buildLocationAwareChatPrompt(request: ImageGenerationRequest, partner: Partner): Promise<string> {
    console.log('[画像生成] buildLocationAwareChatPrompt 開始:', {
      requestPrompt: request.prompt,
      locationId: request.locationId,
      emotion: request.emotion,
      intimacyLevel: partner.intimacyLevel,
      partnerAppearance: partner.appearance
    });
    
    // 1. 基本形 + 性別
    const genderStr = partner.gender === 'boyfriend' ? 'handsome man' : 'alluring woman';
    let prompt = `anime style ${genderStr}`;
    
    // 2. 外見特徴（髪色、髪型、目の色）
    if (partner.appearance) {
      const appearance = partner.appearance;
      const appearancePrompts: string[] = [];
      
      if (appearance.hairColor && appearance.hairStyle) {
        appearancePrompts.push(`${appearance.hairColor} ${appearance.hairStyle} hair`);
      } else if (!appearance.hairColor && appearance.hairStyle) {
        appearancePrompts.push(`${appearance.hairStyle} hair`);
      } else if (appearance.hairColor && !appearance.hairStyle) {
        appearancePrompts.push(`${appearance.hairColor} hair`);
      }
      if (appearance.eyeColor) {
        appearancePrompts.push(`${appearance.eyeColor} eyes`);
      }
      // 温泉とベッドルームの場合は体型を除外（Leonardo AIフィルター対策）
      const excludeBodyTypeLocations = ['onsen', 'bedroom_night'];
      if (appearance.bodyType && !excludeBodyTypeLocations.includes(request.locationId || '')) {
        appearancePrompts.push(this.mapBodyTypeToPrompt(appearance.bodyType, partner.gender));
      }
      
      if (appearancePrompts.length > 0) {
        prompt = `${prompt}, ${appearancePrompts.join(', ')}`;
      }
    }
    
    // 3. 性格（personality typeから抽出）
    const personalityMap: { [key: string]: string } = {
      'gentle': 'gentle',
      'cool': 'cool',
      'cheerful': 'cheerful',
      'tsundere': 'tsundere',
      'sweet': 'sweet',
      'reliable': 'reliable',
      'clingy': 'clingy',
      'genius': 'genius',
      'childhood': 'childhood friend',
      'sports': 'sporty',
      'artist': 'artistic',
      'cooking': 'cooking enthusiast',
      'mysterious': 'mysterious',
      'prince': 'princely',
      'otaku': 'otaku',
      'younger': 'younger',
      'band': 'band member',
      // 新規追加
      'imouto': 'cute little sister',
      'oneesan': 'mature older sister',
      'seiso': 'pure and innocent',
      'koakuma': 'mischievous',
      'yandere': 'yandere',
      'villain': 'villainous',
      'possessive': 'possessive',
      'sadistic': 'sadistic dominant',
      'oresama': 'arrogant confident',
      'mature': 'mature reliable'
    };
    const personalityPrompt = personalityMap[partner.personalityType] || partner.personalityType;
    prompt = `${prompt}, ${personalityPrompt} personality`;
    
    // 4. 感情表現
    if (request.emotion) {
      const emotionMap: { [key: string]: string } = {
        'happy': 'happy expression with warm expressive',
        'sad': 'sad expression with gentle melancholic',
        'excited': 'excited expression with energetic vibrant',
        'calm': 'calm expression with peaceful serene',
        'loving': 'loving expression with tender affectionate',
        'amused': 'amused expression with playful cheerful',
        'confused': 'confused expression with puzzled uncertain',
        'curious': 'curious expression with interested attentive',
        'frustrated': 'frustrated expression with troubled annoyed',
        'neutral': 'neutral expression with relaxed natural',
        'surprised': 'surprised expression with astonished wide-eyed'
      };
      const emotionPrompt = emotionMap[request.emotion] || `${request.emotion} expression`;
      prompt = `${prompt}, ${emotionPrompt}`;
    }
    
    // 5. 親密度による表現
    const intimacyLevel = partner.intimacyLevel || 0;
    if (intimacyLevel < 40) {
      prompt = `${prompt}, polite respectful gaze, formal posture`;
    } else if (intimacyLevel < 70) {
      prompt = `${prompt}, direct friendly gaze, open comfortable posture`;
    } else {
      prompt = `${prompt}, loving intimate gaze, relaxed close posture`;
    }

    // 6. 服装（場所に対応）
    if (request.locationId) {
      try {
        const location = await LocationsService.getLocationById(request.locationId);
        if (location) {
          // 季節対応服装プロンプトの生成
          const clothingPrompt = ClothingPromptsService.getPrompt({
            clothingStyle: location.clothing,
            gender: request.gender || partner.gender,
            season: request.season
          });
          
          // wearing 句として追加
          prompt = `${prompt}, wearing ${clothingPrompt.prompt}`;
          
          // 7. 場所設定
          prompt = `${prompt}, in ${request.locationId} setting`;
          
          console.log(`[画像生成] 場所連動プロンプト適用 - 場所: ${location.name}, 服装: ${location.clothing}`);
        }
      } catch (error) {
        console.error('[画像生成] 場所情報の取得に失敗:', error);
        // エラーが発生してもベース処理を継続
      }
    }
    
    // 8. 親密度による雰囲気
    if (intimacyLevel < 40) {
      prompt = `${prompt}, professional formal atmosphere`;
    } else if (intimacyLevel < 70) {
      prompt = `${prompt}, warm and trusting atmosphere`;
    } else {
      prompt = `${prompt}, intimate loving atmosphere`;
    }

    // 9. 品質指定（固定）
    prompt = `${prompt}, high quality anime artwork, consistent character design`;

    console.log('[画像生成] buildLocationAwareChatPrompt 最終プロンプト:', prompt);
    return prompt;
  }

  /**
   * チャット用プロンプトを構築（簡略化・後方互換性維持）
   */
  private async buildChatPrompt(request: ImageGenerationRequest, partner: Partner): Promise<string> {
    // 場所連動ロジックを使用
    return this.buildLocationAwareChatPrompt(request, partner);
  }

  /**
   * Leonardo AI APIを呼び出し
   */
  private async callLeonardoAPI(params: {
    prompt: string;
    modelId: string;
    width: number;
    height: number;
    guidanceScale: number;
    numImages: number;
  }): Promise<string> {
    console.log('[画像生成] Leonardo AI API呼び出し:', params);

    if (!this.leonardoApiKey) {
      console.warn('[画像生成] Leonardo AI APIキーが設定されていないため、モックURLを返します');
      return `/images/generated/mock-${Date.now()}.jpg`;
    }

    try {
      // Leonardo AI API呼び出し
      const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.leonardoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          modelId: params.modelId,
          width: params.width,
          height: params.height,
          num_images: params.numImages,
          public: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[画像生成] Leonardo AI APIエラー:', response.status, response.statusText);
        console.error('[画像生成] エラー詳細:', errorText);
        
        // エラーの詳細を解析
        try {
          const errorData = JSON.parse(errorText);
          console.error('[画像生成] エラーデータ:', JSON.stringify(errorData, null, 2));
        } catch {
          console.error('[画像生成] エラーレスポンスのパースに失敗');
        }
        
        throw new Error(`Leonardo AI API呼び出し失敗: ${response.status}`);
      }

      const result: any = await response.json();
      console.log('[画像生成] Leonardo AI API応答:', result);

      if (!result.sdGenerationJob?.generationId) {
        throw new Error('Leonardo AI APIから生成IDが返されませんでした');
      }

      // 生成完了を待機（ポーリング）
      const imageUrl = await this.waitForGeneration(result.sdGenerationJob.generationId);
      return imageUrl;

    } catch (error) {
      console.error('[画像生成] Leonardo AI API呼び出しエラー:', error);
      // エラー時は実在するプレースホルダー画像を返す
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuOCqOODqeODvOaZguOBq+WIqeeUqOS4jeWPozwvdGV4dD4KPC9zdmc+';
    }
  }

  private async waitForGeneration(generationId: string): Promise<string> {
    const maxRetries = 30; // 最大30回（約3分）
    const retryInterval = 6000; // 6秒間隔

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
          headers: {
            'Authorization': `Bearer ${this.leonardoApiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Generation status check failed: ${response.status}`);
        }

        const result: any = await response.json();
        console.log(`[画像生成] 生成状況チェック ${i + 1}/${maxRetries}:`, result.generations_by_pk?.status);

        if (result.generations_by_pk?.status === 'COMPLETE') {
          const images = result.generations_by_pk.generated_images;
          if (images && images.length > 0) {
            const imageUrl = images[0].url;
            console.log('[画像生成] 生成完了:', imageUrl);
            return imageUrl;
          }
        }

        if (result.generations_by_pk?.status === 'FAILED') {
          throw new Error('Leonardo AI画像生成が失敗しました');
        }

        // 待機
        await new Promise(resolve => setTimeout(resolve, retryInterval));

      } catch (error) {
        console.error(`[画像生成] 生成状況チェックエラー (${i + 1}/${maxRetries}):`, error);
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }

    throw new Error('Leonardo AI画像生成がタイムアウトしました');
  }

  /**
   * 背景画像一覧を取得（実際のファイルパスに基づく）
   */
  async getBackgroundImages(category?: string, limit: number = 40): Promise<BackgroundImage[]> {
    // backgroundsDataから背景画像を取得
    let filteredBackgrounds = backgroundsData;
    
    if (category) {
      filteredBackgrounds = backgroundsData.filter(bg => bg.category === category);
    }

    return filteredBackgrounds.slice(0, limit);
  }

  /**
   * 画像生成履歴を取得
   */
  async getImageHistory(
    partnerId: ID, 
    limit: number = 20, 
    imageType?: 'avatar' | 'chat'
  ): Promise<GeneratedImage[]> {
    const query: any = { partnerId };
    
    if (imageType) {
      query.imageType = imageType;
    }

    // PostgreSQL用のクエリに変更
    const images = await GeneratedImageModel.getByPartnerId(partnerId, limit);

    return images.map(img => img as GeneratedImage);
  }

  /**
   * 画像生成統計を取得
   */
  async getImageStats(partnerId: ID): Promise<{
    totalGenerated: number;
    avatarCount: number;
    chatCount: number;
    lastGenerated?: Date;
    mostUsedEmotion?: string;
  }> {
    const images = await GeneratedImageModel.getByPartnerId(partnerId);

    const stats = {
      totalGenerated: images.length,
      avatarCount: images.filter(img => img.metadata?.imageType === 'avatar').length,
      chatCount: images.filter(img => img.metadata?.imageType === 'chat').length,
      lastGenerated: images.length > 0 ? images[0].createdAt : undefined,
      mostUsedEmotion: this.getMostUsedEmotion(images),
    };

    return stats;
  }

  /**
   * 最も使用された感情を取得
   */
  private getMostUsedEmotion(images: any[]): string | undefined {
    const emotionCounts: Record<string, number> = {};
    
    images.forEach(img => {
      if (img.metadata?.emotion) {
        emotionCounts[img.metadata.emotion] = (emotionCounts[img.metadata.emotion] || 0) + 1;
      }
    });

    const sortedEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a);

    return sortedEmotions.length > 0 ? sortedEmotions[0][0] : undefined;
  }

  /**
   * 画像を削除
   */
  async deleteImage(imageId: ID, userId: ID): Promise<void> {
    const image = await GeneratedImageModel.findByPk(imageId);
    
    if (!image) {
      throw new Error('画像が見つかりません');
    }

    // パートナーの所有者確認
    const partner = await PartnerModel.findById(image.partnerId);
    if (!partner || partner.userId.toString() !== userId.toString()) {
      throw new Error('この画像を削除する権限がありません');
    }

    await GeneratedImageModel.destroy(imageId);
  }

  /**
   * 体型を適切な英語表現にマッピング
   */
  private mapBodyTypeToPrompt(bodyType: string, gender?: string): string {
    const bodyTypeMap: { [key: string]: string } = {
      // 共通
      'normal': 'average proportioned body',
      // 性別に応じた athletic の表現
      'athletic': gender === 'boyfriend' ? 'athletic muscular body' : 'slim athletic body',
      // 女性用
      'curvy': 'curvy body',
      // 男性用
      'lean': 'lean slender body',
      // 旧形式対応（互換性のため）
      'slim': 'slim athletic body',
      'average': 'average proportioned body'
    };
    
    const result = bodyTypeMap[bodyType] || `${bodyType} body`;
    console.log(`[画像生成] 体型マッピング: ${bodyType} (${gender}) -> ${result}`);
    
    return result;
  }

  /**
   * オンボーディング用画像生成（DBに保存しない）
   */
  async generateOnboardingImage(request: ImageGenerationRequest): Promise<{ imageUrl: string }> {
    try {
      console.log('[画像生成] オンボーディング画像生成開始');
      
      // プロンプト構築（パートナー情報なし）
      const finalPrompt = await this.buildAvatarPrompt(request, null);

      // Leonardo AI API呼び出し
      const imageUrl = await this.callLeonardoAPI({
        prompt: finalPrompt,
        modelId: request.modelId || LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        width: request.width || 512,
        height: request.height || 768,
        guidanceScale: request.guidanceScale || 7,
        numImages: request.numImages || 1,
      });

      console.log('[画像生成] オンボーディング画像生成完了:', imageUrl);
      
      // DBに保存せず、URLのみ返却
      return { imageUrl };
    } catch (error) {
      console.error('[画像生成] オンボーディング画像生成エラー:', error);
      throw new Error('オンボーディング画像生成に失敗しました');
    }
  }

  /**
   * 利用可能なモデル一覧を取得
   */
  async getAvailableModels(): Promise<{
    id: string;
    name: string;
    description: string;
    recommended: boolean;
  }[]> {
    return [
      {
        id: LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        name: 'Anime Style XL',
        description: '高品質なアニメスタイル画像生成に最適',
        recommended: true,
      },
      {
        id: 'anime-v2',
        name: 'Anime Style v2',
        description: '標準的なアニメスタイル画像生成',
        recommended: false,
      },
      {
        id: 'realistic-v1',
        name: 'Realistic Style',
        description: 'リアルな人物画像生成',
        recommended: false,
      },
    ];
  }
}