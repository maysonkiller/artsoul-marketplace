-- Add blockchain integration fields to artworks table
-- This migration adds fields for smart contract integration

-- Add new columns for blockchain data
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS ipfs_hash TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS metadata_uri TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS blockchain_id TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artworks_blockchain_id ON artworks(blockchain_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_artworks_tx_hash ON artworks(tx_hash);

-- Add comment
COMMENT ON COLUMN artworks.ipfs_hash IS 'IPFS hash of the artwork file';
COMMENT ON COLUMN artworks.metadata_uri IS 'IPFS URI of the NFT metadata';
COMMENT ON COLUMN artworks.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN artworks.blockchain_id IS 'Artwork ID from smart contract';
COMMENT ON COLUMN artworks.status IS 'Artwork status: draft, auction, auction_failed, sold, unlisted';
