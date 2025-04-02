import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useApi } from './ApiContext';
import { useNotification } from './NotificationContext';
import { useWasmWallet } from './WasmWalletContext';

// Define order types
export interface Order {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  timestamp: number;
  expiry: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  maker: string;
}

// Define orderbook context type
export interface OrderbookContextType {
  orders: Order[];
  buyOrders: Order[];
  sellOrders: Order[];
  isLoading: boolean;
  error: Error | null;
  syncOrderbook: (baseAsset?: string, quoteAsset?: string) => Promise<void>;
  createOrder: (side: 'buy' | 'sell', baseAsset: string, quoteAsset: string, amount: string, price: string, expiry?: number) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrder: (orderId: string) => Order | undefined;
  midPrice: string | null;
  spread: string | null;
  lastUpdated: number | null;
}

// Create the context
const OrderbookContext = createContext<OrderbookContextType | undefined>(undefined);

// Provider props
interface OrderbookProviderProps {
  children: ReactNode;
  defaultBaseAsset?: string;
  defaultQuoteAsset?: string;
}

// Provider component
export const OrderbookProvider: React.FC<OrderbookProviderProps> = ({
  children,
  defaultBaseAsset = 'BTC',
  defaultQuoteAsset = 'RUNE:0x123',
}) => {
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [midPrice, setMidPrice] = useState<string | null>(null);
  const [spread, setSpread] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Get API client
  const { client } = useApi();
  
  // Get notification context
  const { addNotification } = useNotification();
  
  // Get wallet context
  const wasmWallet = useWasmWallet();
  
  // Sync orderbook
  const syncOrderbook = async (baseAsset: string = defaultBaseAsset, quoteAsset: string = defaultQuoteAsset): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch orders from API
      const response = await client.getOrders(baseAsset, quoteAsset);
      
      // Parse orders and map to our Order type
      const fetchedOrders: Order[] = (response.data || []).map(apiOrder => ({
        id: apiOrder.id,
        baseAsset: apiOrder.base_asset,
        quoteAsset: apiOrder.quote_asset,
        side: apiOrder.side,
        amount: apiOrder.amount,
        price: apiOrder.price,
        timestamp: apiOrder.timestamp,
        expiry: apiOrder.expiry || (apiOrder.timestamp + 24 * 60 * 60 * 1000),
        status: apiOrder.status === 'canceled' ? 'cancelled' : apiOrder.status,
        maker: apiOrder.maker_peer_id,
      }));
      
      // Update orders
      setOrders(fetchedOrders);
      
      // Update buy and sell orders
      const buys = fetchedOrders.filter(order => order.side === 'buy');
      const sells = fetchedOrders.filter(order => order.side === 'sell');
      
      setBuyOrders(buys);
      setSellOrders(sells);
      
      // Calculate mid price and spread
      if (buys.length > 0 && sells.length > 0) {
        // Sort buy orders by price (descending)
        const sortedBuys = [...buys].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        
        // Sort sell orders by price (ascending)
        const sortedSells = [...sells].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        
        // Get best buy and sell prices
        const bestBuyPrice = parseFloat(sortedBuys[0].price);
        const bestSellPrice = parseFloat(sortedSells[0].price);
        
        // Calculate mid price
        const mid = (bestBuyPrice + bestSellPrice) / 2;
        setMidPrice(mid.toFixed(8));
        
        // Calculate spread
        const spreadValue = bestSellPrice - bestBuyPrice;
        setSpread(spreadValue.toFixed(8));
      } else {
        setMidPrice(null);
        setSpread(null);
      }
      
      // Update last updated timestamp
      setLastUpdated(Date.now());
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to sync orderbook:', err);
      setError(err instanceof Error ? err : new Error('Failed to sync orderbook'));
      setIsLoading(false);
    }
  };
  
  // Create order
  const createOrder = async (
    side: 'buy' | 'sell',
    baseAsset: string,
    quoteAsset: string,
    amount: string,
    price: string,
    expiry: number = 24 * 60 * 60 * 1000
  ): Promise<string> => {
    try {
      // Check if wallet is connected
      if (!wasmWallet.isConnected) {
        throw new Error('Wallet not connected');
      }
      
      // Get wallet address
      const address = wasmWallet.address;
      
      // Create order
      const order: Order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        baseAsset,
        quoteAsset,
        side,
        amount,
        price,
        timestamp: Date.now(),
        expiry: Date.now() + expiry,
        status: 'open',
        maker: address,
      };
      
      // Send order to API
      const response = await client.createOrder(
        baseAsset,
        quoteAsset,
        side,
        amount,
        price,
        expiry
      );
      
      // Get created order
      const createdOrder = response.data;
      
      if (!createdOrder) {
        throw new Error('Failed to create order: No order returned');
      }
      
      // Add notification
      addNotification('success', `Order created: ${createdOrder.id}`);
      
      // Sync orderbook
      await syncOrderbook(baseAsset, quoteAsset);
      
      return createdOrder.id;
    } catch (err) {
      console.error('Failed to create order:', err);
      addNotification('error', `Failed to create order: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };
  
  // Cancel order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      // Send cancel request to API
      await client.cancelOrder(orderId);
      
      // Add notification
      addNotification('success', `Order cancelled: ${orderId}`);
      
      // Sync orderbook
      await syncOrderbook();
      
      return true;
    } catch (err) {
      console.error('Failed to cancel order:', err);
      addNotification('error', `Failed to cancel order: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Get order by ID
  const getOrder = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };
  
  // Sync orderbook on mount
  useEffect(() => {
    syncOrderbook();
  }, []);
  
  // Context value
  const value: OrderbookContextType = {
    orders,
    buyOrders,
    sellOrders,
    isLoading,
    error,
    syncOrderbook,
    createOrder,
    cancelOrder,
    getOrder,
    midPrice,
    spread,
    lastUpdated,
  };
  
  return (
    <OrderbookContext.Provider value={value}>
      {children}
    </OrderbookContext.Provider>
  );
};

// Hook for using the orderbook context
export const useOrderbook = (): OrderbookContextType => {
  const context = useContext(OrderbookContext);
  
  if (context === undefined) {
    throw new Error('useOrderbook must be used within an OrderbookProvider');
  }
  
  return context;
};

export default OrderbookProvider;