// ============================================
// APPKIT INITIALIZATION - FINAL FIXED VERSION
// ============================================

import { createAppKit } from 'https://esm.sh/@reown/appkit@1.7.11?bundle'
import { mainnet, polygon, bsc, base, arbitrum, optimism, sepolia } from 'https://esm.sh/@reown/appkit/networks?bundle'

const projectId = '9fdc97f91c02d46a28ca9d185a9e58f2';

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

let modal = null;
let currentNetwork = null;
let currentBalance = '0.00';
let lastProcessedAddress = null;

// ============================================
// UI FUNCTIONS
// ============================================

function updateNavButtons(state) {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) return;

    if (state?.address) {
        const shortAddress = `${state.address.slice(0, 6)}...${state.address.slice(-4)}`;
        navButtons.innerHTML = `
            <a href="profile.html" class="btn-main" style="background: transparent; border: 1px solid currentColor; color: inherit;">
                👤 My Profile
            </a>
            <button onclick="window.web3Modal?.open()" class="btn-main">
                ${shortAddress}
            </button>
        `;
        window.currentWalletAddress = state.address;
        localStorage.setItem('artsoul_wallet', state.address);
    } else {
        navButtons.innerHTML = `
            <button onclick="safeConnectWallet()" id="connectBtn" class="btn-main">Get Started</button>
        `;
        window.currentWalletAddress = null;
        localStorage.removeItem('artsoul_wallet');
    }
}

function updateNetworkBadge(state) {
    const container = document.getElementById('networkBadge');
    if (!container) return;
    if (state?.address && state?.chainId) {
        const network = networkMap[state.chainId] || { name: 'Unknown', currency: 'ETH' };
        currentNetwork = network;
        container.innerHTML = `
            <div class="network-badge" onclick="window.web3Modal?.open({ view: 'Networks' })">
                <span class="network-name">${network.name}</span>
                <span class="balance-amount">0.00 ${network.currency}</span>
            </div>
        `;
    } else {
        container.innerHTML = '';
    }
}

// ============================================
// WALLET CONNECTION
// ============================================

window.safeConnectWallet = async () => {
    const btn = document.getElementById('connectBtn');
    if (btn) btn.disabled = true;

    try {
        if (window.web3Modal) {
            console.log('🔗 Opening AppKit modal...');
            await window.web3Modal.open();
        } else {
            console.warn('⚠️ web3Modal not ready yet');
            alert('Подождите секунду, приложение загружается...');
        }
    } catch (err) {
        console.error('❌ Connection error:', err);
        if (err.message?.includes('previous') || err.message?.includes('declined')) {
            await window.resetWalletConnection();
        } else {
            alert('Ошибка подключения. Попробуйте ещё раз.');
        }
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.resetWalletConnection = async () => {
    if (window.web3Modal) {
        try { await window.web3Modal.disconnect(); } catch(e){}
    }
    Object.keys(localStorage)
        .filter(k => k.includes('walletconnect') || k.includes('wc@') || k.includes('reown') || k.includes('appkit'))
        .forEach(k => localStorage.removeItem(k));
    location.reload();
};

// ============================================
// HELPERS
// ============================================

window.getCurrentWalletAddress = () => {
    return window.currentWalletAddress || localStorage.getItem('artsoul_wallet');
};

// ============================================
// INITIALIZATION
// ============================================

async function initializeAppKit() {
    try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');

        // Safe cleanup
        try {
            if (window.ethereum && Object.getOwnPropertyDescriptor(window, 'ethereum')?.configurable) {
                delete window.ethereum;
            }
        } catch(e) { console.log('⚠️ Could not delete ethereum provider'); }

        const config = {
            networks,
            metadata,
            projectId,
            features: {
                socials: ['google', 'x', 'apple', 'discord'],
                email: true,
                onramp: false,
                swaps: false
            },
            themeMode: 'dark',
            themeVariables: {
                '--w3m-accent': '#00f5ff',
            },
            enableWalletConnect: true,
            enableInjected: true
        };

        modal = createAppKit(config);
        window.web3Modal = modal;

        modal.subscribeAccount((account) => {
            console.log('📊 Account update:', account?.address ? account.address.slice(0,8)+'...' : 'disconnected');
            if (account?.address && account?.status === 'connected') {
                if (lastProcessedAddress === account.address) return;
                lastProcessedAddress = account.address;
                updateNavButtons(account);
                updateNetworkBadge(account);
            } else if (!account?.address) {
                updateNavButtons(null);
                updateNetworkBadge(null);
            }
        });

        console.log('✅ AppKit initialized successfully');
    } catch (error) {
        console.error('⚠️ AppKit init failed:', error);
    }
}

// Auto start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppKit);
} else {
    initializeAppKit();
}

console.log('📦 AppKit module loaded');
