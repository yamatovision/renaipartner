import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('aikakumei', 10);

    // Check if admin user already exists
    const checkQuery = `
      SELECT id FROM users WHERE email = $1
    `;
    const checkResult = await pool.query(checkQuery, ['shiraishi.tatsuya@mikoto.co.jp']);

    if (checkResult.rows.length > 0) {
      console.log('管理者アカウントは既に存在します。');
      
      // Update to admin role
      const updateQuery = `
        UPDATE users 
        SET role = 'admin',
            password_hash = $2,
            updated_at = NOW()
        WHERE email = $1
        RETURNING id, email, role
      `;
      
      const updateResult = await pool.query(updateQuery, ['shiraishi.tatsuya@mikoto.co.jp', hashedPassword]);
      console.log('既存のアカウントを管理者に更新しました:', updateResult.rows[0]);
      return;
    }

    // Create admin user
    const insertQuery = `
      INSERT INTO users (
        id,
        email,
        password_hash,
        surname,
        first_name,
        nickname,
        birthday,
        role,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, email, role
    `;

    const values = [
      uuidv4(),
      'shiraishi.tatsuya@mikoto.co.jp',
      hashedPassword,
      '白石',
      '達也',
      'Admin',
      '1990-01-01',
      'admin',
      'active'
    ];

    const result = await pool.query(insertQuery, values);
    console.log('管理者アカウントを作成しました:', result.rows[0]);

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser();