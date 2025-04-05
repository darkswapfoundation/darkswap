import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketStatus, WebSocketMessage, WebSocketSubscription } from '../utils/types';
import { useNotification } from './NotificationContext';

interface WebSocketContextType {
  status: WebSocketStatus;
  connect: (url: string) => void;
  disconnect: () => void;
  subscribe: <T>(topic: string, callback: (data: T) => void) => string;
  unsubscribe: (id: string) => void;
  send: <T>(type: string, data?: T) => void;
  reconnect: () => void;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  autoConnect = false,
  url: initialUrl,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}) => {
  // Hooks
  const { addNotification } = useNotification();
  
  // State
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, WebSocketSubscription>>(new Map());
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Connect to WebSocket
  const connect = useCallback((wsUrl: string) => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Update URL
    setUrl(wsUrl);
    
    // Create new WebSocket
    try {
      setStatus('connecting');
      
      const ws = new WebSocket(wsUrl);
      
      // Set event handlers
      ws.onopen = () => {
        setStatus('open');
        reconnectAttemptsRef.current = 0;
        
        // Resubscribe to topics
        subscriptionsRef.current.forEach((subscription) => {
          send('subscribe', { topic: subscription.topic });
        });
        
        // Add notification
        addNotification({
          type: 'success',
          title: 'WebSocket Connected',
          message: 'Connected to WebSocket server',
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle message
          if (message.type === 'message' && message.data?.topic) {
            // Find subscriptions for this topic
            subscriptionsRef.current.forEach((subscription) => {
              if (subscription.topic === message.data.topic) {
                subscription.callback(message.data.data);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        setStatus('closed');
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect(wsUrl);
          }, reconnectInterval);
        } else {
          // Add notification
          addNotification({
            type: 'error',
            title: 'WebSocket Disconnected',
            message: 'Failed to reconnect to WebSocket server',
          });
        }
      };
      
      ws.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket error:', error);
        
        // Add notification
        addNotification({
          type: 'error',
          title: 'WebSocket Error',
          message: 'An error occurred with the WebSocket connection',
        });
      };
      
      // Store WebSocket
      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
      console.error('Error connecting to WebSocket:', error);
      
      // Add notification
      addNotification({
        type: 'error',
        title: 'WebSocket Error',
        message: 'Failed to connect to WebSocket server',
      });
    }
  }, [addNotification, maxReconnectAttempts, reconnectInterval]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Reset state
    setStatus('closed');
    reconnectAttemptsRef.current = 0;
  }, []);
  
  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    if (url) {
      disconnect();
      connect(url);
    }
  }, [connect, disconnect, url]);
  
  // Subscribe to a topic
  const subscribe = useCallback(<T,>(topic: string, callback: (data: T) => void): string => {
    // Generate subscription ID
    const id = `subscription-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Store subscription
    subscriptionsRef.current.set(id, {
      topic,
      id,
      callback,
    });
    
    // Send subscribe message if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      send('subscribe', { topic });
    }
    
    return id;
  }, []);
  
  // Unsubscribe from a topic
  const unsubscribe = useCallback((id: string) => {
    // Get subscription
    const subscription = subscriptionsRef.current.get(id);
    
    if (subscription) {
      // Send unsubscribe message if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        send('unsubscribe', { topic: subscription.topic });
      }
      
      // Remove subscription
      subscriptionsRef.current.delete(id);
    }
  }, []);
  
  // Send a message
  const send = useCallback(<T,>(type: string, data?: T) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
      }));
    }
  }, []);
  
  // Auto connect
  useEffect(() => {
    if (autoConnect && initialUrl) {
      connect(initialUrl);
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect, initialUrl]);
  
  // Context value
  const value: WebSocketContextType = {
    status,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    reconnect,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook for using WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
};