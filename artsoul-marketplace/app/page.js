'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import Gallery from '../components/Gallery'
import AuctionPanel from '../components/AuctionPanel'
import ThemeProvider from '../components/ThemeProvider'

export default function Home() {
  const [theme, setTheme] = useState('brutal') // 'brutal' or 'future'
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [walletConnected, setWalletConnected] = useState(false)

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen transition-colors duration-500">
        <Header
          theme={theme}
          setTheme={setTheme}
          walletConnected={walletConnected}
          setWalletConnected={setWalletConnected}
        />

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gallery Section */}
            <div className="lg:col-span-2">
              <Gallery
                theme={theme}
                selectedArtwork={selectedArtwork}
                setSelectedArtwork={setSelectedArtwork}
              />
            </div>

            {/* Auction Panel */}
            <div className="lg:col-span-1">
              <AuctionPanel
                theme={theme}
                artwork={selectedArtwork}
                walletConnected={walletConnected}
              />
            </div>
          </div>
        </main>

        {/* Future Theme Background Effects */}
        <AnimatePresence>
          {theme === 'future' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20" />
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}
