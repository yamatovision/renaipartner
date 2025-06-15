-- 親密度データ統一マイグレーション
-- relationship_metricsテーブルからintimacy_levelを削除し、partnersテーブルを唯一の真実源とする
-- 実行前にpartnersテーブルのintimacy_levelを最新の値に同期

BEGIN;

-- 1. データ同期: relationship_metricsの値をpartnersテーブルに反映
UPDATE partners 
SET intimacy_level = rm.intimacy_level
FROM relationship_metrics rm 
WHERE partners.id = rm.partner_id;

-- 2. 同期確認用クエリ（実行前確認）
SELECT 
    p.name as partner_name,
    p.intimacy_level as partners_intimacy,
    rm.intimacy_level as metrics_intimacy,
    CASE 
        WHEN p.intimacy_level = rm.intimacy_level THEN 'SYNCED'
        ELSE 'MISMATCH'
    END as sync_status
FROM partners p 
JOIN relationship_metrics rm ON p.id = rm.partner_id;

-- 3. relationship_metricsテーブルからintimacy_level列を削除
ALTER TABLE relationship_metrics DROP COLUMN IF EXISTS intimacy_level;

-- 4. 削除後の確認
\d relationship_metrics;

-- 5. partnersテーブルの親密度確認
SELECT 
    name as partner_name,
    intimacy_level
FROM partners;

COMMIT;

-- 実行手順:
-- 1. このスクリプトをROLLBACK状態で実行して確認
-- 2. 問題なければCOMMITで本実行