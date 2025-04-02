import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { formatDate, formatAmount, formatAddress } from '../utils/formatters';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'trade' | 'fee';
  amount: string;
  asset: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  counterparty?: string;
  txid: string;
  fee?: string;
}

interface TransactionHistoryProps {
  className?: string;
  limit?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  className = '',
  limit: initialLimit = 10,
}) => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'trade' | 'fee'>('all');
  
  // Get wallet context
  const { isConnected, address } = useWasmWallet();
  
  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock transactions
      const mockTransactions: Transaction[] = [];
      
      // Current timestamp
      const now = Date.now();
      
      // Transaction types
      const types: ('send' | 'receive' | 'trade' | 'fee')[] = ['send', 'receive', 'trade', 'fee'];
      
      // Assets
      const assets = ['BTC', 'RUNE:0x123', 'ALKANE:0x456'];
      
      // Statuses
      const statuses: ('pending' | 'confirmed' | 'failed')[] = ['pending', 'confirmed', 'failed'];
      
      // Generate random transactions
      for (let i = 0; i < 20; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const asset = assets[Math.floor(Math.random() * assets.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in the last 30 days
        
        mockTransactions.push({
          id: `tx-${i}`,
          type,
          amount: (Math.random() * (type === 'fee' ? 0.01 : 1)).toFixed(8),
          asset,
          timestamp,
          status,
          confirmations: status === 'pending' ? 0 : Math.floor(Math.random() * 6) + 1,
          counterparty: type !== 'fee' ? `bc1q${Math.random().toString(36).substring(2, 15)}` : undefined,
          txid: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          fee: type !== 'fee' ? (Math.random() * 0.001).toFixed(8) : undefined,
        });
      }
      
      // Sort by timestamp (newest first)
      mockTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(mockTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch transaction history on mount
  useEffect(() => {
    if (isConnected) {
      fetchTransactionHistory();
    }
  }, [isConnected]);
  
  // Filter transactions
  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  ).slice(0, limit);
  
  // Get transaction icon
  const getTransactionIcon = (type: 'send' | 'receive' | 'trade' | 'fee') => {
    switch (type) {
      case 'send':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        );
      case 'receive':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        );
      case 'trade':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        );
      case 'fee':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };
  
  // Get transaction status badge
  const getStatusBadge = (status: 'pending' | 'confirmed' | 'failed') => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 bg-opacity-20 text-yellow-500">
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500 bg-opacity-20 text-green-500">
            Confirmed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500 bg-opacity-20 text-red-500">
            Failed
          </span>
        );
    }
  };
  
  // Render not connected state
  if (!isConnected) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Transaction History</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="mt-4 text-gray-400">Connect your wallet to view transaction history</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isLoading && transactions.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Transaction History</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading transaction history...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && transactions.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Transaction History</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchTransactionHistory}
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
        <h2 className="text-lg font-display font-medium">Transaction History</h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchTransactionHistory}
          title="Refresh transaction history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {/* Filter tabs */}
        <div className="flex mb-4 border-b border-twilight-dark">
          <button
            className={`py-2 px-4 ${filter === 'all' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`py-2 px-4 ${filter === 'send' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('send')}
          >
            Sent
          </button>
          <button
            className={`py-2 px-4 ${filter === 'receive' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('receive')}
          >
            Received
          </button>
          <button
            className={`py-2 px-4 ${filter === 'trade' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('trade')}
          >
            Trades
          </button>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 bg-twilight-darker rounded-lg">
                <div className="flex items-center">
                  {/* Transaction icon */}
                  {getTransactionIcon(tx.type)}
                  
                  {/* Transaction details */}
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {tx.type === 'send' && 'Sent'}
                          {tx.type === 'receive' && 'Received'}
                          {tx.type === 'trade' && 'Traded'}
                          {tx.type === 'fee' && 'Network Fee'}
                          {' '}
                          {tx.asset}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDate(tx.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          tx.type === 'send' || tx.type === 'fee' ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {tx.type === 'send' || tx.type === 'fee' ? '-' : '+'}{formatAmount(tx.amount)} {tx.asset}
                        </div>
                        <div className="text-sm text-gray-400">
                          {getStatusBadge(tx.status)}
                          {tx.status === 'confirmed' && (
                            <span className="ml-2 text-xs text-gray-400">
                              {tx.confirmations} confirmation{tx.confirmations !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional details */}
                    <div className="mt-2 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Transaction ID:</span>
                        <a 
                          href={`https://mempool.space/tx/${tx.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-light"
                        >
                          {formatAddress(tx.txid, 8, 8)}
                        </a>
                      </div>
                      
                      {tx.counterparty && (
                        <div className="flex justify-between mt-1">
                          <span>{tx.type === 'send' ? 'Recipient:' : 'Sender:'}</span>
                          <span>{formatAddress(tx.counterparty, 8, 8)}</span>
                        </div>
                      )}
                      
                      {tx.fee && tx.type !== 'fee' && (
                        <div className="flex justify-between mt-1">
                          <span>Fee:</span>
                          <span>{formatAmount(tx.fee)} BTC</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {transactions.length > limit && (
              <div className="text-center mt-4">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setLimit((prev: number) => prev + 10)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;