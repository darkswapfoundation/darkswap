import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import WebSocketClient, { WebSocketMessage } from '../utils/WebSocketClient';

// Define the WebSocket context type
interface WebSocketContextType {
  wsClient: WebSocketClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, payload: any) => void;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Define the WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  autoConnect?: boolean;
}

/**
 * WebSocket provider component
 * @param props Component props
 * @returns WebSocket provider component
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
  autoConnect = true,
}) => {
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the WebSocket client
  useEffect(() => {
    const client = new WebSocketClient(url, reconnectInterval, maxReconnectAttempts);

    // Set up event listeners
    client.on('connected', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    client.on('disconnected', () => {
      setIsConnected(false);
    });

    client.on('reconnecting', () => {
      setIsConnecting(true);
    });

    client.on('reconnect_failed', () => {
      setIsConnecting(false);
      setError(new Error('Failed to reconnect to WebSocket server'));
    });

    client.on('error', (event: Event) => {
      setError(new Error('WebSocket error'));
    });

    setWsClient(client);

    // Connect to the WebSocket server if autoConnect is true
    if (autoConnect) {
      setIsConnecting(true);
      client.connect();
    }

    // Clean up
    return () => {
      client.disconnect();
    };
  }, [url, reconnectInterval, maxReconnectAttempts, autoConnect]);

  // Connect to the WebSocket server
  const connect = () => {
    if (wsClient && !isConnected && !isConnecting) {
      setIsConnecting(true);
      wsClient.connect();
    }
  };

  // Disconnect from the WebSocket server
  const disconnect = () => {
    if (wsClient) {
      wsClient.disconnect();
    }
  };

  // Send a message to the WebSocket server
  const send = (type: string, payload: any) => {
    if (wsClient && isConnected) {
      wsClient.send(type, payload);
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
    }
  };

  // Create the context value
  const contextValue: WebSocketContextType = {
    wsClient,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    send,
  };

  // Return the WebSocket provider
  return React.createElement(
    WebSocketContext.Provider,
    { value: contextValue },
    children
  );
};

/**
 * Hook to use the WebSocket client
 * @returns WebSocket client
 */
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);

  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
};

/**
 * Hook to use WebSocket events
 * @param eventType Event type
 * @param callback Event callback
 */
export const useWebSocketEvent = <T extends {}>(
  eventType: string,
  callback: (data: T) => void
) => {
  const { wsClient } = useWebSocket();

  useEffect(() => {
    if (!wsClient) {
      return;
    }

    // Add event listener
    wsClient.on(eventType, callback);

    // Clean up
    return () => {
      wsClient.off(eventType, callback);
    };
  }, [wsClient, eventType, callback]);
};

/**
 * Hook to send WebSocket messages
 * @param eventType Event type
 * @returns Function to send messages
 */
export const useWebSocketSend = (eventType: string) => {
  const { send } = useWebSocket();

  return (payload: any) => {
    send(eventType, payload);
  };
};

export default WebSocketContext;