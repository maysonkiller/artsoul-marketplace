-- Migration: Add blockchain_id and status fields to artworks table
-- Date: 2026-04-30
-- Purpose: Enable proper synchronization between blockchain and database

-- Add blockchain_id column (stores uint256 from smart contract)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS blockchain_id BIGINT UNIQUE;

-- Add index for faster lookups by blockchain_id
CREATE INDEX IF NOT EXISTS idx_artworks_blockchain_id ON artworks(blockchain_id);

-- Add comment
COMMENT ON COLUMN artworks.blockchain_id IS 'Artwork ID from smart contract (uint256)';

-- Verify status column exists (should already be there from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artworks' AND column_name = 'status'
    ) THEN
        ALTER TABLE artworks ADD COLUMN status TEXT DEFAULT 'draft';

        -- Add check constraint for valid statuses
        ALTER TABLE artworks ADD CONSTRAINT artworks_status_check
        CHECK (status IN ('draft', 'auction', 'sold', 'unlisted'));
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN artworks.status IS 'Artwork status: draft, auction, sold, unlisted';

-- Update existing artworks without blockchain_id to have NULL (they are database-only)
-- This is safe because blockchain_id is optional for artworks not yet uploaded to blockchain
