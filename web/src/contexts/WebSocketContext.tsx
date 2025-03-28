import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import WebSocketClient, { WebSocketMessage } from '../utils/WebSocketClient';
import { useSDK } from './SDKContext';
import { useNotification } from './NotificationContext';

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, payload: any) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url = 'ws://localhost:3000/ws' 
}) => {
  const { isInitialized } = useSDK();
  const { addNotification } = useNotification();
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('disconnected');

  // Initialize WebSocket client
  useEffect(() => {
    const wsClient = new WebSocketClient(url);
    setClient(wsClient);

    // Set up event listeners
    wsClient.on('connected', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionStatus('connected');
      addNotification('success', 'Connected to DarkSwap network');
    });

    wsClient.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      addNotification('warning', 'Disconnected from DarkSwap network');
    });

    wsClient.on('reconnecting', (data: { attempt: number, delay: number }) => {
      setConnectionStatus('reconnecting');
      addNotification('info', `Reconnecting to DarkSwap network (attempt ${data.attempt})`);
    });

    wsClient.on('reconnect_failed', () => {
      setConnectionStatus('failed');
      addNotification('error', 'Failed to connect to DarkSwap network');
    });

    wsClient.on('message', (message: WebSocketMessage) => {
      setLastMessage(message);
      
      // Handle specific message types
      switch (message.type) {
        case 'order_created':
          addNotification('success', 'New order created');
          break;
        case 'order_filled':
          addNotification('success', 'Order filled successfully');
          break;
        case 'order_canceled':
          addNotification('info', 'Order canceled');
          break;
        case 'trade_completed':
          addNotification('success', 'Trade completed successfully');
          break;
        case 'error':
          addNotification('error', `Error: ${message.payload.message}`);
          break;
      }
    });

    return () => {
      wsClient.disconnect();
    };
  }, [url, addNotification]);

  // Auto-connect when SDK is initialized
  useEffect(() => {
    if (isInitialized && client && !isConnected && !isConnecting) {
      connect();
    }
  }, [isInitialized, client, isConnected, isConnecting]);

  // Connect to WebSocket server
  const connect = () => {
    if (client && !isConnected && !isConnecting) {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      client.connect();
    }
  };

  // Disconnect from WebSocket server
  const disconnect = () => {
    if (client) {
      client.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    }
  };

  // Send a message to the WebSocket server
  const send = (type: string, payload: any) => {
    if (client && isConnected) {
      client.send(type, payload);
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        isConnecting,
        connect,
        disconnect,
        send,
        lastMessage,
        connectionStatus,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};