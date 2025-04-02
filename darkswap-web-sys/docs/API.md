# DarkSwap WebAssembly API Documentation

This document provides detailed documentation for the DarkSwap WebAssembly API.

## Table of Contents

- [Installation](#installation)
- [Initialization](#initialization)
- [Network](#network)
- [Orders](#orders)
- [Trades](#trades)
- [Wallet](#wallet)
- [Runes and Alkanes](#runes-and-alkanes)
- [Events](#events)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)

## Installation

```bash
npm install darkswap-web-sys
```

## Initialization

Before using the DarkSwap SDK, you need to initialize it with a configuration object.

```typescript
import darkswap from 'darkswap-web-sys';

// Initialize with default configuration
await darkswap.initialize();

// Initialize with custom configuration
await darkswap.initialize({
  network: {
    bootstrapPeers: ['peer-id-1', 'peer-id-2'],
    relays: ['ws://relay1.darkswap.io/ws', 'ws://relay2.darkswap.io/ws'],
    maxPeers: 20,
    enableDht: true,
    enableMdns: false,
    enableWebRtc: true,
  },
  orderbook: {
    maxOrders: 2000,
    orderExpiryTime: 172800, // 48 hours
    enableGossip: true,
  },
  trade: {
    maxTrades: 200,
    tradeTimeout: 600, // 10 minutes
    enableAutoRetry: true,
    maxRetries: 5,
  },
  wallet: {
    type: 'external',
    provider: 'metamask',
    network: 'testnet',
    enableRunes: true,
    enableAlkanes: true,
  },
});
```

### Configuration Options

#### Network Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bootstrapPeers` | `string[]` | `[]` | List of bootstrap peers to connect to |
| `relays` | `string[]` | `['ws://localhost:9001/ws']` | List of relay servers to use |
| `maxPeers` | `number` | `10` | Maximum number of peers to connect to |
| `enableDht` | `boolean` | `true` | Whether to enable DHT for peer discovery |
| `enableMdns` | `boolean` | `true` | Whether to enable mDNS for peer discovery |
| `enableWebRtc` | `boolean` | `true` | Whether to enable WebRTC for peer connections |

#### Orderbook Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxOrders` | `number` | `1000` | Maximum number of orders to keep in memory |
| `orderExpiryTime` | `number` | `86400` | Order expiry time in seconds (24 hours) |
| `enableGossip` | `boolean` | `true` | Whether to enable gossip for order distribution |

#### Trade Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTrades` | `number` | `100` | Maximum number of trades to keep in memory |
| `tradeTimeout` | `number` | `300` | Trade timeout in seconds (5 minutes) |
| `enableAutoRetry` | `boolean` | `true` | Whether to enable automatic retry for failed trades |
| `maxRetries` | `number` | `3` | Maximum number of retries for failed trades |

#### Wallet Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'wasm' \| 'external'` | `'wasm'` | Wallet type |
| `network` | `'mainnet' \| 'testnet' \| 'regtest'` | `'testnet'` | Network to connect to |
| `enableRunes` | `boolean` | `true` | Whether to enable runes support |
| `enableAlkanes` | `boolean` | `true` | Whether to enable alkanes support |
| `provider` | `string` | `undefined` | External wallet provider (if type is 'external') |

## Network

### Connect to the P2P Network

```typescript
// Connect to the P2P network
await darkswap.connect();

// Check if connected
const isConnected = darkswap.isConnected();
console.log(`Connected to P2P network: ${isConnected}`);

// Disconnect from the P2P network
await darkswap.disconnect();
```

### Manage Peers

```typescript
// Get the list of connected peers
const peers = await darkswap.getPeers();
console.log('Connected peers:', peers);

// Connect to a specific peer
await darkswap.connectToPeer('peer-id');

// Connect to a relay server
await darkswap.connectToRelay('ws://relay.darkswap.io/ws');
```

## Orders

### Create and Manage Orders

```typescript
// Create a new order
const order = {
  baseAsset: 'BTC',
  quoteAsset: 'RUNE1',
  side: 'buy',
  type: 'limit',
  price: '0.0001',
  amount: '1.0',
};

const orderId = await darkswap.createOrder(order);
console.log(`Order created with ID: ${orderId}`);

// Cancel an order
await darkswap.cancelOrder(orderId);
```

### Browse Orders

```typescript
// Get all orders
const orders = await darkswap.getOrders();
console.log('Orders:', orders);

// Get orders for a specific trading pair
const btcRuneOrders = await darkswap.getOrdersForPair('BTC', 'RUNE1');
console.log('BTC/RUNE1 orders:', btcRuneOrders);
```

## Trades

### Execute Trades

```typescript
// Take an order
const tradeId = await darkswap.takeOrder(orderId, '0.5');
console.log(`Trade created with ID: ${tradeId}`);

// Get all trades
const trades = await darkswap.getTrades();
console.log('Trades:', trades);

// Get a specific trade
const trade = await darkswap.getTrade(tradeId);
console.log('Trade:', trade);

// Get the status of a trade
const status = await darkswap.getTradeStatus(tradeId);
console.log('Trade status:', status);
```

## Wallet

### Connect and Manage Wallet

```typescript
// Connect a wallet
await darkswap.connectWallet({
  type: 'wasm',
  network: 'testnet',
  enableRunes: true,
  enableAlkanes: true,
});

// Check if a wallet is connected
const isWalletConnected = darkswap.isWalletConnected();
console.log(`Wallet connected: ${isWalletConnected}`);

// Get wallet information
const walletInfo = await darkswap.getWalletInfo();
console.log('Wallet info:', walletInfo);

// Get wallet balances
const balances = await darkswap.getBalances();
console.log('Balances:', balances);

// Disconnect the wallet
await darkswap.disconnectWallet();
```

## Runes and Alkanes

### Work with Runes

```typescript
// Get information about a rune
const runeInfo = await darkswap.getRuneInfo('rune-id');
console.log('Rune info:', runeInfo);
```

### Work with Alkanes

```typescript
// Get information about an alkane
const alkaneInfo = await darkswap.getAlkaneInfo('alkane-id');
console.log('Alkane info:', alkaneInfo);
```

### Create and Manage Predicates

```typescript
// Create a predicate alkane
const predicateInfo = {
  name: 'Price Above 20000',
  type: 'equality',
  description: 'Checks if the price is above 20000',
  parameters: {
    variable: 'price',
    condition: 'greater-than',
    value: '20000',
  },
};

const predicateId = await darkswap.createPredicate(predicateInfo);
console.log(`Predicate created with ID: ${predicateId}`);

// Get information about a predicate
const predicateInfo = await darkswap.getPredicateInfo(predicateId);
console.log('Predicate info:', predicateInfo);
```

## Events

### Subscribe to Events

```typescript
// Subscribe to network events
darkswap.on('network', (event) => {
  console.log('Network event:', event);
});

// Subscribe to specific network events
darkswap.on('network:peer_connected', (event) => {
  console.log('Peer connected:', event);
});

// Subscribe to order events
darkswap.on('order', (event) => {
  console.log('Order event:', event);
});

// Subscribe to specific order events
darkswap.on('order:order_filled', (event) => {
  console.log('Order filled:', event);
});

// Subscribe to trade events
darkswap.on('trade', (event) => {
  console.log('Trade event:', event);
});

// Subscribe to wallet events
darkswap.on('wallet', (event) => {
  console.log('Wallet event:', event);
});
```

### Unsubscribe from Events

```typescript
// Define the event handler
const handleNetworkEvent = (event) => {
  console.log('Network event:', event);
};

// Subscribe to the event
darkswap.on('network', handleNetworkEvent);

// Unsubscribe from the event
darkswap.off('network', handleNetworkEvent);
```

### One-time Event Subscription

```typescript
// Subscribe to an event once
darkswap.once('network:peer_connected', (event) => {
  console.log('First peer connected:', event);
});
```

## Error Handling

The DarkSwap SDK uses promises for asynchronous operations, so you can use try/catch blocks to handle errors.

```typescript
try {
  await darkswap.initialize();
  await darkswap.connect();
  const orderId = await darkswap.createOrder(order);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Common Errors

| Error | Description |
|-------|-------------|
| `NotInitializedError` | The SDK is not initialized. Call `initialize()` first. |
| `NotConnectedError` | The SDK is not connected to the P2P network. Call `connect()` first. |
| `WalletNotConnectedError` | No wallet is connected. Call `connectWallet()` first. |
| `InvalidOrderError` | The order is invalid. Check the order parameters. |
| `OrderNotFoundError` | The order was not found. Check the order ID. |
| `TradeNotFoundError` | The trade was not found. Check the trade ID. |
| `NetworkError` | A network error occurred. Check your internet connection. |

## Advanced Usage

### Using with React

```tsx
import React, { useEffect, useState } from 'react';
import darkswap from 'darkswap-web-sys';

function DarkSwapComponent() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Initialize the SDK
    darkswap.initialize()
      .then(() => {
        setIsInitialized(true);
        return darkswap.connect();
      })
      .then(() => {
        setIsConnected(true);
        return darkswap.getOrders();
      })
      .then((orders) => {
        setOrders(orders);
      })
      .catch(console.error);

    // Subscribe to order events
    const handleOrderEvent = (event) => {
      if (event.type === 'order_created' || event.type === 'order_canceled') {
        darkswap.getOrders().then(setOrders);
      }
    };

    darkswap.on('order', handleOrderEvent);

    // Cleanup
    return () => {
      darkswap.off('order', handleOrderEvent);
      darkswap.disconnect().catch(console.error);
    };
  }, []);

  return (
    <div>
      <h1>DarkSwap</h1>
      <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <h2>Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.baseAsset}/{order.quoteAsset} - {order.side} {order.amount} @ {order.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Using with Web Workers

For better performance, you can run the DarkSwap SDK in a web worker.

```typescript
// worker.ts
import darkswap from 'darkswap-web-sys';

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'initialize':
      try {
        await darkswap.initialize(payload);
        self.postMessage({ type: 'initialized' });
      } catch (error) {
        self.postMessage({ type: 'error', payload: error.message });
      }
      break;

    case 'connect':
      try {
        await darkswap.connect();
        self.postMessage({ type: 'connected' });
      } catch (error) {
        self.postMessage({ type: 'error', payload: error.message });
      }
      break;

    case 'getOrders':
      try {
        const orders = await darkswap.getOrders();
        self.postMessage({ type: 'orders', payload: orders });
      } catch (error) {
        self.postMessage({ type: 'error', payload: error.message });
      }
      break;

    // Add more message handlers as needed
  }
};

// Set up event forwarding
darkswap.on('network', (event) => {
  self.postMessage({ type: 'network', payload: event });
});

darkswap.on('order', (event) => {
  self.postMessage({ type: 'order', payload: event });
});

darkswap.on('trade', (event) => {
  self.postMessage({ type: 'trade', payload: event });
});

darkswap.on('wallet', (event) => {
  self.postMessage({ type: 'wallet', payload: event });
});
```

```typescript
// main.ts
const worker = new Worker('worker.js');

worker.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'initialized':
      console.log('SDK initialized');
      worker.postMessage({ type: 'connect' });
      break;

    case 'connected':
      console.log('Connected to P2P network');
      worker.postMessage({ type: 'getOrders' });
      break;

    case 'orders':
      console.log('Orders:', payload);
      break;

    case 'network':
      console.log('Network event:', payload);
      break;

    case 'order':
      console.log('Order event:', payload);
      break;

    case 'trade':
      console.log('Trade event:', payload);
      break;

    case 'wallet':
      console.log('Wallet event:', payload);
      break;

    case 'error':
      console.error('Error:', payload);
      break;
  }
};

// Initialize the SDK
worker.postMessage({
  type: 'initialize',
  payload: {
    network: {
      relays: ['ws://relay.darkswap.io/ws'],
    },
  },
});
```

### Using with TypeScript

The DarkSwap SDK includes TypeScript type definitions, so you can use it with TypeScript without any additional setup.

```typescript
import darkswap from 'darkswap-web-sys';
import { Order, Trade, Peer, WalletInfo, Balance } from 'darkswap-web-sys';

async function example() {
  // Initialize the SDK
  await darkswap.initialize();

  // Create an order with proper typing
  const order: Order = {
    baseAsset: 'BTC',
    quoteAsset: 'RUNE1',
    side: 'buy',
    type: 'limit',
    price: '0.0001',
    amount: '1.0',
  };

  const orderId = await darkswap.createOrder(order);

  // Get trades with proper typing
  const trades: Trade[] = await darkswap.getTrades();

  // Get peers with proper typing
  const peers: Peer[] = await darkswap.getPeers();

  // Get wallet info with proper typing
  const walletInfo: WalletInfo | null = await darkswap.getWalletInfo();

  // Get balances with proper typing
  const balances: Balance[] = await darkswap.getBalances();
}
```

## Conclusion

This documentation provides a comprehensive guide to using the DarkSwap WebAssembly API. For more information, check out the [examples](../examples) directory or the [README](../README.md) file.