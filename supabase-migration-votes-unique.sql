-- Migration: Add UNIQUE constraint to votes table
-- Date: 2026-04-30
-- Purpose: Prevent race condition - one wallet can only vote once per artwork

-- First, remove any duplicate votes that might exist
-- Keep only the earliest vote for each (artwork_id, voter_address) pair
DELETE FROM votes a
USING votes b
WHERE a.id > b.id
  AND a.artwork_id = b.artwork_id
  AND a.voter_address = b.voter_address;

-- Add UNIQUE constraint to prevent duplicate votes
ALTER TABLE votes
ADD CONSTRAINT votes_artwork_voter_unique
UNIQUE (artwork_id, voter_address);

-- Add comment
COMMENT ON CONSTRAINT votes_artwork_voter_unique ON votes IS 'Ensures one wallet can only vote once per artwork';

-- Verify the constraint was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'votes_artwork_voter_unique'
    ) THEN
        RAISE NOTICE 'UNIQUE constraint successfully added to votes table';
    ELSE
        RAISE EXCEPTION 'Failed to add UNIQUE constraint';
    END IF;
END $$;
