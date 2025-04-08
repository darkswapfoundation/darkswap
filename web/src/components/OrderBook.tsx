import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { PriceLevel } from '../types';
import '../styles/OrderBook.css';

interface OrderBookProps {
  baseAsset: string;
  quoteAsset: string;
  depth?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({
  baseAsset,
  quoteAsset,
  depth = 10,
}) => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { connected, on, send } = useWebSocket();
  
  const [buyLevels, setBuyLevels] = useState<PriceLevel[]>([]);
  const [sellLevels, setSellLevels] = useState<PriceLevel[]>([]);
  const [spread, setSpread] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
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
  
  // Calculate spread
  const calculateSpread = useCallback((buyLevels: PriceLevel[], sellLevels: PriceLevel[]): string | null => {
    if (buyLevels.length === 0 || sellLevels.length === 0) {
      return null;
    }
    
    const highestBid = parseFloat(buyLevels[0].price);
    const lowestAsk = parseFloat(sellLevels[0].price);
    const spread = lowestAsk - highestBid;
    const spreadPercentage = (spread / lowestAsk) * 100;
    
    return `${formatPrice(spread.toString())} (${spreadPercentage.toFixed(2)}%)`;
  }, [formatPrice]);
  
  // Fetch order book
  const fetchOrderBook = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch buy levels
      const buyResponse = await api.getOrderBook(baseAsset, quoteAsset, 'buy', depth);
      setBuyLevels(buyResponse);
      
      // Fetch sell levels
      const sellResponse = await api.getOrderBook(baseAsset, quoteAsset, 'sell', depth);
      setSellLevels(sellResponse);
      
      // Calculate spread
      setSpread(calculateSpread(buyResponse, sellResponse));
      
      // Update last update time
      setLastUpdateTime(Date.now());
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch order book:', error);
      setError('Failed to fetch order book. Please try again later.');
      setIsLoading(false);
    }
  }, [api, baseAsset, quoteAsset, depth, calculateSpread]);
  
  // Handle order book update
  const handleOrderBookUpdate = useCallback((data: any) => {
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset) {
      // Update buy levels
      if (data.buyLevels) {
        setBuyLevels(data.buyLevels);
      }
      
      // Update sell levels
      if (data.sellLevels) {
        setSellLevels(data.sellLevels);
      }
      
      // Calculate spread
      setSpread(calculateSpread(data.buyLevels || buyLevels, data.sellLevels || sellLevels));
      
      // Update last update time
      setLastUpdateTime(Date.now());
    }
  }, [baseAsset, quoteAsset, buyLevels, sellLevels, calculateSpread]);
  
  // Handle trade update
  const handleTradeUpdate = useCallback((data: any) => {
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset) {
      // Update last price
      setLastPrice(data.price);
    }
  }, [baseAsset, quoteAsset]);
  
  // Subscribe to order book updates
  useEffect(() => {
    // Fetch initial data
    fetchOrderBook();
    
    // Subscribe to order book updates if socket is connected
    if (connected) {
      const orderBookUnsubscribe = on('orderBookUpdate', handleOrderBookUpdate);
      const tradeUnsubscribe = on('tradeUpdate', handleTradeUpdate);
      
      // Subscribe to order book updates
      send('subscribeOrderBook', {
        baseAsset,
        quoteAsset,
        depth,
      });
      
      // Subscribe to trade updates
      send('subscribeTrades', {
        baseAsset,
        quoteAsset,
      });
      
      // Clean up
      return () => {
        orderBookUnsubscribe();
        tradeUnsubscribe();
        
        send('unsubscribeOrderBook', {
          baseAsset,
          quoteAsset,
        });
        
        send('unsubscribeTrades', {
          baseAsset,
          quoteAsset,
        });
      };
    }
    
    // Set up polling for updates if socket is not connected
    const intervalId = !connected ? setInterval(fetchOrderBook, 5000) : null;
    
    // Clean up
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchOrderBook, connected, on, send, baseAsset, quoteAsset, depth, handleOrderBookUpdate, handleTradeUpdate]);
  
  return (
    <div className={`order-book order-book-${theme}`}>
      <div className="order-book-header">
        <h3>Order Book</h3>
        <div className="order-book-spread">
          Spread: {spread || 'N/A'}
        </div>
      </div>
      
      {isLoading ? (
        <div className="order-book-loading">
          <div className="spinner"></div>
          <p>Loading order book...</p>
        </div>
      ) : error ? (
        <div className="order-book-error">
          <p>{error}</p>
          <button onClick={fetchOrderBook}>Retry</button>
        </div>
      ) : (
        <div className="order-book-content">
          <div className="order-book-table-header">
            <div className="order-book-price">Price ({quoteAsset})</div>
            <div className="order-book-amount">Amount ({baseAsset})</div>
            <div className="order-book-total">Total ({quoteAsset})</div>
          </div>
          
          <div className="order-book-sells">
            {sellLevels.map((level, index) => (
              <div key={`sell-${index}`} className="order-book-level sell-level">
                <div className="order-book-price sell-price">{formatPrice(level.price)}</div>
                <div className="order-book-amount">{formatPrice(level.amount)}</div>
                <div className="order-book-total">{formatPrice(level.total)}</div>
                <div
                  className="order-book-depth-visualization sell-depth"
                  style={{
                    width: `${(parseFloat(level.total) / parseFloat(sellLevels[0].total)) * 100}%`,
                  }}
                ></div>
              </div>
            ))}
          </div>
          
          <div className="order-book-last-price">
            <div className="order-book-last-price-value">
              {lastPrice ? formatPrice(lastPrice) : 'N/A'}
            </div>
          </div>
          
          <div className="order-book-buys">
            {buyLevels.map((level, index) => (
              <div key={`buy-${index}`} className="order-book-level buy-level">
                <div className="order-book-price buy-price">{formatPrice(level.price)}</div>
                <div className="order-book-amount">{formatPrice(level.amount)}</div>
                <div className="order-book-total">{formatPrice(level.total)}</div>
                <div
                  className="order-book-depth-visualization buy-depth"
                  style={{
                    width: `${(parseFloat(level.total) / parseFloat(buyLevels[0].total)) * 100}%`,
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="order-book-footer">
        <div className="order-book-last-update">
          Last update: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;