import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNotification } from './NotificationContext';

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, data: any) => void;
  on: (type: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  connect: () => {},
  disconnect: () => {},
  send: () => {},
  on: () => () => {},
});

interface WebSocketProviderProps {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url = 'ws://localhost:8080/ws',
  autoConnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
  children,
}) => {
  const { addNotification } = useNotification();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(null);
  const [eventListeners] = useState<Map<string, Set<(data: any) => void>>>(new Map());
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }
    
    // Don't connect if already connected or connecting
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // Set connecting state
    setConnecting(true);
    setError(null);
    
    // Create new WebSocket
    const newSocket = new WebSocket(url);
    
    // Set up event handlers
    newSocket.onopen = () => {
      setConnected(true);
      setConnecting(false);
      setReconnectAttempts(0);
      addNotification({
        type: 'success',
        title: 'WebSocket Connected',
        message: 'Connected to WebSocket server',
      });
    };
    
    newSocket.onclose = (event) => {
      setConnected(false);
      setConnecting(false);
      
      // Don't attempt to reconnect if the close was clean
      if (event.wasClean) {
        return;
      }
      
      // Attempt to reconnect if not at max attempts
      if (reconnectAttempts < maxReconnectAttempts) {
        const timer = setTimeout(() => {
          setReconnectAttempts(prevAttempts => prevAttempts + 1);
          connect();
        }, reconnectInterval);
        
        setReconnectTimer(timer);
        
        addNotification({
          type: 'warning',
          title: 'WebSocket Disconnected',
          message: `Connection lost. Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`,
        });
      } else {
        setError(new Error('Max reconnect attempts reached'));
        addNotification({
          type: 'error',
          title: 'WebSocket Error',
          message: 'Failed to connect to WebSocket server after multiple attempts',
        });
      }
    };
    
    newSocket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError(new Error('WebSocket error'));
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;
        
        // Dispatch message to listeners
        const listeners = eventListeners.get(type);
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error(`Error in WebSocket listener for ${type}:`, error);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // Set socket
    setSocket(newSocket);
  }, [url, socket, reconnectTimer, reconnectAttempts, maxReconnectAttempts, reconnectInterval, eventListeners, addNotification]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clear any existing reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }
    
    // Close socket if it exists
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
      setConnecting(false);
    }
  }, [socket, reconnectTimer]);
  
  // Send message to WebSocket
  const send = useCallback((type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket not connected');
    }
  }, [socket]);
  
  // Add event listener
  const on = useCallback((type: string, callback: (data: any) => void) => {
    // Get or create listeners set
    let listeners = eventListeners.get(type);
    if (!listeners) {
      listeners = new Set();
      eventListeners.set(type, listeners);
    }
    
    // Add listener
    listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListeners.delete(type);
        }
      }
    };
  }, [eventListeners]);
  
  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Disconnect on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  return (
    <WebSocketContext.Provider value={{
      socket,
      connected,
      connecting,
      error,
      connect,
      disconnect,
      send,
      on,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

export default WebSocketContext;