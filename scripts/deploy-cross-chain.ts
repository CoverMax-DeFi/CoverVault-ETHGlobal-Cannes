import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Cross-Chain Risk Tokens for Hackathon...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`Deploying on ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

  // LayerZero endpoints for testnets
  const endpoints: Record<string, string> = {
    "421614": "0x6EDCE65403992e310A62460808c4b910D972f10f", // Arbitrum Sepolia
    "84532": "0x6EDCE65403992e310A62460808c4b910D972f10f",  // Base Sepolia
    "545": "0x6EDCE65403992e310A62460808c4b910D972f10f",    // Flow Testnet
  };

  const lzEndpoint = endpoints[network.chainId.toString()];
  if (!lzEndpoint) {
    throw new Error(`LayerZero endpoint not found for chain ID: ${network.chainId}`);
  }

  console.log(`Using LayerZero endpoint: ${lzEndpoint}`);

  // Deploy Senior Token
  console.log("\n📝 Deploying Senior Token...");
  const SimpleOFTRiskToken = await ethers.getContractFactory("SimpleOFTRiskToken");
  
  const seniorToken = await SimpleOFTRiskToken.deploy(
    "CoverVault Senior Token",
    "CV-SENIOR",
    lzEndpoint,
    deployer.address, // delegate
    deployer.address  // temporary vault
  );

  await seniorToken.waitForDeployment();
  const seniorTokenAddress = await seniorToken.getAddress();
  console.log(`✅ Senior Token deployed to: ${seniorTokenAddress}`);

  // Deploy Junior Token
  console.log("\n📝 Deploying Junior Token...");
  const juniorToken = await SimpleOFTRiskToken.deploy(
    "CoverVault Junior Token",
    "CV-JUNIOR",
    lzEndpoint,
    deployer.address, // delegate
    deployer.address  // temporary vault
  );

  await juniorToken.waitForDeployment();
  const juniorTokenAddress = await juniorToken.getAddress();
  console.log(`✅ Junior Token deployed to: ${juniorTokenAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    layerZeroEndpoint: lzEndpoint,
    contracts: {
      seniorToken: seniorTokenAddress,
      juniorToken: juniorTokenAddress,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n🎉 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${deploymentInfo.network} (${deploymentInfo.chainId})`);
  console.log(`Senior Token: ${deploymentInfo.contracts.seniorToken}`);
  console.log(`Junior Token: ${deploymentInfo.contracts.juniorToken}`);
  console.log(`LayerZero Endpoint: ${deploymentInfo.layerZeroEndpoint}`);
  console.log("=".repeat(50));

  // Create a simple verification script
  console.log("\n📋 Next Steps:");
  console.log("1. Deploy to the second network (Arbitrum Sepolia or Base Sepolia)");
  console.log("2. Wire the contracts using LayerZero configuration");
  console.log("3. Test cross-chain transfers");
  
  console.log("\n🔗 Verification Commands:");
  console.log(`npx hardhat verify --network ${network.name} ${seniorTokenAddress} "CoverVault Senior Token" "CV-SENIOR" ${lzEndpoint} ${deployer.address} ${deployer.address}`);
  console.log(`npx hardhat verify --network ${network.name} ${juniorTokenAddress} "CoverVault Junior Token" "CV-JUNIOR" ${lzEndpoint} ${deployer.address} ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });