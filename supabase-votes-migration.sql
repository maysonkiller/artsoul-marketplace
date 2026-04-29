-- Create votes table for Community Voting
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    voter_address TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('undervalued', 'fair', 'overvalued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(artwork_id, voter_address)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_votes_artwork_id ON votes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_address ON votes(voter_address);

-- Enable Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read votes
CREATE POLICY "Anyone can read votes"
    ON votes FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert their own votes
CREATE POLICY "Users can insert their own votes"
    ON votes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own votes
CREATE POLICY "Users can update their own votes"
    ON votes FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Add comment
COMMENT ON TABLE votes IS 'Community voting for artwork valuation';
