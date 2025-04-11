# DarkSwap SDK Guide

## Introduction

The DarkSwap SDK provides a comprehensive set of tools for developers to interact with the DarkSwap platform programmatically. This guide will help you get started with the SDK and provide examples of common use cases.

## Installation

### JavaScript/TypeScript

```bash
npm install @darkswap/sdk
```

or

```bash
yarn add @darkswap/sdk
```

### Rust

Add the following to your `Cargo.toml`:

```toml
[dependencies]
darkswap-sdk = "1.0.0"
```

## Getting Started

### JavaScript/TypeScript

```typescript
import { DarkSwap, Network } from '@darkswap/sdk';

// Initialize the SDK
const darkswap = new DarkSwap({
  network: Network.MAINNET, // or Network.TESTNET
  apiKey: 'your_api_key', // optional
});

// Connect to a wallet
await darkswap.connect('metamask'); // or 'walletconnect', etc.

// Get wallet balance
const balance = await darkswap.wallet.getBalance();
console.log('BTC Balance:', balance.BTC);
console.log('RUNE Balance:', balance.RUNE);
```

### Rust

```rust
use darkswap_sdk::{DarkSwap, Network};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the SDK
    let darkswap = DarkSwap::new(Network::Mainnet)?;

    // Connect to a wallet
    darkswap.connect_wallet("path/to/wallet.dat", "password")?;

    // Get wallet balance
    let balance = darkswap.wallet().get_balance()?;
    println!("BTC Balance: {}", balance.get("BTC").unwrap_or(&0.0));
    println!("RUNE Balance: {}", balance.get("RUNE").unwrap_or(&0.0));

    Ok(())
}
```

## Core Concepts

### Networks

The DarkSwap SDK supports multiple networks:

- `Network.MAINNET`: The main DarkSwap network
- `Network.TESTNET`: The DarkSwap test network
- `Network.REGTEST`: A local regtest network for development

### Wallets

The SDK provides a wallet interface for managing assets and signing transactions:

#### JavaScript/TypeScript

```typescript
// Create a new wallet
const wallet = await darkswap.wallet.create();
console.log('Mnemonic:', wallet.mnemonic);
console.log('Address:', wallet.address);

// Import an existing wallet
const importedWallet = await darkswap.wallet.import('your mnemonic phrase here');
console.log('Address:', importedWallet.address);

// Sign a message
const signature = await darkswap.wallet.signMessage('Hello, DarkSwap!');
console.log('Signature:', signature);

// Verify a signature
const isValid = await darkswap.wallet.verifySignature(
  'Hello, DarkSwap!',
  signature,
  importedWallet.address
);
console.log('Is valid signature:', isValid);
```

#### Rust

```rust
// Create a new wallet
let wallet = darkswap.create_wallet()?;
println!("Mnemonic: {}", wallet.mnemonic());
println!("Address: {}", wallet.address());

// Import an existing wallet
let imported_wallet = darkswap.import_wallet("your mnemonic phrase here")?;
println!("Address: {}", imported_wallet.address());

// Sign a message
let signature = darkswap.wallet().sign_message("Hello, DarkSwap!")?;
println!("Signature: {}", signature);

// Verify a signature
let is_valid = darkswap.wallet().verify_signature(
    "Hello, DarkSwap!",
    &signature,
    imported_wallet.address()
)?;
println!("Is valid signature: {}", is_valid);
```

### Orders

The SDK provides methods for creating and managing orders:

#### JavaScript/TypeScript

```typescript
// Create a buy order
const buyOrder = await darkswap.orders.create({
  type: 'buy',
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.0001',
  amount: '10',
});
console.log('Buy Order ID:', buyOrder.id);

// Create a sell order
const sellOrder = await darkswap.orders.create({
  type: 'sell',
  baseAsset: 'BTC',
  quoteAsset: 'RUNE',
  price: '0.0001',
  amount: '5',
});
console.log('Sell Order ID:', sellOrder.id);

// Get all orders
const orders = await darkswap.orders.getAll();
console.log('Orders:', orders);

// Get a specific order
const order = await darkswap.orders.get(buyOrder.id);
console.log('Order:', order);

// Cancel an order
await darkswap.orders.cancel(sellOrder.id);
console.log('Order cancelled');
```

