const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: false
});

async function deleteRemainingMessage() {
  try {
    // metavicer4@gmail.comのユーザーIDを取得
    const [userResults] = await sequelize.query(`
      SELECT id, email FROM users WHERE email = 'metavicer4@gmail.com'
    `);
    
    const userId = userResults[0].id;
    const [partners] = await sequelize.query(`
      SELECT id, name FROM partners WHERE user_id = '${userId}'
    `);
    
    const partnerId = partners[0].id;

    // 残っているメッセージも削除
    await sequelize.query(`
      DELETE FROM messages 
      WHERE partner_id = '${partnerId}' 
      AND content = 'ねぇ、あなたが将来やりたいことって、どんな夢があるの？'
    `);

    console.log('残りのメッセージも削除しました');

    // 最終状態を確認
    const [finalMessages] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        created_at
      FROM messages 
      WHERE partner_id = '${partnerId}'
      ORDER BY created_at DESC
      LIMIT 3
    `);

    console.log('\n最終的な最新メッセージ:');
    finalMessages.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString('ja-JP');
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content.substring(0, 80)}...`);
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

deleteRemainingMessage();