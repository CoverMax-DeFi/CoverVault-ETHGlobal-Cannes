import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import { Shield, TrendingUp, Scale, Zap, DollarSign, Droplets, AlertCircle } from 'lucide-react';
import { Phase, CONTRACT_ADDRESSES } from '@/config/contracts';

type TradeIntent = 'safety' | 'upside' | 'equalize' | 'fullCoverage' | 'fullRisk' | 'balanced' | 'maxSafety' | 'maxUpside' | 'addLiquidity';

const QuickTrade: React.FC = () => {
  const { 
    isConnected, 
    balances, 
    vaultInfo,
    seniorTokenAddress,
    juniorTokenAddress,
    swapExactTokensForTokens,
    getAmountsOut,
    withdraw,
    depositAsset,
    addLiquidity,
    refreshData,
    getPairReserves,
  } = useWeb3();

  const [intent, setIntent] = useState<TradeIntent>('fullCoverage');
  const [amount, setAmount] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAssetType, setDepositAssetType] = useState<'aUSDC' | 'cUSDT'>('aUSDC');
  const [showLiquiditySuggestion, setShowLiquiditySuggestion] = useState(false);

  // Calculate current token values
  const seniorValue = Number(balances.seniorTokens) / 1e18;
  const juniorValue = Number(balances.juniorTokens) / 1e18;
  const aUSDCValue = Number(balances.aUSDC) / 1e18;
  const cUSDTValue = Number(balances.cUSDT) / 1e18;
  const totalAssets = aUSDCValue + cUSDTValue;
  
  const handleEqualizeRisk = async () => {
    try {
      // Calculate the difference to equalize
      const totalValue = seniorValue + juniorValue; // Using token amounts instead of USD values for simplicity
      const targetAmount = totalValue / 2;
      
      // Determine which token to swap and how much
      if (seniorValue > targetAmount) {
        // Need to swap some SENIOR to JUNIOR
        const swapAmount = seniorValue - targetAmount;
        
        if (swapAmount > 0.000001 && seniorTokenAddress && juniorTokenAddress) {
          const path = [seniorTokenAddress, juniorTokenAddress];
          const swapAmountString = swapAmount.toFixed(18);
          const estimate = await getAmountsOut(swapAmountString, path);
          const minOutput = (parseFloat(estimate) * 0.95).toFixed(18); // 5% slippage
          
          await swapExactTokensForTokens(swapAmountString, minOutput, path);
        }
      } else if (juniorValue > targetAmount) {
        // Need to swap some JUNIOR to SENIOR
        const swapAmount = juniorValue - targetAmount;
        
        if (swapAmount > 0.000001 && seniorTokenAddress && juniorTokenAddress) {
          const path = [juniorTokenAddress, seniorTokenAddress];
          const swapAmountString = swapAmount.toFixed(18);
          const estimate = await getAmountsOut(swapAmountString, path);
          const minOutput = (parseFloat(estimate) * 0.95).toFixed(18); // 5% slippage
          
          await swapExactTokensForTokens(swapAmountString, minOutput, path);
        }
      }
    } catch (error) {
      console.error('Equalize risk failed:', error);
      throw error;
    }
  };

  const handleDepositAndTrade = async (tradeType: 'fullCoverage' | 'fullRisk' | 'balanced') => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsExecuting(true);
    try {
      // First, deposit to get tokens
      await depositAsset(depositAssetType, depositAmount);
      
      // Wait a moment for the deposit to be processed and refresh balances
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshData();
      
      if (tradeType === 'fullCoverage') {
        // Convert all JUNIOR tokens to SENIOR
        const juniorBalance = Number(balances.juniorTokens) / 1e18;
        console.log('Junior balance after deposit:', juniorBalance);
        console.log('Raw junior token balance:', balances.juniorTokens);
        
        // Only proceed if balance is significant (more than 0.000001)
        if (juniorBalance > 0.000001) {
          console.log('Proceeding with swap, balance is significant');
          const path = [juniorTokenAddress!, seniorTokenAddress!];
          // Format to avoid scientific notation
          const balanceString = juniorBalance.toFixed(18);
          const estimate = await getAmountsOut(balanceString, path);
          const minOutput = (parseFloat(estimate) * 0.95).toFixed(18);
          console.log('Swapping', balanceString, 'JUNIOR for minimum', minOutput, 'SENIOR');
          await swapExactTokensForTokens(balanceString, minOutput, path);
        } else {
          console.log('Junior balance too small to swap:', juniorBalance);
        }
      } else if (tradeType === 'fullRisk') {
        // Convert all SENIOR tokens to JUNIOR
        const seniorBalance = Number(balances.seniorTokens) / 1e18;
        // Only proceed if balance is significant (more than 0.000001)
        if (seniorBalance > 0.000001) {
          const path = [seniorTokenAddress!, juniorTokenAddress!];
          // Format to avoid scientific notation
          const balanceString = seniorBalance.toFixed(18);
          const estimate = await getAmountsOut(balanceString, path);
          const minOutput = (parseFloat(estimate) * 0.95).toFixed(18);
          await swapExactTokensForTokens(balanceString, minOutput, path);
        }
      }
      // For 'balanced', no additional trading needed - deposit gives 50/50 split
      
      setShowLiquiditySuggestion(true);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit and trade failed:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };


  const handleAddLiquidity = async () => {
    setIsExecuting(true);
    try {
      const seniorBalance = Number(balances.seniorTokens) / 1e18;
      const juniorBalance = Number(balances.juniorTokens) / 1e18;
      
      // Get current pool reserves from the Uniswap pair
      const reserves = await getPairReserves(CONTRACT_ADDRESSES.SeniorJuniorPair);
      const seniorReserve = Number(reserves.reserve0) / 1e18;  // reserve0 is senior
      const juniorReserve = Number(reserves.reserve1) / 1e18;  // reserve1 is junior
      
      console.log('Pool reserves:', { seniorReserve, juniorReserve });
      console.log('User balances:', { seniorBalance, juniorBalance });
      
      if (seniorReserve > 0 && juniorReserve > 0) {
        // Calculate the pool ratio (junior/senior)
        const poolRatio = juniorReserve / seniorReserve;
        
        // Calculate max amounts we can add while maintaining ratio
        const maxSeniorFromJunior = juniorBalance / poolRatio;
        const maxJuniorFromSenior = seniorBalance * poolRatio;
        
        // Use the limiting factor
        let seniorToAdd: number, juniorToAdd: number;
        if (maxSeniorFromJunior <= seniorBalance) {
          // Junior is the limiting factor
          juniorToAdd = juniorBalance;
          seniorToAdd = maxSeniorFromJunior;
        } else {
          // Senior is the limiting factor  
          seniorToAdd = seniorBalance;
          juniorToAdd = maxJuniorFromSenior;
        }
        
        console.log('Calculated amounts to add:', { seniorToAdd, juniorToAdd });
        
        // Only proceed if amounts are meaningful
        if (seniorToAdd >= 0.01 && juniorToAdd >= 0.01) {
          const seniorAmountString = seniorToAdd.toFixed(18);
          const juniorAmountString = juniorToAdd.toFixed(18);
          
          console.log(`Adding liquidity: ${seniorAmountString} SENIOR + ${juniorAmountString} JUNIOR`);
          console.log(`Pool ratio: ${poolRatio.toFixed(6)} (${juniorReserve}/${seniorReserve})`);
          
          await addLiquidity(seniorAmountString, juniorAmountString, seniorTokenAddress!, juniorTokenAddress!);
          setShowLiquiditySuggestion(false);
        } else {
          alert('Insufficient tokens to add meaningful liquidity while maintaining pool ratio.');
        }
      } else {
        alert('Cannot determine pool ratio. Pool may be empty.');
      }
    } catch (error) {
      console.error('Add liquidity failed:', error);
      alert('Adding liquidity failed. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Update estimated output when amount or intent changes
  useEffect(() => {
    const updateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setEstimatedOutput('0');
        return;
      }

      try {
        if (intent === 'safety') {
          // Get estimate for swapping juniorTokens to seniorTokens
          const path = [juniorTokenAddress!, seniorTokenAddress!];
          const estimate = await getAmountsOut(amount, path);
          setEstimatedOutput(estimate);
        } else if (intent === 'upside') {
          // Get estimate for swapping seniorTokens to juniorTokens
          const path = [seniorTokenAddress!, juniorTokenAddress!];
          const estimate = await getAmountsOut(amount, path);
          setEstimatedOutput(estimate);
        }
      } catch (error) {
        console.error('Error getting estimate:', error);
        setEstimatedOutput('0');
      }
    };

    if (intent !== 'equalize' && amount && parseFloat(amount) > 0) {
      updateEstimate();
      // Update estimate every 3 seconds for real-time pricing
      const interval = setInterval(updateEstimate, 3000);
      return () => clearInterval(interval);
    }
  }, [amount, intent, seniorTokenAddress, juniorTokenAddress, getAmountsOut]);



  if (!isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-center py-8">
            Connect your wallet to start trading risk tokens
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Risk Trading Hub Header */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-white flex items-center justify-center text-2xl">
            <Zap className="w-8 h-8 mr-3 text-blue-400" />
            Smart Risk Trading Hub
          </CardTitle>
          <p className="text-slate-300 text-lg">
            One-click deposit + trading • MAX buttons • Smart liquidity
          </p>
        </CardHeader>
      </Card>

      {/* Unified Trading Hub */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Deposit & Trade Risk Tokens
          </CardTitle>
          <p className="text-slate-400">
            Deposit new funds or trade existing tokens with one click
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deposit Amount and Asset Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Deposit Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white text-lg py-3"
              />
            </div>
            <div>
              <Label className="text-slate-300 mb-3 block">Select Asset</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDepositAssetType('aUSDC')}
                  className={`p-3 rounded-lg border transition-all ${
                    depositAssetType === 'aUSDC'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">aUSDC</div>
                    <div className="text-sm opacity-80">Aave USDC</div>
                    <div className="text-xs mt-1">Balance: {aUSDCValue.toFixed(4)}</div>
                  </div>
                </button>
                <button
                  onClick={() => setDepositAssetType('cUSDT')}
                  className={`p-3 rounded-lg border transition-all ${
                    depositAssetType === 'cUSDT'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">cUSDT</div>
                    <div className="text-sm opacity-80">Compound USDT</div>
                    <div className="text-xs mt-1">Balance: {cUSDTValue.toFixed(4)}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Deposit Phase Check */}
          {Number(vaultInfo.currentPhase) !== Phase.DEPOSIT && (
            <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deposits are only allowed during the Deposit phase. Current phase: {vaultInfo.currentPhase !== undefined ? Phase[vaultInfo.currentPhase] : 'Loading...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Deposit Action Buttons */}
          <div>
            <Label className="text-slate-300 mb-3 block">Deposit & Get Tokens</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => handleDepositAndTrade('fullCoverage')}
                disabled={!isConnected || !depositAmount || parseFloat(depositAmount) <= 0 || isExecuting || Number(vaultInfo.currentPhase) !== Phase.DEPOSIT}
                className="h-16 text-lg font-medium bg-slate-700 hover:bg-slate-600 transition-all duration-200 border border-slate-600"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Shield className="w-5 h-5" />
                  <span>MAX SAFETY</span>
                  <span className="text-xs opacity-80">All → SENIOR</span>
                </div>
              </Button>

              <Button 
                onClick={() => handleDepositAndTrade('fullRisk')}
                disabled={!isConnected || !depositAmount || parseFloat(depositAmount) <= 0 || isExecuting || Number(vaultInfo.currentPhase) !== Phase.DEPOSIT}
                className="h-16 text-lg font-medium bg-slate-700 hover:bg-slate-600 transition-all duration-200 border border-slate-600"
              >
                <div className="flex flex-col items-center space-y-1">
                  <TrendingUp className="w-5 h-5" />
                  <span>MAX UPSIDE</span>
                  <span className="text-xs opacity-80">All → JUNIOR</span>
                </div>
              </Button>

              <Button 
                onClick={() => handleDepositAndTrade('balanced')}
                disabled={!isConnected || !depositAmount || parseFloat(depositAmount) <= 0 || isExecuting || Number(vaultInfo.currentPhase) !== Phase.DEPOSIT}
                className="h-16 text-lg font-medium bg-slate-700 hover:bg-slate-600 transition-all duration-200 border border-slate-600"
              >
                <div className="flex flex-col items-center space-y-1">
                  <Scale className="w-5 h-5" />
                  <span>BALANCED</span>
                  <span className="text-xs opacity-80">50/50 split</span>
                </div>
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Smart Liquidity Suggestion */}
      {showLiquiditySuggestion && (
        <Card className="bg-slate-800/50 border-blue-600/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center">
              <Droplets className="w-6 h-6 mr-2" />
              Smart Liquidity Suggestion
            </CardTitle>
            <p className="text-slate-300">
              You just earned tokens! Add them to the liquidity pool to earn trading fees.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">Available tokens:</p>
                <p className="text-slate-300 text-sm">
                  {seniorValue.toFixed(4)} SENIOR + {juniorValue.toFixed(4)} JUNIOR
                </p>
                <p className="text-slate-300 text-xs opacity-80">
                  Will add optimal amounts to match pool ratio
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleAddLiquidity}
                  disabled={!isConnected || (seniorValue <= 0 && juniorValue <= 0) || isExecuting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Droplets className="w-4 h-4 mr-2" />
                  Add to Pool
                </Button>
                <Button 
                  onClick={() => setShowLiquiditySuggestion(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Later
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Status */}
      {isExecuting && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <span className="text-blue-400 font-medium">Executing trade...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default React.memo(QuickTrade);