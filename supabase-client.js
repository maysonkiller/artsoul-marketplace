// Supabase Client Configuration for ArtSoul Marketplace
// Created: 2026-04-26
// Updated: 2026-04-28 - Added authentication support

const SUPABASE_URL = 'https://bexigvqrunomwtjsxlej.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleGlndnFydW5vbXd0anN4bGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjkwNDQsImV4cCI6MjA5MjgwNTA0NH0.ZU7cMhovwMk9JViY0OOq5-vwHBCpNWiMrlhk4ZKqQ5s';

// Export for OAuth integration
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Initialize Supabase client with auth support
let supabaseClient = null;

async function initSupabase() {
    if (supabaseClient) return supabaseClient;

    // Import Supabase from CDN
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });

    console.log('✅ Supabase initialized with auth support');
    return supabaseClient;
}

// Profile Functions
async function createProfile(walletAddress, profileData) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('profiles')
        .insert([{
            wallet_address: walletAddress,
            username: profileData.username,
            bio: profileData.bio,
            avatar_url: profileData.avatar_url,
            twitter_handle: profileData.twitter_handle,
            discord_username: profileData.discord_username
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        throw error;
    }

    return data;
}

async function getProfile(walletAddress) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching profile:', error);
        throw error;
    }

    return data;
}

async function updateProfile(walletAddress, updates) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }

    return data;
}

// Artwork Functions
async function createArtwork(artworkData) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('artworks')
        .insert([artworkData])
        .select()
        .single();

    if (error) {
        console.error('Error creating artwork:', error);
        throw error;
    }

    return data;
}

async function getArtworks(filters = {}) {
    const supabase = await initSupabase();

    let query = supabase
        .from('artworks')
        .select(`
            *,
            creator:profiles!creator_id(*)
        `)
        .order('created_at', { ascending: false });

    if (filters.creator_id) {
        query = query.eq('creator_id', filters.creator_id);
    }

    if (filters.file_type) {
        query = query.eq('file_type', filters.file_type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching artworks:', error);
        throw error;
    }

    return data;
}

async function getAllArtworks() {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all artworks:', error);
        throw error;
    }

    return data;
}

async function getArtwork(artworkId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('artworks')
        .select(`
            *,
            creator:profiles!creator_id(*),
            auctions(*)
        `)
        .eq('id', artworkId)
        .single();

    if (error) {
        console.error('Error fetching artwork:', error);
        throw error;
    }

    return data;
}

async function getArtworksByCreator(creatorId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('artworks')
        .select(`
            *,
            creator:profiles!creator_id(*)
        `)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching creator artworks:', error);
        throw error;
    }

    return data;
}

async function getArtworksByOwner(ownerAddress) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('artworks')
        .select(`
            *,
            creator:profiles!creator_id(*)
        `)
        .eq('owner_address', ownerAddress)
        .neq('creator_id', ownerAddress)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching owned artworks:', error);
        // Return empty array if owner_address column doesn't exist yet
        if (error.code === '42703') {
            console.warn('owner_address column not found - run supabase-ownership-migration.sql');
            return [];
        }
        throw error;
    }

    return data || [];
}

async function updateArtwork(artworkId, updates) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('artworks')
        .update(updates)
        .eq('id', artworkId)
        .select()
        .single();

    if (error) {
        console.error('Error updating artwork:', error);
        throw error;
    }

    return data;
}

async function deleteArtwork(artworkId) {
    const supabase = await initSupabase();

    const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artworkId);

    if (error) {
        console.error('Error deleting artwork:', error);
        throw error;
    }

    return true;
}

// Storage Functions
async function uploadFile(file, fileName) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .storage
        .from('artworks')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Error uploading file:', error);
        throw error;
    }

    const { data: urlData } = supabase
        .storage
        .from('artworks')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

