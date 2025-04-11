import React from 'react';
import { useOrderbook } from '../contexts/WebSocketContext';

// Orderbook display props
interface OrderbookDisplayProps {
  baseAsset: string;
  quoteAsset: string;
  className?: string;
  maxDepth?: number;
  onOrderSelect?: (price: string, type: 'buy' | 'sell') => void;
}

/**
 * Orderbook display component
 * @param props Component props
 * @returns Orderbook display component
 */
const OrderbookDisplay: React.FC<OrderbookDisplayProps> = ({
  baseAsset,
  quoteAsset,
  className,
  maxDepth = 10,
  onOrderSelect,
}) => {
  // Get orderbook data
  const { bids, asks, timestamp } = useOrderbook(baseAsset, quoteAsset);
  
  // Format price
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(8);
  };
  
  // Format amount
  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(8);
  };
  
  // Format total
  const formatTotal = (total: string) => {
    return parseFloat(total).toFixed(8);
  };
  
  // Handle order click
  const handleOrderClick = (price: string, type: 'buy' | 'sell') => {
    if (onOrderSelect) {
      onOrderSelect(price, type);
    }
  };
  
  // Calculate the maximum total for bids and asks
  const maxBidTotal = bids.length > 0 ? parseFloat(bids[bids.length - 1].total) : 0;
  const maxAskTotal = asks.length > 0 ? parseFloat(asks[asks.length - 1].total) : 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);
  
  return (
    <div className={`orderbook-display ${className || ''}`}>
      <div className="orderbook-header">
        <h3>Orderbook</h3>
        <div className="orderbook-pair">{baseAsset}/{quoteAsset}</div>
        {timestamp && (
          <div className="orderbook-timestamp">
            Last updated: {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="orderbook-content">
        <div className="orderbook-asks">
          <div className="orderbook-row orderbook-header-row">
            <div className="orderbook-cell">Price</div>
            <div className="orderbook-cell">Amount</div>
            <div className="orderbook-cell">Total</div>
          </div>
          
          {asks.slice(0, maxDepth).map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="orderbook-row orderbook-ask-row"
              onClick={() => handleOrderClick(ask.price, 'sell')}
            >
              <div className="orderbook-cell orderbook-price orderbook-ask-price">
                {formatPrice(ask.price)}
              </div>
              <div className="orderbook-cell orderbook-amount">
                {formatAmount(ask.amount)}
              </div>
              <div className="orderbook-cell orderbook-total">
                {formatTotal(ask.total)}
              </div>
              <div
                className="orderbook-depth-bar orderbook-ask-depth-bar"
                style={{
                  width: `${(parseFloat(ask.total) / maxTotal) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
        
        <div className="orderbook-spread">
          {bids.length > 0 && asks.length > 0 && (
            <div className="orderbook-spread-value">
              Spread: {(parseFloat(asks[0].price) - parseFloat(bids[0].price)).toFixed(8)} (
              {(
                ((parseFloat(asks[0].price) - parseFloat(bids[0].price)) /
                  parseFloat(asks[0].price)) *
                100
              ).toFixed(2)}
              %)
            </div>
          )}
        </div>
        
        <div className="orderbook-bids">
          <div className="orderbook-row orderbook-header-row">
            <div className="orderbook-cell">Price</div>
            <div className="orderbook-cell">Amount</div>
            <div className="orderbook-cell">Total</div>
          </div>
          
          {bids.slice(0, maxDepth).map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="orderbook-row orderbook-bid-row"
              onClick={() => handleOrderClick(bid.price, 'buy')}
            >
              <div className="orderbook-cell orderbook-price orderbook-bid-price">
                {formatPrice(bid.price)}
              </div>
              <div className="orderbook-cell orderbook-amount">
                {formatAmount(bid.amount)}
              </div>
              <div className="orderbook-cell orderbook-total">
                {formatTotal(bid.total)}
              </div>
              <div
                className="orderbook-depth-bar orderbook-bid-depth-bar"
                style={{
                  width: `${(parseFloat(bid.total) / maxTotal) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderbookDisplay;