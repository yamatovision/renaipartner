-- パートナーテーブルに現在地カラムを追加
-- 2024-06-15: 場所システム統合のためのマイグレーション

-- current_location_idカラムを追加（NULL許可で開始）
ALTER TABLE partners 
ADD COLUMN current_location_id VARCHAR(50);

-- 外部キー制約は後で追加する予定（location管理の実装次第）
-- 現在は参照整合性チェックなしで場所IDの文字列を保存

-- コメントを追加
COMMENT ON COLUMN partners.current_location_id IS 'パートナーの現在地ID (locations-data.tsの場所IDに対応)';

-- 既存レコードのデフォルト値設定（教室を默认）
UPDATE partners 
SET current_location_id = 'school_classroom' 
WHERE current_location_id IS NULL;

-- インデックスを追加（検索性能向上のため）
CREATE INDEX idx_partners_current_location ON partners(current_location_id);