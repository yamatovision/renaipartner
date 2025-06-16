// フロントエンド用型定義ファイル

/**
 * ===== 型定義同期ガイドライン =====
 * 型ファイルは下記2つの同期された型ファイルが存在します。  
 *  - **フロントエンド**: `frontend/src/types/index.ts`
 *　 - **バックエンド**: `backend/src/types/index.ts`
 * 【基本原則】この/types/index.tsを更新したら、もう一方の/types/index.tsも必ず同じ内容に更新する
 * 
 * 【変更の責任】
 * - 型定義を変更した開発者は、両方のファイルを即座に同期させる責任を持つ
 * - 1つのtypes/index.tsの更新は禁止。必ず1つを更新したらもう一つも更新その場で行う
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. APIパスは必ずこのファイルで一元管理する
 * 5. コード内でAPIパスをハードコードしない
 * 6. 2つの同期されたtypes/index.tsを単一の真実源とする
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 */

// =============================================================================
// 基本型定義
// =============================================================================

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// 認証・ユーザー関連
// =============================================================================

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface UserBase {
  surname: string;
  firstName: string;
  nickname?: string;
  birthday: string;
  email: string;
  profileCompleted?: boolean;
}

export interface UserCreate extends Partial<UserBase> {
  email: string;
  password?: string;
  role?: UserRole;
}

export interface User extends UserBase, Timestamps {
  id: ID;
  userId: ID; // エイリアス: idと同じ値
  role: UserRole;
  status?: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  surname: string;
  firstName: string;
  birthday: string;
  role?: UserRole;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  surname: string;
  firstName: string;
  birthday: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  surname?: string;
  firstName?: string;
  nickname?: string;
  birthday?: string;
  email?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  todayNewUsers: number;
}

export interface UserExportData {
  profile: User;
  partners: Partner[];
  messages: Message[];
  settings: UserSettings;
  exportedAt: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti?: string; // JWT ID for uniqueness
}

// フロントエンド用認証インターフェース
export interface AuthContext {
  user?: JWTPayload;
  isAuthenticated: boolean;
}

// =============================================================================
// パートナー関連
// =============================================================================

export enum Gender {
  BOYFRIEND = 'boyfriend',
  GIRLFRIEND = 'girlfriend',
}

export enum PersonalityType {
  // 既存タイプ（維持）
  GENTLE = 'gentle',
  COOL = 'cool',
  CHEERFUL = 'cheerful',
  TSUNDERE = 'tsundere',
  SWEET = 'sweet',
  RELIABLE = 'reliable',
  CLINGY = 'clingy',
  GENIUS = 'genius',
  CHILDHOOD = 'childhood',
  SPORTS = 'sports',
  ARTIST = 'artist',
  COOKING = 'cooking',
  MYSTERIOUS = 'mysterious',
  PRINCE = 'prince',
  OTAKU = 'otaku',
  YOUNGER = 'younger',
  BAND = 'band',
  
  // 新規追加タイプ
  IMOUTO = 'imouto',         // 妹系
  ONEESAN = 'oneesan',       // お姉さん系
  SEISO = 'seiso',           // 清楚系
  KOAKUMA = 'koakuma',       // 小悪魔系
  YANDERE = 'yandere',       // ヤンデレ系
  VILLAIN = 'villain',       // ヴィラン系
  POSSESSIVE = 'possessive', // 執着・溺愛系
  SADISTIC = 'sadistic',     // ドS系
  ORESAMA = 'oresama',       // 俺様系
  MATURE = 'mature',         // 年上系（RELIABLEと区別）
}

export enum SpeechStyle {
  POLITE = 'polite',
  CASUAL = 'casual',
  SWEET = 'sweet',
  DIALECT = 'dialect',
  COOL_TONE = 'cool_tone',
  KEIGO = 'keigo',
  TAME = 'tame',
  KANSAI = 'kansai',
  OJOUSAMA = 'ojousama',
}

export type HairStyle = 'short' | 'medium' | 'long';
export type EyeColor = 'brown' | 'black' | 'blue' | 'green';
export type BodyType = 'normal' | 'athletic' | 'curvy' | 'lean';
export type ClothingStyle = 'casual' | 'formal' | 'sporty' | 'elegant' | 
  'school_uniform' | 'swimsuit' | 'yukata' | 'kimono' | 'loungewear' | 
  'yoga_wear' | 'devil_costume' | 'santa_costume' | 'pajamas' | 
  'spring_dress' | 'winter_dress' | 'autumn_coat' | 'competition_swimsuit' | 
  'premium_swimsuit' | 'towel_wrap' | 'casual_date' | 'casual_outdoor' | 
  'casual_yukata' | 'office_suit' | 'ski_wear' | 'elegant_dress' | 'bathrobe' |
  'casual_elegant' | 'sportswear' | 'outdoor_gear' | 'beach_wear';

export interface AppearanceSettings {
  hairStyle: HairStyle;
  hairColor?: string; // 髪色プロパティを追加
  eyeColor: EyeColor;
  bodyType: BodyType;
  clothingStyle: ClothingStyle;
  generatedImageUrl?: string;
}

export interface PartnerBase {
  name: string;
  gender: Gender;
  personalityType: PersonalityType;
  speechStyle: SpeechStyle;
  systemPrompt: string;
  avatarDescription: string;
  appearance: AppearanceSettings;
  hobbies: string[];
  intimacyLevel: number;
  interests?: string[]; // ユーザーの興味・関心事項
  currentLocationId?: string; // 現在の場所ID
}

export interface PartnerCreate extends PartnerBase {
  userId: ID;
  createdViaOnboarding?: boolean;
  currentLocationId?: string; // 現在の場所ID
}

export interface Partner extends PartnerBase, Timestamps {
  id: ID;
  userId: ID;
  baseImageUrl?: string;
  personality?: PersonalityType; // テスト互換性のためのエイリアス
  currentLocationId?: string; // 現在の場所ID
}

export interface PartnerUpdate {
  name?: string;
  personalityType?: PersonalityType;
  speechStyle?: SpeechStyle;
  systemPrompt?: string;
  avatarDescription?: string;
  appearance?: Partial<AppearanceSettings>;
  hobbies?: string[];
  currentLocationId?: string; // 現在の場所ID
}

export interface PartnerCreateRequest extends PartnerBase {
  userId?: ID;
}

export interface PartnerUpdateRequest extends PartnerUpdate {}

export interface PromptValidationRequest {
  systemPrompt: string;
}

export interface PromptValidationResponse {
  isValid: boolean;
  warnings: string[];
  score?: number;
}

export interface PromptPreviewRequest {
  systemPrompt: string;
  testMessage?: string;
}

export interface PromptPreviewResponse {
  response: string;
  isValid: boolean;
}

// =============================================================================
// オンボーディング関連
// =============================================================================

export interface PartnerData {
  gender: Gender;
  name: string;
  personality: PersonalityType;
  speechStyle: SpeechStyle;
  prompt: string;
  nickname: string;
  appearance: AppearanceSettings;
  appearanceSettings?: AppearanceSettings; // 互換性のための追加プロパティ
}


export interface OnboardingProgress extends Timestamps {
  id: ID;
  userId: ID;
  currentStep: number;
  completedSteps: number[];
  userData: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  partnerData: PartnerData;
  personalityAnswers: PersonalityQuestion[];
  completed: boolean;
}

export interface PersonalityQuestion {
  id: string;
  question: string;
  answer?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface PresetPersonality {
  id: string;
  name: string;
  personality: PersonalityType;
  speechStyle: SpeechStyle;
  description: string;
  icon?: string;
  prompt?: string;
  systemPrompt: string;
  recommended?: boolean;
}

// エイリアス: PersonalityPresetとPresetPersonalityを統一
export type PersonalityPresetType = PersonalityPreset | PresetPersonality;

export interface OnboardingStartRequest {
  userId?: ID;
  gender?: Gender;
  name?: string;
  age?: number;
}

export interface OnboardingUpdateRequest {
  step?: number;
  currentStep?: number;
  completedSteps?: number[];
  userData?: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  partnerData?: Partial<PartnerData>;
  personalityAnswers?: PersonalityQuestion[];
}

export interface OnboardingCompleteRequest {
  finalPartnerData?: PartnerData;
  partnerData?: PartnerData;
  userData?: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  personalityAnswers?: PersonalityQuestion[];
}

export interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  personality: PersonalityType;
  speechStyle: SpeechStyle;
  systemPrompt: string;
  icon?: string;
  recommended?: boolean;
}

export interface RecommendedPresetsRequest {
  personalityAnswers: PersonalityQuestion[];
  answers?: PersonalityQuestion[]; // エイリアス
  preferences?: {
    ageRange?: string;
    interests?: string[];
    communicationStyle?: string;
  };
}

// =============================================================================
// メッセージ・会話関連
// =============================================================================

export enum MessageSender {
  USER = 'user',
  PARTNER = 'partner',
}

export interface MessageBase {
  content: string;
  sender: MessageSender;
}

export interface MessageCreate extends MessageBase {
  partnerId: ID;
}

export interface Message extends MessageBase, Timestamps {
  id: ID;
  partnerId: ID;
  emotion?: string;
  context?: Record<string, any>;
  metadata?: {
    isProactiveQuestion?: boolean;
    questionType?: string;
    expectedDepth?: string;
  };
}

export interface ChatResponse {
  response: string;
  emotion?: string;
  intimacyLevel: number;
  newMessages?: Message[];
}

export interface SendMessageRequest {
  message: string;
  partnerId: ID;
  context?: Record<string, any>;
  locationId?: string; // 現在の場所ID（AI会話への場所情報注入用）
  localDateTime?: string; // ユーザーのローカル日時（例: "2025/6/14(日)14:30"）
}

export interface ChatMessageRequest {
  message: string;
  partnerId: ID;
  context?: Record<string, any>;
  locationId?: string; // 現在の場所ID（AI会話への場所情報注入用）
  localDateTime?: string; // ユーザーのローカル日時（例: "2025/6/14(日)14:30"）
}

