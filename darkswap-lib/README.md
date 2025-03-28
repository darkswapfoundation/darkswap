# DarkSwap Lib

A TypeScript library for interacting with the DarkSwap P2P network. This library provides a high-level API for creating and taking orders, managing the orderbook, and executing trades.

## Features

- **P2P Networking**: Connect to the DarkSwap P2P network
- **Orderbook Management**: Create, cancel, and query orders
- **Trade Execution**: Take orders and execute trades
- **Event System**: Receive events for network activity, orderbook updates, and trade execution
- **Cross-Platform**: Works in browsers and Node.js

## Installation

```bash
npm install darkswap-lib
```

## Usage

### Basic Example

```typescript
import { DarkSwap, OrderSide } from 'darkswap-lib';

async function main() {
  // Create a DarkSwap instance
  const darkswap = new DarkSwap({
    network: {
      bootstrapPeers: [
        { peerId: 'QmExample1', address: '/ip4/127.0.0.1/tcp/8000/p2p/QmExample1' },
      ],
      topics: [
        'darkswap/orderbook/v1',
        'darkswap/trade/v1',
      ],
      relayPeers: [
        { peerId: 'QmExample2', address: '/ip4/127.0.0.1/tcp/8001/p2p/QmExample2' },
      ],
    },
  });
  
  // Initialize DarkSwap
  await darkswap.initialize();
  console.log(`Initialized with peer ID: ${darkswap.getLocalPeerId()}`);
  
  // Listen for events
  darkswap.addEventListener('peerConnected', (event) => {
    console.log(`Peer connected: ${event.peerId}`);
  });
  
  darkswap.addEventListener('messageReceived', (event) => {
    if (event.type === 'messageReceived') {
      const decoder = new TextDecoder();
      const messageText = decoder.decode(event.message);
      console.log(`Message from ${event.peerId} on ${event.topic}: ${messageText}`);
    }
  });
  
  // Create an order
  const order = await darkswap.createOrder(
    'BTC',           // Base asset
    'USDT',          // Quote asset
    OrderSide.Sell,  // Order side
    '0.1',           // Amount
    '30000',         // Price
  );
  console.log('Created order:', order);
  
  // Get all orders
  const orders = darkswap.getAllOrders();
  console.log('All orders:', orders);
  
  // Get orders for a trading pair
  const btcUsdtOrders = darkswap.getOrdersForPair('BTC', 'USDT');
  console.log('BTC/USDT orders:', btcUsdtOrders);
  
  // Get the best bid and ask
  const bestBid = darkswap.getBestBid('BTC', 'USDT');
  const bestAsk = darkswap.getBestAsk('BTC', 'USDT');
  console.log('Best bid:', bestBid);
  console.log('Best ask:', bestAsk);
  
  // Take an order
  await darkswap.takeOrder(order.id, '0.05');
  console.log('Took order');
  
  // Cancel an order
  await darkswap.cancelOrder(order.id);
  console.log('Cancelled order');
}

main().catch(console.error);
```

## API Reference

### `DarkSwap`

The main class for interacting with the DarkSwap P2P network.

#### Constructor

```typescript
const darkswap = new DarkSwap(config?: DarkSwapConfig);
```

#### Methods

- `initialize()`: Initialize DarkSwap
- `getLocalPeerId()`: Get the local peer ID
- `connect(addr: string)`: Connect to a peer
- `connectThroughRelay(relayPeerId: string, dstPeerId: string)`: Connect to a peer through a relay
- `listenOn(addr: string)`: Listen on the given address
- `createOrder(baseAsset: string, quoteAsset: string, side: OrderSide, amount: string, price: string, expiry?: number)`: Create an order
- `cancelOrder(orderId: string)`: Cancel an order
- `takeOrder(orderId: string, amount: string)`: Take an order
- `getAllOrders()`: Get all orders
- `getOrdersForPair(baseAsset: string, quoteAsset: string)`: Get orders for a trading pair
- `getBuyOrders(baseAsset: string, quoteAsset: string)`: Get buy orders for a trading pair
- `getSellOrders(baseAsset: string, quoteAsset: string)`: Get sell orders for a trading pair
- `getBestBid(baseAsset: string, quoteAsset: string)`: Get the best bid for a trading pair
- `getBestAsk(baseAsset: string, quoteAsset: string)`: Get the best ask for a trading pair
- `addEventListener(type: string, listener: (event: any) => void)`: Add an event listener
- `removeEventListener(type: string, listener: (event: any) => void)`: Remove an event listener

### Events

- `peerConnected`: Emitted when a peer connects
- `peerDisconnected`: Emitted when a peer disconnects
- `messageReceived`: Emitted when a message is received
- `relayReserved`: Emitted when a relay reservation is made
- `connectedThroughRelay`: Emitted when connected through a relay

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Examples

See the `examples` directory for more examples of how to use this library.