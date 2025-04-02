import React, { useState, useEffect, useMemo } from 'react';
import { useOrderbook } from '../contexts/OrderbookContext';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderAsset,
  AssetType,
} from '../utils/OrderbookUtils';

// Icons
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

export interface EnhancedOrderbookProps {
  pair: string;
  isLoading?: boolean;
  isWalletConnected?: boolean;
  isSDKInitialized?: boolean;
  onOrderSelect?: (order: Order) => void;
  onPriceSelect?: (price: number) => void;
}

interface GroupedOrder {
  price: number;
  amount: number;
  total: number;
  count: number;
  orders: Order[];
}

interface PriceLevel {
  price: number;
  amount: number;
  total: number;
  depth: number;
  side: OrderSide;
}

const EnhancedOrderbook: React.FC<EnhancedOrderbookProps> = ({
  pair,
  isLoading: externalIsLoading,
  isWalletConnected: externalIsWalletConnected,
  isSDKInitialized: externalIsSDKInitialized,
  onOrderSelect,
  onPriceSelect,
}) => {
  // Contexts
  const {
    orderbook,
    isLoading: orderbookIsLoading,
    error,
    refreshOrderbook,
    getOpenOrders,
  } = useOrderbook();
  
  const { isConnected: walletIsConnected } = useWallet();
  const { addNotification } = useNotification();
  
  // Combine external and internal state
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : orderbookIsLoading;
  const isWalletConnected = externalIsWalletConnected !== undefined ? externalIsWalletConnected : walletIsConnected;
  const isSDKInitialized = externalIsSDKInitialized !== undefined ? externalIsSDKInitialized : true;
  
  // State
  const [viewMode, setViewMode] = useState<'both' | 'buys' | 'sells'>('both');
  const [groupingSize, setGroupingSize] = useState<number>(0.1); // Group orders by 0.1 price increments
  const [depthView, setDepthView] = useState<boolean>(true);
  const [maxDepth, setMaxDepth] = useState<number>(0);
  const [pricePrecision, setPricePrecision] = useState<number>(2);
  const [amountPrecision, setAmountPrecision] = useState<number>(4);
  const [visibleRows, setVisibleRows] = useState<number>(15);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [lastUpdatedOrders, setLastUpdatedOrders] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Parse the pair to get base and quote assets
  const [baseAsset, quoteAsset] = useMemo(() => {
    const parts = pair.split('/');
    return [parts[0] || 'BTC', parts[1] || 'RUNE'];
  }, [pair]);
  
  // Get all open orders
  const openOrders = useMemo(() => {
    return getOpenOrders();
  }, [getOpenOrders, orderbook]);
  
  // Filter orders by pair
  const filteredOrders = useMemo(() => {
    return openOrders.filter(order => {
      // Check if the order matches the current pair
      const orderBaseAsset = order.baseAsset.type === AssetType.Bitcoin ? 'BTC' : 
                            order.baseAsset.type === AssetType.Rune ? `RUNE${order.baseAsset.id ? `:${order.baseAsset.id}` : ''}` :
                            `ALKANE${order.baseAsset.id ? `:${order.baseAsset.id}` : ''}`;
      
      const orderQuoteAsset = order.quoteAsset.type === AssetType.Bitcoin ? 'BTC' : 
                             order.quoteAsset.type === AssetType.Rune ? `RUNE${order.quoteAsset.id ? `:${order.quoteAsset.id}` : ''}` :
                             `ALKANE${order.quoteAsset.id ? `:${order.quoteAsset.id}` : ''}`;
      
      return orderBaseAsset === baseAsset && orderQuoteAsset === quoteAsset;
    });
  }, [openOrders, baseAsset, quoteAsset]);
  
  // Split orders by side
  const buyOrders = useMemo(() => {
    return filteredOrders.filter(order => order.side === OrderSide.Buy);
  }, [filteredOrders]);
  
  const sellOrders = useMemo(() => {
    return filteredOrders.filter(order => order.side === OrderSide.Sell);
  }, [filteredOrders]);
  
  // Group orders by price
  const groupedBuyOrders = useMemo(() => {
    return groupOrdersByPrice(buyOrders, groupingSize, OrderSide.Buy);
  }, [buyOrders, groupingSize]);
  
  const groupedSellOrders = useMemo(() => {
    return groupOrdersByPrice(sellOrders, groupingSize, OrderSide.Sell);
  }, [sellOrders, groupingSize]);
  
  // Calculate price levels for depth chart
  const priceLevels = useMemo(() => {
    const levels: PriceLevel[] = [];
    
    // Add buy levels
    let buyTotal = 0;
    groupedBuyOrders.forEach(order => {
      buyTotal += order.total;
      levels.push({
        price: order.price,
        amount: order.amount,
        total: buyTotal,
        depth: 0, // Will be calculated later
        side: OrderSide.Buy
      });
    });
    
    // Add sell levels
    let sellTotal = 0;
    groupedSellOrders.forEach(order => {
      sellTotal += order.total;
      levels.push({
        price: order.price,
        amount: order.amount,
        total: sellTotal,
        depth: 0, // Will be calculated later
        side: OrderSide.Sell
      });
    });
    
    // Sort by price
    levels.sort((a, b) => a.price - b.price);
    
    // Calculate max depth
    const maxBuyTotal = Math.max(...levels.filter(l => l.side === OrderSide.Buy).map(l => l.total), 0);
    const maxSellTotal = Math.max(...levels.filter(l => l.side === OrderSide.Sell).map(l => l.total), 0);
    const newMaxDepth = Math.max(maxBuyTotal, maxSellTotal);
    
    if (newMaxDepth !== maxDepth) {
      setMaxDepth(newMaxDepth);
    }
    
    // Calculate depth percentage
    return levels.map(level => ({
      ...level,
      depth: (level.total / newMaxDepth) * 100
    }));
  }, [groupedBuyOrders, groupedSellOrders, maxDepth]);
  
  // Calculate spread
  const spread = useMemo(() => {
    if (groupedBuyOrders.length === 0 || groupedSellOrders.length === 0) {
      return { absolute: 0, percentage: 0 };
    }
    
    const highestBid = groupedBuyOrders[0].price;
    const lowestAsk = groupedSellOrders[0].price;
    const absoluteSpread = lowestAsk - highestBid;
    const percentageSpread = (absoluteSpread / highestBid) * 100;
    
    return {
      absolute: absoluteSpread,
      percentage: percentageSpread
    };
  }, [groupedBuyOrders, groupedSellOrders]);
  
  // Calculate mid price
  const midPrice = useMemo(() => {
    if (groupedBuyOrders.length === 0 && groupedSellOrders.length === 0) {
      return null;
    }
    
    if (groupedBuyOrders.length === 0) {
      return groupedSellOrders[0].price;
    }
    
    if (groupedSellOrders.length === 0) {
      return groupedBuyOrders[0].price;
    }
    
    const highestBid = groupedBuyOrders[0].price;
    const lowestAsk = groupedSellOrders[0].price;
    
    return (highestBid + lowestAsk) / 2;
  }, [groupedBuyOrders, groupedSellOrders]);
  
  // Effect to highlight updated orders
  useEffect(() => {
    const orderIds = [...buyOrders, ...sellOrders].map(order => order.id);
    const newOrderIds = orderIds.filter(id => !lastUpdatedOrders.includes(id));
    
    if (newOrderIds.length > 0) {
      setLastUpdatedOrders(orderIds);
      
      // Clear highlights after animation
      const timer = setTimeout(() => {
        setLastUpdatedOrders([]);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [buyOrders, sellOrders, lastUpdatedOrders]);
  
  // Group orders by price
  function groupOrdersByPrice(orders: Order[], groupSize: number, side: OrderSide): GroupedOrder[] {
    const groupedOrders: { [price: string]: GroupedOrder } = {};
    
    orders.forEach(order => {
      // Calculate price from base and quote assets
      const baseAmount = parseFloat(order.baseAsset.amount);
      const quoteAmount = parseFloat(order.quoteAsset.amount);
      const price = quoteAmount / baseAmount;
      
      // Round price to the nearest group
      const roundedPrice = Math.round(price / groupSize) * groupSize;
      const priceKey = roundedPrice.toString();
      
      if (!groupedOrders[priceKey]) {
        groupedOrders[priceKey] = {
          price: roundedPrice,
          amount: 0,
          total: 0,
          count: 0,
          orders: []
        };
      }
      
      groupedOrders[priceKey].amount += baseAmount;
      groupedOrders[priceKey].total += quoteAmount;
      groupedOrders[priceKey].count += 1;
      groupedOrders[priceKey].orders.push(order);
    });
    
    // Convert to array and sort
    const result = Object.values(groupedOrders);
    
    if (side === OrderSide.Buy) {
      // Sort buy orders by price descending (highest first)
      result.sort((a, b) => b.price - a.price);
    } else {
      // Sort sell orders by price ascending (lowest first)
      result.sort((a, b) => a.price - b.price);
    }
    
    return result;
  }
  
  // Format number with specified precision
  const formatNumber = (num: number, precision: number = 2): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  };
  
  // Handle price click
  const handlePriceClick = (price: number) => {
    setSelectedPrice(price);
    if (onPriceSelect) {
      onPriceSelect(price);
    }
  };
  
  // Handle order click
  const handleOrderClick = (order: Order) => {
    if (onOrderSelect) {
      onOrderSelect(order);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refreshOrderbook();
  };
  
  // Handle grouping size change
  const handleGroupingSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGroupingSize(parseFloat(e.target.value));
  };
  
  // Handle precision change
  const handlePrecisionChange = (type: 'price' | 'amount', value: number) => {
    if (type === 'price') {
      setPricePrecision(value);
    } else {
      setAmountPrecision(value);
    }
  };
  
  // Handle visible rows change
  const handleVisibleRowsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVisibleRows(parseInt(e.target.value));
  };
  
  return (
    <div className="card h-full">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">
          {pair} Orderbook
        </h2>
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
            onClick={() => setDepthView(!depthView)}
            className={`p-1 rounded-lg ${depthView ? 'text-twilight-neon-blue' : 'text-gray-400'} hover:text-white hover:bg-twilight-dark transition-colors duration-200`}
            title="Toggle depth view"
          >
            <ArrowsRightLeftIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-lg ${showSettings ? 'text-twilight-neon-blue' : 'text-gray-400'} hover:text-white hover:bg-twilight-dark transition-colors duration-200`}
            title="Settings"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading || !isSDKInitialized}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            title="Refresh orderbook"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 border-b border-twilight-dark bg-twilight-darker">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Group Size</label>
              <select
                value={groupingSize}
                onChange={handleGroupingSizeChange}
                className="w-full p-2 bg-twilight-dark border border-twilight-dark rounded text-sm"
              >
                <option value="0.01">0.01</option>
                <option value="0.1">0.1</option>
                <option value="1">1</option>
                <option value="10">10</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Visible Rows</label>
              <select
                value={visibleRows}
                onChange={handleVisibleRowsChange}
                className="w-full p-2 bg-twilight-dark border border-twilight-dark rounded text-sm"
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price Precision</label>
              <div className="flex">
                <button
                  onClick={() => handlePrecisionChange('price', Math.max(0, pricePrecision - 1))}
                  className="px-2 py-1 bg-twilight-dark border border-twilight-dark rounded-l"
                  disabled={pricePrecision <= 0}
                >
                  -
                </button>
                <div className="px-3 py-1 bg-twilight-darker border-t border-b border-twilight-dark">
                  {pricePrecision}
                </div>
                <button
                  onClick={() => handlePrecisionChange('price', pricePrecision + 1)}
                  className="px-2 py-1 bg-twilight-dark border border-twilight-dark rounded-r"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount Precision</label>
              <div className="flex">
                <button
                  onClick={() => handlePrecisionChange('amount', Math.max(0, amountPrecision - 1))}
                  className="px-2 py-1 bg-twilight-dark border border-twilight-dark rounded-l"
                  disabled={amountPrecision <= 0}
                >
                  -
                </button>
                <div className="px-3 py-1 bg-twilight-darker border-t border-b border-twilight-dark">
                  {amountPrecision}
                </div>
                <button
                  onClick={() => handlePrecisionChange('amount', amountPrecision + 1)}
                  className="px-2 py-1 bg-twilight-dark border border-twilight-dark rounded-r"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="card-body p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-400">
            Error: {error.message}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Price Header */}
            <div className="p-4 border-b border-twilight-dark">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-sm">Mid Price</span>
                  <div className="flex items-center">
                    <span className="text-xl font-medium">
                      {midPrice ? formatNumber(midPrice, pricePrecision) : '-'}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      {quoteAsset}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm">Spread</span>
                  <div className="text-xl font-medium">
                    {formatNumber(spread.absolute, pricePrecision)} ({formatNumber(spread.percentage, 2)}%)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Table Headers */}
            <div className="grid grid-cols-4 text-xs text-gray-400 px-4 py-2 border-b border-twilight-dark">
              <div>Price ({quoteAsset})</div>
              <div className="text-right">Amount ({baseAsset})</div>
              <div className="text-right">Total ({quoteAsset})</div>
              <div className="text-right">Orders</div>
            </div>
            
            {/* Sell Orders (reversed to show highest price at bottom) */}
            {(viewMode === 'both' || viewMode === 'sells') && (
              <div className={`overflow-y-auto scrollbar-thin ${viewMode === 'both' ? 'max-h-60' : 'max-h-[500px]'}`}>
                {groupedSellOrders.slice(0, visibleRows).map((order) => (
                  <div 
                    key={`sell-${order.price}`}
                    className={`grid grid-cols-4 text-sm px-4 py-1.5 hover:bg-twilight-dark hover:bg-opacity-50 relative cursor-pointer ${
                      selectedPrice === order.price ? 'bg-twilight-dark bg-opacity-50' : ''
                    } ${
                      order.orders.some(o => lastUpdatedOrders.includes(o.id)) ? 'animate-flash-red' : ''
                    }`}
                    onClick={() => handlePriceClick(order.price)}
                  >
                    {/* Background bar for visualization */}
                    {depthView && (
                      <div 
                        className="absolute right-0 top-0 h-full bg-red-500 bg-opacity-10"
                        style={{ 
                          width: `${priceLevels.find(l => l.price === order.price && l.side === OrderSide.Sell)?.depth || 0}%` 
                        }}
                      ></div>
                    )}
                    
                    {/* Content */}
                    <div className="text-red-400 z-10">{formatNumber(order.price, pricePrecision)}</div>
                    <div className="text-right z-10">{formatNumber(order.amount, amountPrecision)}</div>
                    <div className="text-right z-10">{formatNumber(order.total, pricePrecision)}</div>
                    <div className="text-right text-gray-400 z-10">
                      {order.count}
                    </div>
                  </div>
                ))}
                
                {groupedSellOrders.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    No sell orders
                  </div>
                )}
              </div>
            )}
            
            {/* Spread indicator (only in 'both' view) */}
            {viewMode === 'both' && (
              <div className="px-4 py-2 border-t border-b border-twilight-dark bg-twilight-darker bg-opacity-50 text-center">
                <span className="text-gray-400">Spread: </span>
                <span className="text-white">{formatNumber(spread.absolute, pricePrecision)} ({formatNumber(spread.percentage, 2)}%)</span>
              </div>
            )}
            
            {/* Buy Orders */}
            {(viewMode === 'both' || viewMode === 'buys') && (
              <div className={`overflow-y-auto scrollbar-thin ${viewMode === 'both' ? 'max-h-60' : 'max-h-[500px]'}`}>
                {groupedBuyOrders.slice(0, visibleRows).map((order) => (
                  <div 
                    key={`buy-${order.price}`}
                    className={`grid grid-cols-4 text-sm px-4 py-1.5 hover:bg-twilight-dark hover:bg-opacity-50 relative cursor-pointer ${
                      selectedPrice === order.price ? 'bg-twilight-dark bg-opacity-50' : ''
                    } ${
                      order.orders.some(o => lastUpdatedOrders.includes(o.id)) ? 'animate-flash-green' : ''
                    }`}
                    onClick={() => handlePriceClick(order.price)}
                  >
                    {/* Background bar for visualization */}
                    {depthView && (
                      <div 
                        className="absolute right-0 top-0 h-full bg-green-500 bg-opacity-10"
                        style={{ 
                          width: `${priceLevels.find(l => l.price === order.price && l.side === OrderSide.Buy)?.depth || 0}%` 
                        }}
                      ></div>
                    )}
                    
                    {/* Content */}
                    <div className="text-green-400 z-10">{formatNumber(order.price, pricePrecision)}</div>
                    <div className="text-right z-10">{formatNumber(order.amount, amountPrecision)}</div>
                    <div className="text-right z-10">{formatNumber(order.total, pricePrecision)}</div>
                    <div className="text-right text-gray-400 z-10">
                      {order.count}
                    </div>
                  </div>
                ))}
                
                {groupedBuyOrders.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    No buy orders
                  </div>
                )}
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
      
      {/* CSS classes for animations are defined in the global CSS */}
    </div>
  );
};

export default EnhancedOrderbook;