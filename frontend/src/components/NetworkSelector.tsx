import React from 'react';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNetwork } from '@/context/NetworkContext';
import { useWeb3 } from '@/context/PrivyWeb3Context';
import { getNetworkConfig } from '@/config/networks';

const NetworkSelector: React.FC = () => {
  const { currentNetwork, availableNetworks, switchNetwork, getNetworkDisplayName, networkConfig } = useNetwork();
  const { isConnected, chainId } = useWeb3();

  // Check if wallet is connected to the correct network
  const isCorrectNetwork = isConnected && chainId === networkConfig.chainId;
  const isWrongNetwork = isConnected && chainId !== networkConfig.chainId;

  const getNetworkIcon = (networkKey: string) => {
    switch (networkKey) {
      case 'flow':
        return '🌊';
      case 'mantle':
        return '🔥';
      case 'hedera':
        return '⚡';
      default:
        return '🌐';
    }
  };

  const getNetworkColor = (networkKey: string) => {
    switch (networkKey) {
      case 'flow':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'mantle':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'hedera':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleNetworkSwitch = (networkKey: string) => {
    switchNetwork(networkKey);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Network Status Indicator */}
      {isConnected && (
        <div className="flex items-center">
          {isCorrectNetwork ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </div>
      )}

      {/* Network Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`
              ${getNetworkColor(currentNetwork)}
              hover:bg-slate-700 border-slate-600 
              px-3 py-2 text-sm font-medium 
              flex items-center space-x-2
            `}
          >
            <span className="text-lg">{getNetworkIcon(currentNetwork)}</span>
            <span className="hidden sm:inline">{getNetworkDisplayName(currentNetwork)}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Select Network
            </p>
          </div>
          
          {availableNetworks.map((networkKey) => {
            const isSelected = networkKey === currentNetwork;
            const displayName = getNetworkDisplayName(networkKey);
            
            const networkConf = getNetworkConfig(networkKey);
            const hasContracts = networkConf.contracts.RiskVault !== "0x0000000000000000000000000000000000000000";
            
            return (
              <DropdownMenuItem
                key={networkKey}
                onClick={() => handleNetworkSwitch(networkKey)}
                className={`
                  flex items-center justify-between px-2 py-2 cursor-pointer
                  hover:bg-slate-700 focus:bg-slate-700
                  ${isSelected ? 'bg-slate-700' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getNetworkIcon(networkKey)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-white">{displayName}</p>
                      {!hasContracts && (
                        <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded px-1">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Chain ID: {networkConf.chainId}
                    </p>
                  </div>
                </div>
                
                {isSelected && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
          
          {/* Network Status Warning */}
          {isWrongNetwork && (
            <div className="px-2 py-2 mt-2 border-t border-slate-700">
              <div className="flex items-center space-x-2 text-amber-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">
                  Switch wallet to {getNetworkDisplayName(currentNetwork)}
                </span>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NetworkSelector;