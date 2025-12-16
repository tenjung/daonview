-- Add region and category fields to campaigns table
-- region: For VISIT type campaigns (e.g., "대구/수성구", "서울/강남구")
-- category: For DELIVERY type campaigns (e.g., "뷰티", "식품", "생활용품")

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add comments
COMMENT ON COLUMN campaigns.region IS 'Region for VISIT type campaigns (format: 시/구)';
COMMENT ON COLUMN campaigns.category IS 'Category for DELIVERY type campaigns';

-- Update existing VISIT campaigns to extract region from title if needed
-- This is optional and can be done manually
