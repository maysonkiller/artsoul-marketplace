-- Fix foreign key relationships for ArtSoul marketplace
-- Run this in Supabase SQL Editor

-- 1. Add foreign key constraint from artworks to profiles
ALTER TABLE artworks
ADD CONSTRAINT artworks_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES profiles(wallet_address)
ON DELETE CASCADE;

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_artworks_creator_id ON artworks(creator_id);
CREATE INDEX IF NOT EXISTS idx_artworks_owner_address ON artworks(owner_address);
CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status);
CREATE INDEX IF NOT EXISTS idx_votes_artwork_id ON votes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_address ON votes(voter_address);
CREATE INDEX IF NOT EXISTS idx_votes_composite ON votes(artwork_id, voter_address);

-- 3. Verify foreign keys exist
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('artworks', 'votes', 'auctions');
