// Auto-generated from Ignition deployment artifacts
// DO NOT EDIT MANUALLY - Run 'npm run generate-config' to regenerate

export const CONTRACT_ADDRESSES = {
  "RiskVault": "0x799DaD27F8038517c1031fCB05dFEdde4721409F",
  "MockAUSDC": "0x6867ac2479216A57A6bf5B14d2F8Cd292bA47656",
  "MockCUSDT": "0xA4d800C936C869C3c06D03bd9ff65C5040beDd5D",
  "SeniorToken": "0x362514449ccB9cbb587FC1781095ED0F9708C63D",
  "JuniorToken": "0x7aC402C221e5E69d4c5905DfF00bFA0384fe94Df",
  "UniswapV2Factory": "0x9797491c8be60d745e9F4f01899BB6622e95ADf2",
  "UniswapV2Router02": "0xc9b58ea574770483605328af4CD2e1339c7c4bAd",
  "WETH": "0x88a6B75bf7376De9FF3E602f8FF0C160b89D8a3A",
  "SeniorJuniorPair": "0xAF7aae48ACdD2065f00c2f056f1847EAA9f99D35"
} as const;

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: 545, // Flow testnet
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
  chainId: 545,
  deployedAt: 1751703509308,
  deploymentBlock: "Latest", // Could be extracted from deployment artifacts
} as const;
