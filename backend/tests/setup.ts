/**
 * Jestテストセットアップファイル
 * 全テストの実行前に実行される設定
 */

import { initializeDatabase } from '../src/config/database.config';
import { initializeModels } from '../src/config/sequelize.config';
import app from '../src/app';

// Expressアプリのエクスポート関数（テスト用）
export const createTestApp = () => app;

// テストタイムアウトの設定（統合テスト用）
jest.setTimeout(30000);

// テスト環境変数の設定
process.env.NODE_ENV = 'test';

// ログレベルを制御（テスト中は重要なもののみ）
if (!process.env.TEST_VERBOSE) {
  // console.log を無効化（エラーは残す）
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    // テスト実行中は標準ログを抑制
    if (process.env.TEST_VERBOSE === 'true') {
      originalLog(...args);
    }
  };
}

// テスト開始時の情報表示
console.log('='.repeat(60));
console.log('🧪 統合テスト実行開始');
console.log('='.repeat(60));
console.log(`環境: ${process.env.NODE_ENV}`);
console.log(`データベース: ${process.env.DATABASE_URL ? '設定済み' : '未設定'}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '設定済み' : '未設定'}`);
console.log('='.repeat(60));

// 未処理のPromise拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('テスト中に未処理のPromise拒否が発生:', reason);
});

// 未処理の例外をキャッチ
process.on('uncaughtException', (error) => {
  console.error('テスト中に未処理の例外が発生:', error);
});

// テスト開始前のデータベース初期化
beforeAll(async () => {
  try {
    console.log('🔧 データベース初期化中...');
    await initializeDatabase();
    console.log('✅ データベース初期化完了');
    
    console.log('🔧 Sequelizeモデル初期化中...');
    await initializeModels();
    console.log('✅ Sequelizeモデル初期化完了');
  } catch (error) {
    console.error('❌ 初期化失敗:', error);
    throw error;
  }
});

// テスト完了時のクリーンアップ
afterAll(async () => {
  console.log('='.repeat(60));
  console.log('🏁 統合テスト実行完了');
  console.log('='.repeat(60));
});