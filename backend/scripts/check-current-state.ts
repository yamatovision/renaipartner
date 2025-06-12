import { pool } from '../src/config/database.config';

/**
 * 現在のデータベース状態を確認するスクリプト
 */
async function checkCurrentState(email: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n=== ${email} の現在のデータ状態確認 ===\n`);
    
    // 1. ユーザー情報
    const userResult = await client.query(
      'SELECT id, email, surname, first_name, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ ユーザー ${email} が見つかりません`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 ユーザー情報:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - 名前: ${user.surname} ${user.first_name}`);
    console.log(`  - 登録日: ${user.created_at}`);
    
    // 2. パートナー情報
    const partnersResult = await client.query(
      `SELECT id, name, gender, personality_type, intimacy_level, created_at 
       FROM partners WHERE user_id = $1`,
      [user.id]
    );
    
    console.log(`\n🤖 パートナー情報 (${partnersResult.rows.length}件):`);
    for (const partner of partnersResult.rows) {
      console.log(`  - ${partner.name} (${partner.gender})`);
      console.log(`    ID: ${partner.id}`);
      console.log(`    性格: ${partner.personality_type}`);
      console.log(`    親密度: ${partner.intimacy_level}%`);
      console.log(`    作成日: ${partner.created_at}`);
    }
    
    // 3. 関係性メトリクス
    const partnerIds = partnersResult.rows.map(p => p.id);
    if (partnerIds.length > 0) {
      const metricsResult = await client.query(
        `SELECT 
          rm.*,
          p.name as partner_name
        FROM relationship_metrics rm
        JOIN partners p ON rm.partner_id = p.id
        WHERE rm.partner_id = ANY($1)`,
        [partnerIds]
      );
      
      console.log('\n📊 関係性メトリクス:');
      for (const metric of metricsResult.rows) {
        console.log(`  ${metric.partner_name}:`);
        console.log(`    - 親密度: ${metric.intimacy_level}%`);
        console.log(`    - 信頼度: ${metric.trust_level}%`);
        console.log(`    - 感情的つながり: ${metric.emotional_connection}%`);
        console.log(`    - 会話頻度: ${metric.communication_frequency}回`);
        console.log(`    - 共有メモリ: ${metric.shared_experiences}件`);
        console.log(`    - 最終対話: ${metric.last_interaction}`);
      }
      
      // 4. データ統計
      const messagesCount = await client.query(
        'SELECT COUNT(*) FROM messages WHERE partner_id = ANY($1)',
        [partnerIds]
      );
      
      const memoriesCount = await client.query(
        'SELECT COUNT(*) FROM memories WHERE partner_id = ANY($1)',
        [partnerIds]
      );
      
      console.log('\n📈 データ統計:');
      console.log(`  - 総メッセージ数: ${messagesCount.rows[0].count}件`);
      console.log(`  - 総メモリ数: ${memoriesCount.rows[0].count}件`);
      
      // 5. 最新のメッセージ
      const latestMessages = await client.query(
        `SELECT m.content, m.sender, m.created_at, p.name as partner_name
         FROM messages m
         JOIN partners p ON m.partner_id = p.id
         WHERE m.partner_id = ANY($1)
         ORDER BY m.created_at DESC
         LIMIT 3`,
        [partnerIds]
      );
      
      if (latestMessages.rows.length > 0) {
        console.log('\n💬 最新のメッセージ:');
        for (const msg of latestMessages.rows) {
          const sender = msg.sender === 'user' ? 'ユーザー' : msg.partner_name;
          console.log(`  [${msg.created_at.toLocaleString('ja-JP')}] ${sender}: ${msg.content.substring(0, 50)}...`);
        }
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 実行
const email = process.argv[2] || 'metavicer@gmail.com';
checkCurrentState(email).catch(console.error);