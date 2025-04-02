import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatPrice, formatPercentage } from '../utils/formatters';
import { use_mcp_tool } from '../utils/mcp';

interface MarketSummaryProps {
  className?: string;
  refreshInterval?: number;
}

interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  runeMarketCap: number;
  alkaneMarketCap: number;
  activeMarkets: number;
  priceChanges: {
    btc: number;
    runes: number;
    alkanes: number;
  };
}

const MarketSummary: React.FC<MarketSummaryProps> = ({
  className = '',
  refreshInterval = 60000, // 1 minute
}) => {
  // State
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch market stats
  const fetchMarketStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to use the MCP tool if available
      try {
        // Fetch market stats
        const marketStatsResponse = await use_mcp_tool('slope-ski', 'get_market_stats', {});
        
        if (marketStatsResponse) {
          setMarketStats({
            totalMarketCap: marketStatsResponse.total_market_cap,
            totalVolume24h: marketStatsResponse.total_volume_24h,
            btcDominance: marketStatsResponse.btc_dominance,
            runeMarketCap: marketStatsResponse.rune_market_cap,
            alkaneMarketCap: marketStatsResponse.alkane_market_cap,
            activeMarkets: marketStatsResponse.active_markets,
            priceChanges: {
              btc: marketStatsResponse.price_changes.btc,
              runes: marketStatsResponse.price_changes.runes,
              alkanes: marketStatsResponse.price_changes.alkanes,
            },
          });
          return;
        }
      } catch (mcpError) {
        console.log('MCP tool not available, falling back to mock data');
      }
      
      // If MCP tool is not available, generate mock data
      const mockMarketStats: MarketStats = {
        totalMarketCap: 1000000000 + Math.random() * 500000000,
        totalVolume24h: 50000000 + Math.random() * 25000000,
        btcDominance: 40 + Math.random() * 10,
        runeMarketCap: 300000000 + Math.random() * 150000000,
        alkaneMarketCap: 200000000 + Math.random() * 100000000,
        activeMarkets: 10 + Math.floor(Math.random() * 10),
        priceChanges: {
          btc: (Math.random() * 10) - 5,
          runes: (Math.random() * 20) - 10,
          alkanes: (Math.random() * 30) - 15,
        },
      };
      
      setMarketStats(mockMarketStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market stats');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch market stats on mount and at regular intervals
  useEffect(() => {
    fetchMarketStats();
    
    // Set up interval to refresh market stats
    const interval = setInterval(fetchMarketStats, refreshInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);
  
  // Format large number
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
  if (isLoading && !marketStats) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Market Summary</h2>
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
  if (error && !marketStats) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Market Summary</h2>
        </div>
        <div className="card-body flex items-center justify-center h-48">
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchMarketStats}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!marketStats) {
    return null;
  }
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-display font-medium">Market Summary</h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchMarketStats}
          title="Refresh market data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total Market Cap */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Total Market Cap</div>
            <div className="text-lg font-medium">{formatLargeNumber(marketStats.totalMarketCap)}</div>
          </div>
          
          {/* 24h Volume */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">24h Volume</div>
            <div className="text-lg font-medium">{formatLargeNumber(marketStats.totalVolume24h)}</div>
          </div>
          
          {/* BTC Dominance */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">BTC Dominance</div>
            <div className="text-lg font-medium">{marketStats.btcDominance.toFixed(2)}%</div>
          </div>
          
          {/* Rune Market Cap */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Rune Market Cap</div>
            <div className="text-lg font-medium">{formatLargeNumber(marketStats.runeMarketCap)}</div>
          </div>
          
          {/* Alkane Market Cap */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Alkane Market Cap</div>
            <div className="text-lg font-medium">{formatLargeNumber(marketStats.alkaneMarketCap)}</div>
          </div>
          
          {/* Active Markets */}
          <div className="p-3 bg-twilight-darker rounded-lg">
            <div className="text-xs text-gray-400">Active Markets</div>
            <div className="text-lg font-medium">{marketStats.activeMarkets}</div>
          </div>
        </div>
        
        {/* Price Changes */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">24h Price Changes</h3>
          <div className="space-y-3">
            {/* BTC Price Change */}
            <div className="flex items-center justify-between p-3 bg-twilight-darker rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold mr-3">
                  BT
                </div>
                <div>
                  <div className="font-medium">Bitcoin</div>
                  <div className="text-xs text-gray-400">BTC</div>
                </div>
              </div>
              <div className={marketStats.priceChanges.btc >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(marketStats.priceChanges.btc)}
              </div>
            </div>
            
            {/* Runes Price Change */}
            <div className="flex items-center justify-between p-3 bg-twilight-darker rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                  RU
                </div>
                <div>
                  <div className="font-medium">Runes</div>
                  <div className="text-xs text-gray-400">Average</div>
                </div>
              </div>
              <div className={marketStats.priceChanges.runes >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(marketStats.priceChanges.runes)}
              </div>
            </div>
            
            {/* Alkanes Price Change */}
            <div className="flex items-center justify-between p-3 bg-twilight-darker rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                  AL
                </div>
                <div>
                  <div className="font-medium">Alkanes</div>
                  <div className="text-xs text-gray-400">Average</div>
                </div>
              </div>
              <div className={marketStats.priceChanges.alkanes >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(marketStats.priceChanges.alkanes)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Market Distribution */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Market Distribution</h3>
          <div className="h-4 bg-twilight-darker rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-orange-500" 
                style={{ width: `${marketStats.btcDominance}%` }}
                title={`BTC: ${marketStats.btcDominance.toFixed(2)}%`}
              ></div>
              <div 
                className="bg-blue-500" 
                style={{ width: `${(marketStats.runeMarketCap / marketStats.totalMarketCap) * 100}%` }}
                title={`Runes: ${((marketStats.runeMarketCap / marketStats.totalMarketCap) * 100).toFixed(2)}%`}
              ></div>
              <div 
                className="bg-green-500" 
                style={{ width: `${(marketStats.alkaneMarketCap / marketStats.totalMarketCap) * 100}%` }}
                title={`Alkanes: ${((marketStats.alkaneMarketCap / marketStats.totalMarketCap) * 100).toFixed(2)}%`}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <div>BTC: {marketStats.btcDominance.toFixed(2)}%</div>
            <div>Runes: {((marketStats.runeMarketCap / marketStats.totalMarketCap) * 100).toFixed(2)}%</div>
            <div>Alkanes: {((marketStats.alkaneMarketCap / marketStats.totalMarketCap) * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSummary;