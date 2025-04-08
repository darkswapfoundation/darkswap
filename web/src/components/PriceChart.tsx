import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Candlestick } from '../types';
import Chart from 'chart.js/auto';
import '../styles/PriceChart.css';

interface PriceChartProps {
  baseAsset: string;
  quoteAsset: string;
  height?: number;
  width?: string | number;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({
  baseAsset,
  quoteAsset,
  height = 400,
  width = '100%',
  timeframe = '1h',
  onTimeframeChange,
}) => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { connected, on, send } = useWebSocket();
  
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  
  // Format price with appropriate decimal places
  const formatPrice = useCallback((price: number): string => {
    if (price < 0.01) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price < 1000) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  }, []);
  
  // Calculate moving average
  const calculateMovingAverage = useCallback((prices: number[], period: number): (number | null)[] => {
    const result: (number | null)[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += prices[i - j];
        }
        result.push(sum / period);
      }
    }
    
    return result;
  }, []);
  
  // Fetch candlesticks
  const fetchCandlesticks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.getCandlesticks(baseAsset, quoteAsset, selectedTimeframe);
      setCandlesticks(data);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch candlesticks:', error);
      setError('Failed to fetch candlesticks. Please try again later.');
      setIsLoading(false);
    }
  }, [api, baseAsset, quoteAsset, selectedTimeframe]);
  
  // Handle candlestick update
  const handleCandlestickUpdate = useCallback((data: any) => {
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset && data.timeframe === selectedTimeframe) {
      setCandlesticks(prevCandlesticks => {
        // Find the candlestick with the same openTime
        const index = prevCandlesticks.findIndex(c => c.openTime === data.candlestick.openTime);
        
        if (index !== -1) {
          // Update existing candlestick
          const newCandlesticks = [...prevCandlesticks];
          newCandlesticks[index] = data.candlestick;
          return newCandlesticks;
        } else {
          // Add new candlestick
          return [...prevCandlesticks, data.candlestick];
        }
      });
    }
  }, [baseAsset, quoteAsset, selectedTimeframe]);
  
  // Initialize chart
  const initializeChart = useCallback(() => {
    if (!chartRef.current || candlesticks.length === 0) return;
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare data
    const labels = candlesticks.map(c => new Date(c.openTime));
    const prices = candlesticks.map(c => parseFloat(c.close));
    
    // Calculate moving averages
    const ma7 = calculateMovingAverage(prices, 7);
    const ma25 = calculateMovingAverage(prices, 25);
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${baseAsset}/${quoteAsset}`,
            data: prices,
            borderColor: '#3861fb',
            backgroundColor: 'rgba(56, 97, 251, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.1,
          },
          {
            label: '7-period MA',
            data: ma7,
            borderColor: '#f7931a',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
          },
          {
            label: '25-period MA',
            data: ma25,
            borderColor: '#16c784',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: selectedTimeframe.endsWith('m') ? 'minute' : 
                    selectedTimeframe.endsWith('h') ? 'hour' : 
                    selectedTimeframe.endsWith('d') ? 'day' : 'week',
            },
            grid: {
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: theme === 'dark' ? '#ccc' : '#666',
            },
          },
          y: {
            position: 'right',
            grid: {
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              color: theme === 'dark' ? '#ccc' : '#666',
              callback: function(value) {
                return formatPrice(value as number);
              }
            },
          },
        },
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += formatPrice(context.parsed.y);
                }
                return label;
              },
            },
          },
          legend: {
            labels: {
              color: theme === 'dark' ? '#ccc' : '#666',
            },
          },
        },
      },
    });
  }, [candlesticks, theme, baseAsset, quoteAsset, selectedTimeframe, calculateMovingAverage, formatPrice]);
  
  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  }, [onTimeframeChange]);
  
  // Subscribe to candlestick updates
  useEffect(() => {
    // Fetch initial data
    fetchCandlesticks();
    
    // Subscribe to candlestick updates if socket is connected
    if (connected) {
      const candlestickUnsubscribe = on('candlestickUpdate', handleCandlestickUpdate);
      
      // Subscribe to candlestick updates
      send('subscribeCandlesticks', {
        baseAsset,
        quoteAsset,
        timeframe: selectedTimeframe,
      });
      
      // Clean up
      return () => {
        candlestickUnsubscribe();
        
        send('unsubscribeCandlesticks', {
          baseAsset,
          quoteAsset,
          timeframe: selectedTimeframe,
        });
      };
    }
    
    // Set up polling for updates if socket is not connected
    const intervalId = !connected ? setInterval(fetchCandlesticks, 60000) : null;
    
    // Clean up
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchCandlesticks, connected, on, send, baseAsset, quoteAsset, selectedTimeframe, handleCandlestickUpdate]);
  
  // Initialize chart when candlesticks change
  useEffect(() => {
    if (!isLoading && !error && candlesticks.length > 0) {
      initializeChart();
    }
  }, [candlesticks, isLoading, error, initializeChart]);
  
  // Update chart when theme changes
  useEffect(() => {
    if (!isLoading && !error && candlesticks.length > 0) {
      initializeChart();
    }
  }, [theme, initializeChart, isLoading, error, candlesticks]);
  
  return (
    <div 
      className={`price-chart price-chart-${theme}`}
      style={{ height: height ? `${height}px` : 'auto', width }}
    >
      <div className="price-chart-header">
        <h3>{baseAsset}/{quoteAsset}</h3>
        <div className="price-chart-timeframes">
          <button
            className={`price-chart-timeframe-button ${selectedTimeframe === '5m' ? 'active' : ''}`}
            onClick={() => handleTimeframeChange('5m')}
          >
            5m
          </button>
          <button
            className={`price-chart-timeframe-button ${selectedTimeframe === '15m' ? 'active' : ''}`}
            onClick={() => handleTimeframeChange('15m')}
          >
            15m
          </button>
          <button
            className={`price-chart-timeframe-button ${selectedTimeframe === '1h' ? 'active' : ''}`}
            onClick={() => handleTimeframeChange('1h')}
          >
            1h
          </button>
          <button
            className={`price-chart-timeframe-button ${selectedTimeframe === '4h' ? 'active' : ''}`}
            onClick={() => handleTimeframeChange('4h')}
          >
            4h
          </button>
          <button
            className={`price-chart-timeframe-button ${selectedTimeframe === '1d' ? 'active' : ''}`}
            onClick={() => handleTimeframeChange('1d')}
          >
            1d
          </button>
          <button
            className={`price-chart-timeframe-button ${selectedTimeframe === '1w' ? 'active' : ''}`}
            onClick={() => handleTimeframeChange('1w')}
          >
            1w
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="price-chart-loading">
          <div className="spinner"></div>
          <p>Loading chart...</p>
        </div>
      ) : error ? (
        <div className="price-chart-error">
          <p>{error}</p>
          <button onClick={fetchCandlesticks}>Retry</button>
        </div>
      ) : (
        <div className="price-chart-canvas-container">
          <canvas ref={chartRef}></canvas>
        </div>
      )}
    </div>
  );
};

export default PriceChart;