// ============================================
// APPKIT - FIXED FOR DESKTOP INJECTED WALLETS
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

let modal = null;
let lastProcessedAddress = null;

// ============================================
// UI UPDATES
// ============================================

function updateNavButtons(state) {
    const nav = document.getElementById('navButtons');
    if (!nav) return;

    if (state?.address) {
        const short = `${state.address.slice(0,6)}...${state.address.slice(-4)}`;
        nav.innerHTML = `
            <a href="profile.html" class="btn-main" style="background:transparent;border:1px solid currentColor;color:inherit;">👤 My Profile</a>
            <button onclick="window.web3Modal?.open()" class="btn-main">${short}</button>
        `;
        window.currentWalletAddress = state.address;
        localStorage.setItem('artsoul_wallet', state.address);
    } else {
        nav.innerHTML = `<button onclick="safeConnectWallet()" id="connectBtn" class="btn-main">Get Started</button>`;
        window.currentWalletAddress = null;
        localStorage.removeItem('artsoul_wallet');
    }
}

// ============================================
// CONNECTION
// ============================================

window.safeConnectWallet = async () => {
    console.log('🔗 Opening AppKit...');
    try {
        if (window.web3Modal) {
            await window.web3Modal.open();
        } else {
            alert('AppKit ещё инициализируется...');
        }
    } catch (err) {
        console.error(err);
        if (err.message?.includes('previous') || err.message?.includes('declined')) {
            location.reload();
        }
    }
};

window.resetWalletConnection = () => location.reload();

// ============================================
// INIT
// ============================================

async function initializeAppKit() {
    try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');

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
            themeVariables: { '--w3m-accent': '#00f5ff' },
            enableWalletConnect: true,
            enableInjected: true,           // ← важно
            injected: {                     // ← добавлено для лучшего обнаружения
                shim: true
            }
        };

        modal = createAppKit(config);
        window.web3Modal = modal;

        modal.subscribeAccount((account) => {
            console.log('📊 Account:', account?.address ? account.address.slice(0,8)+'...' : 'disconnected');
            updateNavButtons(account);
        });

        console.log('✅ AppKit initialized (Desktop injected enabled)');
    } catch (e) {
        console.error('❌ AppKit failed:', e);
    }
}

// Запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAppKit);
} else {
    initializeAppKit();
}

console.log('📦 AppKit module loaded');
