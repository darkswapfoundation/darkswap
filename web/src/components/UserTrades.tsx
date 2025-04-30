import React from 'react';
import { useUserTrades } from '../contexts/WebSocketContext';

// User trades props
interface UserTradesProps {
  className?: string;
}

/**
 * User trades component
 * @param props Component props
 * @returns User trades component
 */
const UserTrades: React.FC<UserTradesProps> = ({ className }) => {
  // Get user trades
  const trades = useUserTrades();
  
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
    return date.toLocaleString();
  };
  
  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'user-trades-status-pending';
      case 'completed':
        return 'user-trades-status-completed';
      case 'cancelled':
        return 'user-trades-status-cancelled';
      default:
        return '';
    }
  };
  
  // Get type class
  const getTypeClass = (buyUserId: string, sellUserId: string, userId: string) => {
    if (buyUserId === userId) {
      return 'user-trades-type-buy';
    } else if (sellUserId === userId) {
      return 'user-trades-type-sell';
    } else {
      return '';
    }
  };
  
  // Get type text
  const getTypeText = (buyUserId: string, sellUserId: string, userId: string) => {
    if (buyUserId === userId) {
      return 'BUY';
    } else if (sellUserId === userId) {
      return 'SELL';
    } else {
      return 'UNKNOWN';
    }
  };
  
  return (
    <div className={`user-trades ${className || ''}`}>
      <div className="user-trades-header">
        <h3>Your Trades</h3>
      </div>
      
      <div className="user-trades-content">
        {trades.length > 0 ? (
          <div className="user-trades-list">
            <div className="user-trades-row user-trades-header-row">
              <div className="user-trades-cell">Pair</div>
              <div className="user-trades-cell">Type</div>
              <div className="user-trades-cell">Price</div>
              <div className="user-trades-cell">Amount</div>
              <div className="user-trades-cell">Total</div>
              <div className="user-trades-cell">Status</div>
              <div className="user-trades-cell">Time</div>
            </div>
            
            {trades.map((trade) => {
              const total = (
                parseFloat(trade.price) * parseFloat(trade.amount)
              ).toFixed(8);
              
              return (
                <div key={trade.id} className="user-trades-row">
                  <div className="user-trades-cell user-trades-pair">
                    {trade.baseAsset}/{trade.quoteAsset}
                  </div>
                  <div
                    className={`user-trades-cell user-trades-type ${getTypeClass(
                      trade.buyUserId,
                      trade.sellUserId,
                      trade.userId
                    )}`}
                  >
                    {getTypeText(trade.buyUserId, trade.sellUserId, trade.userId)}
                  </div>
                  <div className="user-trades-cell user-trades-price">
                    {formatPrice(trade.price)}
                  </div>
                  <div className="user-trades-cell user-trades-amount">
                    {formatAmount(trade.amount)}
                  </div>
                  <div className="user-trades-cell user-trades-total">{total}</div>
                  <div
                    className={`user-trades-cell user-trades-status ${getStatusClass(
                      trade.status
                    )}`}
                  >
                    {trade.status.toUpperCase()}
                  </div>
                  <div className="user-trades-cell user-trades-time">
                    {formatTimestamp(trade.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="user-trades-empty">You have no trades</div>
        )}
      </div>
    </div>
  );
};

export default UserTrades;