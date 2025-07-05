import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import Navbar from '@/components/Navbar';
import PhaseDisplay from '@/components/PhaseDisplay';
import QuickTrade from '@/components/QuickTrade';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Coins, Shield, AlertCircle, RefreshCw, Activity, ArrowRight, Droplets } from 'lucide-react';
import { Phase, CONTRACT_ADDRESSES } from '@/config/contracts';
import { ethers } from 'ethers';

const Dashboard = () => {
  const {
    isConnected,
    balances,
    vaultInfo,
    getAmountsOut,
    seniorTokenAddress,
    juniorTokenAddress,
    getPairReserves,
  } = useWeb3();

  const [seniorPrice, setSeniorPrice] = useState('0.98');
  const [juniorPrice, setJuniorPrice] = useState('1.05');
  const [pricesLoading, setPricesLoading] = useState(false);
  
  // Pool reserves state
  const [poolReserves, setPoolReserves] = useState({ senior: '0', junior: '0' });

  // Format token amounts for display
  const formatTokenAmount = (amount: bigint) => {
    return ethers.formatEther(amount);
  };

  // Fetch token prices and pool reserves from Uniswap pair
  useEffect(() => {
    const fetchTokenPrices = async () => {
      if (!seniorTokenAddress || !juniorTokenAddress || !getAmountsOut) return;
      
      setPricesLoading(true);
      try {
        // Get pool reserves to calculate proper AMM pricing
        const reserves = await getPairReserves(CONTRACT_ADDRESSES.SeniorJuniorPair);
        const seniorReserve = parseFloat(ethers.formatEther(reserves.reserve0));
        const juniorReserve = parseFloat(ethers.formatEther(reserves.reserve1));
        
        // Calculate prices directly from Uniswap AMM reserves
        // In a Uniswap pair, price = other_reserve / this_reserve
        const seniorPriceInJunior = juniorReserve / seniorReserve;
        const juniorPriceInSenior = seniorReserve / juniorReserve;
        
        // For USD pricing, we need to establish a base.
        // Let's use getAmountsOut to get actual market prices
        try {
          // Get price of 1 SENIOR in terms of JUNIOR
          const seniorToJuniorPath = [seniorTokenAddress, juniorTokenAddress];
          const seniorPrice1Unit = await getAmountsOut('1', seniorToJuniorPath);
          
          // Get price of 1 JUNIOR in terms of SENIOR
          const juniorToSeniorPath = [juniorTokenAddress, seniorTokenAddress];
          const juniorPrice1Unit = await getAmountsOut('1', juniorToSeniorPath);
          
          setSeniorPrice(parseFloat(seniorPrice1Unit).toFixed(2));
          setJuniorPrice(parseFloat(juniorPrice1Unit).toFixed(2));
        } catch (error) {
          console.error('Error getting AMM prices:', error);
          // Fallback to reserve-based calculation
          setSeniorPrice(seniorPriceInJunior.toFixed(2));
          setJuniorPrice(juniorPriceInSenior.toFixed(2));
        }
      } catch (error) {
        console.error('Error fetching token prices:', error);
        // Keep default prices on error (equal weighting)
        setSeniorPrice('1.00');
        setJuniorPrice('1.00');
      } finally {
        setPricesLoading(false);
      }
    };

    const fetchPoolReserves = async () => {
      if (!getPairReserves) return;
      
      try {
        const reserves = await getPairReserves(CONTRACT_ADDRESSES.SeniorJuniorPair);
        
        // Format reserves from wei to ether
        const seniorReserve = ethers.formatEther(reserves.reserve0);
        const juniorReserve = ethers.formatEther(reserves.reserve1);
        
        // Only update if values have changed significantly (avoid micro-updates)
        const currentSenior = parseFloat(poolReserves.senior);
        const currentJunior = parseFloat(poolReserves.junior);
        const newSenior = parseFloat(seniorReserve);
        const newJunior = parseFloat(juniorReserve);
        
        if (Math.abs(currentSenior - newSenior) > 0.01 || Math.abs(currentJunior - newJunior) > 0.01) {
          setPoolReserves({
            senior: seniorReserve,
            junior: juniorReserve,
          });
        }
      } catch (error) {
        console.error('Error fetching pool reserves:', error);
        // Only reset if we don't have valid data
        if (poolReserves.senior === '0' && poolReserves.junior === '0') {
          setPoolReserves({ senior: '0', junior: '0' });
        }
      }
    };

    fetchTokenPrices();
    fetchPoolReserves();
    const interval = setInterval(() => {
      fetchTokenPrices();
      fetchPoolReserves();
    }, 30000); // Update every 30 seconds to reduce twitching
    
    return () => clearInterval(interval);
  }, [seniorTokenAddress, juniorTokenAddress, getAmountsOut, getPairReserves]);

  // Calculate total portfolio value based on risk token holdings and current market prices
  const seniorTokenAmount = parseFloat(formatTokenAmount(balances.seniorTokens));
  const juniorTokenAmount = parseFloat(formatTokenAmount(balances.juniorTokens));
  
  const totalPortfolioValue = 
    (seniorTokenAmount * parseFloat(seniorPrice)) +
    (juniorTokenAmount * parseFloat(juniorPrice));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <Navbar />

      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Trading Dashboard
              </h1>
              <p className="text-slate-300">
                Smart trading with one-click deposit and risk management
              </p>
            </div>
            <div className="flex items-center text-slate-400 text-sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${pricesLoading ? 'animate-spin' : ''}`} />
              Real-time data
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Alert className="mb-6 bg-slate-800/50 border-slate-700 text-slate-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to interact with the protocol
            </AlertDescription>
          </Alert>
        )}

                {/* Portfolio Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Your Portfolio</h2>
            <div className="text-sm text-slate-400">Current positions and protocol status</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Your Positions</CardTitle>
              <CardDescription className="text-slate-300">Current risk token holdings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">SENIOR</p>
                    <p className="text-slate-400 text-sm">Priority claims</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatTokenAmount(balances.seniorTokens)}</p>
                  <p className="text-slate-400 text-sm">Value: ${(seniorTokenAmount * parseFloat(seniorPrice)).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">JUNIOR</p>
                    <p className="text-slate-400 text-sm">Higher upside</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatTokenAmount(balances.juniorTokens)}</p>
                  <p className="text-slate-400 text-sm">Value: ${(juniorTokenAmount * parseFloat(juniorPrice)).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">LP TOKENS</p>
                    <p className="text-slate-400 text-sm">Liquidity provider</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatTokenAmount(balances.lpTokens)}</p>
                  <p className="text-slate-400 text-sm">Pool share</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Protocol Status</CardTitle>
              <CardDescription className="text-slate-300">Current protocol information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Current Phase:</span>
                <span className="text-white font-medium">{vaultInfo.currentPhase !== undefined ? Phase[vaultInfo.currentPhase] : 'Loading...'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Emergency Mode:</span>
                <span className={`font-medium ${vaultInfo.emergencyMode ? 'text-red-400' : 'text-green-400'}`}>
                  {vaultInfo.emergencyMode ? '🚨 Active' : '✅ Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total TVL:</span>
                <span className="text-white font-medium">${((Number(vaultInfo.aUSDCBalance) + Number(vaultInfo.cUSDTBalance)) / 1e18).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Your Share:</span>
                <span className="text-white font-medium">
                  {vaultInfo.totalTokensIssued > 0n 
                    ? ((seniorTokenAmount + juniorTokenAmount) / (Number(vaultInfo.totalTokensIssued) / 1e18) * 100).toFixed(2) 
                    : '0.00'}%
                </span>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Quick Trade - Hero Section */}
        <div className="mb-8">
          <QuickTrade />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);