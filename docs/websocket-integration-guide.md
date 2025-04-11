# DarkSwap WebSocket Integration Guide

This guide provides instructions for integrating the DarkSwap WebSocket API into your application. The WebSocket API enables real-time updates for orders, trades, wallet balances, and more.

## Prerequisites

- Node.js 14.x or later
- Socket.IO Client 4.x or later

## Installation

Install the Socket.IO client:

```bash
npm install socket.io-client
```

## Basic Integration

### Connecting to the WebSocket Server

```javascript
import { io } from 'socket.io-client';

// Connect to the WebSocket server
const socket = io('https://api.darkswap.io', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket server:', reason);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Authentication

```javascript
// Authenticate with the WebSocket server
function authenticate(token) {
  socket.emit('authenticate', { token });
}

// Handle authentication events
socket.on('authentication_success', (data) => {
  console.log('Authentication successful:', data);
});

socket.on('authentication_failure', (data) => {
  console.error('Authentication failed:', data);
});

// Authenticate with a JWT token
authenticate('your-jwt-token');
```

### Subscribing to Channels

```javascript
// Subscribe to a channel
function subscribe(channel, params) {
  socket.emit('subscribe', { channel, params });
}

// Handle subscription events
socket.on('subscription_success', (data) => {
  console.log('Subscription successful:', data);
});

socket.on('subscription_failure', (data) => {
  console.error('Subscription failed:', data);
});

// Subscribe to the orderbook channel
subscribe('orderbook', { baseAsset: 'BTC', quoteAsset: 'ETH' });
```

### Unsubscribing from Channels

```javascript
// Unsubscribe from a channel
function unsubscribe(channel, params) {
  socket.emit('unsubscribe', { channel, params });
}

// Unsubscribe from the orderbook channel
unsubscribe('orderbook', { baseAsset: 'BTC', quoteAsset: 'ETH' });
```

### Handling Events

```javascript
// Handle orderbook updates
socket.on('orderbook_update', (data) => {
  console.log('Orderbook update:', data);
});

// Handle trade events
socket.on('trade_created', (data) => {
  console.log('Trade created:', data);
});

// Handle order events
socket.on('order_created', (data) => {
  console.log('Order created:', data);
});

socket.on('order_updated', (data) => {
  console.log('Order updated:', data);
});

socket.on('order_cancelled', (data) => {
  console.log('Order cancelled:', data);
});

// Handle wallet events
socket.on('balance_update', (data) => {
  console.log('Balance update:', data);
});

socket.on('transaction_created', (data) => {
  console.log('Transaction created:', data);
});

socket.on('transaction_updated', (data) => {
  console.log('Transaction updated:', data);
});

// Handle P2P events
socket.on('peer_connected', (data) => {
  console.log('Peer connected:', data);
});

socket.on('peer_disconnected', (data) => {
  console.log('Peer disconnected:', data);
});

socket.on('message_received', (data) => {
  console.log('Message received:', data);
});
```

### Disconnecting

```javascript
// Disconnect from the WebSocket server
function disconnect() {
  socket.disconnect();
}

// Disconnect when the application is closed
window.addEventListener('beforeunload', () => {
  disconnect();
});
```

## Advanced Integration

### WebSocket Client Class

Create a WebSocket client class to encapsulate the WebSocket functionality:

```javascript
import { io } from 'socket.io-client';

