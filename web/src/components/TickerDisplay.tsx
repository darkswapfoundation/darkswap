import React from 'react';
import { useTicker } from '../contexts/WebSocketContext';

// Ticker display props
interface TickerDisplayProps {
  baseAsset: string;
  quoteAsset: string;
  className?: string;
}

/**
 * Ticker display component
 * @param props Component props
 * @returns Ticker display component
 */
const TickerDisplay: React.FC<TickerDisplayProps> = ({
  baseAsset,
  quoteAsset,
  className,
}) => {
  // Get ticker data
  const ticker = useTicker(baseAsset, quoteAsset);
  
  // Format price
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(8);
  };
  
  // Format volume
  const formatVolume = (volume: string) => {
    return parseFloat(volume).toFixed(2);
  };
  
  // Format change
  const formatChange = (change: string) => {
    return parseFloat(change).toFixed(2);
  };
  
  // Get change class
  const getChangeClass = (change: string) => {
    const changeValue = parseFloat(change);
    if (changeValue > 0) {
      return 'ticker-change-positive';
    } else if (changeValue < 0) {
      return 'ticker-change-negative';
    } else {
      return 'ticker-change-neutral';
    }
  };
  
  return (
    <div className={`ticker-display ${className || ''}`}>
      <div className="ticker-header">
        <h3>Ticker</h3>
        <div className="ticker-pair">{baseAsset}/{quoteAsset}</div>
        {ticker.timestamp && (
          <div className="ticker-timestamp">
            Last updated: {ticker.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="ticker-content">
        <div className="ticker-row">
          <div className="ticker-label">Last Price:</div>
          <div className="ticker-value ticker-last">{formatPrice(ticker.last)}</div>
        </div>
        
        <div className="ticker-row">
          <div className="ticker-label">Bid:</div>
          <div className="ticker-value ticker-bid">{formatPrice(ticker.bid)}</div>
        </div>
        
        <div className="ticker-row">
          <div className="ticker-label">Ask:</div>
          <div className="ticker-value ticker-ask">{formatPrice(ticker.ask)}</div>
        </div>
        
        <div className="ticker-row">
          <div className="ticker-label">24h Volume:</div>
          <div className="ticker-value ticker-volume">{formatVolume(ticker.volume)}</div>
        </div>
        
        <div className="ticker-row">
          <div className="ticker-label">24h Change:</div>
          <div className={`ticker-value ticker-change ${getChangeClass(ticker.change24h)}`}>
            {formatChange(ticker.change24h)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default TickerDisplay;