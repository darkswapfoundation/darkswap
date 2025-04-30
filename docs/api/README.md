# DarkSwap API Documentation

This documentation provides comprehensive information about the DarkSwap API, including endpoints, request/response formats, authentication, and error handling.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Wallet API](#wallet-api)
- [P2P Network API](#p2p-network-api)
- [Orderbook API](#orderbook-api)
- [Trade API](#trade-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [WebSocket API](#websocket-api)

## Authentication

DarkSwap API uses JWT (JSON Web Tokens) for authentication. To authenticate, you need to include the JWT token in the Authorization header of your requests.

```
Authorization: Bearer <token>
```

### Obtaining a Token

To obtain a token, you need to authenticate with the `/auth/login` endpoint:

```
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-04-05T12:00:00Z"
}
```

## Base URL

The base URL for the API depends on the environment:

- Production: `https://api.darkswap.io`
- Staging: `https://staging-api.darkswap.io`
- Development: `http://localhost:3000`

## Wallet API

### Open Wallet

```
POST /wallet/open
Content-Type: application/json
Authorization: Bearer <token>

{
  "password": "wallet_password"
}
```

Response:

```json
{
  "address": "bc1q...",
  "publicKey": "03a1..."
}
```

### Close Wallet

```
POST /wallet/close
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true
}
```

### Get Balance

```
GET /wallet/balance
Authorization: Bearer <token>
```

Response:

```json
{
  "balance": {
    "BTC": 1.5,
    "RUNE1": 500,
    "ALKANE1": 200
  }
}
```

### Send Transaction

```
POST /wallet/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "to": "bc1q...",
  "amount": 0.1,
  "asset": "BTC"
}
```

Response:

```json
{
  "txid": "a1b2c3...",
  "status": "pending"
}
```

## P2P Network API

### Get Peers

```
GET /p2p/peers
Authorization: Bearer <token>
```

Response:

```json
{
  "peers": [
    {
      "id": "QmPeer1",
      "address": "/ip4/127.0.0.1/tcp/8000/p2p/QmPeer1",
      "connected": true,
      "lastSeen": "2025-04-04T12:00:00Z"
    }
  ],
  "total": 1
}
```

### Connect to Peer

```
POST /p2p/connect
Content-Type: application/json
Authorization: Bearer <token>

{
  "address": "/ip4/127.0.0.1/tcp/8000/p2p/QmPeer1"
}
```

Response:

```json
{
  "success": true,
  "peer": {
    "id": "QmPeer1",
    "address": "/ip4/127.0.0.1/tcp/8000/p2p/QmPeer1",
    "connected": true
  }
}
```

## Orderbook API

### Get Orders

```
GET /orderbook?sellAsset=BTC&buyAsset=RUNE1
Authorization: Bearer <token>
```

Response:

```json
{
  "orders": [
    {
      "id": "order1",
      "type": "sell",
      "sellAsset": "BTC",
      "sellAmount": 0.1,
      "buyAsset": "RUNE1",
      "buyAmount": 1000,
      "price": 10000,
      "timestamp": 1712345678,
      "maker": "QmPeer1"
    }
  ],
  "total": 1
}
```

### Create Order

```
POST /orderbook
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "sell",
  "sellAsset": "BTC",
  "sellAmount": 0.1,
  "buyAsset": "RUNE1",
  "buyAmount": 1000
}
```

Response:

```json
{
  "id": "order1",
  "type": "sell",
  "sellAsset": "BTC",
  "sellAmount": 0.1,
  "buyAsset": "RUNE1",
  "buyAmount": 1000,
  "price": 10000,
  "timestamp": 1712345678,
  "maker": "QmPeer1"
}
```

### Cancel Order

```
DELETE /orderbook/:id
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true
}
```

## Trade API

### Get Trades

```
GET /trades
Authorization: Bearer <token>
```

Response:

```json
{
  "trades": [
    {
      "id": "trade1",
      "sellAsset": "BTC",
      "sellAmount": 0.1,
      "buyAsset": "RUNE1",
      "buyAmount": 1000,
      "status": "pending",
      "timestamp": 1712345678,
      "maker": "QmPeer1",
      "taker": "QmPeer2"
    }
  ],
  "total": 1
}
```

### Create Trade

```
POST /trades
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "order1"
}
```

Response:

```json
{
  "id": "trade1",
  "sellAsset": "BTC",
  "sellAmount": 0.1,
  "buyAsset": "RUNE1",
  "buyAmount": 1000,
  "status": "pending",
  "timestamp": 1712345678,
  "maker": "QmPeer1",
  "taker": "QmPeer2"
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. In case of an error, the response body will contain an error message and code.

```json
{
  "error": {
    "code": "WALLET_NOT_OPEN",
    "message": "Wallet is not open"
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Authentication is required or failed
- `WALLET_NOT_OPEN`: Wallet is not open
- `INSUFFICIENT_FUNDS`: Insufficient funds for the transaction
- `INVALID_ADDRESS`: Invalid address
- `INVALID_AMOUNT`: Invalid amount
- `INVALID_ASSET`: Invalid asset
- `ORDER_NOT_FOUND`: Order not found
- `TRADE_NOT_FOUND`: Trade not found
- `PEER_NOT_FOUND`: Peer not found
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

The API implements rate limiting to prevent abuse. The rate limits are as follows:

- 60 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

When the rate limit is exceeded, the API will return a 429 Too Many Requests response with a Retry-After header indicating the number of seconds to wait before making another request.

## WebSocket API

The WebSocket API allows you to receive real-time updates for the orderbook, trades, and wallet events.

### Connection

```
wss://ws.darkswap.io
```

### Authentication

To authenticate, send an authentication message after connecting:

```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Subscribe to Topics

To subscribe to a topic, send a subscribe message:

```json
{
  "type": "subscribe",
  "topic": "orderbook/BTC/RUNE1"
}
```

Available topics:

- `orderbook/<sellAsset>/<buyAsset>`: Orderbook updates for a specific pair
- `trades`: All trade updates
- `trades/<id>`: Updates for a specific trade
- `wallet`: Wallet balance and transaction updates

### Unsubscribe from Topics

To unsubscribe from a topic, send an unsubscribe message:

```json
{
  "type": "unsubscribe",
  "topic": "orderbook/BTC/RUNE1"
}
```

### Message Format

Messages received from the WebSocket API have the following format:

```json
{
  "type": "orderbook_update",
  "topic": "orderbook/BTC/RUNE1",
  "data": {
    "action": "add",
    "order": {
      "id": "order1",
      "type": "sell",
      "sellAsset": "BTC",
      "sellAmount": 0.1,
      "buyAsset": "RUNE1",
      "buyAmount": 1000,
      "price": 10000,
      "timestamp": 1712345678,
      "maker": "QmPeer1"
    }
  }
}
```

Message types:

- `orderbook_update`: Orderbook update
- `trade_update`: Trade update
- `wallet_update`: Wallet update
- `error`: Error message