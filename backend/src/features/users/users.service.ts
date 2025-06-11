import { UserModel } from '@/db/models';
import { 
  User, 
  UserCreate, 
  UserStatus, 
  UserRole,
  ID,
  PaginatedResponse 
} from '@/types';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '@/common/middlewares/error.middleware';
import bcrypt from 'bcryptjs';

export class UsersService {
  // ユーザー作成（管理者機能）
  static async createUser(userData: UserCreate): Promise<User> {
    console.log(`[USERS] 新規ユーザー作成: ${userData.email}`);
    
    try {
      // 既存ユーザーの確認
      const existingUser = await UserModel.findByEmail(userData.email);
      
      if (existingUser) {
        console.log(`[USERS] ユーザー重複: ${userData.email}`);
        throw new ConflictError('このメールアドレスは既に使用されています');
      }
      
      // デフォルト値の設定
      const userCreateData: UserCreate = {
        ...userData,
        password: userData.password || 'aikakumei', // デフォルトパスワード
        role: userData.role || UserRole.USER // デフォルトロール
      };
      
      // ユーザー作成
      const newUser = await UserModel.create(userCreateData);
      
      console.log(`[USERS] ユーザー作成成功: ${newUser.email} (${newUser.role})`);
      return newUser;
      
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      
      console.error('[USERS] ユーザー作成エラー:', error);
      throw new Error('ユーザーの作成中にエラーが発生しました');
    }
  }
  
  // ユーザー一覧取得（管理者機能）
  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
  } = {}): Promise<PaginatedResponse<User>> {
    console.log('[USERS] ユーザー一覧取得:', options);
    
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100); // 最大100件
      
      const { users, total } = await UserModel.findAll({
        page,
        limit,
        search: options.search,
        status: options.status
      });
      
      const totalPages = Math.ceil(total / limit);
      
      console.log(`[USERS] ユーザー一覧取得成功: ${users.length}件/${total}件`);
      
      return {
        items: users,
        total,
        page,
        limit,
        totalPages
      };
      
    } catch (error) {
      console.error('[USERS] ユーザー一覧取得エラー:', error);
      throw new Error('ユーザー一覧の取得中にエラーが発生しました');
    }
  }
  
  // ユーザー詳細取得
  static async getUserById(id: ID): Promise<User> {
    console.log(`[USERS] ユーザー詳細取得: userId=${id}`);
    
    try {
      const user = await UserModel.findById(id);
      
      if (!user) {
        console.log(`[USERS] ユーザーが見つからない: userId=${id}`);
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[USERS] ユーザー詳細取得成功: ${user.email}`);
      return user;
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[USERS] ユーザー詳細取得エラー:', error);
      throw new Error('ユーザー情報の取得中にエラーが発生しました');
    }
  }
  
  // ユーザーアクティベート（管理者機能）
  static async activateUser(id: ID): Promise<User> {
    console.log(`[USERS] ユーザーアクティベート: userId=${id}`);
    
    try {
      const updatedUser = await UserModel.updateStatus(id, UserStatus.ACTIVE);
      
      if (!updatedUser) {
        console.log(`[USERS] アクティベート対象ユーザーが見つからない: userId=${id}`);
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[USERS] ユーザーアクティベート成功: ${updatedUser.email}`);
      return updatedUser;
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[USERS] ユーザーアクティベートエラー:', error);
      throw new Error('ユーザーのアクティベート中にエラーが発生しました');
    }
  }
  
  // ユーザー無効化（管理者機能）
  static async deactivateUser(id: ID): Promise<User> {
    console.log(`[USERS] ユーザー無効化: userId=${id}`);
    
    try {
      const updatedUser = await UserModel.updateStatus(id, UserStatus.INACTIVE);
      
      if (!updatedUser) {
        console.log(`[USERS] 無効化対象ユーザーが見つからない: userId=${id}`);
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[USERS] ユーザー無効化成功: ${updatedUser.email}`);
      return updatedUser;
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[USERS] ユーザー無効化エラー:', error);
      throw new Error('ユーザーの無効化中にエラーが発生しました');
    }
  }
  
  // ユーザー統計情報取得（管理者機能）
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    todayRegistrations: number;
  }> {
    console.log('[USERS] ユーザー統計情報取得');
    
    try {
      const stats = await UserModel.getStats();
      
      console.log('[USERS] ユーザー統計情報取得成功:', stats);
      return stats;
      
    } catch (error) {
      console.error('[USERS] ユーザー統計情報取得エラー:', error);
      throw new Error('統計情報の取得中にエラーが発生しました');
    }
  }
  
  // メールアドレスの重複チェック
  static async checkEmailExists(email: string): Promise<boolean> {
    console.log(`[USERS] メールアドレス重複チェック: ${email}`);
    
    try {
      const existingUser = await UserModel.findByEmail(email);
      const exists = !!existingUser;
      
      console.log(`[USERS] メールアドレス重複チェック結果: ${email} => ${exists ? '重複あり' : '利用可能'}`);
      return exists;
      
    } catch (error) {
      console.error('[USERS] メールアドレス重複チェックエラー:', error);
      // エラーの場合は安全側に倒して重複ありとする
      return true;
    }
  }
  
  // ユーザープロフィール更新
  static async updateProfile(
    userId: ID, 
    profileData: {
      surname?: string;
      firstName?: string;
      nickname?: string;
      birthday?: string;
    }
  ): Promise<User> {
    console.log(`[USERS] プロフィール更新: userId=${userId}`, profileData);
    
    try {
      // 現在のユーザー情報を取得
      const currentUser = await UserModel.findById(userId);
      
      if (!currentUser) {
        console.log(`[USERS] プロフィール更新対象ユーザーが見つからない: userId=${userId}`);
        throw new NotFoundError('ユーザー');
      }
      
      // バリデーション
      if (profileData.surname !== undefined && profileData.surname.trim().length === 0) {
        throw new ValidationError('姓は必須です');
      }
      
      if (profileData.firstName !== undefined && profileData.firstName.trim().length === 0) {
        throw new ValidationError('名は必須です');
      }
      
      // プロフィール更新を実行
      const updatedUser = await UserModel.updateProfile(userId, profileData);
      
      if (!updatedUser) {
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[USERS] プロフィール更新成功: userId=${userId}, email=${updatedUser.email}`);
      return updatedUser;
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      console.error('[USERS] プロフィール更新エラー:', error);
      throw new Error('プロフィールの更新中にエラーが発生しました');
    }
  }
  
  // ユーザー削除（論理削除）
  static async deleteUser(id: ID): Promise<void> {
    console.log(`[USERS] ユーザー削除: userId=${id}`);
    
    try {
      // 実際には論理削除（無効化）を行う
      const updatedUser = await UserModel.updateStatus(id, UserStatus.INACTIVE);
      
      if (!updatedUser) {
        throw new NotFoundError('ユーザー');
      }
      
      console.log(`[USERS] ユーザー削除（論理削除）成功: ${updatedUser.email}`);
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[USERS] ユーザー削除エラー:', error);
      throw new Error('ユーザーの削除中にエラーが発生しました');
    }
  }

  // パスワード変更
  static async changePassword(
    userId: ID, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    console.log(`[USERS] パスワード変更: userId=${userId}`);
    
    try {
      // 現在のユーザー情報を取得
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new NotFoundError('ユーザー');
      }
      
      // パスワードハッシュを含むユーザー情報を取得
      const userWithPassword = await UserModel.findByEmailWithPassword(user.email);
      
      if (!userWithPassword) {
        throw new NotFoundError('ユーザー');
      }
      
      // 現在のパスワードを検証
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
      
      if (!isCurrentPasswordValid) {
        throw new ValidationError('現在のパスワードが正しくありません');
      }
      
      // パスワード更新（UserModelで自動的にハッシュ化される）
      await UserModel.updatePassword(userId, newPassword);
      
      console.log(`[USERS] パスワード変更成功: userId=${userId}`);
      
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      console.error('[USERS] パスワード変更エラー:', error);
      throw new Error('パスワードの変更中にエラーが発生しました');
    }
  }

  // データエクスポート
  static async exportUserData(userId: ID): Promise<any> {
    console.log(`[USERS] データエクスポート: userId=${userId}`);
    
    try {
      // UserModel.getExportData を使用して包括的なデータを取得
      const exportDataResult = await UserModel.getExportData(userId);
      
      if (!exportDataResult) {
        console.log(`[USERS] エクスポート対象ユーザーが見つからない: userId=${userId}`);
        throw new NotFoundError('ユーザー');
      }
      
      // エクスポート用のデータ構造を構築
      const exportData = {
        user: {
          id: exportDataResult.user.id,
          email: exportDataResult.user.email,
          surname: exportDataResult.user.surname,
          firstName: exportDataResult.user.firstName,
          nickname: exportDataResult.user.nickname,
          birthday: exportDataResult.user.birthday,
          role: exportDataResult.user.role,
          status: exportDataResult.user.status,
          profileCompleted: exportDataResult.user.profileCompleted,
          createdAt: exportDataResult.user.createdAt,
          updatedAt: exportDataResult.user.updatedAt
        },
        partners: exportDataResult.partners || [],
        chatHistory: exportDataResult.messages || [],
        settings: exportDataResult.settings || {},
        exportInfo: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          totalPartners: (exportDataResult.partners || []).length,
          totalMessages: (exportDataResult.messages || []).length
        }
      };
      
      console.log(`[USERS] データエクスポート成功: userId=${userId}, パートナー数=${exportData.exportInfo.totalPartners}, メッセージ数=${exportData.exportInfo.totalMessages}`);
      return exportData;
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error('[USERS] データエクスポートエラー:', error);
      throw new Error('データのエクスポート中にエラーが発生しました');
    }
  }
}