// ArtSoul Marketplace - AppKit Integration
// Project ID: 9fdc97f91c02d46a28ca9d185a9e58f2

import { createAppKit } from 'https://cdn.jsdelivr.net/npm/@reown/appkit@1.1.0/dist/index.js'
import { EthersAdapter } from 'https://cdn.jsdelivr.net/npm/@reown/appkit-adapter-ethers@1.1.0/dist/index.js'

const projectId = '9fdc97f91c02d46a28ca9d185a9e58f2';

const networks = [
    {
        chainId: 1,
        name: 'Ethereum',
        currency: 'ETH',
        explorerUrl: 'https://etherscan.io',
        rpcUrl: 'https://cloudflare-eth.com'
    },
    {
        chainId: 137,
        name: 'Polygon',
        currency: 'MATIC',
        explorerUrl: 'https://polygonscan.com',
        rpcUrl: 'https://polygon-rpc.com'
    },
    {
        chainId: 56,
        name: 'BSC',
        currency: 'BNB',
        explorerUrl: 'https://bscscan.com',
        rpcUrl: 'https://bsc-dataseed.binance.org'
    },
    {
        chainId: 8453,
        name: 'Base',
        currency: 'ETH',
        explorerUrl: 'https://basescan.org',
        rpcUrl: 'https://mainnet.base.org'
    },
    {
        chainId: 42161,
        name: 'Arbitrum',
        currency: 'ETH',
        explorerUrl: 'https://arbiscan.io',
        rpcUrl: 'https://arb1.arbitrum.io/rpc'
    },
    {
        chainId: 10,
        name: 'Optimism',
        currency: 'ETH',
        explorerUrl: 'https://optimistic.etherscan.io',
        rpcUrl: 'https://mainnet.optimism.io'
    },
    {
        chainId: 11155111,
        name: 'Sepolia',
        currency: 'ETH',
        explorerUrl: 'https://sepolia.etherscan.io',
        rpcUrl: 'https://rpc.sepolia.org'
    },
    {
        chainId: 2025,
        name: 'Rialo Playground',
        currency: 'RIA',
        explorerUrl: 'https://playground.rialo.io',
        rpcUrl: 'https://playground.rialo.io/rpc'
    }
];

const metadata = {
    name: 'ArtSoul Marketplace',
    description: 'Decentralized Art Marketplace - Where community determines value',
    url: 'https://maysonkiller.github.io/artsoul-marketplace',
    icons: ['https://maysonkiller.github.io/artsoul-marketplace/logo.png']
};

try {
    const modal = createAppKit({
        adapters: [new EthersAdapter()],
        networks,
        metadata,
        projectId,
        features: {
            socials: ['google', 'x', 'apple', 'discord'],
            email: true,
            analytics: true
        },
        themeMode: 'dark',
        themeVariables: {
            '--w3m-accent': '#00f5ff',
            '--w3m-color-mix': '#bf00ff'
        }
    });

    window.web3Modal = modal;

    // Connect wallet function
    window.connectWallet = () => {
        modal.open();
    };

    // Subscribe to wallet state changes
    modal.subscribeState((state) => {
        console.log('Wallet state:', state);

        if (state?.address) {
            handleSuccessfulLogin(state);
        } else {
            resetNavButtons();
        }
    });

    console.log('✅ AppKit initialized successfully');
    console.log('📊 Supported networks:', networks.map(n => n.name));
    console.log('◈ Rialo Playground (Chain ID: 2025) ready');

} catch (error) {
    console.error('⚠️ AppKit initialization failed:', error);
    console.log('📌 Site will continue to work without wallet connection');

    window.connectWallet = () => {
        alert('Wallet connection unavailable. Please refresh the page.');
    };
}

function handleSuccessfulLogin(state) {
    const theme = document.body.classList.contains('future') ? 'future' : 'classic';

    // Show success wave effect in Future mode
    if (theme === 'future' && window.showSuccessWave) {
        window.showSuccessWave();
    }

    updateNavButtons(state, theme);
}

function updateNavButtons(state, theme) {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) return;

    const btnClass = 'btn-main';

    navButtons.innerHTML = `
        <div class="tooltip-wrap">
            <a href="upload.html" class="p-2 inline-block">
                <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" style="color: currentColor;">
                    <path d="M12 3L12 21M12 3L6 9M12 3L18 9M3 15L3 21L21 21L21 15" stroke="currentColor" class="icon-svg"/>
                </svg>
            </a>
            <div class="tooltip-text">Upload</div>
        </div>
        <div class="tooltip-wrap">
            <a href="profile.html" class="p-2 inline-block">
                <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" style="color: currentColor;">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" class="icon-svg"/>
                    <path d="M12 6L12 12L16 16" stroke="currentColor" class="icon-svg"/>
                </svg>
            </a>
            <div class="tooltip-text">Profile</div>
        </div>
        <button onclick="window.web3Modal.disconnect()" class="${btnClass}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
            ${state.address.slice(0, 6)}...${state.address.slice(-4)}
        </button>
    `;
}

function resetNavButtons() {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) return;

    navButtons.innerHTML = `
        <button onclick="connectWallet()" class="btn-main">Get Started</button>
    `;
}
