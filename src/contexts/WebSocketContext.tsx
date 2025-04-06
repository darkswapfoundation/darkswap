import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import WebSocketClient, { MessagePriority } from '../utils/WebSocketClient';

/**
 * WebSocket context type
 */
export interface WebSocketContextType {
  /** Connect to WebSocket server */
  connect: () => Promise<void>;
  /** Disconnect from WebSocket server */
  disconnect: () => void;
  /** Send message to WebSocket server */
  send: (type: string, data?: any, priority?: MessagePriority) => void;
  /** Subscribe to WebSocket event */
  subscribe: (channel: string, callback: (data: any) => void) => void;
  /** Unsubscribe from WebSocket event */
  unsubscribe: (channel: string) => void;
  /** Whether WebSocket is connected */
  connected: boolean;
  /** Whether WebSocket is connecting */
  connecting: boolean;
  /** WebSocket error */
  error: Error | null;
  /** Last received message */
  message: any;
  /** WebSocket client instance */
  wsClient: WebSocketClient | null;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * WebSocket provider props
 */
export interface WebSocketProviderProps {
  /** Children components */
  children: ReactNode;
  /** WebSocket server URL */
  url: string;
  /** Reconnection interval in milliseconds */
  reconnectInterval?: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Whether to automatically connect on mount */
  autoConnect?: boolean;
}

/**
 * WebSocket provider component
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  autoConnect = true,
}) => {
  // WebSocket client
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  
  // Connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [message, setMessage] = useState<any>(null);
  
  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Record<string, (data: any) => void>>({});

  // Initialize WebSocket client
  useEffect(() => {
    const client = new WebSocketClient({
      url,
      reconnectInterval,
      maxReconnectAttempts,
      autoConnect: false,
      debug: true,
    });
    
    // Set up event handlers
    client.on('connected', () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
      
      // Resubscribe to channels
      Object.keys(subscriptions).forEach(channel => {
        client.send('subscribe', { channel });
      });
    });
    
    client.on('disconnected', () => {
      setConnected(false);
    });
    
    client.on('reconnecting', () => {
      setConnecting(true);
    });
    
    client.on('reconnect_failed', () => {
      setError(new Error('Failed to reconnect to WebSocket server'));
      setConnecting(false);
    });
    
    client.on('error', (err) => {
      setError(err || new Error('WebSocket error'));
    });
    
    client.on('message', (data) => {
      setMessage(data);
      
      // Handle subscriptions
      if (data && data.channel && subscriptions[data.channel]) {
        subscriptions[data.channel](data);
      }
    });
    
    setWsClient(client);
    
    // Auto-connect if enabled
    if (autoConnect) {
      setConnecting(true);
      client.connect().catch(err => {
        setError(err);
        setConnecting(false);
      });
    }
    
    // Clean up on unmount
    return () => {
      client.disconnect();
    };
  }, [url, reconnectInterval, maxReconnectAttempts, autoConnect]);

  // Connect to WebSocket server
  const connect = useCallback(async () => {
    if (!wsClient) return Promise.reject(new Error('WebSocket client not initialized'));
    
    setConnecting(true);
    setError(null);
    
    try {
      await wsClient.connect();
      return Promise.resolve();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setConnecting(false);
      return Promise.reject(err);
    }
  }, [wsClient]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (wsClient) {
      wsClient.disconnect();
      setConnected(false);
      setConnecting(false);
    }
  }, [wsClient]);

  // Send message to WebSocket server
  const send = useCallback((type: string, data?: any, priority?: MessagePriority) => {
    if (wsClient) {
      wsClient.send(type, data, priority);
    } else {
      console.error('WebSocket client not initialized');
    }
  }, [wsClient]);

  // Subscribe to WebSocket event
  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    setSubscriptions(prev => ({ ...prev, [channel]: callback }));
    
    if (wsClient && connected) {
      send('subscribe', { channel });
    }
  }, [wsClient, connected, send]);

  // Unsubscribe from WebSocket event
  const unsubscribe = useCallback((channel: string) => {
    setSubscriptions(prev => {
      const newSubscriptions = { ...prev };
      delete newSubscriptions[channel];
      return newSubscriptions;
    });
    
    if (wsClient && connected) {
      send('unsubscribe', { channel });
    }
  }, [wsClient, connected, send]);

  // Context value
  const value: WebSocketContextType = {
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    connected,
    connecting,
    error,
    message,
    wsClient,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

/**
 * WebSocket hook
 * @returns WebSocket context
 * @throws Error if used outside of WebSocketProvider
 */
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * WebSocket event hook
 * @param eventType Event type
 * @param callback Event callback
 */
export const useWebSocketEvent = (eventType: string, callback: (data: any) => void): void => {
  const { wsClient } = useWebSocket();
  
  useEffect(() => {
    if (!wsClient) return;
    
    wsClient.on(eventType, callback);
    
    return () => {
      wsClient.off(eventType, callback);
    };
  }, [wsClient, eventType, callback]);
};

/**
 * WebSocket send hook
 * @param eventType Event type
 * @returns Function to send event
 */
export const useWebSocketSend = (eventType: string): (data?: any) => void => {
  const { send } = useWebSocket();
  
  return useCallback((data?: any) => {
    send(eventType, data);
  }, [send, eventType]);
};

export default WebSocketContext;