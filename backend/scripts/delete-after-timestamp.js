const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: false
});

async function deleteMessagesAfterTimestamp() {
  try {
    console.log('14:08以降のメッセージを削除します...');
    
    // metavicer4@gmail.comのユーザーIDを取得
    const [userResults] = await sequelize.query(`
      SELECT id, email FROM users WHERE email = 'metavicer4@gmail.com'
    `);
    
    if (userResults.length === 0) {
      console.log('ユーザーが見つかりません');
      return;
    }

    const userId = userResults[0].id;
    const [partners] = await sequelize.query(`
      SELECT id, name FROM partners WHERE user_id = '${userId}'
    `);
    
    if (partners.length === 0) {
      console.log('パートナーが見つかりません');
      return;
    }

    const partnerId = partners[0].id;
    console.log(`パートナー: ${partners[0].name} (ID: ${partnerId})`);

    // 2025年6月16日14:08:06より後のメッセージを削除
    // 「教科書を変えるという考え、すごく大事だね...」のメッセージIDを確認して、それより後を削除
    const cutoffTime = '2025-06-16 14:08:06+09';
    
    console.log(`\n削除対象: ${cutoffTime} より後のメッセージ`);
    
    // 削除対象メッセージを確認
    const [messagesToDelete] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        created_at
      FROM messages 
      WHERE partner_id = '${partnerId}'
      AND created_at > '${cutoffTime}'
      ORDER BY created_at ASC
    `);

    if (messagesToDelete.length === 0) {
      console.log('削除対象のメッセージはありません');
      return;
    }

    console.log('\n削除対象メッセージ:');
    messagesToDelete.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString('ja-JP');
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content.substring(0, 50)}...`);
    });

    // 実際に削除
    const deleteResult = await sequelize.query(`
      DELETE FROM messages 
      WHERE partner_id = '${partnerId}'
      AND created_at > '${cutoffTime}'
    `);

    console.log(`\n✅ ${messagesToDelete.length}件のメッセージを削除しました`);

    // 残っているメッセージを確認
    console.log('\n残っている最新メッセージ:');
    const [remainingMessages] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        created_at
      FROM messages 
      WHERE partner_id = '${partnerId}'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    remainingMessages.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString('ja-JP');
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

deleteMessagesAfterTimestamp();