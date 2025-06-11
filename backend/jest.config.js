module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // テストファイルの検索パターン
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js'
  ],
  
  // カバレッジ対象
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  
  // TypeScriptの設定
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // モジュール解決
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // テストタイムアウト（統合テストのため長めに設定）
  testTimeout: 30000,
  
  // 並列実行を無効化（データベーステストの分離のため）
  maxWorkers: 1,
  
  // テスト実行時の詳細出力
  verbose: true,
  
  // エラー時の詳細表示
  collectCoverage: false // 初期は無効化（必要に応じて有効化）
};