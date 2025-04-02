import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../contexts/ApiContext';
import { formatPrice, formatDate } from '../utils/formatters';

interface CryptoChartProps {
  assetId: string;
  assetType: 'rune' | 'alkane' | 'btc';
  timeframe?: '1h' | '1d' | '1w' | '1m' | 'all';
  height?: number;
  showControls?: boolean;
  className?: string;
}

interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

const CryptoChart: React.FC<CryptoChartProps> = ({
  assetId,
  assetType,
  timeframe = '1d',
  height = 300,
  showControls = true,
  className = '',
}) => {
  // State
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [currentTimeframe, setCurrentTimeframe] = useState<'1h' | '1d' | '1w' | '1m' | 'all'>(timeframe);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Fetch chart data
  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with mock data
      
      // Generate mock data
      const mockData: PricePoint[] = [];
      const now = Date.now();
      let interval: number;
      let count: number;
      
      // Set interval and count based on timeframe
      switch (currentTimeframe) {
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
        case 'all':
          interval = 24 * 60 * 60 * 1000; // 1 day
          count = 180;
          break;
        default:
          interval = 15 * 60 * 1000; // 15 minutes
          count = 96;
      }
      
      // Base price based on asset type
      let basePrice: number;
      switch (assetType) {
        case 'btc':
          basePrice = 20000 + Math.random() * 5000;
          break;
        case 'rune':
          basePrice = 10 + Math.random() * 90;
          break;
        case 'alkane':
          basePrice = 5 + Math.random() * 45;
          break;
        default:
          basePrice = 10;
      }
      
      // Volatility based on asset type
      let volatility: number;
      switch (assetType) {
        case 'btc':
          volatility = 0.01; // 1%
          break;
        case 'rune':
          volatility = 0.03; // 3%
          break;
        case 'alkane':
          volatility = 0.05; // 5%
          break;
        default:
          volatility = 0.02;
      }
      
      // Generate data points
      for (let i = 0; i < count; i++) {
        const timestamp = now - (count - i) * interval;
        
        // Random walk price
        const randomChange = (Math.random() - 0.5) * 2 * volatility * basePrice;
        const price = i === 0 
          ? basePrice 
          : mockData[i - 1].price + randomChange;
        
        // Random volume
        const volume = Math.random() * basePrice * 10;
        
        mockData.push({
          timestamp,
          price,
          volume,
        });
      }
      
      // Calculate price change
      const firstPrice = mockData[0].price;
      const lastPrice = mockData[mockData.length - 1].price;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      setChartData(mockData);
      setPriceChange(change);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch chart data on mount and when timeframe changes
  useEffect(() => {
    fetchChartData();
  }, [assetId, assetType, currentTimeframe]);
  
  // Draw chart when data changes
  useEffect(() => {
    if (chartData.length > 0) {
      drawChart();
    }
  }, [chartData, chartType, height]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartData.length > 0) {
        drawChart();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartData]);
  
  // Draw chart
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const container = canvas.parentElement;
    if (!container) return;
    
    const width = container.clientWidth;
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate min and max price
    const prices = chartData.map(d => d.price);
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
      ctx.fillText(formatPrice(price.toString()), 5, y - 5);
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
      if (chartData.length > 0) {
        const index = Math.floor((i / 4) * (chartData.length - 1));
        const timestamp = chartData[index].timestamp;
        const date = new Date(timestamp);
        let timeLabel = '';
        
        switch (currentTimeframe) {
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
          case 'all':
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
    if (chartType === 'line') {
      ctx.strokeStyle = priceChange >= 0 ? '#4caf50' : '#f44336';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      chartData.forEach((d, i) => {
        const x = (i / (chartData.length - 1)) * width;
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
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    } else if (chartType === 'candle') {
      // Draw candles
      const candleWidth = width / chartData.length * 0.8;
      
      chartData.forEach((d, i) => {
        const x = (i / (chartData.length - 1)) * width;
        
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
  
  // Render loading state
  if (isLoading && chartData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">{assetType.toUpperCase()} Chart</h2>
        </div>
        <div className="card-body flex items-center justify-center" style={{ height }}>
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && chartData.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h2 className="text-lg font-display font-medium">{assetType.toUpperCase()} Chart</h2>
        </div>
        <div className="card-body flex items-center justify-center" style={{ height }}>
          <div className="flex flex-col items-center text-ui-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4">{error}</p>
            <button 
              className="mt-4 btn btn-primary"
              onClick={fetchChartData}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Get current price
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  
  return (
    <div className={`card ${className}`}>
      <div className="card-header flex justify-between items-center">
        <div>
          <h2 className="text-lg font-display font-medium">
            {assetType === 'btc' ? 'Bitcoin' : assetType === 'rune' ? 'Rune' : 'Alkane'} Chart
          </h2>
          <div className="flex items-center mt-1">
            <span className="text-xl font-medium">${formatPrice(currentPrice.toString())}</span>
            <span className={`ml-2 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            {/* Timeframe selector */}
            <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
              <button
                onClick={() => setCurrentTimeframe('1h')}
                className={`px-2 py-1 text-xs ${currentTimeframe === '1h' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                1H
              </button>
              <button
                onClick={() => setCurrentTimeframe('1d')}
                className={`px-2 py-1 text-xs ${currentTimeframe === '1d' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                1D
              </button>
              <button
                onClick={() => setCurrentTimeframe('1w')}
                className={`px-2 py-1 text-xs ${currentTimeframe === '1w' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                1W
              </button>
              <button
                onClick={() => setCurrentTimeframe('1m')}
                className={`px-2 py-1 text-xs ${currentTimeframe === '1m' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                1M
              </button>
              <button
                onClick={() => setCurrentTimeframe('all')}
                className={`px-2 py-1 text-xs ${currentTimeframe === 'all' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                ALL
              </button>
            </div>
            
            {/* Chart type selector */}
            <div className="flex rounded-lg overflow-hidden border border-twilight-dark">
              <button
                onClick={() => setChartType('line')}
                className={`px-2 py-1 text-xs ${chartType === 'line' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('candle')}
                className={`px-2 py-1 text-xs ${chartType === 'candle' ? 'bg-twilight-primary text-white' : 'bg-twilight-darker text-gray-400'}`}
              >
                Candle
              </button>
            </div>
            
            {/* Refresh button */}
            <button 
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
              onClick={fetchChartData}
              title="Refresh chart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <div className="card-body p-0">
        <div className="relative w-full" style={{ height }}>
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
          />
          {chartData.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="mt-2 text-gray-400">No chart data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoChart;