const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: false
});

async function deleteAfter1310() {
  try {
    console.log('13:10以降のメッセージを削除します...');
    
    // metavicer4@gmail.comのユーザーIDを取得
    const [userResults] = await sequelize.query(`
      SELECT id, email FROM users WHERE email = 'metavicer4@gmail.com'
    `);
    
    const userId = userResults[0].id;
    const [partners] = await sequelize.query(`
      SELECT id, name FROM partners WHERE user_id = '${userId}'
    `);
    
    const partnerId = partners[0].id;
    console.log(`パートナー: ${partners[0].name} (ID: ${partnerId})`);

    // まず指定のメッセージを探す
    const [targetMessage] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        created_at
      FROM messages 
      WHERE partner_id = '${partnerId}'
      AND content LIKE '%チャット彼氏って、いろんな人にとって楽しい交流の場になってるみたいだね%'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (targetMessage.length === 0) {
      console.log('指定されたメッセージが見つかりません');
      return;
    }

    const cutoffTime = new Date(targetMessage[0].created_at).toISOString();
    console.log(`保持するメッセージ: "${targetMessage[0].content.substring(0, 50)}..."`);
    console.log(`削除対象: ${new Date(cutoffTime).toLocaleString('ja-JP')} より後のメッセージ`);
    
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

    console.log(`\n削除対象: ${messagesToDelete.length}件のメッセージ`);
    messagesToDelete.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
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
    console.log('\n削除後の最新メッセージ:');
    const [remainingMessages] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        created_at
      FROM messages 
      WHERE partner_id = '${partnerId}'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    remainingMessages.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content.substring(0, 80)}...`);
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

deleteAfter1310();