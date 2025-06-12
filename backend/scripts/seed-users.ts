import dotenv from 'dotenv';
import path from 'path';
import { pool } from '../src/config/database.config';
import UserModel from '../src/db/models/User.model';
import { UserRole, UserStatus } from '../src/types';

// 環境変数をロード
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedUsers() {
  try {
    console.log('Connecting to database...');
    // データベース接続テスト
    const client = await pool.connect();
    client.release();
    console.log('Database connected successfully.');

    // テストユーザーを作成
    try {
      const testUser = await UserModel.create({
        email: 'test@example.com',
        password: 'password123',
        surname: 'テスト',
        firstName: 'ユーザー',
        role: UserRole.USER
      });
      console.log('✅ Test user created: test@example.com');
    } catch (error: any) {
      if (error.message.includes('既に使用されています')) {
        console.log('ℹ️ Test user already exists: test@example.com');
      } else {
        throw error;
      }
    }

    // 管理者ユーザーを作成
    try {
      const adminUser = await UserModel.create({
        email: 'admin@example.com',
        password: 'password123',
        surname: '管理',
        firstName: '者',
        role: UserRole.ADMIN
      });
      console.log('✅ Admin user created: admin@example.com');
    } catch (error: any) {
      if (error.message.includes('既に使用されています')) {
        console.log('ℹ️ Admin user already exists: admin@example.com');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All users have been seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('- Email: test@example.com, Password: password123 (role: user)');
    console.log('- Email: admin@example.com, Password: password123 (role: admin)');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await pool.end();
  }
}

// スクリプトを実行
seedUsers();