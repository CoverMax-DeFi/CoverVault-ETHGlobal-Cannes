
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeFi } from '@/context/DeFiContext';
import { PercentCircle } from '@/components/PercentCircle';
import { Shield, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const InsuranceCalculator: React.FC = () => {
  const { aaTokens, aTokens, swapTokens, calculateSwapOutput, poolInfo, totalDeposited } = useDeFi();

  // Use fixed $1 display price for tokens (for UI display only)
  const displayPrice = 1.00;

  // Calculate dollar values (for display)
  const aaTokenValue = aaTokens * displayPrice;
  const aTokenValue = aTokens * displayPrice;
  const totalDollarValue = totalDeposited;

  // Memoized AMM calculations
  const calculateDynamicPrice = useCallback((fromToken: 'AA' | 'A', amount: number) => {
    if (amount <= 0) return { effectiveRate: 0, output: 0 };

    const { aaTokenReserve: aaReserve, aTokenReserve: aReserve } = poolInfo;
    const amountWithUniswapFee = amount * 0.997; // 0.3% Uniswap fee
    const amountWithFee = amountWithUniswapFee * 0.997; // Additional 0.3% platform fee
    const k = aaReserve * aReserve;

    if (fromToken === 'AA') {
      const newAAReserve = aaReserve + amountWithFee;
      const newAReserve = k / newAAReserve;
      const output = aReserve - newAReserve;
      return { output, effectiveRate: amount > 0 ? output / amount : 0 };
    }

    const newAReserve = aReserve + amountWithFee;
    const newAAReserve = k / newAReserve;
    const output = aaReserve - newAAReserve;
    return { output, effectiveRate: amount > 0 ? output / amount : 0 };
  }, [poolInfo]);

  // Calculate current coverage percentage based on total deposited
  const currentCoverage = totalDeposited > 0 ? (aaTokens / totalDeposited) * 100 : 50;

  // Consolidated state object for coverage-related data
  const [coverageState, setCoverageState] = useState({
    percentage: currentCoverage,
    capWarning: null as string | null,
    targetAaTokens: aaTokens,
    targetATokens: aTokens,
    aaToBuy: 0,
    aaToSell: 0,
  });

  // Consolidated state object for transaction details
  type RateDirection = 'AtoAA' | 'AAtoA';

  const [transactionState, setTransactionState] = useState({
    isPremium: true,
    effectiveRate: 1,
    rateDirection: 'AtoAA' as RateDirection,
    costOrProceeds: 0,
  });

  const [severity, setSeverity] = useState("100");
  const severityPercentage = useMemo(() => parseInt(severity), [severity]);

  // Calculate initial trade requirements when coverage changes
  // Memoized calculation of maximum possible coverage
  const maxPossibleCoverage = useMemo(() => {
    if (!aTokens || !totalDollarValue) return currentCoverage;
    const maxResult = calculateDynamicPrice('A', aTokens);
    const maxPossibleAA = maxResult.output;
    return ((aaTokens + maxPossibleAA) * displayPrice / totalDollarValue) * 100;
  }, [aTokens, aaTokens, totalDollarValue, displayPrice, calculateDynamicPrice]);

  // Memoized calculation of trade amounts
  const calculateTradeAmounts = useCallback((targetPercentage: number) => {
    const targetAaTokenValue = (totalDollarValue * targetPercentage) / 100;
    const targetAaTokens = targetAaTokenValue / displayPrice;

    if (targetAaTokens > aaTokens) {
      return {
        aaToBuy: targetAaTokens - aaTokens,
        aaToSell: 0,
        targetAaTokens,
        targetATokens: Math.max(0, aTokens - ((targetAaTokens - aaTokens) / transactionState.effectiveRate))
      };
    } else if (targetAaTokens < aaTokens) {
      return {
        aaToBuy: 0,
        aaToSell: aaTokens - targetAaTokens,
        targetAaTokens,
        targetATokens: Math.max(0, aTokens + ((aaTokens - targetAaTokens) * transactionState.effectiveRate))
      };
    }

    return {
      aaToBuy: 0,
      aaToSell: 0,
      targetAaTokens: aaTokens,
      targetATokens: aTokens
    };
  }, [totalDollarValue, displayPrice, aaTokens, aTokens, transactionState.effectiveRate]);

  // Update coverage state when percentage changes
  useEffect(() => {
    if (coverageState.percentage > maxPossibleCoverage && maxPossibleCoverage > currentCoverage) {
      setCoverageState(prev => ({
        ...prev,
        percentage: maxPossibleCoverage,
        capWarning: `Maximum possible coverage is ${maxPossibleCoverage.toFixed(1)}%`
      }));
      return;
    }

    const tradeAmounts = calculateTradeAmounts(coverageState.percentage);
    setCoverageState(prev => ({
      ...prev,
      ...tradeAmounts,
      capWarning: null
    }));
  }, [coverageState.percentage, maxPossibleCoverage, currentCoverage, calculateTradeAmounts]);

  // Display values reflect actual holdings after pending swaps
  const targetAaDisplayValue = (coverageState.targetAaTokens || 0) * displayPrice;
  const targetADisplayValue = Math.max(0, (coverageState.targetATokens || 0)) * displayPrice;

  // Calculate emergency scenario outcomes based on severity
  // AA tokens are always fully recovered
  const emergencyProtectedAmount = (coverageState.targetAaTokens || 0) * displayPrice;

  // A tokens recovery is inversely proportional to severity
  const aTokenRecoveryRate = Math.max(0, 1 - (severityPercentage / 100));
  const emergencyUnprotectedAmount = (coverageState.targetATokens || 0) * displayPrice * aTokenRecoveryRate;

  // Calculate total recovery and loss
  const totalRecoveredValue = emergencyProtectedAmount + emergencyUnprotectedAmount;
  const totalPossibleLoss = (coverageState.targetATokens || 0) * displayPrice * (severityPercentage / 100);

  // Potential loss avoided - what this coverage level saves compared to having only A tokens
  const lossAvoided = emergencyProtectedAmount - ((coverageState.targetAaTokens || 0) * displayPrice * aTokenRecoveryRate);

  const calculateRequiredInput = useCallback((fromToken: 'AA' | 'A', desiredOutput: number) => {
    if (desiredOutput <= 0) return { requiredInput: 0, effectiveRate: 0 };

    const { aaTokenReserve, aTokenReserve } = poolInfo;
    const [reserveIn, reserveOut] = fromToken === 'AA'
      ? [aaTokenReserve, aTokenReserve]
      : [aTokenReserve, aaTokenReserve];

    const amountInBeforeFee = (reserveIn * reserveOut) / (reserveOut - desiredOutput) - reserveIn;
    const amountInAfterUniswap = amountInBeforeFee / 0.997; // Account for Uniswap fee
    const amountIn = amountInAfterUniswap / 0.997; // Account for platform fee

    return {
      requiredInput: amountIn,
      effectiveRate: amountIn > 0 ? desiredOutput / amountIn : 0
    };
  }, [poolInfo]);

  // Update transaction details based on trade amounts
  useEffect(() => {
    const { aaToBuy, aaToSell } = coverageState;

    if (aaToBuy > 0) {
      const maxResult = calculateDynamicPrice('A', aTokens);
      const maxPossibleAA = maxResult.output;

      if ((aaTokens + maxPossibleAA) * displayPrice / totalDollarValue * 100 <= coverageState.percentage) {
        setTransactionState({
          isPremium: true,
          effectiveRate: aTokens > 0 ? maxPossibleAA / aTokens : 0,
          rateDirection: 'AtoAA',
          costOrProceeds: aTokens
        });
      } else {
        const buyResult = calculateRequiredInput('A', aaToBuy);
        setTransactionState({
          isPremium: true,
          effectiveRate: buyResult.effectiveRate,
          rateDirection: 'AtoAA',
          costOrProceeds: buyResult.requiredInput
        });
      }
    } else if (aaToSell > 0) {
      const sellResult = calculateDynamicPrice('AA', aaToSell);
      setTransactionState({
        isPremium: false,
        effectiveRate: sellResult.effectiveRate,
        rateDirection: 'AAtoA',
        costOrProceeds: sellResult.output
      });
    } else if (coverageState.percentage !== currentCoverage) {
      const spotRate = coverageState.percentage > currentCoverage
        ? (poolInfo.aTokenReserve > 0 ? poolInfo.aaTokenReserve / poolInfo.aTokenReserve : 1)
        : (poolInfo.aaTokenReserve > 0 ? poolInfo.aTokenReserve / poolInfo.aaTokenReserve : 1);
      setTransactionState({
        isPremium: coverageState.percentage > currentCoverage,
        effectiveRate: spotRate,
        rateDirection: coverageState.percentage > currentCoverage ? 'AtoAA' : 'AAtoA',
        costOrProceeds: 0
      });
    }
  }, [coverageState, currentCoverage, calculateDynamicPrice, calculateRequiredInput, aaTokens, aTokens, totalDollarValue, displayPrice, poolInfo]);

  // Memoized handler and calculations
  const handleAdjustCoverage = useCallback(() => {
    const { aaToBuy, aaToSell } = coverageState;
    const { costOrProceeds } = transactionState;

    if (aaToBuy > 0 && costOrProceeds <= aTokens) {
      console.log(`Buying insurance: Swapping ${costOrProceeds.toFixed(2)} A for ${aaToBuy.toFixed(2)} AA. Pool: Protected ${poolInfo.aaTokenReserve.toFixed(2)} AA, Standard ${poolInfo.aTokenReserve.toFixed(2)} A`);
      swapTokens('A', costOrProceeds);
    } else if (aaToSell > 0) {
      console.log(`Selling insurance: Swapping ${aaToSell.toFixed(2)} AA for ${costOrProceeds.toFixed(2)} A. Pool: Protected ${poolInfo.aaTokenReserve.toFixed(2)} AA, Standard ${poolInfo.aTokenReserve.toFixed(2)} A`);
      swapTokens('AA', aaToSell);
    }
  }, [coverageState, transactionState, aTokens, swapTokens]);

  const premiumOrDiscount = useMemo(() => {
    const { aaToBuy, aaToSell } = coverageState;
    const { costOrProceeds } = transactionState;

    if (aaToBuy > 0) {
      return costOrProceeds - aaToBuy;
    } else if (aaToSell > 0) {
      return aaToSell - costOrProceeds;
    }
    return 0;
  }, [coverageState, transactionState]);

  // Memoized checks and calculations
  const canAdjust = useMemo(() => {
    const { aaToBuy, aaToSell } = coverageState;
    const { costOrProceeds } = transactionState;

    return (aaToBuy > 0 && costOrProceeds <= aTokens) ||
           (aaToSell > 0 && aaToSell <= aaTokens) ||
           (aaToBuy === 0 && aaToSell === 0);
  }, [coverageState, transactionState, aTokens, aaTokens]);

  // Calculate effective protection percentage based on total deposited
  const effectiveProtectionPercent = totalDeposited > 0 ? (aaTokens / totalDeposited) * 100 : 0;

  const rateDisplayString = useMemo(() => {
    const { rateDirection, effectiveRate } = transactionState;
    const safeRate = isNaN(effectiveRate) || !isFinite(effectiveRate) ? 0 : effectiveRate;
    return rateDirection === 'AtoAA'
      ? `1 A ≈ ${safeRate.toFixed(4)} AA`
      : `1 AA ≈ ${safeRate.toFixed(4)} A`;
  }, [transactionState]);

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow" data-intro-id="insurance-calculator-card">
      <CardHeader>
        <CardTitle>Choose How Much Money to Protect</CardTitle>
        <CardDescription>
          Decide how much of your money you want to keep extra safe during emergencies. More protection costs a small fee, but gives you peace of mind.
        </CardDescription>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
          <p className="text-blue-700 text-sm">
            💡 <strong>Remember:</strong> You can always get your safety fees back by resetting to 50% protection level - as long as there's been no hack!
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coverage Percentage Selector */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Label className="text-base">How Much to Protect</Label>
            <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {coverageState.percentage.toFixed(0)}% Safe Money
            </span>
          </div>

          <div className="flex items-center gap-8">
            <div className="w-full">
              <Slider
                data-intro-id="protection-slider"
                min={0}
                max={100}
                step={1}
                value={[coverageState.percentage]}
                onValueChange={(value) => {
                  const newValue = value[0];

                  if (newValue > currentCoverage) {
                    if (newValue > maxPossibleCoverage) {
                      setCoverageState(prev => ({
                        ...prev,
                        percentage: maxPossibleCoverage,
                        capWarning: `Setting to maximum possible coverage of ${maxPossibleCoverage.toFixed(1)}%`
                      }));
                      return;
                    }
                  } else if (newValue < currentCoverage) {
                    const aaTokensNeeded = (currentCoverage - newValue) * totalDollarValue / 100 / displayPrice;
                    if (aaTokensNeeded > aaTokens) {
                      setCoverageState(prev => ({
                        ...prev,
                        capWarning: `Cannot decrease protection further - insufficient AA tokens (${aaTokens.toFixed(2)} available)`
                      }));
                      return;
                    }
                  }

                  setCoverageState(prev => ({
                    ...prev,
                    percentage: newValue,
                    capWarning: null
                  }));
                }}
                className="w-full"
              />
              {coverageState.capWarning && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
                  {coverageState.capWarning}
                </div>
              )}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>More Risk</span>
                <span>Balanced</span>
                <span>Extra Safe</span>
              </div>
            </div>
            <div className="shrink-0">
              <PercentCircle
                percentage={coverageState.percentage}
                size={80}
                strokeWidth={8}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <p>Currently protected: <span className="font-medium">{effectiveProtectionPercent.toFixed(1)}%</span> of your money (${aaTokenValue.toFixed(2)})</p>
            <p className="text-xs mt-1">
              Your money is split between protected (extra safe) and regular accounts.
              The safety fee is higher for larger amounts - like paying more for better insurance.
            </p>
          </div>
        </div>

        {/* Visual Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4" data-intro-id="protection-outputs-section">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1 text-blue-600" />
              Protected Money (First in Line)
            </h3>
            <p className="text-xl font-semibold">${targetAaDisplayValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.max(0, isNaN(coverageState.targetAaTokens) ? 0 : coverageState.targetAaTokens).toFixed(2)} Protected Units
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-1 text-amber-600" strokeWidth={1} />
              Regular Money
            </h3>
            <p className="text-xl font-semibold">${targetADisplayValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.max(0, isNaN(coverageState.targetATokens) ? 0 : coverageState.targetATokens).toFixed(2)} Regular Units
            </p>
          </div>
        </div>

        {/* Transaction Details */}
        {(coverageState.aaToBuy > 0 || coverageState.aaToSell > 0) && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium mb-3">What This Will Cost</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Safety Fee</span>
                <span className={transactionState.isPremium ? "text-amber-700" : "text-green-700"}>
                  ${Math.abs(premiumOrDiscount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee (0.3%)</span>
                <span className="text-gray-700">
                  ${(transactionState.costOrProceeds * 0.003).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">What's Happening</span>
                <span>
                  {transactionState.isPremium
                    ? `Moving $${Math.max(0, transactionState.costOrProceeds).toFixed(2)} to Protected`
                    : `Moving $${Math.max(0, transactionState.costOrProceeds).toFixed(2)} to Regular`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Exchange Rate</span>
                <span>{rateDisplayString.replace('A', 'Regular').replace('AA', 'Protected')}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {transactionState.isPremium ? (
                  <span>
                    Fees help keep the system running smoothly and safely for everyone. You can get these fees back by moving money back to regular status later (if no hack occurs).
                  </span>
                ) : (
                  <span>
                    Moving money from protected back to regular status returns most of your safety fees to you.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Scenario */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100" data-intro-id="emergency-scenario-section">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-amber-800">What If Something Bad Happens?</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    See how much money you'd keep safe in different emergency situations. Protected money gets you to the front of the line to withdraw first.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Severity Selector */}
          <div className="mb-3">
            <Label htmlFor="severity" className="text-sm text-amber-800 mb-1 block">
              How Bad is the Emergency:
            </Label>
            <Select
              value={severity}
              onValueChange={setSeverity}
            >
              <SelectTrigger id="severity" className="w-full bg-white" data-intro-id="severity-select">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25% - Small Problem</SelectItem>
                <SelectItem value="50">50% - Medium Problem</SelectItem>
                <SelectItem value="75">75% - Big Problem</SelectItem>
                <SelectItem value="100">100% - Worst Case (Everything Lost)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-amber-700 mt-1">
              In a {severityPercentage}% emergency, regular money loses {severityPercentage}% of its value
            </p>
          </div>

          <div className="space-y-2" data-intro-id="emergency-outcome-display">
            <div className="flex justify-between text-sm">
              <span>Protected money you get back right away</span>
              <span className="font-medium">${emergencyProtectedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Regular money you might get back</span>
              <span className="font-medium">${emergencyUnprotectedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-amber-200">
              <span>Total money you'd keep</span>
              <span>${totalRecoveredValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-800 mt-2">
              <span>Extra money saved by protection</span>
              <span>${lossAvoided.toFixed(2)}</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              This shows how much more money you'd keep by having protection versus keeping everything in regular accounts
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          data-intro-id="apply-protection-button"
          onClick={handleAdjustCoverage}
          disabled={!canAdjust || (transactionState.costOrProceeds === 0)}
          className="w-full bg-vault-primary hover:bg-vault-primary-dark"
        >
          {!canAdjust
            ? transactionState.isPremium ? "Not enough regular money" : "Not enough protected money"
            : transactionState.costOrProceeds === 0
            ? "Already at this protection level"
            : `Set protection to ${coverageState.percentage.toFixed(0)}% (Fee: $${Math.abs(premiumOrDiscount).toFixed(2)})`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InsuranceCalculator;
