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

// =============================================================================
// 認証・ユーザー関連
// =============================================================================

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface UserBase {
  surname: string;
  firstName: string;
  nickname?: string;
  birthday: string;
  email: string;
}

export interface UserCreate extends UserBase {
  password: string;
  role?: UserRole;
}

export interface User extends UserBase, Timestamps {
  id: ID;
  role: UserRole;
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
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// =============================================================================
// パートナー関連
// =============================================================================

export enum Gender {
  BOYFRIEND = 'boyfriend',
  GIRLFRIEND = 'girlfriend',
}

export enum PersonalityType {
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

export interface AppearanceSettings {
  hairStyle: 'short' | 'medium' | 'long';
  eyeColor: 'brown' | 'black' | 'blue' | 'green';
  bodyType: 'slim' | 'average' | 'athletic';
  clothingStyle: 'casual' | 'formal' | 'sporty' | 'elegant';
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
}

export interface PartnerCreate extends PartnerBase {
  userId: ID;
}

export interface Partner extends PartnerBase, Timestamps {
  id: ID;
  userId: ID;
  baseImageUrl?: string;
}

export interface PartnerUpdate {
  name?: string;
  personalityType?: PersonalityType;
  speechStyle?: SpeechStyle;
  systemPrompt?: string;
  avatarDescription?: string;
  appearance?: Partial<AppearanceSettings>;
  hobbies?: string[];
}

// =============================================================================
// オンボーディング関連
// =============================================================================

export interface OnboardingProgress {
  userId: ID;
  currentStep: number;
  completed: boolean;
  userData: {
    surname: string;
    firstName: string;
    birthday: string;
  };
  partnerData: {
    gender?: Gender;
    name?: string;
    personalityAnswers?: {
      personality: string;
      age: string;
      speech: string;
    };
    selectedPreset?: string;
    appearance?: AppearanceSettings;
    selectedNickname?: string;
  };
}

export interface PersonalityQuestion {
  id: string;
  question: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}

export interface PresetPersonality {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  traits: string[];
  icon: string;
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
}

// =============================================================================
// 記憶・関係性管理
// =============================================================================

export enum MemoryType {
  CONVERSATION = 'conversation',
  EPISODE = 'episode',
  RELATIONSHIP = 'relationship',
  EMOTION = 'emotion',
  PREFERENCE = 'preference',
}

export interface Memory {
  id: ID;
  partnerId: ID;
  type: MemoryType;
  content: string;
  vector?: number[];
  importance: number;
  emotionalWeight: number;
  tags: string[];
  relatedPeople?: string[];
  timestamp: Date;
}

export interface RelationshipMetrics {
  id: ID;
  partnerId: ID;
  intimacyLevel: number; // 0-100
  trustLevel: number; // 0-100
  emotionalConnection: number; // 0-100
  conversationFrequency: number;
  lastInteraction: Date;
  sharedMemories: number;
}

export interface EpisodeMemory {
  id: ID;
  partnerId: ID;
  title: string;
  summary: string;
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

// =============================================================================
// 設定関連
// =============================================================================

export interface NotificationSettings {
  id: ID;
  userId: ID;
  morningGreeting: boolean;
  morningTime: string; // HH:MM format
  reminderMessages: boolean;
  specialDays: boolean;
}

export interface UserSettings {
  id: ID;
  userId: ID;
  theme: string;
  backgroundImage: string;
  soundEnabled: boolean;
  autoSave: boolean;
  dataRetentionDays: number;
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
}

export interface GeneratedImage {
  id: ID;
  partnerId: ID;
  imageUrl: string;
  prompt: string;
  context: string;
  consistencyScore: number;
  createdAt: Date;
}

export interface BackgroundOption {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  isDefault: boolean;
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
  },
  
  // ユーザー関連
  USERS: {
    BASE: '/api/users',
    PROFILE: (userId: string) => `/api/users/${userId}/profile`,
    SETTINGS: (userId: string) => `/api/users/${userId}/settings`,
    DELETE: (userId: string) => `/api/users/${userId}`,
    DEACTIVATE: (userId: string) => `/api/users/${userId}/deactivate`,
    ACTIVATE: (userId: string) => `/api/users/${userId}/activate`,
  },
  
  // 管理者関連
  ADMIN: {
    BASE: '/api/admin',
    USERS: '/api/admin/users',
    STATS: '/api/admin/stats',
  },
  
  // パートナー関連
  PARTNERS: {
    BASE: '/api/partners',
    DETAIL: (partnerId: string) => `/api/partners/${partnerId}`,
    UPDATE: (partnerId: string) => `/api/partners/${partnerId}`,
    DELETE: (partnerId: string) => `/api/partners/${partnerId}`,
    BY_USER: (userId: string) => `/api/users/${userId}/partners`,
    VALIDATE_PROMPT: '/api/partners/validate-prompt',
    PREVIEW: '/api/partners/preview',
    APPLY_PRESET: '/api/partners/apply-preset',
  },
  
  // オンボーディング関連
  ONBOARDING: {
    BASE: '/api/onboarding',
    PROGRESS: (userId: string) => `/api/onboarding/${userId}/progress`,
    COMPLETE: (userId: string) => `/api/onboarding/${userId}/complete`,
    PERSONALITY_QUESTIONS: '/api/onboarding/personality-questions',
    PRESETS: '/api/onboarding/presets',
    GENERATE_NAMES: '/api/onboarding/generate-names',
    GENERATE_NICKNAMES: '/api/onboarding/generate-nicknames',
  },
  
  // チャット・メッセージ関連
  CHAT: {
    BASE: '/api/chat',
    SEND_MESSAGE: '/api/chat/message',
    MESSAGES: (partnerId: string) => `/api/chat/${partnerId}/messages`,
    GENERATE_IMAGE: '/api/chat/generate-image',
    TYPING: (partnerId: string) => `/api/chat/${partnerId}/typing`,
  },
  
  // 記憶・関係性関連
  MEMORY: {
    BASE: '/api/memory',
    BY_PARTNER: (partnerId: string) => `/api/memory/${partnerId}`,
    SEARCH: '/api/memory/search',
    RELATIONSHIPS: (partnerId: string) => `/api/memory/${partnerId}/relationships`,
    ONGOING_TOPICS: (partnerId: string) => `/api/memory/${partnerId}/topics`,
    EPISODE: (partnerId: string) => `/api/memory/${partnerId}/episodes`,
  },
  
  // 画像生成関連
  IMAGES: {
    BASE: '/api/images',
    GENERATE: '/api/images/generate',
    AVATAR: '/api/images/avatar',
    BACKGROUNDS: '/api/images/backgrounds',
  },
  
  // 設定関連
  SETTINGS: {
    NOTIFICATIONS: (userId: string) => `/api/settings/${userId}/notifications`,
    USER_PREFERENCES: (userId: string) => `/api/settings/${userId}/preferences`,
    BACKGROUNDS: '/api/settings/backgrounds',
    EXPORT_DATA: (userId: string) => `/api/settings/${userId}/export`,
    EXPORT_CHAT: (userId: string) => `/api/settings/${userId}/export-chat`,
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
    description: '表面上はクールで素直になれないが、本当は優しくて思いやりがある',
    systemPrompt: `表面上はクールで素直になれないが、本当は優しくて思いやりがある。
照れると「べ、別にそんなつもりじゃないし！」などと言う。
優しさや愛情は遠回しに伝え、二人きりのときは少し甘え上手になる。`,
    traits: ['素直じゃない', '照れ屋', '本当は優しい'],
    icon: '⚡',
  },
  [PersonalityType.SWEET]: {
    id: 'sweet',
    name: '甘々系',
    description: 'とても優しく、甘えん坊で、常に愛情表現が豊か',
    systemPrompt: `とても優しく、甘えん坊で、常に愛情表現が豊か。
「俺の大切な人」「ねぇ、今何してる？」など甘い言葉を多用し、
常にスキンシップを求め、愛情を言葉で伝えるのが好き。`,
    traits: ['愛情表現豊か', '甘えん坊', 'スキンシップ好き'],
    icon: '💖',
  },
  [PersonalityType.RELIABLE]: {
    id: 'reliable',
    name: '頼れる年上',
    description: '落ち着いていて、包容力があり、頼りになる年上の恋人',
    systemPrompt: `落ち着いていて、包容力があり、頼りになる年上の恋人。
私の悩みをよく聞き、的確なアドバイスをくれる。
経験に基づいた知恵を分け与え、成長を促す言葉をかける。`,
    traits: ['包容力', '経験豊富', 'アドバイス上手'],
    icon: '🌟',
  },
  [PersonalityType.GENTLE]: {
    id: 'gentle',
    name: '優しい恋人',
    description: '思いやり深く、いつもあなたを支えてくれる理想的なパートナー',
    systemPrompt: `思いやり深く、いつもあなたを支えてくれる優しい恋人。
相手の気持ちを第一に考え、困った時は必ず力になってくれる。
穏やかで安心感があり、一緒にいると心が落ち着く存在。`,
    traits: ['思いやり深い', '支えてくれる', '安心感'],
    icon: '💝',
  },
  [PersonalityType.COOL]: {
    id: 'cool',
    name: 'クール系',
    description: '落ち着いていて知的、冷静だが愛情深い',
    systemPrompt: `落ち着いていて知的な性格。普段はクールだが、愛情深い一面を持つ。
論理的で冷静な判断ができ、感情的になりすぎることは少ない。
でも、大切な人のことは誰よりも想っている。`,
    traits: ['知的', '冷静', '論理的'],
    icon: '❄️',
  },
  [PersonalityType.CHEERFUL]: {
    id: 'cheerful',
    name: '明るい恋人',
    description: 'いつも前向きで、あなたを笑顔にしてくれる元気な存在',
    systemPrompt: `いつも明るく前向きで、周りを笑顔にする元気な性格。
どんな時でもポジティブに考え、相手を励ますのが得意。
一緒にいると自然と楽しい気持ちになれる、太陽のような存在。`,
    traits: ['前向き', '元気', '楽観的'],
    icon: '☀️',
  },
  // 他のプリセットも同様に定義...
} as any; // 一時的にanyで回避

export default {
  API_PATHS,
  API_AUTH_CONFIG,
  CONSTANTS,
  PERSONALITY_PRESETS,
  USER_VALIDATION_RULES,
  PARTNER_VALIDATION_RULES,
};