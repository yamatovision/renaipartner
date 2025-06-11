import { DataTypes, Model, Sequelize } from 'sequelize';
import { 
  OnboardingProgress as IOnboardingProgress,
  PersonalityQuestion,
  PartnerData,
  ID,
  EyeColor,
  Gender
} from '../../types';

interface OnboardingProgressAttributes extends IOnboardingProgress {}

interface OnboardingProgressCreationAttributes {
  userId: ID;
  currentStep?: number;
  completedSteps?: number[];
  userData?: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  partnerData?: PartnerData;
  personalityAnswers?: PersonalityQuestion[];
  completed?: boolean;
}

export class OnboardingProgress extends Model<OnboardingProgressAttributes, OnboardingProgressCreationAttributes> implements OnboardingProgressAttributes {
  declare id: ID;
  declare userId: ID;
  declare currentStep: number;
  declare completedSteps: number[];
  declare userData: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  declare partnerData: PartnerData;
  declare personalityAnswers: PersonalityQuestion[];
  declare completed: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export const initOnboardingProgressModel = (sequelize: Sequelize) => {
  OnboardingProgress.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // 1ユーザー1オンボーディング進捗
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      currentStep: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 10,
        },
      },
      completedSteps: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      userData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      partnerData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      personalityAnswers: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    } as any,
    {
      sequelize,
      modelName: 'OnboardingProgress',
      tableName: 'onboarding_progress',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['completed'],
        },
      ],
    }
  );

  return OnboardingProgress;
};

// Helper methods
export const OnboardingProgressHelpers = {
  /**
   * ユーザーのオンボーディング進捗を取得（存在しない場合は作成）
   */
  async findOrCreateByUserId(userId: string): Promise<OnboardingProgress> {
    const [progress] = await OnboardingProgress.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        currentStep: 1,
        completedSteps: [],
        completed: false,
      },
    });
    return progress;
  },

  /**
   * ステップを完了としてマーク
   */
  async markStepAsCompleted(userId: string, stepNumber: number): Promise<OnboardingProgress> {
    const progress = await this.findOrCreateByUserId(userId);
    
    // 既に完了済みのステップでなければ追加
    if (!progress.completedSteps.includes(stepNumber)) {
      progress.completedSteps = [...progress.completedSteps, stepNumber].sort((a, b) => a - b);
    }
    
    // 現在のステップを更新
    if (stepNumber >= progress.currentStep && stepNumber < 10) {
      progress.currentStep = stepNumber + 1;
    }
    
    // 全ステップ完了チェック（ステップ1-9まで完了）
    if (progress.completedSteps.length >= 9 && stepNumber === 9) {
      progress.completed = true;
      progress.currentStep = 10;
    }
    
    await progress.save();
    return progress;
  },

  /**
   * ユーザーデータを更新
   */
  async updateUserData(userId: string, userData: Partial<OnboardingProgress['userData']>): Promise<OnboardingProgress> {
    const progress = await this.findOrCreateByUserId(userId);
    
    progress.userData = {
      ...progress.userData,
      ...userData,
    };
    
    await progress.save();
    return progress;
  },

  /**
   * パートナーデータを更新
   */
  async updatePartnerData(userId: string, partnerData: Partial<PartnerData>): Promise<OnboardingProgress> {
    const progress = await this.findOrCreateByUserId(userId);
    
    let updatedPartnerData = {
      ...progress.partnerData,
      ...partnerData,
    } as PartnerData;

    // genderの変換処理
    if (partnerData.gender) {
      if ((partnerData.gender as any) === 'FEMALE' || partnerData.gender === Gender.GIRLFRIEND) {
        updatedPartnerData.gender = Gender.GIRLFRIEND;
      } else if ((partnerData.gender as any) === 'MALE' || partnerData.gender === Gender.BOYFRIEND) {
        updatedPartnerData.gender = Gender.BOYFRIEND;
      }
    }

    // 外見データの処理
    if (partnerData.appearance) {
      // appearanceSettings として格納するための変換
      const appearance = partnerData.appearance;
      
      // hairColorとeyeColorの変換処理を追加
      let convertedEyeColor = appearance.eyeColor;
      if (typeof appearance.eyeColor === 'string') {
        convertedEyeColor = this.convertColorToJapanese(appearance.eyeColor);
      }

      updatedPartnerData.appearanceSettings = {
        hairStyle: appearance.hairStyle || 'medium',
        eyeColor: convertedEyeColor as EyeColor,
        bodyType: appearance.bodyType,
        clothingStyle: appearance.clothingStyle || 'casual',
        generatedImageUrl: appearance.generatedImageUrl
      };

      // hairColorの処理（テストで使用）
      if ((appearance as any).hairColor) {
        (updatedPartnerData.appearanceSettings as any).hairColor = (appearance as any).hairColor;
      }
    }
    
    progress.partnerData = updatedPartnerData;
    
    await progress.save();
    return progress;
  },

  convertColorToJapanese(color: string): EyeColor {
    const colorMap: Record<string, EyeColor> = {
      '茶色': 'brown',
      'brown': 'brown',
      'blue': 'blue',
      '青': 'blue',
      'green': 'green',
      '緑': 'green', 
      'black': 'black',
      '黒': 'black'
    };
    return colorMap[color] || 'brown';
  },

  /**
   * 性格質問の回答を更新
   */
  async updatePersonalityAnswers(userId: string, answers: PersonalityQuestion[]): Promise<OnboardingProgress> {
    const progress = await this.findOrCreateByUserId(userId);
    
    // 既存の回答とマージ（同じIDの質問は上書き）
    const answersMap = new Map(progress.personalityAnswers.map(a => [a.id, a]));
    answers.forEach(answer => answersMap.set(answer.id, answer));
    
    progress.personalityAnswers = Array.from(answersMap.values());
    
    await progress.save();
    return progress;
  },

  /**
   * オンボーディング完了
   */
  async completeOnboarding(userId: string): Promise<OnboardingProgress> {
    const progress = await this.findOrCreateByUserId(userId);
    
    progress.completed = true;
    progress.currentStep = 10;
    
    // 全ステップを完了済みにする
    progress.completedSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    await progress.save();
    return progress;
  },

  /**
   * オンボーディング進捗をリセット
   */
  async resetProgress(userId: string): Promise<OnboardingProgress> {
    const progress = await this.findOrCreateByUserId(userId);
    
    progress.currentStep = 1;
    progress.completedSteps = [];
    progress.userData = null as any;
    progress.partnerData = null as any;
    progress.personalityAnswers = [];
    progress.completed = false;
    
    await progress.save();
    return progress;
  },
};