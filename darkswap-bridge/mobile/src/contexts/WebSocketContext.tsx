import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import WebSocketService, { WebSocketEvent } from '../services/WebSocketService';
import { useAuth } from './AuthContext';

// Define WebSocket context type
export interface WebSocketContextType {
  connected: boolean;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  addEventListener: (eventType: string, listener: (event: WebSocketEvent) => void) => void;
  removeEventListener: (eventType: string, listener: (event: WebSocketEvent) => void) => void;
}

// Create WebSocket context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
}

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState<boolean>(false);

  // Connect to WebSocket server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const connectWebSocket = async () => {
        try {
          await WebSocketService.connect();
        } catch (error) {
          console.error('Error connecting to WebSocket server:', error);
        }
      };

      connectWebSocket();
    } else {
      WebSocketService.disconnect();
    }
  }, [isAuthenticated]);

  // Add connection listener
  useEffect(() => {
    const handleConnectionChange = (isConnected: boolean) => {
      setConnected(isConnected);
    };

    WebSocketService.addConnectionListener(handleConnectionChange);

    return () => {
      WebSocketService.removeConnectionListener(handleConnectionChange);
    };
  }, []);

  // Subscribe to a topic
  const subscribe = (topic: string) => {
    WebSocketService.subscribe(topic);
  };

  // Unsubscribe from a topic
  const unsubscribe = (topic: string) => {
    WebSocketService.unsubscribe(topic);
  };

  // Add event listener
  const addEventListener = (eventType: string, listener: (event: WebSocketEvent) => void) => {
    WebSocketService.addEventListener(eventType, listener);
  };

  // Remove event listener
  const removeEventListener = (eventType: string, listener: (event: WebSocketEvent) => void) => {
    WebSocketService.removeEventListener(eventType, listener);
  };

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        subscribe,
        unsubscribe,
        addEventListener,
        removeEventListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};