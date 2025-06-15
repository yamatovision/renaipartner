import dotenv from 'dotenv';
import { pool } from './src/config/database.config';
import RelationshipMetricsModel from './src/db/models/RelationshipMetrics.model';
import PartnerModel from './src/db/models/Partner.model';

dotenv.config();

async function testRelationshipMetrics() {
  console.log('=== 関係性メトリクスAPI調査 ===\n');

  try {
    // 1. データベース接続確認
    console.log('1. データベース接続確認...');
    const client = await pool.connect();
    console.log('✅ データベース接続成功\n');
    client.release();

    // 2. パートナー存在確認（手動でパートナーIDを指定）
    console.log('2. パートナーデータ確認...');
    
    // データベースから既存のパートナーIDを取得
    const client3 = await pool.connect();
    let partnerId: string | null = null;
    let partnerName: string | null = null;
    
    try {
      const result = await client3.query('SELECT id, name FROM partners LIMIT 1');
      if (result.rows.length > 0) {
        partnerId = result.rows[0].id;
        partnerName = result.rows[0].name;
        console.log(`✅ テスト対象パートナー: ${partnerName} (ID: ${partnerId})`);
      } else {
        console.log('❌ パートナーが存在しません。まずパートナーを作成してください。');
        return;
      }
    } finally {
      client3.release();
    }
    console.log();

    // 3. 関係性メトリクステーブル構造確認
    console.log('3. 関係性メトリクステーブル構造確認...');
    const client2 = await pool.connect();
    try {
      const tableResult = await client2.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'relationship_metrics'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 relationship_metrics テーブル構造:');
      tableResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (NULL: ${row.is_nullable}, Default: ${row.column_default})`);
      });
      console.log();
    } catch (error) {
      console.log('❌ テーブル構造確認エラー:', (error as any).message);
    } finally {
      client2.release();
    }

    // 4. 既存の関係性メトリクス確認
    console.log('4. 既存の関係性メトリクス確認...');
    let existingMetrics = await RelationshipMetricsModel.findByPartnerId(partnerId!);
    
    if (existingMetrics) {
      console.log('✅ 既存の関係性メトリクス:');
      console.log('  - ID:', existingMetrics.id);
      console.log('  - 親密度:', existingMetrics.intimacyLevel);
      console.log('  - 会話頻度:', existingMetrics.conversationFrequency);
      console.log('  - 共有記憶数:', existingMetrics.sharedMemories);
      console.log('  - 最終交流:', existingMetrics.lastInteraction);
    } else {
      console.log('⚠️ 関係性メトリクスが存在しません。新規作成を試行...');
      
      try {
        existingMetrics = await RelationshipMetricsModel.create(partnerId!);
        console.log('✅ 関係性メトリクス作成成功:');
        console.log('  - ID:', existingMetrics.id);
        console.log('  - 親密度:', existingMetrics.intimacyLevel);
        console.log('  - 会話頻度:', existingMetrics.conversationFrequency);
        console.log('  - 共有記憶数:', existingMetrics.sharedMemories);
      } catch (createError) {
        console.log('❌ 関係性メトリクス作成失敗:', (createError as any).message);
        return;
      }
    }
    console.log();

    // 5. メモリサービスでの取得テスト
    console.log('5. MemoryServiceでの取得テスト...');
    try {
      const { MemoryService } = await import('./src/features/memory/memory.service');
      const memoryService = new MemoryService();
      
      const result = await memoryService.getRelationshipMetrics(partnerId!, {});
      console.log('✅ MemoryService.getRelationshipMetrics成功:');
      console.log('  - Current:', JSON.stringify(result.current, null, 2));
      console.log('  - Stage:', result.stage);
      console.log('  - Insights:', result.insights);
      console.log('  - Recommendations:', result.recommendations);
    } catch (serviceError) {
      console.log('❌ MemoryService.getRelationshipMetrics失敗:', (serviceError as any).message);
      console.log('❌ エラー詳細:', serviceError);
    }
    console.log();

    // 6. 関係性段階テスト
    console.log('6. 関係性段階判定テスト...');
    if (existingMetrics) {
      const stage = RelationshipMetricsModel.getRelationshipStage(existingMetrics);
      console.log(`✅ 現在の関係性段階: ${stage} (親密度: ${existingMetrics.intimacyLevel})`);
    }
    console.log();

    // 7. 親密度更新テスト
    console.log('7. 親密度更新テスト...');
    try {
      const updatedMetrics = await RelationshipMetricsModel.updateIntimacyLevel(partnerId!, 5);
      console.log('✅ 親密度更新成功:');
      console.log(`  - 更新後親密度: ${updatedMetrics.intimacyLevel}`);
      console.log(`  - 新しい段階: ${RelationshipMetricsModel.getRelationshipStage(updatedMetrics)}`);
    } catch (updateError) {
      console.log('❌ 親密度更新失敗:', (updateError as any).message);
    }
    console.log();

    console.log('=== 調査完了 ===');

  } catch (error) {
    console.error('❌ 調査中にエラーが発生しました:', error);
  } finally {
    await pool.end();
  }
}

testRelationshipMetrics().catch(console.error);