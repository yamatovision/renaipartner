/**
 * 日付・時刻ユーティリティ
 */

/**
 * ローカル日時を指定フォーマットで取得
 * @param date 日付オブジェクト（省略時は現在時刻）
 * @returns フォーマット済み日時文字列（例: "2025/6/14(日)14:30"）
 */
export function getFormattedLocalDateTime(date?: Date): string {
  const now = date || new Date();
  
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayOfWeek = getDayOfWeekJa(now.getDay());
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day}(${dayOfWeek})${hours}:${minutes}`;
}

/**
 * 曜日を日本語で取得
 * @param dayIndex 曜日インデックス（0=日曜日）
 * @returns 日本語の曜日
 */
function getDayOfWeekJa(dayIndex: number): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayIndex];
}

/**
 * 時間帯に応じた挨拶を取得
 * @param hour 時間（0-23）
 * @returns 挨拶文字列
 */
export function getTimeGreeting(hour: number): string {
  if (hour >= 5 && hour < 10) return 'おはよう';
  if (hour >= 10 && hour < 18) return 'こんにちは';
  if (hour >= 18 && hour < 22) return 'こんばんは';
  return 'お疲れさま';
}

/**
 * 現在の季節を取得
 * @param month 月（1-12）
 * @returns 季節名
 */
export function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

/**
 * 日付フォーマット（シンプル版）
 * @param date 日付オブジェクト
 * @returns フォーマット済み日付（例: "6月14日(日)"）
 */
export function getSimpleFormattedDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = getDayOfWeekJa(date.getDay());
  
  return `${month}月${day}日(${dayOfWeek})`;
}

/**
 * 時刻フォーマット
 * @param date 日付オブジェクト
 * @returns フォーマット済み時刻（例: "14:30"）
 */
export function getFormattedTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * 相対時間を取得
 * @param date 日付オブジェクト
 * @returns 相対時間文字列（例: "5分前", "昨日"）
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  
  return `${Math.floor(days / 365)}年前`;
}