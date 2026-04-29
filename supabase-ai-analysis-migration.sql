-- Add AI analysis fields to artworks table
-- Run this in Supabase SQL Editor

-- Add system_reasoning field for AI analysis explanation
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS system_reasoning TEXT;

-- Add system_confidence field for AI confidence score
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS system_confidence TEXT;

-- Comment
COMMENT ON COLUMN artworks.system_reasoning IS 'AI explanation of the system_value valuation';
COMMENT ON COLUMN artworks.system_confidence IS 'AI confidence level (high/medium/low)';
