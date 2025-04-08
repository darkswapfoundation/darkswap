# DarkSwap API Reference

This document provides a comprehensive reference for the DarkSwap API, including all public interfaces, methods, and types.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [DarkSwapWasm](#darkswapwasm)
  - [Wallet](#wallet)
  - [Orderbook](#orderbook)
  - [Trade](#trade)
  - [P2P](#p2p)
  - [Types](#types)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)

## Introduction

DarkSwap is a decentralized exchange (DEX) for trading Bitcoin, Runes, and Alkanes. It provides a peer-to-peer trading platform with no central authority, allowing users to trade directly with each other.

The DarkSwap API is divided into several modules:

- **DarkSwapWasm**: The main entry point for interacting with the DarkSwap WebAssembly module.
- **Wallet**: Manages wallet integration and transaction signing.
- **Orderbook**: Manages the orderbook and order matching.
- **Trade**: Manages trade execution and settlement.
- **P2P**: Manages peer-to-peer networking and communication.
- **Types**: Common types used throughout the API.

## Getting Started

To get started with the DarkSwap API, you need to initialize the DarkSwapWasm module:

```typescript
import DarkSwapWasm, { BitcoinNetwork, Config } from './wasm/DarkSwapWasm';

// Create DarkSwap instance
const darkswap = new DarkSwapWasm();

// Initialize DarkSwap
const config: Config = {
  bitcoinNetwork: BitcoinNetwork.Testnet,
  relayUrl: 'wss://relay.darkswap.io',
  listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
  bootstrapPeers: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'],
};

try {
  await darkswap.initialize(config);
  console.log('DarkSwap initialized');
} catch (error) {
  console.error('Failed to initialize DarkSwap:', error);
}
```

## Core Concepts

### Assets

DarkSwap supports three types of assets:

- **Bitcoin (BTC)**: The native cryptocurrency of the Bitcoin network.
- **Runes**: Fungible tokens on the Bitcoin network.
- **Alkanes**: Non-fungible tokens on the Bitcoin network.

### Orders

An order represents an intent to trade one asset for another. Orders have the following properties:

- **Side**: Buy or sell.
- **Base Asset**: The asset being bought or sold.
- **Quote Asset**: The asset used to price the base asset.
- **Amount**: The amount of the base asset to buy or sell.
- **Price**: The price of the base asset in terms of the quote asset.

### Trades

A trade represents the execution of an order. Trades have the following properties:

- **Order ID**: The ID of the order that was executed.
- **Taker**: The address of the user who took the order.
- **Maker**: The address of the user who made the order.
- **Amount**: The amount of the base asset that was traded.
- **Price**: The price at which the trade was executed.
- **Timestamp**: The time at which the trade was executed.

### P2P Network

DarkSwap uses a peer-to-peer network for order discovery and trade execution. The P2P network is built on libp2p and uses WebRTC for browser-to-browser communication.

## API Reference

### DarkSwapWasm

The `DarkSwapWasm` class is the main entry point for interacting with the DarkSwap WebAssembly module.

#### Constructor

```typescript
constructor()
```

Creates a new DarkSwapWasm instance.

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| isInitialized | boolean | Whether the DarkSwap module is initialized. |

#### Methods

##### initialize

```typescript
async initialize(config: Config): Promise<void>
```

Initializes the DarkSwap module with the specified configuration.

**Parameters:**

- `config`: The configuration for the DarkSwap module.

**Returns:**

A promise that resolves when the DarkSwap module is initialized.

**Throws:**

- `WasmError`: If the WebAssembly module fails to initialize.
- `NetworkError`: If the P2P network fails to initialize.

##### createOrder

```typescript
async createOrder(
  side: OrderSide,
  baseAssetType: AssetType,
  baseAssetId: string,
  quoteAssetType: AssetType,
  quoteAssetId: string,
  amount: string,
  price: string,
): Promise<string>
```

Creates a new order.

**Parameters:**

- `side`: The side of the order (buy or sell).
- `baseAssetType`: The type of the base asset.
- `baseAssetId`: The ID of the base asset.
- `quoteAssetType`: The type of the quote asset.
- `quoteAssetId`: The ID of the quote asset.
- `amount`: The amount of the base asset to buy or sell.
- `price`: The price of the base asset in terms of the quote asset.

**Returns:**

A promise that resolves to the ID of the created order.

**Throws:**

- `OrderError`: If the order creation fails.
- `WalletError`: If the wallet operation fails.

##### cancelOrder

```typescript
async cancelOrder(orderId: string): Promise<void>
```

Cancels an existing order.

**Parameters:**

- `orderId`: The ID of the order to cancel.

**Returns:**

A promise that resolves when the order is cancelled.

**Throws:**

- `OrderError`: If the order cancellation fails.
- `WalletError`: If the wallet operation fails.

##### getOrder

```typescript
async getOrder(orderId: string): Promise<Order>
```

Gets an order by ID.

**Parameters:**

- `orderId`: The ID of the order to get.

**Returns:**

A promise that resolves to the order.

**Throws:**

- `OrderError`: If the order is not found.

##### getOrders

```typescript
async getOrders(
  side?: OrderSide,
  baseAssetType?: AssetType,
  baseAssetId?: string,
  quoteAssetType?: AssetType,
  quoteAssetId?: string,
): Promise<Order[]>
```

Gets orders matching the specified criteria.

**Parameters:**

- `side`: The side of the orders to get (buy or sell).
- `baseAssetType`: The type of the base asset.
- `baseAssetId`: The ID of the base asset.
- `quoteAssetType`: The type of the quote asset.
- `quoteAssetId`: The ID of the quote asset.

**Returns:**

A promise that resolves to an array of orders.

##### takeOrder

```typescript
async takeOrder(orderId: string, amount: string): Promise<string>
```

Takes an existing order.

**Parameters:**

- `orderId`: The ID of the order to take.
- `amount`: The amount of the base asset to take.

**Returns:**

A promise that resolves to the ID of the created trade.

**Throws:**

- `OrderError`: If the order taking fails.
- `WalletError`: If the wallet operation fails.
- `TradeError`: If the trade execution fails.

##### on

```typescript
on<T extends EventType>(event: T, handler: (event: any) => void): () => void
```

Registers an event handler.

**Parameters:**

- `event`: The type of event to listen for.
- `handler`: The function to call when the event occurs.

**Returns:**

A function that removes the event handler when called.

### Wallet

The `Wallet` module manages wallet integration and transaction signing.

#### Types

##### WalletType

```typescript
enum WalletType {
  SimpleWallet = 0,
  BdkWallet = 1,
  ExternalWallet = 2,
}
```

The type of wallet.

##### WalletConfig

```typescript
interface WalletConfig {
  type: WalletType;
  network: BitcoinNetwork;
  mnemonic?: string;
  privateKey?: string;
  externalWalletProvider?: string;
}
```

Configuration for a wallet.

#### Methods

##### createWallet

```typescript
async createWallet(config: WalletConfig): Promise<string>
```

Creates a new wallet.

**Parameters:**

- `config`: The configuration for the wallet.

**Returns:**

A promise that resolves to the ID of the created wallet.

**Throws:**

- `WalletError`: If the wallet creation fails.

##### getWallet

```typescript
async getWallet(walletId: string): Promise<Wallet>
```

Gets a wallet by ID.

**Parameters:**

- `walletId`: The ID of the wallet to get.

**Returns:**

A promise that resolves to the wallet.

**Throws:**

- `WalletError`: If the wallet is not found.

##### getBalance

```typescript
async getBalance(walletId: string, assetType: AssetType, assetId: string): Promise<string>
```

Gets the balance of an asset in a wallet.

**Parameters:**

- `walletId`: The ID of the wallet.
- `assetType`: The type of the asset.
- `assetId`: The ID of the asset.

**Returns:**

A promise that resolves to the balance of the asset.

**Throws:**

- `WalletError`: If the balance query fails.

##### signTransaction

```typescript
async signTransaction(walletId: string, transaction: Transaction): Promise<SignedTransaction>
```

Signs a transaction with a wallet.

**Parameters:**

- `walletId`: The ID of the wallet.
- `transaction`: The transaction to sign.

**Returns:**

A promise that resolves to the signed transaction.

**Throws:**

- `WalletError`: If the transaction signing fails.

### Orderbook

The `Orderbook` module manages the orderbook and order matching.

#### Types

##### OrderSide

```typescript
enum OrderSide {
  Buy = 0,
  Sell = 1,
}
```

The side of an order.

##### OrderStatus

```typescript
enum OrderStatus {
  Open = 0,
  Filled = 1,
  Cancelled = 2,
  Expired = 3,
}
```

The status of an order.

##### Order

```typescript
interface Order {
  id: string;
  side: OrderSide;
  baseAsset: string;
  quoteAsset: string;
  amount: string;
  price: string;
  timestamp: number;
  status: OrderStatus;
  maker: string;
}
```

An order in the orderbook.

#### Methods

##### addOrder

```typescript
async addOrder(order: Order): Promise<void>
```

Adds an order to the orderbook.

**Parameters:**

- `order`: The order to add.

**Returns:**

A promise that resolves when the order is added.

**Throws:**

- `OrderError`: If the order addition fails.

##### removeOrder

```typescript
async removeOrder(orderId: string): Promise<void>
```

Removes an order from the orderbook.

**Parameters:**

- `orderId`: The ID of the order to remove.

**Returns:**

A promise that resolves when the order is removed.

**Throws:**

- `OrderError`: If the order removal fails.

##### getOrders

```typescript
async getOrders(
  side?: OrderSide,
  baseAsset?: string,
  quoteAsset?: string,
): Promise<Order[]>
```

Gets orders from the orderbook.

**Parameters:**

- `side`: The side of the orders to get.
- `baseAsset`: The base asset of the orders to get.
- `quoteAsset`: The quote asset of the orders to get.

**Returns:**

A promise that resolves to an array of orders.

##### matchOrder

```typescript
async matchOrder(order: Order): Promise<Order[]>
```

Matches an order against the orderbook.

**Parameters:**

- `order`: The order to match.

**Returns:**

A promise that resolves to an array of matched orders.

### Trade

The `Trade` module manages trade execution and settlement.

#### Types

##### TradeStatus

```typescript
enum TradeStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
}
```

The status of a trade.

##### Trade

```typescript
interface Trade {
  id: string;
  orderId: string;
  taker: string;
  maker: string;
  amount: string;
  price: string;
  timestamp: number;
  status: TradeStatus;
}
```

A trade between two users.

#### Methods

##### createTrade

```typescript
async createTrade(orderId: string, amount: string): Promise<string>
```

Creates a new trade.

**Parameters:**

- `orderId`: The ID of the order to trade against.
- `amount`: The amount of the base asset to trade.

**Returns:**

A promise that resolves to the ID of the created trade.

**Throws:**

- `TradeError`: If the trade creation fails.
- `OrderError`: If the order is not found or cannot be traded against.
- `WalletError`: If the wallet operation fails.

##### getTrade

```typescript
async getTrade(tradeId: string): Promise<Trade>
```

Gets a trade by ID.

**Parameters:**

- `tradeId`: The ID of the trade to get.

**Returns:**

A promise that resolves to the trade.

**Throws:**

- `TradeError`: If the trade is not found.

##### getTrades

```typescript
async getTrades(
  orderId?: string,
  maker?: string,
  taker?: string,
): Promise<Trade[]>
```

Gets trades matching the specified criteria.

**Parameters:**

- `orderId`: The ID of the order to get trades for.
- `maker`: The address of the maker to get trades for.
- `taker`: The address of the taker to get trades for.

**Returns:**

A promise that resolves to an array of trades.

### P2P

The `P2P` module manages peer-to-peer networking and communication.

#### Types

##### PeerInfo

```typescript
interface PeerInfo {
  id: string;
  addresses: string[];
  protocols: string[];
  connected: boolean;
}
```

Information about a peer.

#### Methods

##### connect

```typescript
async connect(address: string): Promise<void>
```

Connects to a peer.

**Parameters:**

- `address`: The address of the peer to connect to.

**Returns:**

A promise that resolves when the connection is established.

**Throws:**

- `NetworkError`: If the connection fails.

##### disconnect

```typescript
async disconnect(peerId: string): Promise<void>
```

Disconnects from a peer.

**Parameters:**

- `peerId`: The ID of the peer to disconnect from.

**Returns:**

A promise that resolves when the disconnection is complete.

**Throws:**

- `NetworkError`: If the disconnection fails.

##### getPeers

```typescript
async getPeers(): Promise<PeerInfo[]>
```

Gets information about connected peers.

**Returns:**

A promise that resolves to an array of peer information.

##### publish

```typescript
async publish(topic: string, data: Uint8Array): Promise<void>
```

Publishes data to a topic.

**Parameters:**

- `topic`: The topic to publish to.
- `data`: The data to publish.

**Returns:**

A promise that resolves when the data is published.

**Throws:**

- `NetworkError`: If the publication fails.

##### subscribe

```typescript
async subscribe(topic: string, handler: (data: Uint8Array, from: string) => void): Promise<() => void>
```

Subscribes to a topic.

**Parameters:**

- `topic`: The topic to subscribe to.
- `handler`: The function to call when data is received.

**Returns:**

A promise that resolves to a function that unsubscribes when called.

**Throws:**

- `NetworkError`: If the subscription fails.

### Types

The `Types` module contains common types used throughout the API.

#### BitcoinNetwork

```typescript
enum BitcoinNetwork {
  Mainnet = 0,
  Testnet = 1,
  Regtest = 2,
}
```

The Bitcoin network to use.

#### AssetType

```typescript
enum AssetType {
  Bitcoin = 0,
  Rune = 1,
  Alkane = 2,
}
```

The type of asset.

#### Config

```typescript
interface Config {
  bitcoinNetwork: BitcoinNetwork;
  relayUrl: string;
  listenAddresses: string[];
  bootstrapPeers: string[];
}
```

Configuration for the DarkSwap module.

#### Transaction

```typescript
interface Transaction {
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  locktime: number;
  version: number;
}
```

A Bitcoin transaction.

#### TransactionInput

```typescript
interface TransactionInput {
  txid: string;
  vout: number;
  sequence: number;
  scriptSig?: string;
  witness?: string[];
}
```

An input to a Bitcoin transaction.

#### TransactionOutput

```typescript
interface TransactionOutput {
  value: string;
  scriptPubKey: string;
}
```

An output from a Bitcoin transaction.

#### SignedTransaction

```typescript
interface SignedTransaction {
  transaction: Transaction;
  signatures: string[];
}
```

A signed Bitcoin transaction.

## Error Handling

The DarkSwap API uses a structured error handling system with specific error types for different categories of errors.

### Error Types

#### WasmError

```typescript
class WasmError extends Error {
  constructor(message: string, code: ErrorCode);
}
```

An error related to the WebAssembly module.

#### NetworkError

```typescript
class NetworkError extends Error {
  constructor(message: string, code: ErrorCode);
}
```

An error related to the P2P network.

#### OrderError

```typescript
class OrderError extends Error {
  constructor(message: string, code: ErrorCode);
}
```

An error related to order management.

#### TradeError

```typescript
class TradeError extends Error {
  constructor(message: string, code: ErrorCode);
}
```

An error related to trade execution.

#### WalletError

```typescript
class WalletError extends Error {
  constructor(message: string, code: ErrorCode);
}
```

An error related to wallet operations.

### Error Codes

```typescript
enum ErrorCode {
  // WebAssembly errors
  WasmInitFailed = 100,
  WasmExecutionFailed = 101,
  WasmMemoryError = 102,
  
  // Network errors
  ConnectionFailed = 200,
  PeerNotFound = 201,
  MessageTooLarge = 202,
  
  // Order errors
  OrderNotFound = 300,
  OrderAlreadyExists = 301,
  OrderValidationFailed = 302,
  
  // Trade errors
  TradeNotFound = 400,
  TradeExecutionFailed = 401,
  TradeValidationFailed = 402,
  
  // Wallet errors
  WalletNotFound = 500,
  InsufficientFunds = 501,
  SigningFailed = 502,
}
```

## Advanced Usage

### Event Handling

The DarkSwap API provides an event system for reacting to changes in the system:

```typescript
// Listen for new orders
const unsubscribe = darkswap.on('order', (order: Order) => {
  console.log('New order:', order);
});

// Later, unsubscribe from events
unsubscribe();
```

### Memory Management

The DarkSwap API provides utilities for managing WebAssembly memory:

```typescript
// Get memory statistics
const stats = darkswap.getMemoryStats();
console.log('Memory usage:', stats);
```

### Circuit Breaker Pattern

The DarkSwap API implements the circuit breaker pattern for handling failures:

```typescript
import { circuitBreakerRegistry } from './utils/CircuitBreaker';

// Get or create a circuit breaker
const circuitBreaker = circuitBreakerRegistry.getOrCreate('api-service', {
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeout: 30000,
});

// Execute a function with circuit breaker protection
try {
  const result = await circuitBreaker.execute(async () => {
    // Call API or perform operation that might fail
    return await api.getData();
  });
  
  // Handle result
  console.log('Result:', result);
} catch (error) {
  // Handle error
  console.error('Error:', error);
}
```

### Feature Flags

The DarkSwap API uses feature flags for controlled feature rollout:

```typescript
import featureFlagManager from './utils/FeatureFlags';

// Check if a feature is enabled
if (featureFlagManager.isEnabled('advanced-orders')) {
  // Show advanced order types
  showAdvancedOrderTypes();
}
```

## Examples

### Creating and Taking an Order

```typescript
// Create an order
const orderId = await darkswap.createOrder(
  OrderSide.Sell,
  AssetType.Bitcoin,
  'BTC',
  AssetType.Rune,
  'SATS',
  '0.1',
  '1000000',
);

console.log('Order created:', orderId);

// Take the order
const tradeId = await darkswap.takeOrder(orderId, '0.05');

console.log('Trade created:', tradeId);
```

### Getting Orders and Trades

```typescript
// Get all orders for a specific trading pair
const orders = await darkswap.getOrders(
  undefined,
  AssetType.Bitcoin,
  'BTC',
  AssetType.Rune,
  'SATS',
);

console.log('Orders:', orders);

// Get all trades for a specific order
const trades = await darkswap.getTrades(orderId);

console.log('Trades:', trades);
```

### Wallet Operations

```typescript
// Create a wallet
const walletId = await darkswap.createWallet({
  type: WalletType.SimpleWallet,
  network: BitcoinNetwork.Testnet,
  mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
});

console.log('Wallet created:', walletId);

// Get wallet balance
const balance = await darkswap.getBalance(walletId, AssetType.Bitcoin, 'BTC');

console.log('Balance:', balance);
```

### P2P Communication

```typescript
// Connect to a peer
await darkswap.connect('/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ');

// Get connected peers
const peers = await darkswap.getPeers();

console.log('Connected peers:', peers);

// Subscribe to a topic
const unsubscribe = await darkswap.subscribe('orders', (data, from) => {
  console.log('Received order from:', from);
  
  // Parse order
  const order = JSON.parse(new TextDecoder().decode(data));
  
  console.log('Order:', order);
});

// Publish to a topic
const order = {
  side: OrderSide.Buy,
  baseAsset: 'BTC',
  quoteAsset: 'SATS',
  amount: '0.1',
  price: '1000000',
};

await darkswap.publish('orders', new TextEncoder().encode(JSON.stringify(order)));

// Later, unsubscribe
unsubscribe();