#### Rust

```rust
// Create a buy order
let buy_order = darkswap.create_order(OrderParams {
    order_type: OrderType::Buy,
    base_asset: "BTC".to_string(),
    quote_asset: "RUNE".to_string(),
    price: 0.0001,
    amount: 10.0,
})?;
println!("Buy Order ID: {}", buy_order.id());

// Create a sell order
let sell_order = darkswap.create_order(OrderParams {
    order_type: OrderType::Sell,
    base_asset: "BTC".to_string(),
    quote_asset: "RUNE".to_string(),
    price: 0.0001,
    amount: 5.0,
})?;
println!("Sell Order ID: {}", sell_order.id());

// Get all orders
let orders = darkswap.get_orders()?;
println!("Orders: {:?}", orders);

// Get a specific order
let order = darkswap.get_order(&buy_order.id())?;
println!("Order: {:?}", order);

// Cancel an order
darkswap.cancel_order(&sell_order.id())?;
println!("Order cancelled");
```

### Trades

The SDK provides methods for managing trades:

#### JavaScript/TypeScript

```typescript
// Get all trades
const trades = await darkswap.trades.getAll();
console.log('Trades:', trades);

// Get a specific trade
const trade = await darkswap.trades.get('trade123');
console.log('Trade:', trade);

// Sign a trade
const signedTrade = await darkswap.trades.sign('trade123');
console.log('Signed Trade:', signedTrade);
```

#### Rust

```rust
// Get all trades
let trades = darkswap.get_trades()?;
println!("Trades: {:?}", trades);

// Get a specific trade
let trade = darkswap.get_trade("trade123")?;
println!("Trade: {:?}", trade);

// Sign a trade
let signed_trade = darkswap.sign_trade("trade123")?;
println!("Signed Trade: {:?}", signed_trade);
```

### Market Data

The SDK provides methods for accessing market data:

#### JavaScript/TypeScript

```typescript
// Get ticker for all trading pairs
const tickers = await darkswap.market.getTickers();
console.log('Tickers:', tickers);

// Get ticker for a specific trading pair
const ticker = await darkswap.market.getTicker('BTC', 'RUNE');
console.log('BTC/RUNE Ticker:', ticker);

// Get orderbook for a specific trading pair
const orderbook = await darkswap.market.getOrderbook('BTC', 'RUNE');
console.log('BTC/RUNE Orderbook:', orderbook);

// Get recent trades for a specific trading pair
const trades = await darkswap.market.getTrades('BTC', 'RUNE');
console.log('BTC/RUNE Trades:', trades);
```

#### Rust

```rust
// Get ticker for all trading pairs
let tickers = darkswap.get_tickers()?;
println!("Tickers: {:?}", tickers);

// Get ticker for a specific trading pair
let ticker = darkswap.get_ticker("BTC", "RUNE")?;
println!("BTC/RUNE Ticker: {:?}", ticker);

// Get orderbook for a specific trading pair
let orderbook = darkswap.get_orderbook("BTC", "RUNE")?;
println!("BTC/RUNE Orderbook: {:?}", orderbook);

// Get recent trades for a specific trading pair
let trades = darkswap.get_market_trades("BTC", "RUNE")?;
println!("BTC/RUNE Trades: {:?}", trades);
```

## Advanced Usage

### WebRTC P2P Communication

The SDK provides methods for peer-to-peer communication using WebRTC:

#### JavaScript/TypeScript

```typescript
// Initialize P2P
await darkswap.p2p.init();

// Connect to a peer
const connection = await darkswap.p2p.connect('peer_id');

// Send a message
await connection.send('Hello, peer!');

// Listen for messages
connection.on('message', (message) => {
  console.log('Received message:', message);
});

// Close the connection
await connection.close();
```

#### Rust

```rust
// Initialize P2P
darkswap.p2p_init()?;

// Connect to a peer
let connection = darkswap.p2p_connect("peer_id")?;

// Send a message
connection.send("Hello, peer!")?;

// Listen for messages
connection.on_message(|message| {
    println!("Received message: {}", message);
});

// Close the connection
connection.close()?;
```

