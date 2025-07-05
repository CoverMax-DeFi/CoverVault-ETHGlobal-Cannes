
import React from 'react';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, RefreshCw, PlayCircle } from 'lucide-react';
import { Phase, PHASE_NAMES } from '@/config/contracts';

const Admin = () => {
  const {
    isConnected,
    address,
    vaultInfo,
    toggleEmergencyMode,
    forcePhaseTransition,
    startNewCycle,
  } = useWeb3();

  if (!isConnected) {
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
          <Alert className="bg-slate-800/50 border-slate-700 text-slate-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to access admin functions
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-300">
            Protocol administration and emergency controls
          </p>
        </div>

        <Alert className="mb-6 bg-red-900/20 border-red-700 backdrop-blur-sm" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
            <strong>Warning:</strong> Admin functions can significantly affect protocol operation. Use with caution.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">

          {/* Protocol Status */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Protocol Status</CardTitle>
              <CardDescription className="text-slate-300">Current protocol state and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Current Phase</p>
                  <p className="text-lg font-semibold text-white">{PHASE_NAMES[vaultInfo.currentPhase as Phase]}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Emergency Mode</p>
                  <p className="text-lg font-semibold text-white">{vaultInfo.emergencyMode ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Value Locked</p>
                  <p className="text-lg font-semibold text-white">
                    ${((Number(vaultInfo.aUSDCBalance) + Number(vaultInfo.cUSDTBalance)) / 1e18).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Admin Address</p>
                  <p className="text-sm font-mono text-slate-300">{address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Controls */}
          <Card className="bg-red-900/20 border-red-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-red-400">Emergency Controls</CardTitle>
              <CardDescription className="text-red-300">
                Emergency mode prioritizes senior token withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Emergency mode is currently: <strong>{vaultInfo.emergencyMode ? 'ACTIVE' : 'INACTIVE'}</strong>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={toggleEmergencyMode}
                  variant={vaultInfo.emergencyMode ? "outline" : "destructive"}
                  className={vaultInfo.emergencyMode ? "w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500" : "w-full bg-red-600 hover:bg-red-700"}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {vaultInfo.emergencyMode ? 'Deactivate' : 'Activate'} Emergency Mode
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Phase Management */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Phase Management</CardTitle>
              <CardDescription className="text-slate-300">
                Control protocol lifecycle phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-slate-400 mb-2">Phase Progression:</p>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={vaultInfo.currentPhase === Phase.DEPOSIT ? 'font-bold text-white' : 'text-slate-300'}>
                    Deposit (2d)
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={vaultInfo.currentPhase === Phase.COVERAGE ? 'font-bold text-white' : 'text-slate-300'}>
                    Coverage (3d)
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={vaultInfo.currentPhase === Phase.CLAIMS ? 'font-bold text-white' : 'text-slate-300'}>
                    Claims (1d)
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={vaultInfo.currentPhase === Phase.FINAL_CLAIMS ? 'font-bold text-white' : 'text-slate-300'}>
                    Final Claims (1d)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={forcePhaseTransition}
                  variant="outline"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Phase Transition
                </Button>

                {vaultInfo.currentPhase === Phase.FINAL_CLAIMS && (
                  <Button
                    onClick={startNewCycle}
                    variant="default"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start New Cycle
                  </Button>
                )}
              </div>

              {vaultInfo.currentPhase !== Phase.FINAL_CLAIMS && (
                <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                  <AlertDescription>
                    New cycles can only be started from the Final Claims phase
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Admin Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>• Emergency mode should only be activated when one of the yield sources experiences a significant loss event</p>
              <p>• Phase transitions normally occur automatically based on time</p>
              <p>• Force phase transition should only be used in exceptional circumstances</p>
              <p>• Starting a new cycle resets the protocol to the Deposit phase</p>
              <p>• Only the contract owner can access these functions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
