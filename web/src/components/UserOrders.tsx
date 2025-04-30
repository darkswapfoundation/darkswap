import React from 'react';
import { useUserOrders } from '../contexts/WebSocketContext';

// User orders props
interface UserOrdersProps {
  className?: string;
  showClosed?: boolean;
}

/**
 * User orders component
 * @param props Component props
 * @returns User orders component
 */
const UserOrders: React.FC<UserOrdersProps> = ({
  className,
  showClosed = false,
}) => {
  // Get user orders
  const orders = useUserOrders();
  
  // Filter orders
  const filteredOrders = orders.filter(
    (order) => showClosed || order.status === 'open'
  );
  
  // Format price
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(8);
  };
  
  // Format amount
  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(8);
  };
  
  // Format filled
  const formatFilled = (filled: string, amount: string) => {
    const filledValue = parseFloat(filled);
    const amountValue = parseFloat(amount);
    const percentage = (filledValue / amountValue) * 100;
    return `${parseFloat(filled).toFixed(8)} (${percentage.toFixed(2)}%)`;
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'user-orders-status-open';
      case 'filled':
        return 'user-orders-status-filled';
      case 'cancelled':
        return 'user-orders-status-cancelled';
      default:
        return '';
    }
  };
  
  // Get type class
  const getTypeClass = (type: string) => {
    switch (type) {
      case 'buy':
        return 'user-orders-type-buy';
      case 'sell':
        return 'user-orders-type-sell';
      default:
        return '';
    }
  };
  
  return (
    <div className={`user-orders ${className || ''}`}>
      <div className="user-orders-header">
        <h3>Your Orders</h3>
      </div>
      
      <div className="user-orders-content">
        {filteredOrders.length > 0 ? (
          <div className="user-orders-list">
            <div className="user-orders-row user-orders-header-row">
              <div className="user-orders-cell">Pair</div>
              <div className="user-orders-cell">Type</div>
              <div className="user-orders-cell">Price</div>
              <div className="user-orders-cell">Amount</div>
              <div className="user-orders-cell">Filled</div>
              <div className="user-orders-cell">Status</div>
              <div className="user-orders-cell">Created</div>
            </div>
            
            {filteredOrders.map((order) => (
              <div key={order.id} className="user-orders-row">
                <div className="user-orders-cell user-orders-pair">
                  {order.baseAsset}/{order.quoteAsset}
                </div>
                <div
                  className={`user-orders-cell user-orders-type ${getTypeClass(
                    order.type
                  )}`}
                >
                  {order.type.toUpperCase()}
                </div>
                <div className="user-orders-cell user-orders-price">
                  {formatPrice(order.price)}
                </div>
                <div className="user-orders-cell user-orders-amount">
                  {formatAmount(order.amount)}
                </div>
                <div className="user-orders-cell user-orders-filled">
                  {formatFilled(order.filled, order.amount)}
                </div>
                <div
                  className={`user-orders-cell user-orders-status ${getStatusClass(
                    order.status
                  )}`}
                >
                  {order.status.toUpperCase()}
                </div>
                <div className="user-orders-cell user-orders-created">
                  {formatTimestamp(order.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="user-orders-empty">
            {orders.length === 0
              ? 'You have no orders'
              : 'You have no orders matching the filter'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;