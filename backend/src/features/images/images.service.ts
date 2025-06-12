import axios from 'axios';
import { PartnerModel } from '@/db/models/Partner.model';
import { GeneratedImageModel } from '@/db/models/GeneratedImage.model';
import type { 
  ImageGenerationRequest, 
  GeneratedImage, 
  BackgroundImage, 
  Partner,
  ID 
} from '@/types';
import { LEONARDO_AI_CONSTRAINTS } from './images.validator';

/**
 * 画像生成サービス - Leonardo AI連携とパートナー一貫性保持
 */
export class ImagesService {
  private leonardoApiKey: string;
  private leonardoBaseUrl: string = 'https://cloud.leonardo.ai/api/rest/v1';

  constructor() {
    this.leonardoApiKey = process.env.LEONARDO_API_KEY || '';
    if (!this.leonardoApiKey) {
      console.warn('⚠️ LEONARDO_API_KEY環境変数が設定されていません。画像生成機能は利用できません。');
    }
  }

  /**
   * アバター画像を生成
   */
  async generateAvatarImage(request: any): Promise<GeneratedImage> {
    try {
      let partner: Partner | null = null;
      let enhancedPrompt: string;

      // オンボーディング時（partnerIdがnull）の場合
      if (!request.partnerId) {
        // プロンプトをそのまま使用
        enhancedPrompt = request.prompt || '';
        console.log('[画像生成] オンボーディングモード - プロンプトをそのまま使用');
      } else {
        // 通常の場合：パートナー情報を取得
        partner = await PartnerModel.findById(request.partnerId);
        if (!partner) {
          throw new Error('パートナーが見つかりません');
        }
        // 一貫性を保つためのプロンプト生成
        enhancedPrompt = await this.buildConsistentPrompt(partner, request);
      }

      // 実データ主義：常に実際のLeonardo AI APIを呼び出す
      console.log(`[画像生成] Leonardo AI API呼び出し開始 - Model: ${LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL}`);
      const leonardoResponse = await this.callLeonardoAPI({
        prompt: enhancedPrompt,
        modelId: LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        width: request.width || LEONARDO_AI_CONSTRAINTS.IMAGE_DIMENSIONS.DEFAULTS.WIDTH,
        height: request.height || LEONARDO_AI_CONSTRAINTS.IMAGE_DIMENSIONS.DEFAULTS.HEIGHT,
        num_images: request.numImages || 1,
        guidance_scale: Math.round(request.guidanceScale || 8),
      });
      console.log(`[画像生成] Leonardo AI API呼び出し完了 - Generation ID: ${leonardoResponse.generationId}`);

      // 一貫性スコアを計算（オンボーディング時は1.0）
      const consistencyScore = partner ? await this.calculateConsistencyScore(partner, enhancedPrompt) : 1.0;

      // オンボーディング時は保存せず、結果のみ返す
      if (!request.partnerId) {
        return {
          id: 'temp-' + Date.now(),
          partnerId: 'temp-onboarding',
          imageUrl: leonardoResponse.imageUrl,
          thumbnailUrl: leonardoResponse.thumbnailUrl,
          prompt: enhancedPrompt,
          context: request.context || '',
          consistencyScore,
          leonardoGenerationId: leonardoResponse.generationId,
          modelUsed: LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
          metadata: {
            originalRequest: request,
            leonardoParams: leonardoResponse.parameters,
            generatedAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as GeneratedImage;
      }

      // 通常の場合：データベースに保存
      const generatedImage = await GeneratedImageModel.create({
        partnerId: request.partnerId,
        imageUrl: leonardoResponse.imageUrl,
        thumbnailUrl: leonardoResponse.thumbnailUrl,
        prompt: enhancedPrompt,
        context: request.context || '',
        consistencyScore,
        leonardoGenerationId: leonardoResponse.generationId,
        modelUsed: LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        metadata: {
          originalRequest: request,
          leonardoParams: leonardoResponse.parameters,
          generatedAt: new Date(),
        },
      });

      return generatedImage;

    } catch (error) {
      console.error('アバター画像生成エラー:', error);
      console.error('エラースタック:', error instanceof Error ? error.stack : 'No stack');
      console.error('リクエストデータ:', JSON.stringify(request, null, 2));
      if (error instanceof Error && error.message.includes('パートナーが見つかりません')) {
        throw error;
      }
      throw new Error(`画像生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * チャット用画像を生成
   */
  async generateChatImage(
    partnerId: ID, 
    message: string, 
    emotion?: string,
    situation?: string,
    useReference?: boolean
  ): Promise<GeneratedImage> {
    try {
      const partner = await PartnerModel.findById(partnerId);
      if (!partner) {
        throw new Error('パートナーが見つかりません');
      }

      // チャット文脈用プロンプト生成
      const chatPrompt = await this.buildChatPrompt(partner, message, emotion, situation);

      // 参考画像を使用する場合、過去の高一貫性画像を取得
      let referenceImages: GeneratedImage[] = [];
      if (useReference) {
        referenceImages = await GeneratedImageModel.getHighConsistencyImages(partnerId, 0.8);
      }

      // 実データ主義：常に実際のLeonardo AI APIを呼び出す
      console.log(`[チャット画像生成] Leonardo AI API呼び出し開始 - Emotion: ${emotion}, Situation: ${situation}`);
      const leonardoResponse = await this.callLeonardoAPI({
        prompt: chatPrompt,
        modelId: LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        width: LEONARDO_AI_CONSTRAINTS.IMAGE_DIMENSIONS.DEFAULTS.WIDTH,
        height: LEONARDO_AI_CONSTRAINTS.IMAGE_DIMENSIONS.DEFAULTS.HEIGHT,
        num_images: 1,
        guidance_scale: 8,
        referenceImages: referenceImages.map(img => img.imageUrl),
      });
      console.log(`[チャット画像生成] Leonardo AI API呼び出し完了 - Generation ID: ${leonardoResponse.generationId}`);

      const consistencyScore = await this.calculateConsistencyScore(partner, chatPrompt);

      const generatedImage = await GeneratedImageModel.create({
        partnerId,
        imageUrl: leonardoResponse.imageUrl,
        thumbnailUrl: leonardoResponse.thumbnailUrl,
        prompt: chatPrompt,
        context: `chat_message: ${message}`,
        consistencyScore,
        leonardoGenerationId: leonardoResponse.generationId,
        modelUsed: LEONARDO_AI_CONSTRAINTS.ANIME_MODELS.DEFAULT_ANIME_MODEL,
        metadata: {
          message,
          emotion,
          situation,
          useReference,
          referenceCount: referenceImages.length,
          generatedAt: new Date(),
        },
      });

      return generatedImage;

    } catch (error) {
      console.error('チャット画像生成エラー:', error);
      throw new Error('チャット画像生成に失敗しました');
    }
  }

  /**
   * 背景画像一覧を取得
   */
  async getBackgroundImages(category?: string, limit: number = 20): Promise<BackgroundImage[]> {
    // 静的な背景画像プリセット
    const allBackgrounds: BackgroundImage[] = [
      {
        id: 'nature-01',
        name: '桜並木',
        url: '/images/backgrounds/nature/sakura-path.jpg',
        category: 'nature',
        isDefault: true,
        thumbnail: '/images/backgrounds/nature/sakura-path-thumb.jpg',
      },
      {
        id: 'nature-02',
        name: '夕日の海岸',
        url: '/images/backgrounds/nature/sunset-beach.jpg',
        category: 'nature',
        isDefault: false,
        thumbnail: '/images/backgrounds/nature/sunset-beach-thumb.jpg',
      },
      {
        id: 'indoor-01',
        name: 'カフェテラス',
        url: '/images/backgrounds/indoor/cafe-terrace.jpg',
        category: 'indoor',
        isDefault: false,
        thumbnail: '/images/backgrounds/indoor/cafe-terrace-thumb.jpg',
      },
      {
        id: 'indoor-02',
        name: '図書館',
        url: '/images/backgrounds/indoor/library.jpg',
        category: 'indoor',
        isDefault: false,
        thumbnail: '/images/backgrounds/indoor/library-thumb.jpg',
      },
      {
        id: 'fantasy-01',
        name: '魔法の森',
        url: '/images/backgrounds/fantasy/magic-forest.jpg',
        category: 'fantasy',
        isDefault: false,
        thumbnail: '/images/backgrounds/fantasy/magic-forest-thumb.jpg',
      },
      {
        id: 'modern-01',
        name: '都市の夜景',
        url: '/images/backgrounds/modern/city-night.jpg',
        category: 'modern',
        isDefault: false,
        thumbnail: '/images/backgrounds/modern/city-night-thumb.jpg',
      },
      {
        id: 'romantic-01',
        name: 'ロマンチックガーデン',
        url: '/images/backgrounds/romantic/rose-garden.jpg',
        category: 'romantic',
        isDefault: false,
        thumbnail: '/images/backgrounds/romantic/rose-garden-thumb.jpg',
      },
    ];

    let filteredBackgrounds = allBackgrounds;
    
    if (category) {
      filteredBackgrounds = allBackgrounds.filter(bg => bg.category === category);
    }

    return filteredBackgrounds.slice(0, limit);
  }

  /**
   * 画像生成履歴を取得
   */
  async getImageHistory(
    partnerId: ID, 
    limit: number = 20, 
    minConsistency?: number
  ): Promise<GeneratedImage[]> {
    if (minConsistency !== undefined) {
      return GeneratedImageModel.getHighConsistencyImages(partnerId, minConsistency);
    }
    return GeneratedImageModel.getByPartnerId(partnerId, limit);
  }

  /**
   * 画像生成統計を取得
   */
  async getImageStats(partnerId: ID): Promise<{
    totalImages: number;
    averageConsistency: number;
    recentImages: number;
  }> {
    return GeneratedImageModel.getGenerationStats(partnerId);
  }

  /**
   * 画像削除
   */
  async deleteImage(imageId: ID): Promise<void> {
    const image = await GeneratedImageModel.findByPk(imageId);
    if (!image) {
      throw new Error('画像が見つかりません');
    }

    await GeneratedImageModel.destroy(imageId);
  }

  /**
   * 髪色を英語に変換
   */
  private translateHairColorToEnglish(japaneseColor: string): string {
    const colorMap: Record<string, string> = {
      '黒': 'black',
      'ダークブラウン': 'dark brown',
      'ブラウン': 'brown',
      'ブロンド': 'blonde',
      'ピンク': 'pink',
      '水色': 'light blue',
      'ミントグリーン': 'mint green',
      'ラベンダー': 'lavender',
      'ライトゴールド': 'light gold',
      'シルバー': 'silver'
    };
    return colorMap[japaneseColor] || japaneseColor.toLowerCase() || 'brown';
  }

  /**
   * パートナー一貫性を保つプロンプト生成
   */
  private async buildConsistentPrompt(partner: Partner, request: any): Promise<string> {
    const appearance = partner.appearance;
    const hairColorEnglish = appearance?.hairColor 
      ? this.translateHairColorToEnglish(appearance.hairColor)
      : 'brown';
    
    const basePrompt = [
      `anime style portrait of ${partner.gender === 'boyfriend' ? 'handsome young man' : 'beautiful young woman'}`,
      `hair: ${hairColorEnglish} ${appearance?.hairStyle || 'medium length'}`,
      `eyes: ${appearance?.eyeColor || 'brown'} eyes`,
      `personality: ${partner.personalityType || 'gentle'} character`,
      `expression: ${request.emotion || 'gentle smile'}`,
      request.clothing ? `clothing: ${request.clothing}` : '',
      request.background ? `background: ${request.background}` : '',
      'high quality, detailed, professional anime artwork',
      'consistent character design, same person',
    ].filter(Boolean).join(', ');

    return request.prompt ? `${basePrompt}, ${request.prompt}` : basePrompt;
  }

  /**
   * チャット用プロンプト生成
   */
  private async buildChatPrompt(
    partner: Partner, 
    message: string, 
    emotion?: string, 
    situation?: string
  ): Promise<string> {
    const appearance = partner.appearance;
    const hairColorEnglish = appearance?.hairColor 
      ? this.translateHairColorToEnglish(appearance.hairColor)
      : 'brown';
    
    const contextualPrompt = [
      `anime style ${partner.gender === 'boyfriend' ? 'young man' : 'young woman'}`,
      `hair: ${hairColorEnglish} ${appearance?.hairStyle || 'medium length'}`,
      `eyes: ${appearance?.eyeColor || 'brown'} eyes`,
      `personality: ${partner.personalityType as string}`,
      emotion ? `emotion: ${emotion}` : 'friendly expression',
      situation ? `situation: ${situation}` : '',
      message ? `context: ${message}` : '',
      'reacting to conversation',
      'high quality anime artwork, consistent character',
    ].filter(Boolean).join(', ');

    return contextualPrompt;
  }

  /**
   * Leonardo AI API呼び出し
   */
  private async callLeonardoAPI(params: {
    prompt: string;
    modelId: string;
    width: number;
    height: number;
    num_images: number;
    guidance_scale: number;
    referenceImages?: string[];
  }): Promise<{
    imageUrl: string;
    thumbnailUrl?: string;
    generationId: string;
    parameters: any;
  }> {
    try {
      console.log('[Leonardo AI] API呼び出し開始:', {
        url: `${this.leonardoBaseUrl}/generations`,
        params: {
          prompt: params.prompt.substring(0, 100) + '...',
          modelId: params.modelId,
          width: params.width,
          height: params.height,
          num_images: params.num_images,
          guidance_scale: params.guidance_scale,
        }
      });

      // Leonardo AI APIの正確なパラメータ形式（snake_case）
      const requestBody = {
        prompt: params.prompt,
        modelId: params.modelId,
        width: params.width,
        height: params.height,
        num_images: params.num_images, // snake_case（正しい形式）
        guidance_scale: params.guidance_scale, // snake_case（正しい形式）
        // 参考画像機能は一時的に無効化（Leonardo API仕様要確認）
        // ...(params.referenceImages && params.referenceImages.length > 0 && {
        //   initImageId: params.referenceImages[0],
        //   initStrength: 0.3,
        // }),
      };

      console.log('[Leonardo AI] リクエストボディ:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        `${this.leonardoBaseUrl}/generations`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.leonardoApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60秒タイムアウト
        }
      );

      console.log('[Leonardo AI] API呼び出し成功:', {
        status: response.status,
        responseKeys: response.data ? Object.keys(response.data as object) : [],
        responseData: response.data
      });

      // Leonardo AIのレスポンス構造を正確に解析
      const responseData = response.data as any;
      const generationId = responseData?.sdGenerationJob?.generationId || 
                          responseData?.generationId || 
                          responseData?.id;

      if (!generationId) {
        console.error('[Leonardo AI] Generation IDが見つかりません:', responseData);
        throw new Error('Generation IDがレスポンスに含まれていません');
      }

      console.log('[Leonardo AI] Generation ID取得:', generationId);
      
      // 生成完了まで待機（ポーリング）
      const imageUrl = await this.waitForGeneration(generationId);
      
      return {
        imageUrl,
        thumbnailUrl: imageUrl, // サムネイルが別途提供される場合は調整
        generationId,
        parameters: params,
      };

    } catch (error) {
      console.error('[Leonardo AI] API呼び出しエラー:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('[Leonardo AI] レスポンスステータス:', (error as any).response?.status);
        console.error('[Leonardo AI] レスポンスデータ:', JSON.stringify((error as any).response?.data, null, 2));
        console.error('[Leonardo AI] リクエストURL:', (error as any).config?.url);
        console.error('[Leonardo AI] リクエストデータ:', JSON.stringify((error as any).config?.data, null, 2));
      }
      throw new Error(`Leonardo AI API呼び出しに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成完了まで待機
   */
  private async waitForGeneration(generationId: string): Promise<string> {
    const maxAttempts = 30; // 最大30回（5分）
    const interval = 10000; // 10秒間隔

    console.log(`[Leonardo AI] ポーリング開始 - Generation ID: ${generationId}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`[Leonardo AI] ポーリング試行 ${attempt + 1}/${maxAttempts}`);
        
        const response = await axios.get(
          `${this.leonardoBaseUrl}/generations/${generationId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.leonardoApiKey}`,
            },
            timeout: 30000, // 30秒タイムアウト
          }
        );

        console.log(`[Leonardo AI] ポーリングレスポンス:`, {
          status: response.status,
          dataKeys: response.data ? Object.keys(response.data as object) : [],
          data: response.data
        });

        // Leonardo AIのレスポンス構造を正確に解析
        const responseData = response.data as any;
        const generation = responseData?.generations_by_pk || responseData;

        // 様々なステータス形式に対応
        const status = generation.status || generation.generationStatus || generation.state;
        console.log(`[Leonardo AI] 生成ステータス: ${status}`);

        if (status === 'COMPLETE' || status === 'completed' || status === 'FINISHED') {
          const images = generation.generated_images || generation.images || generation.outputs;
          if (images && images.length > 0) {
            const imageUrl = images[0].url || images[0].imageUrl || images[0].image_url;
            if (imageUrl) {
              console.log(`[Leonardo AI] 画像生成完了: ${imageUrl}`);
              return imageUrl;
            } else {
              console.error('[Leonardo AI] 画像URLが見つかりません:', images[0]);
            }
          } else {
            console.error('[Leonardo AI] 生成された画像がありません:', generation);
          }
        } else if (status === 'FAILED' || status === 'failed' || status === 'ERROR') {
          const errorMessage = generation.error || generation.errorMessage || `生成が失敗しました (Status: ${status})`;
          console.error('[Leonardo AI] 画像生成失敗:', errorMessage);
          throw new Error(`画像生成が失敗しました: ${errorMessage}`);
        }

        // まだ完了していない場合は待機
        console.log(`[Leonardo AI] 生成中... (${status}) - ${interval/1000}秒後に再試行`);
        await new Promise(resolve => setTimeout(resolve, interval));

      } catch (error) {
        console.error(`[Leonardo AI] ポーリングエラー (試行 ${attempt + 1}):`, error);
        if (error && typeof error === 'object' && 'response' in error) {
          console.error('[Leonardo AI] ポーリングレスポンスエラー:', (error as any).response?.status, (error as any).response?.data);
        }
        
        // 最後の試行でない場合は続行
        if (attempt < maxAttempts - 1) {
          console.log(`[Leonardo AI] ${interval/1000}秒後に再試行...`);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
    }

    throw new Error(`画像生成がタイムアウトしました（${maxAttempts * interval / 60000}分経過）`);
  }

  /**
   * 一貫性スコア計算
   */
  private async calculateConsistencyScore(partner: Partner, prompt: string): Promise<number> {
    // 簡易的な一貫性スコア計算
    // 実際にはより高度なアルゴリズムを実装可能
    const appearance = partner.appearance;
    let score = 0.5; // ベーススコア

    // 髪色の一致チェック
    if (prompt.includes(appearance?.hairColor || '')) {
      score += 0.2;
    }

    // 目の色の一致チェック
    if (prompt.includes(appearance?.eyeColor || '')) {
      score += 0.2;
    }

    // 性格の一致チェック
    if (prompt.includes((partner.personalityType as string) || 'gentle')) {
      score += 0.1;
    }

    // DECIMAL(3,2)制約に合わせて小数点2桁に制限
    return Math.min(Math.round(score * 100) / 100, 1.0);
  }
}