### WebAssembly Integration

The SDK provides WebAssembly modules for performance-critical operations:

#### JavaScript/TypeScript

```typescript
// Initialize WebAssembly
await darkswap.wasm.init();

// Use WebAssembly for cryptographic operations
const hash = await darkswap.wasm.sha256('Hello, DarkSwap!');
console.log('SHA-256 Hash:', hash);

// Use WebAssembly for PSBT operations
const psbt = await darkswap.wasm.createPsbt({
  inputs: [...],
  outputs: [...],
});
console.log('PSBT:', psbt);
```

#### Rust

```rust
// WebAssembly is used automatically in the Rust SDK
// No additional setup required
```

### Event Handling

The SDK provides an event system for real-time updates:

#### JavaScript/TypeScript

```typescript
// Subscribe to order events
darkswap.events.on('order', (order) => {
  console.log('Order event:', order);
});

// Subscribe to trade events
darkswap.events.on('trade', (trade) => {
  console.log('Trade event:', trade);
});

// Subscribe to wallet events
darkswap.events.on('wallet', (wallet) => {
  console.log('Wallet event:', wallet);
});

// Unsubscribe from events
darkswap.events.off('order');
```

#### Rust

```rust
// Subscribe to order events
darkswap.on_order(|order| {
    println!("Order event: {:?}", order);
});

// Subscribe to trade events
darkswap.on_trade(|trade| {
    println!("Trade event: {:?}", trade);
});

// Subscribe to wallet events
darkswap.on_wallet(|wallet| {
    println!("Wallet event: {:?}", wallet);
});

// Unsubscribe from events
darkswap.off_order();
```

## Error Handling

The SDK provides a comprehensive error handling system:

#### JavaScript/TypeScript

```typescript
try {
  await darkswap.orders.create({
    type: 'buy',
    baseAsset: 'BTC',
    quoteAsset: 'RUNE',
    price: '0.0001',
    amount: '10',
  });
} catch (error) {
  if (error instanceof darkswap.errors.InsufficientFundsError) {
    console.error('Insufficient funds:', error.message);
  } else if (error instanceof darkswap.errors.NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

#### Rust

```rust
match darkswap.create_order(OrderParams {
    order_type: OrderType::Buy,
    base_asset: "BTC".to_string(),
    quote_asset: "RUNE".to_string(),
    price: 0.0001,
    amount: 10.0,
}) {
    Ok(order) => println!("Order created: {:?}", order),
    Err(error) => match error {
        DarkSwapError::InsufficientFunds(msg) => println!("Insufficient funds: {}", msg),
        DarkSwapError::NetworkError(msg) => println!("Network error: {}", msg),
        _ => println!("Unknown error: {:?}", error),
    },
}
```

## Configuration

The SDK can be configured with various options:

#### JavaScript/TypeScript

```typescript
const darkswap = new DarkSwap({
  network: Network.MAINNET,
  apiKey: 'your_api_key',
  apiUrl: 'https://custom-api.darkswap.io/v1',
  wsUrl: 'wss://custom-ws.darkswap.io/v1',
  timeout: 30000, // 30 seconds
  retries: 3,
  logger: {
    level: 'debug', // 'debug', 'info', 'warn', 'error'
    enabled: true,
  },
});
```

#### Rust

```rust
let config = Config {
    network: Network::Mainnet,
    api_key: Some("your_api_key".to_string()),
    api_url: Some("https://custom-api.darkswap.io/v1".to_string()),
    ws_url: Some("wss://custom-ws.darkswap.io/v1".to_string()),
    timeout: Some(30000), // 30 seconds
    retries: Some(3),
    log_level: Some(LogLevel::Debug),
};

let darkswap = DarkSwap::with_config(config)?;
```

## Examples

### Complete Trading Example

#### JavaScript/TypeScript

```typescript
import { DarkSwap, Network } from '@darkswap/sdk';

