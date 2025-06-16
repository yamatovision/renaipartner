const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: false
});

async function deleteLatestMessages() {
  try {
    console.log('最新のメッセージを削除します...');
    
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

    // 最新の数件のメッセージを確認
    const [latestMessages] = await sequelize.query(`
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

    console.log('\n現在の最新メッセージ:');
    latestMessages.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString('ja-JP');
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content}`);
    });

    // 削除対象の特定のメッセージを削除
    const deleteTargets = [
      'ねぇ、あなたの将来の夢って何かな？私、あなたの大切なことをもっと知りたいな。',
      'ありがとう😊'
    ];

    for (const content of deleteTargets) {
      await sequelize.query(`
        DELETE FROM messages 
        WHERE partner_id = '${partnerId}' 
        AND content = $1
      `, {
        bind: [content]
      });
      console.log(`削除しました: "${content}"`);
    }

    // 削除後の状態を確認
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
      const time = new Date(msg.created_at).toLocaleString('ja-JP');
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content.substring(0, 80)}...`);
    });

    console.log('\n✅ 指定されたメッセージを削除しました');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

deleteLatestMessages();