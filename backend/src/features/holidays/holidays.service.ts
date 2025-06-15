/**
 * 祝日・記念日判定サービス
 */

import { fixedHolidays, movableHolidays, getEquinoxDates, Holiday, MovableHoliday } from './holidays-data';

export class HolidaysService {
  /**
   * 指定日付の祝日・記念日を取得
   */
  static getHoliday(date: Date): string | null {
    // 固定祝日のチェック
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const fixedHoliday = fixedHolidays.find(h => h.date === monthDay);
    if (fixedHoliday) {
      return fixedHoliday.name;
    }

    // 移動祝日のチェック
    const movableHoliday = this.checkMovableHoliday(date);
    if (movableHoliday) {
      return movableHoliday;
    }

    // 春分の日・秋分の日のチェック
    const year = date.getFullYear();
    const { vernalEquinox, autumnalEquinox } = getEquinoxDates(year);
    
    if (date.getMonth() === vernalEquinox.getMonth() && date.getDate() === vernalEquinox.getDate()) {
      return '春分の日';
    }
    
    if (date.getMonth() === autumnalEquinox.getMonth() && date.getDate() === autumnalEquinox.getDate()) {
      return '秋分の日';
    }

    return null;
  }

  /**
   * 指定日付の祝日・記念日の詳細情報を取得
   */
  static getHolidayDetails(date: Date): Holiday | MovableHoliday | null {
    // 固定祝日のチェック
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const fixedHoliday = fixedHolidays.find(h => h.date === monthDay);
    if (fixedHoliday) {
      return fixedHoliday;
    }

    // 移動祝日のチェック
    const movableHolidayName = this.checkMovableHoliday(date);
    if (movableHolidayName) {
      const movableHoliday = movableHolidays.find(h => h.name === movableHolidayName);
      if (movableHoliday) {
        return movableHoliday;
      }
    }

    // 春分の日・秋分の日のチェック
    const year = date.getFullYear();
    const { vernalEquinox, autumnalEquinox } = getEquinoxDates(year);
    
    if (date.getMonth() === vernalEquinox.getMonth() && date.getDate() === vernalEquinox.getDate()) {
      return { name: '春分の日', date: '03-20', type: 'national' };
    }
    
    if (date.getMonth() === autumnalEquinox.getMonth() && date.getDate() === autumnalEquinox.getDate()) {
      return { name: '秋分の日', date: '09-23', type: 'national' };
    }

    return null;
  }

  /**
   * 移動祝日のチェック
   */
  private static checkMovableHoliday(date: Date): string | null {
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();
    const weekOfMonth = Math.ceil(date.getDate() / 7);

    for (const holiday of movableHolidays) {
      if (holiday.month === month && 
          holiday.dayOfWeek === dayOfWeek && 
          holiday.weekOfMonth === weekOfMonth) {
        return holiday.name;
      }
    }

    return null;
  }

  /**
   * 指定月の祝日・記念日一覧を取得
   */
  static getHolidaysInMonth(year: number, month: number): Array<{ date: Date; name: string; type: string }> {
    const holidays: Array<{ date: Date; name: string; type: string }> = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const holiday = this.getHolidayDetails(date);
      
      if (holiday) {
        holidays.push({
          date,
          name: holiday.name,
          type: holiday.type
        });
      }
    }

    return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * 季節を取得
   */
  static getSeason(date: Date): string {
    const month = date.getMonth() + 1;
    
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }

  /**
   * 日付が週末かどうかを判定
   */
  static isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * 曜日名を取得
   */
  static getDayOfWeekName(date: Date): string {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  }
}