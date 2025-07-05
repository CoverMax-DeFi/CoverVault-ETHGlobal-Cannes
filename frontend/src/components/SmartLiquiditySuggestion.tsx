import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets } from 'lucide-react';

interface SmartLiquiditySuggestionProps {
  isVisible: boolean;
  seniorValue: number;
  juniorValue: number;
  isExecuting: boolean;
  isConnected: boolean;
  onAddLiquidity: () => void;
  onDismiss: () => void;
}

const SmartLiquiditySuggestion: React.FC<SmartLiquiditySuggestionProps> = ({
  isVisible,
  seniorValue,
  juniorValue,
  isExecuting,
  isConnected,
  onAddLiquidity,
  onDismiss,
}) => {
  if (!isVisible || seniorValue <= 0.01 || juniorValue <= 0.01) {
    return null;
  }

  return (
    <Card className="bg-slate-800/50 border-blue-600/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <Droplets className="w-6 h-6 mr-2" />
          Smart Liquidity Suggestion
        </CardTitle>
        <p className="text-slate-300">
          You just earned tokens! Add them to the liquidity pool to earn trading fees.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <div>
            <p className="text-white font-medium">Available tokens:</p>
            <p className="text-slate-300 text-sm">
              {seniorValue.toFixed(4)} SENIOR + {juniorValue.toFixed(4)} JUNIOR
            </p>
            <p className="text-slate-300 text-xs opacity-80">
              Will add optimal amounts to match pool ratio
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={onAddLiquidity}
              disabled={!isConnected || (seniorValue <= 0 && juniorValue <= 0) || isExecuting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Droplets className="w-4 h-4 mr-2" />
              Add to Pool
            </Button>
            <Button 
              onClick={onDismiss}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartLiquiditySuggestion;