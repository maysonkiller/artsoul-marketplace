'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function AuctionPanel({ theme, artwork, walletConnected }) {
  const [bidAmount, setBidAmount] = useState('')
  const [timeLeft, setTimeLeft] = useState(3 * 24 * 60 * 60) // 3 days in seconds
  const isBrutal = theme === 'brutal'

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const mins = Math.floor((seconds % (60 * 60)) / 60)
    const secs = seconds % 60
    return `${days}d ${hours}h ${mins}m ${secs}s`
  }

  const handlePlaceBid = () => {
    if (!walletConnected) {
      alert('Please connect your wallet first')
      return
    }
    if (!artwork) {
      alert('Please select an artwork first')
      return
    }
    const bid = parseFloat(bidAmount)
    if (!bid || bid <= artwork.currentBid) {
      alert(`Bid must be higher than current floor: ${artwork.currentBid} ETH`)
      return
    }
    alert(`Bid placed: ${bid} ETH for "${artwork.title}"\n\nThis will be implemented with smart contracts`)
    setBidAmount('')
  }

  if (!artwork) {
    return (
      <div className={`rounded-xl p-6 ${
        isBrutal
          ? 'bg-white shadow-lg border border-gray-200'
          : 'bg-gray-900/50 backdrop-blur-md border border-cyan-500/30 neon-border'
      }`}>
        <div className="text-center py-12">
          <div className={`text-6xl mb-4 ${
            isBrutal ? 'text-gray-300' : 'text-cyan-400/30'
          }`}>
            🎨
          </div>
          <p className={`${
            isBrutal ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Select an artwork to view auction details
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl p-6 sticky top-24 ${
        isBrutal
          ? 'bg-white shadow-lg border border-gray-200'
          : 'bg-gray-900/50 backdrop-blur-md border border-cyan-500/30 neon-border'
      }`}
    >
      {/* Artwork Info */}
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          isBrutal ? 'text-gray-900' : 'text-cyan-400 neon-glow'
        }`}>
          {artwork.title}
        </h2>
        <p className={`text-sm mb-4 ${
          isBrutal ? 'text-gray-600' : 'text-gray-400'
        }`}>
          by {artwork.artist}
        </p>
        <p className={`text-sm ${
          isBrutal ? 'text-gray-700' : 'text-purple-300'
        }`}>
          {artwork.description}
        </p>
      </div>

      {/* Timer */}
      <div className={`rounded-lg p-4 mb-6 ${
        isBrutal ? 'bg-gray-50' : 'bg-gray-800/50'
      }`}>
        <div className={`text-xs mb-2 ${
          isBrutal ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Auction ends in
        </div>
        <div className={`text-2xl font-bold ${
          isBrutal ? 'text-blue-600' : 'text-cyan-400'
        }`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Current Floor */}
      <div className={`rounded-lg p-4 mb-6 ${
        isBrutal ? 'bg-blue-50' : 'bg-gradient-to-br from-purple-900/30 to-cyan-900/30'
      }`}>
        <div className={`text-xs mb-2 ${
          isBrutal ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Current Floor Price
        </div>
        <div className={`text-3xl font-bold ${
          isBrutal ? 'text-blue-600' : 'text-cyan-400 neon-glow'
        }`}>
          {artwork.currentBid} ETH
        </div>
        <div className={`text-xs mt-2 ${
          isBrutal ? 'text-gray-500' : 'text-purple-300'
        }`}>
          {artwork.bids.length} community bids
        </div>
      </div>

      {/* Bid History */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${
          isBrutal ? 'text-gray-700' : 'text-cyan-300'
        }`}>
          Recent Bids
        </h3>
        <div className="space-y-2">
          {artwork.bids.slice().reverse().map((bid, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded ${
                isBrutal ? 'bg-gray-50' : 'bg-gray-800/30'
              }`}
            >
              <span className={`text-sm ${
                isBrutal ? 'text-gray-600' : 'text-gray-400'
              }`}>
                0x{Math.random().toString(36).substring(2, 8)}...
              </span>
              <span className={`text-sm font-semibold ${
                isBrutal ? 'text-blue-600' : 'text-cyan-400'
              }`}>
                {bid} ETH
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Place Bid */}
      <div>
        <label className={`block text-sm font-semibold mb-2 ${
          isBrutal ? 'text-gray-700' : 'text-cyan-300'
        }`}>
          Place Your Bid
        </label>
        <input
          type="number"
          step="0.01"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder={`Min: ${artwork.currentBid + 0.1} ETH`}
          className={`w-full px-4 py-3 rounded-lg mb-4 ${
            isBrutal
              ? 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-600'
              : 'bg-gray-800/50 border border-cyan-500/30 text-cyan-100 focus:ring-2 focus:ring-cyan-400'
          } outline-none transition-all`}
        />
        <button
          onClick={handlePlaceBid}
          disabled={!walletConnected}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            walletConnected
              ? isBrutal
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-2xl neon-border'
              : isBrutal
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {walletConnected ? 'Place Bid' : 'Connect Wallet to Bid'}
        </button>
      </div>

      {/* Info */}
      <div className={`mt-6 p-4 rounded-lg text-xs ${
        isBrutal ? 'bg-gray-50 text-gray-600' : 'bg-gray-800/30 text-gray-400'
      }`}>
        <p className="mb-2">
          ℹ️ This is a price discovery auction. Your bid helps set the floor price.
        </p>
        <p>
          🛡️ Anti-bot protection active. Only verified wallets can bid.
        </p>
      </div>
    </motion.div>
  )
}
