-- Migration script to normalize wallet addresses to lowercase
-- This ensures wallet address is the single source of truth for user identity

-- Step 1: Normalize all wallet_address in profiles table to lowercase
UPDATE profiles
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Step 2: Normalize all creator_id in artworks table to lowercase
UPDATE artworks
SET creator_id = LOWER(creator_id)
WHERE creator_id != LOWER(creator_id);

-- Step 3: Normalize auction_winner_address in artworks table
UPDATE artworks
SET auction_winner_address = LOWER(auction_winner_address)
WHERE auction_winner_address IS NOT NULL
  AND auction_winner_address != LOWER(auction_winner_address);

-- Step 4: Normalize current_owner_address in artworks table
UPDATE artworks
SET current_owner_address = LOWER(current_owner_address)
WHERE current_owner_address IS NOT NULL
  AND current_owner_address != LOWER(current_owner_address);

-- Step 5: Normalize wallet_address in votes table (if exists)
UPDATE votes
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Step 6: Find and merge duplicate profiles (same wallet, different case)
-- This will keep the profile with the most recent updated_at
WITH duplicates AS (
  SELECT
    LOWER(wallet_address) as normalized_address,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY updated_at DESC) as all_ids
  FROM profiles
  GROUP BY LOWER(wallet_address)
  HAVING COUNT(*) > 1
)
-- Update artworks to point to the kept profile
UPDATE artworks a
SET creator_id = (
  SELECT p.wallet_address
  FROM profiles p
  WHERE p.id = d.keep_id
)
FROM duplicates d
WHERE LOWER(a.creator_id) = d.normalized_address;

-- Step 7: Delete duplicate profiles (keep only the most recent one)
DELETE FROM profiles
WHERE id IN (
  SELECT unnest(all_ids[2:])
  FROM (
    SELECT ARRAY_AGG(id ORDER BY updated_at DESC) as all_ids
    FROM profiles
    GROUP BY LOWER(wallet_address)
    HAVING COUNT(*) > 1
  ) sub
);

-- Step 8: Add constraint to ensure wallet_address is always lowercase (PostgreSQL)
-- This prevents future case-sensitivity issues
ALTER TABLE profiles
ADD CONSTRAINT wallet_address_lowercase
CHECK (wallet_address = LOWER(wallet_address));

-- Step 9: Ensure wallet_address is UNIQUE
-- (This should already exist, but adding for safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_wallet_address_key'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_wallet_address_key UNIQUE (wallet_address);
  END IF;
END $$;

-- Verification queries (run these to check the migration)
-- SELECT COUNT(*), COUNT(DISTINCT LOWER(wallet_address)) FROM profiles;
-- SELECT wallet_address FROM profiles WHERE wallet_address != LOWER(wallet_address);
-- SELECT creator_id FROM artworks WHERE creator_id != LOWER(creator_id);
