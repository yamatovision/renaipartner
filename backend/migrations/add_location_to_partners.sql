-- Partnersテーブルに場所情報カラムを追加
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS current_location_id VARCHAR(255) DEFAULT 'school_classroom',
ADD COLUMN IF NOT EXISTS location_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_partners_current_location ON partners(current_location_id);

-- コメントを追加
COMMENT ON COLUMN partners.current_location_id IS '現在のパートナーがいる場所ID';
COMMENT ON COLUMN partners.location_entered_at IS 'この場所に移動した日時';