// ArtSoul Marketplace - Web3Modal AppKit Configuration
// WalletConnect Project ID
const projectId = '9fdc97f91c02d46a28ca9d185a9e58f2';

// Import Web3Modal and Ethers
import { createWeb3Modal, defaultConfig } from 'https://cdn.jsdelivr.net/npm/@web3modal/ethers@3.5.0/+esm';

// Define all networks
const mainnet = {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com'
};

const polygon = {
    chainId: 137,
    name: 'Polygon',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com'
};

const bsc = {
    chainId: 56,
    name: 'BSC',
    currency: 'BNB',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.binance.org'
};

const base = {
    chainId: 8453,
    name: 'Base',
    currency: 'ETH',
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org'
};

const arbitrum = {
    chainId: 42161,
    name: 'Arbitrum',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
};

const optimism = {
    chainId: 10,
    name: 'Optimism',
    currency: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcUrl: 'https://mainnet.optimism.io'
};

const sepolia = {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://rpc.sepolia.org'
};

// Custom Rialo Playground Network
const rialoPlayground = {
    chainId: 2025,
    name: 'Rialo Playground',
    currency: 'RIA',
    explorerUrl: 'https://playground.rialo.io',
    rpcUrl: 'https://playground.rialo.io/rpc'
};

// Metadata
const metadata = {
    name: 'ArtSoul Marketplace',
    description: 'Decentralized Art Marketplace - Where community determines value',
    url: 'https://maysonkiller.github.io/artsoul-marketplace',
    icons: ['https://maysonkiller.github.io/artsoul-marketplace/logo.png']
};

// Ethers config
const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: true,
    rpcUrl: polygon.rpcUrl,
    defaultChainId: 137
});

// Create Web3Modal instance
const modal = createWeb3Modal({
    ethersConfig,
    chains: [mainnet, polygon, bsc, base, arbitrum, optimism, sepolia, rialoPlayground],
    projectId,
    enableAnalytics: true,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#06b6d4',
        '--w3m-border-radius-master': '8px'
    }
});

// Subscribe to wallet state changes
modal.subscribeProvider((state) => {
    console.log('Wallet state changed:', state);

    // Dispatch custom event for React components
    window.dispatchEvent(new CustomEvent('walletStateChange', {
        detail: {
            isConnected: state.isConnected,
            address: state.address,
            chainId: state.chainId
        }
    }));
});

// Export modal for global access
window.web3Modal = modal;

console.log('✅ Web3Modal initialized successfully');
console.log('📊 Supported networks:', [mainnet, polygon, bsc, base, arbitrum, optimism, sepolia, rialoPlayground].map(n => n.name));
console.log('◈ Rialo Playground (Chain ID: 2025) is ready!');
