// ============================================
// APPKIT INITIALIZATION MODULE
// Centralized Web3 wallet connection for ArtSoul
// ============================================

import { createAppKit } from 'https://esm.sh/@reown/appkit@1.7.11?bundle'
import { WagmiAdapter } from 'https://esm.sh/@reown/appkit-adapter-wagmi@1.7.11?bundle'
import { mainnet, polygon, bsc, base, arbitrum, optimism, sepolia } from 'https://esm.sh/@reown/appkit/networks?bundle'

// ============================================
// CONFIGURATION
// ============================================

const projectId = '9fdc97f91c02d46a28ca9d185a9e58f2';

// Custom Rialo Playground network
const rialoPlayground = {
    id: 2025,
    name: 'Rialo Playground',
    nativeCurrency: { name: 'RIA', symbol: 'RIA', decimals: 18 },
    rpcUrls: { default: { http: ['https://playground.rialo.io/rpc'] } },
    blockExplorers: { default: { name: 'Rialo Explorer', url: 'https://playground.rialo.io' } }
};

const networks = [mainnet, polygon, bsc, base, arbitrum, optimism, sepolia, rialoPlayground];

const metadata = {
    name: 'ArtSoul Marketplace',
    description: 'Decentralized Art Marketplace',
    url: 'https://maysonkiller.github.io/artsoul-marketplace',
    icons: ['https://maysonkiller.github.io/artsoul-marketplace/artwork-sample.jpg']
};

// Network display names and currencies
const networkMap = {
    1: { name: 'Ethereum', currency: 'ETH' },
    137: { name: 'Polygon', currency: 'MATIC' },
    56: { name: 'BSC', currency: 'BNB' },
    8453: { name: 'Base', currency: 'ETH' },
    42161: { name: 'Arbitrum', currency: 'ETH' },
    10: { name: 'Optimism', currency: 'ETH' },
    11155111: { name: 'Sepolia', currency: 'ETH' },
    2025: { name: 'Rialo Playground', currency: 'RIA' }
};

// ============================================
// STATE
// ============================================

let modal = null;
let currentNetwork = null;
let currentBalance = '0.00';
let lastProcessedAddress = null;

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update navigation buttons based on wallet connection state
 * Shows "Get Started" when disconnected
 * Shows "My Profile" + wallet address when connected
 */
function updateNavButtons(state) {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) return;

    if (state?.address) {
        // Connected: Show My Profile + short wallet address
        const shortAddress = `${state.address.slice(0, 6)}...${state.address.slice(-4)}`;
        navButtons.innerHTML = `
            <a href="profile.html" class="btn-main" style="background: transparent; border: 1px solid currentColor; color: inherit;">
                👤 My Profile
            </a>
            <button onclick="window.web3Modal?.open()" class="btn-main">
                ${shortAddress}
            </button>
        `;

        // Store wallet address
        localStorage.setItem('artsoul_wallet', state.address);
        window.currentWalletAddress = state.address;
    } else {
        // Disconnected: Show Get Started button
        navButtons.innerHTML = `
            <button onclick="safeConnectWallet()" id="connectBtn" class="btn-main">Get Started</button>
        `;

        // Clear wallet address
        localStorage.removeItem('artsoul_wallet');
        window.currentWalletAddress = null;
    }
}

/**
 * Update network badge with current network and balance
 */
function updateNetworkBadge(state) {
    const networkBadgeContainer = document.getElementById('networkBadge');
    if (!networkBadgeContainer) return;

    if (state?.address && state?.chainId) {
        const network = networkMap[state.chainId] || { name: 'Unknown', currency: 'ETH' };
        currentNetwork = network;

        // Fetch balance using AppKit provider
        if (modal?.getWalletProvider) {
            modal.getWalletProvider().then(provider => {
                if (provider) {
                    provider.request({ method: 'eth_getBalance', params: [state.address, 'latest'] })
                        .then(balance => {
                            currentBalance = (parseInt(balance, 16) / 1e18).toFixed(4);
                            renderNetworkBadge();
                        })
                        .catch(() => {
                            currentBalance = '0.00';
                            renderNetworkBadge();
                        });
                } else {
                    renderNetworkBadge();
                }
            }).catch(() => {
                renderNetworkBadge();
            });
        } else {
            renderNetworkBadge();
        }
    } else {
        // Clear badge when disconnected
        networkBadgeContainer.innerHTML = '';
    }
}

/**
 * Render network badge HTML
 */
function renderNetworkBadge() {
    const networkBadgeContainer = document.getElementById('networkBadge');
    if (!networkBadgeContainer || !currentNetwork) return;

    networkBadgeContainer.innerHTML = `
        <div class="network-badge" onclick="window.web3Modal?.open({ view: 'Networks' })">
            <span class="network-name">${currentNetwork.name}</span>
            <span class="balance-amount">${currentBalance} ${currentNetwork.currency}</span>
        </div>
    `;
}

// ============================================
// WALLET CONNECTION
// ============================================

/**
 * Safe wallet connection with error handling
 * Prevents duplicate connection attempts
 */
window.safeConnectWallet = async () => {
    const btn = document.getElementById('connectBtn');
    if (btn) btn.disabled = true;

    try {
        if (window.web3Modal) {
            await window.web3Modal.open();
        } else {
            alert('Подождите, приложение загружается...');
        }
    } catch (err) {
        console.error('❌ Connection error:', err);

        // Handle "previous request still pending" error
        if (err.message?.includes('previous') || err.message?.includes('declined')) {
            await resetWalletConnection();
        }
    } finally {
        if (btn) btn.disabled = false;
    }
};

