import React, { useState, useEffect } from 'react';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatAmount, formatPrice, formatAddress, formatDate } from '../utils/formatters';

interface OrderHistoryProps {
  className?: string;
  limit?: number;
}

interface Order {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop-limit' | 'stop-market';
  price: string;
  amount: string;
  filled: string;
  status: 'open' | 'filled' | 'partially_filled' | 'canceled' | 'expired';
  timestamp: number;
  expiry: number;
  maker: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  className = '',
  limit: initialLimit = 10,
}) => {
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'filled' | 'canceled'>('all');
  const [limit, setLimit] = useState<number>(initialLimit);
  
  // Get wallet context
  const { isConnected, address } = useWasmWallet();
  
  // Get API client
  const { client } = useApi();
  
  // Get notification context
  const { addNotification } = useNotification();
  
  // Fetch order history
  const fetchOrderHistory = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock orders
      const mockOrders: Order[] = [];
      
      // Current timestamp
      const now = Date.now();
      
      // Order types
      const types: ('limit' | 'market' | 'stop-limit' | 'stop-market')[] = ['limit', 'market', 'stop-limit', 'stop-market'];
      
      // Order statuses
      const statuses: ('open' | 'filled' | 'partially_filled' | 'canceled' | 'expired')[] = ['open', 'filled', 'partially_filled', 'canceled', 'expired'];
      
      // Asset pairs
      const assetPairs = [
        { base: 'BTC', quote: 'RUNE1' },
        { base: 'BTC', quote: 'RUNE2' },
        { base: 'BTC', quote: 'ALK1' },
        { base: 'RUNE1', quote: 'ALK1' },
        { base: 'RUNE2', quote: 'ALK2' },
      ];
      
      // Generate random orders
      for (let i = 0; i < 20; i++) {
        const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const assetPair = assetPairs[Math.floor(Math.random() * assetPairs.length)];
        const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in the last 30 days
        const expiry = timestamp + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // Random expiry within 7 days of creation
        
        const amount = (Math.random() * 10).toFixed(8);
        const filled = status === 'open' ? '0' : 
                      status === 'filled' ? amount : 
                      status === 'partially_filled' ? (parseFloat(amount) * Math.random()).toFixed(8) : '0';
        
        mockOrders.push({
          id: `order-${i}`,
          baseAsset: assetPair.base,
          quoteAsset: assetPair.quote,
          side,
          type,
          price: (Math.random() * 0.001).toFixed(8),
          amount,
          filled,
          status,
          timestamp,
          expiry,
          maker: address || `bc1q${Math.random().toString(36).substring(2, 15)}`,
        });
      }
      
      // Sort by timestamp (newest first)
      mockOrders.sort((a, b) => b.timestamp - a.timestamp);
      
      setOrders(mockOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch order history on mount
  useEffect(() => {
    if (isConnected) {
      fetchOrderHistory();
    }
  }, [isConnected]);
  
  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'open') return order.status === 'open' || order.status === 'partially_filled';
    if (filter === 'filled') return order.status === 'filled';
    if (filter === 'canceled') return order.status === 'canceled' || order.status === 'expired';
    return true;
  }).slice(0, limit);
  
  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with a delay
      
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update order status
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: 'canceled' } : order
        )
      );
      
      addNotification('success', 'Order canceled successfully');
    } catch (err) {
      addNotification('error', `Failed to cancel order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: 'open' | 'filled' | 'partially_filled' | 'canceled' | 'expired') => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500 bg-opacity-20 text-blue-500">
            Open
          </span>
        );
      case 'filled':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500 bg-opacity-20 text-green-500">
            Filled
          </span>
        );
      case 'partially_filled':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 bg-opacity-20 text-yellow-500">
            Partially Filled
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500 bg-opacity-20 text-red-500">
            Canceled
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-500 bg-opacity-20 text-gray-500">
            Expired
          </span>
        );
    }
  };
  
  // Render not connected state
  if (!isConnected) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Order History</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="mt-4 text-gray-400">Connect your wallet to view order history</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isLoading && orders.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Order History</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading order history...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && orders.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Order History</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchOrderHistory}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">Order History</h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchOrderHistory}
          title="Refresh order history"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {/* Filter tabs */}
        <div className="flex mb-4 border-b border-twilight-dark">
          <button
            className={`py-2 px-4 ${filter === 'all' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`py-2 px-4 ${filter === 'open' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button
            className={`py-2 px-4 ${filter === 'filled' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('filled')}
          >
            Filled
          </button>
          <button
            className={`py-2 px-4 ${filter === 'canceled' ? 'border-b-2 border-primary text-white' : 'text-gray-400'}`}
            onClick={() => setFilter('canceled')}
          >
            Canceled
          </button>
        </div>
        
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Filled</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="font-medium">
                        {order.baseAsset}/{order.quoteAsset}
                      </div>
                    </td>
                    <td>
                      <div className="capitalize">
                        {order.type}
                      </div>
                    </td>
                    <td>
                      <div className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        {order.side.toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <div>
                        {formatPrice(order.price)}
                      </div>
                    </td>
                    <td>
                      <div>
                        {formatAmount(order.amount)}
                      </div>
                    </td>
                    <td>
                      <div>
                        {formatAmount(order.filled)} ({((parseFloat(order.filled) / parseFloat(order.amount)) * 100).toFixed(0)}%)
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(order.status)}
                    </td>
                    <td>
                      <div>
                        {formatDate(order.timestamp)}
                      </div>
                    </td>
                    <td>
                      {(order.status === 'open' || order.status === 'partially_filled') && (
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {orders.length > limit && (
          <div className="text-center mt-4">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setLimit((prev: number) => prev + 10)}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;