import { useState, useEffect, useMemo } from 'react';
import { RewardsCalculator, RewardRates } from '../services/RewardsCalculator';

interface UserPositions {
  aaTokens: number;
  aTokens: number;
  liquidityProvided: number;
}

export const useClaimableRewards = (userPositions: UserPositions | null, rates: RewardRates) => {
  const [claimableAmount, setClaimableAmount] = useState(0);

  const memoizedRates = useMemo(() => rates, [rates.aaveInterestRate, rates.compoundInterestRate, rates.lpBoost]);
  const userDependencies = useMemo(() => {
    if (!userPositions) return null;
    return [userPositions.aaTokens, userPositions.aTokens, userPositions.liquidityProvided];
  }, [userPositions]);

  useEffect(() => {
    if (!userPositions) {
      setClaimableAmount(0);
      return;
    }

    const updateClaimable = () => {
      // Calculate rewards based on current positions and time elapsed
      const amount = RewardsCalculator.calculateAccruedRewards(
        userPositions,
        memoizedRates,
        new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        new Date()
      );
      setClaimableAmount(amount);
    };

    // Update immediately
    updateClaimable();

    // Update every 5 seconds
    const interval = setInterval(updateClaimable, 5000);

    return () => clearInterval(interval);
  }, [userDependencies, memoizedRates, userPositions]);

  return claimableAmount;
};
