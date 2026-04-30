-- Fix votes table constraint
-- Date: 2026-05-01
-- Purpose: Fix vote_type constraint to allow 'like' value

-- Drop old constraint
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;

-- Add new constraint that allows 'like'
ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check
CHECK (vote_type IN ('like', 'upvote', 'downvote'));

-- Verify the fix
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'votes_vote_type_check';
