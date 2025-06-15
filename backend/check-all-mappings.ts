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

async function checkAllMappings() {
  const client = await pool.connect();
  
  try {
    console.log('=== 画像生成マッピングの包括的チェック ===\n');
    
    // 1. データベースに登録されている全ての外見属性値を取得
    const query = `
      SELECT DISTINCT
        hair_style,
        hair_color,
        eye_color,
        body_type,
        clothing_style,
        personality_type,
        speech_style
      FROM partners
      ORDER BY hair_style, hair_color, eye_color, body_type, clothing_style
    `;
    
    const result = await client.query(query);
    
    // 2. 各属性の値を集計
    const attributes = {
      hairStyles: new Set<string>(),
      hairColors: new Set<string>(),
      eyeColors: new Set<string>(),
      bodyTypes: new Set<string>(),
      clothingStyles: new Set<string>(),
      personalityTypes: new Set<string>(),
      speechStyles: new Set<string>()
    };
    
    result.rows.forEach(row => {
      if (row.hair_style) attributes.hairStyles.add(row.hair_style);
      if (row.hair_color) attributes.hairColors.add(row.hair_color);
      if (row.eye_color) attributes.eyeColors.add(row.eye_color);
      if (row.body_type) attributes.bodyTypes.add(row.body_type);
      if (row.clothing_style) attributes.clothingStyles.add(row.clothing_style);
      if (row.personality_type) attributes.personalityTypes.add(row.personality_type);
      if (row.speech_style) attributes.speechStyles.add(row.speech_style);
    });
    
    // 3. 現在のマッピング定義（images.service.tsから）
    const personalityMap: { [key: string]: string } = {
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
    
    const emotionMap: { [key: string]: string } = {
      'happy': 'happy expression with warm expressive',
      'sad': 'sad expression with gentle melancholic',
      'excited': 'excited expression with energetic vibrant',
      'calm': 'calm expression with peaceful serene',
      'loving': 'loving expression with tender affectionate'
    };
    
    // 4. マッピングのチェック
    console.log('=== 髪型（HairStyle）===');
    console.log('DB内の値:', Array.from(attributes.hairStyles).join(', '));
    console.log('マッピング: なし（直接使用）');
    console.log('問題: 日本語の値が英語プロンプトに直接含まれる可能性\n');
    
    console.log('=== 髪色（HairColor）===');
    console.log('DB内の値:', Array.from(attributes.hairColors).join(', '));
    console.log('マッピング: なし（直接使用）');
    console.log('問題: 日本語の値が英語プロンプトに直接含まれる可能性\n');
    
    console.log('=== 目の色（EyeColor）===');
    console.log('DB内の値:', Array.from(attributes.eyeColors).join(', '));
    console.log('マッピング: なし（直接使用）');
    console.log('問題: 日本語の値が英語プロンプトに直接含まれる可能性\n');
    
    console.log('=== 体型（BodyType）===');
    console.log('DB内の値:', Array.from(attributes.bodyTypes).join(', '));
    console.log('マッピング: なし（直接使用）');
    console.log('問題: 日本語の値が英語プロンプトに直接含まれる可能性\n');
    
    console.log('=== 服装スタイル（ClothingStyle）===');
    console.log('DB内の値:', Array.from(attributes.clothingStyles).join(', '));
    console.log('マッピング: ClothingPromptsServiceで一部対応');
    console.log('問題: buildAvatarPromptでは直接使用\n');
    
    console.log('=== 性格タイプ（PersonalityType）===');
    console.log('DB内の値:', Array.from(attributes.personalityTypes).join(', '));
    console.log('マッピング済みの値:');
    attributes.personalityTypes.forEach(type => {
      const mapped = personalityMap[type];
      console.log(`  ${type}: ${mapped ? `✓ → "${mapped}"` : '✗ マッピングなし'}`);
    });
    
    console.log('\n=== 話し方（SpeechStyle）===');
    console.log('DB内の値:', Array.from(attributes.speechStyles).join(', '));
    console.log('備考: 画像生成には使用されていない\n');
    
    // 5. 実際のプロンプト生成例
    console.log('=== プロンプト生成例 ===');
    const samplePartners = await client.query('SELECT * FROM partners LIMIT 3');
    
    samplePartners.rows.forEach((partner, index) => {
      console.log(`\n例${index + 1}: ${partner.name}`);
      console.log(`  髪: ${partner.hair_color} ${partner.hair_style} hair`);
      console.log(`  目: ${partner.eye_color} eyes`);
      console.log(`  性格: ${personalityMap[partner.personality_type] || partner.personality_type} personality`);
      console.log(`  生成されるプロンプト例:`);
      console.log(`  "anime style ${partner.gender === 'boyfriend' ? 'young man' : 'young woman'}, ${partner.hair_color} ${partner.hair_style} hair, ${partner.eye_color} eyes, ${personalityMap[partner.personality_type] || partner.personality_type} personality"`);
    });
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllMappings().catch(console.error);