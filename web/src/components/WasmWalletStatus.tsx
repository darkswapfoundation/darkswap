import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  WalletIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export interface WasmWalletStatusProps {
  className?: string;
  compact?: boolean;
}

const WasmWalletStatus: React.FC<WasmWalletStatusProps> = ({
  className = '',
  compact = false,
}) => {
  // Contexts
  const {
    isInitialized,
    isConnected,
    isConnecting,
    address,
    balance,
    error,
    initialize,
    connect,
    disconnect,
    refreshBalance,
  } = useWasmWallet();
  const { addNotification } = useNotification();
  
  // State
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Handle initialization
  const handleInitialize = async () => {
    try {
      const result = await initialize();
      if (result) {
        addNotification('success', 'WebAssembly wallet initialized');
      } else {
        addNotification('error', 'Failed to initialize WebAssembly wallet');
      }
    } catch (error) {
      addNotification('error', `Error initializing WebAssembly wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle connection
  const handleConnect = async () => {
    try {
      const result = await connect();
      if (result) {
        addNotification('success', 'WebAssembly wallet connected');
      } else {
        addNotification('error', 'Failed to connect WebAssembly wallet');
      }
    } catch (error) {
      addNotification('error', `Error connecting WebAssembly wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle disconnection
  const handleDisconnect = () => {
    try {
      disconnect();
      addNotification('info', 'WebAssembly wallet disconnected');
    } catch (error) {
      addNotification('error', `Error disconnecting WebAssembly wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle balance refresh
  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
      addNotification('success', 'Balance refreshed');
    } catch (error) {
      addNotification('error', `Error refreshing balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };
  
  // Render compact view
  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center">
          <WalletIcon className={`w-5 h-5 mr-1 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} />
          {isConnected ? (
            <span className="text-sm text-green-400">{formatAddress(address)}</span>
          ) : (
            <span className="text-sm text-gray-400">Not Connected</span>
          )}
        </div>
        
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="ml-2 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            title="Disconnect Wallet"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="ml-2 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            title="Connect Wallet"
            disabled={isConnecting || !isInitialized}
          >
            {isConnecting ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  }
  
  // Render full view
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium flex items-center">
          <WalletIcon className="w-5 h-5 mr-2" />
          WebAssembly Wallet
        </h2>
        
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="text-sm bg-green-600 text-white px-2 py-0.5 rounded-full">Connected</span>
          ) : (
            <span className="text-sm bg-gray-600 text-white px-2 py-0.5 rounded-full">Disconnected</span>
          )}
        </div>
      </div>
      
      <div className="card-body">
        {/* Initialization Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Initialization Status:</span>
            <span className={isInitialized ? 'text-green-400' : 'text-gray-400'}>
              {isInitialized ? 'Initialized' : 'Not Initialized'}
            </span>
          </div>
          
          {!isInitialized && (
            <button
              onClick={handleInitialize}
              className="btn btn-primary w-full"
            >
              Initialize WebAssembly Wallet
            </button>
          )}
        </div>
        
        {/* Connection Status */}
        {isInitialized && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Connection Status:</span>
              <span className={isConnected ? 'text-green-400' : 'text-gray-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="btn btn-warning w-full"
              >
                Disconnect Wallet
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="btn btn-primary w-full"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Wallet Address */}
        {isConnected && address && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Wallet Address:</span>
            </div>
            <div className="bg-twilight-darker p-2 rounded-lg font-mono text-xs break-all">
              {address}
            </div>
          </div>
        )}
        
        {/* Wallet Balance */}
        {isConnected && balance && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Wallet Balance:</span>
              <button
                onClick={handleRefreshBalance}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                title="Refresh Balance"
                disabled={isRefreshing}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="bg-twilight-darker p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">BTC:</span>
                <span className="text-white font-mono">{balance.btc}</span>
              </div>
              
              {balance.runes.length > 0 && (
                <div className="mb-2">
                  <div className="text-gray-400 mb-1">Runes:</div>
                  <div className="pl-2 border-l border-twilight-dark">
                    {balance.runes.map((rune) => (
                      <div key={rune.id} className="flex items-center justify-between mb-1">
                        <span className="text-gray-400">{rune.ticker}:</span>
                        <span className="text-white font-mono">{rune.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {balance.alkanes.length > 0 && (
                <div>
                  <div className="text-gray-400 mb-1">Alkanes:</div>
                  <div className="pl-2 border-l border-twilight-dark">
                    {balance.alkanes.map((alkane) => (
                      <div key={alkane.id} className="flex items-center justify-between mb-1">
                        <span className="text-gray-400">{alkane.ticker}:</span>
                        <span className="text-white font-mono">{alkane.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-ui-error bg-opacity-10 border border-ui-error border-opacity-50 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 text-ui-error mr-2" />
              <span className="text-ui-error text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasmWalletStatus;