/**
 * TradeHistory - Component for displaying trade history
 * 
 * This component displays the trade history for a trading pair, showing
 * recent trades with price, amount, and timestamp information.
 */

import React, { useState, useEffect } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { AssetType, OrderSide, Trade } from '../wasm/DarkSwapWasm';
import { Card } from './MemoizedComponents';
import { EventType, TradeExecutedEvent } from '../wasm/EventTypes';

export interface TradeHistoryProps {
  /** CSS class name */
  className?: string;
  
  /** Base asset type */
  baseAssetType: AssetType;
  
  /** Base asset ID */
  baseAssetId: string;
  
  /** Quote asset type */
  quoteAssetType: AssetType;
  
  /** Quote asset ID */
  quoteAssetId: string;
}

/**
 * TradeHistory component
 */
export const TradeHistory: React.FC<TradeHistoryProps> = ({ 
  className = '',
  baseAssetType,
  baseAssetId,
  quoteAssetType,
  quoteAssetId,
}) => {
  // DarkSwap context
  const { isInitialized, on, off } = useDarkSwapContext();
  
  // Trade history state
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load trade history
  useEffect(() => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This is a placeholder for actual trade history loading
      // In a real implementation, this would load trade history from the DarkSwap WebAssembly module
      
      // Simulate loading trade history
      setTimeout(() => {
        // Generate mock trades
        const mockTrades: Trade[] = [];
        const now = Date.now();
        
        for (let i = 0; i < 10; i++) {
          mockTrades.push({
            id: `trade-${i}`,
            orderId: `order-${i}`,
            side: i % 2 === 0 ? OrderSide.Buy : OrderSide.Sell,
            baseAsset: baseAssetId,
            quoteAsset: quoteAssetId,
            amount: (Math.random() * 2).toFixed(8),
            price: (50000 + Math.random() * 1000 - 500).toFixed(2),
            timestamp: now - i * 60000, // 1 minute apart
            maker: `peer-${i}`,
            taker: `peer-${i + 1}`,
          });
        }
        
        // Sort trades by timestamp (newest first)
        mockTrades.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update state
        setTrades(mockTrades);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [isInitialized, baseAssetId, quoteAssetId]);
  
  // Handle trade events
  useEffect(() => {
    if (!isInitialized) return;
    
    // Define event handlers
    const handleTradeExecuted = (event: TradeExecutedEvent) => {
      const trade = event.data;
      
      // Check if trade matches current trading pair
      if (
        trade.baseAsset === baseAssetId &&
        trade.quoteAsset === quoteAssetId
      ) {
        // Add trade to trade history
        setTrades(prevTrades => {
          const newTrades = [trade, ...prevTrades];
          // Keep only the most recent 100 trades
          return newTrades.slice(0, 100);
        });
      }
    };
    
    // Register event handlers
    on<TradeExecutedEvent>(EventType.TradeExecuted, handleTradeExecuted);
    
    // Clean up event handlers
    return () => {
      off<TradeExecutedEvent>(EventType.TradeExecuted, handleTradeExecuted);
    };
  }, [isInitialized, baseAssetId, quoteAssetId, on, off]);
  
  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <Card className={`trade-history ${className}`}>
      <h2>Trade History</h2>
      
      {isLoading && (
        <div className="loading">Loading trade history...</div>
      )}
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      
      <div className="trade-history-content">
        <div className="trade-history-header">
          <div className="time">Time</div>
          <div className="price">Price</div>
          <div className="amount">Amount</div>
          <div className="side">Side</div>
        </div>
        
        <div className="trades">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className={`trade ${trade.side === OrderSide.Buy ? 'buy' : 'sell'}`}
            >
              <div className="time">{formatTimestamp(trade.timestamp)}</div>
              <div className="price">{trade.price}</div>
              <div className="amount">{trade.amount}</div>
              <div className="side">{trade.side === OrderSide.Buy ? 'Buy' : 'Sell'}</div>
            </div>
          ))}
          
          {trades.length === 0 && (
            <div className="no-trades">No trades</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TradeHistory;