import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Trade, OrderSide } from '../types';
import '../styles/TradeHistory.css';

interface TradeHistoryProps {
  baseAsset: string;
  quoteAsset: string;
  limit?: number;
  showHeader?: boolean;
  height?: number;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({
  baseAsset,
  quoteAsset,
  limit = 50,
  showHeader = true,
  height = 400,
}) => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { connected, on, send } = useWebSocket();
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Format price with appropriate decimal places
  const formatPrice = useCallback((price: string): string => {
    const numPrice = parseFloat(price);
    if (numPrice < 0.01) {
      return numPrice.toFixed(8);
    } else if (numPrice < 1) {
      return numPrice.toFixed(6);
    } else if (numPrice < 1000) {
      return numPrice.toFixed(4);
    } else {
      return numPrice.toFixed(2);
    }
  }, []);
  
  // Format amount with appropriate decimal places
  const formatAmount = useCallback((amount: string): string => {
    const numAmount = parseFloat(amount);
    if (numAmount < 0.001) {
      return numAmount.toFixed(6);
    } else if (numAmount < 1) {
      return numAmount.toFixed(4);
    } else if (numAmount < 1000) {
      return numAmount.toFixed(2);
    } else {
      return numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  }, []);
  
  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }, []);
  
  // Fetch trade history
  const fetchTradeHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.getTrades(baseAsset, quoteAsset, limit);
      setTrades(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
      setError('Failed to fetch trade history. Please try again later.');
      setIsLoading(false);
    }
  }, [api, baseAsset, quoteAsset, limit]);
  
  // Handle trade update
  const handleTradeUpdate = useCallback((data: any) => {
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset) {
      setTrades(prevTrades => {
        // Add new trades
        const newTrades = [...data.trades, ...prevTrades];
        
        // Sort by timestamp (descending)
        newTrades.sort((a, b) => b.timestamp - a.timestamp);
        
        // Limit number of trades
        return newTrades.slice(0, limit);
      });
    }
  }, [baseAsset, quoteAsset, limit]);
  
  // Subscribe to trade updates
  useEffect(() => {
    // Fetch initial data
    fetchTradeHistory();
    
    // Subscribe to trade updates if socket is connected
    if (connected) {
      const tradeUnsubscribe = on('tradeUpdate', handleTradeUpdate);
      
      // Subscribe to trade updates
      send('subscribeTrades', {
        baseAsset,
        quoteAsset,
      });
      
      // Clean up
      return () => {
        tradeUnsubscribe();
        
        send('unsubscribeTrades', {
          baseAsset,
          quoteAsset,
        });
      };
    }
    
    // Set up polling for updates if socket is not connected
    const intervalId = !connected ? setInterval(fetchTradeHistory, 5000) : null;
    
    // Clean up
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchTradeHistory, connected, on, send, baseAsset, quoteAsset, handleTradeUpdate]);
  
  return (
    <div 
      className={`trade-history trade-history-${theme}`}
      style={{ height: height ? `${height}px` : 'auto' }}
    >
      {showHeader && (
        <div className="trade-history-header">
          <h3>Trade History</h3>
        </div>
      )}
      
      {isLoading ? (
        <div className="trade-history-loading">
          <div className="spinner"></div>
          <p>Loading trades...</p>
        </div>
      ) : error ? (
        <div className="trade-history-error">
          <p>{error}</p>
          <button onClick={fetchTradeHistory}>Retry</button>
        </div>
      ) : trades.length === 0 ? (
        <div className="trade-history-empty">
          <p>No trades found.</p>
        </div>
      ) : (
        <div className="trade-history-content">
          <div className="trade-history-table-header">
            <div className="trade-history-price">Price</div>
            <div className="trade-history-amount">Amount</div>
            <div className="trade-history-time">Time</div>
          </div>
          
          <div className="trade-history-trades">
            {trades.map((trade, index) => (
              <div key={trade.id || index} className="trade-history-trade">
                <div className={`trade-history-price ${trade.side === OrderSide.Buy ? 'buy-price' : 'sell-price'}`}>
                  {formatPrice(trade.price)}
                </div>
                <div className="trade-history-amount">
                  {formatAmount(trade.amount)}
                </div>
                <div className="trade-history-time">
                  {formatTimestamp(trade.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;