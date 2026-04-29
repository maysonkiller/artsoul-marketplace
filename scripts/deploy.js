import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying ArtSoul contracts...");

  // Deploy NFT contract
  console.log("\n📦 Deploying ArtSoulNFT...");
  const ArtSoulNFT = await hre.ethers.getContractFactory("ArtSoulNFT");
  const nft = await ArtSoulNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ ArtSoulNFT deployed to:", nftAddress);

  // Deploy Marketplace contract
  console.log("\n📦 Deploying ArtSoulMarketplace...");
  const ArtSoulMarketplace = await hre.ethers.getContractFactory("ArtSoulMarketplace");
  const marketplace = await ArtSoulMarketplace.deploy(nftAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ ArtSoulMarketplace deployed to:", marketplaceAddress);

  // Set marketplace address in NFT contract
  console.log("\n🔗 Connecting contracts...");
  const tx = await nft.setMarketplace(marketplaceAddress);
  await tx.wait();
  console.log("✅ Marketplace connected to NFT contract");

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Contract Addresses:");
  console.log("   ArtSoulNFT:", nftAddress);
  console.log("   ArtSoulMarketplace:", marketplaceAddress);
  console.log("\n💾 Save these addresses to your .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
