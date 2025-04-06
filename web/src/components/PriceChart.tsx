import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceData {
  timestamp: number;
  price: number;
  volume?: number;
}

interface PriceChartProps {
  baseAsset: string;
  quoteAsset: string;
  data?: PriceData[];
  timeframe?: '1h' | '24h' | '7d' | '30d' | '1y';
  height?: number;
  width?: string;
  loading?: boolean;
  error?: string | null;
  onTimeframeChange?: (timeframe: '1h' | '24h' | '7d' | '30d' | '1y') => void;
}

const PriceChart: React.FC<PriceChartProps> = ({
  baseAsset,
  quoteAsset,
  data = [],
  timeframe = '24h',
  height = 300,
  width = '100%',
  loading = false,
  error = null,
  onTimeframeChange,
}) => {
  const { theme, isDark } = useTheme();
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Set current price from the last data point
  useEffect(() => {
    if (data && data.length > 0) {
      setCurrentPrice(data[data.length - 1].price);
    }
  }, [data]);

  // Format timestamps based on timeframe
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    
    switch (timeframe) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '30d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '1y':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString();
    }
  };

  // Calculate price change percentage
  const calculatePriceChange = (): { change: number; percentage: number } => {
    if (data.length < 2) return { change: 0, percentage: 0 };
    
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;
    
    return { change, percentage };
  };

  const priceChange = calculatePriceChange();
  const isPriceUp = priceChange.change >= 0;

  // Chart data
  const chartData = {
    labels: data.map(item => formatTimestamp(item.timestamp)),
    datasets: [
      {
        label: `${baseAsset}/${quoteAsset}`,
        data: data.map(item => item.price),
        borderColor: isPriceUp ? theme.success : theme.error,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, `${isPriceUp ? theme.success : theme.error}20`);
          gradient.addColorStop(1, `${isPriceUp ? theme.success : theme.error}01`);
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: isPriceUp ? theme.success : theme.error,
        pointHoverBorderColor: theme.background,
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const price = context.parsed.y;
            setHoveredPrice(price);
            return `Price: ${price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${quoteAsset}`;
          },
        },
        backgroundColor: isDark ? '#2A2D3E' : '#FFFFFF',
        titleColor: isDark ? '#FFFFFF' : '#000000',
        bodyColor: isDark ? '#FFFFFF' : '#000000',
        borderColor: theme.border,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.text,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: `${theme.border}40`,
        },
        ticks: {
          color: theme.text,
          callback: (value) => {
            return `${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
        position: 'right',
      },
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
  };

  // Handle timeframe button click
  const handleTimeframeClick = (newTimeframe: '1h' | '24h' | '7d' | '30d' | '1y') => {
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: theme.card,
        width,
        height: 'auto',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            {baseAsset}/{quoteAsset}
          </h2>
          <div className="flex items-center">
            <span
              className="text-lg font-bold mr-2"
              style={{ color: theme.text }}
            >
              {currentPrice?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              className="text-sm"
              style={{
                color: isPriceUp ? theme.success : theme.error,
              }}
            >
              {isPriceUp ? '+' : ''}
              {priceChange.change.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ({isPriceUp ? '+' : ''}
              {priceChange.percentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Timeframe selector */}
        <div className="flex mb-4 space-x-2">
          {(['1h', '24h', '7d', '30d', '1y'] as const).map((tf) => (
            <button
              key={tf}
              className="px-3 py-1 text-xs rounded"
              style={{
                backgroundColor:
                  timeframe === tf ? theme.primary : theme.background,
                color: timeframe === tf ? '#FFFFFF' : theme.text,
              }}
              onClick={() => handleTimeframeClick(tf)}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ height: `${height}px`, position: 'relative' }}>
          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{ height: `${height}px` }}
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.primary }}></div>
            </div>
          ) : error ? (
            <div
              className="flex items-center justify-center"
              style={{ height: `${height}px` }}
            >
              <p style={{ color: theme.error }}>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div
              className="flex items-center justify-center"
              style={{ height: `${height}px` }}
            >
              <p style={{ color: theme.text }}>No data available</p>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceChart;