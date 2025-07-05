
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Protocol administration and emergency controls
          </p>
        </div>

        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Admin functions can significantly affect protocol operation. Use with caution.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">

          {/* Protocol Status */}
          <Card>
            <CardHeader>
              <CardTitle>Protocol Status</CardTitle>
              <CardDescription>Current protocol state and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Phase</p>
                  <p className="text-lg font-semibold">{PHASE_NAMES[vaultInfo.currentPhase as Phase]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Emergency Mode</p>
                  <p className="text-lg font-semibold">{vaultInfo.emergencyMode ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value Locked</p>
                  <p className="text-lg font-semibold">
                    ${((Number(vaultInfo.aUSDCBalance) + Number(vaultInfo.cUSDTBalance)) / 1e18).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admin Address</p>
                  <p className="text-sm font-mono">{address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Controls */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Emergency Controls</CardTitle>
              <CardDescription>
                Emergency mode prioritizes senior token withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Emergency mode is currently: <strong>{vaultInfo.emergencyMode ? 'ACTIVE' : 'INACTIVE'}</strong>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={toggleEmergencyMode}
                  variant={vaultInfo.emergencyMode ? "outline" : "destructive"}
                  className="w-full"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {vaultInfo.emergencyMode ? 'Deactivate' : 'Activate'} Emergency Mode
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Phase Management */}
          <Card>
            <CardHeader>
              <CardTitle>Phase Management</CardTitle>
              <CardDescription>
                Control protocol lifecycle phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Phase Progression:</p>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={vaultInfo.currentPhase === Phase.DEPOSIT ? 'font-bold' : ''}>
                    Deposit (2d)
                  </span>
                  <span>→</span>
                  <span className={vaultInfo.currentPhase === Phase.COVERAGE ? 'font-bold' : ''}>
                    Coverage (3d)
                  </span>
                  <span>→</span>
                  <span className={vaultInfo.currentPhase === Phase.CLAIMS ? 'font-bold' : ''}>
                    Claims (1d)
                  </span>
                  <span>→</span>
                  <span className={vaultInfo.currentPhase === Phase.FINAL_CLAIMS ? 'font-bold' : ''}>
                    Final Claims (1d)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={forcePhaseTransition}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Force Phase Transition
                </Button>

                {vaultInfo.currentPhase === Phase.FINAL_CLAIMS && (
                  <Button
                    onClick={startNewCycle}
                    variant="default"
                    className="w-full"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start New Cycle
                  </Button>
                )}
              </div>

              {vaultInfo.currentPhase !== Phase.FINAL_CLAIMS && (
                <Alert>
                  <AlertDescription>
                    New cycles can only be started from the Final Claims phase
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
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
