-- 個性メモリテーブルの作成
CREATE TABLE IF NOT EXISTS personality_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  strengths JSONB DEFAULT '[]'::jsonb,  -- 良い面の特性リスト
  shadows JSONB DEFAULT '[]'::jsonb,    -- 影の面の特性リスト
  core_values JSONB DEFAULT '[]'::jsonb, -- 大切にしている価値観
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- パートナーごとに1レコードのみ
  UNIQUE(partner_id)
);

-- インデックス
CREATE INDEX idx_personality_memories_partner_id ON personality_memories(partner_id);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_personality_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personality_memories_updated_at_trigger
BEFORE UPDATE ON personality_memories
FOR EACH ROW
EXECUTE FUNCTION update_personality_memories_updated_at();

-- サンプルデータ構造のコメント
COMMENT ON TABLE personality_memories IS '個性理解型メモリシステム - パートナーの個性を記録';
COMMENT ON COLUMN personality_memories.strengths IS '良い面の特性 [{trait, context, example, importance, lastSeen, frequency}]';
COMMENT ON COLUMN personality_memories.shadows IS '苦手な面・影の特性 [{trait, context, example, importance, lastSeen, frequency}]';
COMMENT ON COLUMN personality_memories.core_values IS '大切にしている価値観のリスト ["誠実さ", "家族", "成長"]';