-- Migration: Add missing columns to artworks table
-- Date: 2026-04-29
-- Description: Add blockchain integration columns and AI analysis fields

-- Add missing columns to artworks table
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS blockchain_id INTEGER,
ADD COLUMN IF NOT EXISTS ipfs_hash TEXT,
ADD COLUMN IF NOT EXISTS metadata_uri TEXT,
ADD COLUMN IF NOT EXISTS creator_value DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS system_value DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS community_value DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- Add constraint for status
ALTER TABLE artworks
DROP CONSTRAINT IF EXISTS valid_artwork_status;

ALTER TABLE artworks
ADD CONSTRAINT valid_artwork_status CHECK (status IN ('draft', 'auction', 'sold'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artworks_blockchain_id ON artworks(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_ipfs_hash ON artworks(ipfs_hash);

-- Update creator_id to accept TEXT (wallet addresses) instead of UUID
-- First, drop the foreign key constraint
ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_creator_id_fkey;

-- Change creator_id type to TEXT
ALTER TABLE artworks ALTER COLUMN creator_id TYPE TEXT USING creator_id::TEXT;

-- Comments
COMMENT ON COLUMN artworks.blockchain_id IS 'ID from smart contract';
COMMENT ON COLUMN artworks.ipfs_hash IS 'IPFS hash of the artwork file';
COMMENT ON COLUMN artworks.metadata_uri IS 'URI to artwork metadata';
COMMENT ON COLUMN artworks.creator_value IS 'Value set by creator (ETH)';
COMMENT ON COLUMN artworks.system_value IS 'AI-generated value estimation (ETH)';
COMMENT ON COLUMN artworks.community_value IS 'Community voting value (ETH)';
COMMENT ON COLUMN artworks.ai_analysis IS 'Full AI analysis JSON';
COMMENT ON COLUMN artworks.status IS 'Artwork status: draft, auction, sold';
COMMENT ON COLUMN artworks.tx_hash IS 'Blockchain transaction hash';
