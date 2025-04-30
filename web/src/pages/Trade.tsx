import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import PriceChart from '../components/PriceChart';
import TradeHistory from '../components/TradeHistory';
import TradeForm from '../components/TradeForm';
import WebSocketStatus from '../components/WebSocketStatus';
import '../styles/Trade.css';

// Import OrderBook with correct casing
const OrderBook = React.lazy(() => import('../components/OrderBook'));

type TradeRouteParams = {
  baseAsset?: string;
  quoteAsset?: string;
};

const Trade: React.FC = () => {
  const { theme } = useTheme();
  const { connected } = useWebSocket();
  const params = useParams();
  const [searchParams] = useSearchParams();
  
  // Extract baseAsset and quoteAsset from params
  const baseAsset = params.baseAsset;
  const quoteAsset = params.quoteAsset;
  
  const [selectedBaseAsset, setSelectedBaseAsset] = useState<string>(baseAsset || 'BTC');
  const [selectedQuoteAsset, setSelectedQuoteAsset] = useState<string>(quoteAsset || 'USDT');
  const [timeframe, setTimeframe] = useState<string>(searchParams.get('timeframe') || '1h');
  const [lastPrice, setLastPrice] = useState<string>('');
  const [priceChangePercent, setPriceChangePercent] = useState<string>('0.00');
  const [priceChangeDirection, setPriceChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  
  // Update document title
  useEffect(() => {
    document.title = `${selectedBaseAsset}/${selectedQuoteAsset} - DarkSwap`;
  }, [selectedBaseAsset, selectedQuoteAsset]);
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };
  
  // Handle last price update
  const handleLastPriceUpdate = (price: string, changePercent: string, direction: 'up' | 'down' | 'neutral') => {
    setLastPrice(price);
    setPriceChangePercent(changePercent);
    setPriceChangeDirection(direction);
  };
  
  return (
    <div className={`trade-page trade-page-${theme}`}>
      <div className="trade-page-header">
        <div className="trade-page-market-info">
          <h2>{selectedBaseAsset}/{selectedQuoteAsset}</h2>
          <div className={`trade-page-price ${priceChangeDirection}`}>
            <span className="trade-page-last-price">{lastPrice || 'N/A'}</span>
            <span className="trade-page-price-change">
              {priceChangeDirection === 'up' ? '▲' : priceChangeDirection === 'down' ? '▼' : ''}
              {priceChangePercent}%
            </span>
          </div>
        </div>
        
        <div className="trade-page-connection-status">
          <WebSocketStatus showLabel={true} size="medium" />
        </div>
      </div>
      
      <div className="trade-page-content">
        <div className="trade-page-left">
          <div className="trade-page-chart">
            <PriceChart
              baseAsset={selectedBaseAsset}
              quoteAsset={selectedQuoteAsset}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
            />
          </div>
          
          <div className="trade-page-orderbook-history">
            <div className="trade-page-orderbook">
              <React.Suspense fallback={<div>Loading OrderBook...</div>}>
                <OrderBook
                  baseAsset={selectedBaseAsset}
                  quoteAsset={selectedQuoteAsset}
                  depth={10}
                />
              </React.Suspense>
            </div>
            
            <div className="trade-page-history">
              <TradeHistory
                baseAsset={selectedBaseAsset}
                quoteAsset={selectedQuoteAsset}
                limit={20}
              />
            </div>
          </div>
        </div>
        
        <div className="trade-page-right">
          <TradeForm
            baseAsset={selectedBaseAsset}
            quoteAsset={selectedQuoteAsset}
            lastPrice={lastPrice}
          />
        </div>
      </div>
      
      {!connected && (
        <div className="trade-page-offline-warning">
          <div className="trade-page-offline-icon">⚠️</div>
          <div className="trade-page-offline-message">
            <strong>You are currently offline.</strong>
            <span>Real-time updates are disabled. Data may be stale.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trade;