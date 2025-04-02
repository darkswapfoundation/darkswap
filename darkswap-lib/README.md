# DarkSwap TypeScript Library

A TypeScript library for interacting with the DarkSwap network, providing functionality for wallet integration, order management, and trade execution.

## Features

- **Wallet Integration**: Connect to Bitcoin wallets, sign messages and transactions, and manage PSBTs (Partially Signed Bitcoin Transactions).
- **Orderbook Management**: Create, manage, and match orders for trading Bitcoin, runes, and alkanes.
- **Trade Execution**: Execute trades between users in a peer-to-peer manner.
- **P2P Networking**: Connect to the DarkSwap P2P network using WebRTC.
- **API Client**: Interact with the DarkSwap API.

## Installation

```bash
npm install @darkswap/lib
```

## Usage

### Client

```typescript
import { createClient } from '@darkswap/lib';

// Create a client
const client = createClient({
  apiUrl: 'https://api.darkswap.xyz',
  wsUrl: 'wss://ws.darkswap.xyz',
  network: 'mainnet',
});

// Connect to the WebSocket API
await client.connectWebSocket();

// Make API requests
const orders = await client.get('/orderbook/BTC/RUNE:0x123');
```

### Wallet

```typescript
import { createWallet, WalletType } from '@darkswap/lib';

// Create a wallet
const wallet = createWallet({
  type: WalletType.WASM,
  network: 'mainnet',
  autoConnect: true,
});

// Connect to the wallet
const connected = await wallet.connect();

if (connected) {
  // Get the wallet address
  const address = wallet.getAddress();
  console.log('Wallet address:', address);
  
  // Get the wallet balance
  const balance = wallet.getBalance();
  console.log('BTC balance:', balance.btc.btc);
  console.log('Rune balances:', balance.runes);
  console.log('Alkane balances:', balance.alkanes);
  
  // Sign a message
  const signature = await wallet.signMessage('Hello, DarkSwap!');
  console.log('Signature:', signature);
}
```

### Orderbook

```typescript
import { createClient, createOrderbook, OrderSide } from '@darkswap/lib';

// Create a client
const client = createClient();

// Create an orderbook
const orderbook = createOrderbook(client, {
  baseAsset: 'BTC',
  quoteAsset: 'RUNE:0x123',
  autoSync: true,
});

// Sync the orderbook
await orderbook.sync();

// Get all orders
const orders = orderbook.getOrders();
console.log('Orders:', orders);

// Get buy orders
const buyOrders = orderbook.getBuyOrders();
console.log('Buy orders:', buyOrders);

// Get sell orders
const sellOrders = orderbook.getSellOrders();
console.log('Sell orders:', sellOrders);

// Create a new order
const orderId = await orderbook.createOrder(
  OrderSide.BUY,
  '0.1',
  '20000',
  24 * 60 * 60 * 1000
);
console.log('Order ID:', orderId);
```

### Trade

```typescript
import { createClient, createWallet, createTrade, WalletType } from '@darkswap/lib';

// Create a client
const client = createClient();

// Create a wallet
const wallet = createWallet({
  type: WalletType.WASM,
  network: 'mainnet',
});

// Connect to the wallet
await wallet.connect();

// Create a trade
const trade = createTrade(client, wallet, {
  autoFinalize: true,
  autoBroadcast: true,
});

// Create a trade between a maker and taker order
const tradeExecution = await trade.createTrade(makerOrder, takerOrder);
console.log('Trade ID:', tradeExecution.id);

// Wait for the trade to complete
const completedTrade = await trade.waitForTradeCompletion(tradeExecution.id);
console.log('Trade completed:', completedTrade);
```

### P2P

```typescript
import { createP2P } from '@darkswap/lib';

// Create a P2P instance
const p2p = createP2P({
  signalingServers: ['wss://signaling.darkswap.xyz'],
  bootstrapPeers: ['/dns4/bootstrap.darkswap.xyz/tcp/9000/wss/p2p/QmBootstrapPeer1'],
  enableDht: true,
  enableLocalDiscovery: true,
  maxPeers: 10,
  autoStart: true,
});

// Start the P2P network
await p2p.start();

// Get all peers
const peers = p2p.getPeers();
console.log('Peers:', peers);

// Send a message to a peer
p2p.sendToPeer('peer-id', {
  type: 'chat',
  payload: {
    message: 'Hello, peer!',
  },
});

// Broadcast a message to all peers
p2p.broadcast({
  type: 'chat',
  payload: {
    message: 'Hello, everyone!',
  },
});
```

### Events

```typescript
import { EventType } from '@darkswap/lib';

// Listen for wallet events
wallet.on(EventType.WALLET_CONNECTED, () => {
  console.log('Wallet connected');
});

wallet.on(EventType.WALLET_DISCONNECTED, () => {
  console.log('Wallet disconnected');
});

wallet.on(EventType.WALLET_BALANCE_CHANGED, (data) => {
  console.log('Wallet balance changed:', data.balance);
});

// Listen for orderbook events
orderbook.on(EventType.ORDERBOOK_ORDER_ADDED, (data) => {
  console.log('Order added:', data.order);
});

orderbook.on(EventType.ORDERBOOK_ORDER_REMOVED, (data) => {
  console.log('Order removed:', data.orderId);
});

orderbook.on(EventType.ORDERBOOK_ORDER_UPDATED, (data) => {
  console.log('Order updated:', data.order);
});

// Listen for trade events
trade.on(EventType.TRADE_CREATED, (data) => {
  console.log('Trade created:', data.trade);
});

trade.on(EventType.TRADE_EXECUTED, (data) => {
  console.log('Trade executed:', data.trade);
});

trade.on(EventType.TRADE_FAILED, (data) => {
  console.log('Trade failed:', data.trade);
});

// Listen for P2P events
p2p.on(EventType.P2P_CONNECTED, () => {
  console.log('P2P connected');
});

p2p.on(EventType.P2P_DISCONNECTED, () => {
  console.log('P2P disconnected');
});

p2p.on(EventType.P2P_PEER_CONNECTED, (data) => {
  console.log('Peer connected:', data.peer);
});

p2p.on(EventType.P2P_PEER_DISCONNECTED, (data) => {
  console.log('Peer disconnected:', data.peer);
});
```

## API Reference

### Client

- `createClient(options)`: Create a new DarkSwap client
- `client.connectWebSocket()`: Connect to the WebSocket API
- `client.disconnectWebSocket()`: Disconnect from the WebSocket API
- `client.get(path, params, config)`: Make a GET request to the API
- `client.post(path, data, config)`: Make a POST request to the API
- `client.put(path, data, config)`: Make a PUT request to the API
- `client.delete(path, config)`: Make a DELETE request to the API
- `client.on(event, handler)`: Add an event listener
- `client.off(event, handler)`: Remove an event listener
- `client.once(event, handler)`: Add a one-time event listener
- `client.emit(event, data)`: Emit an event

### Wallet

- `createWallet(options)`: Create a new wallet
- `wallet.connect()`: Connect to the wallet
- `wallet.disconnect()`: Disconnect from the wallet
- `wallet.isConnected()`: Check if the wallet is connected
- `wallet.getAddress()`: Get the wallet address
- `wallet.getBalance()`: Get the wallet balance
- `wallet.getBitcoinBalance()`: Get the Bitcoin balance
- `wallet.getRuneBalances()`: Get the rune balances
- `wallet.getAlkaneBalances()`: Get the alkane balances
- `wallet.signMessage(message)`: Sign a message
- `wallet.signTransaction(txHex)`: Sign a transaction
- `wallet.createPsbt(inputs, outputs)`: Create a PSBT
- `wallet.signPsbt(psbtBase64)`: Sign a PSBT
- `wallet.finalizePsbt(psbtBase64)`: Finalize a PSBT
- `wallet.extractTx(psbtBase64)`: Extract a transaction from a PSBT
- `wallet.broadcastTx(txHex)`: Broadcast a transaction

### Orderbook

- `createOrderbook(client, options)`: Create a new orderbook
- `orderbook.sync()`: Sync the orderbook
- `orderbook.createOrder(side, amount, price, expiry)`: Create a new order
- `orderbook.cancelOrder(orderId)`: Cancel an order
- `orderbook.getOrders()`: Get all orders
- `orderbook.getBuyOrders()`: Get buy orders
- `orderbook.getSellOrders()`: Get sell orders
- `orderbook.getOrder(orderId)`: Get an order by ID
- `orderbook.getBestBuyOrder()`: Get the best buy order
- `orderbook.getBestSellOrder()`: Get the best sell order
- `orderbook.getSpread()`: Get the spread
- `orderbook.getMidPrice()`: Get the mid price
- `orderbook.getBaseAsset()`: Get the base asset
- `orderbook.getQuoteAsset()`: Get the quote asset
- `orderbook.isSynced()`: Check if the orderbook is synced
- `orderbook.matchOrder(side, amount, price)`: Match an order

### Trade

- `createTrade(client, wallet, options)`: Create a new trade
- `trade.createTrade(makerOrder, takerOrder)`: Create a trade
- `trade.executeTrade(tradeId)`: Execute a trade
- `trade.getTrades()`: Get all trades
- `trade.getTrade(tradeId)`: Get a trade by ID
- `trade.waitForTradeCompletion(tradeId, timeout)`: Wait for a trade to complete

### P2P

- `createP2P(options)`: Create a new P2P instance
- `p2p.start()`: Start the P2P network
- `p2p.stop()`: Stop the P2P network
- `p2p.sendToPeer(peerId, message)`: Send a message to a peer
- `p2p.broadcast(message)`: Broadcast a message to all peers
- `p2p.getPeerId()`: Get the peer ID
- `p2p.getStatus()`: Get the connection status
- `p2p.getPeers()`: Get all peers
- `p2p.getPeer(peerId)`: Get a peer by ID
- `p2p.isPeerConnected(peerId)`: Check if a peer is connected
- `p2p.getPeerCount()`: Get the number of connected peers

## License

This project is licensed under the MIT License - see the LICENSE file for details.