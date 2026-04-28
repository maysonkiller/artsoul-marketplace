-- Clean up ALL RLS policies and create fresh ones
-- Run this in Supabase SQL Editor

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can update profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Artworks
DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON artworks;
DROP POLICY IF EXISTS "Anyone can view artworks" ON artworks;
DROP POLICY IF EXISTS "Users can create artworks" ON artworks;
DROP POLICY IF EXISTS "Creators can update own artworks" ON artworks;
DROP POLICY IF EXISTS "Authenticated users can create artworks" ON artworks;
DROP POLICY IF EXISTS "Authenticated users can update artworks" ON artworks;
DROP POLICY IF EXISTS "Authenticated can create artworks" ON artworks;

-- Auctions
DROP POLICY IF EXISTS "Auctions are viewable by everyone" ON auctions;
DROP POLICY IF EXISTS "Anyone can create auctions" ON auctions;
DROP POLICY IF EXISTS "Authenticated users can create auctions" ON auctions;
DROP POLICY IF EXISTS "Authenticated users can update auctions" ON auctions;

-- Bids
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON bids;
DROP POLICY IF EXISTS "Authenticated users can place bids" ON bids;
DROP POLICY IF EXISTS "Users can update own bids" ON bids;
DROP POLICY IF EXISTS "Authenticated users can update bids" ON bids;

-- ============================================
-- CREATE FRESH POLICIES (SIMPLE & PERMISSIVE)
-- ============================================

-- PROFILES
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_authenticated" ON profiles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_authenticated" ON profiles
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ARTWORKS
CREATE POLICY "artworks_select_all" ON artworks
    FOR SELECT USING (true);

CREATE POLICY "artworks_insert_authenticated" ON artworks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "artworks_update_authenticated" ON artworks
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- AUCTIONS
CREATE POLICY "auctions_select_all" ON auctions
    FOR SELECT USING (true);

CREATE POLICY "auctions_insert_authenticated" ON auctions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auctions_update_authenticated" ON auctions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- BIDS
CREATE POLICY "bids_select_all" ON bids
    FOR SELECT USING (true);

CREATE POLICY "bids_insert_authenticated" ON bids
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "bids_update_authenticated" ON bids
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE
        WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
        WHEN with_check IS NOT NULL THEN 'CHECK: ' || with_check::text
        ELSE 'No condition'
    END as condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'artworks', 'auctions', 'bids')
ORDER BY tablename, cmd, policyname;
