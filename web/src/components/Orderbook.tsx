import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { OrderSide, PriceLevel } from '../types';
import '../styles/OrderBook.css';

interface OrderBookProps {
  baseAsset: string;
  quoteAsset: string;
  depth?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ baseAsset, quoteAsset, depth = 10 }) => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { socket, connected, on } = useWebSocket();
  
  const [buyLevels, setBuyLevels] = useState<PriceLevel[]>([]);
  const [sellLevels, setSellLevels] = useState<PriceLevel[]>([]);
  const [spread, setSpread] = useState<string | null>(null);
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
  
  // Format volume with appropriate decimal places
  const formatVolume = useCallback((volume: string): string => {
    const numVolume = parseFloat(volume);
    if (numVolume < 0.001) {
      return numVolume.toFixed(6);
    } else if (numVolume < 1) {
      return numVolume.toFixed(4);
    } else if (numVolume < 1000) {
      return numVolume.toFixed(2);
    } else {
      return numVolume.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  }, []);
  
  // Calculate total volume
  const calculateTotalVolume = useCallback((levels: PriceLevel[]): string => {
    const total = levels.reduce((sum, level) => sum + parseFloat(level.volume), 0);
    return formatVolume(total.toString());
  }, [formatVolume]);
  
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
  
  // Fetch order book data
  const fetchOrderBook = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch buy orders
      const buyResponse = await api.getPriceLevels(baseAsset, quoteAsset, OrderSide.Buy, depth);
      
      // Fetch sell orders
      const sellResponse = await api.getPriceLevels(baseAsset, quoteAsset, OrderSide.Sell, depth);
      
      // Sort buy orders by price (descending)
      const sortedBuyLevels = buyResponse.sort((a: PriceLevel, b: PriceLevel) => 
        parseFloat(b.price) - parseFloat(a.price)
      );
      
      // Sort sell orders by price (ascending)
      const sortedSellLevels = sellResponse.sort((a: PriceLevel, b: PriceLevel) => 
        parseFloat(a.price) - parseFloat(b.price)
      );
      
      // Update state
      setBuyLevels(sortedBuyLevels);
      setSellLevels(sortedSellLevels);
      setSpread(calculateSpread(sortedBuyLevels, sortedSellLevels));
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
        setBuyLevels(prevLevels => {
          // Create a map of existing levels
          const levelMap = new Map(prevLevels.map(level => [level.price, level]));
          
          // Update or add new levels
          for (const level of data.buyLevels) {
            if (parseFloat(level.volume) === 0) {
              // Remove level if volume is zero
              levelMap.delete(level.price);
            } else {
              // Update or add level
              levelMap.set(level.price, level);
            }
          }
          
          // Convert map back to array and sort
          const updatedLevels = Array.from(levelMap.values())
            .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
            .slice(0, depth);
          
          return updatedLevels;
        });
      }
      
      // Update sell levels
      if (data.sellLevels) {
        setSellLevels(prevLevels => {
          // Create a map of existing levels
          const levelMap = new Map(prevLevels.map(level => [level.price, level]));
          
          // Update or add new levels
          for (const level of data.sellLevels) {
            if (parseFloat(level.volume) === 0) {
              // Remove level if volume is zero
              levelMap.delete(level.price);
            } else {
              // Update or add level
              levelMap.set(level.price, level);
            }
          }
          
          // Convert map back to array and sort
          const updatedLevels = Array.from(levelMap.values())
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            .slice(0, depth);
          
          return updatedLevels;
        });
      }
      
      // Update last update time
      setLastUpdateTime(Date.now());
    }
  }, [baseAsset, quoteAsset, depth]);
  
  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchOrderBook();
    
    // Subscribe to order book updates if socket is connected
    if (connected) {
      const unsubscribe = on('orderBookUpdate', handleOrderBookUpdate);
      
      // Subscribe to order book updates
      socket.send(JSON.stringify({
        type: 'subscribeOrderBook',
        data: { baseAsset, quoteAsset }
      }));
      
      // Clean up
      return () => {
        unsubscribe();
        socket.send(JSON.stringify({
          type: 'unsubscribeOrderBook',
          data: { baseAsset, quoteAsset }
        }));
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
  }, [fetchOrderBook, handleOrderBookUpdate, socket, connected, on, baseAsset, quoteAsset]);
  
  // Update spread when buy or sell levels change
  useEffect(() => {
    setSpread(calculateSpread(buyLevels, sellLevels));
  }, [buyLevels, sellLevels, calculateSpread]);
  
  // Calculate maximum volume for visualization
  const maxBuyVolume = Math.max(...buyLevels.map(level => parseFloat(level.volume)), 0.00001);
  const maxSellVolume = Math.max(...sellLevels.map(level => parseFloat(level.volume)), 0.00001);
  
  // Calculate volume percentage for visualization
  const getVolumePercentage = (volume: string, side: 'buy' | 'sell'): number => {
    const maxVolume = side === 'buy' ? maxBuyVolume : maxSellVolume;
    return (parseFloat(volume) / maxVolume) * 100;
  };
  
  // Render loading state
  if (isLoading && buyLevels.length === 0 && sellLevels.length === 0) {
    return (
      <div className={`order-book order-book-${theme}`}>
        <div className="order-book-header">
          <h3>{baseAsset}/{quoteAsset} Order Book</h3>
        </div>
        <div className="order-book-loading">
          <div className="spinner"></div>
          <p>Loading order book...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`order-book order-book-${theme}`}>
        <div className="order-book-header">
          <h3>{baseAsset}/{quoteAsset} Order Book</h3>
        </div>
        <div className="order-book-error">
          <p>{error}</p>
          <button onClick={fetchOrderBook}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`order-book order-book-${theme}`}>
      <div className="order-book-header">
        <h3>{baseAsset}/{quoteAsset} Order Book</h3>
        <div className="order-book-info">
          <span>Spread: {spread || 'N/A'}</span>
          <span>Last update: {new Date(lastUpdateTime).toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="order-book-content">
        {/* Sell orders (asks) */}
        <div className="order-book-sells">
          <div className="order-book-header-row">
            <div>Price ({quoteAsset})</div>
            <div>Amount ({baseAsset})</div>
            <div>Total</div>
          </div>
          
          <div className="order-book-levels">
            {sellLevels.length === 0 ? (
              <div className="order-book-empty">No sell orders</div>
            ) : (
              sellLevels.map((level, index) => (
                <div key={`sell-${level.price}-${index}`} className="order-book-level">
                  <div className="order-book-price sell-price">{formatPrice(level.price)}</div>
                  <div className="order-book-volume">{formatVolume(level.volume)}</div>
                  <div className="order-book-total">{formatVolume(level.volume)}</div>
                  <div 
                    className="order-book-volume-bar sell-volume-bar" 
                    style={{ width: `${getVolumePercentage(level.volume, 'sell')}%` }}
                  ></div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Spread */}
        <div className="order-book-spread">
          <div className="order-book-spread-value">
            Spread: {spread || 'N/A'}
          </div>
        </div>
        
        {/* Buy orders (bids) */}
        <div className="order-book-buys">
          <div className="order-book-header-row">
            <div>Price ({quoteAsset})</div>
            <div>Amount ({baseAsset})</div>
            <div>Total</div>
          </div>
          
          <div className="order-book-levels">
            {buyLevels.length === 0 ? (
              <div className="order-book-empty">No buy orders</div>
            ) : (
              buyLevels.map((level, index) => (
                <div key={`buy-${level.price}-${index}`} className="order-book-level">
                  <div className="order-book-price buy-price">{formatPrice(level.price)}</div>
                  <div className="order-book-volume">{formatVolume(level.volume)}</div>
                  <div className="order-book-total">{formatVolume(level.volume)}</div>
                  <div 
                    className="order-book-volume-bar buy-volume-bar" 
                    style={{ width: `${getVolumePercentage(level.volume, 'buy')}%` }}
                  ></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="order-book-footer">
        <div className="order-book-totals">
          <div>
            <span>Total Buy Volume:</span>
            <span>{calculateTotalVolume(buyLevels)} {baseAsset}</span>
          </div>
          <div>
            <span>Total Sell Volume:</span>
            <span>{calculateTotalVolume(sellLevels)} {baseAsset}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;