// Auction Functions
async function createAuction(artworkId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('auctions')
        .insert([{
            artwork_id: artworkId,
            status: 'active'
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating auction:', error);
        throw error;
    }

    return data;
}

async function getActiveAuctions() {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('auctions')
        .select(`
            *,
            artwork:artworks(*,
                creator:profiles!creator_id(*)
            ),
            winner:profiles!winner_id(*),
            bids(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching auctions:', error);
        throw error;
    }

    return data;
}

async function getAuction(auctionId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('auctions')
        .select(`
            *,
            artwork:artworks(*,
                creator:profiles!creator_id(*)
            ),
            winner:profiles!winner_id(*),
            bids(*,
                bidder:profiles!bidder_id(*)
            )
        `)
        .eq('id', auctionId)
        .single();

    if (error) {
        console.error('Error fetching auction:', error);
        throw error;
    }

    return data;
}

async function endAuction(auctionId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', auctionId)
        .select()
        .single();

    if (error) {
        console.error('Error ending auction:', error);
        throw error;
    }

    return data;
}

// Bid Functions
async function placeBid(auctionId, bidderId, amount, maxLimit = null) {
    const supabase = await initSupabase();

    // Check if user already has a bid on this auction
    const { data: existingBid } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('bidder_id', bidderId)
        .single();

    if (existingBid) {
        // Update existing bid
        const { data, error } = await supabase
            .from('bids')
            .update({
                amount: amount,
                max_bid_limit: maxLimit
            })
            .eq('id', existingBid.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating bid:', error);
            throw error;
        }

        return data;
    } else {
        // Create new bid
        const { data, error } = await supabase
            .from('bids')
            .insert([{
                auction_id: auctionId,
                bidder_id: bidderId,
                amount: amount,
                max_bid_limit: maxLimit
            }])
            .select()
            .single();

        if (error) {
            console.error('Error placing bid:', error);
            throw error;
        }

        return data;
    }
}

async function getAuctionBids(auctionId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('bids')
        .select(`
            *,
            bidder:profiles!bidder_id(*)
        `)
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false });

    if (error) {
        console.error('Error fetching bids:', error);
        throw error;
    }

    return data;
}

async function getUserBid(auctionId, bidderId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('bidder_id', bidderId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user bid:', error);
        throw error;
    }

    return data;
}

// Real-time subscriptions
function subscribeToAuction(auctionId, callback) {
    initSupabase().then(supabase => {
        const subscription = supabase
            .channel(`auction:${auctionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bids',
                filter: `auction_id=eq.${auctionId}`
            }, callback)
            .subscribe();

        return subscription;
    });
}

// Voting Functions
async function saveVote(voteData) {
    const supabase = await initSupabase();

    // Check if user already voted
    const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('artwork_id', voteData.artwork_id)
        .eq('voter_address', voteData.voter_address)
        .single();

    if (existingVote) {
        // Update existing vote
        const { data, error } = await supabase
            .from('votes')
            .update({
                vote_type: voteData.vote_type,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingVote.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating vote:', error);
            throw error;
        }

        return data;
    } else {
        // Create new vote
        const { data, error } = await supabase
            .from('votes')
            .insert([{
                artwork_id: voteData.artwork_id,
                voter_address: voteData.voter_address,
                vote_type: voteData.vote_type
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating vote:', error);
            throw error;
        }

        return data;
    }
}

async function getVotes(artworkId) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('artwork_id', artworkId);

    if (error) {
        console.error('Error getting votes:', error);
        throw error;
    }

    return data;
}

async function getUserVote(artworkId, voterAddress) {
    const supabase = await initSupabase();

    const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('artwork_id', artworkId)
        .eq('voter_address', voterAddress)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error getting user vote:', error);
        throw error;
    }

    return data;
}

// Export functions
window.ArtSoulDB = {
    initSupabase,
    // Profiles
    createProfile,
    getProfile,
    updateProfile,
    // Artworks
    createArtwork,
    getArtworks,
    getAllArtworks,
    getArtwork,
    getArtworksByCreator,
    getArtworksByOwner,
    updateArtwork,
    deleteArtwork,
    // Storage
    uploadFile,
    // Auctions
    createAuction,
    getActiveAuctions,
    getAuction,
    endAuction,
    // Bids
    placeBid,
    getAuctionBids,
    getUserBid,
    // Voting
    saveVote,
    getVotes,
    getUserVote,
    // Real-time
    subscribeToAuction
};

console.log('📦 ArtSoul Database Client loaded');
