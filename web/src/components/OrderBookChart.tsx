import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { useRenderPerformance } from '../utils/memoization';
import { withAccessibilityCheck } from '../utils/accessibilityChecker';
import { Order, OrderGroup } from '../utils/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface OrderBookChartProps {
  orders: Order[];
  sellAsset: string;
  buyAsset: string;
  className?: string;
}

/**
 * Order book chart component with performance optimizations
 */
const OrderBookChart: React.FC<OrderBookChartProps> = ({
  orders,
  sellAsset,
  buyAsset,
  className
}) => {
  // Track component render performance
  useRenderPerformance('OrderBookChart');
  
  // Group and process orders for the chart
  const { buyOrders, sellOrders, maxVolume } = useMemo(() => {
    // Group orders by price level
    const groupedOrders: Record<string, OrderGroup> = {};
    
    orders.forEach(order => {
      const price = parseFloat(order.price as string).toFixed(8);
      const sellAmount = parseFloat(order.sellAmount as string);
      const buyAmount = parseFloat(order.buyAmount as string);
      
      if (!groupedOrders[price]) {
        groupedOrders[price] = {
          price: parseFloat(price),
          type: order.type,
          totalSellAmount: 0,
          totalBuyAmount: 0,
          count: 0,
          orders: []
        };
      }
      
      groupedOrders[price].totalSellAmount += sellAmount;
      groupedOrders[price].totalBuyAmount += buyAmount;
      groupedOrders[price].count += 1;
      groupedOrders[price].orders.push(order);
    });
    
    // Convert to array and sort
    const ordersArray = Object.values(groupedOrders);
    
    // Separate buy and sell orders
    const buyOrders = ordersArray
      .filter(group => group.type === 'buy')
      .sort((a, b) => a.price - b.price);
    
    const sellOrders = ordersArray
      .filter(group => group.type === 'sell')
      .sort((a, b) => a.price - b.price);
    
    // Calculate max volume for scaling
    const maxVolume = Math.max(
      ...ordersArray.map(group => group.totalSellAmount),
      1 // Ensure non-zero value
    );
    
    return { buyOrders, sellOrders, maxVolume };
  }, [orders]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    // Create cumulative volume arrays
    let buyVolume = 0;
    const buyVolumes = buyOrders.map(order => {
      buyVolume += order.totalSellAmount;
      return buyVolume;
    });
    
    let sellVolume = 0;
    const sellVolumes = sellOrders.map(order => {
      sellVolume += order.totalSellAmount;
      return sellVolume;
    });
    
    // Create price arrays
    const buyPrices = buyOrders.map(order => order.price);
    const sellPrices = sellOrders.map(order => order.price);
    
    return {
      labels: [...buyPrices.reverse(), ...sellPrices],
      datasets: [
        {
          label: 'Buy Orders',
          data: buyVolumes.reverse(),
          borderColor: 'rgba(46, 204, 113, 1)',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          pointBackgroundColor: 'rgba(46, 204, 113, 1)',
          pointBorderColor: '#fff',
          pointRadius: 2,
          fill: true,
          tension: 0.1,
          borderWidth: 2,
        },
        {
          label: 'Sell Orders',
          data: [...Array(buyPrices.length).fill(null), ...sellVolumes],
          borderColor: 'rgba(231, 76, 60, 1)',
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          pointBackgroundColor: 'rgba(231, 76, 60, 1)',
          pointBorderColor: '#fff',
          pointRadius: 2,
          fill: true,
          tension: 0.1,
          borderWidth: 2,
        }
      ]
    };
  }, [buyOrders, sellOrders]);
  
  // Chart options
  const chartOptions = useMemo<ChartOptions<'line'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toFixed(8)} ${sellAsset}`;
            },
            title: (tooltipItems) => {
              return `Price: ${tooltipItems[0].label} ${buyAsset}`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${sellAsset}/${buyAsset} Order Book Depth`,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: `Price (${buyAsset})`,
          },
          ticks: {
            callback: function(value, index, values) {
              // Show fewer ticks for readability
              const allLabels = chartData.labels;
              if (allLabels && index % Math.ceil(allLabels.length / 10) === 0) {
                return allLabels[index];
              }
              return '';
            }
          }
        },
        y: {
          title: {
            display: true,
            text: `Volume (${sellAsset})`,
          },
          beginAtZero: true,
        }
      },
      // Add ARIA accessibility
      plugins: {
        ...chartOptions?.plugins,
        accessibility: {
          enabled: true,
          description: `Order book depth chart for ${sellAsset}/${buyAsset} showing buy and sell orders`
        }
      }
    };
  }, [sellAsset, buyAsset, chartData.labels]);
  
  // If no orders, show empty state
  if (orders.length === 0) {
    return (
      <div className={`order-book-chart-empty ${className || ''}`}>
        <p>No orders available for {sellAsset}/{buyAsset}</p>
      </div>
    );
  }
  
  return (
    <div 
      className={`order-book-chart-container ${className || ''}`}
      style={{ height: '400px', width: '100%' }}
      aria-label={`Order book depth chart for ${sellAsset}/${buyAsset}`}
    >
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

// Export with accessibility check and memoization
export default withAccessibilityCheck(
  React.memo(OrderBookChart),
  'OrderBookChart'
);