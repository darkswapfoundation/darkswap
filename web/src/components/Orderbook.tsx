import React, { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Order {
  id: string;
  price: number;
  amount: number;
  total: number;
  type: 'buy' | 'sell';
}

interface OrderbookProps {
  buyOrders: Order[];
  sellOrders: Order[];
  maxOrders?: number;
  onOrderClick?: (order: Order) => void;
}

const Orderbook: React.FC<OrderbookProps> = ({
  buyOrders,
  sellOrders,
  maxOrders = 10,
  onOrderClick,
}) => {
  const { theme, isDark } = useTheme();

  // Calculate spread
  const spread = useMemo(() => {
    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const highestBuy = Math.max(...buyOrders.map(order => order.price));
      const lowestSell = Math.min(...sellOrders.map(order => order.price));
      return lowestSell - highestBuy;
    }
    return 0;
  }, [buyOrders, sellOrders]);

  // Calculate spread percentage
  const spreadPercentage = useMemo(() => {
    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const highestBuy = Math.max(...buyOrders.map(order => order.price));
      return (spread / highestBuy) * 100;
    }
    return 0;
  }, [buyOrders, sellOrders, spread]);

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: theme.card }}>
      <div className="p-4 border-b" style={{ borderColor: theme.border }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
          Order Book
        </h2>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="grid grid-cols-3 mb-2">
          <div className="text-sm font-medium" style={{ color: theme.secondary }}>
            Price (USD)
          </div>
          <div className="text-sm font-medium text-right" style={{ color: theme.secondary }}>
            Amount (BTC)
          </div>
          <div className="text-sm font-medium text-right" style={{ color: theme.secondary }}>
            Total (USD)
          </div>
        </div>

        {/* Sell Orders (reversed to show highest price at top) */}
        <div className="mb-4">
          {sellOrders
            .sort((a, b) => b.price - a.price)
            .slice(0, maxOrders)
            .map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-3 py-1 cursor-pointer hover:opacity-80"
                onClick={() => onOrderClick && onOrderClick(order)}
              >
                <div className="text-sm font-medium" style={{ color: theme.error }}>
                  {order.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-right" style={{ color: theme.text }}>
                  {order.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  })}
                </div>
                <div className="text-sm text-right" style={{ color: theme.text }}>
                  {order.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Spread */}
        <div
          className="py-2 px-4 mb-4 text-center rounded"
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}
        >
          <span className="text-sm font-medium" style={{ color: theme.secondary }}>
            Spread: {spread.toFixed(2)} ({spreadPercentage.toFixed(2)}%)
          </span>
        </div>

        {/* Buy Orders */}
        <div>
          {buyOrders
            .sort((a, b) => b.price - a.price)
            .slice(0, maxOrders)
            .map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-3 py-1 cursor-pointer hover:opacity-80"
                onClick={() => onOrderClick && onOrderClick(order)}
              >
                <div className="text-sm font-medium" style={{ color: theme.success }}>
                  {order.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-right" style={{ color: theme.text }}>
                  {order.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  })}
                </div>
                <div className="text-sm text-right" style={{ color: theme.text }}>
                  {order.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Orderbook;