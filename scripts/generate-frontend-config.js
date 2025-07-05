#!/usr/bin/env node

/**
 * Generates frontend configuration from Hardhat Ignition deployment artifacts
 * This creates a single source of truth for contract addresses and ABIs
 */

const fs = require('fs');
const path = require('path');

const NETWORK_ID = '545'; // Flow testnet
const DEPLOYMENT_DIR = path.join(__dirname, '..', 'ignition', 'deployments', `chain-${NETWORK_ID}`);
const FRONTEND_CONFIG_DIR = path.join(__dirname, '..', 'frontend', 'src', 'config');

function main() {
  try {
    console.log('🔄 Generating frontend config from Ignition deployments...');
    
    // Read deployed addresses
    const addressesPath = path.join(DEPLOYMENT_DIR, 'deployed_addresses.json');
    if (!fs.existsSync(addressesPath)) {
      throw new Error(`Deployment file not found: ${addressesPath}`);
    }
    
    const deployedAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    console.log('✅ Loaded deployed addresses');
    
    // Extract addresses with cleaner names
    const contracts = {
      // Core Contracts
      RiskVault: deployedAddresses['RiskTokenModule#RiskVault'],
      MockAUSDC: deployedAddresses['RiskTokenModule#MockAUSDC'],
      MockCUSDT: deployedAddresses['RiskTokenModule#MockCUSDT'],
      
      // Risk Tokens
      SeniorToken: deployedAddresses['RiskTokenModule#seniorTokenContract'],
      JuniorToken: deployedAddresses['RiskTokenModule#juniorTokenContract'],
      
      // Uniswap Contracts
      UniswapV2Factory: deployedAddresses['RiskTokenModule#UniswapV2Factory'],
      UniswapV2Router02: deployedAddresses['RiskTokenModule#UniswapV2Router02'],
      WETH: deployedAddresses['RiskTokenModule#WETH'],
      
      // Liquidity Pool
      SeniorJuniorPair: deployedAddresses['RiskTokenModule#UniswapV2Pair'],
    };
    
    // Read ABIs from artifacts
    const abis = {};
    const artifactMappings = {
      RiskVault: 'RiskTokenModule#RiskVault.json',
      MockToken: 'RiskTokenModule#MockAUSDC.json', // ERC20 ABI
      RiskToken: 'RiskTokenModule#seniorTokenContract.json',
      UniswapV2Router: 'RiskTokenModule#UniswapV2Router02.json',
      UniswapV2Pair: 'RiskTokenModule#UniswapV2Pair.json',
      UniswapV2Factory: 'RiskTokenModule#UniswapV2Factory.json',
    };
    
    for (const [name, fileName] of Object.entries(artifactMappings)) {
      const artifactPath = path.join(DEPLOYMENT_DIR, 'artifacts', fileName);
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        abis[name] = artifact.abi;
        console.log(`✅ Loaded ${name} ABI`);
      } else {
        console.warn(`⚠️  Artifact not found: ${fileName}`);
      }
    }
    
    // Generate contracts config
    const contractsConfig = `// Auto-generated from Ignition deployment artifacts
// DO NOT EDIT MANUALLY - Run 'npm run generate-config' to regenerate

export const CONTRACT_ADDRESSES = ${JSON.stringify(contracts, null, 2)} as const;

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: ${NETWORK_ID}, // Flow testnet
  chainName: "Flow Testnet",
  nativeCurrency: {
    name: "FLOW",
    symbol: "FLOW",
    decimals: 18,
  },
  rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
  blockExplorerUrls: ["https://evm-testnet.flowscan.io"],
} as const;

// Phase enum matching the smart contract
export enum Phase {
  DEPOSIT = 0,
  COVERAGE = 1,
  CLAIMS = 2,
  FINAL_CLAIMS = 3,
}

export const PHASE_NAMES = {
  [Phase.DEPOSIT]: "Deposit Period",
  [Phase.COVERAGE]: "Coverage Period", 
  [Phase.CLAIMS]: "Claims Period",
  [Phase.FINAL_CLAIMS]: "Final Claims Period",
} as const;

// Phase durations in seconds (matching smart contract)
export const PHASE_DURATIONS = {
  [Phase.DEPOSIT]: 2 * 24 * 60 * 60, // 2 days
  [Phase.COVERAGE]: 3 * 24 * 60 * 60, // 3 days
  [Phase.CLAIMS]: 1 * 24 * 60 * 60, // 1 day
  [Phase.FINAL_CLAIMS]: 1 * 24 * 60 * 60, // 1 day
} as const;

// Deployment info
export const DEPLOYMENT_INFO = {
  network: "Flow Testnet",
  chainId: ${NETWORK_ID},
  deployedAt: ${Date.now()},
  deploymentBlock: "Latest", // Could be extracted from deployment artifacts
} as const;
`;
    
    // Generate ABIs config
    const abisConfig = `// Auto-generated from Ignition deployment artifacts
// DO NOT EDIT MANUALLY - Run 'npm run generate-config' to regenerate

export const RISK_VAULT_ABI = ${JSON.stringify(abis.RiskVault || [], null, 2)} as const;

export const ERC20_ABI = ${JSON.stringify(abis.MockToken || [], null, 2)} as const;

export const RISK_TOKEN_ABI = ${JSON.stringify(abis.RiskToken || [], null, 2)} as const;

export const UNISWAP_V2_ROUTER_ABI = ${JSON.stringify(abis.UniswapV2Router || [], null, 2)} as const;

export const UNISWAP_V2_PAIR_ABI = ${JSON.stringify(abis.UniswapV2Pair || [], null, 2)} as const;

export const UNISWAP_V2_FACTORY_ABI = ${JSON.stringify(abis.UniswapV2Factory || [], null, 2)} as const;
`;
    
    // Write files
    fs.writeFileSync(path.join(FRONTEND_CONFIG_DIR, 'contracts.ts'), contractsConfig);
    fs.writeFileSync(path.join(FRONTEND_CONFIG_DIR, 'abis.ts'), abisConfig);
    
    console.log('✅ Generated frontend/src/config/contracts.ts');
    console.log('✅ Generated frontend/src/config/abis.ts');
    console.log('🎉 Frontend configuration successfully generated!');
    
    // Show summary
    console.log('\n📋 Deployment Summary:');
    console.log(`Network: Flow Testnet (${NETWORK_ID})`);
    console.log(`Contracts deployed: ${Object.keys(contracts).length}`);
    console.log(`ABIs extracted: ${Object.keys(abis).length}`);
    console.log('\n🔗 Key Addresses:');
    console.log(`RiskVault: ${contracts.RiskVault}`);
    console.log(`Senior/Junior Pair: ${contracts.SeniorJuniorPair}`);
    console.log(`UniswapV2Router: ${contracts.UniswapV2Router02}`);
    
  } catch (error) {
    console.error('❌ Error generating frontend config:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };