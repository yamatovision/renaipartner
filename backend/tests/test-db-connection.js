const { Client } = require('pg');

// テスト用の接続情報
// IPv4対応のSession Pooler接続を使用
const password = encodeURIComponent('Mikoto@123');
const connectionString = `postgresql://postgres.alnodpuqafoogumlekpw:${password}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;

async function testConnection() {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        console.log('データベースに接続を試みています...');
        await client.connect();
        console.log('✅ データベース接続成功！');
        
        // 簡単なクエリを実行してテスト
        const result = await client.query('SELECT NOW()');
        console.log('現在時刻:', result.rows[0].now);
        
        await client.end();
        console.log('接続を正常に終了しました。');
        
        // 成功した接続文字列を表示
        console.log('\n成功した接続文字列:');
        console.log(connectionString);
        
    } catch (error) {
        console.error('❌ データベース接続エラー:', error.message);
        console.log('\nパスワードが間違っている可能性があります。');
        console.log('Supabaseダッシュボードで「Reset database password」から再設定してください。');
    }
}

testConnection();