import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Define WebSocket event type
export interface WebSocketEvent {
  event_type: string;
  data: any;
}

// Define WebSocket context type
interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  events: WebSocketEvent[];
  lastEvent: WebSocketEvent | null;
}

// Create WebSocket context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
}

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  // Connect to WebSocket server
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Create socket connection
    const socketUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    const socketOptions = {
      auth: {
        token,
      },
      transports: ['websocket'],
      autoConnect: true,
    };

    const newSocket = io(socketUrl, socketOptions);

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    newSocket.on('message', (event: WebSocketEvent) => {
      console.log('WebSocket message:', event);
      setEvents((prevEvents) => [...prevEvents, event]);
      setLastEvent(event);
    });

    // Save socket instance
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Subscribe to a topic
  const subscribe = (topic: string) => {
    if (socket && connected) {
      socket.emit('subscribe', { topic });
    }
  };

  // Unsubscribe from a topic
  const unsubscribe = (topic: string) => {
    if (socket && connected) {
      socket.emit('unsubscribe', { topic });
    }
  };

  // Return provider
  return (
    <WebSocketContext.Provider
      value={{
        socket,
        connected,
        subscribe,
        unsubscribe,
        events,
        lastEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};