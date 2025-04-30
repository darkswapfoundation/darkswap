import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';

interface WalletOption {
  id: string;
  name: string;
  icon?: string;
  description: string;
}

interface WalletConnectorProps {
  onClose?: () => void;
}

const WalletConnector: React.FC<WalletConnectorProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { wallet, connect, disconnect, loading } = useWallet();
  const { addNotification } = useNotification();
  const [selectedWalletType, setSelectedWalletType] = useState<string | null>(null);

  // Available wallet options
  const walletOptions: WalletOption[] = [
    {
      id: 'bitcoin',
      name: 'Bitcoin Wallet',
      description: 'Connect to your Bitcoin wallet',
    },
    {
      id: 'ethereum',
      name: 'Ethereum Wallet',
      description: 'Connect to your Ethereum wallet',
    },
    {
      id: 'simple',
      name: 'Simple Wallet',
      description: 'Use a simple test wallet',
    },
  ];

  // Handle wallet selection
  const handleWalletSelect = (walletType: string) => {
    setSelectedWalletType(walletType);
  };

  // Handle wallet connection
  const handleConnect = async () => {
    if (!selectedWalletType) {
      addNotification({
        type: 'warning',
        title: 'Wallet Selection Required',
        message: 'Please select a wallet type to connect',
        autoClose: true,
      });
      return;
    }

    try {
      await connect(selectedWalletType);
      
      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Successfully connected to ${selectedWalletType} wallet`,
        autoClose: true,
      });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
        autoClose: true,
      });
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      disconnect();
      
      addNotification({
        type: 'info',
        title: 'Wallet Disconnected',
        message: 'Your wallet has been disconnected',
        autoClose: true,
      });
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      
      addNotification({
        type: 'error',
        title: 'Disconnection Failed',
        message: errorMessage,
        autoClose: true,
      });
    }
  };

  // Format wallet address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: theme.card }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            {wallet ? 'Wallet Connected' : 'Connect Wallet'}
          </h2>
          {onClose && (
            <button
              className="p-1 rounded-full hover:bg-opacity-10"
              style={{ backgroundColor: `${theme.text}10` }}
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ color: theme.text }}
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {wallet ? (
          // Wallet connected view
          <div>
            <div
              className="p-4 rounded mb-4"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              <div className="flex items-center mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor: theme.primary, color: '#FFFFFF' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium" style={{ color: theme.text }}>
                    {wallet.name}
                  </div>
                  <div className="text-sm" style={{ color: theme.secondary }}>
                    {wallet.type}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-1" style={{ color: theme.text }}>
                  Addresses
                </div>
                {Object.entries(wallet.addresses).map(([chain, address]) => (
                  <div
                    key={chain}
                    className="flex justify-between items-center p-2 rounded"
                    style={{ backgroundColor: `${theme.background}80` }}
                  >
                    <div className="text-sm" style={{ color: theme.text }}>
                      {chain}
                    </div>
                    <div
                      className="text-sm font-mono"
                      style={{ color: theme.secondary }}
                    >
                      {formatAddress(address)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="w-full py-3 rounded font-medium"
              style={{
                backgroundColor: theme.error,
                color: '#FFFFFF',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? 'Disconnecting...' : 'Disconnect Wallet'}
            </button>
          </div>
        ) : (
          // Wallet selection view
          <div>
            <p className="mb-4" style={{ color: theme.text }}>
              Select a wallet to connect to DarkSwap
            </p>

            <div className="space-y-2 mb-4">
              {walletOptions.map((option) => (
                <div
                  key={option.id}
                  className="p-3 rounded border cursor-pointer"
                  style={{
                    backgroundColor:
                      selectedWalletType === option.id
                        ? `${theme.primary}10`
                        : theme.background,
                    borderColor:
                      selectedWalletType === option.id
                        ? theme.primary
                        : theme.border,
                  }}
                  onClick={() => handleWalletSelect(option.id)}
                >
                  <div className="flex items-center">
                    {option.icon ? (
                      <img
                        src={option.icon}
                        alt={option.name}
                        className="w-8 h-8 mr-3"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                        style={{
                          backgroundColor:
                            selectedWalletType === option.id
                              ? theme.primary
                              : `${theme.primary}40`,
                          color: '#FFFFFF',
                        }}
                      >
                        {option.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium" style={{ color: theme.text }}>
                        {option.name}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: theme.secondary }}
                      >
                        {option.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full py-3 rounded font-medium"
              style={{
                backgroundColor: theme.primary,
                color: '#FFFFFF',
                opacity: loading || !selectedWalletType ? 0.7 : 1,
                cursor:
                  loading || !selectedWalletType ? 'not-allowed' : 'pointer',
              }}
              onClick={handleConnect}
              disabled={loading || !selectedWalletType}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnector;