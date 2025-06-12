import { pool } from '../src/config/database.config';

/**
 * 特定ユーザーの関係性メトリクスをクリーンアップするスクリプト
 * trust_level と emotional_connection を NULL に設定
 */
async function migrateIndividualUser(email: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n=== ${email} のデータマイグレーション開始 ===\n`);
    
    // トランザクション開始
    await client.query('BEGIN');
    
    // 1. ユーザーの存在確認
    const userResult = await client.query(
      'SELECT id, surname, first_name FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ ユーザー ${email} が見つかりません`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ ユーザー確認: ${user.surname} ${user.first_name} (ID: ${user.id})`);
    
    // 2. パートナー情報の取得
    const partnersResult = await client.query(
      'SELECT id, name FROM partners WHERE user_id = $1',
      [user.id]
    );
    
    if (partnersResult.rows.length === 0) {
      console.log('ℹ️  パートナーが存在しません');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log(`\n📋 パートナー一覧 (${partnersResult.rows.length}件):`);
    partnersResult.rows.forEach(partner => {
      console.log(`  - ${partner.name} (ID: ${partner.id})`);
    });
    
    // 3. 現在のメトリクス状態を確認
    const partnerIds = partnersResult.rows.map(p => p.id);
    const currentMetricsResult = await client.query(
      `SELECT 
        rm.id,
        rm.partner_id,
        p.name as partner_name,
        rm.intimacy_level,
        rm.trust_level,
        rm.emotional_connection
      FROM relationship_metrics rm
      JOIN partners p ON rm.partner_id = p.id
      WHERE rm.partner_id = ANY($1)`,
      [partnerIds]
    );
    
    console.log('\n📊 現在のメトリクス状態:');
    currentMetricsResult.rows.forEach(metric => {
      console.log(`  ${metric.partner_name}:`);
      console.log(`    - 親密度: ${metric.intimacy_level}%`);
      console.log(`    - 信頼度: ${metric.trust_level}%`);
      console.log(`    - 感情的つながり: ${metric.emotional_connection}%`);
    });
    
    // 4. 更新実行
    const updateResult = await client.query(
      `UPDATE relationship_metrics
      SET 
        trust_level = NULL,
        emotional_connection = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE partner_id = ANY($1)
      RETURNING partner_id`,
      [partnerIds]
    );
    
    console.log(`\n✅ ${updateResult.rowCount}件のレコードを更新しました`);
    
    // 5. 更新後の状態を確認
    const updatedMetricsResult = await client.query(
      `SELECT 
        rm.id,
        rm.partner_id,
        p.name as partner_name,
        rm.intimacy_level,
        rm.trust_level,
        rm.emotional_connection
      FROM relationship_metrics rm
      JOIN partners p ON rm.partner_id = p.id
      WHERE rm.partner_id = ANY($1)`,
      [partnerIds]
    );
    
    console.log('\n📊 更新後のメトリクス状態:');
    updatedMetricsResult.rows.forEach(metric => {
      console.log(`  ${metric.partner_name}:`);
      console.log(`    - 親密度: ${metric.intimacy_level}% (保持)`);
      console.log(`    - 信頼度: ${metric.trust_level === null ? 'NULL' : metric.trust_level + '%'}`);
      console.log(`    - 感情的つながり: ${metric.emotional_connection === null ? 'NULL' : metric.emotional_connection + '%'}`);
    });
    
    // 6. その他のデータ件数を確認（保持されることを確認）
    const messagesCount = await client.query(
      'SELECT COUNT(*) FROM messages WHERE partner_id = ANY($1)',
      [partnerIds]
    );
    
    const memoriesCount = await client.query(
      'SELECT COUNT(*) FROM memories WHERE partner_id = ANY($1)',
      [partnerIds]
    );
    
    console.log('\n📚 保持されるデータ:');
    console.log(`  - メッセージ: ${messagesCount.rows[0].count}件`);
    console.log(`  - メモリ: ${memoriesCount.rows[0].count}件`);
    
    // 確認プロンプト
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      readline.question('\n⚠️  このマイグレーションを実行しますか？ (yes/no): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() === 'yes') {
      await client.query('COMMIT');
      console.log('\n✅ マイグレーション完了！');
    } else {
      await client.query('ROLLBACK');
      console.log('\n❌ マイグレーションをキャンセルしました');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ エラーが発生しました:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2];

if (!email) {
  console.error('使用方法: npm run migrate:individual -- metavicer@gmail.com');
  process.exit(1);
}

// 実行
migrateIndividualUser(email).catch(console.error);