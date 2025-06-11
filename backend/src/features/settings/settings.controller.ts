import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { ID, JWTPayload } from '../../types';

export class SettingsController {
  /**
   * GET /api/settings
   * ユーザー設定を取得（統合版）
   */
  static async getSettings(
    req: Request & { user?: JWTPayload },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
        return;
      }

      const settings = await SettingsService.getSettings(req.user.userId);
      res.json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '設定の取得に失敗しました',
      });
    }
  }

  /**
   * PUT /api/settings
   * ユーザー設定を更新（統合版）
   */
  static async updateSettings(
    req: Request & { user?: JWTPayload },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
        return;
      }

      const updatedSettings = await SettingsService.updateSettings(
        req.user.userId,
        req.body
      );
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '設定の更新に失敗しました',
      });
    }
  }
}