/**
 * Reset wallet connection state
 * Clears all WalletConnect/AppKit cache
 */
window.resetWalletConnection = async () => {
    if (window.web3Modal) {
        await window.web3Modal.disconnect();
    }

    // Clear all wallet-related localStorage
    Object.keys(localStorage)
        .filter(k =>
            k.includes('walletconnect') ||
            k.includes('wc@') ||
            k.includes('reown') ||
            k.includes('appkit')
        )
        .forEach(k => localStorage.removeItem(k));

    location.reload();
};

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Lazy authentication - only authenticate when needed
 * Prevents disconnect issues from immediate signature requests
 */
window.ensureAuthenticated = async () => {
    // Check if already authenticated
    if (window.SupabaseAuth) {
        const isAuth = await window.SupabaseAuth.isAuthenticated();
        if (isAuth) {
            console.log('✅ Already authenticated');
            return true;
        }
    }

    // Check if wallet is connected
    const walletAddress = window.currentWalletAddress || localStorage.getItem('artsoul_wallet');
    if (!walletAddress) {
        alert('Please connect your wallet first');
        return false;
    }

    // Authenticate with signature
    try {
        console.log('🔐 Requesting signature for authentication...');

        // Get provider - works with both WagmiAdapter and EthersAdapter
        let provider;
        if (window.ethereum) {
            provider = window.ethereum;
        } else if (modal?.getWalletProvider) {
            provider = await modal.getWalletProvider();
        } else {
            throw new Error('No wallet provider available');
        }

        const authResult = await window.SupabaseAuth.authenticateWithWallet(
            walletAddress,
            provider
        );
        console.log('✅ Authenticated:', authResult.user.id);
        return true;
    } catch (error) {
        console.error('❌ Authentication failed:', error);
        alert('Authentication failed. Please try again.');
        return false;
    }
};

/**
 * Get current wallet address
 */
window.getCurrentWalletAddress = () => {
    return window.currentWalletAddress || localStorage.getItem('artsoul_wallet');
};

// ============================================
// DEVICE DETECTION
// ============================================

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ============================================
// APPKIT INITIALIZATION
// ============================================

async function initializeAppKit() {
    try {
        const isMobile = isMobileDevice();
        console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');

        // Create Wagmi adapter for better browser extension support
        const wagmiAdapter = new WagmiAdapter({
            networks,
            projectId
        });

        const config = {
            adapters: [wagmiAdapter],
            networks,
            metadata,
            projectId,
            // Remove local features config - managed via Reown dashboard
            themeMode: 'dark',
            themeVariables: {
                '--w3m-accent': '#00f5ff',
                '--w3m-color-mix': '#bf00ff'
            }
        };

        console.log('🔌 Using WagmiAdapter for browser extensions');

        modal = createAppKit(config);
        window.web3Modal = modal;

        // Subscribe to account changes with detailed logging
        let subscriptionCount = 0;
        modal.subscribeAccount(async (account) => {
            subscriptionCount++;
            console.log(`📊 [${subscriptionCount}] Account update:`, {
                address: account?.address ? account.address.slice(0, 10) + '...' : 'none',
                status: account?.status || 'undefined',
                chainId: account?.chainId,
                isConnected: account?.isConnected
            });

            // Ignore initial disconnected events during initialization
            if (!account?.address && subscriptionCount < 5) {
                console.log('⏭️ Ignoring initial disconnected event');
                return;
            }

            if (account?.address && account?.status === 'connected') {
                // Prevent duplicate processing
                if (lastProcessedAddress === account.address) {
                    console.log('⏭️ Skipping duplicate address');
                    return;
                }
                lastProcessedAddress = account.address;

                window.currentWalletAddress = account.address;
                localStorage.setItem('artsoul_wallet', account.address);

                // Update UI first
                updateNavButtons({ address: account.address, chainId: account.chainId });
                updateNetworkBadge({ address: account.address, chainId: account.chainId });

                // Don't authenticate automatically - only when user needs it
                console.log('✅ Wallet connected - authentication will happen when needed');

            } else if (account?.status === 'disconnected' && lastProcessedAddress) {
                console.log('🔌 Wallet disconnected (was connected before)');
                lastProcessedAddress = null;
                window.currentWalletAddress = null;
                localStorage.removeItem('artsoul_wallet');

                // Sign out from Supabase if authenticated
                try {
                    const isAuth = await window.SupabaseAuth?.isAuthenticated();
                    if (isAuth) {
                        await window.SupabaseAuth.signOut();
                    }
                } catch (error) {
                    console.error('⚠️ Supabase signout failed:', error);
                }

                // Update UI
                updateNavButtons(null);
                updateNetworkBadge(null);

                // Redirect to home if on profile page
                if (window.location.pathname.includes('profile.html')) {
                    console.log('🏠 Redirecting to home page...');
                    window.location.href = 'index.html';
                }
            }
        });

        console.log('✅ AppKit initialized');
    } catch (error) {
        console.error('⚠️ AppKit init failed:', error);
    }
}

// ============================================
// AUTO-INITIALIZE
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Check for OAuth callback first
        if (window.SupabaseAuth) {
            const oauthResult = await window.SupabaseAuth.handleOAuthCallback();
            if (oauthResult) {
                console.log('✅ OAuth callback handled:', oauthResult.provider);
                // Update UI with social login info
                if (oauthResult.user.user_metadata?.wallet_address) {
                    window.currentWalletAddress = oauthResult.user.user_metadata.wallet_address;
                    localStorage.setItem('artsoul_wallet', window.currentWalletAddress);
                }
            }
        }
        initializeAppKit();
    });
} else {
    initializeAppKit();
}

console.log('📦 AppKit module loaded');
