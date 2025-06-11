// モックサービス統合エクスポート
export * from './auth.mock'
export * from './partners.mock'
export * from './settings.mock'
export * from './admin.mock'

import React from 'react'

// MockIndicatorコンポーネント（SSR対応）
export function MockIndicator() {
  if (!IS_MOCK_MODE) return null
  
  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ef4444',
      color: 'white',
      textAlign: 'center',
      padding: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      zIndex: 9999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  }, '⚠️ モックデータ使用中 - 本番環境では使用不可')
}

// モック使用中フラグ
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || true // 開発中はデフォルトでモック使用
console.log('[DEBUG] IS_MOCK_MODE initialized:', IS_MOCK_MODE, 'NEXT_PUBLIC_USE_MOCK:', process.env.NEXT_PUBLIC_USE_MOCK)

// モックインジケーターReactコンポーネント用の関数（廃止予定）
export function showMockIndicator() {
  // DOM操作による実装は廃止 - Reactコンポーネントを使用
  console.log('[DEBUG] showMockIndicator called but deprecated - use MockIndicator component instead')
}