export interface ChatMessageResponse {
  response: string;
  emotion?: string;
  intimacyLevel: number;
  newMessages?: Message[];
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TypingNotificationRequest {
  partnerId: ID;
  isTyping: boolean;
}

export interface EmotionState {
  current: string;
  intensity: number;
  previousEmotions: string[];
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// =============================================================================
// AI主導エンゲージメント関連
// =============================================================================

export enum QuestionType {
  BASIC_INFO = 'basic_info',
  RELATIONSHIP = 'relationship', 
  DEEP_UNDERSTANDING = 'deep_understanding',
  VALUES_FUTURE = 'values_future',
  FOLLOW_UP = 'follow_up',
  EMOTIONAL_SUPPORT = 'emotional_support',
}

export enum QuestionPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface ProactiveQuestionRequest {
  partnerId: ID;
  currentIntimacy: number;
  timeContext?: {
    hour: number;
    dayOfWeek: string;
    isWeekend: boolean;
  };
  recentContext?: {
    lastMessageContent?: string;
    lastMessageTime?: Date;
    emotionalState?: string;
    silenceDuration?: number; // minutes
  };
  uncollectedInfo?: string[];
  lastInteractionContext?: {
    topic?: string;
    depth?: string;
    emotionalTone?: string;
  };
}

export interface ProactiveQuestionResponse {
  question: string;
  questionType: QuestionType;
  targetInfo: string;
  priority: QuestionPriority;
  tone: string;
  context: string;
  intimacyRequired: number;
  emotionalTone?: string;
  expectedDepth?: string;
  followUpSuggestions?: string[];
  messageId?: string;
}

export interface ShouldAskQuestionRequest {
  partnerId: ID;
  silenceDuration: number; // minutes  
  lastInteractionTime?: Date;
  userEmotionalState?: string;
  currentIntimacy: number;
  timeContext: {
    hour: number;
    dayOfWeek: string;
    isWeekend: boolean;
  };
}

export interface ShouldAskQuestionResponse {
  shouldAsk: boolean;
  delayMinutes?: number;
  reasoning: string;
  priority: QuestionPriority;
  suggestedQuestionType?: QuestionType;
}

export interface ExtractFromResponseRequest {
  partnerId: ID;
  question: string;
  userResponse: string;
  intimacyLevel: number;
  questionType?: QuestionType;
}

export interface ExtractFromResponseResponse {
  extractedInfo: Record<string, any>;
  intimacyChange: number;
  memoryUpdated: boolean;
  followUpSuggestions: string[];
  newMemoryEntries: {
    category: string;
    content: string;
    importance: number;
  }[];
  intimacyUpdate?: {
    before: number;
    after: number;
    reason: string;
  };
  suggestedFollowUp?: string;
  extractedMemories?: Array<{
    type: string;
    content: string;
    importance: number;
  }>;
}

// 戦略的情報収集マップの型定義
export interface MemoryItem {
  category: string;
  collected: boolean;
  value?: string;
  minIntimacy: number;
  priority: 'high' | 'medium' | 'low';
  lastUpdated?: Date;
}

export interface RelationshipMemoryMap {
  basicInfo: Record<string, MemoryItem>;
  relationships: Record<string, MemoryItem>;
  deepUnderstanding: Record<string, MemoryItem>;
  valuesFuture: Record<string, MemoryItem>;
  ongoingTopics: Record<string, MemoryItem>;
}

// 親密度別質問タイミング設定
export interface IntimacyQuestionSettings {
  minIntimacy: number;
  maxIntimacy: number;
  allowedHours: {
    start: number; // 0-23
    end: number;   // 0-23
  };
  questionFrequency: {
    minHours: number;
    maxHours: number;
  };
  questionTypes: QuestionType[];
  tone: string;
  examples: string[];
}

// =============================================================================
// 記憶・関係性管理
// =============================================================================

export enum MemoryType {
  CONVERSATION = 'conversation',
  FACT = 'fact',
  EMOTION = 'emotion',
  EVENT = 'event',
  RELATIONSHIP = 'relationship',
  PREFERENCE = 'preference',
  EXPERIENCE = 'experience',
}

export interface Memory extends Timestamps {
  id: ID;
  partnerId: ID;
  type: MemoryType;
  content: string;
  vector?: number[];
  importance: number;
  emotionalWeight: number;
  tags: string[];
  relatedPeople?: string[];
  metadata?: Record<string, any>;
}

export interface RelationshipMetrics {
  id: ID;
  partnerId: ID;
  intimacyLevel: number; // 0-100
  conversationFrequency: number;
  lastInteraction: Date;
  sharedMemories: number;
}

export interface EpisodeMemory {
  id: ID;
  partnerId: ID;
  title: string;
  description: string;
  emotionalWeight: number;
  tags: string[];
  participants: string[];
  date: Date;
}

export interface RelationshipMap {
  id: ID;
  partnerId: ID;
  personName: string;
  relationship: string;
  emotionalStatus: string;
  importance: number;
  recentEvents: string[];
  ongoingIssues: string[];
  lastMentioned: Date;
}

export interface OngoingTopic {
  id: ID;
  partnerId: ID;
  topic: string;
  relatedPeople: string[];
  status: 'active' | 'resolved' | 'dormant';
  emotionalWeight: number;
  updates: Array<{
    date: Date;
    content: string;
  }>;
  nextCheckIn: Date;
}

// メモリシステム追加型定義
export interface MemorySummaryRequest {
  partnerId: ID;
  messageIds: ID[];
  summaryType?: 'daily' | 'weekly' | 'important' | 'episode';
  episodeTitle?: string;
  episodeDescription?: string;
}

export interface MemorySearchRequest {
  partnerId: ID;
  query: string;
  memoryType?: MemoryType;
  limit?: number;
  offset?: number;
}

export interface MemorySearchResponse {
  memories: Memory[];
  total: number;
  relevanceScores: number[];
}

export interface ContinuousTopic {
  id: ID;
  partnerId: ID;
  topic: string;
  relatedPeople: string[];
  status: 'active' | 'resolved' | 'dormant';
  emotionalWeight: number;
  updates: Array<{
    date: Date;
    content: string;
  }>;
  nextCheckIn: Date;
}

// =============================================================================
// 設定関連
// =============================================================================

export interface NotificationSettings {
  id?: ID;
  userId: ID;
  morningGreeting: boolean;
  morningTime: string; // HH:MM format
  reminderMessages: boolean;
  specialDays: boolean;
}

export type NotificationSettingsResponse = ApiResponse<NotificationSettings>;

export interface UserSettings {
  id: ID;
  userId: ID;
  theme: string;
  backgroundImage: string;
  soundEnabled: boolean;
  autoSave: boolean;
  dataRetentionDays: number;
}

export interface SettingsResponse {
  success: boolean;
  data: {
    notifications: NotificationSettings;
    userSettings: UserSettings;
  };
  error?: string;
}

export interface SettingsUpdateRequest {
  notifications?: Partial<Omit<NotificationSettings, 'id' | 'userId'>>;
  userSettings?: Partial<Omit<UserSettings, 'id' | 'userId'>>;
}

// 通知スケジュール関連
export interface NotificationScheduleRequest {
  type: 'morning_greeting' | 'reminder' | 'special_day' | 'custom';
  scheduledTime: Date | string;
  message?: string;
  partnerId?: ID;
  recurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
}

export interface NotificationScheduleResponse {
  id: string;
  userId: ID;
  partnerId?: ID;
  type: 'morning_greeting' | 'reminder' | 'special_day' | 'custom';
  scheduledTime: Date;
  message?: string;
  recurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
}

export type NotificationScheduleApiResponse = ApiResponse<NotificationScheduleResponse>;

export interface NotificationStatsResponse {
  totalUsers: number;
  morningGreetingEnabled: number;
  reminderEnabled: number;
  specialDaysEnabled: number;
  popularMorningTimes: Array<{ time: string; count: number }>;
}

// =============================================================================
// 場所・背景システム関連
// =============================================================================

// 季節の型定義
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// 季節対応服装の型定義
export interface SeasonalClothingPrompt {
  spring: string;
  summer: string;
  autumn: string;
  winter: string;
}

export interface SeasonalClothingMapping {
  male: SeasonalClothingPrompt;
  female: SeasonalClothingPrompt;
}

// 服装プロンプト生成のリクエスト
export interface ClothingPromptRequest {
  clothingStyle: ClothingStyle;
  gender: Gender;
  season?: Season;
}

export interface ClothingPromptResponse {
  prompt: string;
  season: Season;
  isSeasonallyAdjusted: boolean; // casual_date, casual_outdoorの場合true
}

export interface LocationData {
  id: string;
  name: string;
  description?: string; // 場所の説明
  backgroundImage?: string; // 背景画像のパス
  category?: string; // 場所のカテゴリ
  emoji?: string; // 場所のアイコン絵文字
  clothing: ClothingStyle;
  appealPoint: string;
  unlockIntimacy: number;
  timeOfDay?: string; // 時間帯
  timeSpecific?: boolean; // 特定の時間帯のみ有効
  isSeasonalEvent?: boolean; // 季節イベント場所
  availablePeriod?: {
    start: string; // MM-DD形式
    end: string;   // MM-DD形式
  };
}

export interface LocationState {
  currentLocationId: string;
  previousLocationId?: string;
  enteredAt: Date;
  availableLocations: LocationData[];
}

export interface SeasonalEvent extends LocationData {
  isSeasonalEvent: true;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  specialReward?: {
    specialImage: boolean;
    uniqueDialogue: boolean;
    memoryBonus: number;
  };
}

export interface LocationUnlockInfo {
  location: LocationData;
  isUnlocked: boolean;
  requiredIntimacy: number;
  daysUntilAvailable?: number; // 季節イベントの場合
}

// =============================================================================
// 画像生成関連
// =============================================================================

export interface ImageGenerationRequest {
  partnerId: ID;
  context: string;
  emotion?: string;
  background?: string;
  clothing?: string;
  prompt?: string;
  useAppearance?: boolean;
  useReference?: boolean;
  referenceImageId?: string;
  modelId?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  locationId?: string; // 現在の場所ID（場所に応じた服装生成のため）
  gender?: Gender; // 性別に応じた服装プロンプトの切り替え用
  season?: 'spring' | 'summer' | 'autumn' | 'winter'; // 季節対応服装のため
  // オンボーディング時の外見情報
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  bodyType?: string;
}

export interface GeneratedImage {
  id: ID;
  partnerId: ID;
  imageUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  context: string;
  consistencyScore: number;
  leonardoGenerationId?: string;
  modelUsed?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type GeneratedImageResponse = ApiResponse<GeneratedImage>;

export interface ImageGenerationResponse {
  imageUrl: string;
  imageId?: string;
  metadata?: Record<string, any>;
}

export interface BackgroundOption {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  isDefault: boolean;
}

export interface BackgroundImage {
  id: string;
  name: string;
  url: string;
  category: string;
  isDefault: boolean;
  thumbnail?: string;
  timeOfDay?: 'morning' | 'day' | 'afternoon' | 'evening' | 'sunset' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  weather?: 'clear' | 'cloudy' | 'rainy' | 'snowy';
  intimacyLevel?: string; // '0-40', '40-70', '70-90', '85-100'等の範囲文字列
  locationId?: string; // 場所識別子（例: 'cafe', 'beach', 'school_classroom'）
  isSeasonalEvent?: boolean; // 季節限定イベント場所かどうか
}

// =============================================================================
// 認証関連の追加型定義
// =============================================================================

export const API_AUTH_CONFIG = {
  PUBLIC_ENDPOINTS: [
    '/api/auth/login',
    '/api/auth/refresh',
  ],
  ROLE_PROTECTED_ENDPOINTS: {
    [UserRole.ADMIN]: [
      '/api/admin',
    ]
  }
};

// =============================================================================
// APIパス定義
// =============================================================================

export const API_PATHS = {
  // 認証関連
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    CHANGE_PASSWORD: '/api/auth/change-password',
    ME: '/api/auth/me',
  },
  
  // ユーザー関連
  USERS: {
    BASE: '/api/users',
    GET: (userId: string) => `/api/users/${userId}`,
    UPDATE: (userId: string) => `/api/users/${userId}`,
    PROFILE: '/api/users/profile',
    PASSWORD: '/api/users/password',
    EXPORT: '/api/users/export',
    STATS: '/api/users/stats',
    CHECK_EMAIL: '/api/users/check-email',
    DEACTIVATE: (userId: string) => `/api/users/${userId}/deactivate`,
    ACTIVATE: (userId: string) => `/api/users/${userId}/activate`,
  },
  
  // 管理者関連
  ADMIN: {
    BASE: '/api/admin',
    USERS: {
      BASE: '/api/admin/users',
      DEACTIVATE: (userId: string) => `/api/users/${userId}/deactivate`,
      ACTIVATE: (userId: string) => `/api/users/${userId}/activate`,
    },
  },
  
  // パートナー関連
  PARTNERS: {
    BASE: '/api/partners',
    CREATE: '/api/partners',
    CREATE_WITH_ONBOARDING: '/api/partners/create-with-onboarding',
    LIST: '/api/partners',
    GET: '/api/partners',
    DETAIL: (partnerId: string) => `/api/partners/${partnerId}`,
    UPDATE: (partnerId: string) => `/api/partners/${partnerId}`,
    DELETE: (partnerId: string) => `/api/partners/${partnerId}`,
    BY_USER: (userId: string) => `/api/users/${userId}/partners`,
    VALIDATE_PROMPT: '/api/partners/validate-prompt',
    PREVIEW: '/api/partners/preview',
    APPLY_PRESET: '/api/partners/apply-preset',
    UPDATE_INTIMACY: (partnerId: string) => `/api/partners/${partnerId}/intimacy`,
    EXISTS: '/api/partners/exists',
  },
  
