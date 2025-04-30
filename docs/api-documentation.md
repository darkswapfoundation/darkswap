# DarkSwap API Documentation

This document provides comprehensive documentation for the DarkSwap API, including endpoints, request/response formats, authentication, error codes, and rate limits.

## Base URL

```
https://api.darkswap.io
```

## Authentication

Most API endpoints require authentication. To authenticate, include a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

To obtain a token, use the `/api/auth/login` endpoint.

## Error Handling

All API errors follow a standard format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* Additional error details */ }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication is required or failed |
| `FORBIDDEN` | User does not have permission to access the resource |
| `NOT_FOUND` | The requested resource was not found |
| `VALIDATION_ERROR` | The request data failed validation |
| `RATE_LIMITED` | The request was rate limited |
| `SERVER_ERROR` | An internal server error occurred |

## Rate Limiting

API requests are rate limited to prevent abuse. Rate limits are applied per IP address and per user.

| Endpoint | Rate Limit |
|----------|------------|
| `/api/auth/*` | 10 requests per minute |
| `/api/wallet/*` | 60 requests per minute |
| `/api/orders/*` | 120 requests per minute |
| `/api/trades/*` | 120 requests per minute |
| `/api/market/*` | 300 requests per minute |
| `/api/p2p/*` | 60 requests per minute |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1617984000
```

## API Endpoints

### Authentication

#### Register a new user

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "userId": "123456789",
  "username": "user123",
  "email": "user@example.com",
  "token": "jwt-token"
}
```

#### Login

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "userId": "123456789",
  "username": "user123",
  "email": "user@example.com",
  "token": "jwt-token"
}
```

#### Verify Token

```
GET /api/auth/verify
```

**Response:**

```json
{
  "valid": true,
  "userId": "123456789",
  "username": "user123",
  "email": "user@example.com"
}
```

#### Refresh Token

```
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "token": "jwt-token"
}
```

**Response:**

```json
{
  "token": "new-jwt-token",
  "expiresAt": "2025-04-11T12:00:00.000Z"
}
```

### Wallet

#### Get Wallet Balance

```
GET /api/wallet/balance
```

**Response:**

```json
{
  "BTC": "1.23456789",
  "ETH": "10.0",
  "RUNE_ABC": "1000.0",
  "ALKANE_XYZ": "500.0"
}
```

#### Get Transaction History

```
GET /api/wallet/transactions
```

**Query Parameters:**

- `asset` (optional): Filter by asset
- `type` (optional): Filter by transaction type (deposit, withdrawal)
- `limit` (optional): Maximum number of transactions to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
[
  {
    "id": "tx123456",
    "asset": "BTC",
    "amount": "0.1",
    "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    "type": "withdrawal",
    "status": "completed",
    "timestamp": "2025-04-10T12:00:00.000Z"
  },
  {
    "id": "tx123457",
    "asset": "ETH",
    "amount": "1.0",
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "type": "deposit",
    "status": "completed",
    "timestamp": "2025-04-09T12:00:00.000Z"
  }
]
```

#### Create Deposit Address

```
POST /api/wallet/deposit-address
```

**Request Body:**

```json
{
  "asset": "BTC"
}
```

**Response:**

```json
{
  "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
}
```

#### Withdraw Funds

```
POST /api/wallet/withdraw
```

**Request Body:**

```json
{
  "asset": "BTC",
  "amount": "0.1",
  "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
}
```

**Response:**

```json
{
  "transactionId": "tx123456"
}
```

### Orders

#### Get All Orders

```
GET /api/orders
```

**Query Parameters:**

