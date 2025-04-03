# DarkSwap API Reference

This document provides a comprehensive reference for the DarkSwap API, including endpoints, request/response formats, authentication, error handling, and examples.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Orders](#orders)
  - [Market](#market)
  - [Runes](#runes)
  - [Alkanes](#alkanes)
  - [Wallet](#wallet)
  - [WebSocket](#websocket)
- [Models](#models)
  - [Order](#order)
  - [Trade](#trade)
  - [Rune](#rune)
  - [Alkane](#alkane)
  - [Market Data](#market-data)
  - [Wallet](#wallet-model)
  - [Error](#error)
- [Examples](#examples)
  - [Creating an Order](#creating-an-order)
  - [Taking an Order](#taking-an-order)
  - [WebSocket Subscription](#websocket-subscription)

## Overview

The DarkSwap API provides a RESTful interface for interacting with the DarkSwap platform. It allows you to:

- Create, view, and cancel orders
- Execute trades
- View market data
- Manage runes and alkanes
- Connect and manage wallets
- Receive real-time updates via WebSocket

The API is available at `http://localhost:3000` when running the DarkSwap daemon locally. For production deployments, the API is available at `https://api.darkswap.io`.

## Authentication

The DarkSwap API uses JSON Web Tokens (JWT) for authentication. To authenticate, include the JWT in the `Authorization` header of your requests:

```
Authorization: Bearer <your-jwt-token>
```

To obtain a JWT, use the `/auth/login` endpoint with your credentials.

### Example

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-04-03T19:44:50Z"
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. In case of an error, the response body will contain an error object with a message and code.

### Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed or contains invalid parameters |
| 401 | Unauthorized - Authentication is required or failed |
| 403 | Forbidden - The authenticated user does not have permission to access the requested resource |
| 404 | Not Found - The requested resource was not found |
| 409 | Conflict - The request conflicts with the current state of the server |
| 429 | Too Many Requests - The user has sent too many requests in a given amount of time |
| 500 | Internal Server Error - An error occurred on the server |

### Error Response Format

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": {
      "field": "amount",
      "reason": "must be greater than 0"
    }
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The rate limits are as follows:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit information is included in the response headers:

- `X-RateLimit-Limit`: The maximum number of requests allowed per minute
- `X-RateLimit-Remaining`: The number of requests remaining in the current minute
- `X-RateLimit-Reset`: The time at which the rate limit will reset, in Unix epoch seconds

If you exceed the rate limit, you will receive a 429 Too Many Requests response.

## Endpoints

### Health

#### GET /health

Check the health of the API.

**Response**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Orders

#### GET /orders

List orders with optional filtering.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| base_asset | string | Filter by base asset (e.g., BTC) |
| quote_asset | string | Filter by quote asset (e.g., RUNE:123) |
| side | string | Filter by side (buy or sell) |
| status | string | Filter by status (open, filled, canceled) |
| limit | integer | Maximum number of orders to return (default: 100) |
| offset | integer | Number of orders to skip (default: 0) |

**Response**

```json
{
  "orders": [
    {
      "id": "order-123",
      "base_asset": "BTC",
      "quote_asset": "RUNE:123",
      "side": "buy",
      "amount": "0.1",
      "price": "20000",
      "status": "open",
      "created_at": "2025-04-02T19:44:50Z",
      "expires_at": "2025-04-02T20:44:50Z"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### POST /orders

Create a new order.

**Request Body**

```json
{
  "base_asset": "BTC",
  "quote_asset": "RUNE:123",
  "side": "buy",
  "amount": "0.1",
  "price": "20000",
  "expiry": 3600
}
```

**Response**

```json
{
  "id": "order-123",
  "base_asset": "BTC",
  "quote_asset": "RUNE:123",
  "side": "buy",
  "amount": "0.1",
  "price": "20000",
  "status": "open",
  "created_at": "2025-04-02T19:44:50Z",
  "expires_at": "2025-04-02T20:44:50Z"
}
```

#### GET /orders/:id

Get an order by ID.

**Response**

```json
{
  "id": "order-123",
  "base_asset": "BTC",
  "quote_asset": "RUNE:123",
  "side": "buy",
  "amount": "0.1",
  "price": "20000",
  "status": "open",
  "created_at": "2025-04-02T19:44:50Z",
  "expires_at": "2025-04-02T20:44:50Z"
}
```

#### DELETE /orders/:id

Cancel an order.

**Response**

```json
{
  "id": "order-123",
  "status": "canceled",
  "canceled_at": "2025-04-02T19:45:50Z"
}
```

#### POST /orders/:id/take

Take an order.

**Request Body**

```json
{
  "amount": "0.05"
}
```

**Response**

```json
{
  "trade_id": "trade-456",
  "order_id": "order-123",
  "status": "pending",
  "amount": "0.05",
  "created_at": "2025-04-02T19:46:50Z"
}
```

### Market

#### GET /market

Get market data for a trading pair.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| base_asset | string | Base asset (e.g., BTC) |
| quote_asset | string | Quote asset (e.g., RUNE:123) |
| period | string | Time period for OHLCV data (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w) |
| limit | integer | Maximum number of OHLCV data points to return (default: 100) |

**Response**

```json
{
  "base_asset": "BTC",
  "quote_asset": "RUNE:123",
  "last_price": "20000",
  "bid": "19900",
  "ask": "20100",
  "high_24h": "20500",
  "low_24h": "19500",
  "volume_24h": "10.5",
  "change_24h": "2.5",
  "ohlcv": [
    {
      "timestamp": "2025-04-02T19:00:00Z",
      "open": "19800",
      "high": "20100",
      "low": "19700",
      "close": "20000",
      "volume": "1.2"
    }
  ]
}
```

### Runes

#### GET /runes

List runes with optional filtering.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Maximum number of runes to return (default: 100) |
| offset | integer | Number of runes to skip (default: 0) |
| sort_by | string | Field to sort by (name, symbol, market_cap, volume_24h, price) |
| order | string | Sort order (asc or desc) |

**Response**

```json
{
  "runes": [
    {
      "id": "123",
      "name": "Example Rune",
      "symbol": "EXRUNE",
      "supply": "1000000",
      "decimals": 8,
      "etched_at": "2025-01-01T00:00:00Z",
      "etching_tx": "tx-hash",
      "market_cap": "20000000",
      "volume_24h": "500000",
      "price": "20"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### GET /runes/:id

Get a rune by ID.

**Response**

```json
{
  "id": "123",
  "name": "Example Rune",
  "symbol": "EXRUNE",
  "supply": "1000000",
  "decimals": 8,
  "etched_at": "2025-01-01T00:00:00Z",
  "etching_tx": "tx-hash",
  "market_cap": "20000000",
  "volume_24h": "500000",
  "price": "20",
  "holders": 1000,
  "transfers_24h": 500
}
```

### Alkanes

#### GET /alkanes

List alkanes with optional filtering.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Maximum number of alkanes to return (default: 100) |
| offset | integer | Number of alkanes to skip (default: 0) |
| sort_by | string | Field to sort by (name, symbol, market_cap, volume_24h, price) |
| order | string | Sort order (asc or desc) |

**Response**

```json
{
  "alkanes": [
    {
      "id": "456",
      "name": "Example Alkane",
      "symbol": "EXALK",
      "supply": "500000",
      "decimals": 8,
      "etched_at": "2025-01-01T00:00:00Z",
      "etching_tx": "tx-hash",
      "market_cap": "10000000",
      "volume_24h": "250000",
      "price": "20"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

#### GET /alkanes/:id

Get an alkane by ID.

**Response**

```json
{
  "id": "456",
  "name": "Example Alkane",
  "symbol": "EXALK",
  "supply": "500000",
  "decimals": 8,
  "etched_at": "2025-01-01T00:00:00Z",
  "etching_tx": "tx-hash",
  "market_cap": "10000000",
  "volume_24h": "250000",
  "price": "20",
  "holders": 500,
  "transfers_24h": 250,
  "predicate_type": "equality",
  "predicate_data": {
    "field": "price",
    "operator": ">=",
    "value": "20"
  }
}
```

### Wallet

#### POST /wallet/connect

Connect a wallet.

**Request Body**

```json
{
  "wallet_type": "simple",
  "private_key": "your-private-key"
}
```

**Response**

```json
{
  "wallet_id": "wallet-789",
  "address": "bc1q...",
  "connected_at": "2025-04-02T19:47:50Z"
}
```

#### GET /wallet/balance

Get wallet balance.

**Response**

```json
{
  "btc": "1.5",
  "runes": [
    {
      "id": "123",
      "symbol": "EXRUNE",
      "balance": "1000"
    }
  ],
  "alkanes": [
    {
      "id": "456",
      "symbol": "EXALK",
      "balance": "500"
    }
  ]
}
```

#### POST /wallet/transfer

Transfer assets.

**Request Body**

```json
{
  "asset_type": "rune",
  "asset_id": "123",
  "amount": "100",
  "recipient": "bc1q..."
}
```

**Response**

```json
{
  "tx_id": "tx-hash",
  "status": "pending",
  "created_at": "2025-04-02T19:48:50Z"
}
```

### WebSocket

#### GET /ws

WebSocket endpoint for real-time updates.

**Connection**

Connect to the WebSocket endpoint at `ws://localhost:3000/ws` or `wss://api.darkswap.io/ws` for production.

**Subscribe to Events**

```json
{
  "type": "Subscribe",
  "payload": {
    "events": ["order_created", "order_canceled", "trade_started"]
  }
}
```

**Unsubscribe from Events**

```json
{
  "type": "Unsubscribe",
  "payload": {
    "events": ["order_created"]
  }
}
```

**Event Messages**

```json
{
  "type": "OrderCreated",
  "payload": {
    "id": "order-123",
    "base_asset": "BTC",
    "quote_asset": "RUNE:123",
    "side": "buy",
    "amount": "0.1",
    "price": "20000",
    "status": "open",
    "created_at": "2025-04-02T19:44:50Z",
    "expires_at": "2025-04-02T20:44:50Z"
  }
}
```

## Models

### Order

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the order |
| base_asset | string | Base asset (e.g., BTC) |
| quote_asset | string | Quote asset (e.g., RUNE:123) |
| side | string | Order side (buy or sell) |
| amount | string | Order amount in base asset |
| price | string | Order price in quote asset per unit of base asset |
| status | string | Order status (open, filled, canceled) |
| created_at | string | ISO 8601 timestamp of when the order was created |
| expires_at | string | ISO 8601 timestamp of when the order expires |

### Trade

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the trade |
| order_id | string | ID of the order being taken |
| status | string | Trade status (pending, completed, failed) |
| amount | string | Trade amount in base asset |
| price | string | Trade price in quote asset per unit of base asset |
| created_at | string | ISO 8601 timestamp of when the trade was created |
| completed_at | string | ISO 8601 timestamp of when the trade was completed (if applicable) |
| tx_id | string | Transaction ID (if applicable) |

### Rune

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the rune |
| name | string | Rune name |
| symbol | string | Rune symbol |
| supply | string | Total supply |
| decimals | integer | Number of decimal places |
| etched_at | string | ISO 8601 timestamp of when the rune was etched |
| etching_tx | string | Transaction ID of the etching transaction |
| market_cap | string | Market capitalization in USD |
| volume_24h | string | 24-hour trading volume in USD |
| price | string | Current price in USD |
| holders | integer | Number of holders (optional) |
| transfers_24h | integer | Number of transfers in the last 24 hours (optional) |

### Alkane

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the alkane |
| name | string | Alkane name |
| symbol | string | Alkane symbol |
| supply | string | Total supply |
| decimals | integer | Number of decimal places |
| etched_at | string | ISO 8601 timestamp of when the alkane was etched |
| etching_tx | string | Transaction ID of the etching transaction |
| market_cap | string | Market capitalization in USD |
| volume_24h | string | 24-hour trading volume in USD |
| price | string | Current price in USD |
| holders | integer | Number of holders (optional) |
| transfers_24h | integer | Number of transfers in the last 24 hours (optional) |
| predicate_type | string | Type of predicate (equality, range, etc.) |
| predicate_data | object | Predicate-specific data |

### Market Data

| Field | Type | Description |
|-------|------|-------------|
| base_asset | string | Base asset (e.g., BTC) |
| quote_asset | string | Quote asset (e.g., RUNE:123) |
| last_price | string | Last trade price |
| bid | string | Highest buy order price |
| ask | string | Lowest sell order price |
| high_24h | string | 24-hour high price |
| low_24h | string | 24-hour low price |
| volume_24h | string | 24-hour trading volume in base asset |
| change_24h | string | 24-hour price change percentage |
| ohlcv | array | Array of OHLCV data points |

### Wallet Model

| Field | Type | Description |
|-------|------|-------------|
| wallet_id | string | Unique identifier for the wallet |
| address | string | Wallet address |
| connected_at | string | ISO 8601 timestamp of when the wallet was connected |
| btc | string | BTC balance |
| runes | array | Array of rune balances |
| alkanes | array | Array of alkane balances |

### Error

| Field | Type | Description |
|-------|------|-------------|
| code | string | Error code |
| message | string | Error message |
| details | object | Additional error details (optional) |

## Examples

### Creating an Order

**Request**

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "base_asset": "BTC",
    "quote_asset": "RUNE:123",
    "side": "buy",
    "amount": "0.1",
    "price": "20000",
    "expiry": 3600
  }'
```

**Response**

```json
{
  "id": "order-123",
  "base_asset": "BTC",
  "quote_asset": "RUNE:123",
  "side": "buy",
  "amount": "0.1",
  "price": "20000",
  "status": "open",
  "created_at": "2025-04-02T19:44:50Z",
  "expires_at": "2025-04-02T20:44:50Z"
}
```

### Taking an Order

**Request**

```bash
curl -X POST http://localhost:3000/orders/order-123/take \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "amount": "0.05"
  }'
```

**Response**

```json
{
  "trade_id": "trade-456",
  "order_id": "order-123",
  "status": "pending",
  "amount": "0.05",
  "created_at": "2025-04-02T19:46:50Z"
}
```

### WebSocket Subscription

**JavaScript Example**

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to events
  ws.send(JSON.stringify({
    type: 'Subscribe',
    payload: {
      events: ['order_created', 'order_canceled', 'trade_started']
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received event:', data);
  
  // Handle different event types
  switch (data.type) {
    case 'OrderCreated':
      console.log('New order created:', data.payload);
      break;
    case 'OrderCanceled':
      console.log('Order canceled:', data.payload);
      break;
    case 'TradeStarted':
      console.log('Trade started:', data.payload);
      break;
    default:
      console.log('Unknown event type:', data.type);
  }
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## Conclusion

This API reference provides a comprehensive guide to the DarkSwap API. For more information or support, please contact the DarkSwap team at support@darkswap.io.