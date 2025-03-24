import React, { useState, useEffect } from 'react';

// Icons
import {
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface OrderbookProps {
  pair: string;
  isLoading: boolean;
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
}

interface Order {
  id: string;
  price: number;
  amount: number;
  total: number;
  maker: string;
  timestamp: number;
}

const Orderbook: React.FC<OrderbookProps> = ({ 
  pair, 
  isLoading,
  isWalletConnected,
  isSDKInitialized
}) => {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [spreadPercentage, setSpreadPercentage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'both' | 'buys' | 'sells'>('both');

  // Generate mock data when pair changes
  useEffect(() => {
    if (isSDKInitialized && !isLoading) {
      generateMockData();
    }
  }, [pair, isSDKInitialized, isLoading]);

  const generateMockData = () => {
    // Generate mock buy orders
    const mockBuyOrders: Order[] = [];
    let basePrice = pair.includes('BTC') ? 20000 : 200;
    
    for (let i = 0; i < 15; i++) {
      const price = basePrice * (1 - (i * 0.005));
      const amount = Math.random() * 2 + 0.1;
      mockBuyOrders.push({
        id: `buy-${i}`,
        price,
        amount,
        total: price * amount,
        maker: `0x${Math.random().toString(16).substring(2, 10)}`,
        timestamp: Date.now() - (i * 60000)
      });
    }
    
    // Generate mock sell orders
    const mockSellOrders: Order[] = [];
    for (let i = 0; i < 15; i++) {
      const price = basePrice * (1 + (i * 0.005));
      const amount = Math.random() * 2 + 0.1;
      mockSellOrders.push({
        id: `sell-${i}`,
        price,
        amount,
        total: price * amount,
        maker: `0x${Math.random().toString(16).substring(2, 10)}`,
        timestamp: Date.now() - (i * 60000)
      });
    }
    
    // Set mock data
    setBuyOrders(mockBuyOrders);
    setSellOrders(mockSellOrders);
    
    // Set last price and price change
    const newLastPrice = basePrice * (1 + (Math.random() * 0.01 - 0.005));
    setLastPrice(newLastPrice);
    setPriceChange(Math.random() * 5 - 2.5);
    
    // Calculate spread
    if (mockBuyOrders.length > 0 && mockSellOrders.length > 0) {
      const highestBid = mockBuyOrders[0].price;
      const lowestAsk = mockSellOrders[0].price;
      const spread = lowestAsk - highestBid;
      const spreadPct = (spread / highestBid) * 100;
      setSpreadPercentage(spreadPct);
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatCrypto = (num: number): string => {
    if (num < 0.001) return num.toFixed(8);
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  const handleRefresh = () => {
    if (isSDKInitialized) {
      generateMockData();
    }
  };

  // Calculate the maximum total for visualization
  const maxBuyTotal = Math.max(...buyOrders.map(order => order.total));
  const maxSellTotal = Math.max(...sellOrders.map(order => order.total));
  const maxTotal = Math.max(maxBuyTotal, maxSellTotal);

  return (
    <div className="card h-full">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">Orderbook</h2>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2 py-1 text-xs ${viewMode === 'both' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Both
            </button>
            <button
              onClick={() => setViewMode('buys')}
              className={`px-2 py-1 text-xs ${viewMode === 'buys' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Buys
            </button>
            <button
              onClick={() => setViewMode('sells')}
              className={`px-2 py-1 text-xs ${viewMode === 'sells' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Sells
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading || !isSDKInitialized}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="card-body p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Price Header */}
            <div className="p-4 border-b border-twilight-dark">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-sm">Last Price</span>
                  <div className="flex items-center">
                    <span className="text-xl font-medium">
                      {lastPrice ? formatNumber(lastPrice) : '-'}
                    </span>
                    <span className={`ml-2 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceChange >= 0 ? '+' : ''}{formatNumber(priceChange)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm">Spread</span>
                  <div className="text-xl font-medium">
                    {formatNumber(spreadPercentage)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Table Headers */}
            <div className="grid grid-cols-4 text-xs text-gray-400 px-4 py-2 border-b border-twilight-dark">
              <div>Price</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Total</div>
              <div className="text-right">Maker</div>
            </div>
            
            {/* Sell Orders (reversed to show highest price at bottom) */}
            {(viewMode === 'both' || viewMode === 'sells') && (
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {sellOrders.slice().reverse().map((order) => (
                  <div 
                    key={order.id}
                    className="grid grid-cols-4 text-sm px-4 py-1.5 hover:bg-twilight-dark hover:bg-opacity-50 relative"
                  >
                    {/* Background bar for visualization */}
                    <div 
                      className="absolute right-0 top-0 h-full bg-red-500 bg-opacity-10"
                      style={{ width: `${(order.total / maxTotal) * 100}%` }}
                    ></div>
                    
                    {/* Content */}
                    <div className="text-red-400 z-10">{formatNumber(order.price)}</div>
                    <div className="text-right z-10">{formatCrypto(order.amount)}</div>
                    <div className="text-right z-10">{formatNumber(order.total)}</div>
                    <div className="text-right text-gray-400 z-10">
                      {order.maker.substring(0, 6)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Buy Orders */}
            {(viewMode === 'both' || viewMode === 'buys') && (
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                {buyOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="grid grid-cols-4 text-sm px-4 py-1.5 hover:bg-twilight-dark hover:bg-opacity-50 relative"
                  >
                    {/* Background bar for visualization */}
                    <div 
                      className="absolute right-0 top-0 h-full bg-green-500 bg-opacity-10"
                      style={{ width: `${(order.total / maxTotal) * 100}%` }}
                    ></div>
                    
                    {/* Content */}
                    <div className="text-green-400 z-10">{formatNumber(order.price)}</div>
                    <div className="text-right z-10">{formatCrypto(order.amount)}</div>
                    <div className="text-right z-10">{formatNumber(order.total)}</div>
                    <div className="text-right text-gray-400 z-10">
                      {order.maker.substring(0, 6)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {!isWalletConnected && (
        <div className="p-4 border-t border-twilight-dark bg-twilight-darker bg-opacity-50">
          <p className="text-sm text-gray-400 text-center">
            Connect your wallet to place orders
          </p>
        </div>
      )}
    </div>
  );
};

export default Orderbook;