class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      ...options,
    };
    this.socket = io(this.url, this.options);
    this.authenticated = false;
    this.subscriptions = [];
    this.eventHandlers = new Map();
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.emit('connect');
      
      // Authenticate if we have a token
      const token = localStorage.getItem('token');
      if (token) {
        this.authenticate(token);
      }
      
      // Resubscribe to channels
      this.resubscribe();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      this.emit('disconnect', reason);
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
    
    this.socket.on('authentication_success', (data) => {
      console.log('Authentication successful:', data);
      this.authenticated = true;
      this.emit('authentication_success', data);
    });
    
    this.socket.on('authentication_failure', (data) => {
      console.error('Authentication failed:', data);
      this.authenticated = false;
      this.emit('authentication_failure', data);
    });
    
    this.socket.on('subscription_success', (data) => {
      console.log('Subscription successful:', data);
      this.emit('subscription_success', data);
    });
    
    this.socket.on('subscription_failure', (data) => {
      console.error('Subscription failed:', data);
      this.emit('subscription_failure', data);
    });
    
    // Add handlers for other events
    const events = [
      'order_created',
      'order_updated',
      'order_cancelled',
      'trade_created',
      'trade_updated',
      'trade_cancelled',
      'orderbook_update',
      'ticker_update',
      'price_update',
      'balance_update',
      'transaction_created',
      'transaction_updated',
      'peer_connected',
      'peer_disconnected',
      'message_received',
    ];
    
    for (const event of events) {
      this.socket.on(event, (data) => {
        this.emit(event, data);
      });
    }
  }
  
  connect() {
    this.socket.connect();
  }
  
  disconnect() {
    this.socket.disconnect();
  }
  
  authenticate(token) {
    this.socket.emit('authenticate', { token });
  }
  
  subscribe(channel, params) {
    this.subscriptions.push({ channel, params });
    this.socket.emit('subscribe', { channel, params });
  }
  
  unsubscribe(channel, params) {
    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.channel !== channel ||
        JSON.stringify(subscription.params) !== JSON.stringify(params)
    );
    this.socket.emit('unsubscribe', { channel, params });
  }
  
  resubscribe() {
    for (const subscription of this.subscriptions) {
      this.socket.emit('subscribe', subscription);
    }
  }
  
  on(event, handler) {
    let handlers = this.eventHandlers.get(event);
    
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    
    handlers.add(handler);
  }
  
  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    
    if (!handlers) {
      return;
    }
    
    handlers.delete(handler);
    
    if (handlers.size === 0) {
      this.eventHandlers.delete(event);
    }
  }
  
  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    
    if (!handlers) {
      return;
    }
    
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in WebSocket event handler:', error);
      }
    }
  }
  
  isConnected() {
    return this.socket.connected;
  }
  
  isAuthenticated() {
    return this.authenticated;
  }
  
  getSocket() {
    return this.socket;
  }
}

// Create a singleton instance
let instance = null;

export function getWebSocketClient(options) {
  if (!instance && options) {
    instance = new WebSocketClient('https://api.darkswap.io', options);
  }
  
  if (!instance) {
    throw new Error('WebSocket client not initialized');
  }
  
  return instance;
}

export function initWebSocketClient(options) {
  instance = new WebSocketClient('https://api.darkswap.io', options);
  return instance;
}
```

### React Context Integration

Create a React context to provide WebSocket functionality to your components:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initWebSocketClient, getWebSocketClient } from './WebSocketClient';

// Create the WebSocket context
const WebSocketContext = createContext({
  client: null,
  connected: false,
  authenticated: false,
  connect: () => {},
  disconnect: () => {},
  authenticate: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
});

// WebSocket provider
export const WebSocketProvider = ({ url, children }) => {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    try {
      const webSocketClient = initWebSocketClient({ url });
      
      setClient(webSocketClient);
      setConnected(webSocketClient.isConnected());
      setAuthenticated(webSocketClient.isAuthenticated());
      
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
      
      return () => {
        webSocketClient.disconnect();
      };
    } catch (error) {
      console.error('Error initializing WebSocket client:', error);
    }
  }, [url]);
  
  const connect = () => {
    if (client) {
      client.connect();
    }
  };
  
  const disconnect = () => {
    if (client) {
      client.disconnect();
    }
  };
  
  const authenticate = (token) => {
    if (client) {
      client.authenticate(token);
    }
  };
  
  const subscribe = (channel, params) => {
    if (client) {
      client.subscribe(channel, params);
    }
  };
  
  const unsubscribe = (channel, params) => {
    if (client) {
      client.unsubscribe(channel, params);
    }
  };
  
  return (
    <WebSocketContext.Provider
      value={{
        client,
        connected,
        authenticated,
        connect,
        disconnect,
        authenticate,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// Hook to subscribe to a WebSocket event
export const useWebSocketEvent = (event, callback) => {
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
export const useWebSocketSubscription = (channel, params) => {
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
```

