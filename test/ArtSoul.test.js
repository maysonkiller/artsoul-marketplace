import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("ArtSoul Contracts", function () {
  let nft, marketplace;
  let owner, creator, buyer, buyer2;
  let artworkId;

  beforeEach(async function () {
    [owner, creator, buyer, buyer2] = await ethers.getSigners();

    // Deploy NFT
    const ArtSoulNFT = await ethers.getContractFactory("ArtSoulNFT");
    nft = await ArtSoulNFT.deploy();
    await nft.waitForDeployment();

    // Deploy Marketplace
    const ArtSoulMarketplace = await ethers.getContractFactory("ArtSoulMarketplace");
    marketplace = await ArtSoulMarketplace.deploy(await nft.getAddress());
    await marketplace.waitForDeployment();

    // Connect contracts
    await nft.setMarketplace(await marketplace.getAddress());
  });

  describe("Upload Artwork", function () {
    it("Should upload artwork successfully", async function () {
      const tx = await marketplace.connect(creator).uploadArtwork(
        "QmTest123",
        "ipfs://QmTest123/metadata.json",
        ethers.keccak256(ethers.toUtf8Bytes("test-file")),
        ethers.parseEther("1.0")
      );

      await expect(tx)
        .to.emit(marketplace, "ArtworkUploaded")
        .withArgs(1, creator.address, "QmTest123");

      const artwork = await marketplace.artworks(1);
      expect(artwork.creator).to.equal(creator.address);
      expect(artwork.creatorValue).to.equal(ethers.parseEther("1.0"));
      expect(artwork.status).to.equal(0); // DRAFT
    });

    it("Should reject duplicate artwork", async function () {
      const fileHash = ethers.keccak256(ethers.toUtf8Bytes("test-file"));

      await marketplace.connect(creator).uploadArtwork(
        "QmTest123",
        "ipfs://QmTest123/metadata.json",
        fileHash,
        ethers.parseEther("1.0")
      );

      await expect(
        marketplace.connect(creator).uploadArtwork(
          "QmTest456",
          "ipfs://QmTest456/metadata.json",
          fileHash,
          ethers.parseEther("2.0")
        )
      ).to.be.revertedWith("Duplicate artwork detected");
    });
  });

  describe("Auction", function () {
    beforeEach(async function () {
      const tx = await marketplace.connect(creator).uploadArtwork(
        "QmTest123",
        "ipfs://QmTest123/metadata.json",
        ethers.keccak256(ethers.toUtf8Bytes("test-file")),
        ethers.parseEther("1.0")
      );
      await tx.wait();
      artworkId = 1;
    });

    it("Should create auction", async function () {
      const tx = await marketplace.connect(creator).createAuction(artworkId);

      await expect(tx).to.emit(marketplace, "AuctionCreated");

      const artwork = await marketplace.artworks(artworkId);
      expect(artwork.status).to.equal(1); // AUCTION

      const auction = await marketplace.auctions(artworkId);
      expect(auction.startingPrice).to.equal(ethers.parseEther("1.0"));
    });

    it("Should accept valid bid", async function () {
      await marketplace.connect(creator).createAuction(artworkId);

      const bidAmount = ethers.parseEther("1.5");
      const tx = await marketplace.connect(buyer).placeBid(artworkId, { value: bidAmount });

      await expect(tx)
        .to.emit(marketplace, "BidPlaced")
        .withArgs(artworkId, buyer.address, bidAmount);

      const auction = await marketplace.auctions(artworkId);
      expect(auction.highestBid).to.equal(bidAmount);
      expect(auction.highestBidder).to.equal(buyer.address);
    });

    it("Should reject low bid", async function () {
      await marketplace.connect(creator).createAuction(artworkId);

      await expect(
        marketplace.connect(buyer).placeBid(artworkId, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Bid too low");
    });

    it("Should refund previous bidder", async function () {
      await marketplace.connect(creator).createAuction(artworkId);

      // First bid
      await marketplace.connect(buyer).placeBid(artworkId, { value: ethers.parseEther("1.5") });

      const balanceBefore = await ethers.provider.getBalance(buyer.address);

      // Second bid (should refund first)
      await marketplace.connect(buyer2).placeBid(artworkId, { value: ethers.parseEther("2.0") });

      const balanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1.5"));
    });

    it("Should end auction and mint NFT", async function () {
      await marketplace.connect(creator).createAuction(artworkId);
      await marketplace.connect(buyer).placeBid(artworkId, { value: ethers.parseEther("1.5") });

      // Fast forward 3 days
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const tx = await marketplace.endAuction(artworkId);
      await expect(tx).to.emit(marketplace, "AuctionEnded");

      const artwork = await marketplace.artworks(artworkId);
      expect(artwork.status).to.equal(3); // SOLD
      expect(artwork.tokenId).to.equal(1);

      // Check NFT ownership
      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should handle failed auction", async function () {
      await marketplace.connect(creator).createAuction(artworkId);

      // Fast forward 3 days without bids
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await marketplace.endAuction(artworkId);

      const artwork = await marketplace.artworks(artworkId);
      expect(artwork.status).to.equal(2); // AUCTION_FAILED
    });
  });

  describe("Delete Artwork", function () {
    it("Should delete DRAFT artwork", async function () {
      await marketplace.connect(creator).uploadArtwork(
        "QmTest123",
        "ipfs://QmTest123/metadata.json",
        ethers.keccak256(ethers.toUtf8Bytes("test-file")),
        ethers.parseEther("1.0")
      );

      const tx = await marketplace.connect(creator).deleteArtwork(1);
      await expect(tx).to.emit(marketplace, "ArtworkDeleted").withArgs(1);

      const artwork = await marketplace.artworks(1);
      expect(artwork.status).to.equal(4); // UNLISTED
    });

    it("Should not delete sold artwork", async function () {
      await marketplace.connect(creator).uploadArtwork(
        "QmTest123",
        "ipfs://QmTest123/metadata.json",
        ethers.keccak256(ethers.toUtf8Bytes("test-file")),
        ethers.parseEther("1.0")
      );

      await marketplace.connect(creator).createAuction(1);
      await marketplace.connect(buyer).placeBid(1, { value: ethers.parseEther("1.5") });

      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await marketplace.endAuction(1);

      await expect(
        marketplace.connect(creator).deleteArtwork(1)
      ).to.be.revertedWith("Cannot delete");
    });
  });
});
