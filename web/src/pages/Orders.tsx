import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import { Order, OrderStatus, OrderSide } from '../types';
import '../styles/Orders.css';

const Orders: React.FC = () => {
  const { theme } = useTheme();
  const { api } = useApi();
  const { addNotification } = useNotification();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  
  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.getOrders();
      setOrders(data);
      setFilteredOrders(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError('Failed to fetch orders. Please try again later.');
      setIsLoading(false);
    }
  }, [api]);
  
  // Filter orders
  useEffect(() => {
    let result = [...orders];
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Filter by side
    if (sideFilter !== 'all') {
      result = result.filter(order => order.side === sideFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.baseAsset.toLowerCase().includes(term) ||
        order.quoteAsset.toLowerCase().includes(term)
      );
    }
    
    setFilteredOrders(result);
  }, [orders, statusFilter, sideFilter, searchTerm]);
  
  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };
  
  // Handle side filter change
  const handleSideFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSideFilter(e.target.value);
  };
  
  // Handle search term change
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle cancel order
  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowConfirmation(true);
  };
  
  // Confirm cancel order
  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    try {
      const success = await api.cancelOrder(orderToCancel);
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Order Canceled',
          message: 'Your order has been canceled successfully.',
        });
        
        // Update orders
        fetchOrders();
      } else {
        addNotification({
          type: 'error',
          title: 'Cancel Failed',
          message: 'Failed to cancel order. Please try again later.',
        });
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      addNotification({
        type: 'error',
        title: 'Cancel Failed',
        message: 'Failed to cancel order. Please try again later.',
      });
    } finally {
      setShowConfirmation(false);
      setOrderToCancel(null);
    }
  };
  
  // Cancel confirmation
  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setOrderToCancel(null);
  };
  
  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Format price
  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    if (numPrice < 0.01) {
      return numPrice.toFixed(8);
    } else if (numPrice < 1) {
      return numPrice.toFixed(6);
    } else if (numPrice < 1000) {
      return numPrice.toFixed(4);
    } else {
      return numPrice.toFixed(2);
    }
  };
  
  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  return (
    <div className={`orders orders-${theme}`}>
      <div className="orders-header">
        <h1>Orders</h1>
        <div className="orders-filters">
          <div className="orders-filter">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">All</option>
              <option value={OrderStatus.Open}>Open</option>
              <option value={OrderStatus.Filled}>Filled</option>
              <option value={OrderStatus.PartiallyFilled}>Partially Filled</option>
              <option value={OrderStatus.Canceled}>Canceled</option>
              <option value={OrderStatus.Expired}>Expired</option>
            </select>
          </div>
          
          <div className="orders-filter">
            <label htmlFor="sideFilter">Side:</label>
            <select
              id="sideFilter"
              value={sideFilter}
              onChange={handleSideFilterChange}
            >
              <option value="all">All</option>
              <option value={OrderSide.Buy}>Buy</option>
              <option value={OrderSide.Sell}>Sell</option>
            </select>
          </div>
          
          <div className="orders-filter">
            <label htmlFor="searchTerm">Search:</label>
            <input
              id="searchTerm"
              type="text"
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search by ID, asset..."
            />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="orders-loading">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="orders-error">
          <p>{error}</p>
          <button onClick={fetchOrders}>Retry</button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Pair</th>
                <th>Side</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Filled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.id.substring(0, 8)}...</td>
                  <td>{formatDate(order.timestamp)}</td>
                  <td>{order.baseAsset}/{order.quoteAsset}</td>
                  <td className={order.side === OrderSide.Buy ? 'buy-side' : 'sell-side'}>
                    {order.side}
                  </td>
                  <td>{formatPrice(order.price)}</td>
                  <td>{formatPrice(order.amount)}</td>
                  <td>{formatPrice(order.filled)} ({((parseFloat(order.filled) / parseFloat(order.amount)) * 100).toFixed(2)}%)</td>
                  <td className={`order-status order-status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </td>
                  <td>
                    {order.status === OrderStatus.Open && (
                      <button
                        className="cancel-button"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showConfirmation && (
        <div className="confirmation-dialog">
          <div className="confirmation-dialog-content">
            <h3>Cancel Order</h3>
            <p>Are you sure you want to cancel this order?</p>
            <div className="confirmation-dialog-actions">
              <button className="cancel-button" onClick={cancelConfirmation}>
                No, Keep Order
              </button>
              <button className="confirm-button" onClick={confirmCancelOrder}>
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;