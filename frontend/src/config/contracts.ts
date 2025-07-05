// Contract addresses from deployment
export const CONTRACT_ADDRESSES = {
  RiskVault: "0x068eB40356CB922dF8BB19EaFeaf6CDBd9904F6E",
  MockAUSDC: "0x8C1ce7Ba1F0D090630f42142483C0C12CA1f9DAA",
  MockCUSDT: "0x6168E7cee0BEbbC084b903B557575E75D23c25bf",
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