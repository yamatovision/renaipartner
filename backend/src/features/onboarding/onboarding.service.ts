import { 
  OnboardingProgress, 
  OnboardingProgressHelpers,
  UserModel,
  PartnerModel
} from '../../db/models';
import { 
  PersonalityQuestion,
  PartnerData,
  PresetPersonality,
  PERSONALITY_PRESETS,
  PersonalityType,
  Partner
} from '../../types';
import { PartnersService } from '../partners/partners.service';
import { UsersService } from '../users/users.service';
import { NotFoundError, ValidationError, ServiceError } from '../../common/middlewares/error.middleware';
import { Op } from 'sequelize';

export class OnboardingService {
  /**
   * オンボーディングを開始
   */
  async startOnboarding(userId: string): Promise<OnboardingProgress> {
    try {
      console.log(`[OnboardingService] Starting onboarding for user: ${userId}`);

      // ユーザーの存在確認
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new NotFoundError('ユーザー');
      }

      // 既存のパートナーがいる場合はエラー
      const existingPartner = await PartnerModel.findByUserId(userId);
      if (existingPartner) {
        throw new ValidationError('既にパートナーが存在します');
      }

      // 既存のオンボーディング進捗をチェック
      const existingProgress = await OnboardingProgress.findOne({ where: { userId } });
      if (existingProgress && !existingProgress.completed) {
        throw new ValidationError('既にオンボーディングが開始されています');
      }

      // オンボーディング進捗を作成または取得
      const progress = await OnboardingProgressHelpers.findOrCreateByUserId(userId);
      
      // 既に完了している場合はリセット
      if (progress.completed) {
        console.log(`[OnboardingService] Resetting completed onboarding for user: ${userId}`);
        await OnboardingProgressHelpers.resetProgress(userId);
        return await OnboardingProgressHelpers.findOrCreateByUserId(userId);
      }

      return progress;
    } catch (error) {
      console.error('[OnboardingService] Error starting onboarding:', error);
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('オンボーディングの開始に失敗しました', 500);
    }
  }

  /**
   * オンボーディング進捗を取得
   */
  async getProgress(userId: string): Promise<OnboardingProgress> {
    try {
      console.log(`[OnboardingService] Getting onboarding progress for user: ${userId}`);

      const progress = await OnboardingProgress.findOne({ where: { userId } });
      if (!progress) {
        throw new NotFoundError('オンボーディング進捗');
      }
      return progress;
    } catch (error) {
      console.error('[OnboardingService] Error getting progress:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('進捗の取得に失敗しました', 500);
    }
  }

  /**
   * オンボーディング進捗を更新
   */
  async updateProgress(
    userId: string,
    updateData: {
      step?: number;  // テストで使用される
      currentStep?: number;
      completedSteps?: number[];
      userData?: Partial<OnboardingProgress['userData']>;
      partnerData?: Partial<PartnerData>;
      personalityAnswers?: PersonalityQuestion[];
    }
  ): Promise<OnboardingProgress> {
    try {
      console.log(`[OnboardingService] Updating onboarding progress for user: ${userId}`);

      const progress = await OnboardingProgress.findOne({ where: { userId } });
      if (!progress) {
        throw new NotFoundError('オンボーディング進捗');
      }

      // 既に完了している場合は更新不可
      if (progress.completed) {
        throw new ServiceError('オンボーディングは既に完了しています', 400);
      }

      // 各データを更新
      if (updateData.userData) {
        await OnboardingProgressHelpers.updateUserData(userId, updateData.userData);
      }

      if (updateData.partnerData) {
        await OnboardingProgressHelpers.updatePartnerData(userId, updateData.partnerData);
      }

      if (updateData.personalityAnswers) {
        await OnboardingProgressHelpers.updatePersonalityAnswers(userId, updateData.personalityAnswers);
      }

      // ステップ情報を更新
      const stepNumber = updateData.step || updateData.currentStep;
      if (stepNumber !== undefined) {
        progress.currentStep = stepNumber;
        // ステップが設定された場合は、そのステップまでを完了済みとしてマークする
        if (!updateData.completedSteps) {
          const completedSteps = [];
          for (let i = 1; i < stepNumber; i++) {
            completedSteps.push(i);
          }
          progress.completedSteps = completedSteps;
        }
      }

      if (updateData.completedSteps) {
        progress.completedSteps = updateData.completedSteps;
        await OnboardingProgressHelpers.markStepAsCompleted(userId, Math.max(...updateData.completedSteps));
      }

      await progress.save();

      // 最新の状態を返す
      return await OnboardingProgress.findOne({ where: { userId } }) as OnboardingProgress;
    } catch (error) {
      console.error('[OnboardingService] Error updating progress:', error);
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('進捗の更新に失敗しました', 500);
    }
  }

  /**
   * オンボーディングを完了
   */
  async completeOnboarding(
    userId: string,
    finalData?: {
      userData?: OnboardingProgress['userData'];
      partnerData?: PartnerData;
    }
  ): Promise<{ partner: Partner; user: any }> {
    try {
      console.log(`[OnboardingService] Completing onboarding for user: ${userId}`);

      const progress = await OnboardingProgress.findOne({ where: { userId } });
      if (!progress) {
        throw new NotFoundError('オンボーディング進捗');
      }

      // 既に完了している場合はエラー
      if (progress.completed) {
        throw new ServiceError('オンボーディングは既に完了しています', 400);
      }

      // 完了に必要なデータが揃っているかチェック
      const userData = finalData?.userData || progress.userData;
      const partnerData = finalData?.partnerData || progress.partnerData;

      if (!userData || !userData.surname || !userData.firstName || !userData.birthday) {
        throw new ValidationError('オンボーディングが完了していません。ユーザー情報が不足しています。');
      }

      if (!partnerData || !partnerData.name || !partnerData.gender || !partnerData.personality) {
        throw new ValidationError('オンボーディングが完了していません。パートナー情報が不足しています。');
      }

      // オンボーディング完了にはステップ10まで進んでいることを確認
      if (progress.currentStep < 10) {
        throw new ValidationError('オンボーディングが完了していません。全てのステップを完了してください。');
      }

      // 最終データを保存
      if (finalData?.userData) {
        await OnboardingProgressHelpers.updateUserData(userId, finalData.userData);
      }
      if (finalData?.partnerData) {
        await OnboardingProgressHelpers.updatePartnerData(userId, finalData.partnerData);
      }

      // ユーザー情報を更新
      const updatedUser = await UsersService.updateProfile(userId, {
        surname: userData.surname,
        firstName: userData.firstName,
        nickname: partnerData.nickname || partnerData.name,
        birthday: userData.birthday,
      });

      // パートナーを作成
      const partnerCreateData = {
        userId,
        name: partnerData.name,
        gender: partnerData.gender,
        personalityType: partnerData.personality,
        speechStyle: partnerData.speechStyle || 'casual',
        systemPrompt: this.generateSystemPrompt(partnerData, userData),
        avatarDescription: this.generateAvatarDescription(partnerData),
        appearance: partnerData.appearance || {
          hairStyle: 'medium',
          eyeColor: 'brown',
          bodyType: 'average',
          clothingStyle: 'casual'
        },
        hobbies: [], // 初期値は空
        intimacyLevel: 0, // 初期親密度
        createdViaOnboarding: true,
      };

      const partner = await PartnersService.createPartner(userId, partnerCreateData);

      // オンボーディングを完了としてマーク（進捗を削除）
      await OnboardingProgress.destroy({ where: { userId } });

      console.log(`[OnboardingService] Onboarding completed successfully for user: ${userId}`);

      return {
        partner,
        user: updatedUser,
      };
    } catch (error) {
      console.error('[OnboardingService] Error completing onboarding:', error);
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('オンボーディングの完了に失敗しました', 500);
    }
  }

  /**
   * プリセット性格一覧を取得
   */
  async getPresets(): Promise<PresetPersonality[]> {
    try {
      console.log('[OnboardingService] Getting personality presets');

      // すべてのプリセットを配列として返す
      const presets = Object.values(PERSONALITY_PRESETS);
      
      return presets;
    } catch (error) {
      console.error('[OnboardingService] Error getting presets:', error);
      throw new ServiceError('プリセットの取得に失敗しました', 500);
    }
  }

  /**
   * 性格診断の質問を取得
   */
  getPersonalityQuestions(): PersonalityQuestion[] {
    return [
      {
        id: 'q1',
        question: 'どんな性格の人が好みですか？',
        options: [
          { value: 'gentle', label: '優しい' },
          { value: 'cool', label: 'クール' },
          { value: 'cheerful', label: '明るい' },
          { value: 'mysterious', label: 'ミステリアス' },
          { value: 'reliable', label: '頼れる' },
        ],
      },
      {
        id: 'q2',
        question: '年齢の好みは？',
        options: [
          { value: 'older', label: '年上（お兄さん/お姉さん系）' },
          { value: 'same', label: '同年代' },
          { value: 'younger', label: '年下（弟/妹系）' },
        ],
      },
      {
        id: 'q3',
        question: 'どんな話し方が心地良いですか？',
        options: [
          { value: 'polite', label: '丁寧語' },
          { value: 'casual', label: 'カジュアル' },
          { value: 'sweet', label: '甘い言葉多め' },
          { value: 'dialect', label: '方言' },
          { value: 'cool_tone', label: 'クール系' },
        ],
      },
    ];
  }

  /**
   * 性格診断結果からおすすめプリセットを取得
   */
  getRecommendedPresets(answers: PersonalityQuestion[]): PresetPersonality[] {
    // 入力バリデーション
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new ValidationError('回答が必要です');
    }

    // 回答形式のバリデーション
    for (const answer of answers) {
      if (!answer.id && !(answer as any).questionId) {
        throw new ValidationError('無効な回答形式です');
      }
      if (!answer.answer) {
        throw new ValidationError('回答が選択されていません');
      }
    }

    // 回答に基づいてスコアリング
    const scores: Record<PersonalityType, number> = {} as any;
    
    // 各プリセットに初期スコア0を設定
    Object.values(PersonalityType).forEach(type => {
      scores[type] = 0;
    });

    // 回答に基づいてスコアを加算
    answers.forEach(answer => {
      if (!answer.answer) return;

      // questionIdとidの両方に対応
      const questionId = answer.id || (answer as any).questionId;

      // 性格の好み
      if (questionId === 'q1' || questionId === 1 || questionId === '1') {
        switch (answer.answer) {
          case 'gentle':
            scores[PersonalityType.GENTLE] += 3;
            scores[PersonalityType.SWEET] += 2;
            break;
          case 'cool':
            scores[PersonalityType.COOL] += 3;
            scores[PersonalityType.TSUNDERE] += 2;
            break;
          case 'cheerful':
            scores[PersonalityType.CHEERFUL] += 3;
            scores[PersonalityType.CLINGY] += 2;
            break;
          case 'mysterious':
            scores[PersonalityType.MYSTERIOUS] += 3;
            scores[PersonalityType.ARTIST] += 2;
            break;
          case 'reliable':
            scores[PersonalityType.RELIABLE] += 3;
            scores[PersonalityType.PRINCE] += 1;
            break;
        }
      }

      // 年齢の好み
      if (questionId === 'q2' || questionId === 2 || questionId === '2') {
        switch (answer.answer) {
          case 'older':
            scores[PersonalityType.RELIABLE] += 2;
            scores[PersonalityType.PRINCE] += 1;
            break;
          case 'younger':
            scores[PersonalityType.YOUNGER] += 3;
            scores[PersonalityType.CLINGY] += 1;
            break;
        }
      }

      // 話し方の好み
      if (questionId === 'q3' || questionId === 3 || questionId === '3') {
        switch (answer.answer) {
          case 'sweet':
            scores[PersonalityType.SWEET] += 2;
            scores[PersonalityType.CLINGY] += 1;
            break;
          case 'cool_tone':
            scores[PersonalityType.COOL] += 2;
            scores[PersonalityType.BAND] += 1;
            break;
        }
      }
    });

    // スコアの高い順にソート
    const sortedTypes = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) // 上位3つを取得
      .map(([type]) => type as PersonalityType);

    // 対応するプリセットを返す
    return sortedTypes.map(type => PERSONALITY_PRESETS[type]);
  }

  /**
   * システムプロンプトを生成
   */
  private generateSystemPrompt(partnerData: PartnerData, userData: OnboardingProgress['userData']): string {
    const preset = PERSONALITY_PRESETS[partnerData.personality];
    const basePrompt = preset?.systemPrompt || '';

    return `あなたは${userData.surname} ${userData.firstName}さんの${partnerData.gender === 'boyfriend' ? '彼氏' : '彼女'}、${partnerData.name}です。
${basePrompt}
${partnerData.prompt ? `\n追加設定: ${partnerData.prompt}` : ''}

相手のことは最初は「${userData.surname}さん」と呼びますが、親密度が上がるにつれて「${userData.firstName}さん」「${userData.firstName}」「${partnerData.nickname}」と呼び方を変えていきます。

重要な情報:
- ユーザーの誕生日: ${userData.birthday}
- あなたの性別: ${partnerData.gender === 'boyfriend' ? '男性' : '女性'}
- あなたの話し方: ${this.getSpeechStyleDescription(partnerData.speechStyle)}`;
  }

  /**
   * アバター説明文を生成
   */
  private generateAvatarDescription(partnerData: PartnerData): string {
    const { appearance } = partnerData;
    const gender = partnerData.gender === 'boyfriend' ? '男性' : '女性';
    
    return `${gender}、${appearance.hairStyle === 'short' ? '短い' : appearance.hairStyle === 'medium' ? '中くらいの長さの' : '長い'}髪、${this.getEyeColorJapanese(appearance.eyeColor)}の瞳、${this.getBodyTypeJapanese(appearance.bodyType)}体型、${this.getClothingStyleJapanese(appearance.clothingStyle)}な服装`;
  }

  /**
   * 話し方の説明を取得
   */
  private getSpeechStyleDescription(style: string): string {
    const descriptions: Record<string, string> = {
      polite: '丁寧語で話す',
      casual: 'カジュアルに話す',
      sweet: '甘い言葉を多く使う',
      dialect: '方言を使う',
      cool_tone: 'クールな口調で話す',
      keigo: '敬語を使う',
      tame: 'タメ口で話す',
      kansai: '関西弁で話す',
      ojousama: 'お嬢様言葉で話す',
    };
    return descriptions[style] || '普通に話す';
  }

  /**
   * 目の色を日本語に変換
   */
  private getEyeColorJapanese(color: string): string {
    const colors: Record<string, string> = {
      brown: '茶色',
      black: '黒',
      blue: '青',
      green: '緑',
    };
    return colors[color] || color;
  }

  /**
   * 体型を日本語に変換
   */
  private getBodyTypeJapanese(type: string): string {
    const types: Record<string, string> = {
      slim: 'スリムな',
      average: '標準的な',
      athletic: 'スポーティな',
    };
    return types[type] || type;
  }

  /**
   * 服装スタイルを日本語に変換
   */
  private getClothingStyleJapanese(style: string): string {
    const styles: Record<string, string> = {
      casual: 'カジュアル',
      formal: 'フォーマル',
      sporty: 'スポーティ',
      elegant: 'エレガント',
    };
    return styles[style] || style;
  }
}

export const onboardingService = new OnboardingService();