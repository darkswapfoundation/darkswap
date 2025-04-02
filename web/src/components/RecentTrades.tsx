import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatPrice, formatAmount, formatRelativeTime } from '../utils/formatters';
import { Trade } from '../utils/ApiClient';

interface RecentTradesProps {
  baseAsset?: string;
  quoteAsset?: string;
  limit?: number;
  className?: string;
}

const RecentTrades: React.FC<RecentTradesProps> = ({
  baseAsset = 'BTC',
  quoteAsset = 'RUNE:0x123',
  limit = 20,
  className = '',
}) => {
  // State
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch recent trades
  const fetchRecentTrades = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await client.getRecentTrades(baseAsset, quoteAsset, limit);
      
      if (response.error) {
        setError(response.error);
      } else {
        setTrades(response.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent trades');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch recent trades on mount and when assets change
  useEffect(() => {
    fetchRecentTrades();
    
    // Set up interval to refresh recent trades
    const interval = setInterval(fetchRecentTrades, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [baseAsset, quoteAsset, limit]);
  
  // Render loading state
  if (isLoading && trades.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Recent Trades</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading recent trades...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && trades.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Recent Trades</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchRecentTrades}
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
        <h2 className="text-lg font-display font-medium">
          Recent Trades <span className="text-sm text-gray-400">{baseAsset}/{quoteAsset}</span>
        </h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchRecentTrades}
          title="Refresh recent trades"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-gray-400">No recent trades</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Total</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className={trade.side === 'buy' ? 'text-ui-success' : 'text-ui-error'}>
                      {formatPrice(trade.price)}
                    </td>
                    <td>{formatAmount(trade.amount)}</td>
                    <td>{formatAmount(trade.total)}</td>
                    <td className="text-gray-400">{formatRelativeTime(trade.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {isLoading && trades.length > 0 && (
          <div className="flex justify-center mt-4">
            <div className="w-6 h-6 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTrades;