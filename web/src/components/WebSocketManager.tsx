import React, { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';

interface WebSocketManagerProps {
  children?: React.ReactNode;
}

/**
 * WebSocketManager component
 * 
 * This component manages WebSocket connections and events.
 * It subscribes to events and displays notifications when events are received.
 */
const WebSocketManager: React.FC<WebSocketManagerProps> = ({ children }) => {
  const { isConnected, send, lastMessage, connectionStatus } = useWebSocket();
  const { addNotification } = useNotification();

  // Subscribe to events when connected
  useEffect(() => {
    if (isConnected) {
      // Subscribe to all events
      send('Subscribe', {
        events: [
          'order_created',
          'order_canceled',
          'order_filled',
          'order_expired',
          'trade_started',
          'trade_completed',
          'trade_failed',
          'peer_connected',
          'peer_disconnected',
          'error',
        ],
      });

      // Show notification
      addNotification('success', 'Connected to DarkSwap network');
    }
  }, [isConnected, send, addNotification]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      // Handle different event types
      switch (lastMessage.type) {
        case 'order_created':
          addNotification('info', 'New order created');
          break;
        case 'order_canceled':
          addNotification('info', 'Order canceled');
          break;
        case 'order_filled':
          addNotification('success', 'Order filled');
          break;
        case 'order_expired':
          addNotification('warning', 'Order expired');
          break;
        case 'trade_started':
          addNotification('info', 'Trade started');
          break;
        case 'trade_completed':
          addNotification('success', 'Trade completed successfully');
          break;
        case 'trade_failed':
          addNotification('error', 'Trade failed');
          break;
        case 'peer_connected':
          addNotification('info', 'New peer connected');
          break;
        case 'peer_disconnected':
          addNotification('info', 'Peer disconnected');
          break;
        case 'error':
          addNotification('error', `Error: ${lastMessage.payload?.message || 'Unknown error'}`);
          break;
        case 'subscribed':
          console.log('Subscribed to events:', lastMessage.payload?.events);
          break;
        case 'unsubscribed':
          console.log('Unsubscribed from events:', lastMessage.payload?.events);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [lastMessage, addNotification]);

  // Show connection status changes
  useEffect(() => {
    switch (connectionStatus) {
      case 'connected':
        // Already handled in the first useEffect
        break;
      case 'disconnected':
        addNotification('warning', 'Disconnected from DarkSwap network');
        break;
      case 'reconnecting':
        addNotification('info', 'Reconnecting to DarkSwap network...');
        break;
      case 'failed':
        addNotification('error', 'Failed to connect to DarkSwap network');
        break;
    }
  }, [connectionStatus, addNotification]);

  return <>{children}</>;
};

export default WebSocketManager;