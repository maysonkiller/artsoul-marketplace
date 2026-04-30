-- Add network field to artworks table
-- This stores which blockchain network the NFT was created on

ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'sepolia';

-- Add comment
COMMENT ON COLUMN artworks.network IS 'Blockchain network where NFT was created (sepolia, baseSepolia, etc)';

-- Update existing artworks to have a network (default to sepolia for old ones)
UPDATE artworks
SET network = 'sepolia'
WHERE network IS NULL;
