-- Migration script to normalize wallet addresses to lowercase
-- FIXED VERSION 2: Handles votes table structure correctly

-- Step 1: Create temporary table to identify duplicates
CREATE TEMP TABLE duplicate_profiles AS
SELECT
    LOWER(wallet_address) as normalized_address,
    ARRAY_AGG(id ORDER BY updated_at DESC, created_at DESC) as profile_ids,
    COUNT(*) as duplicate_count
FROM profiles
GROUP BY LOWER(wallet_address)
HAVING COUNT(*) > 1;

-- Step 2: For each duplicate group, keep the most recent profile and delete others
DO $$
DECLARE
    dup_record RECORD;
    keep_id UUID;
    delete_ids UUID[];
BEGIN
    FOR dup_record IN SELECT * FROM duplicate_profiles LOOP
        -- Keep the first ID (most recent), delete the rest
        keep_id := dup_record.profile_ids[1];
        delete_ids := dup_record.profile_ids[2:array_length(dup_record.profile_ids, 1)];

        RAISE NOTICE 'Processing duplicates for address: %, keeping ID: %, deleting % profiles',
            dup_record.normalized_address, keep_id, array_length(delete_ids, 1);

        -- Update artworks to point to the kept profile
        UPDATE artworks
        SET creator_id = dup_record.normalized_address
        WHERE LOWER(creator_id) = dup_record.normalized_address;

        -- Update votes - check if column exists first
        BEGIN
            -- Try to update voter_address if it exists
            EXECUTE 'UPDATE votes SET voter_address = $1 WHERE LOWER(voter_address) = $2'
            USING dup_record.normalized_address, dup_record.normalized_address;
        EXCEPTION
            WHEN undefined_column THEN
                RAISE NOTICE 'voter_address column does not exist in votes table';
            WHEN undefined_table THEN
                RAISE NOTICE 'Votes table does not exist, skipping';
        END;

        -- Delete duplicate profiles
        DELETE FROM profiles WHERE id = ANY(delete_ids);

        RAISE NOTICE 'Deleted % duplicate profiles for address: %',
            array_length(delete_ids, 1), dup_record.normalized_address;
    END LOOP;
END $$;

-- Step 3: Normalize all remaining wallet_address to lowercase in profiles
UPDATE profiles
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Step 4: Normalize all creator_id in artworks table to lowercase
UPDATE artworks
SET creator_id = LOWER(creator_id)
WHERE creator_id != LOWER(creator_id);

-- Step 5: Normalize auction_winner_address in artworks table
UPDATE artworks
SET auction_winner_address = LOWER(auction_winner_address)
WHERE auction_winner_address IS NOT NULL
  AND auction_winner_address != LOWER(auction_winner_address);

-- Step 6: Normalize current_owner_address in artworks table
UPDATE artworks
SET current_owner_address = LOWER(current_owner_address)
WHERE current_owner_address IS NOT NULL
  AND current_owner_address != LOWER(current_owner_address);

-- Step 7: Normalize voter_address in votes table (if column exists)
DO $$
BEGIN
    -- Try voter_address column
    EXECUTE 'UPDATE votes SET voter_address = LOWER(voter_address) WHERE voter_address != LOWER(voter_address)';
    RAISE NOTICE 'Normalized voter_address in votes table';
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'voter_address column does not exist in votes table';
    WHEN undefined_table THEN
        RAISE NOTICE 'Votes table does not exist, skipping';
END $$;

-- Step 8: Add constraint to ensure wallet_address is always lowercase
-- First, drop the constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS wallet_address_lowercase;

-- Then add it
ALTER TABLE profiles
ADD CONSTRAINT wallet_address_lowercase
CHECK (wallet_address = LOWER(wallet_address));

-- Step 9: Ensure wallet_address is UNIQUE (should already exist, but adding for safety)
DO $$
BEGIN
    -- Try to add the unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_wallet_address_key'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_wallet_address_key UNIQUE (wallet_address);
        RAISE NOTICE 'Added UNIQUE constraint on wallet_address';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists on wallet_address';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Still have duplicate wallet addresses after cleanup. Please check the data manually.';
END $$;

-- Step 10: Verification queries
DO $$
DECLARE
    total_profiles INT;
    unique_addresses INT;
    remaining_duplicates INT;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(DISTINCT LOWER(wallet_address)) INTO unique_addresses FROM profiles;
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT LOWER(wallet_address)
        FROM profiles
        GROUP BY LOWER(wallet_address)
        HAVING COUNT(*) > 1
    ) sub;

    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'Total profiles: %', total_profiles;
    RAISE NOTICE 'Unique addresses: %', unique_addresses;
    RAISE NOTICE 'Remaining duplicates: %', remaining_duplicates;

    IF remaining_duplicates > 0 THEN
        RAISE WARNING 'There are still % duplicate addresses!', remaining_duplicates;
    ELSE
        RAISE NOTICE 'All duplicates resolved successfully!';
    END IF;
END $$;

-- Optional: Show any profiles with non-lowercase addresses (should be none)
SELECT wallet_address, 'Non-lowercase address found!' as issue
FROM profiles
WHERE wallet_address != LOWER(wallet_address);

-- Optional: Show any artworks with non-lowercase creator_id (should be none)
SELECT creator_id, 'Non-lowercase creator_id found!' as issue
FROM artworks
WHERE creator_id != LOWER(creator_id)
LIMIT 10;
