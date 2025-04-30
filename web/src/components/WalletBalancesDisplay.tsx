import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatAmount, formatAddress } from '../utils/formatters';

interface WalletBalancesDisplayProps {
  className?: string;
}

interface AssetBalance {
  assetId: string;
  name: string;
  symbol: string;
  balance: string;
  usdValue: number;
  type: 'btc' | 'rune' | 'alkane';
}

const WalletBalancesDisplay: React.FC<WalletBalancesDisplayProps> = ({
  className = '',
}) => {
  // State
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'btc' | 'runes' | 'alkanes'>('all');
  
  // Get wallet context
  const { isConnected, address } = useWasmWallet();
  
  // Get API client
  const { client } = useApi();
  
  // Get notification context
  const { addNotification } = useNotification();
  
  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock balances
      const mockBalances: AssetBalance[] = [
        {
          assetId: 'btc',
          name: 'Bitcoin',
          symbol: 'BTC',
          balance: (Math.random() * 2).toFixed(8),
          usdValue: Math.random() * 100000,
          type: 'btc',
        },
        {
          assetId: 'rune:0x123',
          name: 'Rune 1',
          symbol: 'RUNE1',
          balance: (Math.random() * 10000).toFixed(2),
          usdValue: Math.random() * 10000,
          type: 'rune',
        },
        {
          assetId: 'rune:0x456',
          name: 'Rune 2',
          symbol: 'RUNE2',
          balance: (Math.random() * 10000).toFixed(2),
          usdValue: Math.random() * 5000,
          type: 'rune',
        },
        {
          assetId: 'alkane:0x789',
          name: 'Alkane 1',
          symbol: 'ALK1',
          balance: (Math.random() * 50000).toFixed(2),
          usdValue: Math.random() * 2000,
          type: 'alkane',
        },
        {
          assetId: 'alkane:0xabc',
          name: 'Alkane 2',
          symbol: 'ALK2',
          balance: (Math.random() * 50000).toFixed(2),
          usdValue: Math.random() * 1000,
          type: 'alkane',
        },
      ];
      
      setBalances(mockBalances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet balances');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch wallet balances on mount
  useEffect(() => {
    if (isConnected) {
      fetchWalletBalances();
    }
  }, [isConnected]);
  
  // Filter balances by type
  const filteredBalances = balances.filter(balance => {
    if (activeTab === 'all') return true;
    if (activeTab === 'btc') return balance.type === 'btc';
    if (activeTab === 'runes') return balance.type === 'rune';
    if (activeTab === 'alkanes') return balance.type === 'alkane';
    return true;
  });
  
  // Calculate total USD value
  const totalUsdValue = filteredBalances.reduce((sum, balance) => sum + balance.usdValue, 0);
  
  // Get asset icon
  const getAssetIcon = (type: 'btc' | 'rune' | 'alkane', symbol: string) => {
    let bgColor: string;
    
    switch (type) {
      case 'btc':
        bgColor = 'bg-orange-500';
        break;
      case 'rune':
        bgColor = 'bg-blue-500';
        break;
      case 'alkane':
        bgColor = 'bg-green-500';
        break;
      default:
        bgColor = 'bg-gray-500';
    }
    
    return (
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white font-bold`}>
        {symbol.substring(0, 2)}
      </div>
    );
  };
  
  // Render not connected state
  if (!isConnected) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Wallet Balances</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="mt-4 text-gray-400">Connect your wallet to view balances</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isLoading && balances.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Wallet Balances</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading wallet balances...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && balances.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Wallet Balances</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchWalletBalances}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">Wallet Balances</h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchWalletBalances}
          title="Refresh balances"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {/* Wallet address */}
        <div className="mb-4 p-3 bg-twilight-darker rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm truncate">
              {formatAddress(address || '', 8, 8)}
            </div>
            <div className="flex space-x-2">
              <button
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                onClick={() => {
                  if (address) {
                    navigator.clipboard.writeText(address);
                    addNotification('success', 'Address copied to clipboard');
                  }
                }}
                title="Copy address"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <a
                href={`https://mempool.space/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                title="View on explorer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Total value */}
        <div className="mb-4 p-3 bg-twilight-darker rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Total Value</div>
          <div className="text-xl font-medium">${totalUsdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex mb-4 border-b border-twilight-dark">
          <button
            className={`py-2 px-4 ${activeTab === 'all' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'btc' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('btc')}
          >
            BTC
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'runes' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('runes')}
          >
            Runes
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'alkanes' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('alkanes')}
          >
            Alkanes
          </button>
        </div>
        
        {filteredBalances.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-gray-400">No assets found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBalances.map((balance) => (
              <div key={balance.assetId} className="p-4 bg-twilight-darker rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getAssetIcon(balance.type, balance.symbol)}
                    <div className="ml-3">
                      <div className="font-medium">{balance.name}</div>
                      <div className="text-xs text-gray-400">{balance.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatAmount(balance.balance)}</div>
                    <div className="text-xs text-gray-400">${balance.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-center mt-6 space-x-4">
          <button className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Receive
          </button>
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletBalancesDisplay;