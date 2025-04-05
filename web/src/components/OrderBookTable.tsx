import React, { useMemo } from 'react';
import { useRenderPerformance } from '../utils/memoization';
import { withAccessibilityCheck } from '../utils/accessibilityChecker';

interface Order {
  id: string;
  type: 'buy' | 'sell';
  sellAsset: string;
  sellAmount: string | number;
  buyAsset: string;
  buyAmount: string | number;
  price: string | number;
  timestamp: number;
  maker: string;
}

interface OrderBookTableProps {
  orders: Order[];
  sellAsset: string;
  buyAsset: string;
  className?: string;
}

/**
 * Order book table component with performance optimizations
 */
const OrderBookTable: React.FC<OrderBookTableProps> = ({
  orders,
  sellAsset,
  buyAsset,
  className
}) => {
  // Track component render performance
  useRenderPerformance('OrderBookTable');
  
  // Sort orders by price (buys first, then sells)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      // Sort by type first (buys first)
      if (a.type !== b.type) {
        return a.type === 'buy' ? -1 : 1;
      }
      
      // Then sort by price
      const priceA = parseFloat(a.price as string);
      const priceB = parseFloat(b.price as string);
      
      // For buy orders, higher price first
      if (a.type === 'buy') {
        return priceB - priceA;
      }
      
      // For sell orders, lower price first
      return priceA - priceB;
    });
  }, [orders]);
  
  // Group orders by price level
  const groupedOrders = useMemo(() => {
    const grouped: Record<string, {
      price: number;
      type: 'buy' | 'sell';
      totalSellAmount: number;
      totalBuyAmount: number;
      count: number;
      orders: Order[];
    }> = {};
    
    sortedOrders.forEach(order => {
      const price = parseFloat(order.price as string).toFixed(8);
      const sellAmount = parseFloat(order.sellAmount as string);
      const buyAmount = parseFloat(order.buyAmount as string);
      
      if (!grouped[price]) {
        grouped[price] = {
          price: parseFloat(price),
          type: order.type,
          totalSellAmount: 0,
          totalBuyAmount: 0,
          count: 0,
          orders: []
        };
      }
      
      grouped[price].totalSellAmount += sellAmount;
      grouped[price].totalBuyAmount += buyAmount;
      grouped[price].count += 1;
      grouped[price].orders.push(order);
    });
    
    return Object.values(grouped).sort((a, b) => {
      // Sort by type first (buys first)
      if (a.type !== b.type) {
        return a.type === 'buy' ? -1 : 1;
      }
      
      // Then sort by price
      // For buy orders, higher price first
      if (a.type === 'buy') {
        return b.price - a.price;
      }
      
      // For sell orders, lower price first
      return a.price - b.price;
    });
  }, [sortedOrders]);
  
  // Calculate max volume for depth visualization
  const maxVolume = useMemo(() => {
    if (groupedOrders.length === 0) return 0;
    
    return Math.max(
      ...groupedOrders.map(group => group.totalSellAmount)
    );
  }, [groupedOrders]);
  
  // Format number with thousands separators
  const formatNumber = (num: number, decimals = 8) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Render table rows
  const renderRows = () => {
    return groupedOrders.map(group => {
      const volumePercentage = (group.totalSellAmount / maxVolume) * 100;
      const isBuy = group.type === 'buy';
      
      return (
        <tr 
          key={`${group.type}-${group.price}`}
          className={`order-row ${isBy ? 'buy-order' : 'sell-order'}`}
        >
          <td className="order-count">{group.count}</td>
          <td className="order-price">
            <span className={isBy ? 'buy-price' : 'sell-price'}>
              {formatNumber(group.price)}
            </span>
          </td>
          <td className="order-amount">
            {formatNumber(group.totalSellAmount)}
          </td>
          <td className="order-total">
            {formatNumber(group.totalBuyAmount)}
          </td>
          <td className="order-depth">
            <div 
              className={`depth-bar ${isBy ? 'buy-depth' : 'sell-depth'}`}
              style={{ width: `${volumePercentage}%` }}
              aria-hidden="true"
            ></div>
          </td>
        </tr>
      );
    });
  };
  
  // If no orders, show empty state
  if (orders.length === 0) {
    return (
      <div className={`order-book-empty ${className || ''}`}>
        <p>No orders available for {sellAsset}/{buyAsset}</p>
      </div>
    );
  }
  
  return (
    <div className={`order-book-table-container ${className || ''}`}>
      <table className="order-book-table" aria-label={`Order book for ${sellAsset}/${buyAsset}`}>
        <thead>
          <tr>
            <th scope="col">Count</th>
            <th scope="col">Price ({buyAsset})</th>
            <th scope="col">Amount ({sellAsset})</th>
            <th scope="col">Total ({buyAsset})</th>
            <th scope="col">Depth</th>
          </tr>
        </thead>
        <tbody>
          {renderRows()}
        </tbody>
      </table>
    </div>
  );
};

// Export with accessibility check and memoization
export default withAccessibilityCheck(
  React.memo(OrderBookTable),
  'OrderBookTable'
);