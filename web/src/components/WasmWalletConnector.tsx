import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  ArrowPathIcon,
  WalletIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface WasmWalletConnectorProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

const WasmWalletConnector: React.FC<WasmWalletConnectorProps> = ({
  onConnect,
  onDisconnect,
  className = '',
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
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Handle initialization
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);
  
  // Handle connect
  const handleConnect = async () => {
    try {
      const result = await connect();
      if (result && onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      addNotification('error', `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
    setIsDropdownOpen(false);
  };
  
  // Handle refresh balance
  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshBalance();
      addNotification('success', 'Balance refreshed');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      addNotification('error', `Failed to refresh balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format address for display
  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    if (addr.length <= 12) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };
  
  // Format BTC amount
  const formatBtc = (amount: string): string => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return '0.00000000';
      return num.toFixed(8);
    } catch (e) {
      return '0.00000000';
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Connect Button */}
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting || !isInitialized}
          className={`btn ${isConnecting ? 'bg-twilight-dark' : 'bg-twilight-accent hover:bg-twilight-secondary'} text-white flex items-center space-x-2`}
        >
          {isConnecting ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <WalletIcon className="w-5 h-5" />
          )}
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      ) : (
        <div className="flex items-center">
          {/* Connected Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn bg-twilight-dark hover:bg-twilight-secondary text-white flex items-center space-x-2"
          >
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <span>{formatAddress(address)}</span>
          </button>
          
          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-twilight-primary border border-twilight-accent rounded-lg shadow-lg z-50">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Wallet</h3>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Address */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400">Address</div>
                  <div className="text-sm font-mono bg-twilight-darker p-2 rounded truncate">
                    {address}
                  </div>
                </div>
                
                {/* Balance */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">Balance</div>
                    <button
                      onClick={handleRefreshBalance}
                      disabled={isRefreshing}
                      className="text-gray-400 hover:text-white"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  {balance ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">BTC</div>
                        <div>{formatBtc(balance.btc)} BTC</div>
                      </div>
                      
                      {balance.runes.length > 0 && (
                        <div className="mb-2">
                          <div className="text-sm text-gray-400 mb-1">Runes</div>
                          <div className="max-h-24 overflow-y-auto">
                            {balance.runes.map((rune) => (
                              <div key={rune.id} className="flex justify-between items-center text-sm">
                                <div>{rune.ticker}</div>
                                <div>{rune.amount}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {balance.alkanes.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Alkanes</div>
                          <div className="max-h-24 overflow-y-auto">
                            {balance.alkanes.map((alkane) => (
                              <div key={alkane.id} className="flex justify-between items-center text-sm">
                                <div>{alkane.ticker}</div>
                                <div>{alkane.amount}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400">Loading balance...</div>
                  )}
                </div>
                
                {/* Error */}
                {error && (
                  <div className="mb-4 p-2 bg-red-900 bg-opacity-20 border border-red-500 rounded">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                      <div className="text-sm text-red-400">{error}</div>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    onClick={handleDisconnect}
                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WasmWalletConnector;