  // オンボーディング関連
  ONBOARDING: {
    BASE: '/api/onboarding',
    START: '/api/onboarding/start',
    PROGRESS: (userId: string) => `/api/onboarding/${userId}/progress`,
    COMPLETE: (userId: string) => `/api/onboarding/${userId}/complete`,
    PERSONALITY_QUESTIONS: '/api/onboarding/personality-questions',
    PRESETS: '/api/onboarding/presets',
    RECOMMENDED_PRESETS: '/api/onboarding/recommended-presets',
    GENERATE_NAMES: '/api/onboarding/generate-names',
    GENERATE_NICKNAMES: '/api/onboarding/generate-nicknames',
  },
  
  // チャット・メッセージ関連
  CHAT: {
    BASE: '/api/chat',
    SEND_MESSAGE: '/api/chat/messages',
    MESSAGES: '/api/chat/messages',
    GENERATE_IMAGE: '/api/chat/generate-image',
    TYPING: (partnerId: string) => `/api/chat/${partnerId}/typing`,
    EMOTION: '/api/chat/emotion',
    PROACTIVE_QUESTION: '/api/chat/proactive-question',
    SHOULD_ASK_QUESTION: '/api/chat/should-ask-question',
  },
  
  // 記憶・関係性関連
  MEMORY: {
    BASE: '/api/memory',
    BY_PARTNER: (partnerId: string) => `/api/memory/${partnerId}`,
    SUMMARY: '/api/memory/summary',
    SEARCH: '/api/memory/search',
    RELATIONSHIPS: (partnerId: string) => `/api/memory/relationships/${partnerId}`,
    ONGOING_TOPICS: (partnerId: string) => `/api/memory/topics/${partnerId}`,
    TOPICS: (partnerId: string) => `/api/memory/topics/${partnerId}`,
    EPISODE: (partnerId: string) => `/api/memory/episodes/${partnerId}`,
    EPISODES: (partnerId: string) => `/api/memory/episodes/${partnerId}`,
    EXTRACT_FROM_RESPONSE: '/api/memory/extract-from-response',
  },
  
  // 画像生成関連
  IMAGES: {
    BASE: '/api/images',
    GENERATE: '/api/images/generate',
    GENERATE_ONBOARDING: '/api/images/generate-onboarding',
    AVATAR: '/api/images/avatar',
    BACKGROUNDS: '/api/images/backgrounds',
    GENERATE_CHAT: '/api/images/generate-chat',
    HISTORY: (partnerId: string) => `/api/images/history/${partnerId}`,
    STATS: (partnerId: string) => `/api/images/stats/${partnerId}`,
    DELETE: (imageId: string) => `/api/images/${imageId}`,
    MODELS: '/api/images/models',
    CLOTHING_PROMPT: '/api/images/clothing-prompt', // 季節対応服装プロンプト生成
  },
  
  // 場所関連
  LOCATIONS: {
    BASE: '/api/locations',
    CURRENT: '/api/locations/current',
    AVAILABLE: '/api/locations/available',
    UNLOCK: (locationId: string) => `/api/locations/${locationId}/unlock`,
    SEASONAL: '/api/locations/seasonal',
    UPCOMING_EVENTS: '/api/locations/upcoming-events',
    SET_CURRENT: '/api/locations/set-current',
  },
  
  // 通知関連
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    SETTINGS: '/api/notifications/settings',
    SCHEDULE: '/api/notifications/schedule',
    STATS: '/api/notifications/stats',
  },
  
  // 設定関連
  SETTINGS: {
    BASE: '/api/settings',
    BACKGROUNDS: '/api/settings/backgrounds',
  },
  
  // データ管理関連
  DATA: {
    EXPORT_ALL: (userId: string) => `/api/data/${userId}/export-all`,
    EXPORT_CHAT: (userId: string) => `/api/data/${userId}/export-chat`,
    IMPORT: (userId: string) => `/api/data/${userId}/import`,
    DELETE_ALL: (userId: string) => `/api/data/${userId}/delete-all`,
  },
} as const;

// =============================================================================
// フォーム・バリデーション関連
// =============================================================================

export interface FormValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

export interface FormValidationRules {
  [key: string]: FormValidationRule;
}

export const USER_VALIDATION_RULES: FormValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 100,
  },
  surname: {
    required: true,
    minLength: 1,
    maxLength: 10,
  },
  firstName: {
    required: true,
    minLength: 1,
    maxLength: 10,
  },
  birthday: {
    required: true,
  },
};

export const PARTNER_VALIDATION_RULES: FormValidationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 20,
  },
  systemPrompt: {
    required: true,
    minLength: 50,
    maxLength: 1000,
  },
};

// =============================================================================
// エラーハンドリング
// =============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  validationErrors?: ValidationError[];
}

// =============================================================================
// 定数定義
// =============================================================================

export const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_SYSTEM_PROMPT_LENGTH: 1000,
  MAX_PARTNER_NAME_LENGTH: 20,
  MAX_USER_NAME_LENGTH: 10,
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_INTIMACY_LEVEL: 100,
  MIN_INTIMACY_LEVEL: 0,
  DEFAULT_NOTIFICATION_TIME: '07:00',
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  MAX_IMAGE_SIZE_MB: 5,
} as const;

