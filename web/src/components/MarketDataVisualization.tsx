import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatPrice, formatPercentage } from '../utils/formatters';
import { MarketData } from '../utils/ApiClient';

interface MarketDataVisualizationProps {
  baseAsset?: string;
  quoteAsset?: string;
  className?: string;
}

const MarketDataVisualization: React.FC<MarketDataVisualizationProps> = ({
  baseAsset = 'BTC',
  quoteAsset = 'RUNE:0x123',
  className = '',
}) => {
  // State
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch market data
  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await client.getMarketData(baseAsset, quoteAsset);
      
      if (response.error) {
        setError(response.error);
      } else {
        setMarketData(response.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch market data on mount and when assets change
  useEffect(() => {
    fetchMarketData();
    
    // Set up interval to refresh market data
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [baseAsset, quoteAsset]);
  
  // Render loading state
  if (isLoading && !marketData) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Market Data</h2>
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
  if (error && !marketData) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">Market Data</h2>
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
        <h2 className="text-lg font-display font-medium">
          Market Data <span className="text-sm text-gray-400">{baseAsset}/{quoteAsset}</span>
        </h2>
        <button 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          onClick={fetchMarketData}
          title="Refresh market data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="card-body">
        {marketData && (
          <div className="grid grid-cols-2 gap-4">
            {/* Last Price */}
            <div className="p-4 bg-twilight-darker rounded-lg">
              <div className="text-xs text-gray-400">Last Price</div>
              <div className="text-xl font-medium">{formatPrice(marketData.last_price)}</div>
            </div>
            
            {/* 24h Change */}
            <div className="p-4 bg-twilight-darker rounded-lg">
              <div className="text-xs text-gray-400">24h Change</div>
              <div className={`text-xl font-medium ${parseFloat(marketData.price_change_percentage_24h) >= 0 ? 'text-ui-success' : 'text-ui-error'}`}>
                {formatPercentage(marketData.price_change_percentage_24h)}
                <span className="ml-1">
                  {parseFloat(marketData.price_change_percentage_24h) >= 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              </div>
            </div>
            
            {/* 24h High */}
            <div className="p-3 bg-twilight-darker rounded-lg">
              <div className="text-xs text-gray-400">24h High</div>
              <div className="text-base font-medium">{formatPrice(marketData.high_24h)}</div>
            </div>
            
            {/* 24h Low */}
            <div className="p-3 bg-twilight-darker rounded-lg">
              <div className="text-xs text-gray-400">24h Low</div>
              <div className="text-base font-medium">{formatPrice(marketData.low_24h)}</div>
            </div>
            
            {/* Bid Price */}
            <div className="p-3 bg-twilight-darker rounded-lg">
              <div className="text-xs text-gray-400">Bid Price</div>
              <div className="text-base font-medium text-ui-success">{formatPrice(marketData.bid_price)}</div>
            </div>
            
            {/* Ask Price */}
            <div className="p-3 bg-twilight-darker rounded-lg">
              <div className="text-xs text-gray-400">Ask Price</div>
              <div className="text-base font-medium text-ui-error">{formatPrice(marketData.ask_price)}</div>
            </div>
            
            {/* 24h Volume */}
            <div className="p-3 bg-twilight-darker rounded-lg col-span-2">
              <div className="text-xs text-gray-400">24h Volume</div>
              <div className="text-base font-medium">{formatPrice(marketData.volume_24h)} {baseAsset}</div>
            </div>
          </div>
        )}
        
        {/* Price chart placeholder */}
        <div className="mt-4 p-4 bg-twilight-darker rounded-lg h-48 flex items-center justify-center">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="mt-2 text-gray-400">Price chart coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDataVisualization;