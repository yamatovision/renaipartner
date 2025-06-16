/**
 * メモリシステム設定
 * システムプロンプトに含めるメモリの管理設定
 */

export const MEMORY_CONFIG = {
  // システムプロンプトに含める最大メモリ数
  MAX_MEMORIES_IN_PROMPT: 15,
  
  // 最小重要度（これ以上の重要度のメモリのみ取得）
  MIN_IMPORTANCE: 5,
  
  // 優先する記憶の種類（順番に優先度）
  MEMORY_TYPE_PRIORITY: [
    'FACT',        // 事実（職業、資格など）
    'PREFERENCE',  // 好み（好きな食べ物、趣味など）
    'EMOTION',     // 感情（価値観、信念など）
    'EVENT'        // イベント（特別な出来事）
  ] as const,
  
  // メモリ取得のタイムアウト（ミリ秒）
  FETCH_TIMEOUT: 1000,
  
  // キャッシュ有効期間（ミリ秒）
  CACHE_DURATION: 5 * 60 * 1000, // 5分
  
  // メモリ自動管理設定
  AUTO_MANAGEMENT: {
    // 古いメモリを削除する基準日数
    DELETE_AFTER_DAYS: 90,
    
    // 重要度による保持期間の延長
    IMPORTANCE_RETENTION_MULTIPLIER: {
      10: 5,    // 重要度10: 5倍の期間保持
      9: 4,     // 重要度9: 4倍の期間保持
      8: 3,     // 重要度8: 3倍の期間保持
      7: 2,     // 重要度7: 2倍の期間保持
      6: 1.5,   // 重要度6: 1.5倍の期間保持
      5: 1      // 重要度5: 通常の期間保持
    }
  }
};

export default MEMORY_CONFIG;