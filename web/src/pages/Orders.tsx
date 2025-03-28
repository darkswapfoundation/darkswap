import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ApiClient, { Order as ApiOrder } from '../utils/ApiClient';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface OrdersProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
  apiClient?: ApiClient;
  isApiLoading: boolean;
}

const Orders: React.FC<OrdersProps> = ({
  isWalletConnected,
  isSDKInitialized,
  apiClient,
  isApiLoading,
}) => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { addNotification } = useNotification();

  // Fetch orders when component mounts
  useEffect(() => {
    if (isSDKInitialized && isWalletConnected && apiClient && !isApiLoading) {
      fetchOrders();
    }
  }, [isSDKInitialized, isWalletConnected, apiClient, isApiLoading]);

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    
    try {
      if (apiClient) {
        const response = await apiClient.getOrders();
        
        if (response.error) {
          addNotification('error', `Failed to fetch orders: ${response.error}`);
        } else if (response.data) {
          setOrders(response.data);
          addNotification('info', 'Orders updated successfully');
        }
      } else {
        // Generate mock data for demo
        generateMockOrders();
      }
    } catch (error) {
      addNotification('error', `Error fetching orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock orders for demo
  const generateMockOrders = () => {
    const mockOrders: ApiOrder[] = [];
    
    // Generate some buy orders
    for (let i = 0; i < 5; i++) {
      mockOrders.push({
        id: `buy-${i}`,
        maker_peer_id: `peer-${i}`,
        base_asset: 'BTC',
        quote_asset: 'RUNE:0x123',
        side: 'buy',
        amount: (Math.random() * 2 + 0.1).toFixed(8),
        price: (20000 * (1 - (i * 0.01))).toFixed(2),
        timestamp: Date.now() - (i * 60000),
        status: 'open',
      });
    }
    
    // Generate some sell orders
    for (let i = 0; i < 3; i++) {
      mockOrders.push({
        id: `sell-${i}`,
        maker_peer_id: `peer-${i + 5}`,
        base_asset: 'BTC',
        quote_asset: 'RUNE:0x123',
        side: 'sell',
        amount: (Math.random() * 2 + 0.1).toFixed(8),
        price: (20000 * (1 + (i * 0.01))).toFixed(2),
        timestamp: Date.now() - (i * 60000),
        status: 'open',
      });
    }
    
    // Add a filled order
    mockOrders.push({
      id: 'filled-1',
      maker_peer_id: 'peer-8',
      base_asset: 'BTC',
      quote_asset: 'ALKANE:0x456',
      side: 'buy',
      amount: '0.5',
      price: '19500',
      timestamp: Date.now() - 3600000,
      status: 'filled',
    });
    
    // Add a canceled order
    mockOrders.push({
      id: 'canceled-1',
      maker_peer_id: 'peer-9',
      base_asset: 'RUNE:0x123',
      quote_asset: 'ALKANE:0x456',
      side: 'sell',
      amount: '100',
      price: '0.5',
      timestamp: Date.now() - 7200000,
      status: 'canceled',
    });
    
    setOrders(mockOrders);
  };

  // Cancel an order
  const cancelOrder = async (orderId: string) => {
    try {
      if (apiClient) {
        const response = await apiClient.cancelOrder(orderId);
        
        if (response.error) {
          addNotification('error', `Failed to cancel order: ${response.error}`);
        } else {
          addNotification('success', 'Order canceled successfully');
          fetchOrders(); // Refresh orders
        }
      } else {
        // Mock cancellation for demo
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'canceled' } : order
        ));
        addNotification('success', 'Order canceled successfully');
      }
    } catch (error) {
      addNotification('error', `Error canceling order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'text-blue-400';
      case 'filled':
        return 'text-green-400';
      case 'canceled':
        return 'text-yellow-400';
      case 'expired':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">My Orders</span>
          </h1>
          <p className="text-gray-400 mt-1">
            View and manage your open and past orders
          </p>
        </div>
        
        <button
          onClick={fetchOrders}
          disabled={isLoading || !isSDKInitialized || !isWalletConnected}
          className="btn btn-primary"
        >
          {isLoading ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <ArrowPathIcon className="w-5 h-5 mr-2" />
          )}
          Refresh
        </button>
      </div>

      {/* Connection Warning */}
      {!isWalletConnected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to view your orders
            </span>
          </div>
        </motion.div>
      )}

      {/* SDK Warning */}
      {isWalletConnected && !isSDKInitialized && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Initializing DarkSwap SDK...
            </span>
          </div>
        </motion.div>
      )}

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Your Orders</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pair</th>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="text-xs">{order.id.substring(0, 8)}...</td>
                    <td>{`${order.base_asset}/${order.quote_asset}`}</td>
                    <td className={order.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                      {order.side.toUpperCase()}
                    </td>
                    <td>{order.amount}</td>
                    <td>{order.price}</td>
                    <td className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </td>
                    <td>{formatTimestamp(order.timestamp)}</td>
                    <td>
                      {order.status === 'open' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="btn btn-sm btn-error"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;