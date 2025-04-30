import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebSocketClient, WebSocketChannelType, WebSocketEventType, initWebSocketClient } from '../utils/WebSocketClient';

// WebSocket context interface
interface WebSocketContextInterface {
  client: WebSocketClient | null;
  connected: boolean;
  authenticated: boolean;
  connect: () => void;
  disconnect: () => void;
  authenticate: (token: string) => void;
  subscribe: (channel: WebSocketChannelType, params?: Record<string, string>) => void;
  unsubscribe: (channel: WebSocketChannelType, params?: Record<string, string>) => void;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextInterface>({
  client: null,
  connected: false,
  authenticated: false,
  connect: () => {},
  disconnect: () => {},
  authenticate: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

// WebSocket provider props
interface WebSocketProviderProps {
  url: string;
  children: React.ReactNode;
}

// WebSocket provider
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ url, children }) => {
  // State
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  
  // Initialize the WebSocket client
  useEffect(() => {
    try {
      // Initialize the WebSocket client
      const webSocketClient = initWebSocketClient({ url });
      
      // Set the client
      setClient(webSocketClient);
      
      // Set the initial connection state
      setConnected(webSocketClient.isConnected());
      
      // Set the initial authentication state
      setAuthenticated(webSocketClient.isAuthenticated());
      
      // Add event handlers
      webSocketClient.on('connect', () => {
        setConnected(true);
      });
      
      webSocketClient.on('disconnect', () => {
        setConnected(false);
      });
      
      webSocketClient.on('authentication_success', () => {
        setAuthenticated(true);
      });
      
      webSocketClient.on('authentication_failure', () => {
        setAuthenticated(false);
      });
      
      // Clean up
      return () => {
        webSocketClient.disconnect();
      };
    } catch (error) {
      console.error('Error initializing WebSocket client:', error);
    }
  }, [url]);
  
  // Connect to the WebSocket server
  const connect = () => {
    if (client) {
      client.connect();
    }
  };
  
  // Disconnect from the WebSocket server
  const disconnect = () => {
    if (client) {
      client.disconnect();
    }
  };
  
  // Authenticate with the WebSocket server
  const authenticate = (token: string) => {
    if (client) {
      client.authenticate(token);
    }
  };
  
  // Subscribe to a channel
  const subscribe = (channel: WebSocketChannelType, params?: Record<string, string>) => {
    if (client) {
      client.subscribe(channel, params);
    }
  };
  
  // Unsubscribe from a channel
  const unsubscribe = (channel: WebSocketChannelType, params?: Record<string, string>) => {
    if (client) {
      client.unsubscribe(channel, params);
    }
  };
  
  // Context value
  const contextValue: WebSocketContextInterface = {
    client,
    connected,
    authenticated,
    connect,
    disconnect,
    authenticate,
    subscribe,
    unsubscribe,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// Hook to subscribe to a WebSocket event
export const useWebSocketEvent = <T extends any>(
  event: WebSocketEventType | string,
  callback: (data: T) => void
) => {
  const { client } = useWebSocket();
  
  useEffect(() => {
    if (client) {
      client.on(event, callback);
      
      return () => {
        client.off(event, callback);
      };
    }
  }, [client, event, callback]);
};

// Hook to subscribe to a WebSocket channel
export const useWebSocketSubscription = (
  channel: WebSocketChannelType,
  params?: Record<string, string>
) => {
  const { client, subscribe, unsubscribe } = useWebSocket();
  
  useEffect(() => {
    if (client) {
      subscribe(channel, params);
      
      return () => {
        unsubscribe(channel, params);
      };
    }
  }, [client, channel, params, subscribe, unsubscribe]);
};

// Hook to use orderbook data
export const useOrderbook = (baseAsset: string, quoteAsset: string) => {
  const [orderbook, setOrderbook] = useState<{
    bids: any[];
    asks: any[];
    timestamp: Date | null;
  }>({
    bids: [],
    asks: [],
    timestamp: null,
  });
  
  // Subscribe to the orderbook channel
  useWebSocketSubscription(WebSocketChannelType.ORDERBOOK, { baseAsset, quoteAsset });
  
  // Handle orderbook updates
  useWebSocketEvent<{
    baseAsset: string;
    quoteAsset: string;
    bids: any[];
    asks: any[];
    timestamp: string;
  }>(WebSocketEventType.ORDERBOOK_UPDATE, (data) => {
    // Check if the update is for the correct trading pair
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset) {
      setOrderbook({
        bids: data.bids,
        asks: data.asks,
        timestamp: new Date(data.timestamp),
      });
    }
  });
  
  return orderbook;
};

// Hook to use ticker data
export const useTicker = (baseAsset: string, quoteAsset: string) => {
  const [ticker, setTicker] = useState<{
    pair: string;
    last: string;
    bid: string;
    ask: string;
    volume: string;
    change24h: string;
    timestamp: Date | null;
  }>({
    pair: `${baseAsset}/${quoteAsset}`,
    last: '0',
    bid: '0',
    ask: '0',
    volume: '0',
    change24h: '0',
    timestamp: null,
  });
  
  // Subscribe to the ticker channel
  useWebSocketSubscription(WebSocketChannelType.TICKER, { baseAsset, quoteAsset });
  
  // Handle ticker updates
  useWebSocketEvent<{
    pair: string;
    last: string;
    bid: string;
    ask: string;
    volume: string;
    change24h: string;
    timestamp: string;
  }>(WebSocketEventType.TICKER_UPDATE, (data) => {
    // Check if the update is for the correct trading pair
    if (data.pair === `${baseAsset}/${quoteAsset}`) {
      setTicker({
        ...data,
        timestamp: new Date(data.timestamp),
      });
    }
  });
  
  return ticker;
};

// Hook to use trades data
export const useTrades = (baseAsset: string, quoteAsset: string) => {
  const [trades, setTrades] = useState<any[]>([]);
  
  // Subscribe to the trades channel
  useWebSocketSubscription(WebSocketChannelType.TRADES, { baseAsset, quoteAsset });
  
  // Handle trade updates
  useWebSocketEvent<any>(WebSocketEventType.TRADE_CREATED, (data) => {
    // Check if the update is for the correct trading pair
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset) {
      setTrades((prevTrades) => [data, ...prevTrades].slice(0, 100));
    }
  });
  
  return trades;
};

// Hook to use wallet balance
export const useWalletBalance = () => {
  const [balance, setBalance] = useState<Record<string, string>>({});
  
  // Subscribe to the wallet channel
  useWebSocketSubscription(WebSocketChannelType.WALLET);
  
  // Handle balance updates
  useWebSocketEvent<{ balance: Record<string, string> }>(
    WebSocketEventType.BALANCE_UPDATE,
    (data) => {
      setBalance(data.balance);
    }
  );
  
  return balance;
};

// Hook to use user orders
export const useUserOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  
  // Subscribe to the orders channel
  useWebSocketSubscription(WebSocketChannelType.ORDERS);
  
  // Handle order updates
  useWebSocketEvent<{ orders: any[] }>(WebSocketEventType.ORDER_CREATED, (data) => {
    if (data.orders) {
      setOrders(data.orders);
    } else {
      setOrders((prevOrders) => [data, ...prevOrders]);
    }
  });
  
  useWebSocketEvent<any>(WebSocketEventType.ORDER_UPDATED, (data) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === data.id ? data : order))
    );
  });
  
  useWebSocketEvent<any>(WebSocketEventType.ORDER_CANCELLED, (data) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === data.id ? data : order))
    );
  });
  
  return orders;
};

// Hook to use user trades
export const useUserTrades = () => {
  const [trades, setTrades] = useState<any[]>([]);
  
  // Subscribe to the trades_private channel
  useWebSocketSubscription(WebSocketChannelType.TRADES_PRIVATE);
  
  // Handle trade updates
  useWebSocketEvent<{ trades: any[] }>(WebSocketEventType.TRADE_CREATED, (data) => {
    if (data.trades) {
      setTrades(data.trades);
    } else {
      setTrades((prevTrades) => [data, ...prevTrades]);
    }
  });
  
  useWebSocketEvent<any>(WebSocketEventType.TRADE_UPDATED, (data) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => (trade.id === data.id ? data : trade))
    );
  });
  
  useWebSocketEvent<any>(WebSocketEventType.TRADE_CANCELLED, (data) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => (trade.id === data.id ? data : trade))
    );
  });
  
  return trades;
};

// Hook to use P2P network status
export const useP2PNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<{
    connected: boolean;
    peerCount: number;
    uptime: number;
    messages: {
      sent: number;
      received: number;
    };
  }>({
    connected: false,
    peerCount: 0,
    uptime: 0,
    messages: {
      sent: 0,
      received: 0,
    },
  });
  
  // Subscribe to the P2P channel
  useWebSocketSubscription(WebSocketChannelType.P2P);
  
  // Handle P2P network status updates
  useWebSocketEvent<{
    connected: boolean;
    peerCount: number;
    uptime: number;
    messages: {
      sent: number;
      received: number;
    };
  }>(WebSocketEventType.PEER_CONNECTED, (data) => {
    setNetworkStatus(data);
  });
  
  return networkStatus;
};

// Hook to use P2P peer list
export const useP2PPeerList = () => {
  const [peers, setPeers] = useState<any[]>([]);
  
  // Subscribe to the P2P channel
  useWebSocketSubscription(WebSocketChannelType.P2P);
  
  // Handle P2P peer list updates
  useWebSocketEvent<{ peers: any[] }>(WebSocketEventType.PEER_CONNECTED, (data) => {
    if (data.peers) {
      setPeers(data.peers);
    }
  });
  
  return peers;
};