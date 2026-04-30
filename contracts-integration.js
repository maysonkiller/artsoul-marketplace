// ArtSoul Smart Contract Integration
// Connects frontend to deployed contracts on Base Sepolia and Ethereum Sepolia

import { ethers } from 'https://esm.sh/ethers@6.7.0';

// Contract addresses (Testnets)
const CONTRACTS = {
    baseSepolia: {
        nft: '0x21093aFBdB713c9bA75B74A306e65C93Ba190903',
        marketplace: '0x7d2C59c8779aC201671dd1fEF7Cbf0198f010692',
        chainId: 84532
    },
    sepolia: {
        nft: '0x912F48378F7e1830de907a41Db06458f343407ee',
        marketplace: '0x21093aFBdB713c9bA75B74A306e65C93Ba190903',
        chainId: 11155111
    }
};

// Contract ABIs (simplified - only functions we need)
const NFT_ABI = [
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function getCreator(uint256 tokenId) view returns (address)"
];

const MARKETPLACE_ABI = [
    "function uploadArtwork(string ipfsHash, string metadataURI, bytes32 fileHash, uint256 creatorValue) returns (uint256)",
    "function createAuction(uint256 artworkId)",
    "function placeBid(uint256 artworkId) payable",
    "function endAuction(uint256 artworkId)",
    "function deleteArtwork(uint256 artworkId)",
    "function relistArtwork(uint256 artworkId, uint256 newPrice)",
    "function withdrawFees()",
    "function owner() view returns (address)",
    "function platformFeeBps() view returns (uint96)",
    "function artworks(uint256) view returns (uint256 id, address creator, string ipfsHash, string metadataURI, bytes32 fileHash, uint256 creatorValue, uint256 communityValue, uint256 systemValue, uint8 status, uint256 tokenId, uint256 createdAt)",
    "function auctions(uint256) view returns (uint256 artworkId, uint256 startTime, uint256 endTime, uint256 startingPrice, uint256 highestBid, address highestBidder, bool ended)",
    "function getCreatorArtworks(address creator) view returns (uint256[])",
    "event ArtworkUploaded(uint256 indexed artworkId, address indexed creator, string ipfsHash)",
    "event AuctionCreated(uint256 indexed artworkId, uint256 startingPrice, uint256 endTime)",
    "event BidPlaced(uint256 indexed artworkId, address indexed bidder, uint256 amount)",
    "event AuctionEnded(uint256 indexed artworkId, address winner, uint256 amount)"
];

class ArtSoulContracts {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.nftContract = null;
        this.marketplaceContract = null;
        this.currentNetwork = null;
    }

    /**
     * Initialize contracts with wallet provider
     */
    async init(provider) {
        try {
            // Create ethers provider
            this.provider = new ethers.BrowserProvider(provider);

            // Get network info
            const network = await this.provider.getNetwork();
            const chainId = Number(network.chainId);

            // Determine which network we're on
            let networkKey = null;
            if (chainId === CONTRACTS.baseSepolia.chainId) {
                networkKey = 'baseSepolia';
            } else if (chainId === CONTRACTS.sepolia.chainId) {
                networkKey = 'sepolia';
            } else {
                throw new Error(`Unsupported network. Please switch to Base Sepolia (${CONTRACTS.baseSepolia.chainId}) or Ethereum Sepolia (${CONTRACTS.sepolia.chainId})`);
            }

            this.currentNetwork = networkKey;
            this.signer = await this.provider.getSigner();

            // Initialize contracts
            const addresses = CONTRACTS[this.currentNetwork];
            this.nftContract = new ethers.Contract(addresses.nft, NFT_ABI, this.signer);
            this.marketplaceContract = new ethers.Contract(addresses.marketplace, MARKETPLACE_ABI, this.signer);

            console.log('✅ Contracts initialized on', this.currentNetwork);
            return true;
        } catch (error) {
            console.error('❌ Contract initialization failed:', error);
            throw error;
        }
    }

    /**
     * Upload artwork to marketplace
     */
    async uploadArtwork(ipfsHash, metadataURI, fileHash, creatorValueEth) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const creatorValue = ethers.parseEther(creatorValueEth.toString());
            const fileHashBytes = ethers.id(fileHash); // Convert to bytes32

            const tx = await this.marketplaceContract.uploadArtwork(
                ipfsHash,
                metadataURI,
                fileHashBytes,
                creatorValue
            );

            console.log('📤 Uploading artwork...', tx.hash);
            const receipt = await tx.wait();

            // Get artwork ID from event
            const event = receipt.logs.find(log => {
                try {
                    return this.marketplaceContract.interface.parseLog(log)?.name === 'ArtworkUploaded';
                } catch { return false; }
            });

            const artworkId = event ? this.marketplaceContract.interface.parseLog(event).args.artworkId : null;

            console.log('✅ Artwork uploaded! ID:', artworkId?.toString());
            return { artworkId: artworkId?.toString(), txHash: tx.hash };
        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    }

    /**
     * Create auction for artwork
     */
    async createAuction(artworkId) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const tx = await this.marketplaceContract.createAuction(artworkId);
            console.log('🎨 Creating auction...', tx.hash);
            await tx.wait();
            console.log('✅ Auction created!');
            return tx.hash;
        } catch (error) {
            console.error('❌ Auction creation failed:', error);
            throw error;
        }
    }

    /**
     * Place bid on auction
     */
    async placeBid(artworkId, bidAmountEth) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const bidAmount = ethers.parseEther(bidAmountEth.toString());
            const tx = await this.marketplaceContract.placeBid(artworkId, { value: bidAmount });
            console.log('💰 Placing bid...', tx.hash);
            await tx.wait();
            console.log('✅ Bid placed!');
            return tx.hash;
        } catch (error) {
            console.error('❌ Bid failed:', error);
            throw error;
        }
    }

    /**
     * End auction
     */
    async endAuction(artworkId) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const tx = await this.marketplaceContract.endAuction(artworkId);
            console.log('🏁 Ending auction...', tx.hash);
            await tx.wait();
            console.log('✅ Auction ended!');
            return tx.hash;
        } catch (error) {
            console.error('❌ End auction failed:', error);
            throw error;
        }
    }

    /**
     * Get artwork details
     */
    async getArtwork(artworkId) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const artwork = await this.marketplaceContract.artworks(artworkId);
            return {
                id: artwork.id.toString(),
                creator: artwork.creator,
                ipfsHash: artwork.ipfsHash,
                metadataURI: artwork.metadataURI,
                creatorValue: ethers.formatEther(artwork.creatorValue),
                communityValue: ethers.formatEther(artwork.communityValue),
                systemValue: ethers.formatEther(artwork.systemValue),
                status: Number(artwork.status), // 0=DRAFT, 1=AUCTION, 2=AUCTION_FAILED, 3=SOLD, 4=UNLISTED
                tokenId: artwork.tokenId.toString(),
                createdAt: Number(artwork.createdAt)
            };
        } catch (error) {
            console.error('❌ Get artwork failed:', error);
            throw error;
        }
    }

    /**
     * Get auction details
     */
    async getAuction(artworkId) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const auction = await this.marketplaceContract.auctions(artworkId);
            return {
                artworkId: auction.artworkId.toString(),
                startTime: Number(auction.startTime),
                endTime: Number(auction.endTime),
                startingPrice: ethers.formatEther(auction.startingPrice),
                highestBid: ethers.formatEther(auction.highestBid),
                highestBidder: auction.highestBidder,
                ended: auction.ended
            };
        } catch (error) {
            console.error('❌ Get auction failed:', error);
            throw error;
        }
    }

    /**
     * Get artworks by creator
     */
    async getCreatorArtworks(creatorAddress) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const artworkIds = await this.marketplaceContract.getCreatorArtworks(creatorAddress);
            return artworkIds.map(id => id.toString());
        } catch (error) {
            console.error('❌ Get creator artworks failed:', error);
            throw error;
        }
    }

    /**
     * Delete artwork (only DRAFT or AUCTION_FAILED)
     */
    async deleteArtwork(artworkId) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const tx = await this.marketplaceContract.deleteArtwork(artworkId);
            console.log('🗑️ Deleting artwork...', tx.hash);
            await tx.wait();
            console.log('✅ Artwork deleted!');
            return tx.hash;
        } catch (error) {
            console.error('❌ Delete failed:', error);
            throw error;
        }
    }

    /**
     * Relist artwork with new price
     */
    async relistArtwork(artworkId, newPriceEth) {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const newPrice = ethers.parseEther(newPriceEth.toString());
            const tx = await this.marketplaceContract.relistArtwork(artworkId, newPrice);
            console.log('🔄 Relisting artwork...', tx.hash);
            await tx.wait();
            console.log('✅ Artwork relisted!');
            return tx.hash;
        } catch (error) {
            console.error('❌ Relist failed:', error);
            throw error;
        }
    }

    /**
     * Check if current user is contract owner
     */
    async isOwner() {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const owner = await this.marketplaceContract.owner();
            const currentAddress = await this.signer.getAddress();
            return owner.toLowerCase() === currentAddress.toLowerCase();
        } catch (error) {
            console.error('❌ Owner check failed:', error);
            return false;
        }
    }

    /**
     * Get contract balance (accumulated fees)
     */
    async getContractBalance() {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const balance = await this.provider.getBalance(await this.marketplaceContract.getAddress());
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('❌ Get balance failed:', error);
            throw error;
        }
    }

    /**
     * Get platform fee percentage
     */
    async getPlatformFee() {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            const feeBps = await this.marketplaceContract.platformFeeBps();
            return Number(feeBps) / 100; // Convert basis points to percentage
        } catch (error) {
            console.error('❌ Get platform fee failed:', error);
            throw error;
        }
    }

    /**
     * Withdraw accumulated platform fees (owner only)
     */
    async withdrawFees() {
        if (!this.marketplaceContract) throw new Error('Contracts not initialized');

        try {
            // Check if user is owner
            const isOwner = await this.isOwner();
            if (!isOwner) {
                throw new Error('Only contract owner can withdraw fees');
            }

            // Get current balance
            const balance = await this.getContractBalance();
            console.log(`💰 Withdrawing ${balance} ETH...`);

            const tx = await this.marketplaceContract.withdrawFees();
            console.log('⏳ Transaction sent:', tx.hash);
            await tx.wait();
            console.log('✅ Fees withdrawn successfully!');

            return {
                txHash: tx.hash,
                amount: balance
            };
        } catch (error) {
            console.error('❌ Withdraw failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
window.ArtSoulContracts = new ArtSoulContracts();

console.log('📦 ArtSoul Contracts module loaded');
