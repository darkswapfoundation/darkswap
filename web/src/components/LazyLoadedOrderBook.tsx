import React, { useState, useEffect, Suspense } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { LazyOnVisible } from '../utils/lazyLoading';
import { cacheApiResponse } from '../utils/caching';
import { measureApiCall } from '../utils/performanceMonitoring';

// Lazy-loaded components
const OrderBookTable = React.lazy(() => import('./OrderBookTable'));
const OrderBookChart = React.lazy(() => import('./OrderBookChart'));
const OrderBookFilters = React.lazy(() => import('./OrderBookFilters'));

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading Order Book...</p>
  </div>
);

interface LazyLoadedOrderBookProps {
  defaultPair?: string;
  className?: string;
}

/**
 * Lazy-loaded order book component with performance optimizations
 */
const LazyLoadedOrderBook: React.FC<LazyLoadedOrderBookProps> = ({
  defaultPair = 'BTC/RUNE1',
  className
}) => {
  // State
  const [pair, setPair] = useState<string>(defaultPair);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [filters, setFilters] = useState({
    minAmount: 0,
    maxAmount: Infinity,
    orderType: 'all' // 'buy', 'sell', 'all'
  });
  
  // Contexts
  const { api } = useApi();
  const { connect, subscribe, unsubscribe } = useWebSocket();
  
  // Parse pair into sell and buy assets
  const [sellAsset, buyAsset] = pair.split('/');
  
  // Fetch order book data
  const fetchOrderBook = async () => {
    if (!sellAsset || !buyAsset) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cacheKey = `orderbook_${sellAsset}_${buyAsset}`;
      
      const response = await cacheApiResponse(
        () => measureApiCall(
          `get_orderbook_${sellAsset}_${buyAsset}`,
          () => api.get(`/api/orderbook?sellAsset=${sellAsset}&buyAsset=${buyAsset}`)
        ),
        cacheKey,
        10000 // Cache for 10 seconds
      );
      
      if (response && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching order book:', err);
      setError('Failed to load order book data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connect to WebSocket and subscribe to order book updates
  useEffect(() => {
    // Ensure WebSocket is connected
    connect();
    
    // Fetch initial data
    fetchOrderBook();
    
    // Subscribe to order book updates
    const topic = `orderbook/${sellAsset}/${buyAsset}`;
    subscribe(topic, handleOrderBookUpdate);
    
    return () => {
      unsubscribe(topic, handleOrderBookUpdate);
    };
  }, [sellAsset, buyAsset]);
  
  // Handle order book updates from WebSocket
  const handleOrderBookUpdate = (message: any) => {
    if (message && message.type === 'orderbook_update') {
      // Update orders based on the message
      if (message.action === 'add') {
        setOrders(prevOrders => [...prevOrders, message.order]);
      } else if (message.action === 'remove') {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== message.orderId));
      } else if (message.action === 'update') {
        setOrders(prevOrders => prevOrders.map(order => 
          order.id === message.order.id ? message.order : order
        ));
      } else if (message.action === 'reset') {
        setOrders(message.orders || []);
      }
    }
  };
  
  // Handle pair change
  const handlePairChange = (newPair: string) => {
    setPair(newPair);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: 'table' | 'chart') => {
    setViewMode(mode);
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };
  
  // Apply filters to orders
  const filteredOrders = orders.filter(order => {
    // Apply min/max amount filter
    const amount = parseFloat(order.amount);
    if (amount < filters.minAmount || amount > filters.maxAmount) {
      return false;
    }
    
    // Apply order type filter
    if (filters.orderType !== 'all' && order.type !== filters.orderType) {
      return false;
    }
    
    return true;
  });
  
  // Render filters component (lazy loaded)
  const renderFilters = () => (
    <Suspense fallback={<div>Loading filters...</div>}>
      <OrderBookFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onPairChange={handlePairChange}
        currentPair={pair}
        onViewModeChange={handleViewModeChange}
        currentViewMode={viewMode}
      />
    </Suspense>
  );
  
  // Render content based on view mode
  const renderContent = () => {
    if (isLoading) {
      return <LoadingFallback />;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (viewMode === 'table') {
      return (
        <LazyOnVisible
          importFunc={() => import('./OrderBookTable')}
          options={{ threshold: 0.1 }}
        >
          <OrderBookTable
            orders={filteredOrders}
            sellAsset={sellAsset}
            buyAsset={buyAsset}
          />
        </LazyOnVisible>
      );
    } else {
      return (
        <LazyOnVisible
          importFunc={() => import('./OrderBookChart')}
          options={{ threshold: 0.1 }}
        >
          <OrderBookChart
            orders={filteredOrders}
            sellAsset={sellAsset}
            buyAsset={buyAsset}
          />
        </LazyOnVisible>
      );
    }
  };
  
  return (
    <div className={`lazy-loaded-orderbook ${className || ''}`}>
      {renderFilters()}
      {renderContent()}
    </div>
  );
};

export default React.memo(LazyLoadedOrderBook);