import { pool } from '../src/config/database.config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 特定ユーザーのデータをJSON形式でバックアップ
 */
async function backupUserData(email: string) {
  const client = await pool.connect();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  const backupFile = path.join(backupDir, `backup_${email}_${timestamp}.json`);
  
  try {
    console.log(`\n=== ${email} のバックアップ作成 ===\n`);
    
    // バックアップディレクトリ作成
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 1. ユーザー情報
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ ユーザー ${email} が見つかりません`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ ユーザー情報取得: ${user.surname} ${user.first_name}`);
    
    // 2. パートナー情報
    const partnersResult = await client.query(
      'SELECT * FROM partners WHERE user_id = $1',
      [user.id]
    );
    console.log(`✅ パートナー情報取得: ${partnersResult.rows.length}件`);
    
    // 3. 関係性メトリクス
    const partnerIds = partnersResult.rows.map(p => p.id);
    let metricsResult = { rows: [] };
    if (partnerIds.length > 0) {
      metricsResult = await client.query(
        'SELECT * FROM relationship_metrics WHERE partner_id = ANY($1)',
        [partnerIds]
      );
      console.log(`✅ 関係性メトリクス取得: ${metricsResult.rows.length}件`);
    }
    
    // 4. メッセージ
    let messagesResult = { rows: [] };
    if (partnerIds.length > 0) {
      messagesResult = await client.query(
        'SELECT * FROM messages WHERE partner_id = ANY($1) ORDER BY created_at',
        [partnerIds]
      );
      console.log(`✅ メッセージ取得: ${messagesResult.rows.length}件`);
    }
    
    // 5. メモリ
    let memoriesResult = { rows: [] };
    if (partnerIds.length > 0) {
      memoriesResult = await client.query(
        'SELECT * FROM memories WHERE partner_id = ANY($1)',
        [partnerIds]
      );
      console.log(`✅ メモリ取得: ${memoriesResult.rows.length}件`);
    }
    
    // バックアップデータ作成
    const backupData = {
      metadata: {
        email: email,
        backupDate: new Date().toISOString(),
        version: '1.0'
      },
      user: user,
      partners: partnersResult.rows,
      relationshipMetrics: metricsResult.rows,
      messages: messagesResult.rows,
      memories: memoriesResult.rows,
      statistics: {
        partnersCount: partnersResult.rows.length,
        messagesCount: messagesResult.rows.length,
        memoriesCount: memoriesResult.rows.length
      }
    };
    
    // JSONファイルとして保存
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ バックアップ完了！`);
    console.log(`📁 保存先: ${backupFile}`);
    console.log(`📊 ファイルサイズ: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
    
    // 重要なメトリクスの現在値を表示
    if (metricsResult.rows.length > 0) {
      console.log('\n📌 現在の関係性メトリクス（バックアップ済み）:');
      for (const metric of metricsResult.rows as any[]) {
        const partner = partnersResult.rows.find((p: any) => p.id === metric.partner_id);
        console.log(`  ${partner?.name || 'Unknown'}:`);
        console.log(`    - 親密度: ${metric.intimacy_level}%`);
        console.log(`    - 信頼度: ${metric.trust_level}%`);
        console.log(`    - 感情的つながり: ${metric.emotional_connection}%`);
      }
    }
    
    return backupFile;
    
  } catch (error) {
    console.error('バックアップエラー:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 実行
const email = process.argv[2] || 'metavicer@gmail.com';
backupUserData(email)
  .then(backupFile => {
    console.log('\n次のステップ: マイグレーションを実行してください');
    console.log('npm run migrate:individual -- metavicer@gmail.com');
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });