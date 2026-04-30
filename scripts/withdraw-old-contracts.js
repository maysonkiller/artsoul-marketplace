// Script to withdraw funds from old marketplace contracts
// Run: npx hardhat run scripts/withdraw-old-contracts.js --network baseSepolia

import hre from "hardhat";

// Old contract addresses
const OLD_CONTRACTS = {
    baseSepolia: {
        marketplace: '0xA927574ECdCc81349C112Cc49C2f71ab707a537E'
    },
    sepolia: {
        marketplace: '0xA927574ECdCc81349C112Cc49C2f71ab707a537E'
    }
};

// Recipient address
const RECIPIENT = '0x6EC8C121043357aC231E36D403EdAbf90AE6989B';

// Minimal ABI for withdrawFees function
const MARKETPLACE_ABI = [
    "function withdrawFees() external",
    "function owner() view returns (address)"
];

async function main() {
    console.log('💰 Withdrawing funds from old marketplace contracts...\n');

    const [deployer] = await hre.ethers.getSigners();
    console.log('📝 Using account:', deployer.address);

    const network = hre.network.name;
    const marketplaceAddress = OLD_CONTRACTS[network]?.marketplace;

    if (!marketplaceAddress) {
        console.error('❌ No old contract address for network:', network);
        return;
    }

    console.log('📍 Old Marketplace:', marketplaceAddress);
    console.log('📍 Recipient:', RECIPIENT);

    // Connect to old marketplace
    const marketplace = await hre.ethers.getContractAt(
        MARKETPLACE_ABI,
        marketplaceAddress
    );

    // Check if deployer is owner
    try {
        const owner = await marketplace.owner();
        console.log('👤 Contract owner:', owner);

        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.error('❌ You are not the owner of this contract!');
            console.error('   Owner:', owner);
            console.error('   Your address:', deployer.address);
            return;
        }
    } catch (error) {
        console.error('❌ Failed to check owner:', error.message);
        return;
    }

    // Check contract balance
    const balance = await hre.ethers.provider.getBalance(marketplaceAddress);
    console.log('💰 Contract balance:', hre.ethers.formatEther(balance), 'ETH');

    if (balance === 0n) {
        console.log('ℹ️  No funds to withdraw');
        return;
    }

    // Withdraw funds
    console.log('\n🔄 Withdrawing funds...');
    try {
        const tx = await marketplace.withdrawFees();
        console.log('⏳ Transaction sent:', tx.hash);

        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed!');
        console.log('   Block:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed.toString());

        // Check new balance
        const newBalance = await hre.ethers.provider.getBalance(marketplaceAddress);
        console.log('💰 New contract balance:', hre.ethers.formatEther(newBalance), 'ETH');

        // Check deployer balance
        const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
        console.log('💰 Your balance:', hre.ethers.formatEther(deployerBalance), 'ETH');

        // Now send to recipient if different from deployer
        if (RECIPIENT.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log('\n📤 Sending funds to recipient...');

            // Calculate amount to send (leave some for gas)
            const gasReserve = hre.ethers.parseEther('0.001'); // Reserve 0.001 ETH for gas
            const amountToSend = deployerBalance - gasReserve;

            if (amountToSend <= 0n) {
                console.log('❌ Not enough balance to send (need to reserve gas)');
                return;
            }

            const sendTx = await deployer.sendTransaction({
                to: RECIPIENT,
                value: amountToSend
            });

            console.log('⏳ Transfer sent:', sendTx.hash);
            await sendTx.wait();
            console.log('✅ Transfer confirmed!');
            console.log('💰 Sent:', hre.ethers.formatEther(amountToSend), 'ETH to', RECIPIENT);
        }

    } catch (error) {
        console.error('❌ Withdrawal failed:', error.message);
        if (error.data) {
            console.error('   Error data:', error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
