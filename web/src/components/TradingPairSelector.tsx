import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatPrice, formatPercentage } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingPairSelectorProps {
  selectedPair?: string;
  onSelectPair: (pair: string) => void;
  className?: string;
}

interface TradingPair {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: string;
  priceChange24h: number;
  volume24h: string;
  baseAssetType: 'btc' | 'rune' | 'alkane';
  quoteAssetType: 'btc' | 'rune' | 'alkane';
}

const TradingPairSelector: React.FC<TradingPairSelectorProps> = ({
  selectedPair,
  onSelectPair,
  className = '',
}) => {
  // State
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'btc' | 'runes' | 'alkanes'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'volume'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch trading pairs
  const fetchTradingPairs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Generate mock data
      const mockPairs: TradingPair[] = [
        {
          id: 'btc-rune1',
          baseAsset: 'RUNE1',
          quoteAsset: 'BTC',
          lastPrice: (0.0001 + Math.random() * 0.0009).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'rune',
          quoteAssetType: 'btc',
        },
        {
          id: 'btc-rune2',
          baseAsset: 'RUNE2',
          quoteAsset: 'BTC',
          lastPrice: (0.0001 + Math.random() * 0.0009).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'rune',
          quoteAssetType: 'btc',
        },
        {
          id: 'btc-rune3',
          baseAsset: 'RUNE3',
          quoteAsset: 'BTC',
          lastPrice: (0.0001 + Math.random() * 0.0009).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'rune',
          quoteAssetType: 'btc',
        },
        {
          id: 'btc-alk1',
          baseAsset: 'ALK1',
          quoteAsset: 'BTC',
          lastPrice: (0.0001 + Math.random() * 0.0009).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'alkane',
          quoteAssetType: 'btc',
        },
        {
          id: 'btc-alk2',
          baseAsset: 'ALK2',
          quoteAsset: 'BTC',
          lastPrice: (0.0001 + Math.random() * 0.0009).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'alkane',
          quoteAssetType: 'btc',
        },
        {
          id: 'rune1-alk1',
          baseAsset: 'ALK1',
          quoteAsset: 'RUNE1',
          lastPrice: (0.1 + Math.random() * 0.9).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'alkane',
          quoteAssetType: 'rune',
        },
        {
          id: 'rune2-alk2',
          baseAsset: 'ALK2',
          quoteAsset: 'RUNE2',
          lastPrice: (0.1 + Math.random() * 0.9).toFixed(8),
          priceChange24h: (Math.random() * 20) - 10,
          volume24h: (Math.random() * 100).toFixed(2),
          baseAssetType: 'alkane',
          quoteAssetType: 'rune',
        },
      ];
      
      setTradingPairs(mockPairs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trading pairs');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch trading pairs on mount
  useEffect(() => {
    fetchTradingPairs();
  }, []);
  
  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter and sort trading pairs
  const filteredAndSortedPairs = tradingPairs
    .filter(pair => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          pair.baseAsset.toLowerCase().includes(query) ||
          pair.quoteAsset.toLowerCase().includes(query) ||
          `${pair.baseAsset}/${pair.quoteAsset}`.toLowerCase().includes(query)
        );
      }
      
      // Filter by asset type
      if (filter === 'btc') {
        return pair.baseAssetType === 'btc' || pair.quoteAssetType === 'btc';
      } else if (filter === 'runes') {
        return pair.baseAssetType === 'rune' || pair.quoteAssetType === 'rune';
      } else if (filter === 'alkanes') {
        return pair.baseAssetType === 'alkane' || pair.quoteAssetType === 'alkane';
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.baseAsset}/${a.quoteAsset}`.localeCompare(`${b.baseAsset}/${b.quoteAsset}`);
          break;
        case 'price':
          comparison = parseFloat(a.lastPrice) - parseFloat(b.lastPrice);
          break;
        case 'change':
          comparison = a.priceChange24h - b.priceChange24h;
          break;
        case 'volume':
          comparison = parseFloat(a.volume24h) - parseFloat(b.volume24h);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  // Get selected pair details
  const selectedPairDetails = tradingPairs.find(pair => pair.id === selectedPair);
  
  // Handle sort
  const handleSort = (column: 'name' | 'price' | 'change' | 'volume') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  // Get asset icon
  const getAssetIcon = (assetType: 'btc' | 'rune' | 'alkane', symbol: string) => {
    let bgColor: string;
    
    switch (assetType) {
      case 'btc':
        bgColor = 'bg-orange-500';
        break;
      case 'rune':
        bgColor = 'bg-blue-500';
        break;
      case 'alkane':
        bgColor = 'bg-green-500';
        break;
      default:
        bgColor = 'bg-gray-500';
    }
    
    return (
      <div className={`w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold`}>
        {symbol.substring(0, 2)}
      </div>
    );
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected pair button */}
      <button
        className="w-full flex items-center justify-between p-3 bg-twilight-darker rounded-lg hover:bg-twilight-dark transition-colors duration-200"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center">
          {selectedPairDetails ? (
            <>
              <div className="flex items-center">
                {getAssetIcon(selectedPairDetails.baseAssetType, selectedPairDetails.baseAsset)}
                <span className="ml-2">{selectedPairDetails.baseAsset}</span>
              </div>
              <span className="mx-2">/</span>
              <div className="flex items-center">
                {getAssetIcon(selectedPairDetails.quoteAssetType, selectedPairDetails.quoteAsset)}
                <span className="ml-2">{selectedPairDetails.quoteAsset}</span>
              </div>
            </>
          ) : (
            <span className="text-gray-400">Select Trading Pair</span>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            className="absolute z-50 mt-2 w-full bg-twilight-darker rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search and filters */}
            <div className="p-3 border-b border-twilight-dark">
              <div className="relative mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pairs..."
                  className="w-full p-2 pl-8 bg-twilight-dark rounded-lg text-sm"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex justify-between">
                {/* Asset type filter */}
                <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-2 py-1 text-xs ${filter === 'all' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('btc')}
                    className={`px-2 py-1 text-xs ${filter === 'btc' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                  >
                    BTC
                  </button>
                  <button
                    onClick={() => setFilter('runes')}
                    className={`px-2 py-1 text-xs ${filter === 'runes' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                  >
                    Runes
                  </button>
                  <button
                    onClick={() => setFilter('alkanes')}
                    className={`px-2 py-1 text-xs ${filter === 'alkanes' ? 'bg-twilight-primary text-white' : 'bg-twilight-dark text-gray-400'}`}
                  >
                    Alkanes
                  </button>
                </div>
                
                {/* Refresh button */}
                <button
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
                  onClick={fetchTradingPairs}
                  title="Refresh trading pairs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Trading pairs list */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="w-6 h-6 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-400">Loading pairs...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-4 text-ui-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2">{error}</p>
                  <button 
                    className="mt-2 btn btn-sm btn-primary"
                    onClick={fetchTradingPairs}
                  >
                    Retry
                  </button>
                </div>
              ) : filteredAndSortedPairs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2">No trading pairs found</p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div className="grid grid-cols-4 gap-2 p-3 text-xs text-gray-400 border-b border-twilight-dark">
                    <div 
                      className="cursor-pointer flex items-center"
                      onClick={() => handleSort('name')}
                    >
                      Pair
                      {sortBy === 'name' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                    <div 
                      className="cursor-pointer flex items-center justify-end"
                      onClick={() => handleSort('price')}
                    >
                      Price
                      {sortBy === 'price' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                    <div 
                      className="cursor-pointer flex items-center justify-end"
                      onClick={() => handleSort('change')}
                    >
                      24h Change
                      {sortBy === 'change' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                    <div 
                      className="cursor-pointer flex items-center justify-end"
                      onClick={() => handleSort('volume')}
                    >
                      Volume
                      {sortBy === 'volume' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortOrder === 'asc' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Table body */}
                  {filteredAndSortedPairs.map((pair) => (
                    <div
                      key={pair.id}
                      className={`grid grid-cols-4 gap-2 p-3 hover:bg-twilight-dark cursor-pointer ${
                        selectedPair === pair.id ? 'bg-twilight-dark' : ''
                      }`}
                      onClick={() => {
                        onSelectPair(pair.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="flex -space-x-1">
                          {getAssetIcon(pair.baseAssetType, pair.baseAsset)}
                          {getAssetIcon(pair.quoteAssetType, pair.quoteAsset)}
                        </div>
                        <span className="ml-2">
                          {pair.baseAsset}/{pair.quoteAsset}
                        </span>
                      </div>
                      <div className="text-right">
                        {formatPrice(pair.lastPrice)}
                      </div>
                      <div className={`text-right ${pair.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(pair.priceChange24h)}
                      </div>
                      <div className="text-right">
                        {pair.volume24h} {pair.quoteAsset}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingPairSelector;