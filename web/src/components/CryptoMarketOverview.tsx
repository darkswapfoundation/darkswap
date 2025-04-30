import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatPrice, formatPercentage } from '../utils/formatters';
import { motion } from 'framer-motion';
import { use_mcp_tool } from '../utils/mcp';

interface CryptoMarketOverviewProps {
  className?: string;
  refreshInterval?: number;
}

interface MarketItem {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  type: 'rune' | 'alkane';
}

const CryptoMarketOverview: React.FC<CryptoMarketOverviewProps> = ({
  className = '',
  refreshInterval = 60000, // 1 minute
}) => {
  // State
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'priceChange24h' | 'marketCap' | 'volume24h'>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'runes' | 'alkanes'>('all');
  
  // Get API client
  const { client } = useApi();
  
  // Fetch market data
  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to use the MCP tool if available
      try {
        // Fetch runes data
        const runesResponse = await use_mcp_tool('slope-ski', 'get_runes', {
          limit: 20,
          sort_by: 'market_cap',
          order: 'desc'
        });
        
        // Fetch alkanes data
        const alkanesResponse = await use_mcp_tool('slope-ski', 'get_alkanes', {
          limit: 8,
          sort_by: 'market_cap',
          order: 'desc'
        });
        
        // Combine and format data
        const combinedData: MarketItem[] = [
          ...(runesResponse?.runes || []).map((rune: any) => ({
            id: rune.id,
            name: rune.name,
            symbol: rune.symbol,
            price: rune.price,
            priceChange24h: rune.price_change_percentage_24h,
            marketCap: rune.market_cap,
            volume24h: rune.volume_24h,
            type: 'rune' as const
          })),
          ...(alkanesResponse?.alkanes || []).map((alkane: any) => ({
            id: alkane.id,
            name: alkane.name,
            symbol: alkane.symbol,
            price: alkane.price,
            priceChange24h: alkane.price_change_percentage_24h,
            marketCap: alkane.market_cap,
            volume24h: alkane.volume_24h,
            type: 'alkane' as const
          }))
        ];
        
        setMarketData(combinedData);
        return;
      } catch (mcpError) {
        console.log('MCP tool not available, falling back to mock data');
      }
      
      // If MCP tool is not available, generate mock data
      const mockRunes: MarketItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rune-${i}`,
        name: `Rune ${i + 1}`,
        symbol: `RUNE${i + 1}`,
        price: Math.random() * 1000,
        priceChange24h: (Math.random() * 20) - 10,
        marketCap: Math.random() * 10000000,
        volume24h: Math.random() * 1000000,
        type: 'rune'
      }));
      
      const mockAlkanes: MarketItem[] = Array.from({ length: 5 }, (_, i) => ({
        id: `alkane-${i}`,
        name: `Alkane ${i + 1}`,
        symbol: `ALK${i + 1}`,
        price: Math.random() * 500,
        priceChange24h: (Math.random() * 20) - 10,
        marketCap: Math.random() * 5000000,
        volume24h: Math.random() * 500000,
        type: 'alkane'
      }));
      
      setMarketData([...mockRunes, ...mockAlkanes]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch market data on mount and at regular intervals
  useEffect(() => {
    fetchMarketData();
    
    // Set up interval to refresh market data
    const interval = setInterval(fetchMarketData, refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);
  
  // Sort and filter market data
  const sortedAndFilteredData = marketData
    .filter(item => filter === 'all' || item.type === filter.slice(0, -1))
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'priceChange24h':
          comparison = a.priceChange24h - b.priceChange24h;
          break;
        case 'marketCap':
          comparison = a.marketCap - b.marketCap;
          break;
        case 'volume24h':
          comparison = a.volume24h - b.volume24h;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  // Handle sort
  const handleSort = (column: 'name' | 'price' | 'priceChange24h' | 'marketCap' | 'volume24h') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  // Format market cap and volume
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };
  
  // Render loading state
  if (isLoading && marketData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Crypto Market Overview</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading market data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && marketData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Crypto Market Overview</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchMarketData}
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
        <h2 className="text-lg font-display font-medium">Crypto Market Overview</h2>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 text-xs ${filter === 'all' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('runes')}
              className={`px-2 py-1 text-xs ${filter === 'runes' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Runes
            </button>
            <button
              onClick={() => setFilter('alkanes')}
              className={`px-2 py-1 text-xs ${filter === 'alkanes' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Alkanes
            </button>
          </div>
          <button 
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
            onClick={fetchMarketData}
            title="Refresh market data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === 'name' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end">
                    Price
                    {sortBy === 'price' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('priceChange24h')}
                >
                  <div className="flex items-center justify-end">
                    24h Change
                    {sortBy === 'priceChange24h' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer text-right hidden md:table-cell"
                  onClick={() => handleSort('marketCap')}
                >
                  <div className="flex items-center justify-end">
                    Market Cap
                    {sortBy === 'marketCap' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer text-right hidden md:table-cell"
                  onClick={() => handleSort('volume24h')}
                >
                  <div className="flex items-center justify-end">
                    Volume (24h)
                    {sortBy === 'volume24h' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredData.map((item, index) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-twilight-dark cursor-pointer"
                >
                  <td>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${item.type === 'rune' ? 'bg-blue-500' : 'bg-green-500'} flex items-center justify-center mr-2`}>
                        <span className="text-xs font-bold text-white">{item.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">
                    ${formatPrice(item.price)}
                  </td>
                  <td className={`text-right ${item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(item.priceChange24h)}
                  </td>
                  <td className="text-right hidden md:table-cell">
                    {formatLargeNumber(item.marketCap)}
                  </td>
                  <td className="text-right hidden md:table-cell">
                    {formatLargeNumber(item.volume24h)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CryptoMarketOverview;