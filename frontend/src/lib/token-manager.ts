/**
 * トークン管理ユーティリティ
 * リフレッシュトークンを使用した自動更新機能を提供
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * リフレッシュトークンを使用してアクセストークンを更新
 * 複数の401エラーが同時に発生した場合でも、リフレッシュは1回のみ実行
 */
export async function refreshAccessToken(): Promise<boolean> {
  // 既にリフレッシュ中の場合は、既存のPromiseを返す
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      // 認証APIのrefreshメソッドを直接呼び出すためにimport
      const { refresh } = await import('@/services/api/auth.api');
      const result = await refresh();
      
      if (result.success) {
        console.log('[TokenManager] トークンのリフレッシュに成功しました');
        return true;
      }
      
      console.error('[TokenManager] トークンのリフレッシュに失敗しました:', result.error);
      return false;
    } catch (error) {
      console.error('[TokenManager] リフレッシュ中にエラーが発生:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * トークンリフレッシュの状態をリセット
 * ログアウト時などに使用
 */
export function resetRefreshState(): void {
  isRefreshing = false;
  refreshPromise = null;
}