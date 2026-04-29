-- Add AI analysis fields to artworks table
-- Migration: 20260429115700_ai_analysis.sql

-- Add system_value column (AI-determined value)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS system_value DECIMAL(18, 4);

-- Add ai_analysis column (full AI analysis text)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

-- Add index for system_value queries
CREATE INDEX IF NOT EXISTS idx_artworks_system_value ON artworks(system_value);

-- Add comment
COMMENT ON COLUMN artworks.system_value IS 'AI-determined artwork value in ETH';
COMMENT ON COLUMN artworks.ai_analysis IS 'Full Claude AI analysis text including reasoning';
