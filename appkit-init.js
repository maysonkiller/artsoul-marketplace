// ============================================
// APPKIT INITIALIZATION MODULE
// Centralized Web3 wallet connection for ArtSoul
// ============================================

import { createAppKit } from 'https://esm.sh/@reown/appkit@1.7.11?bundle'
import { WagmiAdapter } from 'https://esm.sh/@reown/appkit-adapter-wagmi@1.7.11?bundle'
import { mainnet, base, sepolia, baseSepolia } from 'https://esm.sh/@reown/appkit/networks?bundle'

// ============================================
// CONFIGURATION
// ============================================

const projectId = '9fdc97f91c02d46a28ca9d185a9e58f2';

// Custom Rialo network (coming soon - not EVM compatible yet)
const rialoPlayground = {
    id: 2025,
    name: 'Rialo (Coming Soon)',
    nativeCurrency: { name: 'RIA', symbol: 'RIA', decimals: 18 },
    rpcUrls: { default: { http: ['https://playground.rialo.io/rpc'] } },
    blockExplorers: { default: { name: 'Rialo Explorer', url: 'https://playground.rialo.io' } },
    testnet: true
};

// TESTNETS ONLY (for now)
// To enable mainnets: uncomment mainnet and base in the array below
const networks = [
    baseSepolia,          // Base testnet (default)
    sepolia,              // Ethereum testnet
    rialoPlayground,      // Coming soon (moved to 3rd position)
    // base,              // Base mainnet (uncomment when ready for production)
    // mainnet            // Ethereum mainnet (uncomment when ready for production)
];

const metadata = {
    name: 'ArtSoul Marketplace',
    description: 'Decentralized Art Marketplace',
    url: 'https://maysonkiller.github.io/artsoul-marketplace',
    icons: ['https://maysonkiller.github.io/artsoul-marketplace/artwork-sample.jpg']
};

// Network display names and currencies
const networkMap = {
    // Testnets
    84532: { name: 'Base Sepolia', currency: 'ETH' },
    11155111: { name: 'Ethereum Sepolia', currency: 'ETH' },
    2025: { name: 'Rialo (Soon)', currency: 'RIA' },
    // Mainnets (for future use)
    8453: { name: 'Base', currency: 'ETH' },
    1: { name: 'Ethereum', currency: 'ETH' }
};

// ============================================
// STATE
// ============================================

let modal = null;
let currentNetwork = null;
let currentBalance = '0.00';
let lastProcessedAddress = null;
let isAuthenticating = false;

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

/**
 * Update navigation buttons based on wallet connection state
 * Shows "Get Started" when disconnected
 * Shows Avatar Dropdown when connected
 */
