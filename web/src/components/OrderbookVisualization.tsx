import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOrderbook } from '../contexts/OrderbookContext';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import { formatPrice, formatAmount } from '../utils/formatters';
import TradeExecutionDetails from './TradeExecutionDetails';

interface OrderbookVisualizationProps {
  baseAsset?: string;
  quoteAsset?: string;
  depth?: number;
  className?: string;
}

const OrderbookVisualization: React.FC<OrderbookVisualizationProps> = ({
  baseAsset = 'BTC',
  quoteAsset = 'RUNE:0x123',
  depth = 10,
  className = '',
}) => {
  // Get orderbook data from context
  const { 
    buyOrders, 
    sellOrders, 
    isLoading, 
    error, 
    syncOrderbook,
    midPrice,
    spread,
  } = useOrderbook();
  
  // Get wallet context
  const { isConnected } = useWasmWallet();
  
  // State for selected order and trade execution
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showTradeExecution, setShowTradeExecution] = useState<boolean>(false);
  
  // Filter and sort orders
  const filteredBuyOrders = useMemo(() => {
    return buyOrders
      .filter(order => order.baseAsset === baseAsset && order.quoteAsset === quoteAsset)
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, depth);
  }, [buyOrders, baseAsset, quoteAsset, depth]);
  
  const filteredSellOrders = useMemo(() => {
    return sellOrders
      .filter(order => order.baseAsset === baseAsset && order.quoteAsset === quoteAsset)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      .slice(0, depth);
  }, [sellOrders, baseAsset, quoteAsset, depth]);
  
  // Calculate max volume for visualization
  const maxVolume = useMemo(() => {
    const allOrders = [...filteredBuyOrders, ...filteredSellOrders];
    if (allOrders.length === 0) return 1;
    
    return Math.max(...allOrders.map(order => parseFloat(order.amount)));
  }, [filteredBuyOrders, filteredSellOrders]);
  
  // Sync orderbook on mount
  useEffect(() => {
    syncOrderbook(baseAsset, quoteAsset);
  }, [syncOrderbook, baseAsset, quoteAsset]);
  
  // Handle refresh
  const handleRefresh = () => {
    syncOrderbook(baseAsset, quoteAsset);
  };
  
  // Handle order click
  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    
    // Show trade execution if wallet is connected
    if (isConnected) {
      setShowTradeExecution(true);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Orderbook</h2>
        </div>
        <div className="card-body flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading orderbook...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Orderbook</h2>
        </div>
        <div className="card-body flex items-center justify-center h-64">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error instanceof Error ? error.message : String(error)}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={handleRefresh}
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
        <h2 className="text-lg font-display font-medium">
          Orderbook <span className="text-sm text-gray-400">{baseAsset}/{quoteAsset}</span>
        </h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={handleRefresh}
          title="Refresh orderbook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {/* Market stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-2 bg-twilight-darker rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-400">Mid Price</div>
            <div className="font-medium">{midPrice ? formatPrice(midPrice) : '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Spread</div>
            <div className="font-medium">{spread ? formatPrice(spread) : '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Orders</div>
            <div className="font-medium">{filteredBuyOrders.length + filteredSellOrders.length}</div>
          </div>
        </div>
        
        {/* Orderbook header */}
        <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-gray-400">
          <div>Price</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total</div>
        </div>
        
        {/* Sell orders (reversed to show highest price at the top) */}
        <div className="space-y-1 mb-4">
          {filteredSellOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-2">No sell orders</div>
          ) : (
            filteredSellOrders.map((order) => (
              <motion.div
                key={order.id}
                className={`grid grid-cols-3 gap-2 p-2 rounded-lg cursor-pointer ${
                  selectedOrder?.id === order.id ? 'bg-red-900 bg-opacity-30' : 'hover:bg-twilight-dark'
                }`}
                onClick={() => handleOrderClick(order)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-ui-error">{formatPrice(order.price)}</div>
                <div className="text-right">{formatAmount(order.amount)}</div>
                <div className="text-right relative">
                  <div className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-20 rounded-r-lg" 
                    style={{ width: `${(parseFloat(order.amount) / maxVolume) * 100}%` }} 
                  />
                  <span className="relative z-10">{formatAmount(parseFloat(order.price) * parseFloat(order.amount))}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Mid price indicator */}
        <div className="py-2 px-4 bg-twilight-darker rounded-lg text-center mb-4">
          <span className="text-primary font-medium">{midPrice ? formatPrice(midPrice) : '-'}</span>
        </div>
        
        {/* Buy orders */}
        <div className="space-y-1">
          {filteredBuyOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-2">No buy orders</div>
          ) : (
            filteredBuyOrders.map((order) => (
              <motion.div
                key={order.id}
                className={`grid grid-cols-3 gap-2 p-2 rounded-lg cursor-pointer ${
                  selectedOrder?.id === order.id ? 'bg-green-900 bg-opacity-30' : 'hover:bg-twilight-dark'
                }`}
                onClick={() => handleOrderClick(order)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-ui-success">{formatPrice(order.price)}</div>
                <div className="text-right">{formatAmount(order.amount)}</div>
                <div className="text-right relative">
                  <div className="absolute top-0 right-0 bottom-0 bg-green-500 bg-opacity-20 rounded-r-lg" 
                    style={{ width: `${(parseFloat(order.amount) / maxVolume) * 100}%` }} 
                  />
                  <span className="relative z-10">{formatAmount(parseFloat(order.price) * parseFloat(order.amount))}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Selected order details */}
      {selectedOrder && (
        <div className="border-t border-twilight-darker p-4">
          <h3 className="text-sm font-medium mb-2">Order Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">ID:</div>
            <div className="truncate">{selectedOrder.id}</div>
            <div className="text-gray-400">Side:</div>
            <div className={selectedOrder.side === 'buy' ? 'text-ui-success' : 'text-ui-error'}>
              {selectedOrder.side.toUpperCase()}
              {/* Trade Execution Modal */}
              {showTradeExecution && selectedOrder && (
                <TradeExecutionDetails
                  orderId={selectedOrder.id}
                  baseAsset={selectedOrder.baseAsset}
                  quoteAsset={selectedOrder.quoteAsset}
                  price={selectedOrder.price}
                  amount={selectedOrder.amount}
                  side={selectedOrder.side === 'buy' ? 'sell' : 'buy'} // Opposite of the order
                  maker={selectedOrder.maker}
                  onClose={() => setShowTradeExecution(false)}
                  onExecute={() => {
                    setShowTradeExecution(false);
                    setSelectedOrder(null);
                    syncOrderbook();
                  }}
                />
              )}
            </div>
            <div className="text-gray-400">Price:</div>
            <div>{formatPrice(selectedOrder.price)}</div>
            <div className="text-gray-400">Amount:</div>
            <div>{formatAmount(selectedOrder.amount)}</div>
            <div className="text-gray-400">Total:</div>
            <div>{formatAmount(parseFloat(selectedOrder.price) * parseFloat(selectedOrder.amount))}</div>
            <div className="text-gray-400">Created:</div>
            <div>{new Date(selectedOrder.timestamp).toLocaleString()}</div>
            <div className="text-gray-400">Expires:</div>
            <div>{new Date(selectedOrder.expiry).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderbookVisualization;