import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import { Shield, TrendingUp, Scale, Zap } from 'lucide-react';

type TradeIntent = 'safety' | 'upside' | 'equalize';

const QuickTrade: React.FC = () => {
  const { 
    isConnected, 
    balances, 
    seniorTokenAddress,
    juniorTokenAddress,
    swapExactTokensForTokens,
    getAmountsOut,
    withdraw,
  } = useWeb3();

  const [intent, setIntent] = useState<TradeIntent>('safety');
  const [amount, setAmount] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState('0');

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
        const swapAmount = (seniorValue - targetAmount).toString();
        
        if (seniorTokenAddress && juniorTokenAddress) {
          const path = [seniorTokenAddress, juniorTokenAddress];
          const estimate = await getAmountsOut(swapAmount, path);
          const minOutput = (parseFloat(estimate) * 0.95).toString(); // 5% slippage
          
          await swapExactTokensForTokens(swapAmount, minOutput, path);
        }
      } else if (juniorValue > targetAmount) {
        // Need to swap some JUNIOR to SENIOR
        const swapAmount = (juniorValue - targetAmount).toString();
        
        if (seniorTokenAddress && juniorTokenAddress) {
          const path = [juniorTokenAddress, seniorTokenAddress];
          const estimate = await getAmountsOut(swapAmount, path);
          const minOutput = (parseFloat(estimate) * 0.95).toString(); // 5% slippage
          
          await swapExactTokensForTokens(swapAmount, minOutput, path);
        }
      }
    } catch (error) {
      console.error('Equalize risk failed:', error);
      throw error;
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

  const getIntentDetails = () => {
    switch (intent) {
      case 'safety':
        return {
          title: 'Get More Safety',
          description: 'Swap for more SENIOR tokens',
          icon: <Shield className="w-5 h-5" />,
          color: 'bg-blue-600',
          action: `You'll get ~${parseFloat(estimatedOutput).toFixed(4)} SENIOR tokens`
        };
      case 'upside':
        return {
          title: 'Increase Upside',
          description: 'Swap for more JUNIOR tokens',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'bg-amber-600',
          action: `You'll get ~${parseFloat(estimatedOutput).toFixed(4)} JUNIOR tokens`
        };
      case 'equalize':
        return {
          title: 'Equalize Risk',
          description: 'Balance your SENIOR and JUNIOR tokens',
          icon: <Scale className="w-5 h-5" />,
          color: 'bg-purple-600',
          action: 'This will balance your portfolio to equal amounts of SENIOR and JUNIOR tokens'
        };
    }
  };

  const handleExecuteTrade = useCallback(async () => {
    if (intent !== 'equalize' && (!amount || parseFloat(amount) <= 0)) {
      alert('Please enter a valid amount');
      return;
    }

    setIsExecuting(true);
    
    try {
      const amountValue = parseFloat(amount);
      const minOutput = (parseFloat(estimatedOutput) * 0.95).toString(); // 5% slippage tolerance
      
      switch (intent) {
        case 'safety':
          if (amountValue > juniorValue) {
            alert('Insufficient JUNIOR tokens');
            return;
          }
          // Swap JUNIOR to SENIOR
          await swapExactTokensForTokens(
            amount,
            minOutput,
            [juniorTokenAddress!, seniorTokenAddress!],
          );
          break;
          
        case 'upside':
          if (amountValue > seniorValue) {
            alert('Insufficient SENIOR tokens');
            return;
          }
          // Swap SENIOR to JUNIOR
          await swapExactTokensForTokens(
            amount,
            minOutput,
            [seniorTokenAddress!, juniorTokenAddress!],
          );
          break;
          
        case 'equalize':
          // Call the equalize function - no amount needed as it auto-calculates
          await handleEqualizeRisk();
          break;
      }
      
      setAmount('');
    } catch (error) {
      console.error('Trade execution failed:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  }, [intent, amount, estimatedOutput, totalAssets, seniorValue, juniorValue, seniorTokenAddress, juniorTokenAddress, swapExactTokensForTokens, withdraw]);

  const details = getIntentDetails();

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
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Quick Trade - Rebalance Your Risk
        </CardTitle>
        <p className="text-slate-400 text-sm mt-1">
          Tell us what you want to do
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Intent Selection */}
        <div>
          <Label className="text-slate-300 mb-3 block">I want to:</Label>
          <RadioGroup value={intent} onValueChange={(value) => setIntent(value as TradeIntent)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-600 hover:border-blue-500 transition-colors">
                <RadioGroupItem value="safety" id="safety" />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <Label htmlFor="safety" className="text-white font-medium cursor-pointer">
                      Get more safety
                    </Label>
                    <p className="text-slate-400 text-xs">Priority claims, lower risk</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-600 hover:border-amber-500 transition-colors">
                <RadioGroupItem value="upside" id="upside" />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <Label htmlFor="upside" className="text-white font-medium cursor-pointer">
                      Increase upside
                    </Label>
                    <p className="text-slate-400 text-xs">Higher potential, more risk</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-600 hover:border-purple-500 transition-colors">
                <RadioGroupItem value="equalize" id="equalize" />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <Label htmlFor="equalize" className="text-white font-medium cursor-pointer">
                      Equalize risk
                    </Label>
                    <p className="text-slate-400 text-xs">Balance SENIOR and JUNIOR tokens</p>
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Amount Input */}
        <div>
          <Label className="text-slate-300 mb-2 block">
            {intent === 'safety' ? 'JUNIOR Amount' : 
             intent === 'upside' ? 'SENIOR Amount' :
             'Auto-calculated (no input needed)'}
          </Label>
          <Input
            type="number"
            placeholder={intent === 'equalize' ? 'Auto-calculated' : '0.00'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={intent === 'equalize'}
            className="bg-slate-700/50 border-slate-600 text-white text-lg py-6"
          />
          <p className="text-slate-400 text-xs mt-1">
            {intent === 'safety' 
              ? `Available: ${juniorValue.toFixed(4)} JUNIOR tokens`
              : intent === 'upside'
              ? `Available: ${seniorValue.toFixed(4)} SENIOR tokens`
              : `Current: ${seniorValue.toFixed(4)} SENIOR, ${juniorValue.toFixed(4)} JUNIOR`
            }
          </p>
        </div>

        {/* Trade Preview */}
        {((amount && parseFloat(amount) > 0) || intent === 'equalize') && (
          <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
            <h4 className="text-white font-medium mb-2">Trade Preview</h4>
            <p className="text-slate-300 text-sm">
              {details.action}
            </p>
          </div>
        )}

        {/* Execute Button */}
        <Button 
          onClick={handleExecuteTrade}
          disabled={intent === 'equalize' ? isExecuting : (!amount || parseFloat(amount) <= 0 || isExecuting)}
          className={`w-full py-6 text-lg font-medium ${details.color} hover:opacity-90 transition-opacity`}
        >
          {isExecuting ? (
            'Executing...'
          ) : (
            <>
              <div className="mr-2">{details.icon}</div>
              {details.title}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickTrade;