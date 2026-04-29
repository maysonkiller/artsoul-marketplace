// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArtSoulNFT.sol";

/**
 * @title ArtSoulMarketplace
 * @dev Manages artwork uploads, auctions, and sales
 */
contract ArtSoulMarketplace is ReentrancyGuard, Ownable {
    ArtSoulNFT public nftContract;

    // Platform fee in basis points (250 = 2.5%)
    uint96 public platformFeeBps = 250;

    // Royalty fee in basis points (750 = 7.5%)
    uint96 public royaltyFeeBps = 750;

    // Auction duration (3 days)
    uint256 public constant AUCTION_DURATION = 3 days;

    // Minimum bid increment (5%)
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;

    enum ArtworkStatus {
        DRAFT,           // Uploaded but not listed
        AUCTION,         // On auction
        AUCTION_FAILED,  // Auction ended with no bids
        SOLD,            // Sold and minted
        UNLISTED         // Removed from sale
    }

    struct Artwork {
        uint256 id;
        address creator;
        string ipfsHash;        // IPFS hash of the artwork file
        string metadataURI;     // IPFS URI with full metadata
        bytes32 fileHash;       // SHA-256 hash for duplicate detection
        uint256 creatorValue;   // Price set by creator (in wei)
        uint256 communityValue; // Average community valuation
        uint256 systemValue;    // AI-generated valuation
        ArtworkStatus status;
        uint256 tokenId;        // NFT token ID (0 if not minted)
        uint256 createdAt;
    }

    struct Auction {
        uint256 artworkId;
        uint256 startTime;
        uint256 endTime;
        uint256 startingPrice;  // Creator value
        uint256 highestBid;
        address highestBidder;
        bool ended;
    }

    // Storage
    uint256 private _artworkIdCounter;
    mapping(uint256 => Artwork) public artworks;
    mapping(uint256 => Auction) public auctions;
    mapping(bytes32 => bool) public usedFileHashes;
    mapping(address => uint256[]) public creatorArtworks;

    // Events
    event ArtworkUploaded(uint256 indexed artworkId, address indexed creator, string ipfsHash);
    event AuctionCreated(uint256 indexed artworkId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed artworkId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed artworkId, address winner, uint256 amount);
    event ArtworkDeleted(uint256 indexed artworkId);
    event ArtworkRelisted(uint256 indexed artworkId, uint256 newPrice);

    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract");
        nftContract = ArtSoulNFT(_nftContract);
    }

    /**
     * @dev Upload artwork (DRAFT status)
     */
    function uploadArtwork(
        string memory ipfsHash,
        string memory metadataURI,
        bytes32 fileHash,
        uint256 creatorValue
    ) external returns (uint256) {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(creatorValue > 0, "Creator value must be > 0");
        require(!usedFileHashes[fileHash], "Duplicate artwork detected");

        _artworkIdCounter++;
        uint256 artworkId = _artworkIdCounter;

        artworks[artworkId] = Artwork({
            id: artworkId,
            creator: msg.sender,
            ipfsHash: ipfsHash,
            metadataURI: metadataURI,
            fileHash: fileHash,
            creatorValue: creatorValue,
            communityValue: 0,
            systemValue: 0,
            status: ArtworkStatus.DRAFT,
            tokenId: 0,
            createdAt: block.timestamp
        });

        usedFileHashes[fileHash] = true;
        creatorArtworks[msg.sender].push(artworkId);

        emit ArtworkUploaded(artworkId, msg.sender, ipfsHash);

        return artworkId;
    }

    /**
     * @dev Create auction for artwork
     */
    function createAuction(uint256 artworkId) external {
        Artwork storage artwork = artworks[artworkId];
        require(artwork.creator == msg.sender, "Not the creator");
        require(
            artwork.status == ArtworkStatus.DRAFT ||
            artwork.status == ArtworkStatus.AUCTION_FAILED,
            "Invalid status"
        );

        uint256 endTime = block.timestamp + AUCTION_DURATION;

        auctions[artworkId] = Auction({
            artworkId: artworkId,
            startTime: block.timestamp,
            endTime: endTime,
            startingPrice: artwork.creatorValue,
            highestBid: 0,
            highestBidder: address(0),
            ended: false
        });

        artwork.status = ArtworkStatus.AUCTION;

        emit AuctionCreated(artworkId, artwork.creatorValue, endTime);
    }

    /**
     * @dev Place bid on auction
     */
    function placeBid(uint256 artworkId) external payable nonReentrant {
        Auction storage auction = auctions[artworkId];
        Artwork storage artwork = artworks[artworkId];

        require(artwork.status == ArtworkStatus.AUCTION, "Not on auction");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != artwork.creator, "Creator cannot bid");

        uint256 minBid = auction.highestBid == 0
            ? auction.startingPrice
            : auction.highestBid + (auction.highestBid * MIN_BID_INCREMENT_BPS / 10000);

        require(msg.value >= minBid, "Bid too low");

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            (bool success, ) = auction.highestBidder.call{value: auction.highestBid}("");
            require(success, "Refund failed");
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(artworkId, msg.sender, msg.value);
    }

    /**
     * @dev End auction and mint NFT if there's a winner
     */
    function endAuction(uint256 artworkId) external nonReentrant {
        Auction storage auction = auctions[artworkId];
        Artwork storage artwork = artworks[artworkId];

        require(artwork.status == ArtworkStatus.AUCTION, "Not on auction");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.ended, "Already ended");

        auction.ended = true;

        if (auction.highestBidder == address(0)) {
            // No bids - auction failed
            artwork.status = ArtworkStatus.AUCTION_FAILED;
            emit AuctionEnded(artworkId, address(0), 0);
        } else {
            // Mint NFT to winner
            uint256 tokenId = nftContract.mintNFT(
                artwork.creator,
                auction.highestBidder,
                artwork.metadataURI,
                royaltyFeeBps
            );

            artwork.tokenId = tokenId;
            artwork.status = ArtworkStatus.SOLD;

            // Distribute funds
            uint256 platformFee = (auction.highestBid * platformFeeBps) / 10000;
            uint256 creatorAmount = auction.highestBid - platformFee;

            (bool success, ) = artwork.creator.call{value: creatorAmount}("");
            require(success, "Creator payment failed");

            emit AuctionEnded(artworkId, auction.highestBidder, auction.highestBid);
        }
    }

    /**
     * @dev Delete artwork (only DRAFT or AUCTION_FAILED)
     */
    function deleteArtwork(uint256 artworkId) external {
        Artwork storage artwork = artworks[artworkId];
        require(artwork.creator == msg.sender, "Not the creator");
        require(
            artwork.status == ArtworkStatus.DRAFT ||
            artwork.status == ArtworkStatus.AUCTION_FAILED,
            "Cannot delete"
        );

        // Free up file hash for reuse
        usedFileHashes[artwork.fileHash] = false;

        artwork.status = ArtworkStatus.UNLISTED;

        emit ArtworkDeleted(artworkId);
    }

    /**
     * @dev Relist failed auction with new price
     */
    function relistArtwork(uint256 artworkId, uint256 newPrice) external {
        Artwork storage artwork = artworks[artworkId];
        require(artwork.creator == msg.sender, "Not the creator");
        require(artwork.status == ArtworkStatus.AUCTION_FAILED, "Not failed auction");
        require(newPrice > 0, "Invalid price");

        artwork.creatorValue = newPrice;
        artwork.status = ArtworkStatus.DRAFT;

        emit ArtworkRelisted(artworkId, newPrice);
    }

    /**
     * @dev Update AI system value (called by backend)
     */
    function updateSystemValue(uint256 artworkId, uint256 systemValue) external onlyOwner {
        artworks[artworkId].systemValue = systemValue;
    }

    /**
     * @dev Update community value (called by backend after votes)
     */
    function updateCommunityValue(uint256 artworkId, uint256 communityValue) external onlyOwner {
        artworks[artworkId].communityValue = communityValue;
    }

    /**
     * @dev Get artworks by creator
     */
    function getCreatorArtworks(address creator) external view returns (uint256[] memory) {
        return creatorArtworks[creator];
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint96 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = newFeeBps;
    }
}
