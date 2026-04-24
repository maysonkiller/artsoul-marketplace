// Privy + Wagmi Configuration for ArtSoul Marketplace
// This file contains all Web3 and authentication configuration

import { mainnet, polygon, bsc, arbitrum, optimism, avalanche, base } from 'viem/chains';

// Supported chains configuration
export const chains = [
    mainnet,
    polygon,
    bsc,
    arbitrum,
    optimism,
    avalanche,
    base,
    // Add custom chains here
];

// Privy configuration
export const privyConfig = {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id',
    config: {
        // Appearance
        appearance: {
            theme: 'dark',
            accentColor: '#06b6d4', // cyan-500
            logo: 'https://maysonkiller.github.io/artsoul-marketplace/logo.png',
        },
        // Login methods
        loginMethods: ['wallet', 'email', 'google', 'twitter'],
        // Embedded wallet configuration
        embeddedWallets: {
            createOnLogin: 'users-without-wallets', // Auto-create wallet for social logins
            noPromptOnSignature: false,
        },
        // Wallet configuration
        defaultChain: polygon,
        supportedChains: chains,
        // Mobile configuration
        mobileWalletConnectOptions: {
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
        },
    },
};

// Wagmi configuration
export const wagmiConfig = {
    chains,
    transports: {
        [mainnet.id]: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
        [polygon.id]: 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
        [bsc.id]: 'https://bsc-dataseed.binance.org',
        [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
        [optimism.id]: 'https://mainnet.optimism.io',
        [avalanche.id]: 'https://api.avax.network/ext/bc/C/rpc',
        [base.id]: 'https://mainnet.base.org',
    },
};

// Network display names and icons
export const networkInfo = {
    [mainnet.id]: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
    [polygon.id]: { name: 'Polygon', icon: '⬡', color: '#8247E5' },
    [bsc.id]: { name: 'BSC', icon: '◆', color: '#F3BA2F' },
    [arbitrum.id]: { name: 'Arbitrum', icon: '◉', color: '#28A0F0' },
    [optimism.id]: { name: 'Optimism', icon: '◎', color: '#FF0420' },
    [avalanche.id]: { name: 'Avalanche', icon: '▲', color: '#E84142' },
    [base.id]: { name: 'Base', icon: '◬', color: '#0052FF' },
};

// Required network for transactions
export const REQUIRED_CHAIN_ID = polygon.id; // Default to Polygon

// Helper function to check if user is on correct network
export const isCorrectNetwork = (currentChainId) => {
    return currentChainId === REQUIRED_CHAIN_ID;
};

// Helper function to get network name
export const getNetworkName = (chainId) => {
    return networkInfo[chainId]?.name || 'Unknown Network';
};
