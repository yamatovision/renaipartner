import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

// .envファイルを読み込む
config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAlisaData() {
  const client = await pool.connect();
  
  try {
    console.log('=== アリサのデータを確認 ===\n');
    
    // 1. metavicer2@gmail.comのユーザーIDを取得
    const userQuery = `SELECT id, email, first_name FROM users WHERE email = $1`;
    const userResult = await client.query(userQuery, ['metavicer2@gmail.com']);
    
    if (userResult.rows.length === 0) {
      console.log('ユーザー metavicer2@gmail.com が見つかりません');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('ユーザー情報:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- 名前: ${user.first_name}\n`);
    
    // 2. アリサのデータを取得
    const partnerQuery = `
      SELECT 
        id,
        name,
        gender,
        personality_type,
        speech_style,
        system_prompt,
        avatar_description,
        hair_style,
        hair_color,
        eye_color,
        body_type,
        clothing_style,
        generated_image_url,
        hobbies,
        intimacy_level,
        base_image_url,
        created_at,
        updated_at
      FROM partners 
      WHERE user_id = $1 AND LOWER(name) = 'アリサ'
    `;
    
    const partnerResult = await client.query(partnerQuery, [user.id]);
    
    if (partnerResult.rows.length === 0) {
      console.log('アリサが見つかりません');
      
      // 全パートナーを表示
      const allPartnersQuery = `SELECT id, name FROM partners WHERE user_id = $1`;
      const allPartnersResult = await client.query(allPartnersQuery, [user.id]);
      
      if (allPartnersResult.rows.length > 0) {
        console.log('\n登録されているパートナー:');
        allPartnersResult.rows.forEach(p => {
          console.log(`- ID: ${p.id}, 名前: ${p.name}`);
        });
      }
      return;
    }
    
    const alisa = partnerResult.rows[0];
    console.log('アリサのデータ:');
    console.log(`- ID: ${alisa.id}`);
    console.log(`- 名前: ${alisa.name}`);
    console.log(`- 性別: ${alisa.gender}`);
    console.log(`- 性格タイプ: ${alisa.personality_type}`);
    console.log(`- 話し方: ${alisa.speech_style}`);
    console.log(`\n外見情報:`);
    console.log(`- 髪型: ${alisa.hair_style}`);
    console.log(`- 髪色: ${alisa.hair_color || '未設定'}`);
    console.log(`- 目の色: ${alisa.eye_color}`);
    console.log(`- 体型: ${alisa.body_type}`);
    console.log(`- 服装スタイル: ${alisa.clothing_style}`);
    console.log(`\nその他の情報:`);
    console.log(`- 趣味: ${alisa.hobbies}`);
    console.log(`- 親密度: ${alisa.intimacy_level}`);
    console.log(`- アバター説明: ${alisa.avatar_description}`);
    console.log(`- システムプロンプト（一部）: ${alisa.system_prompt?.substring(0, 100)}...`);
    console.log(`- 画像URL: ${alisa.generated_image_url || '未生成'}`);
    console.log(`- 作成日: ${alisa.created_at}`);
    console.log(`- 更新日: ${alisa.updated_at}`);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAlisaData().catch(console.error);