/**
 * 日本の祝日・記念日データ
 */

export interface Holiday {
  name: string;
  date: string; // MM-DD形式
  type: 'national' | 'couple' | 'seasonal';
  description?: string;
}

export interface MovableHoliday {
  name: string;
  month: number;
  weekOfMonth: number; // 第何週
  dayOfWeek: number; // 0=日曜日, 1=月曜日...
  type: 'national' | 'couple' | 'seasonal';
  description?: string;
}

// 固定日の祝日・記念日
export const fixedHolidays: Holiday[] = [
  // 国民の祝日
  { name: '元日', date: '01-01', type: 'national' },
  { name: '建国記念の日', date: '02-11', type: 'national' },
  { name: '天皇誕生日', date: '02-23', type: 'national' },
  { name: '春分の日', date: '03-20', type: 'national' }, // 年によって変動するが、簡略化のため固定
  { name: '昭和の日', date: '04-29', type: 'national' },
  { name: '憲法記念日', date: '05-03', type: 'national' },
  { name: 'みどりの日', date: '05-04', type: 'national' },
  { name: 'こどもの日', date: '05-05', type: 'national' },
  { name: '山の日', date: '08-11', type: 'national' },
  { name: '秋分の日', date: '09-23', type: 'national' }, // 年によって変動するが、簡略化のため固定
  { name: '文化の日', date: '11-03', type: 'national' },
  { name: '勤労感謝の日', date: '11-23', type: 'national' },
  
  // カップル向けイベント
  { name: 'バレンタインデー', date: '02-14', type: 'couple', description: '愛を伝える日' },
  { name: 'ホワイトデー', date: '03-14', type: 'couple', description: 'お返しの日' },
  { name: '七夕', date: '07-07', type: 'couple', description: '織姫と彦星が出会う日' },
  { name: 'クリスマスイブ', date: '12-24', type: 'couple', description: '聖夜' },
  { name: 'クリスマス', date: '12-25', type: 'couple', description: '愛と祝福の日' },
  { name: '大晦日', date: '12-31', type: 'seasonal', description: '一年の締めくくり' },
  
  // 季節のイベント
  { name: 'ひな祭り', date: '03-03', type: 'seasonal', description: '女の子の健やかな成長を願う日' },
  { name: '花見シーズン', date: '04-01', type: 'seasonal', description: '桜が美しい季節' },
  { name: '端午の節句', date: '05-05', type: 'seasonal', description: '男の子の健やかな成長を願う日' },
  { name: '海の日', date: '07-20', type: 'seasonal', description: '海に感謝する日' },
  { name: '花火大会シーズン', date: '08-01', type: 'seasonal', description: '夏の風物詩' },
  { name: 'お月見', date: '09-15', type: 'seasonal', description: '中秋の名月' },
  { name: 'ハロウィン', date: '10-31', type: 'seasonal', description: '仮装を楽しむ日' },
  { name: '紅葉シーズン', date: '11-15', type: 'seasonal', description: '紅葉が美しい季節' },
];

// 移動祝日（第○月曜日など）
export const movableHolidays: MovableHoliday[] = [
  { name: '成人の日', month: 1, weekOfMonth: 2, dayOfWeek: 1, type: 'national' },
  { name: '海の日', month: 7, weekOfMonth: 3, dayOfWeek: 1, type: 'national' },
  { name: '敬老の日', month: 9, weekOfMonth: 3, dayOfWeek: 1, type: 'national' },
  { name: 'スポーツの日', month: 10, weekOfMonth: 2, dayOfWeek: 1, type: 'national' },
  { name: '母の日', month: 5, weekOfMonth: 2, dayOfWeek: 0, type: 'seasonal' },
  { name: '父の日', month: 6, weekOfMonth: 3, dayOfWeek: 0, type: 'seasonal' },
];

/**
 * 春分の日・秋分の日の計算（簡易版）
 */
export function getEquinoxDates(year: number): { vernalEquinox: Date; autumnalEquinox: Date } {
  // 簡易計算式（2000年〜2099年まで有効）
  const vernalDay = Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  const autumnalDay = Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  
  return {
    vernalEquinox: new Date(year, 2, vernalDay), // 3月
    autumnalEquinox: new Date(year, 8, autumnalDay), // 9月
  };
}