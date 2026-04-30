-- Migration: Auction System V2 - Floor Price & Direct Sales
-- Date: 2026-04-30
-- Purpose: Support new auction logic with floor price, auction winner, and direct sales

-- ============================================
-- ARTWORKS TABLE - Add new fields
-- ============================================

-- Add auction winner (honorary title, never changes)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS auction_winner_address TEXT;

-- Add current owner (changes on resale)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS current_owner_address TEXT;

-- Add floor price (minimum price after auction)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS floor_price DECIMAL(20, 8) DEFAULT 0;

-- Add sale price (for direct sales)
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(20, 8) DEFAULT 0;

-- Add winner deadline
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS winner_deadline TIMESTAMP;

-- Add comments
COMMENT ON COLUMN artworks.auction_winner_address IS 'Winner of auction (honorary title, never changes)';
COMMENT ON COLUMN artworks.current_owner_address IS 'Current NFT owner (changes on resale)';
COMMENT ON COLUMN artworks.floor_price IS 'Minimum price after auction (= highest bid)';
COMMENT ON COLUMN artworks.sale_price IS 'Current direct sale price';
COMMENT ON COLUMN artworks.winner_deadline IS 'Deadline for winner to purchase (24h after auction)';

-- Update status column to support new statuses
DO $$
BEGIN
    -- Drop old constraint if exists
    ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_status_check;

    -- Add new constraint with updated statuses
    ALTER TABLE artworks ADD CONSTRAINT artworks_status_check
    CHECK (status IN ('draft', 'auction', 'auction_ended', 'for_sale', 'sold', 'unlisted'));
END $$;

-- ============================================
-- AUCTIONS TABLE - Add new fields
-- ============================================

-- Add auction winner
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS auction_winner_address TEXT;

-- Add winner deadline
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS winner_deadline TIMESTAMP;

-- Add winner purchased flag
ALTER TABLE auctions
ADD COLUMN IF NOT EXISTS winner_purchased BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN auctions.auction_winner_address IS 'Final winner of auction';
COMMENT ON COLUMN auctions.winner_deadline IS 'Deadline for winner to purchase';
COMMENT ON COLUMN auctions.winner_purchased IS 'Did winner purchase the artwork?';

-- ============================================
-- BIDS_HISTORY TABLE - Create new table
-- ============================================

CREATE TABLE IF NOT EXISTS bids_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    bidder_address TEXT NOT NULL,
    bid_amount DECIMAL(20, 8) NOT NULL,
    deposit_amount DECIMAL(20, 8) NOT NULL,
    refunded BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bids_history_auction_id ON bids_history(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_history_artwork_id ON bids_history(artwork_id);
CREATE INDEX IF NOT EXISTS idx_bids_history_bidder ON bids_history(bidder_address);

-- Add comments
COMMENT ON TABLE bids_history IS 'History of all bids with deposits';
COMMENT ON COLUMN bids_history.bid_amount IS 'Full bid amount';
COMMENT ON COLUMN bids_history.deposit_amount IS '10% deposit paid';
COMMENT ON COLUMN bids_history.refunded IS 'Has deposit been refunded?';

-- ============================================
-- RLS POLICIES for bids_history
-- ============================================

-- Enable RLS
ALTER TABLE bids_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can read bids history" ON bids_history;
DROP POLICY IF EXISTS "System can insert bids" ON bids_history;

-- Allow anyone to read bids history (public auction data)
CREATE POLICY "Anyone can read bids history"
ON bids_history FOR SELECT
USING (true);

-- Only system can insert bids (via backend)
CREATE POLICY "System can insert bids"
ON bids_history FOR INSERT
WITH CHECK (true);

-- ============================================
-- FUNCTIONS - Helper functions
-- ============================================

-- Function to get current highest bidder for an auction
CREATE OR REPLACE FUNCTION get_highest_bidder(auction_uuid UUID)
RETURNS TABLE (
    bidder_address TEXT,
    bid_amount DECIMAL(20, 8),
    deposit_amount DECIMAL(20, 8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bh.bidder_address,
        bh.bid_amount,
        bh.deposit_amount
    FROM bids_history bh
    WHERE bh.auction_id = auction_uuid
    ORDER BY bh.bid_amount DESC, bh.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if winner purchase window is expired
CREATE OR REPLACE FUNCTION is_winner_window_expired(artwork_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deadline TIMESTAMP;
BEGIN
    SELECT winner_deadline INTO deadline
    FROM artworks
    WHERE id = artwork_uuid;

    IF deadline IS NULL THEN
        RETURN false;
    END IF;

    RETURN NOW() > deadline;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS - Auto-update logic
-- ============================================

-- Trigger to auto-set winner_deadline when auction ends
CREATE OR REPLACE FUNCTION set_winner_deadline()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'auction_ended' AND OLD.status = 'auction' THEN
        NEW.winner_deadline := NOW() + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_winner_deadline ON artworks;
CREATE TRIGGER trigger_set_winner_deadline
    BEFORE UPDATE ON artworks
    FOR EACH ROW
    EXECUTE FUNCTION set_winner_deadline();

-- ============================================
-- DATA MIGRATION - Update existing records
-- ============================================

-- Set current_owner_address for already sold artworks
UPDATE artworks
SET current_owner_address = owner_address
WHERE status = 'sold' AND owner_address IS NOT NULL;

-- Set floor_price to creator_value for artworks that had auctions
UPDATE artworks a
SET floor_price = (
    SELECT COALESCE(MAX(winning_bid_amount), a.creator_value)
    FROM auctions au
    WHERE au.artwork_id = a.id
)
WHERE status IN ('sold', 'auction');

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
    -- Verify new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artworks' AND column_name = 'auction_winner_address'
    ) THEN
        RAISE EXCEPTION 'Migration failed: auction_winner_address not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'bids_history'
    ) THEN
        RAISE EXCEPTION 'Migration failed: bids_history table not created';
    END IF;

    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📊 New columns added to artworks table';
    RAISE NOTICE '📊 New columns added to auctions table';
    RAISE NOTICE '📊 New bids_history table created';
    RAISE NOTICE '📊 Helper functions created';
    RAISE NOTICE '📊 Triggers created';
END $$;
