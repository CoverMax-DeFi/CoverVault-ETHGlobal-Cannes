import React, { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { toast } from '@/components/ui/sonner';
import { CHAIN_CONFIG } from '../config/contracts';

interface Network {
  id: number;
  name: string;
  icon: string;
  color: string;
  rpcUrl: string;
  blockExplorer: string;
}

const SUPPORTED_NETWORKS: Network[] = [
  {
    id: 545,
    name: 'Flow Testnet',
    icon: '🌊',
    color: 'bg-blue-500',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    blockExplorer: 'https://evm-testnet.flowscan.io'
  },
  {
    id: 747,
    name: 'Flow Mainnet',
    icon: '🌊',
    color: 'bg-blue-600',
    rpcUrl: 'https://mainnet.evm.nodes.onflow.org',
    blockExplorer: 'https://evm.flowscan.io'
  }
];

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
      await wallet.switchChain(network.id);
      toast.success(`Switched to ${network.name}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
      toast.error(`Failed to switch to ${network.name}`);
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