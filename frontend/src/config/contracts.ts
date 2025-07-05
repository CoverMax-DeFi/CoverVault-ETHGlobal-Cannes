// Auto-generated from Ignition deployment artifacts
// DO NOT EDIT MANUALLY - Run 'npm run generate-config' to regenerate

export const CONTRACT_ADDRESSES = {
  "RiskVault": "0xF19Cfc60402Ca5a8C094457C501de35C942FD7bc",
  "MockAUSDC": "0x0129EC084E8c1407743cca597B7B6d53F5b536F1",
  "MockCUSDT": "0xb3eafbfB843FEa89830087AE363490DfaB936a80",
  "SeniorToken": "0x991BF3b03E81e47696591896993FC49eaD61a028",
  "JuniorToken": "0xF006528e07C9f25bc44915cc59E599D3be820ec9",
  "UniswapV2Factory": "0x903B1A9aB057b279f6da772522d0e508E2D40a71",
  "UniswapV2Router02": "0x0ad1167FaEAE7e0E64d3C050fa85e0a0ff53A19f",
  "WETH": "0xc84F608805B533Fcda1651422d9253DCD054FcCa",
  "SeniorJuniorPair": "0x0b14441E9A6AF54632f42d0fb9227ce13850A282"
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
  deployedAt: 1751731602070,
  deploymentBlock: "Latest", // Could be extracted from deployment artifacts
} as const;
