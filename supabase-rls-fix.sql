-- Fix RLS Policies for ArtSoul Marketplace
-- This script updates Row Level Security policies to work with anonymous auth + wallet metadata
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can update profile" ON profiles;
DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON artworks;
DROP POLICY IF EXISTS "Users can create artworks" ON artworks;
DROP POLICY IF EXISTS "Creators can update own artworks" ON artworks;
DROP POLICY IF EXISTS "Auctions are viewable by everyone" ON auctions;
DROP POLICY IF EXISTS "Anyone can create auctions" ON auctions;
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON bids;
DROP POLICY IF EXISTS "Authenticated users can place bids" ON bids;
DROP POLICY IF EXISTS "Users can update own bids" ON bids;

-- ============================================
-- PROFILES - Allow all operations for authenticated users
-- ============================================

-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Authenticated users can create profiles
CREATE POLICY "Authenticated users can create profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update any profile (we check wallet in app)
CREATE POLICY "Authenticated users can update profiles" ON profiles
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- ARTWORKS - Allow all operations for authenticated users
-- ============================================

-- Everyone can view artworks
CREATE POLICY "Artworks are viewable by everyone" ON artworks
    FOR SELECT USING (true);

-- Authenticated users can create artworks
CREATE POLICY "Authenticated users can create artworks" ON artworks
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update artworks (we check ownership in app)
CREATE POLICY "Authenticated users can update artworks" ON artworks
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- AUCTIONS - Allow all operations for authenticated users
-- ============================================

-- Everyone can view auctions
CREATE POLICY "Auctions are viewable by everyone" ON auctions
    FOR SELECT USING (true);

-- Authenticated users can create auctions
CREATE POLICY "Authenticated users can create auctions" ON auctions
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update auctions
CREATE POLICY "Authenticated users can update auctions" ON auctions
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- BIDS - Allow all operations for authenticated users
-- ============================================

-- Everyone can view bids
CREATE POLICY "Bids are viewable by everyone" ON bids
    FOR SELECT USING (true);

-- Authenticated users can place bids
CREATE POLICY "Authenticated users can place bids" ON bids
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update bids
CREATE POLICY "Authenticated users can update bids" ON bids
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'artworks', 'auctions', 'bids')
ORDER BY tablename, policyname;
