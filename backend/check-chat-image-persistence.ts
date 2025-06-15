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

async function checkChatImagePersistence() {
  const client = await pool.connect();
  
  try {
    console.log('=== チャット画像永続化問題の調査 ===\n');
    
    // 1. アリサのパートナーIDを取得
    const partnerQuery = `
      SELECT p.id, p.name
      FROM partners p
      JOIN users u ON p.user_id = u.id
      WHERE u.email = 'metavicer2@gmail.com' 
      AND p.name = 'アリサ'
    `;
    
    const partnerResult = await client.query(partnerQuery);
    if (partnerResult.rows.length === 0) {
      console.log('アリサが見つかりません');
      return;
    }
    
    const partnerId = partnerResult.rows[0].id;
    console.log(`アリサのパートナーID: ${partnerId}\n`);
    
    // 2. 画像付きメッセージの確認
    const imageMessagesQuery = `
      SELECT 
        id,
        content,
        sender,
        context,
        created_at
      FROM messages 
      WHERE partner_id = $1 
      AND (
        context IS NOT NULL 
        AND context::text LIKE '%imageUrl%'
      )
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const imageMessagesResult = await client.query(imageMessagesQuery, [partnerId]);
    
    console.log('=== 画像付きメッセージ（データベース） ===');
    if (imageMessagesResult.rows.length === 0) {
      console.log('画像付きメッセージが見つかりません');
      console.log('→ 問題: チャット画像生成時にメッセージがデータベースに保存されていない可能性');
    } else {
      imageMessagesResult.rows.forEach((msg, index) => {
        console.log(`${index + 1}. メッセージID: ${msg.id}`);
        console.log(`   内容: ${msg.content}`);
        console.log(`   送信者: ${msg.sender}`);
        console.log(`   コンテキスト: ${JSON.stringify(msg.context, null, 2)}`);
        console.log(`   作成日時: ${msg.created_at}\n`);
      });
    }
    
    // 3. 生成画像テーブルの確認
    const generatedImagesQuery = `
      SELECT 
        id,
        image_url,
        context,
        created_at
      FROM generated_images
      WHERE partner_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const generatedImagesResult = await client.query(generatedImagesQuery, [partnerId]);
    
    console.log('=== 生成画像テーブル ===');
    if (generatedImagesResult.rows.length === 0) {
      console.log('生成画像が見つかりません');
    } else {
      generatedImagesResult.rows.forEach((img, index) => {
        console.log(`${index + 1}. 画像ID: ${img.id}`);
        console.log(`   画像URL: ${img.image_url}`);
        console.log(`   コンテキスト: ${img.context}`);
        console.log(`   作成日時: ${img.created_at}\n`);
      });
    }
    
    // 4. 問題の分析
    console.log('=== 問題の分析 ===');
    
    const hasGeneratedImages = generatedImagesResult.rows.length > 0;
    const hasImageMessages = imageMessagesResult.rows.length > 0;
    
    if (hasGeneratedImages && !hasImageMessages) {
      console.log('❌ 問題発見: 画像は生成されているがメッセージとして保存されていない');
      console.log('→ 原因: フロントエンドの generateImage() でメッセージをデータベースに保存していない');
      console.log('→ 解決策: 画像生成後にメッセージをデータベースに保存する処理を追加');
    } else if (!hasGeneratedImages && !hasImageMessages) {
      console.log('❌ 問題発見: 画像生成自体が行われていない');
      console.log('→ 原因: 画像生成APIが機能していない可能性');
    } else if (hasGeneratedImages && hasImageMessages) {
      console.log('✅ 正常: 画像とメッセージの両方が保存されている');
      console.log('→ ページリロード後も画像が表示されるはず');
      
      // さらに詳細な比較
      const latestImage = generatedImagesResult.rows[0];
      const latestImageMessage = imageMessagesResult.rows[0];
      
      console.log('\n最新の画像とメッセージの比較:');
      console.log(`最新画像作成日時: ${latestImage.created_at}`);
      console.log(`最新メッセージ作成日時: ${latestImageMessage.created_at}`);
      
      const imageContext = JSON.parse(latestImageMessage.context || '{}');
      if (imageContext.imageUrl === latestImage.image_url) {
        console.log('✅ 画像URLが一致しています');
      } else {
        console.log('❌ 画像URLが一致しません');
        console.log(`メッセージ内URL: ${imageContext.imageUrl}`);
        console.log(`生成画像URL: ${latestImage.image_url}`);
      }
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkChatImagePersistence().catch(console.error);