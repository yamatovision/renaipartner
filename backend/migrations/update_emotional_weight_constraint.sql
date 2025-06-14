-- memoriesテーブルのemotional_weight制約を更新
-- ネガティブな感情（-10）からポジティブな感情（10）まで表現可能にする

-- 既存の制約を削除
ALTER TABLE memories 
DROP CONSTRAINT IF EXISTS memories_emotional_weight_check;

-- 新しい制約を追加（-10から10の範囲を許可）
ALTER TABLE memories 
ADD CONSTRAINT memories_emotional_weight_check 
CHECK (emotional_weight >= -10 AND emotional_weight <= 10);

-- 変更内容の確認
-- -10: 非常にネガティブな感情（深い悲しみ、強い不安など）
-- -5: ネガティブな感情（不安、心配など）
-- 0: 中立的な感情
-- 5: ポジティブな感情（嬉しい、楽しいなど）
-- 10: 非常にポジティブな感情（大きな喜び、深い愛情など）