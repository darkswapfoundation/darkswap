import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import ApiClient from '../utils/ApiClient';

// Icons
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export interface MarketDataDisplayProps {
  pair: string;
  isLoading?: boolean;
  isSDKInitialized?: boolean;
  apiClient?: ApiClient;
  refreshInterval?: number; // in milliseconds
}

interface MarketData {
  lastPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
  bidCount: number;
  askCount: number;
  bidVolume: number;
  askVolume: number;
  lastUpdated: number;
}

interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  total: number;
  side: 'buy' | 'sell';
  timestamp: number;
  maker: string;
  taker: string;
}

const MarketDataDisplay: React.FC<MarketDataDisplayProps> = ({
  pair,
  isLoading: externalIsLoading,
  isSDKInitialized,
  apiClient,
  refreshInterval = 30000, // Default to 30 seconds
}) => {
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState<boolean>(externalIsLoading || false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [baseAsset, quoteAsset] = pair.split('/');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Fetch market data
  const fetchMarketData = async () => {
    if (!isSDKInitialized || !pair) return;
    
    setIsLoading(true);
    
    try {
      if (apiClient) {
        // Fetch market data from API
        const response = await apiClient.getMarketData(baseAsset, quoteAsset);
        
        if (response.error) {
          console.error('Error fetching market data:', response.error);
        } else if (response.data) {
          // Process the data
          setMarketData({
            lastPrice: parseFloat(response.data.last_price || '0'),
            priceChange24h: parseFloat(response.data.price_change_24h || '0'),
            priceChangePercent24h: parseFloat(response.data.price_change_percentage_24h || '0'),
            high24h: parseFloat(response.data.high_24h || '0'),
            low24h: parseFloat(response.data.low_24h || '0'),
            volume24h: parseFloat(response.data.volume_24h || '0'),
            volumeQuote24h: parseFloat(response.data.volume_24h || '0') * parseFloat(response.data.last_price || '0'),
            bidCount: 0, // Not available in API, using mock data
            askCount: 0, // Not available in API, using mock data
            bidVolume: 0, // Not available in API, using mock data
            askVolume: 0, // Not available in API, using mock data
            lastUpdated: Date.now(),
          });
          
          // Try to fetch recent trades
          try {
            const tradesResponse = await apiClient.getRecentTrades(baseAsset, quoteAsset);
            if (tradesResponse.data) {
              // Convert API trades to our RecentTrade format
              const trades: RecentTrade[] = tradesResponse.data.map(trade => ({
                id: trade.id,
                price: parseFloat(trade.price),
                amount: parseFloat(trade.amount),
                total: parseFloat(trade.total || (parseFloat(trade.price) * parseFloat(trade.amount)).toString()),
                side: trade.side,
                timestamp: trade.timestamp,
                maker: trade.maker_peer_id,
                taker: trade.taker_peer_id,
              }));
              setRecentTrades(trades);
            } else {
              // Fallback to mock trades if API returns no data
              generateMockTrades(parseFloat(response.data.last_price || '0'));
            }
          } catch (error) {
            console.error('Error fetching recent trades:', error);
            // Fallback to mock trades on error
            generateMockTrades(parseFloat(response.data.last_price || '0'));
          }
        }
      } else {
        // Generate mock data for demo
        generateMockData();
      }
      
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Error fetching market data:', error);
      addNotification('error', `Failed to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate mock trades based on a price
  const generateMockTrades = (basePrice: number) => {
    // Generate mock recent trades
    const mockTrades: RecentTrade[] = [];
    for (let i = 0; i < 10; i++) {
      const price = basePrice * (1 + (Math.random() * 0.02 - 0.01));
      const amount = Math.random() * 2 + 0.1;
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      
      mockTrades.push({
        id: `trade-${Date.now()}-${i}`,
        price,
        amount,
        total: price * amount,
        side,
        timestamp: Date.now() - (i * 60000), // Each trade is 1 minute apart
        maker: `0x${Math.random().toString(16).substring(2, 10)}`,
        taker: `0x${Math.random().toString(16).substring(2, 10)}`,
      });
    }
    
    setRecentTrades(mockTrades);
  };
  
  // Generate mock data for demo
  const generateMockData = () => {
    const lastPrice = pair.includes('BTC') ? 20000 + (Math.random() * 2000 - 1000) : 200 + (Math.random() * 20 - 10);
    const priceChange24h = lastPrice * (Math.random() * 0.1 - 0.05);
    const priceChangePercent24h = (priceChange24h / lastPrice) * 100;
    const high24h = lastPrice * (1 + Math.random() * 0.05);
    const low24h = lastPrice * (1 - Math.random() * 0.05);
    const volume24h = Math.random() * 100 + 10;
    const volumeQuote24h = volume24h * lastPrice;
    
    setMarketData({
      lastPrice,
      priceChange24h,
      priceChangePercent24h,
      high24h,
      low24h,
      volume24h,
      volumeQuote24h,
      bidCount: Math.floor(Math.random() * 50) + 10,
      askCount: Math.floor(Math.random() * 50) + 10,
      bidVolume: Math.random() * 50 + 5,
      askVolume: Math.random() * 50 + 5,
      lastUpdated: Date.now(),
    });
    
    // Generate mock trades
    generateMockTrades(lastPrice);
  };
  
  // Fetch data when pair changes or on initial load
  useEffect(() => {
    if (isSDKInitialized) {
      fetchMarketData();
    }
  }, [pair, isSDKInitialized]);
  
  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !isSDKInitialized) return;
    
    const intervalId = setInterval(() => {
      fetchMarketData();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, pair, isSDKInitialized]);
  
  // Format number with specified precision
  const formatNumber = (num: number, precision: number = 2): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  };
  
  // Format crypto amount
  const formatCrypto = (num: number): string => {
    if (num < 0.001) return num.toFixed(8);
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };
  
  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchMarketData();
  };
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      // If turning on auto-refresh, fetch data immediately
      fetchMarketData();
    }
  };
  
  // Format asset name for display
  const formatAssetName = (asset: string) => {
    if (asset.includes(':')) {
      const [type] = asset.split(':');
      return `${type}`;
    }
    return asset;
  };
  
  return (
    <div className="card h-full">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">
          {formatAssetName(baseAsset)}/{formatAssetName(quoteAsset)} Market Data
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAutoRefresh}
            className={`p-1 rounded-lg ${autoRefresh ? 'text-twilight-neon-blue' : 'text-gray-400'} hover:text-white hover:bg-twilight-dark transition-colors duration-200`}
            title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          >
            <ClockIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading || !isSDKInitialized}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            title="Refresh market data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="card-body p-0">
        {isLoading && !marketData ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
          </div>
        ) : marketData ? (
          <div>
            {/* Price Overview */}
            <div className="p-4 border-b border-twilight-dark">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-sm">Last Price</span>
                  <div className="flex items-center">
                    <span className="text-2xl font-medium">
                      {formatNumber(marketData.lastPrice)}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">
                      {formatAssetName(quoteAsset)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm">24h Change</span>
                  <div className="flex items-center">
                    <span className={`text-xl font-medium ${marketData.priceChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {marketData.priceChangePercent24h >= 0 ? '+' : ''}
                      {formatNumber(marketData.priceChangePercent24h, 2)}%
                    </span>
                    <span className="ml-2">
                      {marketData.priceChangePercent24h >= 0 ? (
                        <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Market Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-twilight-dark">
              <div>
                <span className="text-gray-400 text-sm">24h High</span>
                <div className="text-white font-medium">
                  {formatNumber(marketData.high24h)}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">24h Low</span>
                <div className="text-white font-medium">
                  {formatNumber(marketData.low24h)}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">24h Volume ({formatAssetName(baseAsset)})</span>
                <div className="text-white font-medium">
                  {formatNumber(marketData.volume24h)}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">24h Volume ({formatAssetName(quoteAsset)})</span>
                <div className="text-white font-medium">
                  {formatNumber(marketData.volumeQuote24h)}
                </div>
              </div>
            </div>
            
            {/* Market Depth */}
            <div className="p-4 border-b border-twilight-dark">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Market Depth</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Bids</span>
                    <span className="text-green-400">{marketData.bidCount} orders</span>
                  </div>
                  <div className="mt-1 h-2 bg-twilight-dark rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(marketData.bidVolume / (marketData.bidVolume + marketData.askVolume)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-right mt-1">
                    {formatNumber(marketData.bidVolume)} {formatAssetName(baseAsset)}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Asks</span>
                    <span className="text-red-400">{marketData.askCount} orders</span>
                  </div>
                  <div className="mt-1 h-2 bg-twilight-dark rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${(marketData.askVolume / (marketData.bidVolume + marketData.askVolume)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-right mt-1">
                    {formatNumber(marketData.askVolume)} {formatAssetName(baseAsset)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Trades */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Recent Trades</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400">
                      <th className="text-left pb-2">Price</th>
                      <th className="text-right pb-2">Amount</th>
                      <th className="text-right pb-2">Total</th>
                      <th className="text-right pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.slice(0, 5).map((trade) => (
                      <tr key={trade.id} className="text-sm">
                        <td className={`py-1 ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                          {formatNumber(trade.price)}
                        </td>
                        <td className="py-1 text-right">
                          {formatCrypto(trade.amount)}
                        </td>
                        <td className="py-1 text-right">
                          {formatNumber(trade.total)}
                        </td>
                        <td className="py-1 text-right text-gray-400">
                          {formatTimeAgo(trade.timestamp)}
                        </td>
                      </tr>
                    ))}
                    
                    {recentTrades.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-400">
                          No recent trades
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            No market data available
          </div>
        )}
      </div>
      
      <div className="card-footer text-xs text-gray-400 flex justify-between items-center">
        <div>
          Last updated: {marketData ? formatDate(marketData.lastUpdated) : 'Never'}
        </div>
        <div>
          {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
        </div>
      </div>
    </div>
  );
};

export default MarketDataDisplay;