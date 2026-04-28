// Supabase Auth Integration for ArtSoul
// Handles wallet signature auth and social OAuth

const SUPABASE_URL = 'https://bexigvqrunomwtjsxlej.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJleGlndnFydW5vbXd0anN4bGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjkwNDQsImV4cCI6MjA5MjgwNTA0NH0.ZU7cMhovwMk9JViY0OOq5-vwHBCpNWiMrlhk4ZKqQ5s';

let supabaseClient = null;
let authenticatedWallet = null; // Cache authenticated wallet to prevent repeated signature requests

async function initSupabase() {
    if (supabaseClient) return supabaseClient;

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });

    console.log('✅ Supabase Auth initialized');
    return supabaseClient;
}

// ============================================
// WALLET SIGNATURE AUTHENTICATION
// ============================================

/**
 * Authenticate user with wallet signature
 * Creates Supabase session with wallet address as user ID
 */
async function authenticateWithWallet(walletAddress, provider) {
    const supabase = await initSupabase();

    try {
        // Check if already authenticated with this wallet in this session
        if (authenticatedWallet?.toLowerCase() === walletAddress.toLowerCase()) {
            console.log('✅ Already authenticated with this wallet (cached)');
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                return {
                    user: session.user,
                    session: session,
                    walletAddress: walletAddress
                };
            }
        }

        // Check if already authenticated with this wallet in Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.wallet_address?.toLowerCase() === walletAddress.toLowerCase()) {
            console.log('✅ Already authenticated with this wallet');
            authenticatedWallet = walletAddress; // Cache it
            return {
                user: session.user,
                session: session,
                walletAddress: walletAddress
            };
        }

        // 1. Generate nonce message
        const nonce = `ArtSoul Login\nWallet: ${walletAddress}\nNonce: ${Date.now()}`;

        // 2. Request signature from wallet
        console.log('🔐 Requesting signature from wallet...');
        let signature;

        if (provider && provider.request) {
            // Use AppKit provider
            signature = await provider.request({
                method: 'personal_sign',
                params: [nonce, walletAddress]
            });
        } else if (window.ethereum) {
            // Fallback to window.ethereum
            signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [nonce, walletAddress]
            });
        } else {
            throw new Error('No wallet provider available');
        }

        console.log('✅ Signature received');

        // 3. Verify signature and create session
        // For now, we'll use a custom auth approach
        // In production, you'd verify signature on backend

        // Create a deterministic user ID from wallet address
        const userId = `wallet_${walletAddress.toLowerCase()}`;

        // Sign in with custom token (requires backend endpoint)
        // For MVP, we'll use signInAnonymously and store wallet in metadata
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
            options: {
                data: {
                    wallet_address: walletAddress.toLowerCase(),
                    auth_method: 'wallet',
                    signature: signature,
                    nonce: nonce
                }
            }
        });

        if (authError) throw authError;

        console.log('✅ Supabase session created:', authData.user.id);

        // Store wallet address and cache authentication
        localStorage.setItem('artsoul_wallet', walletAddress);
        localStorage.setItem('artsoul_auth_method', 'wallet');
        authenticatedWallet = walletAddress; // Cache to prevent repeated signature requests

        return {
            user: authData.user,
            session: authData.session,
            walletAddress: walletAddress
        };

    } catch (error) {
        console.error('❌ Wallet auth failed:', error);
        throw error;
    }
}

// ============================================
// SOCIAL OAUTH AUTHENTICATION
// ============================================

/**
 * Authenticate with social provider (Google, Twitter)
 * Uses Supabase OAuth flow
 */
async function authenticateWithSocial(provider) {
    const supabase = await initSupabase();

    try {
        console.log(`🔐 Starting ${provider} OAuth...`);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin + window.location.pathname,
                skipBrowserRedirect: false
            }
        });

        if (error) throw error;

        console.log(`✅ ${provider} OAuth initiated`);
        return data;

    } catch (error) {
        console.error(`❌ ${provider} OAuth failed:`, error);
        throw error;
    }
}

/**
 * Handle OAuth callback after redirect
 */
async function handleOAuthCallback() {
    const supabase = await initSupabase();

    try {
        // Check if we're in OAuth callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (!accessToken) return null;

        // Get session from URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
            console.log('✅ OAuth session restored:', session.user.id);
            localStorage.setItem('artsoul_auth_method', 'social');

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            return {
                user: session.user,
                session: session,
                provider: session.user.app_metadata.provider
            };
        }

        return null;

    } catch (error) {
        console.error('❌ OAuth callback failed:', error);
        return null;
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current authenticated session
 */
async function getCurrentSession() {
    const supabase = await initSupabase();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error);
        return null;
    }

    return session;
}

/**
 * Get current user
 */
async function getCurrentUser() {
    const supabase = await initSupabase();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error);
        return null;
    }

    return user;
}

/**
 * Sign out
 */
async function signOut() {
    const supabase = await initSupabase();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }

    localStorage.removeItem('artsoul_wallet');
    localStorage.removeItem('artsoul_auth_method');
    authenticatedWallet = null; // Clear cached authentication

    console.log('✅ Signed out');
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated() {
    const session = await getCurrentSession();
    return session !== null;
}

/**
 * Get wallet address from session or localStorage
 */
function getWalletAddress() {
    return localStorage.getItem('artsoul_wallet');
}

// ============================================
// EXPORTS
// ============================================

window.SupabaseAuth = {
    initSupabase,
    authenticateWithWallet,
    authenticateWithSocial,
    handleOAuthCallback,
    getCurrentSession,
    getCurrentUser,
    signOut,
    isAuthenticated,
    getWalletAddress
};

console.log('🔐 Supabase Auth module loaded');
