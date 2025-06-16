const { Sequelize } = require('sequelize');

// データベース接続
const sequelize = new Sequelize('postgresql://neondb_owner:npg_k2nlWUgHA8EO@ep-morning-heart-a1w79rwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require', {
  logging: false // ログを抑制
});

async function fixMessages() {
  try {
    console.log('メッセージ修正スクリプトを開始します...');
    
    // metavicer4@gmail.comのユーザーIDを取得
    const [userResults] = await sequelize.query(`
      SELECT id, email FROM users WHERE email = 'metavicer4@gmail.com'
    `);
    
    if (userResults.length === 0) {
      console.log('ユーザーが見つかりません');
      return;
    }

    const userId = userResults[0].id;
    console.log(`ユーザーID: ${userId}`);

    // そのユーザーのパートナーを取得
    const [partners] = await sequelize.query(`
      SELECT id, name FROM partners WHERE user_id = '${userId}'
    `);
    
    if (partners.length === 0) {
      console.log('パートナーが見つかりません');
      return;
    }

    const partnerId = partners[0].id;
    const partnerName = partners[0].name;
    console.log(`パートナー: ${partnerName} (ID: ${partnerId})`);

    // 1. 重複したAI自発メッセージを削除
    console.log('\n1. 重複したAI自発メッセージを削除します...');
    
    // AI自発メッセージで重複しているものを特定
    const deleteResult = await sequelize.query(`
      DELETE FROM messages 
      WHERE id IN (
        SELECT m1.id
        FROM messages m1
        INNER JOIN messages m2 ON 
          m1.partner_id = m2.partner_id AND
          m1.content = m2.content AND
          m1.sender = 'user' AND
          m2.sender = 'partner' AND
          m1.created_at < m2.created_at AND
          m1.context->>'isProactiveMessage' = 'true'
        WHERE m1.partner_id = '${partnerId}'
      )
    `);
    console.log('重複したAI自発メッセージを削除しました');

    // 2. 「あれ」「教科書変えないとダメだと思う」などの短い意味のないメッセージを削除
    console.log('\n2. 意味のない短いメッセージを削除します...');
    
    const meaninglessMessages = [
      'あれ',
      'そうだね^^'
    ];
    
    for (const content of meaninglessMessages) {
      await sequelize.query(`
        DELETE FROM messages 
        WHERE partner_id = '${partnerId}' 
        AND content = '${content}'
        AND LENGTH(content) < 10
      `);
      console.log(`"${content}" メッセージを削除しました`);
    }

    // 3. パートナーが同じ内容を繰り返しているメッセージを削除
    console.log('\n3. パートナーが繰り返した同じメッセージを削除します...');
    
    await sequelize.query(`
      DELETE FROM messages 
      WHERE id IN (
        SELECT m1.id
        FROM messages m1
        INNER JOIN messages m2 ON 
          m1.partner_id = m2.partner_id AND
          m1.content = m2.content AND
          m1.sender = 'partner' AND
          m2.sender = 'user' AND
          m1.created_at > m2.created_at AND
          ABS(EXTRACT(EPOCH FROM (m1.created_at - m2.created_at))) < 60
        WHERE m1.partner_id = '${partnerId}'
        AND m1.content = '教科書変えないとダメだと思う'
      )
    `);
    console.log('パートナーの重複メッセージを削除しました');

    // 4. 修正後のメッセージを確認
    console.log('\n4. 修正後の最新メッセージを確認します...');
    
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

    console.log('\n修正後の最新メッセージ:');
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.sender}] ${msg.content.substring(0, 50)}...`);
    });

    console.log('\n✅ メッセージの修正が完了しました');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await sequelize.close();
  }
}

// 確認プロンプト
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('メッセージを修正しますか？ (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    fixMessages();
  } else {
    console.log('キャンセルしました');
    process.exit(0);
  }
  rl.close();
});