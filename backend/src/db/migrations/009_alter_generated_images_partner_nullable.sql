-- generated_imagesテーブルのpartner_idカラムをNULL許容に変更
-- オンボーディング時など、パートナーが存在しない状態でも画像生成を可能にするため

ALTER TABLE generated_images 
ALTER COLUMN partner_id DROP NOT NULL;

-- インデックスは維持（NULL値も含めてインデックス可能）
-- 既存のパートナーIDによる検索パフォーマンスは変わらない