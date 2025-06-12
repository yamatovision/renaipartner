-- 個別ユーザー用のメトリクスクリーンアップスクリプト
-- 対象: metavicer@gmail.com のデータのみ
-- 
-- このスクリプトは以下を行います：
-- 1. 対象ユーザーの関係性メトリクスから trust_level と emotional_connection のデータをクリア
-- 2. 他のデータ（履歴、メッセージなど）はすべて保持

-- トランザクション開始
BEGIN;

-- 1. まず対象ユーザーを特定
WITH target_user AS (
  SELECT id FROM users WHERE email = 'metavicer@gmail.com'
),
-- 2. そのユーザーのパートナーを特定
target_partners AS (
  SELECT id FROM partners WHERE user_id IN (SELECT id FROM target_user)
)
-- 3. 関係性メトリクスの更新前の状態を確認（デバッグ用）
SELECT 
  rm.id,
  rm.partner_id,
  p.name as partner_name,
  rm.intimacy_level,
  rm.trust_level,
  rm.emotional_connection,
  rm.communication_frequency,
  rm.last_interaction,
  rm.shared_experiences
FROM relationship_metrics rm
JOIN partners p ON rm.partner_id = p.id
WHERE rm.partner_id IN (SELECT id FROM target_partners);

-- 4. 実際の更新：trust_level と emotional_connection を NULL に設定
-- （アプリケーション側でオプショナルとして扱われるため）
UPDATE relationship_metrics
SET 
  trust_level = NULL,
  emotional_connection = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE partner_id IN (
  SELECT id FROM partners 
  WHERE user_id IN (
    SELECT id FROM users WHERE email = 'metavicer@gmail.com'
  )
);

-- 5. 更新後の状態を確認
WITH target_user AS (
  SELECT id FROM users WHERE email = 'metavicer@gmail.com'
),
target_partners AS (
  SELECT id FROM partners WHERE user_id IN (SELECT id FROM target_user)
)
SELECT 
  rm.id,
  rm.partner_id,
  p.name as partner_name,
  rm.intimacy_level,
  rm.trust_level,
  rm.emotional_connection,
  rm.communication_frequency,
  rm.last_interaction,
  rm.shared_experiences
FROM relationship_metrics rm
JOIN partners p ON rm.partner_id = p.id
WHERE rm.partner_id IN (SELECT id FROM target_partners);

-- 6. 影響を受けたレコード数を表示
SELECT COUNT(*) as updated_records_count
FROM relationship_metrics
WHERE partner_id IN (
  SELECT id FROM partners 
  WHERE user_id IN (
    SELECT id FROM users WHERE email = 'metavicer@gmail.com'
  )
);

-- コミット（実行時は確認後にコメントを外してください）
-- COMMIT;

-- ロールバック（テスト時はこちらを使用）
ROLLBACK;

-- 実行手順：
-- 1. このスクリプトをROLLBACKの状態で実行して、影響範囲を確認
-- 2. 結果を確認後、ROLLBACKをコメントアウトし、COMMITのコメントを外して再実行
-- 3. 実行コマンド例：
--    psql -h your-host -U your-user -d your-database < cleanup_unused_metrics_individual.sql