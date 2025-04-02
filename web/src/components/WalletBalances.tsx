import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { formatAmount } from '../utils/formatters';
import { RuneBalance, AlkaneBalance } from '../contexts/WasmWalletContext';

interface WalletBalancesProps {
  className?: string;
}

const WalletBalances: React.FC<WalletBalancesProps> = ({
  className = '',
}) => {
  // Get wallet context
  const { 
    isConnected, 
    balance, 
    address, 
    refreshBalance,
    isConnecting
  } = useWasmWallet();
  
  // State
  const [activeTab, setActiveTab] = useState<'btc' | 'runes' | 'alkanes'>('btc');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  };
  
  // Auto refresh balance when connected
  useEffect(() => {
    if (isConnected) {
      handleRefresh();
    }
  }, [isConnected]);
  
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
            <p className="mt-4 text-gray-400">Wallet not connected</p>
            <button 
              className="mt-4 btn btn-primary"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (!balance) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Wallet Balances</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading balances...</p>
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
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh balances"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {/* Wallet Address */}
        <div className="mb-4 p-3 bg-twilight-darker rounded-lg">
          <div className="text-xs text-gray-400">Address</div>
          <div className="text-sm font-medium truncate">{address}</div>
        </div>
        
        {/* Tabs */}
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 ${activeTab === 'btc' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('btc')}
          >
            BTC
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === 'runes' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('runes')}
          >
            Runes
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === 'alkanes' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setActiveTab('alkanes')}
          >
            Alkanes
          </button>
        </div>
        
        {/* BTC Balance */}
        {activeTab === 'btc' && (
          <div className="p-4 bg-twilight-darker rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                ₿
              </div>
              <div className="ml-3">
                <div className="text-sm text-gray-400">Bitcoin</div>
                <div className="text-xl font-medium">{formatAmount(balance.btc)} BTC</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Rune Balances */}
        {activeTab === 'runes' && (
          <div>
            {balance.runes.length === 0 ? (
              <div className="p-4 bg-twilight-darker rounded-lg text-center">
                <p className="text-gray-400">No runes found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {balance.runes.map((rune: RuneBalance) => (
                  <div key={rune.id} className="p-3 bg-twilight-darker rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {rune.ticker.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm text-gray-400">{rune.ticker}</div>
                        <div className="text-lg font-medium">{formatAmount(rune.amount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Alkane Balances */}
        {activeTab === 'alkanes' && (
          <div>
            {balance.alkanes.length === 0 ? (
              <div className="p-4 bg-twilight-darker rounded-lg text-center">
                <p className="text-gray-400">No alkanes found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {balance.alkanes.map((alkane: AlkaneBalance) => (
                  <div key={alkane.id} className="p-3 bg-twilight-darker rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                        {alkane.ticker.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm text-gray-400">{alkane.ticker}</div>
                        <div className="text-lg font-medium">{formatAmount(alkane.amount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Explorer Link */}
        <div className="mt-6 text-center">
          <a
            href={`https://mempool.space/${balance ? '' : 'testnet/'}address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            View in Explorer
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletBalances;