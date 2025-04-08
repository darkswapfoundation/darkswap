# DarkSwapWasm API Reference

This document provides a comprehensive reference for the DarkSwapWasm API, which is the main interface to the DarkSwap WebAssembly module.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
  - [DarkSwapWasm](#darkswapwasm)
  - [Config](#config)
  - [BitcoinNetwork](#bitcoinnetwork)
  - [AssetType](#assettype)
  - [OrderSide](#orderside)
  - [OrderStatus](#orderstatus)
  - [TradeStatus](#tradestatus)
  - [Order](#order)
  - [Trade](#trade)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)

## Installation

```bash
npm install darkswap-wasm
```

## Basic Usage

```typescript
import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from 'darkswap-wasm';

// Create DarkSwap instance
const darkswap = new DarkSwapWasm();

// Initialize DarkSwap
await darkswap.initialize({
  bitcoinNetwork: BitcoinNetwork.Testnet,
  relayUrl: 'ws://localhost:8080',
  listenAddresses: [],
  bootstrapPeers: [],
  debug: true,
});

// Create an order
const orderId = await darkswap.createOrder(
  OrderSide.Buy,
  AssetType.Bitcoin,
  'BTC',
  AssetType.Bitcoin,
  'USD',
  '1.0',
  '50000',
);

// Get an order
const order = await darkswap.getOrder(orderId);

// Cancel an order
await darkswap.cancelOrder(orderId);
```

## API Reference

### DarkSwapWasm

The main class for interacting with the DarkSwap WebAssembly module.

#### Constructor

```typescript
constructor()
```

Creates a new DarkSwapWasm instance.

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| isInitialized | boolean | Whether the DarkSwap instance is initialized. |

#### Methods

##### initialize

```typescript
async initialize(config: Config): Promise<void>
```

Initializes the DarkSwap instance with the provided configuration.

**Parameters:**

- `config`: [Config](#config) - The configuration for the DarkSwap instance.

**Returns:**

- `Promise<void>` - A promise that resolves when the initialization is complete.

**Throws:**

- `WasmError` - If the initialization fails.

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

- `side`: [OrderSide](#orderside) - The side of the order (buy or sell).
- `baseAssetType`: [AssetType](#assettype) - The type of the base asset.
- `baseAssetId`: string - The ID of the base asset.
- `quoteAssetType`: [AssetType](#assettype) - The type of the quote asset.
- `quoteAssetId`: string - The ID of the quote asset.
- `amount`: string - The amount of the base asset.
- `price`: string - The price of the base asset in terms of the quote asset.

**Returns:**

- `Promise<string>` - A promise that resolves to the ID of the created order.

**Throws:**

- `OrderError` - If the order creation fails.

##### cancelOrder

```typescript
async cancelOrder(orderId: string): Promise<void>
```

Cancels an order.

**Parameters:**

- `orderId`: string - The ID of the order to cancel.

**Returns:**

- `Promise<void>` - A promise that resolves when the order is cancelled.

**Throws:**

- `OrderError` - If the order cancellation fails.

##### getOrder

```typescript
async getOrder(orderId: string): Promise<Order>
```

Gets an order by ID.

**Parameters:**

- `orderId`: string - The ID of the order to get.

**Returns:**

- `Promise<Order>` - A promise that resolves to the order.

**Throws:**

- `OrderError` - If the order retrieval fails.

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

Gets orders matching the provided filters.

**Parameters:**

- `side`: [OrderSide](#orderside) (optional) - The side of the orders to get.
- `baseAssetType`: [AssetType](#assettype) (optional) - The type of the base asset.
- `baseAssetId`: string (optional) - The ID of the base asset.
- `quoteAssetType`: [AssetType](#assettype) (optional) - The type of the quote asset.
- `quoteAssetId`: string (optional) - The ID of the quote asset.

**Returns:**

- `Promise<Order[]>` - A promise that resolves to an array of orders.

**Throws:**

- `OrderError` - If the order retrieval fails.

##### takeOrder

```typescript
async takeOrder(orderId: string, amount: string): Promise<string>
```

Takes an order.

**Parameters:**

- `orderId`: string - The ID of the order to take.
- `amount`: string - The amount of the base asset to take.

**Returns:**

- `Promise<string>` - A promise that resolves to the ID of the created trade.

**Throws:**

- `OrderError` - If the order execution fails.

##### on

```typescript
on(event: EventType, handler: (event: any) => void): () => void
```

Registers an event handler.

**Parameters:**

- `event`: EventType - The type of event to listen for.
- `handler`: (event: any) => void - The event handler.

**Returns:**

- `() => void` - A function to remove the event handler.

### Config

The configuration for a DarkSwap instance.

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| bitcoinNetwork | [BitcoinNetwork](#bitcoinnetwork) | The Bitcoin network to use. |
| relayUrl | string | The URL of the relay server. |
| listenAddresses | string[] | The addresses to listen on. |
| bootstrapPeers | string[] | The bootstrap peers to connect to. |
| walletPath | string (optional) | The path to the wallet file. |
| walletPassword | string (optional) | The password for the wallet. |
| debug | boolean (optional) | Whether to enable debug mode. |
| memory | object (optional) | Memory configuration. |
| memory.initialPages | number (optional) | Initial memory size in pages (64KB per page). |
| memory.maximumPages | number (optional) | Maximum memory size in pages (64KB per page). |
| memory.shared | boolean (optional) | Whether to use shared memory. |

### BitcoinNetwork

The Bitcoin network to use.

#### Values

| Name | Value | Description |
| ---- | ----- | ----------- |
| Mainnet | 0 | The Bitcoin mainnet. |
| Testnet | 1 | The Bitcoin testnet. |
| Regtest | 2 | The Bitcoin regtest network. |

### AssetType

The type of an asset.

#### Values

| Name | Value | Description |
| ---- | ----- | ----------- |
| Bitcoin | 0 | Bitcoin. |
| Rune | 1 | Rune. |
| Alkane | 2 | Alkane. |

### OrderSide

The side of an order.

#### Values

| Name | Value | Description |
| ---- | ----- | ----------- |
| Buy | 0 | Buy order. |
| Sell | 1 | Sell order. |

### OrderStatus

The status of an order.

#### Values

| Name | Value | Description |
| ---- | ----- | ----------- |
| Open | 0 | The order is open. |
| Filled | 1 | The order is filled. |
| Cancelled | 2 | The order is cancelled. |
| Expired | 3 | The order is expired. |

### TradeStatus

The status of a trade.

#### Values

| Name | Value | Description |
| ---- | ----- | ----------- |
| Pending | 0 | The trade is pending. |
| Completed | 1 | The trade is completed. |
| Failed | 2 | The trade failed. |

### Order

An order.

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | string | The ID of the order. |
| side | [OrderSide](#orderside) | The side of the order. |
| baseAsset | string | The base asset. |
| quoteAsset | string | The quote asset. |
| amount | string | The amount of the base asset. |
| price | string | The price of the base asset in terms of the quote asset. |
| timestamp | number | The timestamp when the order was created. |
| status | [OrderStatus](#orderstatus) | The status of the order. |
| maker | string | The peer ID of the maker. |

### Trade

A trade.

#### Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | string | The ID of the trade. |
| orderId | string | The ID of the order. |
| amount | string | The amount of the base asset. |
| price | string | The price of the base asset in terms of the quote asset. |
| timestamp | number | The timestamp when the trade was created. |
| status | [TradeStatus](#tradestatus) | The status of the trade. |
| maker | string | The peer ID of the maker. |
| taker | string | The peer ID of the taker. |

## Error Handling

The DarkSwap API uses a comprehensive error handling system. All errors thrown by the API are instances of `DarkSwapError` or its subclasses.

### Error Types

- `DarkSwapError`: The base error class.
- `WasmError`: Errors related to WebAssembly operations.
- `NetworkError`: Errors related to network operations.
- `OrderError`: Errors related to order operations.
- `WalletError`: Errors related to wallet operations.
- `TradeError`: Errors related to trade operations.

### Error Codes

Each error has a code that identifies the specific error. The error codes are defined in the `ErrorCode` enum.

```typescript
enum ErrorCode {
  // General errors
  Unknown = 0,
  NotInitialized = 1,
  AlreadyInitialized = 2,
  AlreadyInitializing = 3,
  InvalidArgument = 4,
  Timeout = 5,
  CircuitBreakerOpen = 6,
  
  // WebAssembly errors
  WasmLoadFailed = 100,
  WasmInitFailed = 101,
  WasmExecutionFailed = 102,
  WasmShutdownFailed = 103,
  
  // Network errors
  NetworkError = 200,
  ConnectionFailed = 201,
  ConnectionClosed = 202,
  ConnectionTimeout = 203,
  
  // Wallet errors
  WalletNotConnected = 300,
  WalletConnectionFailed = 301,
  WalletSigningFailed = 302,
  WalletInsufficientFunds = 303,
  
  // Order errors
  OrderNotFound = 400,
  OrderCreationFailed = 401,
  OrderCancellationFailed = 402,
  OrderExecutionFailed = 403,
  InvalidOrderParameters = 404,
  
  // Trade errors
  TradeNotFound = 500,
  TradeCreationFailed = 501,
  TradeExecutionFailed = 502,
  TradeSettlementFailed = 503,
}
```

### Error Recovery

The DarkSwap API provides utilities for recovering from errors. These utilities are available in the `ErrorRecovery` module.

```typescript
import { retry, recover, retryStrategy, fallbackStrategy } from 'darkswap-wasm/ErrorRecovery';

// Retry a function
const result = await retry(
  async () => {
    // Function that might fail
    return await darkswap.createOrder(...);
  },
  {
    maxRetries: 3,
    retryDelay: 1000,
    useExponentialBackoff: true,
  }
);

// Recover from an error
const result = await recover(
  async () => {
    // Function that might fail
    return await darkswap.createOrder(...);
  },
  retryStrategy({
    maxRetries: 3,
    retryDelay: 1000,
  })
);
```

## Advanced Usage

### Memory Management

The DarkSwap API provides utilities for managing WebAssembly memory. These utilities are available in the `DarkSwapWasmModule` class.

```typescript
import { DarkSwapWasmModule } from 'darkswap-wasm/DarkSwapWasmModule';

// Create a WebAssembly module
const wasmModule = new DarkSwapWasmModule();

// Initialize the module
await wasmModule.initialize({
  initialMemory: 16, // 1MB
  maximumMemory: 256, // 16MB
  sharedMemory: false,
});

// Get memory statistics
const memoryStats = wasmModule.getMemoryStats();
console.log(`Total allocated: ${memoryStats.totalAllocated} bytes`);
console.log(`Peak memory usage: ${memoryStats.peakMemoryUsage} bytes`);
console.log(`Allocations: ${memoryStats.allocations}`);
console.log(`Memory size: ${memoryStats.memorySize} bytes`);
```

### Event Handling

The DarkSwap API emits events that you can listen for. These events are emitted by the `DarkSwapWasm` class.

```typescript
// Listen for order events
const removeOrderListener = darkswap.on('order', (order) => {
  console.log(`Order event: ${order.id}`);
});

// Listen for trade events
const removeTradeListener = darkswap.on('trade', (trade) => {
  console.log(`Trade event: ${trade.id}`);
});

// Listen for error events
const removeErrorListener = darkswap.on('error', (error) => {
  console.error(`Error event: ${error.message}`);
});

// Remove event listeners
removeOrderListener();
removeTradeListener();
removeErrorListener();
```

## Examples

### Creating and Taking an Order

```typescript
import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from 'darkswap-wasm';

// Create DarkSwap instance
const darkswap = new DarkSwapWasm();

// Initialize DarkSwap
await darkswap.initialize({
  bitcoinNetwork: BitcoinNetwork.Testnet,
  relayUrl: 'ws://localhost:8080',
  listenAddresses: [],
  bootstrapPeers: [],
  debug: true,
});

// Create an order
const orderId = await darkswap.createOrder(
  OrderSide.Buy,
  AssetType.Bitcoin,
  'BTC',
  AssetType.Bitcoin,
  'USD',
  '1.0',
  '50000',
);

// Take the order
const tradeId = await darkswap.takeOrder(orderId, '0.5');

// Get the trade
const trade = await darkswap.getTrade(tradeId);
console.log(`Trade: ${JSON.stringify(trade)}`);
```

### Error Handling

```typescript
import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from 'darkswap-wasm';
import { WasmError, OrderError, ErrorCode } from 'darkswap-wasm/ErrorHandling';

// Create DarkSwap instance
const darkswap = new DarkSwapWasm();

try {
  // Initialize DarkSwap
  await darkswap.initialize({
    bitcoinNetwork: BitcoinNetwork.Testnet,
    relayUrl: 'ws://localhost:8080',
    listenAddresses: [],
    bootstrapPeers: [],
    debug: true,
  });
  
  // Create an order
  const orderId = await darkswap.createOrder(
    OrderSide.Buy,
    AssetType.Bitcoin,
    'BTC',
    AssetType.Bitcoin,
    'USD',
    '1.0',
    '50000',
  );
  
  console.log(`Order created: ${orderId}`);
} catch (error) {
  if (error instanceof WasmError) {
    console.error(`WebAssembly error: ${error.message} (code: ${error.code})`);
  } else if (error instanceof OrderError) {
    console.error(`Order error: ${error.message} (code: ${error.code})`);
  } else {
    console.error(`Unknown error: ${error}`);
  }
}
```

### Advanced Error Recovery

```typescript
import DarkSwapWasm, { Config, BitcoinNetwork, AssetType, OrderSide } from 'darkswap-wasm';
import { retry, recover, retryStrategy, fallbackStrategy } from 'darkswap-wasm/ErrorRecovery';
import { wasmAdvancedRecoveryStrategy, networkAdvancedRecoveryStrategy } from 'darkswap-wasm/AdvancedRecovery';

// Create DarkSwap instance
const darkswap = new DarkSwapWasm();

// Initialize DarkSwap with advanced recovery
await recover(
  async () => {
    await darkswap.initialize({
      bitcoinNetwork: BitcoinNetwork.Testnet,
      relayUrl: 'ws://localhost:8080',
      listenAddresses: [],
      bootstrapPeers: [],
      debug: true,
    });
  },
  wasmAdvancedRecoveryStrategy({
    maxRetries: 5,
    retryDelay: 1000,
    useExponentialBackoff: true,
    reportErrors: true,
  })
);

// Create an order with advanced recovery
const orderId = await recover(
  async () => {
    return await darkswap.createOrder(
      OrderSide.Buy,
      AssetType.Bitcoin,
      'BTC',
      AssetType.Bitcoin,
      'USD',
      '1.0',
      '50000',
    );
  },
  networkAdvancedRecoveryStrategy({
    maxRetries: 3,
    retryDelay: 1000,
    useExponentialBackoff: true,
    reportErrors: true,
  })
);

console.log(`Order created: ${orderId}`);