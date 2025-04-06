/**
 * OrderBook - Component for displaying order book
 * 
 * This component displays the order book for a trading pair, showing
 * buy and sell orders with price and amount information.
 */

import React, { useState, useEffect } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { AssetType, Order, OrderSide } from '../wasm/DarkSwapWasm';
import { Card } from './MemoizedComponents';
import { EventType, OrderCreatedEvent, OrderCancelledEvent, OrderFilledEvent } from '../wasm/EventTypes';

export interface OrderBookProps {
  /** CSS class name */
  className?: string;
  
  /** Base asset type */
  baseAssetType: AssetType;
  
  /** Base asset ID */
  baseAssetId: string;
  
  /** Quote asset type */
  quoteAssetType: AssetType;
  
  /** Quote asset ID */
  quoteAssetId: string;
  
  /** Order selected callback */
  onOrderSelected?: (order: Order) => void;
}

/**
 * OrderBook component
 */
export const OrderBook: React.FC<OrderBookProps> = ({ 
  className = '',
  baseAssetType,
  baseAssetId,
  quoteAssetType,
  quoteAssetId,
  onOrderSelected,
}) => {
  // DarkSwap context
  const { isInitialized, getOrders, on, off } = useDarkSwapContext();
  
  // Order book state
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load order book
  const loadOrderBook = async () => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get buy orders
      const buyOrders = await getOrders(
        OrderSide.Buy,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
      );
      
      // Get sell orders
      const sellOrders = await getOrders(
        OrderSide.Sell,
        baseAssetType,
        baseAssetId,
        quoteAssetType,
        quoteAssetId,
      );
      
      // Sort buy orders by price (descending)
      buyOrders.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      
      // Sort sell orders by price (ascending)
      sellOrders.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      
      // Update state
      setBuyOrders(buyOrders);
      setSellOrders(sellOrders);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load order book on initialization
  useEffect(() => {
    loadOrderBook();
  }, [isInitialized, baseAssetType, baseAssetId, quoteAssetType, quoteAssetId]);
  
  // Handle order book events
  useEffect(() => {
    if (!isInitialized) return;
    
    // Define event handlers
    const handleOrderCreated = (event: OrderCreatedEvent) => {
      const order = event.data;
      
      // Check if order matches current trading pair
      if (
        order.baseAsset === baseAssetId &&
        order.quoteAsset === quoteAssetId
      ) {
        // Add order to order book
        if (order.side === OrderSide.Buy) {
          setBuyOrders(prevOrders => {
            const newOrders = [...prevOrders, order];
            // Sort by price (descending)
            newOrders.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            return newOrders;
          });
        } else {
          setSellOrders(prevOrders => {
            const newOrders = [...prevOrders, order];
            // Sort by price (ascending)
            newOrders.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            return newOrders;
          });
        }
      }
    };
    
    const handleOrderCancelled = (event: OrderCancelledEvent) => {
      const orderId = event.data.id;
      
      // Remove order from order book
      setBuyOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      setSellOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    };
    
    const handleOrderFilled = (event: OrderFilledEvent) => {
      const order = event.data;
      
      // Remove order from order book
      setBuyOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
      setSellOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
    };
    
    // Register event handlers
    on<OrderCreatedEvent>(EventType.OrderCreated, handleOrderCreated);
    on<OrderCancelledEvent>(EventType.OrderCancelled, handleOrderCancelled);
    on<OrderFilledEvent>(EventType.OrderFilled, handleOrderFilled);
    
    // Clean up event handlers
    return () => {
      off<OrderCreatedEvent>(EventType.OrderCreated, handleOrderCreated);
      off<OrderCancelledEvent>(EventType.OrderCancelled, handleOrderCancelled);
      off<OrderFilledEvent>(EventType.OrderFilled, handleOrderFilled);
    };
  }, [isInitialized, baseAssetId, quoteAssetId, on, off]);
  
  // Handle order click
  const handleOrderClick = (order: Order) => {
    if (onOrderSelected) {
      onOrderSelected(order);
    }
  };
  
  return (
    <Card className={`order-book ${className}`}>
      <h2>Order Book</h2>
      
      {isLoading && (
        <div className="loading">Loading order book...</div>
      )}
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      
      <div className="order-book-content">
        <div className="order-book-header">
          <div className="price">Price ({quoteAssetId})</div>
          <div className="amount">Amount ({baseAssetId})</div>
          <div className="total">Total ({quoteAssetId})</div>
        </div>
        
        <div className="sell-orders">
          {sellOrders.map((order) => (
            <div
              key={order.id}
              className="order sell-order"
              onClick={() => handleOrderClick(order)}
            >
              <div className="price">{order.price}</div>
              <div className="amount">{order.amount}</div>
              <div className="total">
                {(parseFloat(order.price) * parseFloat(order.amount)).toFixed(2)}
              </div>
            </div>
          ))}
          
          {sellOrders.length === 0 && (
            <div className="no-orders">No sell orders</div>
          )}
        </div>
        
        <div className="spread">
          <div className="spread-label">Spread:</div>
          <div className="spread-value">
            {sellOrders.length > 0 && buyOrders.length > 0 ? (
              `${(parseFloat(sellOrders[0].price) - parseFloat(buyOrders[0].price)).toFixed(2)} ${quoteAssetId}`
            ) : (
              'N/A'
            )}
          </div>
        </div>
        
        <div className="buy-orders">
          {buyOrders.map((order) => (
            <div
              key={order.id}
              className="order buy-order"
              onClick={() => handleOrderClick(order)}
            >
              <div className="price">{order.price}</div>
              <div className="amount">{order.amount}</div>
              <div className="total">
                {(parseFloat(order.price) * parseFloat(order.amount)).toFixed(2)}
              </div>
            </div>
          ))}
          
          {buyOrders.length === 0 && (
            <div className="no-orders">No buy orders</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OrderBook;