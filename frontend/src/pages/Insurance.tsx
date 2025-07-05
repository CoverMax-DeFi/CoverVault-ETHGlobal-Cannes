import React, { useEffect } from 'react';
import { useDeFi } from '@/context/DeFiContext';
import Navbar from '@/components/Navbar';
import InsuranceCalculator from '@/components/InsuranceCalculator';
import StatCard from '@/components/StatCard';
import TokenBalance from '@/components/TokenBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Shield } from 'lucide-react';

const Insurance = () => {
  const {
    balance,
    aaTokens,
    aTokens,
    poolInfo,
    cycleInfo,
    aaveInterestRate,
    compoundInterestRate,
    totalDeposited
  } = useDeFi();

  useEffect(() => {
    console.log("Insurance Page Loaded:");
    console.log(`  User's Protected (AA) Tokens: ${aaTokens.toFixed(2)}`);
    console.log(`  User's Standard (A) Tokens: ${aTokens.toFixed(2)}`);
    console.log(`  Liquidity Pool - Protected (AA) Reserve: ${poolInfo.aaTokenReserve.toFixed(2)}`);
    console.log(`  Liquidity Pool - Standard (A) Reserve: ${poolInfo.aTokenReserve.toFixed(2)}`);
  }, [aaTokens, aTokens, poolInfo]);


  // Calculate the average APY from Aave and Compound
  const averageAPY = ((aaveInterestRate + compoundInterestRate) / 2) * 100;

  // Calculate protection percentage based on total deposited amount
  const effectiveCoveragePercent = totalDeposited > 0 ? (aaTokens / totalDeposited) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6" data-intro-id="insurance-page-title">Protect Your Money</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-intro-id="insurance-stat-cards-container">
          <StatCard
            title="Available Money"
            value={`$${balance.toFixed(2)}`}
            description="Ready to invest or move around"
            label="Money you can put into protected or regular savings"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 5H6a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
                <path d="M8 10h8"/>
                <path d="M8 14h4"/>
              </svg>
            }
          />
          <StatCard
            title="How Much is Protected"
            value={`${effectiveCoveragePercent.toFixed(0)}%`}
            description={`Protected Money: $${aaTokens.toFixed(2)}`}
            label="How much of your money is currently in the safe, protected account"
            icon={<Shield className="h-6 w-6" />}
          />
          <StatCard
            title="Total Money in System"
            value={`$${poolInfo.totalLiquidity.toFixed(2)}`}
            description={`Split: ${poolInfo.aaTokenReserve.toFixed(0)} Protected / ${poolInfo.aTokenReserve.toFixed(0)} Regular`}
            label="Total money saved by everyone using this system, showing how much is protected vs regular"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M19 5L5 19"/>
              </svg>
            }
          />
        </div>

        {cycleInfo.isEmergencyMode && (
          <Alert variant="destructive" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Emergency Mode Active</AlertTitle>
            <AlertDescription>
              People with protected money can withdraw first during emergencies. Your protection level: {effectiveCoveragePercent.toFixed(1)}%
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <InsuranceCalculator />
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Your Money</h2>
            <TokenBalance
              type="protected"
              balance={aaTokens}
              interestRate={(aaveInterestRate + compoundInterestRate) / 2}
              className="mb-4"
            />
            <TokenBalance
              type="standard"
              balance={aTokens}
              interestRate={(aaveInterestRate + compoundInterestRate) / 2}
            />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">How Protection Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Growing Your Money</h4>
                  <p className="text-gray-600">
                    All your money earns {averageAPY.toFixed(2)}% per year from secure lending platforms. Both protected and regular money
                    earn the same rate - the only difference is the level of safety during emergencies.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Emergency Safety</h4>
                  <p className="text-gray-600">
                    If something bad happens to the system, protected money gets withdrawn first - like having a VIP pass to the front of the line.
                    You can always move money from regular to protected status for extra safety.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Small Fees for Safety</h4>
                  <p className="text-gray-600">
                    Both protected and regular money keep their value and earn the same interest. The only difference is priority access during emergencies.
                    There's a small fee when you move money to protected status - like paying for insurance.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                    <p className="text-green-700 text-sm font-medium">
                      ✅ <strong>Good News:</strong> You can get your safety fee back anytime by moving your money back to regular status - as long as there hasn't been a hack!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insurance;
