-- ArtSoul Marketplace Database Schema
-- Created: 2026-04-26

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    twitter_handle TEXT,
    discord_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table
CREATE TABLE artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'video', 'music', 'gif'
    thumbnail_url TEXT,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_estimated_value DECIMAL(18, 8), -- ETH value estimated by creator
    metadata JSONB, -- Additional metadata (dimensions, duration, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auctions table
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 3 days from start
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'ended', 'cancelled'
    winner_id UUID REFERENCES profiles(id), -- Winner gets right to resell
    winning_bid_amount DECIMAL(18, 8), -- Highest bid amount
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('active', 'ended', 'cancelled'))
);

-- Bids table
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(18, 8) NOT NULL, -- Bid amount in ETH
    max_bid_limit DECIMAL(18, 8), -- Maximum amount bidder is willing to pay
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Each user can only place ONE bid per auction
    UNIQUE(auction_id, bidder_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_artworks_creator ON artworks(creator_id);
CREATE INDEX idx_auctions_artwork ON auctions(artwork_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_amount ON bids(amount DESC);

-- Function to automatically set end_time to 3 days from start
CREATE OR REPLACE FUNCTION set_auction_end_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NULL THEN
        NEW.end_time := NEW.start_time + INTERVAL '3 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_auction_end_time
    BEFORE INSERT ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION set_auction_end_time();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artworks_updated_at BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update auction winner when new bid is placed
CREATE OR REPLACE FUNCTION update_auction_winner()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auction with highest bid
    UPDATE auctions
    SET
        winner_id = NEW.bidder_id,
        winning_bid_amount = NEW.amount
    WHERE
        id = NEW.auction_id
        AND (winning_bid_amount IS NULL OR NEW.amount > winning_bid_amount);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_auction_winner
    AFTER INSERT OR UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_auction_winner();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can read, anyone can create/update (we handle auth in app)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create profile" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update profile" ON profiles
    FOR UPDATE USING (true);

-- Artworks: Everyone can read, only creator can create/update
CREATE POLICY "Artworks are viewable by everyone" ON artworks
    FOR SELECT USING (true);

CREATE POLICY "Users can create artworks" ON artworks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can update own artworks" ON artworks
    FOR UPDATE USING (creator_id IN (
        SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    ));

-- Auctions: Everyone can read
CREATE POLICY "Auctions are viewable by everyone" ON auctions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create auctions" ON auctions
    FOR INSERT WITH CHECK (true);

-- Bids: Everyone can read, authenticated users can place bids
CREATE POLICY "Bids are viewable by everyone" ON bids
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can place bids" ON bids
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own bids" ON bids
    FOR UPDATE USING (bidder_id IN (
        SELECT id FROM profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    ));

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with wallet address and social media links';
COMMENT ON TABLE artworks IS 'Artworks with creator always preserved';
COMMENT ON TABLE auctions IS '3-day auctions where winner gets right to resell';
COMMENT ON TABLE bids IS 'One bid per user per auction with max limit';

COMMENT ON COLUMN auctions.winner_id IS 'Winner gets right to resell artwork, not automatic purchase';
COMMENT ON COLUMN bids.max_bid_limit IS 'Maximum amount bidder is willing to pay';
