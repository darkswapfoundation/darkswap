import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ApiClient from '../utils/ApiClient';
import { useWebSocket } from '../contexts/WebSocketContext';

// Icons
import {
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface PriceChartProps {
  pair: string;
  isLoading: boolean;
  apiClient?: ApiClient;
}

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

interface ChartOptions {
  timeframe: '1h' | '1d' | '1w' | '1m';
  chartType: 'line' | 'candle';
}

const PriceChart: React.FC<PriceChartProps> = ({ pair, isLoading, apiClient }) => {
  const [priceChange, setPriceChange] = useState<number>(5.2);
  const [currentPrice, setCurrentPrice] = useState<number>(20000);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [options, setOptions] = useState<ChartOptions>({
    timeframe: '1d',
    chartType: 'line',
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { lastMessage } = useWebSocket();

  // Fetch price data when pair changes
  useEffect(() => {
    if (!isLoading && apiClient) {
      fetchPriceData();
    } else if (!isLoading) {
      // Fallback to mock data if no API client
      generateMockData();
    }
  }, [pair, isLoading, apiClient, options.timeframe]);

  // Update chart when price data changes
  useEffect(() => {
    if (priceData.length > 0) {
      drawChart();
    }
  }, [priceData, options.chartType]);

  // Listen for WebSocket price updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'price_update') {
      try {
        const payload = lastMessage.payload;
        if (payload.pair === pair) {
          // Update current price
          setCurrentPrice(parseFloat(payload.price));
          
          // Calculate price change
          const oldPrice = priceData.length > 0 ? priceData[0].price : parseFloat(payload.price);
          const change = ((parseFloat(payload.price) - oldPrice) / oldPrice) * 100;
          setPriceChange(change);
          
          // Add new price data point
          const newDataPoint: PriceData = {
            timestamp: Date.now(),
            price: parseFloat(payload.price),
            volume: parseFloat(payload.volume || '0'),
          };
          
          setPriceData(prevData => [newDataPoint, ...prevData.slice(0, 99)]);
        }
      } catch (error) {
        console.error('Error processing price update:', error);
      }
    }
  }, [lastMessage, pair, priceData]);

  // Fetch price data from API
  const fetchPriceData = async () => {
    if (!apiClient) return;
    
    try {
      // Parse the pair to get base and quote assets
      const [baseAsset, quoteAsset] = pair.split('/');
      
      // Fetch market data
      const marketResponse = await apiClient.getMarketData(baseAsset, quoteAsset);
      
      if (marketResponse.error) {
        console.error('Failed to fetch market data:', marketResponse.error);
      } else if (marketResponse.data) {
        // Update current price and price change
        setCurrentPrice(parseFloat(marketResponse.data.last_price));
        setPriceChange(parseFloat(marketResponse.data.price_change_percentage_24h));
        
        // In a real implementation, we would fetch historical price data here
        // For now, we'll generate mock data based on the current price
        generateMockDataFromPrice(parseFloat(marketResponse.data.last_price));
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    }
  };

  // Generate mock data from current price
  const generateMockDataFromPrice = (price: number) => {
    const data: PriceData[] = [];
    const now = Date.now();
    const volatility = price * 0.02; // 2% volatility
    
    // Generate data points based on timeframe
    let interval: number;
    let count: number;
    
    switch (options.timeframe) {
      case '1h':
        interval = 60 * 1000; // 1 minute
        count = 60;
        break;
      case '1d':
        interval = 15 * 60 * 1000; // 15 minutes
        count = 96;
        break;
      case '1w':
        interval = 60 * 60 * 1000; // 1 hour
        count = 168;
        break;
      case '1m':
        interval = 6 * 60 * 60 * 1000; // 6 hours
        count = 120;
        break;
      default:
        interval = 15 * 60 * 1000; // 15 minutes
        count = 96;
    }
    
    for (let i = count - 1; i >= 0; i--) {
      // Random walk price
      const randomChange = (Math.random() - 0.5) * volatility;
      const newPrice = i === count - 1 ? price : data[data.length - 1].price + randomChange;
      
      data.push({
        timestamp: now - i * interval,
        price: newPrice,
        volume: Math.random() * price * 10,
      });
    }
    
    setPriceData(data);
  };

  // Generate mock data
  const generateMockData = () => {
    // Set mock price based on pair
    let basePrice: number;
    if (pair.includes('BTC')) {
      basePrice = pair.includes('RUNE') ? 20000 : 19500;
    } else {
      basePrice = 10;
    }
    
    setCurrentPrice(basePrice);
    
    // Set mock price change
    const mockPriceChange = Math.random() * 10 - 5;
    setPriceChange(mockPriceChange);
    
    // Generate mock price data
    generateMockDataFromPrice(basePrice);
  };

  // Draw chart
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate min and max price
    const prices = priceData.map(d => d.price);
    const minPrice = Math.min(...prices) * 0.99;
    const maxPrice = Math.max(...prices) * 1.01;
    const priceRange = maxPrice - minPrice;
    
    // Draw background grid
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = height - (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Price labels
      const price = minPrice + (i / 4) * priceRange;
      ctx.fillStyle = '#8a8a9a';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), 5, y - 5);
    }
    
    // Vertical grid lines
    const timeLabels = [];
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Time labels
      if (priceData.length > 0) {
        const index = Math.floor((1 - i / 4) * (priceData.length - 1));
        const timestamp = priceData[index].timestamp;
        const date = new Date(timestamp);
        let timeLabel = '';
        
        switch (options.timeframe) {
          case '1h':
            timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            break;
          case '1d':
            timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            break;
          case '1w':
            timeLabel = `${date.getMonth() + 1}/${date.getDate()}`;
            break;
          case '1m':
            timeLabel = `${date.getMonth() + 1}/${date.getDate()}`;
            break;
        }
        
        timeLabels.push({ x, label: timeLabel });
      }
    }
    
    // Draw time labels after grid lines
    timeLabels.forEach(({ x, label }) => {
      ctx.fillStyle = '#8a8a9a';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, height - 5);
    });
    
    // Draw price line
    if (options.chartType === 'line') {
      ctx.strokeStyle = priceChange >= 0 ? '#4caf50' : '#f44336';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      priceData.forEach((d, i) => {
        const x = width - (i / (priceData.length - 1)) * width;
        const y = height - ((d.price - minPrice) / priceRange) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Add gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, priceChange >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.lineTo(0, height);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    } else if (options.chartType === 'candle') {
      // Draw candles
      const candleWidth = width / priceData.length * 0.8;
      
      priceData.forEach((d, i) => {
        const x = width - (i / (priceData.length - 1)) * width;
        const y = height - ((d.price - minPrice) / priceRange) * height;
        
        // Simulate OHLC data
        const open = d.price * (1 + (Math.random() - 0.5) * 0.01);
        const high = Math.max(open, d.price) * (1 + Math.random() * 0.005);
        const low = Math.min(open, d.price) * (1 - Math.random() * 0.005);
        const close = d.price;
        
        const isGreen = close >= open;
        
        // Draw candle body
        ctx.fillStyle = isGreen ? '#4caf50' : '#f44336';
        const candleY = height - ((Math.max(open, close) - minPrice) / priceRange) * height;
        const candleHeight = Math.abs(((open - close) / priceRange) * height);
        ctx.fillRect(x - candleWidth / 2, candleY, candleWidth, Math.max(1, candleHeight));
        
        // Draw wicks
        ctx.strokeStyle = isGreen ? '#4caf50' : '#f44336';
        ctx.lineWidth = 1;
        
        // Top wick
        ctx.beginPath();
        ctx.moveTo(x, height - ((high - minPrice) / priceRange) * height);
        ctx.lineTo(x, candleY);
        ctx.stroke();
        
        // Bottom wick
        ctx.beginPath();
        ctx.moveTo(x, height - ((low - minPrice) / priceRange) * height);
        ctx.lineTo(x, candleY + candleHeight);
        ctx.stroke();
      });
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: '1h' | '1d' | '1w' | '1m') => {
    setOptions(prev => ({ ...prev, timeframe }));
  };

  // Handle chart type change
  const handleChartTypeChange = (chartType: 'line' | 'candle') => {
    setOptions(prev => ({ ...prev, chartType }));
  };

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
          <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
            <button
              onClick={() => handleTimeframeChange('1h')}
              className={`px-2 py-1 text-xs ${options.timeframe === '1h' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              1H
            </button>
            <button
              onClick={() => handleTimeframeChange('1d')}
              className={`px-2 py-1 text-xs ${options.timeframe === '1d' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              1D
            </button>
            <button
              onClick={() => handleTimeframeChange('1w')}
              className={`px-2 py-1 text-xs ${options.timeframe === '1w' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              1W
            </button>
            <button
              onClick={() => handleTimeframeChange('1m')}
              className={`px-2 py-1 text-xs ${options.timeframe === '1m' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              1M
            </button>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
            <button
              onClick={() => handleChartTypeChange('line')}
              className={`px-2 py-1 text-xs ${options.chartType === 'line' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Line
            </button>
            <button
              onClick={() => handleChartTypeChange('candle')}
              className={`px-2 py-1 text-xs ${options.chartType === 'candle' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
            >
              Candle
            </button>
          </div>
          <button
            onClick={apiClient ? fetchPriceData : generateMockData}
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
          <div className="relative h-64">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full"
              width={800}
              height={400}
            />
            {priceData.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ChartBarIcon className="w-16 h-16 text-twilight-neon-blue mb-4" />
                <p className="text-gray-400">
                  No price data available for {pair}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChart;