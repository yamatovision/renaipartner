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

async function checkEmotionMappings() {
  const client = await pool.connect();
  
  try {
    console.log('=== 感情表現マッピングのチェック ===\n');
    
    // メッセージテーブルから使用されている感情を取得
    const query = `
      SELECT DISTINCT emotion
      FROM messages
      WHERE emotion IS NOT NULL
      ORDER BY emotion
    `;
    
    const result = await client.query(query);
    
    console.log('DBに記録されている感情タイプ:');
    const emotions = result.rows.map(row => row.emotion);
    console.log(emotions.join(', '));
    
    // 現在のemotionMap
    const emotionMap: { [key: string]: string } = {
      'happy': 'happy expression with warm expressive',
      'sad': 'sad expression with gentle melancholic',
      'excited': 'excited expression with energetic vibrant',
      'calm': 'calm expression with peaceful serene',
      'loving': 'loving expression with tender affectionate'
    };
    
    console.log('\n感情マッピングの状況:');
    emotions.forEach(emotion => {
      const mapped = emotionMap[emotion];
      console.log(`  ${emotion}: ${mapped ? `✓ → "${mapped}"` : '✗ マッピングなし → デフォルト: "${emotion} expression"'}`);
    });
    
    // マッピングされていない感情を特定
    const unmappedEmotions = emotions.filter(e => !emotionMap[e]);
    if (unmappedEmotions.length > 0) {
      console.log('\n推奨される追加マッピング:');
      unmappedEmotions.forEach(emotion => {
        console.log(`  '${emotion}': '${emotion} expression with [適切な修飾語]',`);
      });
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmotionMappings().catch(console.error);