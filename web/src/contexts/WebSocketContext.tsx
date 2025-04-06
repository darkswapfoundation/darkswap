import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface WebSocketContextType {
  connect: () => void;
  disconnect: () => void;
  send: (message: any) => void;
  subscribe: (channel: string, callback: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
  connected: boolean;
  message: any;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<any>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Record<string, (data: any) => void>>({});

  const connect = useCallback(() => {
    if (ws) {
      ws.close();
    }

    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setReconnectAttempts(0);
      
      // Resubscribe to channels
      Object.keys(subscriptions).forEach(channel => {
        socket.send(JSON.stringify({ type: 'subscribe', channel }));
      });
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Attempt to reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, reconnectInterval);
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessage(data);
        
        // Handle subscriptions
        if (data.channel && subscriptions[data.channel]) {
          subscriptions[data.channel](data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(socket);
  }, [url, reconnectAttempts, maxReconnectAttempts, reconnectInterval, subscriptions]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setConnected(false);
    }
  }, [ws]);

  const send = useCallback((message: any) => {
    if (ws && connected) {
      ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }, [ws, connected]);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    setSubscriptions(prev => ({ ...prev, [channel]: callback }));
    
    if (ws && connected) {
      send({ type: 'subscribe', channel });
    }
  }, [ws, connected, send]);

  const unsubscribe = useCallback((channel: string) => {
    setSubscriptions(prev => {
      const newSubscriptions = { ...prev };
      delete newSubscriptions[channel];
      return newSubscriptions;
    });
    
    if (ws && connected) {
      send({ type: 'unsubscribe', channel });
    }
  }, [ws, connected, send]);

  useEffect(() => {
    connect();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const value = {
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    connected,
    message,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};