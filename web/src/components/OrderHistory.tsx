import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkSwap } from '../contexts/DarkSwapContext';

interface OrderHistoryProps {
  showTrades?: boolean;
  showOrders?: boolean;
  maxItems?: number;
  onOrderClick?: (orderId: string) => void;
  onTradeClick?: (tradeId: string) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  showTrades = true,
  showOrders = true,
  maxItems = 10,
  onOrderClick,
  onTradeClick,
}) => {
  const { theme } = useTheme();
  const { myOrders, myTrades } = useDarkSwap();
  const [activeTab, setActiveTab] = useState<'orders' | 'trades'>(
    showOrders ? 'orders' : 'trades'
  );

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format status with color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return theme.primary;
      case 'filled':
      case 'completed':
        return theme.success;
      case 'cancelled':
      case 'failed':
        return theme.error;
      case 'expired':
        return theme.warning;
      case 'pending':
        return theme.info;
      default:
        return theme.secondary;
    }
  };

  // Filter and sort orders
  const filteredOrders = myOrders
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxItems);

  // Filter and sort trades
  const filteredTrades = myTrades
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxItems);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: theme.card }}
    >
      <div className="p-4 border-b" style={{ borderColor: theme.border }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
          Order History
        </h2>
      </div>

      {/* Tabs */}
      {showOrders && showTrades && (
        <div className="flex border-b" style={{ borderColor: theme.border }}>
          <button
            className="flex-1 py-2 text-center font-medium"
            style={{
              color: activeTab === 'orders' ? theme.primary : theme.text,
              borderBottom:
                activeTab === 'orders'
                  ? `2px solid ${theme.primary}`
                  : `2px solid transparent`,
            }}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className="flex-1 py-2 text-center font-medium"
            style={{
              color: activeTab === 'trades' ? theme.primary : theme.text,
              borderBottom:
                activeTab === 'trades'
                  ? `2px solid ${theme.primary}`
                  : `2px solid transparent`,
            }}
            onClick={() => setActiveTab('trades')}
          >
            Trades
          </button>
        </div>
      )}

      <div className="p-4">
        {/* Orders Tab */}
        {((activeTab === 'orders' && showOrders) || (!showTrades && showOrders)) && (
          <div>
            {filteredOrders.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: theme.secondary }}
              >
                No orders found
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 px-2 py-1 text-sm font-medium" style={{ color: theme.secondary }}>
                  <div>Pair</div>
                  <div>Type</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Status</div>
                </div>

                {/* Order Items */}
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-5 gap-2 p-2 rounded cursor-pointer hover:bg-opacity-10"
                    style={{
                      backgroundColor: `${theme.background}50`,
                      color: theme.text,
                    }}
                    onClick={() => onOrderClick && onOrderClick(order.id)}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">
                        {order.baseAsset}/{order.quoteAsset}
                      </span>
                      <span className="text-xs ml-1 text-gray-500">
                        {formatTimestamp(order.timestamp)}
                      </span>
                    </div>
                    <div>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            order.side === 'buy'
                              ? `${theme.success}20`
                              : `${theme.error}20`,
                          color:
                            order.side === 'buy' ? theme.success : theme.error,
                        }}
                      >
                        {order.side.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      {order.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 8,
                        maximumFractionDigits: 8,
                      })}{' '}
                      {order.baseAsset}
                    </div>
                    <div className="text-right">
                      {order.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {order.quoteAsset}
                    </div>
                    <div className="text-right">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status),
                        }}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trades Tab */}
        {((activeTab === 'trades' && showTrades) || (!showOrders && showTrades)) && (
          <div>
            {filteredTrades.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: theme.secondary }}
              >
                No trades found
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 px-2 py-1 text-sm font-medium" style={{ color: theme.secondary }}>
                  <div>Pair</div>
                  <div>Type</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Status</div>
                </div>

                {/* Trade Items */}
                {filteredTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="grid grid-cols-5 gap-2 p-2 rounded cursor-pointer hover:bg-opacity-10"
                    style={{
                      backgroundColor: `${theme.background}50`,
                      color: theme.text,
                    }}
                    onClick={() => onTradeClick && onTradeClick(trade.id)}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">
                        {trade.baseAsset}/{trade.quoteAsset}
                      </span>
                      <span className="text-xs ml-1 text-gray-500">
                        {formatTimestamp(trade.timestamp)}
                      </span>
                    </div>
                    <div>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            trade.side === 'buy'
                              ? `${theme.success}20`
                              : `${theme.error}20`,
                          color:
                            trade.side === 'buy' ? theme.success : theme.error,
                        }}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      {trade.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 8,
                        maximumFractionDigits: 8,
                      })}{' '}
                      {trade.baseAsset}
                    </div>
                    <div className="text-right">
                      {trade.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {trade.quoteAsset}
                    </div>
                    <div className="text-right">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${getStatusColor(trade.status)}20`,
                          color: getStatusColor(trade.status),
                        }}
                      >
                        {trade.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;