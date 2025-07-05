import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers, BrowserProvider, Contract, Signer } from 'ethers';
import { toast } from '@/components/ui/sonner';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG, Phase, PHASE_NAMES } from '@/config/contracts';
import {
  RISK_VAULT_ABI,
  RISK_TOKEN_ABI,
  ERC20_ABI,
  UNISWAP_V2_ROUTER_ABI,
  UNISWAP_V2_PAIR_ABI
} from '@/config/abis';

interface TokenBalances {
  seniorTokens: bigint;
  juniorTokens: bigint;
  aUSDC: bigint;
  cUSDT: bigint;
  lpTokens: bigint;
}

interface VaultInfo {
  aUSDCBalance: bigint;
  cUSDTBalance: bigint;
  totalTokensIssued: bigint;
  emergencyMode: boolean;
  currentPhase: Phase;
  phaseStartTime: bigint;
  cycleStartTime: bigint;
  timeRemaining: bigint;
}

interface Web3ContextType {
  // Connection state
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  
  // Contracts
  provider: BrowserProvider | null;
  signer: Signer | null;
  
  // Balances
  balances: TokenBalances;
  
  // Vault info
  vaultInfo: VaultInfo;
  
  // Token addresses
  seniorTokenAddress: string | null;
  juniorTokenAddress: string | null;
  
  // Connection functions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // Contract interactions
  depositAsset: (asset: 'aUSDC' | 'cUSDT', amount: string) => Promise<void>;
  withdraw: (seniorAmount: string, juniorAmount: string) => Promise<void>;
  withdrawSeniorTokens: (amount: string) => Promise<void>;
  withdrawAll: () => Promise<void>;
  emergencyWithdraw: (seniorAmount: string, preferredAsset: 'aUSDC' | 'cUSDT') => Promise<void>;
  
  // Admin functions
  toggleEmergencyMode: () => Promise<void>;
  forcePhaseTransition: () => Promise<void>;
  startNewCycle: () => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  approveToken: (tokenAddress: string, amount: string) => Promise<void>;
  calculateWithdrawalAmounts: (seniorAmount: string, juniorAmount: string) => Promise<{ aUSDC: bigint; cUSDT: bigint }>;
  
  // Uniswap functions
  swapExactTokensForTokens: (
    amountIn: string,
    amountOutMin: string,
    path: string[],
  ) => Promise<void>;
  
  getAmountsOut: (
    amountIn: string,
    path: string[],
  ) => Promise<string>;

  addLiquidity: (
    tokenAAmount: string,
    tokenBAmount: string,
    tokenA: string,
    tokenB: string,
  ) => Promise<void>;

  removeLiquidity: (
    lpTokenAmount: string,
    tokenA: string,
    tokenB: string,
  ) => Promise<void>;

  getPairReserves: (
    pairAddress: string
  ) => Promise<{ reserve0: bigint; reserve1: bigint }>;
}

const Web3Context = createContext<Web3ContextType>({
  isConnected: false,
  address: null,
  chainId: null,
  provider: null,
  signer: null,
  balances: {
    seniorTokens: 0n,
    juniorTokens: 0n,
    aUSDC: 0n,
    cUSDT: 0n,
    lpTokens: 0n,
  },
  vaultInfo: {
    aUSDCBalance: 0n,
    cUSDTBalance: 0n,
    totalTokensIssued: 0n,
    emergencyMode: false,
    currentPhase: Phase.DEPOSIT,
    phaseStartTime: 0n,
    cycleStartTime: 0n,
    timeRemaining: 0n,
  },
  seniorTokenAddress: null,
  juniorTokenAddress: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  depositAsset: async () => {},
  withdraw: async () => {},
  withdrawSeniorTokens: async () => {},
  withdrawAll: async () => {},
  emergencyWithdraw: async () => {},
  toggleEmergencyMode: async () => {},
  forcePhaseTransition: async () => {},
  startNewCycle: async () => {},
  refreshData: async () => {},
  approveToken: async () => {},
  calculateWithdrawalAmounts: async () => ({ aUSDC: 0n, cUSDT: 0n }),
  swapExactTokensForTokens: async () => {},
  getAmountsOut: async () => "0",
  addLiquidity: async () => {},
  getPairReserves: async () => ({ reserve0: 0n, reserve1: 0n }),
});

// Inner provider that uses Privy hooks
const InnerWeb3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { ready, authenticated, user, logout, login } = usePrivy();
  const { wallets } = useWallets();
  
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  
  const [balances, setBalances] = useState<TokenBalances>({
    seniorTokens: 0n,
    juniorTokens: 0n,
    aUSDC: 0n,
    cUSDT: 0n,
    lpTokens: 0n,
  });
  
  const [vaultInfo, setVaultInfo] = useState<VaultInfo>({
    aUSDCBalance: 0n,
    cUSDTBalance: 0n,
    totalTokensIssued: 0n,
    emergencyMode: false,
    currentPhase: Phase.DEPOSIT,
    phaseStartTime: 0n,
    cycleStartTime: 0n,
    timeRemaining: 0n,
  });
  
  const [seniorTokenAddress, setSeniorTokenAddress] = useState<string | null>(null);
  const [juniorTokenAddress, setJuniorTokenAddress] = useState<string | null>(null);

  // Setup provider and signer when wallet connects
  useEffect(() => {
    const setupWeb3 = async () => {
      if (!ready || !authenticated || !wallets.length) {
        setProvider(null);
        setSigner(null);
        setAddress(null);
        setChainId(null);
        return;
      }

      try {
        const wallet = wallets[0];
        if (!wallet.walletClientType || !wallet.address) return;

        // Get the ethereum provider from the wallet
        const ethereumProvider = await wallet.getEthereumProvider();
        if (!ethereumProvider) return;

        const web3Provider = new BrowserProvider(ethereumProvider);
        const network = await web3Provider.getNetwork();
        
        // Check if on correct network
        if (Number(network.chainId) !== CHAIN_CONFIG.chainId) {
          try {
            await wallet.switchChain(CHAIN_CONFIG.chainId);
          } catch (error) {
            console.error('Failed to switch chain:', error);
            toast.error('Please switch to Flow Testnet');
            return;
          }
        }

        const web3Signer = await web3Provider.getSigner();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAddress(wallet.address);
        setChainId(Number(network.chainId));
        
        await loadContractData(web3Provider, web3Signer);
        
      } catch (error) {
        console.error('Error setting up Web3:', error);
        toast.error('Failed to setup Web3 connection');
      }
    };

    setupWeb3();
  }, [ready, authenticated, wallets]);

  // Load contract data
  const loadContractData = async (provider: BrowserProvider, signer: Signer) => {
    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, provider);
      
      // Get token addresses
      const [seniorAddr, juniorAddr] = await Promise.all([
        vaultContract.seniorToken(),
        vaultContract.juniorToken(),
      ]);
      setSeniorTokenAddress(seniorAddr);
      setJuniorTokenAddress(juniorAddr);
      
      // Load balances and vault info
      await refreshData();
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  // Connect wallet using Privy
  const handleConnectWallet = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      await logout();
      setBalances({
        seniorTokens: 0n,
        juniorTokens: 0n,
        aUSDC: 0n,
        cUSDT: 0n,
        lpTokens: 0n,
      });
      toast.info('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!provider || !signer || !address) return;
    
    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, provider);
      
      // Get vault info
      const [
        protocolStatus,
        phaseInfo,
        vaultBalances,
        userTokenBalances,
      ] = await Promise.all([
        vaultContract.getProtocolStatus(),
        vaultContract.getPhaseInfo(),
        vaultContract.getVaultBalances(),
        vaultContract.getUserTokenBalances(address),
      ]);
      
      setVaultInfo({
        aUSDCBalance: vaultBalances.aUSDCVaultBalance,
        cUSDTBalance: vaultBalances.cUSDTVaultBalance,
        totalTokensIssued: protocolStatus.totalTokens,
        emergencyMode: protocolStatus.emergency,
        currentPhase: protocolStatus.phase,
        phaseStartTime: phaseInfo.phaseStart,
        cycleStartTime: phaseInfo.cycleStart,
        timeRemaining: phaseInfo.timeRemaining,
      });
      
      // Get user token balances
      const aUSDCContract = new Contract(CONTRACT_ADDRESSES.MockAUSDC, ERC20_ABI, provider);
      const cUSDTContract = new Contract(CONTRACT_ADDRESSES.MockCUSDT, ERC20_ABI, provider);
      const pairContract = new Contract(CONTRACT_ADDRESSES.SeniorJuniorPair, ERC20_ABI, provider);
      
      const [aUSDCBalance, cUSDTBalance, lpBalance] = await Promise.all([
        aUSDCContract.balanceOf(address),
        cUSDTContract.balanceOf(address),
        pairContract.balanceOf(address),
      ]);
      
      setBalances({
        seniorTokens: userTokenBalances.seniorBalance,
        juniorTokens: userTokenBalances.juniorBalance,
        aUSDC: aUSDCBalance,
        cUSDT: cUSDTBalance,
        lpTokens: lpBalance,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  }, [provider, signer, address]);

  // Approve token spending
  const approveToken = async (tokenAddress: string, amount: string) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const token = new Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.approve(CONTRACT_ADDRESSES.RiskVault, ethers.parseEther(amount));
      toast.info('Approving token...');
      await tx.wait();
      toast.success('Token approved');
    } catch (error) {
      console.error('Error approving token:', error);
      toast.error('Failed to approve token');
      throw error;
    }
  };

  // Deposit assets
  const depositAsset = async (asset: 'aUSDC' | 'cUSDT', amount: string) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const tokenAddress = asset === 'aUSDC' ? CONTRACT_ADDRESSES.MockAUSDC : CONTRACT_ADDRESSES.MockCUSDT;
      const amountWei = ethers.parseEther(amount);
      
      // Check allowance first
      const token = new Contract(tokenAddress, ERC20_ABI, signer);
      const allowance = await token.allowance(address, CONTRACT_ADDRESSES.RiskVault);
      
      if (allowance < amountWei) {
        await approveToken(tokenAddress, amount);
      }
      
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.depositAsset(tokenAddress, amountWei);
      toast.info('Depositing assets...');
      await tx.wait();
      toast.success(`Successfully deposited ${amount} ${asset}`);
      
      await refreshData();
    } catch (error: any) {
      console.error('Error depositing:', error);
      if (error.reason) {
        toast.error(`Failed to deposit: ${error.reason}`);
      } else {
        toast.error('Failed to deposit assets');
      }
    }
  };

  // Withdraw tokens
  const withdraw = async (seniorAmount: string, juniorAmount: string) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.withdraw(
        ethers.parseEther(seniorAmount),
        ethers.parseEther(juniorAmount)
      );
      toast.info('Processing withdrawal...');
      await tx.wait();
      toast.success('Withdrawal successful');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      if (error.reason) {
        toast.error(`Failed to withdraw: ${error.reason}`);
      } else {
        toast.error('Failed to withdraw');
      }
    }
  };

  // Withdraw senior tokens only
  const withdrawSeniorTokens = async (amount: string) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.withdrawSeniorTokens(ethers.parseEther(amount));
      toast.info('Processing senior token withdrawal...');
      await tx.wait();
      toast.success('Senior tokens withdrawn successfully');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error withdrawing senior tokens:', error);
      if (error.reason) {
        toast.error(`Failed to withdraw: ${error.reason}`);
      } else {
        toast.error('Failed to withdraw senior tokens');
      }
    }
  };

  // Withdraw all tokens
  const withdrawAll = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.withdrawAll();
      toast.info('Processing full withdrawal...');
      await tx.wait();
      toast.success('All tokens withdrawn successfully');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error withdrawing all:', error);
      if (error.reason) {
        toast.error(`Failed to withdraw: ${error.reason}`);
      } else {
        toast.error('Failed to withdraw all tokens');
      }
    }
  };

  // Emergency withdraw
  const emergencyWithdraw = async (seniorAmount: string, preferredAsset: 'aUSDC' | 'cUSDT') => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const assetAddress = preferredAsset === 'aUSDC' ? CONTRACT_ADDRESSES.MockAUSDC : CONTRACT_ADDRESSES.MockCUSDT;
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.emergencyWithdraw(
        ethers.parseEther(seniorAmount),
        assetAddress
      );
      toast.info('Processing emergency withdrawal...');
      await tx.wait();
      toast.success('Emergency withdrawal successful');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error in emergency withdrawal:', error);
      if (error.reason) {
        toast.error(`Failed to withdraw: ${error.reason}`);
      } else {
        toast.error('Failed to perform emergency withdrawal');
      }
    }
  };

  // Admin functions
  const toggleEmergencyMode = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.toggleEmergencyMode();
      toast.info('Toggling emergency mode...');
      await tx.wait();
      toast.success('Emergency mode toggled');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error toggling emergency mode:', error);
      toast.error('Failed to toggle emergency mode - admin access required');
    }
  };

  const forcePhaseTransition = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.forcePhaseTransition();
      toast.info('Forcing phase transition...');
      await tx.wait();
      toast.success('Phase transition forced');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error forcing phase transition:', error);
      toast.error('Failed to force phase transition - admin access required');
    }
  };

  const startNewCycle = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, signer);
      const tx = await vaultContract.startNewCycle();
      toast.info('Starting new cycle...');
      await tx.wait();
      toast.success('New cycle started');
      
      await refreshData();
    } catch (error: any) {
      console.error('Error starting new cycle:', error);
      toast.error('Failed to start new cycle - admin access required');
    }
  };

  // Calculate withdrawal amounts
  const calculateWithdrawalAmounts = async (seniorAmount: string, juniorAmount: string) => {
    if (!provider) return { aUSDC: 0n, cUSDT: 0n };

    try {
      const vaultContract = new Contract(CONTRACT_ADDRESSES.RiskVault, RISK_VAULT_ABI, provider);
      const amounts = await vaultContract.calculateWithdrawalAmounts(
        ethers.parseEther(seniorAmount),
        ethers.parseEther(juniorAmount)
      );
      return {
        aUSDC: amounts.aUSDCAmount,
        cUSDT: amounts.cUSDTAmount,
      };
    } catch (error) {
      console.error('Error calculating withdrawal amounts:', error);
      return { aUSDC: 0n, cUSDT: 0n };
    }
  };

  // Auto-refresh data periodically
  useEffect(() => {
    if (!authenticated || !address) return;

    const interval = setInterval(() => {
      refreshData();
    }, 500); // Refresh every .5 second for real-time updates

    return () => clearInterval(interval);
  }, [authenticated, address, refreshData]);

  const contextValue: Web3ContextType = {
    isConnected: authenticated && !!address,
    address,
    chainId,
    provider,
    signer,
    balances,
    vaultInfo,
    seniorTokenAddress,
    juniorTokenAddress,
    connectWallet: handleConnectWallet,
    disconnectWallet,
    depositAsset,
    withdraw,
    withdrawSeniorTokens,
    withdrawAll,
    emergencyWithdraw,
    toggleEmergencyMode,
    forcePhaseTransition,
    startNewCycle,
    refreshData,
    approveToken,
    calculateWithdrawalAmounts,
    swapExactTokensForTokens: async (amountIn: string, amountOutMin: string, path: string[]) => {
      if (!signer || !address) {
        toast.error('Please connect your wallet');
        return;
      }
  
      try {
        const amountInWei = ethers.parseEther(amountIn);
        const amountOutMinWei = ethers.parseEther(amountOutMin);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  
        // Approve token spending if needed
        const inputToken = new Contract(path[0], ERC20_ABI, signer);
        const allowance = await inputToken.allowance(address, CONTRACT_ADDRESSES.UniswapV2Router02);
        
        if (allowance < amountInWei) {
          const approveTx = await inputToken.approve(CONTRACT_ADDRESSES.UniswapV2Router02, amountInWei);
          toast.info('Approving token...');
          await approveTx.wait();
        }
  
        // Execute swap
        const router = new Contract(CONTRACT_ADDRESSES.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, signer);
        const tx = await router.swapExactTokensForTokens(
          amountInWei,
          amountOutMinWei,
          path,
          address,
          deadline,
        );
  
        toast.info('Executing swap...');
        await tx.wait();
        toast.success('Swap completed');
        
        await refreshData();
      } catch (error: any) {
        console.error('Swap failed:', error);
        toast.error(error.reason || 'Swap failed');
      }
    },
  
    getAmountsOut: async (amountIn: string, path: string[]): Promise<string> => {
      if (!provider) return "0";
  
      try {
        const router = new Contract(CONTRACT_ADDRESSES.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, provider);
        const amountInWei = ethers.parseEther(amountIn);
        const amounts = await router.getAmountsOut(amountInWei, path);
        return ethers.formatEther(amounts[amounts.length - 1]);
      } catch (error) {
        console.error('Error getting amounts out:', error);
        return "0";
      }
    },
  
    addLiquidity: async (tokenAAmount: string, tokenBAmount: string, tokenA: string, tokenB: string) => {
      if (!signer || !address) {
        toast.error('Please connect your wallet');
        return;
      }
  
      try {
        const amountADesired = ethers.parseEther(tokenAAmount);
        const amountBDesired = ethers.parseEther(tokenBAmount);
        const amountAMin = amountADesired * 95n / 100n; // 5% slippage
        const amountBMin = amountBDesired * 95n / 100n; // 5% slippage
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  
        // Approve both tokens
        const tokenAContract = new Contract(tokenA, ERC20_ABI, signer);
        const tokenBContract = new Contract(tokenB, ERC20_ABI, signer);
  
        const allowanceA = await tokenAContract.allowance(address, CONTRACT_ADDRESSES.UniswapV2Router02);
        const allowanceB = await tokenBContract.allowance(address, CONTRACT_ADDRESSES.UniswapV2Router02);
  
        if (allowanceA < amountADesired) {
          const approveTx = await tokenAContract.approve(CONTRACT_ADDRESSES.UniswapV2Router02, amountADesired);
          toast.info(`Approving ${await tokenAContract.symbol()}...`);
          await approveTx.wait();
        }
  
        if (allowanceB < amountBDesired) {
          const approveTx = await tokenBContract.approve(CONTRACT_ADDRESSES.UniswapV2Router02, amountBDesired);
          toast.info(`Approving ${await tokenBContract.symbol()}...`);
          await approveTx.wait();
        }
  
        // Add liquidity
        const router = new Contract(CONTRACT_ADDRESSES.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, signer);
        const tx = await router.addLiquidity(
          tokenA,
          tokenB,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          address,
          deadline,
        );
  
        toast.info('Adding liquidity...');
        await tx.wait();
        toast.success('Liquidity added');
        
        await refreshData();
      } catch (error: any) {
        console.error('Failed to add liquidity:', error);
        toast.error(error.reason || 'Failed to add liquidity');
      }
    },

    removeLiquidity: async (lpTokenAmount: string, tokenA: string, tokenB: string) => {
      if (!signer || !address) {
        toast.error('Please connect your wallet');
        return;
      }

      try {
        const lpAmountWei = ethers.parseEther(lpTokenAmount);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

        // Approve LP tokens
        const pairContract = new Contract(CONTRACT_ADDRESSES.SeniorJuniorPair, ERC20_ABI, signer);
        const allowance = await pairContract.allowance(address, CONTRACT_ADDRESSES.UniswapV2Router02);

        if (allowance < lpAmountWei) {
          const approveTx = await pairContract.approve(CONTRACT_ADDRESSES.UniswapV2Router02, lpAmountWei);
          toast.info('Approving LP tokens...');
          await approveTx.wait();
        }

        // Remove liquidity
        const router = new Contract(CONTRACT_ADDRESSES.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, signer);
        const tx = await router.removeLiquidity(
          tokenA,
          tokenB,
          lpAmountWei,
          0, // amountAMin (accept any amount)
          0, // amountBMin (accept any amount)
          address,
          deadline,
        );

        toast.info('Removing liquidity...');
        await tx.wait();
        toast.success('Liquidity removed');
        
        await refreshData();
      } catch (error: any) {
        console.error('Failed to remove liquidity:', error);
        toast.error(error.reason || 'Failed to remove liquidity');
      }
    },
  
    getPairReserves: async (pairAddress: string) => {
      if (!provider) return { reserve0: 0n, reserve1: 0n };
  
      try {
        const pair = new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
        const [reserve0, reserve1] = await pair.getReserves();
        return { reserve0, reserve1 };
      } catch (error) {
        console.error('Error getting pair reserves:', error);
        return { reserve0: 0n, reserve1: 0n };
      }
    },
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Main Privy provider wrapper
export const PrivyWeb3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: '/CoverVault_Favicon.svg',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          id: CHAIN_CONFIG.chainId,
          name: CHAIN_CONFIG.chainName,
          network: CHAIN_CONFIG.chainName.toLowerCase().replace(' ', '-'),
          nativeCurrency: CHAIN_CONFIG.nativeCurrency,
          rpcUrls: {
            default: {
              http: CHAIN_CONFIG.rpcUrls,
            },
          },
          blockExplorers: {
            default: {
              name: 'Flow EVM Explorer',
              url: CHAIN_CONFIG.blockExplorerUrls[0],
            },
          },
        },
        supportedChains: [
          {
            id: CHAIN_CONFIG.chainId,
            name: CHAIN_CONFIG.chainName,
            network: CHAIN_CONFIG.chainName.toLowerCase().replace(' ', '-'),
            nativeCurrency: CHAIN_CONFIG.nativeCurrency,
            rpcUrls: {
              default: {
                http: CHAIN_CONFIG.rpcUrls,
              },
            },
            blockExplorers: {
              default: {
                name: 'Flow EVM Explorer',
                url: CHAIN_CONFIG.blockExplorerUrls[0],
              },
            },
          },
        ],
      }}
    >
      <InnerWeb3Provider>{children}</InnerWeb3Provider>
    </PrivyProvider>
  );
};

export const useWeb3 = () => useContext(Web3Context);