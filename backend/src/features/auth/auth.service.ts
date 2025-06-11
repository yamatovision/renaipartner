import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, RefreshTokenModel, BlacklistedTokenModel } from '@/db/models';
import { 
  LoginRequest, 
  LoginResponse, 
  JWTPayload, 
  User, 
  ID,
  RefreshTokenRequest,
  RefreshTokenResponse 
} from '@/types';
import { ENV_CONFIG } from '@/config/env.config';
import { AuthenticationError, NotFoundError } from '@/common/middlewares/error.middleware';

export class AuthService {
  // アクセストークン生成
  private static generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(ENV_CONFIG.JWT_ACCESS_TOKEN_EXPIRY),
      jti: crypto.randomBytes(16).toString('hex') // JWT ID for uniqueness
    };
    
    return jwt.sign(payload, ENV_CONFIG.JWT_SECRET);
  }
  
  // リフレッシュトークン生成
  private static generateRefreshToken(): string {
    // ランダムな128文字のトークン生成
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 128; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
  
  // 期限文字列を秒数に変換
  private static parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900; // デフォルト15分
    }
  }
  
  // ログイン処理
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    console.log(`[AUTH] ログイン試行: ${loginData.email}`);
    
    try {
      // ユーザー検索（パスワードハッシュ付き）
      const userWithPassword = await UserModel.findByEmailWithPassword(loginData.email);
      
      if (!userWithPassword) {
        console.log(`[AUTH] ユーザーが見つからない: ${loginData.email}`);
        throw new AuthenticationError('メールアドレスまたはパスワードが正しくありません');
      }
      
      // パスワード検証
      const isPasswordValid = await UserModel.verifyPassword(
        loginData.password, 
        userWithPassword.passwordHash
      );
      
      if (!isPasswordValid) {
        console.log(`[AUTH] パスワード不正: ${loginData.email}`);
        throw new AuthenticationError('メールアドレスまたはパスワードが正しくありません');
      }
      
      // パスワードハッシュを除外したユーザー情報
      const { passwordHash, ...user } = userWithPassword;
      
      console.log(`[AUTH] ログイン成功: ${user.email} (${user.role})`);
      
      // アクセストークン生成
      const accessToken = this.generateAccessToken(user);
      
      // リフレッシュトークン生成
      const refreshToken = this.generateRefreshToken();
      const refreshExpirySeconds = this.parseExpiry(ENV_CONFIG.JWT_REFRESH_TOKEN_EXPIRY);
      const refreshExpiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);
      
      // リフレッシュトークンをDBに保存
      await RefreshTokenModel.create(user.id, refreshToken, refreshExpiresAt);
      
      // 期限切れトークンのクリーンアップ
      await RefreshTokenModel.deleteExpired();
      
      console.log(`[AUTH] トークン生成完了: userId=${user.id}`);
      
      return {
        accessToken,
        refreshToken,
        user
      };
      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      console.error('[AUTH] ログイン処理エラー:', error);
      throw new AuthenticationError('ログイン処理中にエラーが発生しました');
    }
  }
  
  // リフレッシュトークンによるアクセストークン更新
  static async refreshToken(refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    console.log('[AUTH] トークンリフレッシュ試行');
    
    try {
      // データベースでリフレッシュトークンを検索・検証
      const validRefreshToken = await RefreshTokenModel.findByToken(refreshData.refreshToken);
      
      if (!validRefreshToken) {
        console.log('[AUTH] 無効なリフレッシュトークン');
        throw new AuthenticationError('リフレッシュトークンが無効または期限切れです');
      }
      
      // ユーザー情報取得
      const user = await UserModel.findById(validRefreshToken.userId);
      
      if (!user) {
        console.log(`[AUTH] ユーザーが見つからない: userId=${validRefreshToken.userId}`);
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[AUTH] トークンリフレッシュ成功: ${user.email}`);
      
      // 新しいアクセストークン生成
      const newAccessToken = this.generateAccessToken(user);
      
      // 新しいリフレッシュトークン生成
      const newRefreshToken = this.generateRefreshToken();
      const refreshExpirySeconds = this.parseExpiry(ENV_CONFIG.JWT_REFRESH_TOKEN_EXPIRY);
      const refreshExpiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);
      
      // 古いリフレッシュトークンを削除
      await RefreshTokenModel.deleteById(validRefreshToken.id);
      
      // 新しいリフレッシュトークンをDBに保存
      await RefreshTokenModel.create(user.id, newRefreshToken, refreshExpiresAt);
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
      
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[AUTH] トークンリフレッシュエラー:', error);
      throw new AuthenticationError('トークンの更新中にエラーが発生しました');
    }
  }
  
  // ログアウト処理
  static async logout(userId: ID, accessToken?: string): Promise<void> {
    console.log(`[AUTH] ログアウト処理: userId=${userId}`);
    
    try {
      // アクセストークンが提供されている場合、ブラックリストに追加
      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, ENV_CONFIG.JWT_SECRET) as JWTPayload;
          if (decoded.jti) {
            const expiresAt = new Date(decoded.exp * 1000);
            await BlacklistedTokenModel.create(decoded.jti, userId, expiresAt);
            console.log(`[AUTH] アクセストークンをブラックリストに追加: jti=${decoded.jti}`);
          }
        } catch (error) {
          console.warn('[AUTH] アクセストークンのブラックリスト追加エラー（続行）:', error);
        }
      }
      
      // ユーザーの全リフレッシュトークンを削除
      const deletedCount = await RefreshTokenModel.deleteByUserId(userId);
      
      console.log(`[AUTH] ログアウト完了: userId=${userId}, 削除トークン数=${deletedCount}`);
      
    } catch (error) {
      console.error('[AUTH] ログアウト処理エラー:', error);
      // ログアウトエラーは非致命的として扱う
    }
  }
  
  // 現在のユーザー情報取得
  static async getCurrentUser(userId: ID): Promise<User> {
    console.log(`[AUTH] 現在のユーザー情報取得: userId=${userId}`);
    
    try {
      const user = await UserModel.findById(userId);
      
      if (!user) {
        console.log(`[AUTH] ユーザーが見つからない: userId=${userId}`);
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[AUTH] ユーザー情報取得成功: ${user.email}`);
      return user;
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[AUTH] ユーザー情報取得エラー:', error);
      throw new Error('ユーザー情報の取得中にエラーが発生しました');
    }
  }
  
  // パスワード変更
  static async changePassword(userId: ID, currentPassword: string, newPassword: string): Promise<void> {
    console.log(`[AUTH] パスワード変更試行: userId=${userId}`);
    
    try {
      // 現在のユーザー情報を取得（パスワードハッシュ付き）
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new NotFoundError('ユーザー');
      }
      
      const userWithPassword = await UserModel.findByEmailWithPassword(user.email);
      
      if (!userWithPassword) {
        throw new AuthenticationError('認証情報の取得に失敗しました');
      }
      
      // 現在のパスワードを検証
      const isCurrentPasswordValid = await UserModel.verifyPassword(
        currentPassword, 
        userWithPassword.passwordHash
      );
      
      if (!isCurrentPasswordValid) {
        console.log(`[AUTH] 現在のパスワードが不正: userId=${userId}`);
        throw new AuthenticationError('現在のパスワードが正しくありません');
      }
      
      // パスワード更新
      const success = await UserModel.updatePassword(userId, newPassword);
      
      if (!success) {
        throw new Error('パスワードの更新に失敗しました');
      }
      
      // セキュリティのため、全リフレッシュトークンを無効化
      await RefreshTokenModel.deleteByUserId(userId);
      
      console.log(`[AUTH] パスワード変更成功: userId=${userId}`);
      
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[AUTH] パスワード変更エラー:', error);
      throw new Error('パスワード変更中にエラーが発生しました');
    }
  }
  
  // トークン検証
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, ENV_CONFIG.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('トークンの有効期限が切れています');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('無効なトークンです');
      } else {
        throw new AuthenticationError('トークンの検証に失敗しました');
      }
    }
  }
}