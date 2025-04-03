import React, { useState, useEffect } from 'react';

interface PriceChartProps {
  assetType: 'bitcoin' | 'rune' | 'alkane';
  assetId?: string;
  timeframe?: '1h' | '1d' | '1w' | '1m' | '1y';
  className?: string;
}

interface PricePoint {
  timestamp: number;
  price: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  assetType,
  assetId = '',
  timeframe = '1d',
  className,
}) => {
  // Price data (mock data)
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Selected timeframe
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '1d' | '1w' | '1m' | '1y'>(timeframe);
  
  // Fetch price data
  useEffect(() => {
    // In a real implementation, we would fetch this from an API
    const fetchPriceData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock data
        const now = Date.now();
        const data: PricePoint[] = [];
        
        // Different data points based on timeframe
        let dataPoints = 24;
        let interval = 3600000; // 1 hour in milliseconds
        
        switch (selectedTimeframe) {
          case '1h':
            dataPoints = 60;
            interval = 60000; // 1 minute
            break;
          case '1d':
            dataPoints = 24;
            interval = 3600000; // 1 hour
            break;
          case '1w':
            dataPoints = 7;
            interval = 86400000; // 1 day
            break;
          case '1m':
            dataPoints = 30;
            interval = 86400000; // 1 day
            break;
          case '1y':
            dataPoints = 12;
            interval = 2592000000; // 1 month
            break;
        }
        
        // Base price based on asset type
        let basePrice = 0;
        let volatility = 0;
        
        switch (assetType) {
          case 'bitcoin':
            basePrice = 65000;
            volatility = 0.02; // 2%
            break;
          case 'rune':
            basePrice = 0.0001;
            volatility = 0.05; // 5%
            break;
          case 'alkane':
            basePrice = 0.0002;
            volatility = 0.04; // 4%
            break;
        }
        
        // Generate price points
        for (let i = 0; i < dataPoints; i++) {
          const timestamp = now - (dataPoints - i) * interval;
          const randomChange = (Math.random() - 0.5) * 2 * volatility;
          const price = basePrice * (1 + randomChange);
          
          data.push({
            timestamp,
            price,
          });
          
          // Update base price for next point
          basePrice = price;
        }
        
        setPriceData(data);
      } catch (err) {
        console.error('Failed to fetch price data:', err);
        setError('Failed to fetch price data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceData();
  }, [assetType, assetId, selectedTimeframe]);
  
  // Calculate chart dimensions
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = 40;
  
  // Calculate min and max values
  const minPrice = Math.min(...priceData.map(point => point.price));
  const maxPrice = Math.max(...priceData.map(point => point.price));
  
  // Calculate price range with 10% padding
  const priceRange = maxPrice - minPrice;
  const paddedMinPrice = minPrice - priceRange * 0.1;
  const paddedMaxPrice = maxPrice + priceRange * 0.1;
  
  // Calculate scale factors
  const xScale = (chartWidth - padding * 2) / (priceData.length - 1);
  const yScale = (chartHeight - padding * 2) / (paddedMaxPrice - paddedMinPrice);
  
  // Generate SVG path
  const generatePath = (): string => {
    if (priceData.length === 0) {
      return '';
    }
    
    return priceData.reduce((path, point, index) => {
      const x = padding + index * xScale;
      const y = chartHeight - padding - (point.price - paddedMinPrice) * yScale;
      
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      
      return `${path} L ${x} ${y}`;
    }, '');
  };
  
  // Generate area path (for fill)
  const generateAreaPath = (): string => {
    if (priceData.length === 0) {
      return '';
    }
    
    const path = generatePath();
    const lastX = padding + (priceData.length - 1) * xScale;
    const baseline = chartHeight - padding;
    
    return `${path} L ${lastX} ${baseline} L ${padding} ${baseline} Z`;
  };
  
  // Format price
  const formatPrice = (price: number): string => {
    switch (assetType) {
      case 'bitcoin':
        return `$${price.toLocaleString()}`;
      case 'rune':
      case 'alkane':
        return `${price.toFixed(8)} BTC`;
    }
  };
  
  // Format asset name
  const formatAssetName = (): string => {
    switch (assetType) {
      case 'bitcoin':
        return 'Bitcoin (BTC)';
      case 'rune':
        return `Rune (${assetId})`;
      case 'alkane':
        return `Alkane (${assetId})`;
    }
  };
  
  // Get current price
  const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 0;
  
  // Calculate price change
  const previousPrice = priceData.length > 0 ? priceData[0].price : 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0;
  
  return (
    <div className={`price-chart ${className || ''}`}>
      <div className="price-chart-header">
        <h2>{formatAssetName()}</h2>
        <div className="price-info">
          <div className="current-price">{formatPrice(currentPrice)}</div>
          <div className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="timeframe-selector">
        <button
          className={selectedTimeframe === '1h' ? 'active' : ''}
          onClick={() => setSelectedTimeframe('1h')}
        >
          1H
        </button>
        <button
          className={selectedTimeframe === '1d' ? 'active' : ''}
          onClick={() => setSelectedTimeframe('1d')}
        >
          1D
        </button>
        <button
          className={selectedTimeframe === '1w' ? 'active' : ''}
          onClick={() => setSelectedTimeframe('1w')}
        >
          1W
        </button>
        <button
          className={selectedTimeframe === '1m' ? 'active' : ''}
          onClick={() => setSelectedTimeframe('1m')}
        >
          1M
        </button>
        <button
          className={selectedTimeframe === '1y' ? 'active' : ''}
          onClick={() => setSelectedTimeframe('1y')}
        >
          1Y
        </button>
      </div>
      
      <div className="chart-container">
        {isLoading ? (
          <div className="loading">Loading chart data...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <svg width={chartWidth} height={chartHeight}>
            {/* X and Y axes */}
            <line
              x1={padding}
              y1={chartHeight - padding}
              x2={chartWidth - padding}
              y2={chartHeight - padding}
              stroke="#ddd"
              strokeWidth="1"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={chartHeight - padding}
              stroke="#ddd"
              strokeWidth="1"
            />
            
            {/* Price line */}
            <path
              d={generatePath()}
              fill="none"
              stroke={priceChange >= 0 ? '#28a745' : '#dc3545'}
              strokeWidth="2"
            />
            
            {/* Area fill */}
            <path
              d={generateAreaPath()}
              fill={priceChange >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'}
            />
            
            {/* Price labels */}
            <text x={padding - 5} y={padding} textAnchor="end" fontSize="12" fill="#666">
              {formatPrice(paddedMaxPrice)}
            </text>
            <text x={padding - 5} y={chartHeight - padding} textAnchor="end" fontSize="12" fill="#666">
              {formatPrice(paddedMinPrice)}
            </text>
            
            {/* Time labels */}
            <text x={padding} y={chartHeight - padding + 20} textAnchor="middle" fontSize="12" fill="#666">
              {new Date(priceData[0]?.timestamp || Date.now()).toLocaleTimeString()}
            </text>
            <text x={chartWidth - padding} y={chartHeight - padding + 20} textAnchor="middle" fontSize="12" fill="#666">
              {new Date(priceData[priceData.length - 1]?.timestamp || Date.now()).toLocaleTimeString()}
            </text>
          </svg>
        )}
      </div>
      
      <style>
        {`
          .price-chart {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            margin-bottom: 30px;
          }
          
          .price-chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .price-chart-header h2 {
            margin: 0;
            color: #333;
            font-size: 1.5rem;
          }
          
          .price-info {
            text-align: right;
          }
          
          .current-price {
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
          }
          
          .price-change {
            font-size: 1rem;
            font-weight: 500;
          }
          
          .price-change.positive {
            color: #28a745;
          }
          
          .price-change.negative {
            color: #dc3545;
          }
          
          .timeframe-selector {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }
          
          .timeframe-selector button {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 5px 15px;
            margin: 0 5px;
            cursor: pointer;
            font-size: 0.9rem;
            border-radius: 4px;
            transition: all 0.2s;
          }
          
          .timeframe-selector button:hover {
            background-color: #e9ecef;
          }
          
          .timeframe-selector button.active {
            background-color: #007bff;
            color: #fff;
            border-color: #007bff;
          }
          
          .chart-container {
            position: relative;
            height: ${chartHeight}px;
          }
          
          .loading, .error {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.8);
          }
          
          .loading {
            color: #6c757d;
          }
          
          .error {
            color: #dc3545;
          }
        `}
      </style>
    </div>
  );
};