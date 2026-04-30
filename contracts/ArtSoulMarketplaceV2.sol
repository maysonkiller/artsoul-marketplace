// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArtSoulNFT.sol";

/**
 * @title ArtSoulMarketplaceV2
 * @dev Manages artwork uploads, auctions (floor price setting), and direct sales
 *
 * NEW CONCEPT:
 * - Auction sets floor price (does NOT sell NFT)
 * - Bidders pay 10% deposit
 * - Winner gets 24h to purchase at their bid price
 * - After auction, creator can sell directly at price >= floor
 * - Three roles: Creator, Auction Winner (honorary), Current Owner
 */
contract ArtSoulMarketplaceV2 is ReentrancyGuard, Ownable {
    ArtSoulNFT public nftContract;

    // Platform fee in basis points (250 = 2.5%)
    uint96 public platformFeeBps = 250;

    // Royalty fee in basis points (750 = 7.5%)
    uint96 public royaltyFeeBps = 750;

    // Auction duration (3 days)
    uint256 public constant AUCTION_DURATION = 3 days;

    // Winner purchase window (24 hours)
    uint256 public constant WINNER_PURCHASE_WINDOW = 24 hours;

    // Minimum bid increment (5%)
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;

    // Deposit percentage (10%)
    uint256 public constant DEPOSIT_BPS = 1000;

    enum ArtworkStatus {
        DRAFT,           // Uploaded but not listed
        AUCTION,         // On auction
        AUCTION_ENDED,   // Auction ended, waiting for winner purchase
        FOR_SALE,        // Available for direct purchase
        SOLD,            // Sold and minted
        UNLISTED         // Removed from sale
    }

    struct Artwork {
        uint256 id;
        address creator;
        address auctionWinner;   // Winner of auction (honorary title, never changes)
        address currentOwner;    // Current NFT owner (changes on resale)
        string ipfsHash;
        string metadataURI;
        bytes32 fileHash;
        uint256 creatorValue;    // Initial price set by creator
        uint256 floorPrice;      // Minimum price after auction (= highest bid)
        uint256 salePrice;       // Current direct sale price
        uint256 communityValue;
        uint256 systemValue;
        ArtworkStatus status;
        uint256 tokenId;
        uint256 createdAt;
    }

    struct Auction {
        uint256 artworkId;
        uint256 startTime;
        uint256 endTime;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        address auctionWinner;   // Final winner (set when auction ends)
        uint256 winnerDeadline;  // Deadline for winner to purchase
        bool ended;
        bool winnerPurchased;    // Did winner purchase?
    }

    struct Bid {
        address bidder;
        uint256 amount;      // Full bid amount
        uint256 deposit;     // 10% deposit paid
        bool refunded;       // Has deposit been refunded?
        uint256 timestamp;
    }

    // Storage
    uint256 private _artworkIdCounter;
    mapping(uint256 => Artwork) public artworks;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids; // All bids for an auction
    mapping(bytes32 => bool) public usedFileHashes;
    mapping(address => uint256[]) public creatorArtworks;

    // Events
    event ArtworkUploaded(uint256 indexed artworkId, address indexed creator, string ipfsHash);
    event AuctionCreated(uint256 indexed artworkId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed artworkId, address indexed bidder, uint256 amount, uint256 deposit);
    event AuctionEnded(uint256 indexed artworkId, address winner, uint256 winningBid, uint256 floorPrice);
    event WinnerPurchased(uint256 indexed artworkId, address winner, uint256 tokenId);
    event DirectPurchase(uint256 indexed artworkId, address buyer, uint256 price, uint256 tokenId);
    event ForSale(uint256 indexed artworkId, uint256 price);
    event DepositRefunded(uint256 indexed artworkId, address indexed bidder, uint256 amount);
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
            auctionWinner: address(0),
            currentOwner: address(0),
            ipfsHash: ipfsHash,
            metadataURI: metadataURI,
            fileHash: fileHash,
            creatorValue: creatorValue,
            floorPrice: 0,
            salePrice: 0,
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
            artwork.status == ArtworkStatus.FOR_SALE,
            "Invalid status"
        );
        require(artwork.auctionWinner == address(0), "Already had auction");

        uint256 endTime = block.timestamp + AUCTION_DURATION;

        auctions[artworkId] = Auction({
            artworkId: artworkId,
            startTime: block.timestamp,
            endTime: endTime,
            startingPrice: artwork.creatorValue,
            highestBid: 0,
            highestBidder: address(0),
            auctionWinner: address(0),
            winnerDeadline: 0,
            ended: false,
            winnerPurchased: false
        });

        artwork.status = ArtworkStatus.AUCTION;

        emit AuctionCreated(artworkId, artwork.creatorValue, endTime);
    }

    /**
     * @dev Place bid on auction with 10% deposit
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

        // Calculate required deposit (10% of bid)
        uint256 requiredDeposit = (minBid * DEPOSIT_BPS) / 10000;
        require(msg.value >= requiredDeposit, "Insufficient deposit");

        // Refund previous highest bidder's deposit
        if (auction.highestBidder != address(0)) {
            // Find previous bidder's deposit
            Bid[] storage bids = auctionBids[artworkId];
            for (uint i = bids.length; i > 0; i--) {
                if (bids[i-1].bidder == auction.highestBidder && !bids[i-1].refunded) {
                    bids[i-1].refunded = true;
                    (bool success, ) = auction.highestBidder.call{value: bids[i-1].deposit}("");
                    require(success, "Refund failed");
                    emit DepositRefunded(artworkId, auction.highestBidder, bids[i-1].deposit);
                    break;
                }
            }
        }

        // Record new bid
        auctionBids[artworkId].push(Bid({
            bidder: msg.sender,
            amount: minBid,
            deposit: msg.value,
            refunded: false,
            timestamp: block.timestamp
        }));

        auction.highestBid = minBid;
        auction.highestBidder = msg.sender;

        emit BidPlaced(artworkId, msg.sender, minBid, msg.value);
    }

    /**
     * @dev End auction - sets floor price and gives winner 24h to purchase
     */
    function endAuction(uint256 artworkId) external nonReentrant {
        Auction storage auction = auctions[artworkId];
        Artwork storage artwork = artworks[artworkId];

        require(artwork.status == ArtworkStatus.AUCTION, "Not on auction");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.ended, "Already ended");

        auction.ended = true;

        if (auction.highestBidder == address(0)) {
            // No bids - return to DRAFT
            artwork.status = ArtworkStatus.DRAFT;
            emit AuctionEnded(artworkId, address(0), 0, 0);
        } else {
            // Set winner and floor price
            auction.auctionWinner = auction.highestBidder;
            auction.winnerDeadline = block.timestamp + WINNER_PURCHASE_WINDOW;

            artwork.auctionWinner = auction.highestBidder;
            artwork.floorPrice = auction.highestBid;
            artwork.status = ArtworkStatus.AUCTION_ENDED;

            emit AuctionEnded(artworkId, auction.highestBidder, auction.highestBid, auction.highestBid);
        }
    }

    /**
     * @dev Winner purchases artwork within 24h window
     */
    function purchaseByWinner(uint256 artworkId) external payable nonReentrant {
        Auction storage auction = auctions[artworkId];
        Artwork storage artwork = artworks[artworkId];

        require(artwork.status == ArtworkStatus.AUCTION_ENDED, "Not in purchase window");
        require(msg.sender == auction.auctionWinner, "Not the winner");
        require(block.timestamp <= auction.winnerDeadline, "Purchase window expired");
        require(!auction.winnerPurchased, "Already purchased");

        // Calculate remaining payment (bid - deposit)
        Bid[] storage bids = auctionBids[artworkId];
        uint256 depositPaid = 0;
        for (uint i = bids.length; i > 0; i--) {
            if (bids[i-1].bidder == msg.sender && !bids[i-1].refunded) {
                depositPaid = bids[i-1].deposit;
                bids[i-1].refunded = true; // Mark as used
                break;
            }
        }

        uint256 remainingPayment = auction.highestBid - depositPaid;
        require(msg.value >= remainingPayment, "Insufficient payment");

        // Mint NFT to winner
        uint256 tokenId = nftContract.mintNFT(
            artwork.creator,
            msg.sender,
            artwork.metadataURI,
            royaltyFeeBps
        );

        artwork.tokenId = tokenId;
        artwork.currentOwner = msg.sender;
        artwork.status = ArtworkStatus.SOLD;
        auction.winnerPurchased = true;

        // Distribute funds
        uint256 totalPayment = auction.highestBid;
        uint256 platformFee = (totalPayment * platformFeeBps) / 10000;
        uint256 creatorAmount = totalPayment - platformFee;

        (bool success, ) = artwork.creator.call{value: creatorAmount}("");
        require(success, "Creator payment failed");

        // Refund excess payment
        if (msg.value > remainingPayment) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - remainingPayment}("");
            require(refundSuccess, "Refund failed");
        }

        emit WinnerPurchased(artworkId, msg.sender, tokenId);
    }

    /**
     * @dev Set artwork for direct sale after auction
     */
    function setForSale(uint256 artworkId, uint256 price) external {
        Artwork storage artwork = artworks[artworkId];
        require(artwork.creator == msg.sender, "Not the creator");
        require(
            artwork.status == ArtworkStatus.AUCTION_ENDED ||
            artwork.status == ArtworkStatus.FOR_SALE,
            "Invalid status"
        );
        require(price >= artwork.floorPrice, "Price below floor");

        artwork.salePrice = price;
        artwork.status = ArtworkStatus.FOR_SALE;

        emit ForSale(artworkId, price);
    }

    /**
     * @dev Purchase artwork directly (after auction or if set for sale)
     */
    function purchaseDirectly(uint256 artworkId) external payable nonReentrant {
        Artwork storage artwork = artworks[artworkId];

        require(artwork.status == ArtworkStatus.FOR_SALE, "Not for sale");
        require(msg.value >= artwork.salePrice, "Insufficient payment");

        // Mint NFT to buyer
        uint256 tokenId = nftContract.mintNFT(
            artwork.creator,
            msg.sender,
            artwork.metadataURI,
            royaltyFeeBps
        );

        artwork.tokenId = tokenId;
        artwork.currentOwner = msg.sender;
        artwork.status = ArtworkStatus.SOLD;

        // Distribute funds
        uint256 platformFee = (artwork.salePrice * platformFeeBps) / 10000;
        uint256 creatorAmount = artwork.salePrice - platformFee;

        (bool success, ) = artwork.creator.call{value: creatorAmount}("");
        require(success, "Creator payment failed");

        // Refund excess payment
        if (msg.value > artwork.salePrice) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - artwork.salePrice}("");
            require(refundSuccess, "Refund failed");
        }

        emit DirectPurchase(artworkId, msg.sender, artwork.salePrice, tokenId);
    }

    /**
     * @dev Refund all deposits after auction ends (callable by anyone)
     */
    function refundAllDeposits(uint256 artworkId) external nonReentrant {
        Auction storage auction = auctions[artworkId];
        require(auction.ended, "Auction not ended");

        Bid[] storage bids = auctionBids[artworkId];
        for (uint i = 0; i < bids.length; i++) {
            if (!bids[i].refunded && bids[i].bidder != auction.auctionWinner) {
                bids[i].refunded = true;
                (bool success, ) = bids[i].bidder.call{value: bids[i].deposit}("");
                require(success, "Refund failed");
                emit DepositRefunded(artworkId, bids[i].bidder, bids[i].deposit);
            }
        }
    }

    /**
     * @dev Get all bids for an auction
     */
    function getAuctionBids(uint256 artworkId) external view returns (Bid[] memory) {
        return auctionBids[artworkId];
    }

    /**
     * @dev Delete artwork (only DRAFT)
     */
    function deleteArtwork(uint256 artworkId) external {
        Artwork storage artwork = artworks[artworkId];
        require(artwork.creator == msg.sender, "Not the creator");
        require(artwork.status == ArtworkStatus.DRAFT, "Cannot delete");

        usedFileHashes[artwork.fileHash] = false;
        artwork.status = ArtworkStatus.UNLISTED;

        emit ArtworkDeleted(artworkId);
    }

    /**
     * @dev Relist artwork with new price (only DRAFT)
     */
    function relistArtwork(uint256 artworkId, uint256 newPrice) external {
        Artwork storage artwork = artworks[artworkId];
        require(artwork.creator == msg.sender, "Not the creator");
        require(artwork.status == ArtworkStatus.DRAFT, "Not draft");
        require(newPrice > 0, "Invalid price");

        artwork.creatorValue = newPrice;

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
