# DarkSwap WebAssembly Bindings

TypeScript bindings for the DarkSwap SDK WebAssembly module.

## Overview

This package provides TypeScript bindings for the DarkSwap SDK WebAssembly module, enabling browser applications to interact with the DarkSwap P2P network, manage orders, and execute trades.

## Features

- **P2P Networking**: Connect to the DarkSwap P2P network, discover peers, and establish connections
- **Orderbook Management**: Create, cancel, and browse orders
- **Trade Execution**: Execute trades with other peers
- **Wallet Integration**: Connect to wallets and manage assets
- **Runes and Alkanes Support**: Work with Bitcoin, runes, and alkanes
- **Predicate Alkanes**: Create and manage predicate alkanes for conditional trading
- **Event System**: Subscribe to network, order, trade, and wallet events

## Installation

```bash
npm install darkswap-web-sys
```

## Usage

### Basic Usage

```typescript
import darkswap from 'darkswap-web-sys';

// Initialize the SDK
await darkswap.initialize();

// Connect to the P2P network
await darkswap.connect();

// Create an order
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

// Get all orders
const orders = await darkswap.getOrders();
console.log('Orders:', orders);

// Subscribe to order events
darkswap.on('order', (event) => {
  console.log('Order event:', event);
});
```

### Advanced Configuration

```typescript
import darkswap from 'darkswap-web-sys';

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

### Working with Runes and Alkanes

```typescript
import darkswap from 'darkswap-web-sys';

// Get information about a rune
const runeInfo = await darkswap.getRuneInfo('rune-id');
console.log('Rune info:', runeInfo);

// Get information about an alkane
const alkaneInfo = await darkswap.getAlkaneInfo('alkane-id');
console.log('Alkane info:', alkaneInfo);

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
```

### Event Handling

```typescript
import darkswap from 'darkswap-web-sys';

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

## API Reference

### Initialization

- `initialize(config?: Partial<DarkSwapConfig>): Promise<void>` - Initialize the SDK
- `isInitialized(): boolean` - Check if the SDK is initialized
- `getConfig(): DarkSwapConfig` - Get the current configuration

### Network

- `connect(): Promise<void>` - Connect to the P2P network
- `disconnect(): Promise<void>` - Disconnect from the P2P network
- `isConnected(): boolean` - Check if connected to the P2P network
- `getPeers(): Promise<Peer[]>` - Get the list of connected peers
- `connectToPeer(peerId: string): Promise<void>` - Connect to a specific peer
- `connectToRelay(relayAddress: string): Promise<void>` - Connect to a relay server

### Orders

- `createOrder(order: Order): Promise<string>` - Create a new order
- `cancelOrder(orderId: string): Promise<void>` - Cancel an order
- `getOrders(): Promise<OrderbookEntry[]>` - Get all orders
- `getOrdersForPair(baseAsset: string, quoteAsset: string): Promise<OrderbookEntry[]>` - Get orders for a specific trading pair

### Trades

- `takeOrder(orderId: string, amount: string): Promise<string>` - Take an order
- `getTrades(): Promise<Trade[]>` - Get all trades
- `getTrade(tradeId: string): Promise<Trade | null>` - Get a specific trade
- `getTradeStatus(tradeId: string): Promise<TradeStatus>` - Get the status of a trade

### Wallet

- `connectWallet(walletConfig: WalletConfig): Promise<void>` - Connect a wallet
- `disconnectWallet(): Promise<void>` - Disconnect the wallet
- `isWalletConnected(): boolean` - Check if a wallet is connected
- `getWalletInfo(): Promise<WalletInfo | null>` - Get wallet information
- `getBalances(): Promise<Balance[]>` - Get wallet balances

### Runes and Alkanes

- `getRuneInfo(runeId: string): Promise<RuneInfo | null>` - Get information about a rune
- `getAlkaneInfo(alkaneId: string): Promise<AlkaneInfo | null>` - Get information about an alkane
- `createPredicate(predicateInfo: PredicateInfo): Promise<string>` - Create a predicate alkane
- `getPredicateInfo(predicateId: string): Promise<PredicateInfo | null>` - Get information about a predicate

### Events

- `on(event: string, listener: Function): this` - Subscribe to an event
- `off(event: string, listener: Function): this` - Unsubscribe from an event
- `once(event: string, listener: Function): this` - Subscribe to an event once
- `emit(event: string, ...args: any[]): boolean` - Emit an event

## License

MIT