
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Building2, Landmark } from 'lucide-react';

interface TokenBalanceProps {
  type: 'protected' | 'standard' | 'LP';
  balance: number;
  interestRate?: number;
  className?: string;
}

const TokenBalance: React.FC<TokenBalanceProps> = ({
  type,
  balance,
  interestRate,
  className = ''
}) => {
  const getTokenDetails = () => {
    switch (type) {
      case 'protected':
        return {
          name: 'Protected Money',
          color: 'bg-blue-600/20 text-blue-400',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 13V4M8 13H4M8 13V20M16 13V4M16 13H20M16 13V20"/>
            </svg>
          ),
          riskLevel: 'First in Line',
          riskBadge: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
          tooltip: 'Protected money gets you to the front of the line during emergencies. Deposited equally into Aave and Compound protocols.',
          protocolInfo: 'Deposited 50% in Aave, 50% in Compound'
        };
      case 'standard':
        return {
          name: 'Regular Money',
          color: 'bg-green-600/20 text-green-400',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"/>
              <line x1="14" y1="2" x2="14" y2="7"/>
              <line x1="9" y1="2" x2="9" y2="7"/>
              <path d="M7 18h9"/>
              <path d="M7 14h9"/>
              <path d="M7 10h5"/>
            </svg>
          ),
          riskLevel: 'Regular Access',
          riskBadge: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
          tooltip: 'Regular money earns the same interest but has normal priority during emergencies. Deposited equally into Aave and Compound protocols.',
          protocolInfo: 'Deposited 50% in Aave, 50% in Compound'
        };
      case 'LP':
        return {
          name: 'Pool Helper (Coming Soon)',
          color: 'bg-purple-600/20 text-purple-400',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v12"/>
              <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              <path d="M15 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
              <path d="M18 6l-6.5 3.5"/>
              <path d="M15 18l-6.5-3.5"/>
            </svg>
          ),
          riskLevel: 'Earning Extra',
          riskBadge: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
          tooltip: 'Earn bonus rewards by helping the system work smoothly. Your money helps others move between protected and regular accounts.',
          protocolInfo: 'Internal CoverVault liquidity pool'
        };
      default:
        return {
          name: 'Unknown',
          color: 'bg-slate-600/20 text-slate-400',
          icon: null,
          riskLevel: 'Unknown',
          riskBadge: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
          tooltip: 'Unknown token type',
          protocolInfo: 'Unknown'
        };
    }
  };

  const { name, color, icon, riskLevel, riskBadge, tooltip, protocolInfo } = getTokenDetails();

  // All tokens have a fixed $1 value in the CoverVault protocol
  const dollarValue = balance;

  return (
    <Card className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-slate-800/50 border-slate-700 backdrop-blur-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${color} backdrop-blur-sm`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-white">{name}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="ml-1 text-slate-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                      <p className="max-w-xs text-sm">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className={`text-xs ${riskBadge}`}>
                  {riskLevel}
                </Badge>
                {interestRate && (
                  <span className="text-xs text-slate-400 ml-2">
                    Growing: {(interestRate * 100).toFixed(2)}% per year
                  </span>
                )}
              </div>
              {/* Protocol information */}
              {type !== 'LP' && (
                <div className="flex items-center mt-2 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Landmark size={12} className="text-purple-400" />
                    <span>Aave</span>
                    <span className="mx-1">•</span>
                    <Building2 size={12} className="text-green-400" />
                    <span>Compound</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-xl text-white">{balance.toFixed(2)}</p>
            <div className="text-xs text-slate-400">
              <span>${dollarValue.toFixed(2)}</span>
            </div>
            {type !== 'LP' && (
              <div className="text-xs text-slate-500 mt-1">
                via Aave + Compound
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenBalance;
