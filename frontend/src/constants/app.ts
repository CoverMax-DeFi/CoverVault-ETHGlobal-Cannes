// Application Constants
export const CONSTANTS = {
  // Refresh and Update Intervals (in milliseconds)
  REFRESH_INTERVAL: 30000, // 30 seconds
  PRICE_UPDATE_INTERVAL: 5000, // 5 seconds for price updates
  
  // Trading Configuration
  SLIPPAGE_TOLERANCE: 0.05, // 5% slippage tolerance
  MIN_SLIPPAGE: 0.001, // 0.1% minimum slippage
  MAX_SLIPPAGE: 0.15, // 15% maximum slippage
  
  // Transaction Timeouts
  TRANSACTION_DEADLINE_MINUTES: 20, // 20 minutes for Uniswap transactions
  
  // UI Configuration
  DEBOUNCE_DELAY: 500, // 500ms debounce for user inputs
  TOAST_DURATION: 5000, // 5 seconds for toast notifications
  
  // Token Display
  TOKEN_DECIMALS: 18,
  DISPLAY_DECIMALS: 4, // Number of decimals to show in UI
  
  // Phase Durations (in seconds)
  PHASE_DURATIONS: {
    DEPOSIT: 2 * 24 * 60 * 60, // 2 days
    COVERAGE: 3 * 24 * 60 * 60, // 3 days
    CLAIMS: 1 * 24 * 60 * 60, // 1 day
    FINAL_CLAIMS: 1 * 24 * 60 * 60, // 1 day
  },
  
  // Validation Limits
  MIN_DEPOSIT_AMOUNT: 0.01,
  MAX_DEPOSIT_AMOUNT: 1000000,
  MIN_WITHDRAW_AMOUNT: 0.01,
  
  // Color Tokens for Consistency
  COLORS: {
    SENIOR: '#3B82F6', // Blue
    JUNIOR: '#F59E0B', // Amber
    SUCCESS: '#10B981', // Green
    ERROR: '#EF4444', // Red
    WARNING: '#F59E0B', // Amber
  }
} as const;

// Helper functions
export const formatTokenAmount = (amount: bigint, decimals = CONSTANTS.TOKEN_DECIMALS): string => {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(CONSTANTS.DISPLAY_DECIMALS);
};

export const parseTokenAmount = (amount: string, decimals = CONSTANTS.TOKEN_DECIMALS): bigint => {
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
};

export const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};