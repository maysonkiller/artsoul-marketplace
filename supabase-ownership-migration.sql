-- Add owner_address field to artworks table
-- Run this in Supabase SQL Editor

-- Add owner_address column (initially same as creator)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS owner_address TEXT;

-- Set initial owner to creator for existing artworks
UPDATE artworks
SET owner_address = creator_id
WHERE owner_address IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artworks_owner_address ON artworks(owner_address);

-- Add comment
COMMENT ON COLUMN artworks.owner_address IS 'Current owner of the artwork (changes after auction)';
