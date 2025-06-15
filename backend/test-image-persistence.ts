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

async function testImagePersistence() {
  const client = await pool.connect();
  
  try {
    console.log('=== 画像永続化テスト ===\n');
    
    // 1. アリサの現在の画像URL確認
    const beforeQuery = `
      SELECT 
        p.id,
        p.name,
        p.generated_image_url,
        p.updated_at
      FROM partners p
      JOIN users u ON p.user_id = u.id
      WHERE u.email = 'metavicer2@gmail.com' 
      AND p.name = 'アリサ'
    `;
    
    const beforeResult = await client.query(beforeQuery);
    if (beforeResult.rows.length === 0) {
      console.log('アリサが見つかりません');
      return;
    }
    
    const alisa = beforeResult.rows[0];
    console.log('修正前のアリサ画像情報:');
    console.log(`- ID: ${alisa.id}`);
    console.log(`- 現在の画像URL: ${alisa.generated_image_url || 'なし'}`);
    console.log(`- 更新日時: ${alisa.updated_at}`);
    
    // 2. GeneratedImageテーブルの最新画像確認
    const latestImageQuery = `
      SELECT 
        id,
        image_url,
        created_at,
        context
      FROM generated_images 
      WHERE partner_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const latestImageResult = await client.query(latestImageQuery, [alisa.id]);
    if (latestImageResult.rows.length > 0) {
      const latestImage = latestImageResult.rows[0];
      console.log('\n最新の生成画像:');
      console.log(`- 画像URL: ${latestImage.image_url}`);
      console.log(`- 生成日時: ${latestImage.created_at}`);
      console.log(`- コンテキスト: ${latestImage.context}`);
      
      // 3. 不整合チェック
      if (alisa.generated_image_url !== latestImage.image_url) {
        console.log('\n❌ 不整合検出！');
        console.log('パートナーテーブルの画像URLと最新生成画像のURLが異なります');
        console.log(`パートナー: ${alisa.generated_image_url}`);
        console.log(`最新画像: ${latestImage.image_url}`);
        
        // 修正を提案
        console.log('\n🔧 修正が必要です: PartnerModel.updateGeneratedImageUrl() を使用してください');
      } else {
        console.log('\n✅ 整合性OK: パートナーテーブルと最新画像が一致しています');
      }
    } else {
      console.log('\n生成画像が見つかりません');
    }
    
    // 4. 全生成画像数確認
    const countQuery = `
      SELECT COUNT(*) as total
      FROM generated_images 
      WHERE partner_id = $1
    `;
    
    const countResult = await client.query(countQuery, [alisa.id]);
    console.log(`\n生成画像総数: ${countResult.rows[0].total}件`);
    
    // 5. フロントエンドでの表示URL確認
    console.log('\n=== フロントエンド表示の確認 ===');
    console.log('フロントエンドが参照する画像URL:');
    console.log(`partner.appearance?.generatedImageUrl = "${alisa.generated_image_url || 'undefined'}"`);
    
    if (!alisa.generated_image_url) {
      console.log('⚠️  フロントエンドでデフォルトアバターが表示されます');
    } else {
      console.log('✅ フロントエンドで画像が表示されます');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testImagePersistence().catch(console.error);