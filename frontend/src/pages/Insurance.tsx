import React, { useEffect } from 'react';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import Navbar from '@/components/Navbar';
import InsuranceCalculator from '@/components/InsuranceCalculator';
import StatCard from '@/components/StatCard';
import TokenBalance from '@/components/TokenBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Shield } from 'lucide-react';
import { PHASE_NAMES } from '@/config/contracts';
import { ethers } from 'ethers';

const Insurance = () => {
  const {
    isConnected,
    balances,
    vaultInfo,
    depositAsset,
    withdraw,
    withdrawSeniorTokens,
    withdrawAll,
    emergencyWithdraw,
    connectWallet
  } = useWeb3();

  useEffect(() => {
    console.log("Insurance Page Loaded:");
    console.log(`  User's Senior Tokens: ${ethers.formatEther(balances.seniorTokens)}`);
    console.log(`  User's Junior Tokens: ${ethers.formatEther(balances.juniorTokens)}`);
    console.log(`  Vault aUSDC Balance: ${ethers.formatEther(vaultInfo.aUSDCBalance)}`);
    console.log(`  Vault cUSDT Balance: ${ethers.formatEther(vaultInfo.cUSDTBalance)}`);
  }, [balances, vaultInfo]);


  // Calculate total user tokens and values
  const totalUserTokens = balances.seniorTokens + balances.juniorTokens;
  const seniorTokenValue = parseFloat(ethers.formatEther(balances.seniorTokens));
  const juniorTokenValue = parseFloat(ethers.formatEther(balances.juniorTokens));
  const totalUserValue = seniorTokenValue + juniorTokenValue;
  const aUSDCBalance = parseFloat(ethers.formatEther(balances.aUSDC));
  const cUSDTBalance = parseFloat(ethers.formatEther(balances.cUSDT));
  const availableBalance = aUSDCBalance + cUSDTBalance;
  
  // Calculate protection percentage based on senior tokens
  const effectiveCoveragePercent = totalUserValue > 0 ? (seniorTokenValue / totalUserValue) * 100 : 0;

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
        <h1 className="text-3xl font-bold mb-6 text-white" data-intro-id="insurance-page-title">Protect Your Money</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-intro-id="insurance-stat-cards-container">
          <StatCard
            title="Available Assets"
            value={`$${availableBalance.toFixed(2)}`}
            description="aUSDC + cUSDT ready to deposit"
            label="Money you can deposit into the vault for protection"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 5H6a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
                <path d="M8 10h8"/>
                <path d="M8 14h4"/>
              </svg>
            }
          />
          <StatCard
            title="Protection Level"
            value={`${effectiveCoveragePercent.toFixed(0)}%`}
            description={`Senior Tokens: ${seniorTokenValue.toFixed(2)}`}
            label="How much of your vault position is in senior tokens (priority withdrawal)"
            icon={<Shield className="h-6 w-6" />}
          />
          <StatCard
            title="Protocol Phase"
            value={PHASE_NAMES[vaultInfo.currentPhase]}
            description={`Emergency: ${vaultInfo.emergencyMode ? 'Active' : 'Inactive'}`}
            label="Current protocol phase and emergency status"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M19 5L5 19"/>
              </svg>
            }
          />
        </div>

        {vaultInfo.emergencyMode && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-700 backdrop-blur-sm">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-red-400">Emergency Mode Active</AlertTitle>
            <AlertDescription className="text-red-300">
              Senior token holders can withdraw first during emergencies. Your protection level: {effectiveCoveragePercent.toFixed(1)}%
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <InsuranceCalculator />
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Your Tokens</h2>
            <TokenBalance
              type="senior"
              balance={seniorTokenValue}
              interestRate={0}
              className="mb-4"
            />
            <TokenBalance
              type="junior"
              balance={juniorTokenValue}
              interestRate={0}
            />

            <Card className="mt-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">How Protection Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Dual Token System</h4>
                  <p className="text-slate-300">
                    When you deposit assets (aUSDC or cUSDT), you receive equal amounts of senior and junior tokens.
                    Both tokens represent your claim on the vault's assets.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-white">Priority Withdrawals</h4>
                  <p className="text-slate-300">
                    Senior tokens get priority during withdrawals, especially in emergency mode.
                    Junior tokens are withdrawn after senior tokens are processed.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-white">Protocol Phases</h4>
                  <p className="text-slate-300">
                    The protocol operates in cycles with different phases: Deposit, Coverage, Claims, and Final Claims.
                    Each phase has specific rules for deposits and withdrawals.
                  </p>
                  <div className="bg-blue-900/20 border border-blue-700 rounded-md p-3 mt-2 backdrop-blur-sm">
                    <p className="text-blue-400 text-sm font-medium">
                      ℹ️ <strong>Current Phase:</strong> {PHASE_NAMES[vaultInfo.currentPhase]}
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
