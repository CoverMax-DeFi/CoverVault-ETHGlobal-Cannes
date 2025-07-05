import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Cross-Chain Risk Token Functionality...");
  
  const [deployer, user] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`Testing on ${network.name} (Chain ID: ${network.chainId})`);
  
  // You'll need to update these addresses after deployment
  const SENIOR_TOKEN_ADDRESS = "0x..."; // Replace with actual deployed address
  const JUNIOR_TOKEN_ADDRESS = "0x..."; // Replace with actual deployed address
  
  if (SENIOR_TOKEN_ADDRESS === "0x..." || JUNIOR_TOKEN_ADDRESS === "0x...") {
    console.log("❌ Please update the token addresses in this script after deployment");
    return;
  }
  
  // Connect to deployed contracts
  const seniorToken = await ethers.getContractAt("SimpleOFTRiskToken", SENIOR_TOKEN_ADDRESS);
  const juniorToken = await ethers.getContractAt("SimpleOFTRiskToken", JUNIOR_TOKEN_ADDRESS);
  
  console.log(`📝 Senior Token: ${await seniorToken.getAddress()}`);
  console.log(`📝 Junior Token: ${await juniorToken.getAddress()}`);
  
  // Test basic functionality
  console.log("\n🔍 Testing Basic Token Functionality...");
  
  // Check token details
  const seniorName = await seniorToken.name();
  const seniorSymbol = await seniorToken.symbol();
  const seniorDecimals = await seniorToken.decimals();
  
  console.log(`Senior Token: ${seniorName} (${seniorSymbol}) - ${seniorDecimals} decimals`);
  
  // Test minting (as vault)
  console.log("\n💰 Testing Vault Minting...");
  const mintAmount = ethers.parseEther("100");
  
  try {
    await seniorToken.vaultMint(user.address, mintAmount);
    console.log(`✅ Minted ${ethers.formatEther(mintAmount)} CV-SENIOR to ${user.address}`);
    
    const balance = await seniorToken.balanceOf(user.address);
    console.log(`💼 User balance: ${ethers.formatEther(balance)} CV-SENIOR`);
  } catch (error) {
    console.log(`❌ Minting failed: ${error}`);
  }
  
  // Test cross-chain transfer preparation
  console.log("\n🌉 Testing Cross-Chain Transfer Setup...");
  
  // Example: Quote a cross-chain transfer fee
  try {
    const dstEid = network.chainId.toString() === "421614" ? 40245 : 40231; // Switch between Arbitrum and Base
    const toAddress = ethers.zeroPadValue(user.address, 32);
    const amountLD = ethers.parseEther("10");
    const minAmountLD = ethers.parseEther("9.9");
    
    const sendParam = {
      dstEid,
      to: toAddress,
      amountLD,
      minAmountLD,
      extraOptions: "0x",
      composeMsg: "0x",
      oftCmd: "0x",
    };
    
    // This will work once LayerZero is properly configured
    // const [nativeFee] = await seniorToken.quoteSend(sendParam, false);
    // console.log(`💸 Cross-chain transfer fee: ${ethers.formatEther(nativeFee)} ETH`);
    
    console.log("📋 Cross-chain transfer parameters prepared:");
    console.log(`   Destination EID: ${dstEid}`);
    console.log(`   Amount: ${ethers.formatEther(amountLD)} CV-SENIOR`);
    console.log(`   Min Amount: ${ethers.formatEther(minAmountLD)} CV-SENIOR`);
    
  } catch (error) {
    console.log("ℹ️ Cross-chain functionality requires proper LayerZero wiring");
  }
  
  console.log("\n✅ Basic testing completed!");
  console.log("\n📋 Next Steps for Full Cross-Chain Testing:");
  console.log("1. Deploy to both Arbitrum Sepolia and Base Sepolia");
  console.log("2. Wire the contracts using LayerZero CLI");
  console.log("3. Test actual cross-chain transfers");
  console.log("4. Verify tokens appear on destination chain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });