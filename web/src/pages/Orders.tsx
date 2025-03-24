import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Icons
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export interface OrdersProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
}

interface Order {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: 'open' | 'filled' | 'canceled' | 'expired';
  timestamp: number;
}

interface Trade {
  id: string;
  orderId: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  status: 'completed' | 'failed' | 'pending';
  counterparty: string;
  timestamp: number;
  txid?: string;
}

const Orders: React.FC<OrdersProps> = ({ isWalletConnected, isSDKInitialized }) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'order' | 'trade'>('order');

  // Generate mock data
  useEffect(() => {
    if (isSDKInitialized && isWalletConnected) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        generateMockData();
        setIsLoading(false);
      }, 1000);
    }
  }, [isSDKInitialized, isWalletConnected]);

  const generateMockData = () => {
    // Generate mock orders
    const mockOrders: Order[] = [];
    const pairs = ['BTC/RUNE:0x123', 'BTC/ALKANE:0x456', 'RUNE:0x123/ALKANE:0x456'];
    const sides: ('buy' | 'sell')[] = ['buy', 'sell'];
    const types: ('limit' | 'market')[] = ['limit', 'market'];
    const statuses: ('open' | 'filled' | 'canceled' | 'expired')[] = ['open', 'filled', 'canceled', 'expired'];
    
    for (let i = 0; i < 10; i++) {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const status = i < 3 ? 'open' : statuses[Math.floor(Math.random() * statuses.length)];
      const price = Math.random() * (pair.includes('BTC') ? 20000 : 100) + (pair.includes('BTC') ? 10000 : 50);
      const amount = Math.random() * 5 + 0.1;
      const filled = status === 'filled' ? amount : status === 'open' ? Math.random() * amount : 0;
      
      mockOrders.push({
        id: `order-${i}`,
        pair,
        side,
        type,
        price,
        amount,
        filled,
        total: price * amount,
        status,
        timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
      });
    }
    
    // Generate mock trades
    const mockTrades: Trade[] = [];
    const tradeStatuses: ('completed' | 'failed' | 'pending')[] = ['completed', 'failed', 'pending'];
    
    for (let i = 0; i < 15; i++) {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const price = Math.random() * (pair.includes('BTC') ? 20000 : 100) + (pair.includes('BTC') ? 10000 : 50);
      const amount = Math.random() * 5 + 0.1;
      const status = i < 2 ? 'pending' : tradeStatuses[Math.floor(Math.random() * (tradeStatuses.length - 1))];
      
      mockTrades.push({
        id: `trade-${i}`,
        orderId: `order-${Math.floor(Math.random() * 10)}`,
        pair,
        side,
        price,
        amount,
        total: price * amount,
        status,
        counterparty: `0x${Math.random().toString(16).substring(2, 10)}`,
        timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
        txid: status === 'completed' ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined,
      });
    }
    
    setOrders(mockOrders);
    setTrades(mockTrades);
  };

  const handleRefresh = () => {
    if (isSDKInitialized && isWalletConnected) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        generateMockData();
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (isSDKInitialized && isWalletConnected) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'canceled' } : order
        ));
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleViewDetails = (type: 'order' | 'trade', id: string) => {
    if (type === 'order') {
      const order = orders.find(o => o.id === id);
      if (order) {
        setSelectedOrder(order);
        setSelectedTrade(null);
        setModalType('order');
        setIsModalOpen(true);
      }
    } else {
      const trade = trades.find(t => t.id === id);
      if (trade) {
        setSelectedTrade(trade);
        setSelectedOrder(null);
        setModalType('trade');
        setIsModalOpen(true);
      }
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAssetName = (asset: string): string => {
    if (asset.includes(':')) {
      const [type] = asset.split(':');
      return `${type}`;
    }
    return asset;
  };

  const formatPair = (pair: string): string => {
    const [base, quote] = pair.split('/');
    return `${formatAssetName(base)}/${formatAssetName(quote)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'text-twilight-neon-blue';
      case 'filled':
      case 'completed':
        return 'text-green-400';
      case 'canceled':
      case 'failed':
        return 'text-red-400';
      case 'expired':
        return 'text-yellow-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'open':
      case 'pending':
        return <ClockIcon className={`w-5 h-5 ${getStatusColor(status)}`} />;
      case 'filled':
      case 'completed':
        return <CheckCircleIcon className={`w-5 h-5 ${getStatusColor(status)}`} />;
      case 'canceled':
      case 'failed':
        return <XCircleIcon className={`w-5 h-5 ${getStatusColor(status)}`} />;
      case 'expired':
        return <ClockIcon className={`w-5 h-5 ${getStatusColor(status)}`} />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'open'
    ? orders.filter(order => order.status === 'open')
    : orders.filter(order => order.status !== 'open');

  // Sort trades by timestamp (newest first)
  const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">Orders & Trades</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your orders and view trade history
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading || !isSDKInitialized || !isWalletConnected}
          className="btn btn-primary"
        >
          <ArrowPathIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
            <XCircleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to view your orders and trades
            </span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-twilight-dark">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'open' ? 'text-twilight-neon-blue border-b-2 border-twilight-neon-blue' : 'text-gray-400'}`}
          onClick={() => setActiveTab('open')}
        >
          Open Orders
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'history' ? 'text-twilight-neon-blue border-b-2 border-twilight-neon-blue' : 'text-gray-400'}`}
          onClick={() => setActiveTab('history')}
        >
          Order History
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
        </div>
      ) : (
        <div>
          {/* Orders Table */}
          {activeTab === 'open' || activeTab === 'history' ? (
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
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>{formatPair(order.pair)}</td>
                        <td className="capitalize">{order.type}</td>
                        <td className={order.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {order.side.toUpperCase()}
                        </td>
                        <td>{order.price.toFixed(2)}</td>
                        <td>{order.amount.toFixed(4)}</td>
                        <td>
                          {order.filled.toFixed(4)}
                          <span className="text-gray-400 text-xs ml-1">
                            ({Math.round((order.filled / order.amount) * 100)}%)
                          </span>
                        </td>
                        <td>{order.total.toFixed(2)}</td>
                        <td className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span className={`ml-1 ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td>{formatDate(order.timestamp)}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails('order', order.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                              title="View Details"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            {order.status === 'open' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-twilight-dark transition-colors duration-200"
                                title="Cancel Order"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Trades Section */}
          {activeTab === 'history' && (
            <div className="mt-8">
              <h2 className="text-xl font-display font-bold mb-4">Trade History</h2>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Pair</th>
                      <th>Side</th>
                      <th>Price</th>
                      <th>Amount</th>
                      <th>Total</th>
                      <th>Counterparty</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTrades.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-400">
                          No trades found
                        </td>
                      </tr>
                    ) : (
                      sortedTrades.map(trade => (
                        <tr key={trade.id}>
                          <td>{formatPair(trade.pair)}</td>
                          <td className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                            {trade.side.toUpperCase()}
                          </td>
                          <td>{trade.price.toFixed(2)}</td>
                          <td>{trade.amount.toFixed(4)}</td>
                          <td>{trade.total.toFixed(2)}</td>
                          <td className="text-gray-400">{`${trade.counterparty.substring(0, 6)}...`}</td>
                          <td className="flex items-center">
                            {getStatusIcon(trade.status)}
                            <span className={`ml-1 ${getStatusColor(trade.status)}`}>
                              {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                            </span>
                          </td>
                          <td>{formatDate(trade.timestamp)}</td>
                          <td>
                            <button
                              onClick={() => handleViewDetails('trade', trade.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                              title="View Details"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="card-header flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">
                {modalType === 'order' ? 'Order Details' : 'Trade Details'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="card-body">
              {modalType === 'order' && selectedOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Order ID</div>
                      <div className="font-medium">{selectedOrder.id}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Status</div>
                      <div className="flex items-center">
                        {getStatusIcon(selectedOrder.status)}
                        <span className={`ml-1 ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Pair</div>
                      <div className="font-medium">{formatPair(selectedOrder.pair)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Type</div>
                      <div className="font-medium capitalize">{selectedOrder.type}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Side</div>
                      <div className={selectedOrder.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                        {selectedOrder.side.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Price</div>
                      <div className="font-medium">{selectedOrder.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Amount</div>
                      <div className="font-medium">{selectedOrder.amount.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Filled</div>
                      <div className="font-medium">
                        {selectedOrder.filled.toFixed(4)}
                        <span className="text-gray-400 text-xs ml-1">
                          ({Math.round((selectedOrder.filled / selectedOrder.amount) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Total</div>
                      <div className="font-medium">{selectedOrder.total.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Date</div>
                      <div className="font-medium">{formatDate(selectedOrder.timestamp)}</div>
                    </div>
                  </div>

                  {selectedOrder.status === 'open' && (
                    <div className="pt-4 border-t border-twilight-dark">
                      <button
                        onClick={() => {
                          handleCancelOrder(selectedOrder.id);
                          setIsModalOpen(false);
                        }}
                        className="btn btn-error"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              )}

              {modalType === 'trade' && selectedTrade && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Trade ID</div>
                      <div className="font-medium">{selectedTrade.id}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Status</div>
                      <div className="flex items-center">
                        {getStatusIcon(selectedTrade.status)}
                        <span className={`ml-1 ${getStatusColor(selectedTrade.status)}`}>
                          {selectedTrade.status.charAt(0).toUpperCase() + selectedTrade.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Order ID</div>
                      <div className="font-medium">{selectedTrade.orderId}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Pair</div>
                      <div className="font-medium">{formatPair(selectedTrade.pair)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Side</div>
                      <div className={selectedTrade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                        {selectedTrade.side.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Price</div>
                      <div className="font-medium">{selectedTrade.price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Amount</div>
                      <div className="font-medium">{selectedTrade.amount.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Total</div>
                      <div className="font-medium">{selectedTrade.total.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Counterparty</div>
                      <div className="font-medium">{selectedTrade.counterparty}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Date</div>
                      <div className="font-medium">{formatDate(selectedTrade.timestamp)}</div>
                    </div>
                  </div>

                  {selectedTrade.txid && (
                    <div className="pt-4 border-t border-twilight-dark">
                      <div className="text-gray-400 text-sm">Transaction ID</div>
                      <div className="font-medium break-all">{selectedTrade.txid}</div>
                      <a
                        href={`https://mempool.space/tx/${selectedTrade.txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-neon mt-2"
                      >
                        View on Explorer
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Orders;