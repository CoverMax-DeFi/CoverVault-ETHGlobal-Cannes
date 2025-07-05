// Minimal ABIs for contract interaction

export const RISK_VAULT_ABI = [
  // Events
  "event AssetDeposited(address indexed depositor, address indexed asset, uint256 amount, uint256 tokensIssued)",
  "event TokensWithdrawn(address indexed withdrawer, uint256 seniorAmount, uint256 juniorAmount, uint256 aUSDCAmount, uint256 cUSDTAmount)",
  "event EmergencyWithdrawal(address indexed withdrawer, uint256 seniorAmount, address preferredAsset, uint256 amount)",
  "event EmergencyModeToggled(bool emergencyMode)",
  "event PhaseTransitioned(uint8 indexed fromPhase, uint8 indexed toPhase, uint256 timestamp)",
  "event CycleStarted(uint256 indexed cycleNumber, uint256 startTime)",

  // View functions
  "function seniorToken() view returns (address)",
  "function juniorToken() view returns (address)",
  "function aUSDC() view returns (address)",
  "function cUSDT() view returns (address)",
  "function currentPhase() view returns (uint8)",
  "function phaseStartTime() view returns (uint256)",
  "function cycleStartTime() view returns (uint256)",
  "function emergencyMode() view returns (bool)",
  "function aUSDCBalance() view returns (uint256)",
  "function cUSDTBalance() view returns (uint256)",
  "function totalTokensIssued() view returns (uint256)",
  "function getUserTokenBalances(address user) view returns (uint256 seniorBalance, uint256 juniorBalance)",
  "function calculateWithdrawalAmounts(uint256 seniorAmount, uint256 juniorAmount) view returns (uint256 aUSDCAmount, uint256 cUSDTAmount)",
  "function getTotalValueLocked() view returns (uint256)",
  "function getVaultBalances() view returns (uint256 aUSDCVaultBalance, uint256 cUSDTVaultBalance)",
  "function isAssetSupported(address asset) view returns (bool)",
  "function getProtocolStatus() view returns (bool emergency, uint256 totalTokens, uint8 phase, uint256 phaseEndTime)",
  "function getPhaseInfo() view returns (uint8 phase, uint256 phaseStart, uint256 cycleStart, uint256 timeRemaining)",

  // Write functions
  "function depositAsset(address asset, uint256 depositAmount)",
  "function withdrawSeniorTokens(uint256 seniorAmount)",
  "function withdraw(uint256 seniorAmount, uint256 juniorAmount)",
  "function emergencyWithdraw(uint256 seniorAmount, address preferredAsset)",
  "function withdrawAll()",
  
  // Admin functions
  "function toggleEmergencyMode()",
  "function forcePhaseTransition()",
  "function startNewCycle()",
] as const;

export const RISK_TOKEN_ABI = [
  // ERC20 standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

export const ERC20_ABI = [
  // Standard ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;