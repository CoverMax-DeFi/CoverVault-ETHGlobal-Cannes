import React, { useEffect, useState } from 'react';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import Navbar from '@/components/Navbar';
import PhaseDisplay from '@/components/PhaseDisplay';
import TokenBalance from '@/components/TokenBalance';
import QuickTrade from '@/components/QuickTrade';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Info, DollarSign, Coins, Shield, AlertCircle } from 'lucide-react';
import { Phase } from '@/config/contracts';
import { ethers } from 'ethers';

const Dashboard = () => {
  const {
    isConnected,
    address,
    balances,
    vaultInfo,
    depositAsset,
    withdraw,
    withdrawSeniorTokens,
    withdrawAll,
    emergencyWithdraw,
    calculateWithdrawalAmounts,
  } = useWeb3();

  const [depositAmount, setDepositAmount] = useState('');
  const [depositAssetType, setDepositAssetType] = useState<'aUSDC' | 'cUSDT'>('aUSDC');
  const [withdrawSeniorAmount, setWithdrawSeniorAmount] = useState('');
  const [withdrawJuniorAmount, setWithdrawJuniorAmount] = useState('');
  const [emergencyAmount, setEmergencyAmount] = useState('');
  const [preferredAsset, setPreferredAsset] = useState<'aUSDC' | 'cUSDT'>('aUSDC');
  const [estimatedWithdrawal, setEstimatedWithdrawal] = useState({ aUSDC: '0', cUSDT: '0' });

  // Format token amounts for display
  const formatTokenAmount = (amount: bigint) => {
    return ethers.formatEther(amount);
  };

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

  // Calculate total portfolio value
  const totalPortfolioValue = 
    parseFloat(formatTokenAmount(balances.aUSDC)) +
    parseFloat(formatTokenAmount(balances.cUSDT)) +
    parseFloat(formatTokenAmount(balances.seniorTokens)) +
    parseFloat(formatTokenAmount(balances.juniorTokens));

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
          <h1 className="text-3xl font-bold text-white mb-2">CoverVault Dashboard</h1>
          <p className="text-slate-300">
            Trade and manage your risk tokens
          </p>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Portfolio"
            value={`$${totalPortfolioValue.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="CM-SENIOR Tokens"
            value={formatTokenAmount(balances.seniorTokens)}
            icon={<Shield className="h-5 w-5" />}
            description="Priority claims"
          />
          <StatCard
            title="CM-JUNIOR Tokens"
            value={formatTokenAmount(balances.juniorTokens)}
            icon={<Coins className="h-5 w-5" />}
            description="Higher yield potential"
          />
          <StatCard
            title="Vault TVL"
            value={`$${((Number(vaultInfo.aUSDCBalance) + Number(vaultInfo.cUSDTBalance)) / 1e18).toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            description="Total Value Locked"
          />
        </div>

        {/* Quick Trade Widget */}
        <div className="mb-8">
          <QuickTrade />
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Issue Risk Tokens */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Issue Risk Tokens</CardTitle>
              <CardDescription className="text-slate-300">
                Deposit assets to receive CM-SENIOR and CM-JUNIOR tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vaultInfo.currentPhase !== Phase.DEPOSIT ? (
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
                      You will receive {depositAmount || '0'} CM-SENIOR and {depositAmount || '0'} CM-JUNIOR tokens
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleDeposit} 
                    disabled={!isConnected || !depositAmount || vaultInfo.currentPhase !== Phase.DEPOSIT}
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
                Provide liquidity to earn trading fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Coming soon in full release
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">CM Tokens</CardTitle>
              <CardDescription className="text-slate-300">Your CoverVault token balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TokenBalance
                type="senior"
                balance={parseFloat(formatTokenAmount(balances.seniorTokens))}
              />
              <TokenBalance
                type="junior"
                balance={parseFloat(formatTokenAmount(balances.juniorTokens))}
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Yield Assets</CardTitle>
              <CardDescription className="text-slate-300">Your underlying asset balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TokenBalance
                type="aUSDC"
                balance={parseFloat(formatTokenAmount(balances.aUSDC))}
              />
              <TokenBalance
                type="cUSDT"
                balance={parseFloat(formatTokenAmount(balances.cUSDT))}
              />
            </CardContent>
          </Card>
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