window.updateNavButtons = function updateNavButtons(state) {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) {
        // On React pages, wait for element to be available (max 3 retries)
        if (!window._navButtonsRetries) window._navButtonsRetries = 0;
        if (window._navButtonsRetries < 3) {
            window._navButtonsRetries++;
            setTimeout(() => updateNavButtons(state), 100);
        }
        return;
    }

    // Reset retry counter
    window._navButtonsRetries = 0;

    if (state?.address) {
        // Connected: Show Avatar Dropdown
        if (window.AvatarDropdown) {
            window.AvatarDropdown.init(state.address);
        } else {
            // Fallback if avatar-dropdown.js not loaded
            const shortAddress = `${state.address.slice(0, 6)}...${state.address.slice(-4)}`;
            navButtons.innerHTML = `
                <button onclick="window.web3Modal?.open()" class="btn-main">
                    ${shortAddress}
                </button>
                <button onclick="window.resetWalletConnection()" class="btn-secondary" style="padding: 0.5rem 1rem;">
                    Disconnect
                </button>
            `;
        }

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
window.updateNetworkBadge = async function updateNetworkBadge(state) {
    // Network badge removed - balance now shown in dropdown menu
    return;
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
    try {
        // Set disconnecting flag to prevent auto-reconnect
        sessionStorage.setItem('artsoul_disconnecting', 'true');

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

        // Clear ArtSoul auth
        localStorage.removeItem('artsoul_wallet');
        localStorage.removeItem('artsoul_auth_method');

        // Clear session flag after a delay
        setTimeout(() => {
            sessionStorage.removeItem('artsoul_disconnecting');
        }, 1000);

        // Check if we're already on index.html
        const isIndexPage = window.location.pathname.endsWith('index.html') ||
                            window.location.pathname === '/' ||
                            window.location.pathname.endsWith('/');

        if (isIndexPage) {
            // Already on index, just reload
            window.location.reload();
        } else {
            // Redirect to home page
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('❌ Reset failed:', error);
        // Force reload anyway
        window.location.reload();
    }
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
            themeMode: 'dark',
            themeVariables: {
                '--w3m-accent': '#00f5ff',
                '--w3m-color-mix': '#bf00ff'
            },
            // Mobile wallet configuration
            enableWalletConnect: true,
            enableInjected: true,
            enableCoinbase: true,
            enableEIP6963: true,
            enableAuthMode: false,
            // Featured wallets for mobile
            featuredWalletIds: [
                'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
                'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
                '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
                '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
                'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a'  // Uniswap
            ],
            // Include all wallets
            includeWalletIds: [],
            excludeWalletIds: []
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

                // Refresh avatar dropdown to update network indicator
                if (window.AvatarDropdown) {
                    window.AvatarDropdown.refresh(account.address);
                }

                // Authenticate automatically on wallet connect
                console.log('🔐 Starting automatic authentication...');
                if (!isAuthenticating) {
                    isAuthenticating = true;

                    // Set timeout to reset flag after 30 seconds
                    const authTimeout = setTimeout(() => {
                        if (isAuthenticating) {
                            console.warn('⚠️ Authentication timeout - resetting flag');
                            isAuthenticating = false;
                        }
                    }, 30000);

                    try {
                        if (window.ensureAuthenticated) {
                            await window.ensureAuthenticated();
                            console.log('✅ Wallet connected and authenticated');
                        }
                    } catch (error) {
                        console.error('❌ Auto-authentication failed:', error);
                        // Continue anyway - user can try again later
                    } finally {
                        clearTimeout(authTimeout);
                        isAuthenticating = false;
                    }
                }

            } else if (account?.status === 'disconnected' && lastProcessedAddress) {
                console.log('🔌 Wallet disconnected (was connected before)');
                lastProcessedAddress = null;
                window.currentWalletAddress = null;

                // Clear all authentication data
                localStorage.removeItem('artsoul_wallet');
                localStorage.removeItem('artsoul_first_time');

                // Sign out from Supabase
                try {
                    if (window.SupabaseAuth) {
                        await window.SupabaseAuth.signOut();
                        console.log('✅ Signed out from Supabase');
                    }
                } catch (error) {
                    console.error('⚠️ Supabase signout failed:', error);
                }

                // Clear Supabase session from localStorage
                try {
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('sb-') || key.includes('supabase')) {
                            localStorage.removeItem(key);
                        }
                    });
                } catch (error) {
                    console.error('⚠️ Failed to clear Supabase storage:', error);
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

        // Subscribe to chain changes to update UI and close modal after selection
        let lastSelectedNetwork = null;
        let networkChangeTimeout = null;
        let wasModalOpen = false;

        modal.subscribeState((state) => {
            // Track if modal is open
            if (state.open) {
                wasModalOpen = true;
            }

            // Only auto-close if network changed AND modal was opened by user
            if (state.selectedNetworkId && state.selectedNetworkId !== lastSelectedNetwork) {
                console.log('🔄 Network changed to:', state.selectedNetworkId);
                const previousNetwork = lastSelectedNetwork;
                lastSelectedNetwork = state.selectedNetworkId;

                // Clear any existing timeout
                if (networkChangeTimeout) {
                    clearTimeout(networkChangeTimeout);
                }

                // Only close modal if it was opened by user and network actually changed
                if (wasModalOpen && previousNetwork !== null && modal.getState().open) {
                    networkChangeTimeout = setTimeout(() => {
                        if (modal.getState().open) {
                            console.log('✅ Closing modal after network change');
                            modal.close();
                            wasModalOpen = false;
                        }
                    }, 1000);
                }

                // Update network display
                if (window.currentWalletAddress) {
                    updateNetworkBadge({
                        address: window.currentWalletAddress,
                        chainId: state.selectedNetworkId
                    });

                    // Refresh avatar dropdown to update network icon and balance
                    if (window.AvatarDropdown) {
                        setTimeout(() => {
                            window.AvatarDropdown.refresh(window.currentWalletAddress);
                        }, 100);
                    }
                }
            }

            // Reset flag when modal closes
            if (!state.open) {
                wasModalOpen = false;
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