- `status` (optional): Filter by status (open, filled, cancelled)
- `type` (optional): Filter by type (buy, sell)
- `baseAsset` (optional): Filter by base asset
- `quoteAsset` (optional): Filter by quote asset
- `limit` (optional): Maximum number of orders to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
[
  {
    "id": "order123456",
    "userId": "123456789",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "10.0",
    "amount": "1.0",
    "filled": "0.5",
    "type": "buy",
    "status": "open",
    "createdAt": "2025-04-10T12:00:00.000Z",
    "updatedAt": "2025-04-10T12:00:00.000Z"
  },
  {
    "id": "order123457",
    "userId": "123456789",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "11.0",
    "amount": "1.0",
    "filled": "1.0",
    "type": "sell",
    "status": "filled",
    "createdAt": "2025-04-09T12:00:00.000Z",
    "updatedAt": "2025-04-09T12:00:00.000Z"
  }
]
```

#### Get Order

```
GET /api/orders/:id
```

**Response:**

```json
{
  "id": "order123456",
  "userId": "123456789",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "filled": "0.5",
  "type": "buy",
  "status": "open",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

#### Create Order

```
POST /api/orders
```

**Request Body:**

```json
{
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "type": "buy"
}
```

**Response:**

```json
{
  "id": "order123456",
  "userId": "123456789",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "filled": "0.0",
  "type": "buy",
  "status": "open",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

#### Cancel Order

```
DELETE /api/orders/:id
```

**Response:**

```json
{
  "id": "order123456",
  "userId": "123456789",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "filled": "0.0",
  "type": "buy",
  "status": "cancelled",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

### Trades

#### Get All Trades

```
GET /api/trades
```

**Query Parameters:**

- `status` (optional): Filter by status (pending, completed, cancelled)
- `baseAsset` (optional): Filter by base asset
- `quoteAsset` (optional): Filter by quote asset
- `limit` (optional): Maximum number of trades to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
[
  {
    "id": "trade123456",
    "buyOrderId": "order123456",
    "sellOrderId": "order123458",
    "buyUserId": "123456789",
    "sellUserId": "987654321",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "10.0",
    "amount": "1.0",
    "status": "completed",
    "createdAt": "2025-04-10T12:00:00.000Z",
    "updatedAt": "2025-04-10T12:00:00.000Z"
  },
  {
    "id": "trade123457",
    "buyOrderId": "order123457",
    "sellOrderId": "order123459",
    "buyUserId": "123456789",
    "sellUserId": "987654321",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "11.0",
    "amount": "1.0",
    "status": "pending",
    "createdAt": "2025-04-09T12:00:00.000Z",
    "updatedAt": "2025-04-09T12:00:00.000Z"
  }
]
```

#### Get Trade

```
GET /api/trades/:id
```

**Response:**

```json
{
  "id": "trade123456",
  "buyOrderId": "order123456",
  "sellOrderId": "order123458",
  "buyUserId": "123456789",
  "sellUserId": "987654321",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "status": "completed",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

#### Create Trade

```
POST /api/trades
```

**Request Body:**

```json
{
  "buyOrderId": "order123456",
  "sellOrderId": "order123458"
}
```

**Response:**

```json
{
  "id": "trade123456",
  "buyOrderId": "order123456",
  "sellOrderId": "order123458",
  "buyUserId": "123456789",
  "sellUserId": "987654321",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "status": "pending",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

#### Update Trade

```
PUT /api/trades/:id
```

**Request Body:**

```json
{
  "status": "completed"
}
```

**Response:**

```json
{
  "id": "trade123456",
  "buyOrderId": "order123456",
  "sellOrderId": "order123458",
  "buyUserId": "123456789",
  "sellUserId": "987654321",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "status": "completed",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

#### Cancel Trade

```
DELETE /api/trades/:id
```

**Response:**

```json
{
  "id": "trade123456",
  "buyOrderId": "order123456",
  "sellOrderId": "order123458",
  "buyUserId": "123456789",
  "sellUserId": "987654321",
  "baseAsset": "BTC",
  "quoteAsset": "ETH",
  "price": "10.0",
  "amount": "1.0",
  "status": "cancelled",
  "createdAt": "2025-04-10T12:00:00.000Z",
  "updatedAt": "2025-04-10T12:00:00.000Z"
}
```

### Market

#### Get Ticker

```
GET /api/market/ticker
```

**Response:**

```json
[
  {
    "pair": "BTC/ETH",
    "last": "10.0",
    "bid": "9.9",
    "ask": "10.1",
    "volume": "100.0",
    "change24h": "5.0",
    "timestamp": "2025-04-10T12:00:00.000Z"
  },
  {
    "pair": "RUNE_ABC/BTC",
    "last": "0.0001",
    "bid": "0.00009",
    "ask": "0.00011",
    "volume": "1000.0",
    "change24h": "-2.0",
    "timestamp": "2025-04-10T12:00:00.000Z"
  }
]
```

#### Get Orderbook

```
GET /api/market/orderbook
```

**Query Parameters:**

- `pair` (required): Trading pair (e.g., BTC/ETH)

**Response:**

```json
{
  "bids": [
    {
      "price": "9.9",
      "amount": "1.0",
      "total": "9.9"
    },
    {
      "price": "9.8",
      "amount": "2.0",
      "total": "19.6"
    }
  ],
  "asks": [
    {
      "price": "10.1",
      "amount": "1.0",
      "total": "10.1"
    },
    {
      "price": "10.2",
      "amount": "2.0",
      "total": "20.4"
    }
  ]
}
```

#### Get Trades

```
GET /api/market/trades
```

**Query Parameters:**

- `pair` (required): Trading pair (e.g., BTC/ETH)
- `limit` (optional): Maximum number of trades to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
[
  {
    "id": "trade123456",
    "price": "10.0",
    "amount": "1.0",
    "type": "buy",
    "timestamp": "2025-04-10T12:00:00.000Z"
  },
  {
    "id": "trade123457",
    "price": "11.0",
    "amount": "1.0",
    "type": "sell",
    "timestamp": "2025-04-09T12:00:00.000Z"
  }
]
```

#### Get Price History

```
GET /api/market/history
```

**Query Parameters:**

- `pair` (required): Trading pair (e.g., BTC/ETH)
- `interval` (required): Interval for price history (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)

**Response:**

```json
[
  {
    "timestamp": "2025-04-10T12:00:00.000Z",
    "open": "10.0",
    "high": "10.5",
    "low": "9.5",
    "close": "10.2",
    "volume": "100.0"
  },
  {
    "timestamp": "2025-04-10T11:00:00.000Z",
    "open": "9.8",
    "high": "10.2",
    "low": "9.7",
    "close": "10.0",
    "volume": "120.0"
  }
]
```

### P2P

#### Get Peers

```
GET /api/p2p/peers
```

**Response:**

```json
{
  "count": 10,
  "connected": 8
}
```

#### Get Peer List

```
GET /api/p2p/peers/list
```

**Response:**

```json
[
  {
    "id": "peer123456",
    "ip": "192.168.1.1",
    "port": 8333,
    "lastSeen": "2025-04-10T12:00:00.000Z",
    "connected": true,
    "version": "1.0.0",
    "userAgent": "DarkSwap/1.0.0"
  },
  {
    "id": "peer123457",
    "ip": "192.168.1.2",
    "port": 8333,
    "lastSeen": "2025-04-10T11:00:00.000Z",
    "connected": true,
    "version": "1.0.0",
    "userAgent": "DarkSwap/1.0.0"
  }
]
```

#### Get Relay Servers

```
GET /api/p2p/relays
```

**Response:**

```json
[
  {
    "id": "relay123456",
    "ip": "192.168.1.3",
    "port": 8334,
    "lastSeen": "2025-04-10T12:00:00.000Z",
    "connected": true,
    "version": "1.0.0",
    "userAgent": "DarkSwap/1.0.0"
  },
  {
    "id": "relay123457",
    "ip": "192.168.1.4",
    "port": 8334,
    "lastSeen": "2025-04-10T11:00:00.000Z",
    "connected": true,
    "version": "1.0.0",
    "userAgent": "DarkSwap/1.0.0"
  }
]
```

#### Get Network Status

```
GET /api/p2p/status
```

**Response:**

```json
{
  "peers": 10,
  "relays": 5,
  "orders": 100,
  "trades": 50,
  "uptime": 86400
}
```

### WebSocket API

The WebSocket API provides real-time updates for various events. To connect to the WebSocket API, use the following URL:

```
wss://api.darkswap.io/ws
```

#### Authentication

To authenticate with the WebSocket API, send an `authenticate` event with a JWT token:

```json
{
  "event": "authenticate",
  "data": {
    "token": "jwt-token"
  }
}
```

#### Subscription

To subscribe to a channel, send a `subscribe` event with the channel name and optional parameters:

```json
{
  "event": "subscribe",
  "data": {
    "channel": "ticker",
    "params": {
      "baseAsset": "BTC",
      "quoteAsset": "ETH"
    }
  }
}
```

To unsubscribe from a channel, send an `unsubscribe` event with the channel name and optional parameters:

```json
{
  "event": "unsubscribe",
  "data": {
    "channel": "ticker",
    "params": {
      "baseAsset": "BTC",
      "quoteAsset": "ETH"
    }
  }
}
```

#### Channels

##### Ticker Channel

Provides real-time ticker updates for a trading pair.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "ticker",
    "params": {
      "baseAsset": "BTC",
      "quoteAsset": "ETH"
    }
  }
}
```

**Update:**

```json
{
  "event": "ticker_update",
  "data": {
    "pair": "BTC/ETH",
    "last": "10.0",
    "bid": "9.9",
    "ask": "10.1",
    "volume": "100.0",
    "change24h": "5.0",
    "timestamp": "2025-04-10T12:00:00.000Z"
  }
}
```

##### Orderbook Channel

Provides real-time orderbook updates for a trading pair.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "orderbook",
    "params": {
      "baseAsset": "BTC",
      "quoteAsset": "ETH"
    }
  }
}
```

**Update:**

```json
{
  "event": "orderbook_update",
  "data": {
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "bids": [
      {
        "price": "9.9",
        "amount": "1.0",
        "total": "9.9"
      },
      {
        "price": "9.8",
        "amount": "2.0",
        "total": "19.6"
      }
    ],
    "asks": [
      {
        "price": "10.1",
        "amount": "1.0",
        "total": "10.1"
      },
      {
        "price": "10.2",
        "amount": "2.0",
        "total": "20.4"
      }
    ],
    "timestamp": "2025-04-10T12:00:00.000Z"
  }
}
```

##### Trades Channel

Provides real-time trade updates for a trading pair.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "trades",
    "params": {
      "baseAsset": "BTC",
      "quoteAsset": "ETH"
    }
  }
}
```

**Update:**

```json
{
  "event": "trade_created",
  "data": {
    "id": "trade123456",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "10.0",
    "amount": "1.0",
    "type": "buy",
    "timestamp": "2025-04-10T12:00:00.000Z"
  }
}
```

##### Orders Channel

Provides real-time order updates for the authenticated user.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "orders"
  }
}
```

**Update:**

```json
{
  "event": "order_created",
  "data": {
    "id": "order123456",
    "userId": "123456789",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "10.0",
    "amount": "1.0",
    "filled": "0.0",
    "type": "buy",
    "status": "open",
    "createdAt": "2025-04-10T12:00:00.000Z",
    "updatedAt": "2025-04-10T12:00:00.000Z"
  }
}
```

##### User Trades Channel

Provides real-time trade updates for the authenticated user.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "user_trades"
  }
}
```

