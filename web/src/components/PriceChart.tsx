import React, { useState, useEffect } from 'react';

// Icons
import {
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface PriceChartProps {
  pair: string;
  isLoading: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({ pair, isLoading }) => {
  const [priceChange, setPriceChange] = useState<number>(5.2);
  const [currentPrice, setCurrentPrice] = useState<number>(20000);

  // Generate mock data when pair changes
  useEffect(() => {
    if (!isLoading) {
      // Set mock price based on pair
      if (pair.includes('BTC')) {
        setCurrentPrice(pair.includes('RUNE') ? 20000 : 19500);
      } else {
        setCurrentPrice(10);
      }
      
      // Set mock price change
      setPriceChange(Math.random() * 10 - 5);
    }
  }, [pair, isLoading]);

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <div>
          <h2 className="text-lg font-display font-medium">{pair} Chart</h2>
          <div className="flex items-center mt-1">
            <span className="text-xl font-medium">${currentPrice.toFixed(2)}</span>
            <span className={`ml-2 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="card-body p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-twilight-neon-blue animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <ChartBarIcon className="w-16 h-16 text-twilight-neon-blue mb-4" />
            <p className="text-gray-400">
              Price chart for {pair}
            </p>
            <p className="text-gray-400">
              Current Price: ${currentPrice.toFixed(2)}
            </p>
            <p className={`${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              24h Change: {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChart;