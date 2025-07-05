import { useEffect, useState } from 'react';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import Navbar from '@/components/Navbar';
import PhaseDisplay from '@/components/PhaseDisplay';
import QuickTrade from '@/components/QuickTrade';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, DollarSign, Coins, Shield, AlertCircle, RefreshCw, Droplets, ArrowUpDown, TrendingUp, Minus, Activity } from 'lucide-react';
import { Phase, CONTRACT_ADDRESSES } from '@/config/contracts';
import { ethers } from 'ethers';

const Dashboard = () => {
  const {
    isConnected,
    balances,
    vaultInfo,
    depositAsset,
    withdraw,
    emergencyWithdraw,
    calculateWithdrawalAmounts,
    getAmountsOut,
    seniorTokenAddress,
    juniorTokenAddress,
    addLiquidity,
    removeLiquidity,
    swapExactTokensForTokens,
    getPairReserves,
  } = useWeb3();

  const [depositAmount, setDepositAmount] = useState('');
  const [depositAssetType, setDepositAssetType] = useState<'aUSDC' | 'cUSDT'>('aUSDC');
  const [withdrawSeniorAmount, setWithdrawSeniorAmount] = useState('');
  const [withdrawJuniorAmount, setWithdrawJuniorAmount] = useState('');
  const [emergencyAmount, setEmergencyAmount] = useState('');
  const [preferredAsset, setPreferredAsset] = useState<'aUSDC' | 'cUSDT'>('aUSDC');
  const [estimatedWithdrawal, setEstimatedWithdrawal] = useState({ aUSDC: '0', cUSDT: '0' });
  const [seniorPrice, setSeniorPrice] = useState('0.98');
  const [juniorPrice, setJuniorPrice] = useState('1.05');
  const [pricesLoading, setPricesLoading] = useState(false);
  
  // Pool reserves state
  const [poolReserves, setPoolReserves] = useState({ senior: '0', junior: '0' });
  
  // Liquidity management state
  const [liquiditySeniorAmount, setLiquiditySeniorAmount] = useState('');
  const [liquidityJuniorAmount, setLiquidityJuniorAmount] = useState('');
  const [removeLiquidityAmount, setRemoveLiquidityAmount] = useState('');
  
  // Rebalance Risk state
  const [rebalanceFrom, setRebalanceFrom] = useState<'senior' | 'junior'>('senior');
  const [rebalanceTo, setRebalanceTo] = useState<'senior' | 'junior'>('junior');
  const [rebalanceAmount, setRebalanceAmount] = useState('');
  const [rebalanceEstimate, setRebalanceEstimate] = useState('0');

  // Format token amounts for display
  const formatTokenAmount = (amount: bigint) => {
    return ethers.formatEther(amount);
  };

  // Update rebalance estimate in real-time
  useEffect(() => {
    const updateRebalanceEstimate = async () => {
      if (!rebalanceAmount || parseFloat(rebalanceAmount) <= 0) {
        setRebalanceEstimate('0');
        return;
      }

      try {
        const fromToken = rebalanceFrom === 'senior' ? seniorTokenAddress : juniorTokenAddress;
        const toToken = rebalanceTo === 'senior' ? seniorTokenAddress : juniorTokenAddress;
        
        if (fromToken && toToken && fromToken !== toToken) {
          const path = [fromToken, toToken];
          const estimate = await getAmountsOut(rebalanceAmount, path);
          setRebalanceEstimate(estimate);
        }
      } catch (error) {
        console.error('Error getting rebalance estimate:', error);
        setRebalanceEstimate('0');
      }
    };

    if (rebalanceAmount && parseFloat(rebalanceAmount) > 0) {
      updateRebalanceEstimate();
      // Update estimate every 3 seconds for real-time pricing
      const interval = setInterval(updateRebalanceEstimate, 3000);
      return () => clearInterval(interval);
    }
  }, [rebalanceAmount, rebalanceFrom, rebalanceTo, seniorTokenAddress, juniorTokenAddress, getAmountsOut]);

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

  // Update withdrawal estimates
  useEffect(() => {
    const updateEstimates = async () => {
      if (!withdrawSeniorAmount && !withdrawJuniorAmount) {
        setEstimatedWithdrawal({ aUSDC: '0', cUSDT: '0' });
        return;
      }

      const senior = withdrawSeniorAmount || '0';
      const junior = withdrawJuniorAmount || '0';
      const amounts = await calculateWithdrawalAmounts(senior, junior);
      
      setEstimatedWithdrawal({
        aUSDC: ethers.formatEther(amounts.aUSDC),
        cUSDT: ethers.formatEther(amounts.cUSDT),
      });
    };

    updateEstimates();
  }, [withdrawSeniorAmount, withdrawJuniorAmount, calculateWithdrawalAmounts]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    await depositAsset(depositAssetType, depositAmount);
    setDepositAmount('');
  };

  const handleWithdraw = async () => {
    const senior = withdrawSeniorAmount || '0';
    const junior = withdrawJuniorAmount || '0';
    if (parseFloat(senior) <= 0 && parseFloat(junior) <= 0) return;
    await withdraw(senior, junior);
    setWithdrawSeniorAmount('');
    setWithdrawJuniorAmount('');
  };

  const handleEmergencyWithdraw = async () => {
    if (!emergencyAmount || parseFloat(emergencyAmount) <= 0) return;
    await emergencyWithdraw(emergencyAmount, preferredAsset);
    setEmergencyAmount('');
  };

  const handleAddLiquidity = async () => {
    if (!liquiditySeniorAmount || !liquidityJuniorAmount || !seniorTokenAddress || !juniorTokenAddress) return;
    if (parseFloat(liquiditySeniorAmount) <= 0 || parseFloat(liquidityJuniorAmount) <= 0) return;
    
    await addLiquidity(liquiditySeniorAmount, liquidityJuniorAmount, seniorTokenAddress, juniorTokenAddress);
    setLiquiditySeniorAmount('');
    setLiquidityJuniorAmount('');
  };

  const handleRemoveLiquidity = async () => {
    if (!removeLiquidityAmount || !seniorTokenAddress || !juniorTokenAddress) return;
    if (parseFloat(removeLiquidityAmount) <= 0) return;
    
    await removeLiquidity(removeLiquidityAmount, seniorTokenAddress, juniorTokenAddress);
    setRemoveLiquidityAmount('');
  };

  const handleRebalanceRisk = async () => {
    if (!rebalanceAmount || parseFloat(rebalanceAmount) <= 0) return;
    
    try {
      const fromToken = rebalanceFrom === 'senior' ? seniorTokenAddress : juniorTokenAddress;
      const toToken = rebalanceTo === 'senior' ? seniorTokenAddress : juniorTokenAddress;
      const minOutput = (parseFloat(rebalanceEstimate) * 0.95).toString(); // 5% slippage
      
      if (fromToken && toToken && fromToken !== toToken) {
        await swapExactTokensForTokens(
          rebalanceAmount,
          minOutput,
          [fromToken, toToken]
        );
        setRebalanceAmount('');
        setRebalanceEstimate('0');
      }
    } catch (error) {
      console.error('Rebalance failed:', error);
    }
  };

  // Get available balance for rebalancing
  const getRebalanceBalance = () => {
    if (rebalanceFrom === 'senior') {
      return parseFloat(formatTokenAmount(balances.seniorTokens));
    } else {
      return parseFloat(formatTokenAmount(balances.juniorTokens));
    }
  };

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
                Complete hub for trading, liquidity, and portfolio management
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

        {/* Phase Display */}
        <div className="mb-8">
          <PhaseDisplay />
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Portfolio Value"
            value={`$${totalPortfolioValue.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            description={`${seniorTokenAmount.toFixed(2)} SENIOR + ${juniorTokenAmount.toFixed(2)} JUNIOR`}
            className="transition-all duration-300"
          />
          <StatCard
            title="SENIOR Price"
            value={`$${seniorPrice}`}
            icon={<Shield className="h-5 w-5" />}
            description="Priority claims token"
            className="transition-all duration-300"
          />
          <StatCard
            title="JUNIOR Price"
            value={`$${juniorPrice}`}
            icon={<Coins className="h-5 w-5" />}
            description="Higher yield token"
            className="transition-all duration-300"
          />
          <StatCard
            title="Pool Liquidity"
            value={poolReserves.senior === '0' && poolReserves.junior === '0' ? 'Loading...' : `$${((parseFloat(poolReserves.senior)) + (parseFloat(poolReserves.junior))).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            icon={<Activity className="h-5 w-5" />}
            description={`${(parseFloat(poolReserves.senior) / 1000).toFixed(3)}K SENIOR / ${(parseFloat(poolReserves.junior) / 1000).toFixed(3)}K JUNIOR`}
            className="transition-all duration-300"
          />
        </div>

        {/* Quick Trade - Hero Section */}
        <div className="mb-8">
          <QuickTrade />
        </div>

        {/* Secondary Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Protocol Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issue Risk Tokens */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Issue Risk Tokens</CardTitle>
              <CardDescription className="text-slate-300">
                Deposit assets to receive CM-SENIOR and CM-JUNIOR tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Number(vaultInfo.currentPhase) !== Phase.DEPOSIT ? (
                <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Deposits are only allowed during the Deposit phase. Current phase: {Phase[vaultInfo.currentPhase]}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <Label className="text-slate-300">Select Asset</Label>
                    <RadioGroup value={depositAssetType} onValueChange={(v) => setDepositAssetType(v as 'aUSDC' | 'cUSDT')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="aUSDC" id="aUSDC" />
                        <Label htmlFor="aUSDC" className="text-slate-300">aUSDC (Balance: {formatTokenAmount(balances.aUSDC)})</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cUSDT" id="cUSDT" />
                        <Label htmlFor="cUSDT" className="text-slate-300">cUSDT (Balance: {formatTokenAmount(balances.cUSDT)})</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="deposit-amount" className="text-slate-300">Amount</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="0.0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      disabled={!isConnected}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You will receive {depositAmount ? (parseFloat(depositAmount) / 2) : '0'} CM-SENIOR and {depositAmount ? (parseFloat(depositAmount) / 2) : '0'} CM-JUNIOR tokens
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleDeposit} 
                    disabled={!isConnected || !depositAmount || parseFloat(depositAmount) <= 0 || Number(vaultInfo.currentPhase) !== Phase.DEPOSIT}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Deposit {depositAssetType}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Redeem For Assets */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Redeem For Assets</CardTitle>
              <CardDescription className="text-slate-300">
                Convert your risk tokens back to aUSDC or cUSDT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="senior-amount" className="text-slate-300">CM-SENIOR Amount</Label>
                <Input
                  id="senior-amount"
                  type="number"
                  placeholder="0.0"
                  value={withdrawSeniorAmount}
                  onChange={(e) => setWithdrawSeniorAmount(e.target.value)}
                  disabled={!isConnected}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
                <p className="text-sm text-slate-400 mt-1">
                  Balance: {formatTokenAmount(balances.seniorTokens)}
                </p>
              </div>

              {vaultInfo.currentPhase !== Phase.CLAIMS && (
                <div>
                  <Label htmlFor="junior-amount" className="text-slate-300">CM-JUNIOR Amount</Label>
                  <Input
                    id="junior-amount"
                    type="number"
                    placeholder="0.0"
                    value={withdrawJuniorAmount}
                    onChange={(e) => setWithdrawJuniorAmount(e.target.value)}
                    disabled={!isConnected}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Balance: {formatTokenAmount(balances.juniorTokens)}
                  </p>
                </div>
              )}

              {(withdrawSeniorAmount || withdrawJuniorAmount) && (
                <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Estimated withdrawal: {estimatedWithdrawal.aUSDC} aUSDC + {estimatedWithdrawal.cUSDT} cUSDT
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleWithdraw} 
                disabled={!isConnected || (!withdrawSeniorAmount && !withdrawJuniorAmount)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Redeem Tokens
              </Button>
            </CardContent>
          </Card>

          {/* Add Liquidity */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Add Liquidity</CardTitle>
              <CardDescription className="text-slate-300">
                Provide liquidity to the SENIOR/JUNIOR pool to earn trading fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">SENIOR Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={liquiditySeniorAmount}
                    onChange={(e) => setLiquiditySeniorAmount(e.target.value)}
                    disabled={!isConnected}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Balance: {formatTokenAmount(balances.seniorTokens)}
                  </p>
                </div>
                
                <div>
                  <Label className="text-slate-300">JUNIOR Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={liquidityJuniorAmount}
                    onChange={(e) => setLiquidityJuniorAmount(e.target.value)}
                    disabled={!isConnected}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Balance: {formatTokenAmount(balances.juniorTokens)}
                  </p>
                </div>
              </div>

              {liquiditySeniorAmount && liquidityJuniorAmount && (
                <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive LP tokens proportional to your share of the pool
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAddLiquidity}
                disabled={!isConnected || !liquiditySeniorAmount || !liquidityJuniorAmount || parseFloat(liquiditySeniorAmount) <= 0 || parseFloat(liquidityJuniorAmount) <= 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Add Liquidity
              </Button>
            </CardContent>
          </Card>

                      {/* Remove Liquidity */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Minus className="w-5 h-5 mr-2" />
                  Remove Liquidity
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Remove liquidity from the SENIOR/JUNIOR pool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">LP Token Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={removeLiquidityAmount}
                    onChange={(e) => setRemoveLiquidityAmount(e.target.value)}
                    disabled={!isConnected}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    LP Balance: {formatTokenAmount(balances.lpTokens)}
                  </p>
                </div>

                {removeLiquidityAmount && parseFloat(removeLiquidityAmount) > 0 && (
                  <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You'll receive proportional amounts of SENIOR and JUNIOR tokens
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleRemoveLiquidity}
                  disabled={!isConnected || !removeLiquidityAmount || parseFloat(removeLiquidityAmount) <= 0}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                >
                  Remove Liquidity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

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

        {/* Emergency Withdrawal */}
        {vaultInfo.emergencyMode && (
          <Card className="bg-red-900/20 border-red-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-red-400">Emergency Withdrawal</CardTitle>
              <CardDescription className="text-red-300">
                Emergency mode is active. Senior token holders can withdraw with preferred asset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergency-amount" className="text-slate-300">CM-SENIOR Amount</Label>
                <Input
                  id="emergency-amount"
                  type="number"
                  placeholder="0.0"
                  value={emergencyAmount}
                  onChange={(e) => setEmergencyAmount(e.target.value)}
                  disabled={!isConnected}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <Label className="text-slate-300">Preferred Asset</Label>
                <RadioGroup value={preferredAsset} onValueChange={(v) => setPreferredAsset(v as 'aUSDC' | 'cUSDT')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aUSDC" id="em-aUSDC" />
                    <Label htmlFor="em-aUSDC" className="text-slate-300">aUSDC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cUSDT" id="em-cUSDT" />
                    <Label htmlFor="em-cUSDT" className="text-slate-300">cUSDT</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button 
                onClick={handleEmergencyWithdraw} 
                disabled={!isConnected || !emergencyAmount}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Emergency Withdraw
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;