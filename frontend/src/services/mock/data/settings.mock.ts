/**
 * 設定関連のモックデータ
 * types/index.tsの型定義に完全準拠
 */

import { NotificationSettings, UserSettings, BackgroundImage } from '../../../types';

// 通知設定のモックデータ
export const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: 'notif1',
  userId: 'user123',
  morningGreeting: true,
  morningTime: '08:00',
  reminderMessages: true,
  specialDays: true,
};

// ユーザー設定のモックデータ
export const MOCK_USER_SETTINGS: UserSettings = {
  id: 'settings1',
  userId: 'user123',
  theme: 'light',
  backgroundImage: '/backgrounds/default.jpg',
  soundEnabled: true,
  autoSave: true,
  dataRetentionDays: 30,
};

// 背景画像のモックデータ
export const MOCK_BACKGROUND_IMAGES: BackgroundImage[] = [
  {
    id: 'bg1',
    name: 'さくら',
    url: '/backgrounds/sakura.jpg',
    thumbnail: '/backgrounds/thumbnails/sakura.jpg',
    category: 'nature',
    isDefault: true,
  },
  {
    id: 'bg2',
    name: '夜空',
    url: '/backgrounds/night-sky.jpg',
    thumbnail: '/backgrounds/thumbnails/night-sky.jpg',
    category: 'nature',
    isDefault: false,
  },
  {
    id: 'bg3',
    name: 'シンプル',
    url: '/backgrounds/simple.jpg',
    thumbnail: '/backgrounds/thumbnails/simple.jpg',
    category: 'minimal',
    isDefault: false,
  },
  {
    id: 'bg4',
    name: 'グラデーション',
    url: '/backgrounds/gradient.jpg',
    thumbnail: '/backgrounds/thumbnails/gradient.jpg',
    category: 'abstract',
    isDefault: false,
  }
];

// エクスポートデータのモックテンプレート
export const MOCK_EXPORT_DATA = {
  version: '1.0',
  exportDate: new Date().toISOString(),
  userData: {
    userId: 'user123',
    email: 'user@example.com',
    username: 'ユーザー太郎',
    createdAt: '2024-01-01T00:00:00Z'
  },
  partners: [
    {
      id: 'partner1',
      name: 'さくら',
      personality: 'やさしい',
      appearance: '可愛い系',
      relationshipLevel: 5
    }
  ],
  conversations: [
    {
      partnerId: 'partner1',
      messages: [
        {
          id: 'msg1',
          content: 'こんにちは！',
          senderId: 'partner1',
          timestamp: '2024-01-15T10:00:00Z'
        },
        {
          id: 'msg2',
          content: 'こんにちは！元気？',
          senderId: 'user123',
          timestamp: '2024-01-15T10:01:00Z'
        }
      ]
    }
  ],
  settings: MOCK_USER_SETTINGS,
};