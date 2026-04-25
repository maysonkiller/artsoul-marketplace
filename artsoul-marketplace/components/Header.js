'use client'

import { motion } from 'framer-motion'

export default function Header({ theme, setTheme, walletConnected, setWalletConnected }) {
  const isBrutal = theme === 'brutal'

  const handleConnectWallet = () => {
    // Mock wallet connection - will be replaced with real Web3 integration
    setWalletConnected(true)
    alert('Wallet connection will be implemented with Web3 integration')
  }

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md ${
      isBrutal
        ? 'bg-white/90 border-b border-gray-300'
        : 'bg-black/50 border-b border-cyan-500/30'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <h1 className={`text-3xl font-bold ${
              isBrutal ? 'text-gray-900' : 'text-cyan-400 neon-glow'
            }`}>
              ArtSoul
            </h1>
            <span className={`text-sm ${
              isBrutal ? 'text-gray-600' : 'text-purple-300'
            }`}>
              Decentralized Art Marketplace
            </span>
          </motion.div>

          {/* Theme Switcher & Wallet */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className={`flex gap-2 p-1 rounded-lg ${
              isBrutal ? 'bg-gray-200' : 'bg-gray-800/50'
            }`}>
              <button
                onClick={() => setTheme('brutal')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  theme === 'brutal'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isBrutal ? 'text-gray-700 hover:bg-gray-300' : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                Brutal
              </button>
              <button
                onClick={() => setTheme('future')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  theme === 'future'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg neon-border'
                    : isBrutal ? 'text-gray-700 hover:bg-gray-300' : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                Future
              </button>
            </div>

            {/* Network Indicator */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg ${
              isBrutal ? 'bg-gray-100 text-gray-700' : 'bg-gray-800/50 text-cyan-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isBrutal ? 'bg-green-500' : 'bg-cyan-400 animate-pulse'
              }`} />
              <span className="text-sm">Multi-chain</span>
            </div>

            {/* Wallet Button */}
            <button
              onClick={handleConnectWallet}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                walletConnected
                  ? isBrutal
                    ? 'bg-green-600 text-white'
                    : 'bg-gradient-to-r from-green-500 to-cyan-500 text-white neon-border'
                  : isBrutal
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg neon-border'
              }`}
            >
              {walletConnected ? '0x...1234' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
