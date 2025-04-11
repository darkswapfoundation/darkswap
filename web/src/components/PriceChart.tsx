import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts';

// Price chart props
interface PriceChartProps {
  baseAsset: string;
  quoteAsset: string;
  className?: string;
  width?: number;
  height?: number;
  interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
  showVolume?: boolean;
}

/**
 * Price chart component
 * @param props Component props
 * @returns Price chart component
 */
const PriceChart: React.FC<PriceChartProps> = ({
  baseAsset,
  quoteAsset,
  className,
  width = 800,
  height = 400,
  interval = '1h',
  showVolume = true,
}) => {
  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<'Histogram'> | null>(null);
  const [data, setData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<LineData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch price history
  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch price history from API
        const response = await fetch(`/api/market/history?pair=${baseAsset}/${quoteAsset}&interval=${interval}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price history: ${response.statusText}`);
        }
        
        const priceHistory = await response.json();
        
        // Convert price history to candlestick data
        const candlestickData: CandlestickData[] = priceHistory.map((item: any) => ({
          time: item.timestamp / 1000 as Time,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
        }));
        
        // Convert price history to volume data
        const volumeData: LineData[] = priceHistory.map((item: any) => ({
          time: item.timestamp / 1000 as Time,
          value: parseFloat(item.volume),
          color: parseFloat(item.close) >= parseFloat(item.open) ? 'rgba(0, 150, 136, 0.5)' : 'rgba(255, 82, 82, 0.5)',
        }));
        
        setData(candlestickData);
        setVolumeData(volumeData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching price history:', error);
        setError('Failed to fetch price history');
        setLoading(false);
      }
    };
    
    fetchPriceHistory();
  }, [baseAsset, quoteAsset, interval]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }
    
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
      },
      grid: {
        vertLines: {
          color: '#f0f0f0',
        },
        horzLines: {
          color: '#f0f0f0',
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#009688',
      downColor: '#ff5252',
      borderUpColor: '#009688',
      borderDownColor: '#ff5252',
      wickUpColor: '#009688',
      wickDownColor: '#ff5252',
    });
    
    // Create volume series
    let volumeSeries = null;
    if (showVolume) {
      volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }
    
    setChartApi(chart);
    setCandlestickSeries(candlestickSeries);
    setVolumeSeries(volumeSeries);
    
    // Clean up
    return () => {
      chart.remove();
    };
  }, [width, height, showVolume]);
  
  // Update chart data
  useEffect(() => {
    if (candlestickSeries && data.length > 0) {
      candlestickSeries.setData(data);
    }
    
    if (volumeSeries && volumeData.length > 0) {
      volumeSeries.setData(volumeData);
    }
    
    if (chartApi && data.length > 0) {
      chartApi.timeScale().fitContent();
    }
  }, [chartApi, candlestickSeries, volumeSeries, data, volumeData]);
  
  // Handle resize
  useEffect(() => {
    if (chartApi) {
      chartApi.resize(width, height);
    }
  }, [chartApi, width, height]);
  
  return (
    <div className={`price-chart ${className || ''}`}>
      <div className="price-chart-header">
        <h3>Price Chart</h3>
        <div className="price-chart-pair">{baseAsset}/{quoteAsset}</div>
        <div className="price-chart-interval">{interval}</div>
      </div>
      
      <div className="price-chart-content">
        {loading && <div className="price-chart-loading">Loading...</div>}
        {error && <div className="price-chart-error">{error}</div>}
        <div ref={chartContainerRef} className="price-chart-container" />
      </div>
    </div>
  );
};

export default PriceChart;