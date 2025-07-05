// Auto-generated from Ignition deployment artifacts
// DO NOT EDIT MANUALLY - Run 'npm run generate-config' to regenerate

// Supported chain IDs
export enum SupportedChainId {
  FLOW_TESTNET = 545,
  HEDERA_TESTNET = 296,
  MANTLE_TESTNET = 5003,
}

// Contract names enum for type safety
export enum ContractName {
  RISK_VAULT = 'RiskVault',
  SENIOR_TOKEN = 'SeniorToken',
  JUNIOR_TOKEN = 'JuniorToken',
  MOCK_AUSDC = 'MockAUSDC',
  MOCK_CUSDT = 'MockCUSDT',
  UNISWAP_V2_FACTORY = 'UniswapV2Factory',
  UNISWAP_V2_ROUTER = 'UniswapV2Router02',
  WETH = 'WETH',
  SENIOR_JUNIOR_PAIR = 'SeniorJuniorPair',
}

// Multi-chain contract addresses
export const MULTI_CHAIN_ADDRESSES: Record<SupportedChainId, Partial<Record<ContractName, string>>> = {
  [SupportedChainId.FLOW_TESTNET]: {
    [ContractName.RISK_VAULT]: "0xF19Cfc60402Ca5a8C094457C501de35C942FD7bc",
    [ContractName.SENIOR_TOKEN]: "0x991BF3b03E81e47696591896993FC49eaD61a028",
    [ContractName.JUNIOR_TOKEN]: "0xF006528e07C9f25bc44915cc59E599D3be820ec9",
    [ContractName.MOCK_AUSDC]: "0x0129EC084E8c1407743cca597B7B6d53F5b536F1",
    [ContractName.MOCK_CUSDT]: "0xb3eafbfB843FEa89830087AE363490DfaB936a80",
    [ContractName.UNISWAP_V2_FACTORY]: "0x903B1A9aB057b279f6da772522d0e508E2D40a71",
    [ContractName.UNISWAP_V2_ROUTER]: "0x0ad1167FaEAE7e0E64d3C050fa85e0a0ff53A19f",
    [ContractName.WETH]: "0xc84F608805B533Fcda1651422d9253DCD054FcCa",
    [ContractName.SENIOR_JUNIOR_PAIR]: "0x0b14441E9A6AF54632f42d0fb9227ce13850A282",
  },
  [SupportedChainId.HEDERA_TESTNET]: {
    // Contracts will be deployed here
    // [ContractName.RISK_VAULT]: "0x...",
    // Add more contracts as they are deployed
  },
  [SupportedChainId.MANTLE_TESTNET]: {
    // Contracts will be deployed here
    // [ContractName.RISK_VAULT]: "0x...",
    // Add more contracts as they are deployed
  },
};

// Helper function to get contract address for specific chain
export function getContractAddress(chainId: SupportedChainId, contractName: ContractName): string {
  const address = MULTI_CHAIN_ADDRESSES[chainId]?.[contractName];
  if (!address) {
    throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
  }
  return address;
}

// Helper function to get all contract addresses for a specific chain
export function getChainContracts(chainId: SupportedChainId): Record<string, string> {
  const contracts = MULTI_CHAIN_ADDRESSES[chainId];
  if (!contracts || Object.keys(contracts).length === 0) {
    throw new Error(`No contracts deployed on chain ${chainId}`);
  }
  return contracts as Record<string, string>;
}

// Legacy export for backward compatibility (deprecated - use getContractAddress instead)
// @deprecated Use getContractAddress(chainId, contractName) instead
export const CONTRACT_ADDRESSES = MULTI_CHAIN_ADDRESSES[SupportedChainId.FLOW_TESTNET] as Record<string, string>;

// Chain configurations
export const CHAIN_CONFIGS: Record<SupportedChainId, {
  chainId: number;
  chainName: string;
  networkName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  icon: string;
  isTestnet: boolean;
}> = {
  [SupportedChainId.FLOW_TESTNET]: {
    chainId: 545,
    chainName: "Flow Testnet",
    networkName: "flow-testnet",
    nativeCurrency: {
      name: "FLOW",
      symbol: "FLOW",
      decimals: 18,
    },
    rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
    blockExplorerUrls: ["https://evm-testnet.flowscan.io"],
    icon: "🌊",
    isTestnet: true,
  },
  [SupportedChainId.HEDERA_TESTNET]: {
    chainId: 296,
    chainName: "Hedera Testnet",
    networkName: "hedera-testnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
    rpcUrls: ["https://testnet.hashio.io/api"],
    blockExplorerUrls: ["https://hashscan.io/testnet"],
    icon: "ℏ",
    isTestnet: true,
  },
  [SupportedChainId.MANTLE_TESTNET]: {
    chainId: 5003,
    chainName: "Mantle Sepolia",
    networkName: "mantle-testnet",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
    blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
    icon: "🧩",
    isTestnet: true,
  },
};

// Default chain configuration (Flow Testnet)
export const DEFAULT_CHAIN_ID = SupportedChainId.FLOW_TESTNET;
export const CHAIN_CONFIG = CHAIN_CONFIGS[DEFAULT_CHAIN_ID];

// Helper function to get chain config by ID
export function getChainConfig(chainId: number): typeof CHAIN_CONFIGS[SupportedChainId] | null {
  return CHAIN_CONFIGS[chainId as SupportedChainId] || null;
}

// Helper function to check if chain is supported
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return Object.values(SupportedChainId).includes(chainId as SupportedChainId);
}

// Helper function to get contract address safely without throwing
export function getContractAddressSafe(
  chainId: SupportedChainId, 
  contractName: ContractName
): string | null {
  try {
    return getContractAddress(chainId, contractName);
  } catch {
    return null;
  }
}

// Helper function to check if a contract is deployed on a chain
export function isContractDeployed(
  chainId: SupportedChainId, 
  contractName: ContractName
): boolean {
  return getContractAddressSafe(chainId, contractName) !== null;
}

// Helper function to get deployment status for all contracts on a chain
export function getChainDeploymentStatus(chainId: SupportedChainId): Record<ContractName, boolean> {
  const status = {} as Record<ContractName, boolean>;
  
  Object.values(ContractName).forEach(contractName => {
    status[contractName] = isContractDeployed(chainId, contractName);
  });
  
  return status;
}

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
