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

async function checkAlisaPrompt() {
  const client = await pool.connect();
  
  try {
    // アリサのデータを取得
    const query = `
      SELECT 
        p.name,
        p.personality_type,
        p.hair_color,
        p.hair_style,
        p.eye_color,
        p.intimacy_level
      FROM partners p
      JOIN users u ON p.user_id = u.id
      WHERE u.email = 'metavicer2@gmail.com' 
      AND p.name = 'アリサ'
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('アリサが見つかりません');
      return;
    }
    
    const alisa = result.rows[0];
    console.log('=== アリサのデータ ===');
    console.log(`性格タイプ: ${alisa.personality_type}`);
    console.log(`髪色: ${alisa.hair_color}`);
    console.log(`髪型: ${alisa.hair_style}`);
    console.log(`目の色: ${alisa.eye_color}`);
    console.log(`親密度: ${alisa.intimacy_level}`);
    
    // personalityMapの問題を再現
    const personalityMap: { [key: string]: string } = {
      'gentle': 'gentle',
      'energetic': 'energetic',
      'cool': 'cool',
      'warm': 'warm',
      'mysterious': 'mysterious'
    };
    
    const personalityPrompt = personalityMap[alisa.personality_type] || 'gentle';
    
    console.log('\n=== プロンプト生成の問題 ===');
    console.log(`personality_typeが'${alisa.personality_type}'の場合:`);
    console.log(`- personalityMapに存在: ${alisa.personality_type in personalityMap ? 'はい' : 'いいえ'}`);
    console.log(`- 使用される性格プロンプト: '${personalityPrompt}'`);
    console.log(`- 期待される性格プロンプト: 'reliable'`);
    
    console.log('\n=== 修正前のプロンプト例 ===');
    const oldPrompt = `anime style young woman, ${alisa.hair_color} ${alisa.hair_style}, ${alisa.eye_color} eyes, ${personalityPrompt} personality`;
    console.log(oldPrompt);
    
    console.log('\n=== 修正後のプロンプト例 ===');
    const newPrompt = `anime style young woman, ${alisa.hair_color} ${alisa.hair_style} hair, ${alisa.eye_color} eyes, reliable personality`;
    console.log(newPrompt);
    
    // personalityMapを更新版で再確認
    const updatedPersonalityMap: { [key: string]: string } = {
      'gentle': 'gentle',
      'cool': 'cool',
      'cheerful': 'cheerful',
      'tsundere': 'tsundere',
      'sweet': 'sweet',
      'reliable': 'reliable',
      'clingy': 'clingy',
      'genius': 'genius',
      'childhood': 'childhood friend',
      'sports': 'sporty',
      'artist': 'artistic',
      'cooking': 'cooking enthusiast',
      'mysterious': 'mysterious',
      'prince': 'princely',
      'otaku': 'otaku',
      'younger': 'younger',
      'band': 'band member'
    };
    
    const updatedPersonalityPrompt = updatedPersonalityMap[alisa.personality_type] || alisa.personality_type;
    
    console.log('\n=== 最終的な修正後プロンプト ===');
    const finalPrompt = `anime style young woman, ${alisa.hair_color} ${alisa.hair_style} hair, ${alisa.eye_color} eyes, ${updatedPersonalityPrompt} personality`;
    console.log(finalPrompt);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAlisaPrompt().catch(console.error);