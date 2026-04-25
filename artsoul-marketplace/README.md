# ArtSoul Marketplace 🎨

> The Soul of Decentralized Art - Multi-chain auction platform for NFTs, real art, and digital creations

Decentralized art marketplace with community-driven price discovery through auctions. Support for all types of art: NFTs, physical art, videos, GIFs, and digital images.

## ✨ Features

### Current (v1.0)
- 🎭 **2 UI Themes**:
  - **Brutal**: Classic Web2 oldschool style for traditional users
  - **Future**: Neon futuristic style with glow effects and animations
- 🎨 **Multi-format Gallery**: NFTs, Digital Art, Videos, GIFs, Physical Art, Images
- 🏆 **Auction System**: Community-driven price discovery (floor price voting)
- ⏱️ **Real-time Countdown**: Live auction timers
- 📱 **Responsive Design**: Works on all devices
- 🛡️ **Anti-bot Ready**: Prepared for wallet verification

### Coming Soon
- 🔗 **Multi-chain Support**: Ethereum, Polygon, BSC, Solana, Xion, Bitcoin networks
- 💼 **Web3 Wallet Integration**: WalletConnect, MetaMask, Phantom, etc.
- 🌐 **Social Integration**: Share to X/Twitter, Instagram, Discord
- 🎵 **Music Player**: YouTube Music & Spotify integration
- 📤 **Upload System**: Artists can upload their work
- 👤 **User Profiles**: Artist pages and collector profiles
- 📜 **Smart Contracts**: On-chain auction logic

## 🚀 Quick Start

### Option 1: Static HTML (Recommended for GitHub Pages)

The easiest way to deploy - just use `index.html`:

```bash
# Open in browser
open index.html

# Or serve locally
python -m http.server 8000
# Visit http://localhost:8000/index.html
```

### Option 2: Next.js Development

For advanced development with the full Next.js stack:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📦 Deployment to GitHub Pages

### Method 1: Single HTML File (Easiest)

1. Copy `index.html` to your GitHub Pages repo:
   ```bash
   cp index.html /path/to/maysonkiller.github.io/artsoul.html
   ```

2. Push to GitHub:
   ```bash
   cd /path/to/maysonkiller.github.io
   git add artsoul.html
   git commit -m "Add ArtSoul Marketplace"
   git push
   ```

3. Access at: `https://maysonkiller.github.io/artsoul.html`

### Method 2: New Repository

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🎯 How It Works

### Auction Mechanism

ArtSoul uses a unique **price discovery auction** system:

1. **Artist uploads artwork** - Sets initial starting price
2. **Community bids** - Users place bids to vote on the value
3. **Floor price emerges** - Highest bid becomes the floor price
4. **No obligation to buy** - Bids are price signals, not purchase commitments
5. **Anti-bot protection** - Only verified wallets can participate

This creates fair, community-driven pricing for art.

## 🏗️ Project Structure

```
artsoul-marketplace/
├── index.html              # 🌟 Standalone version (ready for GitHub Pages)
├── DEPLOYMENT.md           # Deployment guide
├── README.md               # This file
├── package.json            # Dependencies
├── next.config.js          # Next.js config
├── tailwind.config.js      # Tailwind config
├── postcss.config.js       # PostCSS config
├── app/                    # Next.js app directory
│   ├── layout.js           # Root layout
│   └── page.js             # Home page
├── components/             # React components
│   ├── Header.js           # Header with theme switcher
│   ├── Gallery.js          # Artwork gallery with filters
│   ├── AuctionPanel.js     # Auction bidding panel
│   └── ThemeProvider.js    # Theme context provider
└── styles/
    └── globals.css         # Global styles
```

## 🎨 Design Philosophy

**Brutal Theme**: Clean, professional, accessible. For users who prefer traditional web design.

**Future Theme**: Neon colors, glow effects, futuristic vibes. For crypto natives and digital art enthusiasts.

Both themes maintain full functionality - it's purely aesthetic preference.

## 🛠️ Tech Stack

- **Frontend**: React 18 (via CDN in standalone version)
- **Styling**: Tailwind CSS (via CDN)
- **Framework**: Next.js 16 (optional, for advanced features)
- **Animations**: CSS transitions and keyframes
- **Web3** (coming): Wagmi, WalletConnect, Ethers.js

## 📋 Roadmap

### Phase 1: Foundation ✅
- [x] UI with 2 themes
- [x] Gallery with filters
- [x] Auction panel
- [x] Responsive design
- [x] Static HTML version

### Phase 2: Web3 Integration 🚧
- [ ] Multi-chain wallet connection
- [ ] Smart contract deployment
- [ ] On-chain bidding
- [ ] Transaction history

### Phase 3: Social & Content 📅
- [ ] Social media sharing
- [ ] Upload system for artists
- [ ] User profiles
- [ ] Music player integration

### Phase 4: Advanced Features 🔮
- [ ] NFT minting
- [ ] Royalty system
- [ ] DAO governance
- [ ] Mobile app

## 🤝 Contributing

This is a personal project by @maysonkiller23, but suggestions are welcome!

## 📄 License

ISC

## 👤 Author

**Maysonkiller**
- Twitter: [@maysonkiller23](https://twitter.com/maysonkiller23)
- GitHub: [@maysonkiller](https://github.com/maysonkiller)

---

Built with 💜 for the decentralized art community
