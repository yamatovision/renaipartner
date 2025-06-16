const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: false
});

async function cleanupMessages() {
  try {
    console.log('特定メッセージのクリーンアップを開始します...');
    
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

    // 1. 「やあ」メッセージを両方とも削除
    console.log('\n1. 「やあ」メッセージを削除します...');
    
    const deleteYaah = await sequelize.query(`
      DELETE FROM messages 
      WHERE partner_id = '${partnerId}' 
      AND content = 'やあ'
    `);
    console.log('「やあ」メッセージを削除しました');

    // 2. 「あれ」メッセージを両方とも削除
    console.log('\n2. 「あれ」メッセージを削除します...');
    
    const deleteAre = await sequelize.query(`
      DELETE FROM messages 
      WHERE partner_id = '${partnerId}' 
      AND content = 'あれ'
    `);
    console.log('「あれ」メッセージを削除しました');

    // 3. 重複した「そうだね。いいかも。でもずっと仕事してたいかも」を削除
    console.log('\n3. 重複したメッセージを削除します...');
    
    // パートナーが繰り返したメッセージを削除（ユーザーの発言の後に同じ内容でパートナーが発言した場合）
    const deleteDuplicate = await sequelize.query(`
      DELETE FROM messages 
      WHERE id = '4e70e2ee-c124-4560-af47-38ed5015820e'
    `);
    console.log('重複した「そうだね。いいかも。でもずっと仕事してたいかも」メッセージを削除しました');

    // 4. 重複した「教科書変えないとダメだと思う」（古い方）を削除
    console.log('\n4. 古い重複メッセージを削除します...');
    
    const deleteOldDuplicate = await sequelize.query(`
      DELETE FROM messages 
      WHERE id = 'b62aa55a-e77c-4ae9-9719-011330e5ba9f'
    `);
    console.log('古い「教科書変えないとダメだと思う」メッセージを削除しました');

    // 5. 修正後のメッセージを確認
    console.log('\n5. 修正後の最新メッセージを確認します...');
    
    const [messages] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        created_at
      FROM messages 
      WHERE partner_id = '${partnerId}'
      ORDER BY created_at DESC
      LIMIT 15
    `);

    console.log('\n修正後の最新メッセージ（新しい順）:');
    messages.forEach((msg, index) => {
      const time = new Date(msg.created_at).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`${index + 1}. [${msg.sender}] ${time} - ${msg.content.substring(0, 50)}...`);
    });

    console.log('\n✅ メッセージのクリーンアップが完了しました');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

cleanupMessages();