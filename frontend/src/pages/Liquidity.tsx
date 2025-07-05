
import React, { useState } from 'react';
import { useDeFi } from '@/context/DeFiContext';
import Navbar from '@/components/Navbar';
import ActionCard from '@/components/ActionCard';
import StatCard from '@/components/StatCard';
import CycleStatus from '@/components/CycleStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ShieldAlert } from 'lucide-react';

const Liquidity = () => {
  const {
    balance,
    liquidityProvided,
    poolInfo,
    lpBoost,
    aaveInterestRate,
    compoundInterestRate,
    cycleInfo,
    addLiquidity,
    removeLiquidity,
    calculateImpermanentLoss
  } = useDeFi();

  const [priceChange, setPriceChange] = useState(20); // Example price change percentage


  // Calculate user's pool share as a percentage
  const userPoolShare = poolInfo.userShare * 100;

  // Calculate impermanent loss based on a simulated price change
  const impermanentLossPercent = calculateImpermanentLoss(1, 1 + priceChange / 100) * 100;

  // Calculate base APY from Aave and Compound
  const baseAPY = ((aaveInterestRate + compoundInterestRate) / 2) * 100;

  // Calculate boosted APY for LP providers
  const boostedAPY = baseAPY + (lpBoost * 100);

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
        <h1 className="text-3xl font-bold mb-6 text-white">Help Others & Earn Extra Money</h1>

        {cycleInfo.isEmergencyMode && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-700 backdrop-blur-sm">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle className="text-red-400">Emergency Mode Active</AlertTitle>
            <AlertDescription className="text-red-300">
              During emergencies, helping others access their protected money may affect how much you earn.
              Think about your comfort level before adding or removing your help.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="How Much You're Helping"
            value={`$${liquidityProvided.toFixed(2)}`}
            description={`Your share: ${userPoolShare.toFixed(2)}% of total help fund`}
            label="Money you've put in to help others move between protected and regular accounts"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3v12"/>
                <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path d="M15 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
                <path d="M18 6l-6.5 3.5"/>
                <path d="M15 18l-6.5-3.5"/>
              </svg>
            }
          />
          <StatCard
            title="Total Help Fund"
            value={`$${poolInfo.totalLiquidity.toFixed(2)}`}
            description={`Split: ${poolInfo.aaTokenReserve.toFixed(0)} Protected / ${poolInfo.aTokenReserve.toFixed(0)} Regular`}
            label="Total money available to help people move between protected and regular accounts"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M19 5L5 19"/>
              </svg>
            }
          />
          <StatCard
            title="Extra Money You Earn"
            value={`${boostedAPY.toFixed(2)}%`}
            description={`Normal ${baseAPY.toFixed(2)}% + ${(lpBoost * 100).toFixed(0)}% bonus for helping`}
            label="How much your money grows per year for helping others with their accounts"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6"/>
                <path d="M12 9v12"/>
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="md:col-span-3 lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">How Helping Others Works</CardTitle>
                <CardDescription className="text-slate-300">
                  The good and not-so-good parts of helping others with their money
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-slate-300">
                  <strong className="text-white">Extra Money:</strong> When you help others, you earn the normal interest rate of {(aaveInterestRate * 100).toFixed(1)}% to {(compoundInterestRate * 100).toFixed(1)}%, plus a {(lpBoost * 100).toFixed(0)}% bonus for being helpful.
                </p>

                <p className="text-slate-300">
                  <strong className="text-white">Money Changes:</strong> How much you earn can change if people suddenly want more protected accounts or more regular accounts, especially during emergencies.
                </p>

                <p className="text-slate-300">
                  <strong className="text-white">Emergency Times:</strong> During emergencies, everyone wants protected accounts more than regular ones, which can change how much you earn for helping.
                </p>

                <p className="text-slate-300">
                  <strong className="text-white">Fair Pay:</strong> The {(lpBoost * 100).toFixed(0)}% bonus is your reward for helping out. Think about how comfortable you are before deciding how much to help with.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Start Helping Others</CardTitle>
              <CardDescription className="text-slate-300">
                Help people move between protected and regular accounts while earning 30% extra interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ActionCard
                  title="Start Helping"
                  description="Put in money to help others"
                  buttonText="Start Helping"
                  maxValue={balance}
                  onAction={addLiquidity}
                />
                <div className="mt-8 bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded backdrop-blur-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-300">
                        When you help, you'll get a receipt showing how much of the help fund is yours.
                        Remember to check what day it is and if there's an emergency before helping.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Stop Helping</CardTitle>
              <CardDescription className="text-slate-300">
                Take back your money from the help fund
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ActionCard
                  title="Stop Helping"
                  description="Take back some or all of your help money"
                  buttonText="Stop Helping"
                  isPercentage={true}
                  maxValue={100}
                  isWithdraw={true}
                  onAction={removeLiquidity}
                />
                <div className="mt-8 bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded backdrop-blur-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-300">
                        Taking back your help money will give you your share of protected and regular accounts based on what's currently available.
                        {cycleInfo.isEmergencyMode && " During emergencies, remember that protected money gets priority over regular money."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-white">What If Things Change?</h2>
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-4 text-white">What People Want Calculator</h3>
                  <p className="text-sm text-slate-300 mb-4">
                    See how changes in what people want (protected vs regular accounts) might affect how much you earn.
                    {cycleInfo.isEmergencyMode && " During emergencies, everyone usually wants protected accounts more."}
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+100%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      value={priceChange}
                      onChange={(e) => setPriceChange(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center">
                      <span className="font-medium text-white">
                        Want change: {priceChange > 0 ? '+' : ''}{priceChange}%
                      </span>
                      <p className="text-sm text-slate-400 mt-1">
                        How much more or less people want regular accounts compared to protected ones
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-4 text-white">How It Affects You</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Money Impact:</span>
                      <span className="font-medium text-red-400">-{impermanentLossPercent.toFixed(2)}%</span>
                    </div>
                    <Progress value={impermanentLossPercent} max={15} className="h-2" />
                    <p className="text-sm text-slate-300 mt-2">
                      If you helped with ${liquidityProvided.toFixed(2)} and what people wanted changed by {priceChange}%,
                      you would earn about ${(liquidityProvided * impermanentLossPercent / 100).toFixed(2)} less compared
                      to just keeping your money in your own account.
                    </p>
                    <div className="bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded mt-4 backdrop-blur-sm">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Info className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-indigo-300">
                            Your 30% bonus interest and fees you earn from helping others change their account types help make up for this loss.
                            {cycleInfo.isEmergencyMode ? " During emergencies, what people want can change a lot more." : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Liquidity;
