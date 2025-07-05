
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Building2, Landmark } from 'lucide-react';

interface TokenBalanceProps {
  type: 'senior' | 'junior' | 'aUSDC' | 'cUSDT';
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
      case 'aUSDC':
        return {
          name: 'Aave USDC (aUSDC)',
          color: 'bg-purple-600/20 text-purple-400',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          ),
          riskLevel: 'Yield-Bearing',
          riskBadge: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
          tooltip: 'Interest-bearing USDC from Aave protocol. Used as collateral in CoverVault for risk tokenization.',
          protocolInfo: 'Aave Protocol Asset'
        };
      case 'cUSDT':
        return {
          name: 'Compound USDT (cUSDT)',
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
          riskLevel: 'Yield-Bearing',
          riskBadge: 'bg-green-600/20 text-green-400 border-green-600/30',
          tooltip: 'Interest-bearing USDT from Compound protocol. Used as collateral in CoverVault for risk tokenization.',
          protocolInfo: 'Compound Protocol Asset'
        };
      case 'senior':
        return {
          name: 'Senior Tokens (CM-SENIOR)',
          color: 'bg-blue-600/20 text-blue-400',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ),
          riskLevel: 'Priority Withdrawal',
          riskBadge: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
          tooltip: 'Senior tokens get priority during withdrawals. In emergency mode, senior tokens are processed first.',
          protocolInfo: 'RiskVault Protocol - Priority Position'
        };
      case 'junior':
        return {
          name: 'Junior Tokens (CM-JUNIOR)',
          color: 'bg-amber-600/20 text-amber-400',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          ),
          riskLevel: 'Standard Position',
          riskBadge: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
          tooltip: 'Junior tokens are processed after senior tokens during withdrawals. Equal claim on vault assets.',
          protocolInfo: 'RiskVault Protocol - Standard Position'
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
              <div className="flex items-center mt-2 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  {type === 'aUSDC' ? (
                    <>
                      <Landmark size={12} className="text-purple-400" />
                      <span>Aave</span>
                    </>
                  ) : type === 'cUSDT' ? (
                    <>
                      <Building2 size={12} className="text-green-400" />
                      <span>Compound</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={12} className="text-blue-400" />
                      <span>CoverVault</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-xl text-white">{balance.toFixed(2)}</p>
            <div className="text-xs text-slate-400">
              <span>${dollarValue.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {type === 'aUSDC' ? 'via Aave Protocol' : type === 'cUSDT' ? 'via Compound Protocol' : 'via CoverVault'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenBalance;
