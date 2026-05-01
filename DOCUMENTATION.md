# ArtSoul Marketplace - Project Documentation

**Version:** 1.0  
**Last Updated:** May 1, 2026  
**Status:** Testnet Deployment

---

## What is ArtSoul?

ArtSoul is a next-generation NFT marketplace that revolutionizes digital art trading through innovative auction mechanics, community-driven valuation, and fair pricing mechanisms. Built on Base and Ethereum networks, ArtSoul empowers artists and collectors with transparent, secure, and efficient tools for creating, discovering, and trading digital art.

### Key Innovation: Auction V2 System

Unlike traditional NFT marketplaces where auctions directly sell the NFT, ArtSoul introduces a groundbreaking **floor price discovery mechanism**:

- **Auctions set the floor price, not the sale**
- **10% deposit system** prevents fake bids
- **24-hour winner purchase window** ensures commitment
- **Three distinct roles**: Creator (permanent), Auction Winner (honorary), Current Owner (transferable)
- **Direct sales after auction** at prices ≥ floor price

This system protects artists from undervaluation while giving collectors confidence in fair market pricing.

---

## Core Features

### 1. Deposit-Based Auction System

**How it works:**
1. Artist uploads artwork and sets starting price
2. Auction runs for 3 days
3. Bidders pay 10% deposit (previous bidder auto-refunded)
4. Auction ends → highest bid becomes **floor price**
5. Winner has 24 hours to complete purchase
6. If winner doesn't buy, artist can sell directly at price ≥ floor

**Benefits:**
- Prevents fake bids (deposit required)
- Establishes fair market value
- Protects artists from undervaluation
- Gives collectors price confidence
- Reduces gas costs (lazy minting)

### 2. Community Voting System

**Democratic valuation:**
- Users vote for artworks they believe in
- Top 12 most-voted artworks featured on homepage
- Transparent ranking system
- One vote per wallet per artwork
- Helps discover emerging artists

### 3. Three-Role Ownership Model

**Creator** (Permanent)
- Original artist
- Receives royalties on all future sales
- Can set artwork for direct sale

**Auction Winner** (Honorary Title)
- Won the initial auction
- Honorary title that never changes
- Recognized as first supporter

**Current Owner** (Transferable)
- Current NFT holder
- Can resell at any price ≥ floor
- Full ownership rights

### 4. Lazy Minting

**Gas-efficient approach:**
- NFT only minted when sold
- Artists don't pay gas for uploads
- Reduces blockchain bloat
- Environmentally friendly

### 5. Multi-Format Support

**Supported media types:**
- Images (JPG, PNG, GIF, WebP)
- Videos (MP4, WebM, MOV)
- Music (MP3, WAV, AAC)
- Animated GIFs

### 6. Dual Theme System

**Classic Mode:**
- Elegant teal aesthetic
- Professional appearance
- Traditional art gallery feel

**Future Mode:**
- Cyberpunk neon design
- Animated gradients
- Modern tech aesthetic

---

## Why ArtSoul?

### For Artists

**Fair Pricing**
- Auction establishes true market value
- Floor price prevents undervaluation
- 7.5% royalties on all future sales

**Zero Upfront Costs**
- No gas fees for uploads
- Lazy minting saves money
- Only pay when artwork sells

**Community Support**
- Voting system boosts visibility
- Top 12 homepage feature
- Direct connection with collectors

### For Collectors

**Price Confidence**
- Floor price = proven market value
- No overpaying risk
- Transparent auction history

**Investment Protection**
- Can't resell below floor
- Maintains artwork value
- Honorary "Auction Winner" status

**Discovery Tools**
- Community voting highlights quality
- Filter by type, status, price
- Comprehensive artwork information

### For Investors

**Innovative Technology**
- Novel auction mechanism (patent-pending concept)
- Solves real NFT market problems
- Scalable architecture

**Market Opportunity**
- NFT market: $20B+ (2025)
- Growing artist adoption
- Multi-chain strategy (Base + Ethereum)

**Revenue Model**
- 2.5% platform fee on all sales
- Sustainable and proven
- Low operational costs

---

## Technical Architecture

### Smart Contracts

**ArtSoulNFT.sol** (ERC-721)
- Lazy minting implementation
- Royalty support (ERC-2981)
- Marketplace integration
- Gas-optimized

**ArtSoulMarketplaceV2.sol**
- Deposit-based bidding
- Floor price mechanism
- Three-role ownership
- Reentrancy protection
- Access control

**Security Features:**
- OpenZeppelin contracts
- Audited patterns
- ReentrancyGuard
- Ownable access control

### Frontend Stack

**Core Technologies:**
- React 18 (UI components)
- Ethers.js v6 (blockchain interaction)
- Reown AppKit (wallet connection)
- Tailwind CSS (styling)

**Infrastructure:**
- Supabase (database + auth)
- IPFS (decentralized storage)
- GitHub Pages (hosting)

**Supported Wallets:**
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow
- Trust Wallet

### Database Schema

**Tables:**
- `profiles` - User profiles and avatars
- `artworks` - Artwork metadata and status
- `auctions` - Auction state and history
- `bids_history` - Bid tracking with deposits
- `votes` - Community voting records

**Security:**
- Row Level Security (RLS)
- Authenticated access only
- Input validation
- XSS protection

---

## Current Status

### Completed Features

**Core Functionality:**
- Wallet connection (MetaMask, WalletConnect)
- User profiles with avatars
- Multi-format artwork upload
- IPFS integration
- Community voting system
- Gallery with filters

**Auction V2 System:**
- Smart contracts deployed (testnet)
- Deposit-based bidding
- Floor price mechanism
- 24-hour winner window
- Direct sales after auction
- Three-role ownership tracking

**User Experience:**
- Responsive design (mobile + desktop)
- Dual theme system
- Real-time updates
- Social sharing

**Security:**
- XSS protection
- RLS policies
- Input validation
- Reentrancy guards

### In Progress

- End-to-end testing on testnet
- UI updates for Auction V2
- Toast notifications
- Enhanced error handling

### Roadmap

**Q2 2026 (Current)**
- Complete testnet testing
- UI/UX improvements
- Bug fixes and optimization

**Q3-Q4 2026**
- Security audit
- Mainnet deployment (Base)
- Marketing campaign
- Community building

**Q1 2027**
- Ethereum mainnet deployment
- Advanced analytics
- Mobile app (iOS/Android)
- API for third-party integrations

---

## Deployed Contracts (Testnet)

### Base Sepolia
- **NFT Contract:** `0x21093aFBdB713c9bA75B74A306e65C93Ba190903`
- **Marketplace:** `0x7d2C59c8779aC201671dd1fEF7Cbf0198f010692`
- **Explorer:** https://sepolia.basescan.org

### Ethereum Sepolia
- **NFT Contract:** `0x912F48378F7e1830de907a41Db06458f343407ee`
- **Marketplace:** `0x21093aFBdB713c9bA75B74A306e65C93Ba190903`
- **Explorer:** https://sepolia.etherscan.io

---

## Tokenomics & Fees

### Platform Fees
- **Platform Fee:** 2.5% on all sales
- **Creator Royalty:** 7.5% on secondary sales
- **Auction Deposit:** 10% of bid (refundable)

### Gas Optimization
- Lazy minting (no upfront gas)
- Batch operations where possible
- Layer 2 support (Base network)

### Revenue Projections

**Conservative Scenario** (Year 1)
- 1,000 artworks sold
- Average price: 0.1 ETH
- Total volume: 100 ETH
- Platform revenue: 2.5 ETH (~$5,000)

**Moderate Scenario** (Year 1)
- 5,000 artworks sold
- Average price: 0.2 ETH
- Total volume: 1,000 ETH
- Platform revenue: 25 ETH (~$50,000)

**Optimistic Scenario** (Year 1)
- 20,000 artworks sold
- Average price: 0.3 ETH
- Total volume: 6,000 ETH
- Platform revenue: 150 ETH (~$300,000)

---

## Security & Compliance

### Smart Contract Security

**Best Practices:**
- OpenZeppelin libraries
- ReentrancyGuard on all payment functions
- Access control (Ownable)
- Input validation
- Event logging

**Audit Status:**
- Internal review: Complete
- External audit: Scheduled (Q3 2026)

### Data Privacy

**User Data:**
- Wallet addresses (public)
- Profile information (optional)
- No KYC required
- GDPR compliant

**Storage:**
- Artwork files: IPFS (decentralized)
- Metadata: Supabase (encrypted)
- No sensitive data stored

### Compliance

**Regulatory Considerations:**
- NFTs as digital collectibles
- No securities offering
- Platform fee disclosure
- Terms of service
- Privacy policy

---

## Competitive Advantages

### vs OpenSea
- Floor price protection
- Deposit-based bidding (no fake bids)
- Community voting system
- Lower fees (2.5% vs 2.5%)
- Lazy minting built-in

### vs Rarible
- Better auction mechanics
- Three-role ownership model
- Cleaner UI/UX
- Multi-chain from day 1

### vs Foundation
- No invite required
- Open to all artists
- Community-driven discovery
- More flexible pricing

---

## Market Opportunity

### NFT Market Size
- **2025 Market:** $20B+
- **2026 Projection:** $30B+
- **CAGR:** 35%+

### Target Audience

**Primary:**
- Digital artists (emerging & established)
- NFT collectors
- Crypto enthusiasts

**Secondary:**
- Traditional artists entering Web3
- Art investors
- Gallery owners

**Geographic Focus:**
- North America (40%)
- Europe (30%)
- Asia (20%)
- Other (10%)

---

## Team & Contact

### Core Team
- **Founder/Developer:** Building innovative NFT solutions
- **Smart Contract Development:** Solidity experts
- **Frontend Development:** React/Web3 specialists
- **Design:** UI/UX professionals

### Links
- **Website:** https://maysonkiller.github.io/artsoul-marketplace/
- **GitHub:** https://github.com/maysonkiller/artsoul-marketplace
- **Testnet Demo:** Available now
- **Documentation:** This document

### Contact
- **Email:** maysonkiller@gmail.com
- **Twitter:** [@maysonkiller23](https://x.com/maysonkiller23)
- **Discord:** maysonkiller

---

## Legal Disclaimer

This documentation is for informational purposes only and does not constitute:
- Investment advice
- Financial advice
- Legal advice
- Securities offering

ArtSoul is an experimental platform in active development. Use at your own risk. Smart contracts are provided "as is" without warranties. Always do your own research (DYOR) before participating in any blockchain-based platform.

---

## Vision

ArtSoul aims to become the premier destination for digital art trading by:

1. **Empowering Artists** - Fair pricing, zero upfront costs, community support
2. **Protecting Collectors** - Price confidence, investment protection, transparent history
3. **Building Community** - Democratic valuation, social features, collaborative discovery
4. **Innovating Technology** - Novel auction mechanics, gas optimization, multi-chain support

We believe the future of art is digital, decentralized, and community-driven. ArtSoul is building that future.

---

**Join us in revolutionizing digital art trading.**

*Last updated: May 1, 2026*
