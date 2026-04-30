// Deploy script for ArtSoulMarketplaceV2
// Run: npx hardhat run scripts/deploy-v2.js --network baseSepolia

import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying ArtSoul Marketplace V2...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy NFT contract first (if not already deployed)
  console.log("\n📦 Deploying ArtSoulNFT...");
  const ArtSoulNFT = await hre.ethers.getContractFactory("ArtSoulNFT");
  const nft = await ArtSoulNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ ArtSoulNFT deployed to:", nftAddress);

  // Deploy Marketplace V2
  console.log("\n📦 Deploying ArtSoulMarketplaceV2...");
  const ArtSoulMarketplaceV2 = await hre.ethers.getContractFactory("ArtSoulMarketplaceV2");
  const marketplace = await ArtSoulMarketplaceV2.deploy(nftAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ ArtSoulMarketplaceV2 deployed to:", marketplaceAddress);

  // Set marketplace address in NFT contract
  console.log("\n🔗 Setting marketplace address in NFT contract...");
  const tx = await nft.setMarketplace(marketplaceAddress);
  await tx.wait();
  console.log("✅ Marketplace address set in NFT contract");

  // Verify platform fee
  const platformFee = await marketplace.platformFeeBps();
  console.log("\n📊 Platform fee:", Number(platformFee) / 100, "%");

  // Verify royalty fee
  const royaltyFee = await marketplace.royaltyFeeBps();
  console.log("📊 Royalty fee:", Number(royaltyFee) / 100, "%");

  // Verify auction duration
  const auctionDuration = await marketplace.AUCTION_DURATION();
  console.log("📊 Auction duration:", Number(auctionDuration) / 86400, "days");

  // Verify winner purchase window
  const winnerWindow = await marketplace.WINNER_PURCHASE_WINDOW();
  console.log("📊 Winner purchase window:", Number(winnerWindow) / 3600, "hours");

  // Verify deposit percentage
  const depositBps = await marketplace.DEPOSIT_BPS();
  console.log("📊 Deposit percentage:", Number(depositBps) / 100, "%");

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("NFT:", nftAddress);
  console.log("Marketplace V2:", marketplaceAddress);

  console.log("\n⚠️ IMPORTANT: Update contracts-integration.js with these addresses!");
  console.log("\n🔍 Verify contracts on Etherscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${nftAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${marketplaceAddress} ${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
