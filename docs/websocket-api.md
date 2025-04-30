# DarkSwap WebSocket API Documentation

This document describes the WebSocket API for the DarkSwap application. The WebSocket API provides real-time updates for orders, trades, wallet balances, and more.

## Connection

Connect to the WebSocket server using Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.darkswap.io');
```

## Authentication

Authenticate with the WebSocket server using a JWT token:

```javascript
socket.emit('authenticate', { token: 'your-jwt-token' });
```

The server will respond with an authentication success or failure event:

```javascript
socket.on('authentication_success', (data) => {
  console.log('Authentication successful:', data);
});

socket.on('authentication_failure', (data) => {
  console.error('Authentication failed:', data);
});
```

## Subscriptions

Subscribe to channels to receive real-time updates:

```javascript
socket.emit('subscribe', { channel: 'orderbook', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
```

The server will respond with a subscription success or failure event:

```javascript
socket.on('subscription_success', (data) => {
  console.log('Subscription successful:', data);
});

socket.on('subscription_failure', (data) => {
  console.error('Subscription failed:', data);
});
```

Unsubscribe from channels when you no longer need updates:

```javascript
socket.emit('unsubscribe', { channel: 'orderbook', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
```

## Channels

### Public Channels

#### Ticker Channel

Subscribe to the ticker channel to receive ticker updates for a trading pair:

```javascript
socket.emit('subscribe', { channel: 'ticker', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
```

Listen for ticker updates:

```javascript
socket.on('ticker_update', (data) => {
  console.log('Ticker update:', data);
});
```

Ticker update data format:

```javascript
{
  pair: 'BTC/ETH',
  last: '10.0',
  bid: '9.9',
  ask: '10.1',
  volume: '100.0',
  change24h: '5.0',
  timestamp: '2025-04-10T13:00:00.000Z'
}
```

#### Orderbook Channel

Subscribe to the orderbook channel to receive orderbook updates for a trading pair:

```javascript
socket.emit('subscribe', { channel: 'orderbook', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
```

Listen for orderbook updates:

```javascript
socket.on('orderbook_update', (data) => {
  console.log('Orderbook update:', data);
});
```

Orderbook update data format:

```javascript
{
  baseAsset: 'BTC',
  quoteAsset: 'ETH',
  bids: [
    { price: '9.9', amount: '1.0', total: '1.0' },
    { price: '9.8', amount: '2.0', total: '3.0' }
  ],
  asks: [
    { price: '10.1', amount: '1.0', total: '1.0' },
    { price: '10.2', amount: '2.0', total: '3.0' }
  ],
  timestamp: '2025-04-10T13:00:00.000Z'
}
```

#### Trades Channel

Subscribe to the trades channel to receive trade updates for a trading pair:

```javascript
socket.emit('subscribe', { channel: 'trades', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
```

Listen for trade updates:

```javascript
socket.on('trade_created', (data) => {
  console.log('Trade created:', data);
});
```

Trade created data format:

```javascript
{
  id: '123',
  baseAsset: 'BTC',
  quoteAsset: 'ETH',
  price: '10.0',
  amount: '1.0',
  type: 'buy',
  timestamp: '2025-04-10T13:00:00.000Z'
}
```

### Private Channels

These channels require authentication.

#### Orders Channel

Subscribe to the orders channel to receive updates for your orders:

```javascript
socket.emit('subscribe', { channel: 'orders' });
```

Listen for order updates:

```javascript
socket.on('order_created', (data) => {
  console.log('Order created:', data);
});

socket.on('order_updated', (data) => {
  console.log('Order updated:', data);
});

socket.on('order_cancelled', (data) => {
  console.log('Order cancelled:', data);
});
```

Order data format:

```javascript
{
  id: '123',
  userId: '456',
  baseAsset: 'BTC',
  quoteAsset: 'ETH',
  price: '10.0',
  amount: '1.0',
  filled: '0.5',
  type: 'buy',
  status: 'open',
  createdAt: '2025-04-10T13:00:00.000Z',
  updatedAt: '2025-04-10T13:00:00.000Z'
}
```

#### Trades Private Channel

Subscribe to the trades_private channel to receive updates for your trades:

```javascript
socket.emit('subscribe', { channel: 'trades_private' });
```

Listen for trade updates:

```javascript
socket.on('trade_created', (data) => {
  console.log('Trade created:', data);
});

socket.on('trade_updated', (data) => {
  console.log('Trade updated:', data);
});

socket.on('trade_cancelled', (data) => {
  console.log('Trade cancelled:', data);
});
```

Trade data format:

```javascript
{
  id: '123',
  buyOrderId: '456',
  sellOrderId: '789',
  buyUserId: '456',
  sellUserId: '789',
  baseAsset: 'BTC',
  quoteAsset: 'ETH',
  price: '10.0',
  amount: '1.0',
  status: 'completed',
  createdAt: '2025-04-10T13:00:00.000Z',
  updatedAt: '2025-04-10T13:00:00.000Z'
}
```

#### Wallet Channel

Subscribe to the wallet channel to receive updates for your wallet:

```javascript
socket.emit('subscribe', { channel: 'wallet' });
```

Listen for wallet updates:

```javascript
socket.on('balance_update', (data) => {
  console.log('Balance update:', data);
});

socket.on('transaction_created', (data) => {
  console.log('Transaction created:', data);
});

socket.on('transaction_updated', (data) => {
  console.log('Transaction updated:', data);
});
```

Balance update data format:

```javascript
{
  balance: {
    BTC: '1.0',
    ETH: '10.0'
  }
}
```

Transaction data format:

```javascript
{
  id: '123',
  userId: '456',
  asset: 'BTC',
  amount: '1.0',
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  type: 'withdrawal',
  status: 'pending',
  timestamp: '2025-04-10T13:00:00.000Z'
}
```

### P2P Channel

Subscribe to the P2P channel to receive updates for the P2P network:

```javascript
socket.emit('subscribe', { channel: 'p2p' });
```

Listen for P2P updates:

```javascript
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

Peer connected data format:

```javascript
{
  id: '123',
  ip: '192.168.1.1',
  port: 8333,
  version: '1.0.0',
  userAgent: 'DarkSwap/1.0.0'
}
```

Peer disconnected data format:

```javascript
{
  id: '123'
}
```

Message received data format:

```javascript
{
  peerId: '123',
  message: {
    type: 'order',
    data: {
      // Order data
    }
  }
}
```

## Error Handling

Listen for error events:

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Disconnection

Disconnect from the WebSocket server when you're done:

```javascript
socket.disconnect();
```

## Rate Limiting

The WebSocket API has rate limits to prevent abuse. If you exceed the rate limits, you will receive an error event.

## Best Practices

1. **Reconnection**: Implement reconnection logic to handle disconnections.
2. **Authentication**: Authenticate as soon as the connection is established.
3. **Subscription Management**: Only subscribe to the channels you need.
4. **Error Handling**: Handle errors gracefully.
5. **Disconnection**: Disconnect when you're done to free up resources.

## Examples

### React Hook Example

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useOrderbook(baseAsset, quoteAsset) {
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  
  useEffect(() => {
    const socket = io('https://api.darkswap.io');
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      
      // Subscribe to orderbook channel
      socket.emit('subscribe', { channel: 'orderbook', params: { baseAsset, quoteAsset } });
    });
    
    socket.on('orderbook_update', (data) => {
      setOrderbook({
        bids: data.bids,
        asks: data.asks,
      });
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    return () => {
      // Unsubscribe from orderbook channel
      socket.emit('unsubscribe', { channel: 'orderbook', params: { baseAsset, quoteAsset } });
      
      // Disconnect from WebSocket server
      socket.disconnect();
    };
  }, [baseAsset, quoteAsset]);
  
  return orderbook;
}
```

### Node.js Example

```javascript
const { io } = require('socket.io-client');

// Connect to WebSocket server
const socket = io('https://api.darkswap.io');

// Handle connection
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Authenticate
  socket.emit('authenticate', { token: 'your-jwt-token' });
});

// Handle authentication
socket.on('authentication_success', (data) => {
  console.log('Authentication successful:', data);
  
  // Subscribe to channels
  socket.emit('subscribe', { channel: 'orderbook', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
  socket.emit('subscribe', { channel: 'trades', params: { baseAsset: 'BTC', quoteAsset: 'ETH' } });
  socket.emit('subscribe', { channel: 'orders' });
});

socket.on('authentication_failure', (data) => {
  console.error('Authentication failed:', data);
});

// Handle orderbook updates
socket.on('orderbook_update', (data) => {
  console.log('Orderbook update:', data);
});

// Handle trade updates
socket.on('trade_created', (data) => {
  console.log('Trade created:', data);
});

// Handle order updates
socket.on('order_created', (data) => {
  console.log('Order created:', data);
});

socket.on('order_updated', (data) => {
  console.log('Order updated:', data);
});

socket.on('order_cancelled', (data) => {
  console.log('Order cancelled:', data);
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected from WebSocket server:', reason);
});

// Disconnect after 1 hour
setTimeout(() => {
  socket.disconnect();
}, 60 * 60 * 1000);