**Update:**

```json
{
  "event": "trade_created",
  "data": {
    "id": "trade123456",
    "buyOrderId": "order123456",
    "sellOrderId": "order123458",
    "buyUserId": "123456789",
    "sellUserId": "987654321",
    "baseAsset": "BTC",
    "quoteAsset": "ETH",
    "price": "10.0",
    "amount": "1.0",
    "status": "pending",
    "createdAt": "2025-04-10T12:00:00.000Z",
    "updatedAt": "2025-04-10T12:00:00.000Z"
  }
}
```

##### Balance Channel

Provides real-time balance updates for the authenticated user.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "balance"
  }
}
```

**Update:**

```json
{
  "event": "balance_update",
  "data": {
    "balance": {
      "BTC": "1.23456789",
      "ETH": "10.0",
      "RUNE_ABC": "1000.0",
      "ALKANE_XYZ": "500.0"
    }
  }
}
```

##### P2P Channel

Provides real-time P2P network updates.

**Subscribe:**

```json
{
  "event": "subscribe",
  "data": {
    "channel": "p2p"
  }
}
```

**Update:**

```json
{
  "event": "peer_connected",
  "data": {
    "id": "peer123456",
    "ip": "192.168.1.1",
    "port": 8333,
    "lastSeen": "2025-04-10T12:00:00.000Z",
    "connected": true,
    "version": "1.0.0",
    "userAgent": "DarkSwap/1.0.0"
  }
}
