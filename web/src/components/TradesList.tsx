import React from 'react';
import { useTrades } from '../contexts/WebSocketContext';

// Trades list props
interface TradesListProps {
  baseAsset: string;
  quoteAsset: string;
  className?: string;
  maxTrades?: number;
}

/**
 * Trades list component
 * @param props Component props
 * @returns Trades list component
 */
const TradesList: React.FC<TradesListProps> = ({
  baseAsset,
  quoteAsset,
  className,
  maxTrades = 50,
}) => {
  // Get trades data
  const trades = useTrades(baseAsset, quoteAsset);
  
  // Format price
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(8);
  };
  
  // Format amount
  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(8);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <div className={`trades-list ${className || ''}`}>
      <div className="trades-list-header">
        <h3>Recent Trades</h3>
        <div className="trades-list-pair">{baseAsset}/{quoteAsset}</div>
      </div>
      
      <div className="trades-list-content">
        <div className="trades-list-row trades-list-header-row">
          <div className="trades-list-cell">Price</div>
          <div className="trades-list-cell">Amount</div>
          <div className="trades-list-cell">Time</div>
        </div>
        
        {trades.slice(0, maxTrades).map((trade, index) => (
          <div
            key={`trade-${index}`}
            className={`trades-list-row ${
              trade.type === 'buy' ? 'trades-list-buy-row' : 'trades-list-sell-row'
            }`}
          >
            <div
              className={`trades-list-cell trades-list-price ${
                trade.type === 'buy'
                  ? 'trades-list-buy-price'
                  : 'trades-list-sell-price'
              }`}
            >
              {formatPrice(trade.price)}
            </div>
            <div className="trades-list-cell trades-list-amount">
              {formatAmount(trade.amount)}
            </div>
            <div className="trades-list-cell trades-list-time">
              {formatTimestamp(trade.createdAt)}
            </div>
          </div>
        ))}
        
        {trades.length === 0 && (
          <div className="trades-list-empty">No trades yet</div>
        )}
      </div>
    </div>
  );
};

export default TradesList;