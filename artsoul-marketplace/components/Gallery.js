'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const mockArtworks = [
  {
    id: 1,
    title: 'Soul Flame',
    artist: 'Maysonkiller',
    type: 'NFT',
    image: '/images/placeholder1.jpg',
    description: 'A burning representation of the digital soul',
    currentBid: 0.5,
    bids: [0.3, 0.4, 0.5],
  },
  {
    id: 2,
    title: 'Neon Dreams',
    artist: 'CryptoArtist',
    type: 'Digital Art',
    image: '/images/placeholder2.jpg',
    description: 'Futuristic cityscape in neon colors',
    currentBid: 1.2,
    bids: [0.8, 1.0, 1.2],
  },
  {
    id: 3,
    title: 'Silent Choir',
    artist: 'Maysonkiller',
    type: 'Video',
    image: '/images/placeholder3.jpg',
    description: 'An audiovisual journey through silence',
    currentBid: 0.8,
    bids: [0.5, 0.7, 0.8],
  },
  {
    id: 4,
    title: 'Cosmic Melancholy',
    artist: 'StarGazer',
    type: 'GIF',
    image: '/images/placeholder4.jpg',
    description: 'Animated loop of cosmic emotions',
    currentBid: 0.3,
    bids: [0.1, 0.2, 0.3],
  },
  {
    id: 5,
    title: 'Real Canvas #1',
    artist: 'TraditionalArt',
    type: 'Physical Art',
    image: '/images/placeholder5.jpg',
    description: 'Oil painting on canvas - tokenized',
    currentBid: 2.5,
    bids: [1.5, 2.0, 2.5],
  },
  {
    id: 6,
    title: 'Pixel Poetry',
    artist: 'DigitalPoet',
    type: 'Image',
    image: '/images/placeholder6.jpg',
    description: 'Generative pixel art with hidden meaning',
    currentBid: 0.6,
    bids: [0.4, 0.5, 0.6],
  },
]

export default function Gallery({ theme, selectedArtwork, setSelectedArtwork }) {
  const [filter, setFilter] = useState('all')
  const isBrutal = theme === 'brutal'

  const filteredArtworks = filter === 'all'
    ? mockArtworks
    : mockArtworks.filter(art => art.type.toLowerCase().includes(filter.toLowerCase()))

  const filters = ['all', 'NFT', 'Digital Art', 'Video', 'GIF', 'Physical Art', 'Image']

  return (
    <div className={`rounded-xl p-6 ${
      isBrutal
        ? 'bg-white shadow-lg border border-gray-200'
        : 'bg-gray-900/50 backdrop-blur-md border border-cyan-500/30 neon-border'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${
          isBrutal ? 'text-gray-900' : 'text-cyan-400 neon-glow'
        }`}>
          Gallery
        </h2>
        <span className={`text-sm ${
          isBrutal ? 'text-gray-600' : 'text-purple-300'
        }`}>
          {filteredArtworks.length} artworks
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? isBrutal
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                : isBrutal
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArtworks.map((artwork, index) => (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedArtwork(artwork)}
            className={`cursor-pointer rounded-lg overflow-hidden transition-all ${
              selectedArtwork?.id === artwork.id
                ? isBrutal
                  ? 'ring-4 ring-blue-600 shadow-xl'
                  : 'ring-4 ring-cyan-400 shadow-2xl neon-border'
                : isBrutal
                  ? 'hover:shadow-lg'
                  : 'hover:shadow-cyan-500/50 hover:shadow-lg'
            } ${
              isBrutal ? 'bg-gray-50' : 'bg-gray-800/50 backdrop-blur-sm'
            }`}
          >
            {/* Image Placeholder */}
            <div className={`aspect-square flex items-center justify-center ${
              isBrutal ? 'bg-gray-200' : 'bg-gradient-to-br from-purple-900/50 to-cyan-900/50'
            }`}>
              <div className="text-center p-4">
                <div className={`text-4xl mb-2 ${
                  isBrutal ? 'text-gray-400' : 'text-cyan-400'
                }`}>
                  {artwork.type === 'Video' ? '🎬' : artwork.type === 'GIF' ? '🎞️' : '🖼️'}
                </div>
                <div className={`text-sm ${
                  isBrutal ? 'text-gray-500' : 'text-purple-300'
                }`}>
                  {artwork.type}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className={`font-bold text-lg mb-1 ${
                isBrutal ? 'text-gray-900' : 'text-cyan-300'
              }`}>
                {artwork.title}
              </h3>
              <p className={`text-sm mb-2 ${
                isBrutal ? 'text-gray-600' : 'text-gray-400'
              }`}>
                by {artwork.artist}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${
                  isBrutal ? 'text-gray-500' : 'text-purple-300'
                }`}>
                  Floor: {artwork.currentBid} ETH
                </span>
                <span className={`text-xs ${
                  isBrutal ? 'text-blue-600' : 'text-cyan-400'
                }`}>
                  {artwork.bids.length} bids
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