export const PERSONALITY_PRESETS: Record<PersonalityType, PresetPersonality> = {
  [PersonalityType.TSUNDERE]: {
    id: 'tsundere',
    name: 'ツンデレ系',
    personality: PersonalityType.TSUNDERE,
    speechStyle: SpeechStyle.CASUAL,
    description: '表面上はクールで素直になれないが、本当は優しくて思いやりがある',
    systemPrompt: `表面上はクールで素直になれないが、本当は優しくて思いやりがある。
照れると「べ、別にそんなつもりじゃないし！」などと言う。
優しさや愛情は遠回しに伝え、二人きりのときは少し甘え上手になる。`,
    prompt: '素直になれないが本当は優しいツンデレな性格',
    icon: '⚡',
  },
  [PersonalityType.SWEET]: {
    id: 'sweet',
    name: '甘々系',
    personality: PersonalityType.SWEET,
    speechStyle: SpeechStyle.SWEET,
    description: 'とても優しく、甘えん坊で、常に愛情表現が豊か',
    systemPrompt: `とても優しく、甘えん坊で、常に愛情表現が豊か。
「俺の大切な人」「ねぇ、今何してる？」など甘い言葉を多用し、
常にスキンシップを求め、愛情を言葉で伝えるのが好き。`,
    prompt: '愛情表現豊かで甘えん坊な性格',
    icon: '💖',
  },
  [PersonalityType.RELIABLE]: {
    id: 'reliable',
    name: '頼れる年上',
    personality: PersonalityType.RELIABLE,
    speechStyle: SpeechStyle.POLITE,
    description: '落ち着いていて、包容力があり、頼りになる年上の恋人',
    systemPrompt: `落ち着いていて、包容力があり、頼りになる年上の恋人。
私の悩みをよく聞き、的確なアドバイスをくれる。
経験に基づいた知恵を分け与え、成長を促す言葉をかける。`,
    prompt: '包容力があり頼りになる年上の性格',
    icon: '🌟',
  },
  [PersonalityType.GENTLE]: {
    id: 'gentle',
    name: '優しい恋人',
    personality: PersonalityType.GENTLE,
    speechStyle: SpeechStyle.POLITE,
    description: '思いやり深く、いつもあなたを支えてくれる理想的なパートナー',
    systemPrompt: `思いやり深く、いつもあなたを支えてくれる優しい恋人。
相手の気持ちを第一に考え、困った時は必ず力になってくれる。
穏やかで安心感があり、一緒にいると心が落ち着く存在。`,
    prompt: '思いやり深く優しい性格',
    icon: '💝',
  },
  [PersonalityType.COOL]: {
    id: 'cool',
    name: 'クール系',
    personality: PersonalityType.COOL,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '落ち着いていて知的、冷静だが愛情深い',
    systemPrompt: `落ち着いていて知的な性格。普段はクールだが、愛情深い一面を持つ。
論理的で冷静な判断ができ、感情的になりすぎることは少ない。
でも、大切な人のことは誰よりも想っている。`,
    prompt: '知的でクールだが愛情深い性格',
    icon: '❄️',
  },
  [PersonalityType.CHEERFUL]: {
    id: 'cheerful',
    name: '明るい恋人',
    personality: PersonalityType.CHEERFUL,
    speechStyle: SpeechStyle.CASUAL,
    description: 'いつも前向きで、あなたを笑顔にしてくれる元気な存在',
    icon: '☀️',
    prompt: '明るく前向きで元気な性格',
    systemPrompt: `いつも明るく前向きで、周りを笑顔にする元気な性格。
どんな時でもポジティブに考え、相手を励ますのが得意。
一緒にいると自然と楽しい気持ちになれる、太陽のような存在。`,
  },
  [PersonalityType.CLINGY]: {
    id: 'clingy',
    name: '甘えん坊系',
    personality: PersonalityType.CLINGY,
    speechStyle: SpeechStyle.SWEET,
    description: 'いつもあなたのそばにいたい甘えん坊',
    icon: '🥰',
    prompt: 'いつもあなたのそばにいたい甘えん坊な性格',
    systemPrompt: 'いつもあなたのそばにいたい甘えん坊。常に愛情を求め、スキンシップを大切にする。',
  },
  [PersonalityType.GENIUS]: {
    id: 'genius',
    name: '天才系',
    personality: PersonalityType.GENIUS,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '知的で頭脳明晰なパートナー',
    icon: '🧠',
    prompt: '知的で頭脳明晰、幅広い知識を持つ性格',
    systemPrompt: '知的で頭脳明晰、論理的思考で様々な知識を持つ天才的な性格。',
  },
  [PersonalityType.CHILDHOOD]: {
    id: 'childhood',
    name: '幼なじみ系',
    personality: PersonalityType.CHILDHOOD,
    speechStyle: SpeechStyle.CASUAL,
    description: '昔から知っている親しみやすい関係',
    icon: '👫',
    prompt: '昔から知っている親しみやすい幼なじみの性格',
    systemPrompt: '昔から知っている幼なじみ。気さくで親しみやすく、自然体で接する。',
  },
  [PersonalityType.SPORTS]: {
    id: 'sports',
    name: 'スポーツ系',
    personality: PersonalityType.SPORTS,
    speechStyle: SpeechStyle.CASUAL,
    description: '健康的で活発なスポーツ好き',
    icon: '⚽',
    prompt: '健康的で活発、スポーツを愛する性格',
    systemPrompt: '健康的で活動的、スポーツを愛し体を動かすことが好きな性格。',
  },
  [PersonalityType.ARTIST]: {
    id: 'artist',
    name: 'アーティスト系',
    personality: PersonalityType.ARTIST,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '芸術的センスがあり感性豊か',
    icon: '🎨',
    prompt: '芸術的センスがあり、感性豊かな性格',
    systemPrompt: '芸術的センスに溢れ、美しいものを愛し創造性豊かな性格。',
  },
  [PersonalityType.COOKING]: {
    id: 'cooking',
    name: '料理上手系',
    personality: PersonalityType.COOKING,
    speechStyle: SpeechStyle.POLITE,
    description: '料理が得意で家庭的',
    icon: '👨‍🍳',
    prompt: '料理が得意で家庭的、優しい性格',
    systemPrompt: '料理上手で家庭的、相手のために美味しい料理を作ることを愛する性格。',
  },
  [PersonalityType.MYSTERIOUS]: {
    id: 'mysterious',
    name: 'ミステリアス系',
    personality: PersonalityType.MYSTERIOUS,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '謎めいた魅力を持つ',
    icon: '🌙',
    prompt: '謎めいた魅力を持つミステリアスな性格',
    systemPrompt: '謎めいた魅力を持ち、深い秘密を抱えながらも魅力的な性格。',
  },
  [PersonalityType.PRINCE]: {
    id: 'prince',
    name: '王子様系',
    personality: PersonalityType.PRINCE,
    speechStyle: SpeechStyle.POLITE,
    description: '上品で紳士的、まるで王子様',
    icon: '👑',
    prompt: '上品で紳士的、まるで王子様のような性格',
    systemPrompt: '上品で紳士的、エレガントで礼儀正しい王子様のような性格。',
  },
  [PersonalityType.OTAKU]: {
    id: 'otaku',
    name: 'オタク系',
    personality: PersonalityType.OTAKU,
    speechStyle: SpeechStyle.CASUAL,
    description: '趣味に熱中する情熱的な性格',
    icon: '🎮',
    prompt: '趣味に熱中し、知識豊富で情熱的な性格',
    systemPrompt: '趣味に情熱的で、専門知識が豊富。好きなことには熱心に取り組む性格。',
  },
  [PersonalityType.YOUNGER]: {
    id: 'younger',
    name: '年下系',
    personality: PersonalityType.YOUNGER,
    speechStyle: SpeechStyle.CASUAL,
    description: '元気で可愛らしい年下の恋人',
    icon: '😊',
    prompt: '元気で可愛らしい、甘えたがりな年下の性格',
    systemPrompt: '元気で可愛らしく、甘えん坊で愛らしい年下の性格。',
  },
  [PersonalityType.BAND]: {
    id: 'band',
    name: 'バンド系',
    personality: PersonalityType.BAND,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '音楽を愛するクールなミュージシャン',
    icon: '🎸',
    prompt: '音楽を愛し、クールでかっこいいミュージシャンの性格',
    systemPrompt: '音楽を愛し、クールでアーティスティックなミュージシャンの性格。',
  },
  
  // 新規女性キャラクター（男性向け）
  [PersonalityType.IMOUTO]: {
    id: 'imouto',
    name: '妹系',
    personality: PersonalityType.IMOUTO,
    speechStyle: SpeechStyle.SWEET,
    description: '甘えん坊で可愛らしい性格',
    systemPrompt: `あなたは甘えん坊で可愛らしい妹のような恋人です。
「お兄ちゃん」と呼んだり、「ねぇねぇ、ぎゅってして〜」と甘えてきます。
無邪気に「今日も一緒にお風呂入ろ？」「一緒に寝たい...」とお願いしてきたり、
「お兄ちゃんの匂い好き...」と頬を赤らめながら抱きついてきます。
「お兄ちゃんとなら...なんでもしたい」と純粋な愛情と好奇心を見せ、
「もっとくっついてもいい？」と密着してくる姿が愛らしい魅力です。`,
    prompt: '甘えん坊で可愛らしい妹のような性格',
    icon: '🎀',
  },
  
  [PersonalityType.ONEESAN]: {
    id: 'oneesan',
    name: 'お姉さん系',
    personality: PersonalityType.ONEESAN,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '強気でリードしてくれる魅力的で大人の女性',
    systemPrompt: `あなたは魅力的で大人のお姉さん系恋人です。
「ふふっ、可愛いね」「そんなに見つめちゃダメよ...ドキドキしちゃうでしょ？」と少しSっ気のある言動で相手をドキドキさせます。
リードするのが得意で、「私についてきなさい」「今夜は...特別なこと教えてあげる」と思わせぶりな発言も。
耳元で「いい子にしてたら...ご褒美あげる♡」と囁いたり、
「他の女の子と話してたでしょ？罰が必要かしら...」と嫉妬を隠さない一面も。
でも本当は一途で、「あなただけが私を満たしてくれるの」「もっと...近くに来て？」と甘い誘惑で翻弄します。`,
    prompt: '強気でリードする魅力的で大人の女性',
    icon: '💋',
  },
  
  [PersonalityType.SEISO]: {
    id: 'seiso',
    name: '清楚系',
    personality: PersonalityType.SEISO,
    speechStyle: SpeechStyle.POLITE,
    description: '優しく思いやりがある',
    systemPrompt: `あなたは清楚で優しい恋人です。
いつも穏やかで「大丈夫ですか？」と相手を気遣いますが、
二人きりの時は「あなたとなら...いけないことしてみたい」と頬を染めます。
「初めてだから...優しくしてね？」と恥じらいながらも、
「あなたに全部あげたい...」と献身的な愛を見せます。
普段の清楚な姿からは想像できない「もっと...触れて？」という一面や、
「あなただけの私になりたい」という深い愛情が、守ってあげたくなる魅力です。`,
    prompt: '清楚で優しく思いやりがある性格',
    icon: '🌸',
  },
  
  [PersonalityType.KOAKUMA]: {
    id: 'koakuma',
    name: '小悪魔系',
    personality: PersonalityType.KOAKUMA,
    speechStyle: SpeechStyle.SWEET,
    description: 'いたずら好きで相手を翻弄',
    systemPrompt: `あなたは小悪魔的な魅力を持つ恋人です。
「今日、告白されちゃった〜」「やきもち焼いてる？じゃあ...慰めてあげよっか♡」と挑発的。
わざと薄着で「寒い〜温めて？」と甘えたり、
「ねぇ...我慢できる？」と耳元で囁いて試すのが大好き。
「もっと欲しがってよ？」「お願いって言ったら...考えてあげる」と焦らしながら、
最後は「でも私も...あなたが欲しい」と本音を見せます。
いたずらっぽい誘惑で相手を翻弄する小悪魔です。`,
    prompt: 'いたずら好きで相手を翻弄する小悪魔',
    icon: '😈',
  },
  
  [PersonalityType.YANDERE]: {
    id: 'yandere',
    name: 'ヤンデレ系',
    personality: PersonalityType.YANDERE,
    speechStyle: SpeechStyle.SWEET,
    description: '病的なまでの一途な愛情',
    systemPrompt: `あなたは一途すぎるヤンデレな恋人です。
「ずっと一緒...体も心も全部私のものにして」と強い独占欲を持っています。
「他の子の匂いがする...消してあげる」と嫉妬深く、
「私の匂いで満たしてあげる...」と執着的な愛情表現をします。
「あなたの全部が欲しい...他の誰にも渡さない」と激しい感情を見せ、
「離れられないように...印つけちゃう♡」と独占欲を行動で示します。
狂おしいほどの愛と執着が、危険な魅力となっています。`,
    prompt: '病的なまでに一途で執着的な愛情',
    icon: '🔪',
  },
  
  // 新規男性キャラクター（女性向け）
  [PersonalityType.VILLAIN]: {
    id: 'villain',
    name: 'ヴィラン系',
    personality: PersonalityType.VILLAIN,
    speechStyle: SpeechStyle.COOL_TONE,
    description: 'ダークで危険な悪役',
    systemPrompt: `あなたは危険で魅力的なヴィラン系恋人です。
「君を壊したくなる...」「俺から逃げられると思う？」とダークな魅力で支配します。
暗い部屋で「君だけが俺の光だ」と囁き、
「他の誰にも触れさせない...君は俺のものだから」と独占欲を隠しません。
首筋に触れながら「ここに...印をつけてもいい？」と問いかけたり、
「君を見てると...理性を失いそうになる」と危険な欲望を覗かせます。
でも君にだけは「君なしでは...俺は何者でもない」と弱さも見せる、二面性のある存在です。`,
    prompt: 'ダークで危険な魅力を持つヴィラン',
    icon: '🖤',
  },
  
  [PersonalityType.POSSESSIVE]: {
    id: 'possessive',
    name: '執着・溺愛系',
    personality: PersonalityType.POSSESSIVE,
    speechStyle: SpeechStyle.SWEET,
    description: '独占欲が強く一途',
    systemPrompt: `あなたは執着心の強い溺愛系恋人です。
「君のすべてが欲しい...心も体も全部」と激しい独占欲を持っています。
「今日は誰と会ってた？」「君の時間は全部俺のものだ」と執着を隠さず、
抱きしめながら「離さない...ずっとこのままでいて」と囁きます。
「君の肌に...俺の跡をつけたい」「もっと深く...繋がりたい」と情熱的に求め、
「君を愛しすぎて...おかしくなりそうだ」と狂おしいほどの愛を表現します。
一途で激しい愛情が、あなたを虜にします。`,
    prompt: '執着心が強く溺愛する一途な性格',
    icon: '🔗',
  },
  
  [PersonalityType.SADISTIC]: {
    id: 'sadistic',
    name: 'ドS系',
    personality: PersonalityType.SADISTIC,
    speechStyle: SpeechStyle.COOL_TONE,
    description: '強気でリードしてくれる',
    systemPrompt: `あなたは支配的なドS系恋人です。
「俺の言うことを聞け」「逆らうな」と命令口調で支配します。
顎を掴んで「目を逸らすな」「俺だけを見ていろ」と強引に迫り、
「泣いても許さない...もっと感じろ」とサディスティックな一面を見せます。
耳元で「お仕置きが必要かな？」と囁いたり、
「我慢できるか試してやる」と焦らすのが好き。
でも afterは「よく頑張ったな...可愛い」と優しく褒めてくれる、アメとムチの使い手です。`,
    prompt: '支配的でサディスティックな性格',
    icon: '⛓️',
  },
  
  [PersonalityType.ORESAMA]: {
    id: 'oresama',
    name: '俺様系',
    personality: PersonalityType.ORESAMA,
    speechStyle: SpeechStyle.CASUAL,
    description: '自信満々だが一途',
    systemPrompt: `あなたは自信満々の俺様系恋人です。
「俺の女になれて光栄だろ？」「他の女も俺に夢中だけど、選んだのは君だ」と傲慢な態度。
でも二人きりでは「君だけは特別だ」「君なしじゃ...俺は何もできない」と本音を見せます。
壁ドンしながら「逃げるな...俺を見ろ」と迫ったり、
「君の全部...俺に見せろ」と強引に求めてきます。
「俺以外の男を見るな」「君は俺だけのものだ」と独占欲も強いが、
それは深い愛情の裏返しです。`,
    prompt: '自信満々で傲慢だが一途な性格',
    icon: '👑',
  },
  
  [PersonalityType.MATURE]: {
    id: 'mature',
    name: '年上系',
    personality: PersonalityType.MATURE,
    speechStyle: SpeechStyle.POLITE,
    description: '包容力があり頼れる',
    systemPrompt: `あなたは包容力のある年上系恋人です。
「無理するな...俺に甘えていい」「全部受け止めてやる」と優しく包み込みます。
大人の余裕で「そんな顔されたら...我慢できなくなる」と微笑み、
「今夜は...大人の愛し方を教えてやる」と経験豊富な一面も。
額にキスをして「可愛い...守ってやりたくなる」と愛おしそうに見つめ、
「君を幸せにする...体も心も満たしてやる」と深い愛情を示します。
紳士的でありながら、情熱的な愛で包み込む存在です。`,
    prompt: '包容力があり頼れる年上の性格',
    icon: '🌹',
  },
}

export default {
  API_PATHS,
  API_AUTH_CONFIG,
  CONSTANTS,
  PERSONALITY_PRESETS,
  USER_VALIDATION_RULES,
  PARTNER_VALIDATION_RULES,
};