const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: console.log
});

async function checkMessages() {
  try {
    // metavicer4@gmail.comのユーザーIDを取得
    const [userResults] = await sequelize.query(`
      SELECT id, email FROM users WHERE email = 'metavicer4@gmail.com'
    `);
    console.log('ユーザー情報:', userResults);

    if (userResults.length === 0) {
      console.log('ユーザーが見つかりません');
      return;
    }

    const userId = userResults[0].id;

    // そのユーザーのパートナーを取得
    const [partners] = await sequelize.query(`
      SELECT id, name FROM partners WHERE user_id = '${userId}'
    `);
    console.log('パートナー情報:', partners);

    if (partners.length === 0) {
      console.log('パートナーが見つかりません');
      return;
    }

    const partnerId = partners[0].id;

    // 最新のメッセージを取得（送信者情報含む）
    const [messages] = await sequelize.query(`
      SELECT 
        id,
        content,
        sender,
        context,
        created_at as "createdAt"
      FROM messages 
      WHERE partner_id = '${partnerId}'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log('\n最新のメッセージ（新しい順）:');
    messages.forEach((msg, index) => {
      console.log(`\n--- メッセージ ${index + 1} ---`);
      console.log(`ID: ${msg.id}`);
      console.log(`送信者: ${msg.sender}`);
      console.log(`内容: ${msg.content}`);
      console.log(`作成日時: ${msg.createdAt}`);
      if (msg.context) {
        console.log(`コンテキスト:`, JSON.stringify(msg.context, null, 2));
      }
    });

    // 問題のメッセージを特定
    const problematicMessage = messages.find(msg => 
      msg.content.includes('達也っち、将来の老後はどんなふうに過ごしたいと思ってるの？')
    );

    if (problematicMessage) {
      console.log('\n\n=== 問題のメッセージ発見 ===');
      console.log('送信者タイプ:', problematicMessage.sender);
      console.log('期待される送信者: partner');
      console.log('実際の送信者:', problematicMessage.sender);
      console.log('メッセージID:', problematicMessage.id);
    }

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

checkMessages();