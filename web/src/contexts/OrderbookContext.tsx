import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebRtc } from './WebRtcContext';
import { useWallet } from './WalletContext';
import { useNotification } from './NotificationContext';
import {
  OrderbookUtils,
  Orderbook,
  Order,
  OrderSide,
  OrderStatus,
  OrderAsset,
  OrderbookUpdate,
  OrderbookSyncMessage,
  AssetType,
} from '../utils/OrderbookUtils';

/**
 * Orderbook context type
 */
interface OrderbookContextType {
  orderbook: Orderbook;
  isLoading: boolean;
  error: Error | null;
  createOrder: (
    side: OrderSide,
    baseAsset: OrderAsset,
    quoteAsset: OrderAsset,
    expiresAt?: number,
    metadata?: { [key: string]: string }
  ) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<Order>;
  getOpenOrders: () => Order[];
  getMyOrders: () => Order[];
  getOrdersByAsset: (assetType: AssetType, assetId?: string) => Order[];
  getMatchingOrders: (order: Order) => Order[];
  refreshOrderbook: () => Promise<void>;
  syncOrderbook: () => Promise<void>;
}

/**
 * Orderbook context
 */
const OrderbookContext = createContext<OrderbookContextType | undefined>(undefined);

/**
 * Orderbook provider props
 */
interface OrderbookProviderProps {
  children: ReactNode;
}

/**
 * Orderbook provider
 */
export const OrderbookProvider: React.FC<OrderbookProviderProps> = ({ children }) => {
  // Contexts
  const {
    isConnected: isWebRtcConnected,
    localPeerId,
    connectedPeers,
    sendString,
    onMessage,
    offMessage,
  } = useWebRtc();

  const { isConnected: isWalletConnected, address } = useWallet();
  const { addNotification } = useNotification();

  // State
  const [orderbook, setOrderbook] = useState<Orderbook>(OrderbookUtils.createOrderbook());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Initialize orderbook
  useEffect(() => {
    if (isWebRtcConnected && isWalletConnected) {
      initializeOrderbook();
    }
  }, [isWebRtcConnected, isWalletConnected]);

  // Handle incoming messages
  useEffect(() => {
    if (!isWebRtcConnected) return;

    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;

        // Check if it's an orderbook sync message
        if (
          message &&
          message.type &&
          ['sync_request', 'sync_response', 'update'].includes(message.type)
        ) {
          handleOrderbookSyncMessage(message, peerId);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [isWebRtcConnected, onMessage, offMessage, orderbook]);

  // Clean up expired orders periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (isWebRtcConnected && isWalletConnected) {
        const cleanedOrderbook = OrderbookUtils.cleanupExpiredOrders(orderbook);
        if (cleanedOrderbook.version !== orderbook.version) {
          setOrderbook(cleanedOrderbook);
        }
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [isWebRtcConnected, isWalletConnected, orderbook]);

  // Sync orderbook periodically
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isWebRtcConnected && isWalletConnected && connectedPeers.length > 0) {
        // Only sync if it's been more than 5 minutes since the last sync
        if (Date.now() - lastSyncTime > 300000) {
          syncOrderbook();
        }
      }
    }, 300000); // Sync every 5 minutes

    return () => {
      clearInterval(syncInterval);
    };
  }, [isWebRtcConnected, isWalletConnected, connectedPeers, lastSyncTime]);

  // Initialize orderbook
  const initializeOrderbook = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load orderbook from local storage
      const savedOrderbook = localStorage.getItem('darkswap-orderbook');
      if (savedOrderbook) {
        try {
          const parsedOrderbook = JSON.parse(savedOrderbook);
          setOrderbook(parsedOrderbook);
        } catch (error) {
          console.error('Error parsing saved orderbook:', error);
          // If there's an error parsing the saved orderbook, create a new one
          setOrderbook(OrderbookUtils.createOrderbook());
        }
      }

      // Sync with peers
      if (connectedPeers.length > 0) {
        await syncOrderbook();
      }
    } catch (error) {
      console.error('Error initializing orderbook:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle orderbook sync message
  const handleOrderbookSyncMessage = (message: OrderbookSyncMessage, peerId: string) => {
    try {
      switch (message.type) {
        case 'sync_request':
          // Send our orderbook to the peer
          sendOrderbookToPeer(peerId);
          break;
        case 'sync_response':
          // Merge the received orderbook with our orderbook
          if ('orders' in message.data) {
            const receivedOrderbook = message.data as Orderbook;
            const mergedOrderbook = OrderbookUtils.mergeOrderbooks(orderbook, receivedOrderbook);
            setOrderbook(mergedOrderbook);
            saveOrderbook(mergedOrderbook);
          }
          break;
        case 'update':
          // Apply the update to our orderbook
          if ('order' in message.data) {
            const update = message.data as OrderbookUpdate;
            const updatedOrderbook = OrderbookUtils.applyOrderbookUpdate(orderbook, update);
            setOrderbook(updatedOrderbook);
            saveOrderbook(updatedOrderbook);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling orderbook sync message:', error);
    }
  };

  // Send orderbook to peer
  const sendOrderbookToPeer = (peerId: string) => {
    try {
      const syncMessage = OrderbookUtils.createOrderbookSyncMessage(
        'sync_response',
        orderbook,
        localPeerId || ''
      );
      sendString(peerId, JSON.stringify(syncMessage));
    } catch (error) {
      console.error('Error sending orderbook to peer:', error);
    }
  };

  // Save orderbook to local storage
  const saveOrderbook = (orderbook: Orderbook) => {
    try {
      localStorage.setItem('darkswap-orderbook', JSON.stringify(orderbook));
    } catch (error) {
      console.error('Error saving orderbook:', error);
    }
  };

  // Create order
  const createOrder = async (
    side: OrderSide,
    baseAsset: OrderAsset,
    quoteAsset: OrderAsset,
    expiresAt?: number,
    metadata?: { [key: string]: string }
  ): Promise<Order> => {
    if (!isWebRtcConnected || !isWalletConnected || !address || !localPeerId) {
      throw new Error('Not connected');
    }

    try {
      // Create the order
      const order = OrderbookUtils.createOrder(
        localPeerId,
        address,
        side,
        baseAsset,
        quoteAsset,
        expiresAt,
        metadata
      );

      // Add the order to the orderbook
      const updatedOrderbook = OrderbookUtils.addOrder(orderbook, order);
      setOrderbook(updatedOrderbook);
      saveOrderbook(updatedOrderbook);

      // Broadcast the order to peers
      broadcastOrderUpdate('add', order);

      addNotification('success', 'Order created successfully');

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      addNotification('error', `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Cancel order
  const cancelOrder = async (orderId: string): Promise<Order> => {
    if (!isWebRtcConnected || !isWalletConnected || !localPeerId) {
      throw new Error('Not connected');
    }

    try {
      // Find the order
      const order = orderbook.orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if the order belongs to the user
      if (order.creatorId !== localPeerId) {
        throw new Error('Cannot cancel order: not the creator');
      }

      // Cancel the order
      const cancelledOrder = OrderbookUtils.cancelOrder(order);

      // Update the orderbook
      const updatedOrderbook = OrderbookUtils.updateOrderInOrderbook(
        orderbook,
        orderId,
        cancelledOrder
      );
      setOrderbook(updatedOrderbook);
      saveOrderbook(updatedOrderbook);

      // Broadcast the order update to peers
      broadcastOrderUpdate('update', cancelledOrder);

      addNotification('success', 'Order cancelled successfully');

      return cancelledOrder;
    } catch (error) {
      console.error('Error cancelling order:', error);
      addNotification('error', `Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Broadcast order update to peers
  const broadcastOrderUpdate = (type: 'add' | 'update' | 'remove', order: Order) => {
    if (!isWebRtcConnected || !localPeerId) return;

    try {
      // Create the update
      const update = OrderbookUtils.createOrderbookUpdate(type, order, localPeerId);

      // Create the sync message
      const syncMessage = OrderbookUtils.createOrderbookSyncMessage(
        'update',
        update,
        localPeerId
      );

      // Send to all connected peers
      connectedPeers.forEach((peerId) => {
        sendString(peerId, JSON.stringify(syncMessage));
      });
    } catch (error) {
      console.error('Error broadcasting order update:', error);
    }
  };

  // Get open orders
  const getOpenOrders = (): Order[] => {
    return OrderbookUtils.getOpenOrders(orderbook);
  };

  // Get my orders
  const getMyOrders = (): Order[] => {
    if (!localPeerId) return [];
    return OrderbookUtils.getOrdersByCreator(orderbook, localPeerId);
  };

  // Get orders by asset
  const getOrdersByAsset = (assetType: AssetType, assetId?: string): Order[] => {
    return OrderbookUtils.getOrdersByAsset(orderbook, assetType, assetId);
  };

  // Get matching orders
  const getMatchingOrders = (order: Order): Order[] => {
    return OrderbookUtils.getMatchingOrders(orderbook, order);
  };

  // Refresh orderbook
  const refreshOrderbook = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Clean up expired orders
      const cleanedOrderbook = OrderbookUtils.cleanupExpiredOrders(orderbook);
      setOrderbook(cleanedOrderbook);
      saveOrderbook(cleanedOrderbook);

      // Sync with peers
      if (connectedPeers.length > 0) {
        await syncOrderbook();
      }

      addNotification('success', 'Orderbook refreshed successfully');
    } catch (error) {
      console.error('Error refreshing orderbook:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      addNotification('error', `Failed to refresh orderbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync orderbook with peers
  const syncOrderbook = async (): Promise<void> => {
    if (!isWebRtcConnected || !localPeerId || connectedPeers.length === 0) {
      return;
    }

    try {
      // Create a sync request message
      const syncMessage = OrderbookUtils.createOrderbookSyncMessage(
        'sync_request',
        orderbook,
        localPeerId
      );

      // Send to all connected peers
      connectedPeers.forEach((peerId) => {
        sendString(peerId, JSON.stringify(syncMessage));
      });

      // Update last sync time
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error syncing orderbook:', error);
      throw error;
    }
  };

  return (
    <OrderbookContext.Provider
      value={{
        orderbook,
        isLoading,
        error,
        createOrder,
        cancelOrder,
        getOpenOrders,
        getMyOrders,
        getOrdersByAsset,
        getMatchingOrders,
        refreshOrderbook,
        syncOrderbook,
      }}
    >
      {children}
    </OrderbookContext.Provider>
  );
};

/**
 * Use orderbook hook
 */
export const useOrderbook = (): OrderbookContextType => {
  const context = useContext(OrderbookContext);
  if (context === undefined) {
    throw new Error('useOrderbook must be used within an OrderbookProvider');
  }
  return context;
};

export default OrderbookProvider;