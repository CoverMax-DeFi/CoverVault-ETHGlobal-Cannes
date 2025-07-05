import { useState, useEffect, useCallback, useMemo } from 'react';
import { RewardsCalculator, RewardRates, UserPositions } from '../services/RewardsCalculator';

interface UseVisualRewardsParams {
  userPositions: UserPositions;
  rates: RewardRates;
  initialRewardsAmount?: number;
}

export const useVisualRewards = ({
  userPositions,
  rates,
  initialRewardsAmount = 0
}: UseVisualRewardsParams) => {
  const [visualRewards, setVisualRewards] = useState(initialRewardsAmount);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Calculate per-millisecond earnings for smooth visual updates
  const perMsEarnings = useMemo(() => {
    return RewardsCalculator.calculatePerMsEarnings(userPositions, rates);
  }, [userPositions, rates]);

  // Reset visual rewards (useful when rewards are claimed)
  const resetVisualRewards = useCallback(() => {
    setVisualRewards(0);
    setLastUpdateTime(Date.now());
  }, []);

  // Update visual rewards based on time elapsed
  useEffect(() => {
    if (perMsEarnings <= 0) {
      return;
    }

    const updateVisualRewards = () => {
      const now = Date.now();
      const timeDiff = now - lastUpdateTime;
      
      setVisualRewards(prev => prev + (perMsEarnings * timeDiff));
      setLastUpdateTime(now);
    };

    // Update every 100ms for smooth visual effect
    const interval = setInterval(updateVisualRewards, 100);

    return () => clearInterval(interval);
  }, [perMsEarnings, lastUpdateTime]);

  // Calculate current APY for display
  const currentAPY = useMemo(() => {
    return RewardsCalculator.calculateAPY(userPositions, rates);
  }, [userPositions, rates]);

  return {
    visualRewards,
    currentAPY,
    perMsEarnings,
    resetVisualRewards
  };
};
