import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { OrderBook, OrderBookEntry } from '../../utils/types';
import { formatPrice, formatNumber } from '../../utils/formatters';
import { useDebounce, useStableCallback } from '../../utils/memoization';
import { lazyLoad } from '../../utils/lazyLoading';

// Define OrderBookChart props type
interface OrderBookChartProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  baseAsset: string;
  quoteAsset: string;
  isDark: boolean;
}

// Lazy load components with proper types
const OrderBookChart = lazyLoad<OrderBookChartProps>(() => import('../OrderBookChart'), {
  fallback: <div className="order-book-chart-skeleton"></div>
});

interface LazyLoadedOrderBookProps {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  depth?: number;
  grouping?: number;
  onPriceSelect?: (price: number) => void;
  showChart?: boolean;
  showSpread?: boolean;
  showHeader?: boolean;
  showTotals?: boolean;
  className?: string;
}

const LazyLoadedOrderBook: React.FC<LazyLoadedOrderBookProps> = ({
  pair,
  baseAsset,
  quoteAsset,
  depth = 10,
  grouping = 0,
  onPriceSelect,
  showChart = true,
  showSpread = true,
  showHeader = true,
  showTotals = true,
  className = ''
}) => {
  // Hooks
  const { theme, isDark } = useTheme();
  const { subscribe, unsubscribe } = useWebSocket();
  
  // State
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const subscriptionIdRef = useRef<string | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Debounced grouping
  const debouncedGrouping = useDebounce(grouping, 300);
  
  // Process order book data
  const processOrderBook = useCallback((data: OrderBook): OrderBook => {
    if (!data) return data;
    
    // Apply grouping if needed
    if (debouncedGrouping > 0) {
      return {
        ...data,
        bids: groupOrders(data.bids, debouncedGrouping, 'bid'),
        asks: groupOrders(data.asks, debouncedGrouping, 'ask')
      };
    }
    
    return data;
  }, [debouncedGrouping]);
  
  // Group orders by price
  const groupOrders = (orders: OrderBookEntry[], groupSize: number, type: 'bid' | 'ask'): OrderBookEntry[] => {
    if (!orders || orders.length === 0 || groupSize <= 0) return orders;
    
    const grouped: Record<string, OrderBookEntry> = {};
    
    orders.forEach(order => {
      // Calculate group price
      const groupPrice = type === 'bid'
        ? Math.floor(order.price / groupSize) * groupSize
        : Math.ceil(order.price / groupSize) * groupSize;
      
      const key = groupPrice.toString();
      
      if (!grouped[key]) {
        grouped[key] = {
          price: groupPrice,
          amount: 0,
          total: 0,
          count: 0
        };
      }
      
      grouped[key].amount += order.amount;
      grouped[key].count += order.count || 1;
    });
    
    // Convert back to array and sort
    let result = Object.values(grouped);
    
    // Sort by price
    result = result.sort((a, b) => type === 'bid' ? b.price - a.price : a.price - b.price);
    
    // Calculate totals
    let runningTotal = 0;
    result.forEach(order => {
      runningTotal += order.amount;
      order.total = runningTotal;
    });
    
    // Limit to depth
    return result.slice(0, depth);
  };
  
  // Calculate spread
  const spread = useMemo(() => {
    if (!orderBook || !orderBook.asks || !orderBook.bids || 
        orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      return { value: 0, percentage: 0 };
    }
    
    const lowestAsk = orderBook.asks[0].price;
    const highestBid = orderBook.bids[0].price;
    const value = lowestAsk - highestBid;
    const percentage = (value / lowestAsk) * 100;
    
    return { value, percentage };
  }, [orderBook]);
  
  // Calculate max total for visualization
  const maxTotal = useMemo(() => {
    if (!orderBook) return 0;
    
    const maxBidTotal = orderBook.bids.length > 0 
      ? orderBook.bids[orderBook.bids.length - 1].total 
      : 0;
      
    const maxAskTotal = orderBook.asks.length > 0 
      ? orderBook.asks[orderBook.asks.length - 1].total 
      : 0;
      
    return Math.max(maxBidTotal, maxAskTotal);
  }, [orderBook]);
  
  // Handle order book update
  const handleOrderBookUpdate = useCallback((data: any) => {
    if (!data || !data.pair || data.pair !== pair) return;
    
    // Rate limit updates to 10 per second
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 100) {
      // If we're updating too frequently, use requestAnimationFrame
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          setOrderBook(processOrderBook(data));
          animationFrameRef.current = null;
          lastUpdateTimeRef.current = Date.now();
        });
      }
      return;
    }
    
    // Update immediately
    setOrderBook(processOrderBook(data));
    lastUpdateTimeRef.current = now;
  }, [pair, processOrderBook]);
  
  // Subscribe to order book updates
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Subscribe to order book updates
    const topic = `orderbook/${pair}`;
    subscriptionIdRef.current = subscribe(topic, handleOrderBookUpdate);
    
    return () => {
      // Unsubscribe when component unmounts or pair changes
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      
      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [pair, subscribe, unsubscribe, handleOrderBookUpdate]);
  
  // Update loading state when order book is received
  useEffect(() => {
    if (orderBook) {
      setLoading(false);
    }
  }, [orderBook]);
  
  // Handle price selection
  const handlePriceClick = useCallback((price: number) => {
    if (onPriceSelect) {
      onPriceSelect(price);
    }
  }, [onPriceSelect]);
  
  // Render loading state
  if (loading) {
    return (
      <div className={`order-book-container ${className}`}>
        <div className="order-book-loading">
          <div className="spinner"></div>
          <div>Loading order book...</div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`order-book-container ${className}`}>
        <div className="order-book-error">
          <div>Error loading order book</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!orderBook || (!orderBook.asks.length && !orderBook.bids.length)) {
    return (
      <div className={`order-book-container ${className}`}>
        <div className="order-book-empty">
          <div>No orders available</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`order-book-container ${className}`}>
      {/* Order Book Header */}
      {showHeader && (
        <div className="order-book-header">
          <h3>Order Book</h3>
          <div className="order-book-pair">{pair}</div>
        </div>
      )}
      
      {/* Chart */}
      {showChart && (
        <div className="order-book-chart">
          <OrderBookChart
            bids={orderBook.bids}
            asks={orderBook.asks}
            baseAsset={baseAsset}
            quoteAsset={quoteAsset}
            isDark={isDark}
          />
        </div>
      )}
      
      {/* Order Book Table */}
      <div className="order-book-table">
        {/* Table Header */}
        <div className="order-book-table-header">
          <div className="price-col">Price ({quoteAsset})</div>
          <div className="amount-col">Amount ({baseAsset})</div>
          {showTotals && <div className="total-col">Total ({baseAsset})</div>}
        </div>
        
        {/* Asks (Sell Orders) */}
        <div className="order-book-asks">
          {orderBook.asks.slice(0, depth).map((ask, index) => (
            <div
              key={`ask-${ask.price}-${index}`}
              className="order-book-row ask-row"
              onClick={() => handlePriceClick(ask.price)}
            >
              <div className="price-col ask-price">{formatPrice(ask.price)}</div>
              <div className="amount-col">{formatNumber(ask.amount, 6)}</div>
              {showTotals && <div className="total-col">{formatNumber(ask.total, 6)}</div>}
              <div 
                className="depth-visualization ask-depth" 
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        
        {/* Spread */}
        {showSpread && (
          <div className="order-book-spread">
            <div>Spread: {formatPrice(spread.value)} ({formatNumber(spread.percentage, 2)}%)</div>
          </div>
        )}
        
        {/* Bids (Buy Orders) */}
        <div className="order-book-bids">
          {orderBook.bids.slice(0, depth).map((bid, index) => (
            <div
              key={`bid-${bid.price}-${index}`}
              className="order-book-row bid-row"
              onClick={() => handlePriceClick(bid.price)}
            >
              <div className="price-col bid-price">{formatPrice(bid.price)}</div>
              <div className="amount-col">{formatNumber(bid.amount, 6)}</div>
              {showTotals && <div className="total-col">{formatNumber(bid.total, 6)}</div>}
              <div 
                className="depth-visualization bid-depth" 
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LazyLoadedOrderBook);