### Using the React Context

```javascript
import React from 'react';
import { WebSocketProvider, useWebSocket, useWebSocketEvent } from './WebSocketContext';

// App component
const App = () => {
  return (
    <WebSocketProvider url="https://api.darkswap.io">
      <Dashboard />
    </WebSocketProvider>
  );
};

// Dashboard component
const Dashboard = () => {
  const { connected, authenticated, authenticate } = useWebSocket();
  
  // Handle authentication
  const handleAuthenticate = () => {
    const token = localStorage.getItem('token');
    if (token) {
      authenticate(token);
    }
  };
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Connection status: {connected ? 'Connected' : 'Disconnected'}</p>
      <p>Authentication status: {authenticated ? 'Authenticated' : 'Not authenticated'}</p>
      <button onClick={handleAuthenticate}>Authenticate</button>
      
      <Orderbook baseAsset="BTC" quoteAsset="ETH" />
    </div>
  );
};

// Orderbook component
const Orderbook = ({ baseAsset, quoteAsset }) => {
  const [orderbook, setOrderbook] = React.useState({ bids: [], asks: [] });
  
  // Subscribe to orderbook updates
  useWebSocketEvent('orderbook_update', (data) => {
    if (data.baseAsset === baseAsset && data.quoteAsset === quoteAsset) {
      setOrderbook({
        bids: data.bids,
        asks: data.asks,
      });
    }
  });
  
  return (
    <div>
      <h2>Orderbook</h2>
      <h3>Bids</h3>
      <ul>
        {orderbook.bids.map((bid, index) => (
          <li key={index}>
            Price: {bid.price}, Amount: {bid.amount}, Total: {bid.total}
          </li>
        ))}
      </ul>
      <h3>Asks</h3>
      <ul>
        {orderbook.asks.map((ask, index) => (
          <li key={index}>
            Price: {ask.price}, Amount: {ask.amount}, Total: {ask.total}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
```

## Best Practices

### Reconnection Strategy

Implement a robust reconnection strategy to handle disconnections:

```javascript
const socket = io('https://api.darkswap.io', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```

### Authentication

Authenticate as soon as the connection is established:

```javascript
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Authenticate with the WebSocket server
  const token = localStorage.getItem('token');
  if (token) {
    socket.emit('authenticate', { token });
  }
});
```

### Subscription Management

Only subscribe to the channels you need:

```javascript
// Subscribe to channels based on the current view
function subscribeToChannels(view) {
  switch (view) {
    case 'orderbook':
      socket.emit('subscribe', { channel: 'orderbook', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
      break;
    case 'trades':
      socket.emit('subscribe', { channel: 'trades', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
      break;
    case 'wallet':
      socket.emit('subscribe', { channel: 'wallet' });
      break;
    default:
      break;
  }
}
```

### Error Handling

Handle errors gracefully:

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  
  // Show an error message to the user
  showErrorMessage('WebSocket error: ' + error.message);
  
  // Try to reconnect
  setTimeout(() => {
    socket.connect();
  }, 5000);
});
```

### Disconnection

Disconnect when you're done to free up resources:

```javascript
// Disconnect when the component is unmounted
useEffect(() => {
  return () => {
    socket.disconnect();
  };
}, []);
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the WebSocket server:

1. Check that the WebSocket server URL is correct.
2. Ensure that your network allows WebSocket connections.
3. Check for any CORS issues in the browser console.
4. Verify that the WebSocket server is running.

### Authentication Issues

If you're having trouble authenticating:

1. Check that the JWT token is valid.
2. Ensure that the token has not expired.
3. Verify that the token is being sent correctly.

### Subscription Issues

If you're not receiving updates for a channel:

1. Check that you've subscribed to the correct channel.
2. Ensure that the subscription parameters are correct.
3. Verify that the WebSocket server is publishing updates for the channel.

## Conclusion

This guide provides a comprehensive overview of integrating the DarkSwap WebSocket API into your application. By following these instructions, you can add real-time updates to your application and provide a better user experience.

For more information, see the [WebSocket API Documentation](./websocket-api.md).