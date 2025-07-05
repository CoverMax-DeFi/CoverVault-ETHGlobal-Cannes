import React, { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { toast } from '@/components/ui/sonner';
import { CHAIN_CONFIG, CHAIN_CONFIGS, SupportedChainId } from '../config/contracts';

interface Network {
  id: number;
  name: string;
  icon: string;
  color: string;
  rpcUrl: string;
  blockExplorer: string;
}

// Generate supported networks from centralized config
const SUPPORTED_NETWORKS: Network[] = Object.values(CHAIN_CONFIGS).map(config => ({
  id: config.chainId,
  name: config.chainName,
  icon: config.icon,
  color: config.chainId === 545 ? 'bg-blue-500' : 
        config.chainId === 296 ? 'bg-purple-500' : 'bg-green-500',
  rpcUrl: config.rpcUrls[0],
  blockExplorer: config.blockExplorerUrls[0]
}));

export const NetworkSelector: React.FC = () => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const currentNetwork = SUPPORTED_NETWORKS.find(network => network.id === CHAIN_CONFIG.chainId);

  const switchNetwork = async (network: Network) => {
    if (!ready || !authenticated || !wallets.length) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSwitching(true);
    try {
      const wallet = wallets[0];
      
      // Get ethereum provider to manually add the network if needed
      const ethereumProvider = await wallet.getEthereumProvider();
      
      // For all networks, try to add the network first (in case it's not configured)
      if (ethereumProvider) {
        try {
          const chainConfig = CHAIN_CONFIGS[network.id as SupportedChainId];
          if (chainConfig) {
            await ethereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${network.id.toString(16)}`,
                chainName: chainConfig.chainName,
                nativeCurrency: chainConfig.nativeCurrency,
                rpcUrls: chainConfig.rpcUrls,
                blockExplorerUrls: chainConfig.blockExplorerUrls,
              }],
            });
          }
        } catch (addError) {
          console.log('Network might already exist, trying to switch...');
        }
      }
      
      await wallet.switchChain(network.id);
      toast.success(`Switched to ${network.name}`);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      
      // Handle specific error codes
      switch (error.code) {
        case 4902:
          toast.error(`${network.name} not configured in wallet. Please add it manually.`);
          break;
        case 4001:
          toast.info('Network switch cancelled by user');
          break;
        case -32002:
          toast.error('A network switch request is already pending. Please check your wallet.');
          break;
        case -32603:
          toast.error('Internal wallet error. Please try again or restart your wallet.');
          break;
        default:
          if (error.message?.includes('Chain does not exist')) {
            toast.error(`${network.name} is not supported by your wallet.`);
          } else if (error.message?.includes('Request failed')) {
            toast.error('Network request failed. Please check your internet connection.');
          } else {
            toast.error(`Failed to switch to ${network.name}. Please try again.`);
          }
      }
    } finally {
      setSwitching(false);
    }
  };

  const addNetwork = async (network: Network) => {
    if (!ready || !authenticated || !wallets.length) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const wallet = wallets[0];
      // For now, just try to switch - Privy handles adding chains automatically
      await wallet.switchChain(network.id);
      toast.success(`Switched to ${network.name}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to add network:', error);
      toast.error(`Failed to add ${network.name}`);
    }
  };

  const handleNetworkSelect = async (network: Network) => {
    try {
      await switchNetwork(network);
    } catch (error) {
      // If switching fails, try adding the network first
      await addNetwork(network);
    }
  };

  if (!ready || !authenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        disabled={switching}
      >
        <span className="text-lg">{currentNetwork?.icon || '🔗'}</span>
        <span className="text-sm font-medium text-white">
          {currentNetwork?.name || 'Unknown Network'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 transition-colors ${
                  currentNetwork?.id === network.id ? 'bg-gray-700' : ''
                }`}
                disabled={switching}
              >
                <span className="text-lg">{network.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{network.name}</div>
                  <div className="text-xs text-gray-400">Chain ID: {network.id}</div>
                </div>
                {currentNetwork?.id === network.id && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {switching && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 text-center text-sm text-gray-400">
            Switching network...
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;