async function main() {
  try {
    // Initialize the SDK
    const darkswap = new DarkSwap({
      network: Network.TESTNET,
    });

    // Connect to a wallet
    await darkswap.connect('metamask');
    console.log('Connected to wallet');

    // Get wallet balance
    const balance = await darkswap.wallet.getBalance();
    console.log('BTC Balance:', balance.BTC);
    console.log('RUNE Balance:', balance.RUNE);

    // Create a buy order
    const buyOrder = await darkswap.orders.create({
      type: 'buy',
      baseAsset: 'BTC',
      quoteAsset: 'RUNE',
      price: '0.0001',
      amount: '10',
    });
    console.log('Buy Order created:', buyOrder);

    // Wait for the order to be matched
    console.log('Waiting for order to be matched...');
    const trade = await new Promise((resolve) => {
      darkswap.events.on('trade', (trade) => {
        if (trade.buyOrderId === buyOrder.id) {
          resolve(trade);
        }
      });
    });
    console.log('Trade created:', trade);

    // Sign the trade
    const signedTrade = await darkswap.trades.sign(trade.id);
    console.log('Trade signed:', signedTrade);

    // Wait for the trade to complete
    console.log('Waiting for trade to complete...');
    const completedTrade = await new Promise((resolve) => {
      darkswap.events.on('trade', (updatedTrade) => {
        if (updatedTrade.id === trade.id && updatedTrade.status === 'completed') {
          resolve(updatedTrade);
        }
      });
    });
    console.log('Trade completed:', completedTrade);

    // Get updated wallet balance
    const updatedBalance = await darkswap.wallet.getBalance();
    console.log('Updated BTC Balance:', updatedBalance.BTC);
    console.log('Updated RUNE Balance:', updatedBalance.RUNE);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

#### Rust

```rust
use darkswap_sdk::{DarkSwap, Network, OrderParams, OrderType};
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the SDK
    let darkswap = DarkSwap::new(Network::Testnet)?;

    // Connect to a wallet
    darkswap.connect_wallet("path/to/wallet.dat", "password")?;
    println!("Connected to wallet");

    // Get wallet balance
    let balance = darkswap.wallet().get_balance()?;
    println!("BTC Balance: {}", balance.get("BTC").unwrap_or(&0.0));
    println!("RUNE Balance: {}", balance.get("RUNE").unwrap_or(&0.0));

    // Create a buy order
    let buy_order = darkswap.create_order(OrderParams {
        order_type: OrderType::Buy,
        base_asset: "BTC".to_string(),
        quote_asset: "RUNE".to_string(),
        price: 0.0001,
        amount: 10.0,
    })?;
    println!("Buy Order created: {:?}", buy_order);

    // Wait for the order to be matched
    println!("Waiting for order to be matched...");
    let (tx, rx) = std::sync::mpsc::channel();
    darkswap.on_trade(move |trade| {
        if trade.buy_order_id() == buy_order.id() {
            tx.send(trade.clone()).unwrap();
        }
    });
    let trade = rx.recv_timeout(Duration::from_secs(60))?;
    println!("Trade created: {:?}", trade);

    // Sign the trade
    let signed_trade = darkswap.sign_trade(&trade.id())?;
    println!("Trade signed: {:?}", signed_trade);

    // Wait for the trade to complete
    println!("Waiting for trade to complete...");
    let (tx, rx) = std::sync::mpsc::channel();
    darkswap.on_trade(move |updated_trade| {
        if updated_trade.id() == trade.id() && updated_trade.status() == "completed" {
            tx.send(updated_trade.clone()).unwrap();
        }
    });
    let completed_trade = rx.recv_timeout(Duration::from_secs(60))?;
    println!("Trade completed: {:?}", completed_trade);

    // Get updated wallet balance
    let updated_balance = darkswap.wallet().get_balance()?;
    println!("Updated BTC Balance: {}", updated_balance.get("BTC").unwrap_or(&0.0));
    println!("Updated RUNE Balance: {}", updated_balance.get("RUNE").unwrap_or(&0.0));

    Ok(())
}
```

## API Reference

For a complete API reference, please see the [API Reference](./api-reference.md) document.

## Support

If you have any questions or need help with the DarkSwap SDK, please contact us at sdk@darkswap.io.