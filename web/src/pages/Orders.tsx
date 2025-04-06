/**
 * Orders - Orders page component
 * 
 * This page displays the user's active and historical orders.
 */

import React, { useState } from 'react';
import { Card } from '../components/MemoizedComponents';

// Mock data for demonstration
const mockOrders = [
  {
    id: 'order-1',
    pair: 'BTC/USD',
    type: 'limit',
    side: 'buy',
    amount: 1.5,
    price: 50000,
    total: 75000,
    filled: 0,
    status: 'open',
    created: '2025-04-05T12:00:00Z',
  },
  {
    id: 'order-2',
    pair: 'BTC/USD',
    type: 'limit',
    side: 'sell',
    amount: 0.5,
    price: 51000,
    total: 25500,
    filled: 0,
    status: 'open',
    created: '2025-04-05T11:30:00Z',
  },
  {
    id: 'order-3',
    pair: 'BTC/USD',
    type: 'limit',
    side: 'buy',
    amount: 1.0,
    price: 49500,
    total: 49500,
    filled: 1.0,
    status: 'filled',
    created: '2025-04-04T15:45:00Z',
  },
  {
    id: 'order-4',
    pair: 'BTC/USD',
    type: 'limit',
    side: 'sell',
    amount: 2.0,
    price: 52000,
    total: 104000,
    filled: 0,
    status: 'cancelled',
    created: '2025-04-03T09:20:00Z',
  },
];

/**
 * Orders component
 */
const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'open' | 'filled' | 'cancelled'>('open');

  // Filter orders based on active tab
  const filteredOrders = mockOrders.filter(order => {
    if (activeTab === 'open') return order.status === 'open';
    if (activeTab === 'filled') return order.status === 'filled';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="orders-page">
      <h1>Orders</h1>
      
      <div className="orders-tabs">
        <button
          className={`tab-button ${activeTab === 'open' ? 'active' : ''}`}
          onClick={() => setActiveTab('open')}
        >
          Open Orders
        </button>
        <button
          className={`tab-button ${activeTab === 'filled' ? 'active' : ''}`}
          onClick={() => setActiveTab('filled')}
        >
          Filled Orders
        </button>
        <button
          className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled Orders
        </button>
      </div>
      
      <Card className="orders-card">
        <div className="orders-table">
          <div className="orders-header">
            <div className="order-cell">Pair</div>
            <div className="order-cell">Type</div>
            <div className="order-cell">Side</div>
            <div className="order-cell">Amount</div>
            <div className="order-cell">Price</div>
            <div className="order-cell">Total</div>
            <div className="order-cell">Filled</div>
            <div className="order-cell">Created</div>
            <div className="order-cell">Actions</div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              No {activeTab} orders found.
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`order-row ${order.side}`}>
                <div className="order-cell">{order.pair}</div>
                <div className="order-cell">{order.type}</div>
                <div className="order-cell">{order.side}</div>
                <div className="order-cell">{order.amount.toFixed(4)}</div>
                <div className="order-cell">${order.price.toLocaleString()}</div>
                <div className="order-cell">${order.total.toLocaleString()}</div>
                <div className="order-cell">{order.filled.toFixed(4)}</div>
                <div className="order-cell">{formatDate(order.created)}</div>
                <div className="order-cell">
                  {order.status === 'open' && (
                    <button
                      className="cancel-button"
                      onClick={() => alert(`Cancel order ${order.id}`)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Orders;