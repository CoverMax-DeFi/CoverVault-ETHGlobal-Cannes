import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import { Shield, TrendingUp, Scale, Zap, DollarSign, AlertCircle } from 'lucide-react';
import { Phase, CONTRACT_ADDRESSES } from '@/config/contracts';
import SmartLiquiditySuggestion from './SmartLiquiditySuggestion';
import { ethers } from 'ethers';

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
    depositAsset,
    addLiquidity,
    refreshData,
    getPairReserves,
    getTokenBalance,
  } = useWeb3();

  const [isExecuting, setIsExecuting] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAssetType, setDepositAssetType] = useState<'aUSDC' | 'cUSDT'>('aUSDC');
  const [showLiquiditySuggestion, setShowLiquiditySuggestion] = useState(false);

  // Calculate current token values
  const seniorValue = Number(balances.seniorTokens) / 1e18;
  const juniorValue = Number(balances.juniorTokens) / 1e18;
  const aUSDCValue = Number(balances.aUSDC) / 1e18;
  const cUSDTValue = Number(balances.cUSDT) / 1e18;

  const handleDepositAndTrade = async (tradeType: 'fullCoverage' | 'fullRisk' | 'balanced') => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsExecuting(true);
    try {
      // First, deposit to get tokens
      await depositAsset(depositAssetType, depositAmount);
      
      if (tradeType === 'fullCoverage') {
        // Get fresh junior token balance directly from blockchain
        const freshJuniorBalance = await getTokenBalance(juniorTokenAddress!);
        const juniorBalance = Number(freshJuniorBalance) / 1e18;
        
        // Only proceed if we have meaningful junior tokens (more than 0.001)
        if (juniorBalance > 0.001) {
          const path = [juniorTokenAddress!, seniorTokenAddress!];
          // Use the exact BigInt balance converted to string to avoid precision issues
          const balanceString = ethers.formatEther(freshJuniorBalance);
          
          const estimate = await getAmountsOut(balanceString, path);
          const minOutput = (parseFloat(estimate) * 0.95).toFixed(18);
          await swapExactTokensForTokens(balanceString, minOutput, path);
        }
      } else if (tradeType === 'fullRisk') {
        // Get fresh senior token balance directly from blockchain
        const freshSeniorBalance = await getTokenBalance(seniorTokenAddress!);
        const seniorBalance = Number(freshSeniorBalance) / 1e18;
        
        // Only proceed if we have meaningful senior tokens (more than 0.001)
        if (seniorBalance > 0.001) {
          const path = [seniorTokenAddress!, juniorTokenAddress!];
          // Use the exact BigInt balance converted to string to avoid precision issues
          const balanceString = ethers.formatEther(freshSeniorBalance);
          
          const estimate = await getAmountsOut(balanceString, path);
          const minOutput = (parseFloat(estimate) * 0.95).toFixed(18);
          await swapExactTokensForTokens(balanceString, minOutput, path);
        }
      }
      // For 'balanced', no additional trading needed - deposit gives 50/50 split
      
      // Only show liquidity suggestion for balanced deposits (where user gets both tokens)
      if (tradeType === 'balanced') {
        setShowLiquiditySuggestion(true);
      }
      
      setDepositAmount('');
      await refreshData(); // Refresh UI with new token balances
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
      <SmartLiquiditySuggestion
        isVisible={showLiquiditySuggestion}
        seniorValue={seniorValue}
        juniorValue={juniorValue}
        isExecuting={isExecuting}
        isConnected={isConnected}
        onAddLiquidity={handleAddLiquidity}
        onDismiss={() => setShowLiquiditySuggestion(false)}
      />

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