import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketBatcher } from '../utils/websocketBatcher';
import { WebSocketStatus, WebSocketSubscription } from '../utils/types';

interface WebSocketContextType {
  connected: boolean;
  connecting: boolean;
  status: WebSocketStatus;
  subscribe: (topic: string, callback: (data: any) => void) => string;
  unsubscribe: (id: string) => void;
  send: (message: any) => void;
  reconnect: () => void;
  lastError: Error | null;
}

interface WebSocketProviderProps {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  children: React.ReactNode;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
  children
}) => {
  // State
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const batcherRef = useRef<WebSocketBatcher | null>(null);
  const subscriptionsRef = useRef<Map<string, WebSocketSubscription>>(new Map());
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (batcherRef.current) {
      batcherRef.current.restore();
      batcherRef.current = null;
    }
    
    // Set connecting state
    setConnecting(true);
    setStatus('connecting');
    
    try {
      // Create new WebSocket connection
      const socket = new WebSocket(url);
      
      // Set up event handlers
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setConnecting(false);
        setStatus('open');
        reconnectAttemptsRef.current = 0;
        
        // Resubscribe to topics
        subscriptionsRef.current.forEach((subscription) => {
          socket.send(JSON.stringify({
            type: 'subscribe',
            topic: subscription.topic
          }));
        });
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket closed', event);
        setConnected(false);
        setStatus('closed');
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error', error);
        setLastError(new Error('WebSocket connection error'));
        setStatus('error');
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          switch (message.type) {
            case 'ping':
              // Respond to ping with pong
              socket.send(JSON.stringify({ type: 'pong' }));
              break;
              
            case 'message':
              // Handle message
              if (message.topic && message.data) {
                // Find subscriptions for this topic
                subscriptionsRef.current.forEach((subscription) => {
                  if (subscription.topic === message.topic) {
                    subscription.callback(message.data);
                  }
                });
              }
              break;
              
            case 'batch':
              // Handle batch of messages
              if (message.messages && Array.isArray(message.messages)) {
                message.messages.forEach((msg: any) => {
                  if (msg.topic && msg.data) {
                    // Find subscriptions for this topic
                    subscriptionsRef.current.forEach((subscription) => {
                      if (subscription.topic === msg.topic) {
                        subscription.callback(msg.data);
                      }
                    });
                  }
                });
              }
              break;
              
            case 'error':
              // Handle error
              console.error('WebSocket message error', message.error);
              setLastError(new Error(message.error || 'Unknown WebSocket error'));
              break;
              
            default:
              // Handle unknown message type
              console.warn('Unknown WebSocket message type', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message', error);
        }
      };
      
      // Store socket reference
      socketRef.current = socket;
      
      // Create WebSocket batcher
      batcherRef.current = new WebSocketBatcher(socket, {
        batchInterval: 50,
        maxBatchSize: 100,
        useCompression: false, // Add the missing property
        noBatchTypes: ['ping', 'pong', 'subscribe', 'unsubscribe', 'auth']
      });
    } catch (error) {
      console.error('Error creating WebSocket connection', error);
      setConnecting(false);
      setStatus('error');
      setLastError(error instanceof Error ? error : new Error('Failed to create WebSocket connection'));
      
      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, reconnectInterval);
      }
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);
  
  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);
  
  // Subscribe to a topic
  const subscribe = useCallback((topic: string, callback: (data: any) => void): string => {
    // Generate subscription ID
    const id = `${topic}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store subscription
    subscriptionsRef.current.set(id, { topic, id, callback });
    
    // Send subscribe message if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'subscribe',
        topic
      }));
    }
    
    return id;
  }, []);
  
  // Unsubscribe from a topic
  const unsubscribe = useCallback((id: string): void => {
    // Get subscription
    const subscription = subscriptionsRef.current.get(id);
    
    if (subscription) {
      // Send unsubscribe message if connected
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'unsubscribe',
          topic: subscription.topic
        }));
      }
      
      // Remove subscription
      subscriptionsRef.current.delete(id);
    }
  }, []);
  
  // Send a message
  const send = useCallback((message: any): void => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Use batcher if available
      if (batcherRef.current) {
        batcherRef.current.send(message);
      } else {
        // Send directly
        socketRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      }
    } else {
      console.warn('WebSocket not connected, message not sent', message);
    }
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      // Close WebSocket connection
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      // Restore batcher
      if (batcherRef.current) {
        batcherRef.current.restore();
        batcherRef.current = null;
      }
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Clear subscriptions
      subscriptionsRef.current.clear();
    };
  }, [connect, url]);
  
  // Context value
  const value: WebSocketContextType = {
    connected,
    connecting,
    status,
    subscribe,
    unsubscribe,
    send,
    reconnect,
    lastError
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

// Default WebSocket provider with environment-specific URL
export const DefaultWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get WebSocket URL from environment
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
  
  return (
    <WebSocketProvider url={wsUrl}>
      {children}
    </WebSocketProvider>
  );
};