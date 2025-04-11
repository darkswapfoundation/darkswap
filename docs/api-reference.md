# DarkSwap API Reference

## Overview

The DarkSwap API provides programmatic access to the DarkSwap platform, allowing developers to build applications that interact with the decentralized trading system. This document provides a comprehensive reference for all available API endpoints, request parameters, response formats, and error codes.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.darkswap.io/v1
```

For development and testing, use:

```
https://api-dev.darkswap.io/v1
```

## Authentication

Most API endpoints require authentication. DarkSwap uses JWT (JSON Web Tokens) for authentication.

To authenticate, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To obtain a JWT token, use the `/auth/login` endpoint.

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- 60 requests per minute for authenticated users
- 10 requests per minute for unauthenticated users

Rate limit information is included in the response headers:

- `X-RateLimit-Limit`: The maximum number of requests allowed per minute
- `X-RateLimit-Remaining`: The number of requests remaining in the current window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets (Unix timestamp)

If you exceed the rate limit, you will receive a 429 Too Many Requests response.

## Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Register

```
POST /auth/register
```

Registers a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Refresh Token

```
POST /auth/refresh
```

Refreshes an expired JWT token.

**Request Headers:**

```
Authorization: Bearer <your_expired_jwt_token>
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Orders

#### Create Order

```
POST /orders
```

Creates a new order.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "type": "buy", // or "sell"
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "price": "0.0001",
  "amount": "10",
  "expiresAt": "2025-12-31T23:59:59Z" // optional
}
```

**Response:**

```json
{
  "id": "order123",
  "type": "buy",
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "price": "0.0001",
  "amount": "10",
  "status": "open",
  "createdAt": "2025-04-10T12:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### Get Orders

```
GET /orders
```

Gets a list of orders.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**

- `type` (optional): Filter by order type (`buy` or `sell`)
- `status` (optional): Filter by order status (`open`, `filled`, `cancelled`, `expired`)
- `baseAsset` (optional): Filter by base asset
- `quoteAsset` (optional): Filter by quote asset
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of orders per page (default: 20)

**Response:**

```json
{
  "orders": [
    {
      "id": "order123",
      "type": "buy",
      "baseAsset": "BTC",
      "quoteAsset": "RUNE",
      "price": "0.0001",
      "amount": "10",
      "status": "open",
      "createdAt": "2025-04-10T12:00:00Z",
      "expiresAt": "2025-12-31T23:59:59Z"
    },
    // More orders...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Order

```
GET /orders/:id
```

Gets a specific order by ID.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response:**

```json
{
  "id": "order123",
  "type": "buy",
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "price": "0.0001",
  "amount": "10",
  "status": "open",
  "createdAt": "2025-04-10T12:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

#### Cancel Order

```
POST /orders/:id/cancel
```

Cancels an order.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response:**

```json
{
  "id": "order123",
  "type": "buy",
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "price": "0.0001",
  "amount": "10",
  "status": "cancelled",
  "createdAt": "2025-04-10T12:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z",
  "cancelledAt": "2025-04-10T13:00:00Z"
}
```

### Trades

#### Get Trades

```
GET /trades
```

Gets a list of trades.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**

- `status` (optional): Filter by trade status (`pending`, `completed`, `failed`)
- `baseAsset` (optional): Filter by base asset
- `quoteAsset` (optional): Filter by quote asset
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of trades per page (default: 20)

**Response:**

```json
{
  "trades": [
    {
      "id": "trade123",
      "buyOrderId": "order123",
      "sellOrderId": "order456",
      "baseAsset": "BTC",
      "quoteAsset": "RUNE",
      "price": "0.0001",
      "amount": "10",
      "status": "pending",
      "createdAt": "2025-04-10T12:00:00Z",
      "updatedAt": "2025-04-10T12:00:00Z"
    },
    // More trades...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Trade

```
GET /trades/:id
```

Gets a specific trade by ID.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response:**

```json
{
  "id": "trade123",
  "buyOrderId": "order123",
  "sellOrderId": "order456",
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "price": "0.0001",
  "amount": "10",
  "status": "pending",
  "createdAt": "2025-04-10T12:00:00Z",
  "updatedAt": "2025-04-10T12:00:00Z",
  "psbt": "cHNidP8BAHECAAAAAQVvjcGc5QYNBpGBKQnN0QXGBb8QmUzJxnBGxuXHAQbAAQAAAAD/////AiDLAAAAAAAAFgAUK5M/aeXrJEofBL1BdQ+SfCDIvHWIEwAAAAAAABYAFNSu7AEIeHdqKDUj+IvtEZKMJZWIAAAAAAABAR8gywAAAAAAABYAFCuTP2nl6yRKHwS9QXUPknwgyLx1AQMEAQAAAAAA",
  "signatures": {
    "buyer": "cHNidP8BAHECAAAAAQVvjcGc5QYNBpGBKQnN0QXGBb8QmUzJxnBGxuXHAQbAAQAAAAD/////AiDLAAAAAAAAFgAUK5M/aeXrJEofBL1BdQ+SfCDIvHWIEwAAAAAAABYAFNSu7AEIeHdqKDUj+IvtEZKMJZWIAAAAAAABAR8gywAAAAAAABYAFCuTP2nl6yRKHwS9QXUPknwgyLx1AQMEAQAAAAAAIQK54x2LjJu0Vx8t9VEfpuXHPHjHGcJEh97k6EYtHgAz+A==",
    "seller": null
  }
}
```

#### Sign Trade

```
POST /trades/:id/sign
```

Signs a trade PSBT.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "signature": "cHNidP8BAHECAAAAAQVvjcGc5QYNBpGBKQnN0QXGBb8QmUzJxnBGxuXHAQbAAQAAAAD/////AiDLAAAAAAAAFgAUK5M/aeXrJEofBL1BdQ+SfCDIvHWIEwAAAAAAABYAFNSu7AEIeHdqKDUj+IvtEZKMJZWIAAAAAAABAR8gywAAAAAAABYAFCuTP2nl6yRKHwS9QXUPknwgyLx1AQMEAQAAAAAAIQK54x2LjJu0Vx8t9VEfpuXHPHjHGcJEh97k6EYtHgAz+A=="
}
```

**Response:**

```json
{
  "id": "trade123",
  "buyOrderId": "order123",
  "sellOrderId": "order456",
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "price": "0.0001",
  "amount": "10",
  "status": "pending",
  "createdAt": "2025-04-10T12:00:00Z",
  "updatedAt": "2025-04-10T13:00:00Z",
  "psbt": "cHNidP8BAHECAAAAAQVvjcGc5QYNBpGBKQnN0QXGBb8QmUzJxnBGxuXHAQbAAQAAAAD/////AiDLAAAAAAAAFgAUK5M/aeXrJEofBL1BdQ+SfCDIvHWIEwAAAAAAABYAFNSu7AEIeHdqKDUj+IvtEZKMJZWIAAAAAAABAR8gywAAAAAAABYAFCuTP2nl6yRKHwS9QXUPknwgyLx1AQMEAQAAAAAA",
  "signatures": {
    "buyer": "cHNidP8BAHECAAAAAQVvjcGc5QYNBpGBKQnN0QXGBb8QmUzJxnBGxuXHAQbAAQAAAAD/////AiDLAAAAAAAAFgAUK5M/aeXrJEofBL1BdQ+SfCDIvHWIEwAAAAAAABYAFNSu7AEIeHdqKDUj+IvtEZKMJZWIAAAAAAABAR8gywAAAAAAABYAFCuTP2nl6yRKHwS9QXUPknwgyLx1AQMEAQAAAAAAIQK54x2LjJu0Vx8t9VEfpuXHPHjHGcJEh97k6EYtHgAz+A==",
    "seller": "cHNidP8BAHECAAAAAQVvjcGc5QYNBpGBKQnN0QXGBb8QmUzJxnBGxuXHAQbAAQAAAAD/////AiDLAAAAAAAAFgAUK5M/aeXrJEofBL1BdQ+SfCDIvHWIEwAAAAAAABYAFNSu7AEIeHdqKDUj+IvtEZKMJZWIAAAAAAABAR8gywAAAAAAABYAFCuTP2nl6yRKHwS9QXUPknwgyLx1AQMEAQAAAAAAIQK54x2LjJu0Vx8t9VEfpuXHPHjHGcJEh97k6EYtHgAz+A=="
  }
}
```

### Wallet

#### Get Balance

```
GET /wallet/balance
```

Gets the wallet balance.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response:**

```json
{
  "balances": [
    {
      "asset": "BTC",
      "balance": "1.23456789",
      "available": "1.23456789",
      "locked": "0.0"
    },
    {
      "asset": "RUNE",
      "balance": "1000.0",
      "available": "900.0",
      "locked": "100.0"
    },
    {
      "asset": "ALKANE",
      "balance": "500.0",
      "available": "500.0",
      "locked": "0.0"
    }
  ]
}
```

#### Get Transactions

```
GET /wallet/transactions
```

Gets a list of wallet transactions.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**

- `asset` (optional): Filter by asset
- `type` (optional): Filter by transaction type (`deposit`, `withdrawal`, `trade`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of transactions per page (default: 20)

**Response:**

```json
{
  "transactions": [
    {
      "id": "tx123",
      "type": "deposit",
      "asset": "BTC",
      "amount": "0.1",
      "status": "confirmed",
      "txid": "1a2b3c4d5e6f7g8h9i0j",
      "createdAt": "2025-04-10T12:00:00Z",
      "confirmedAt": "2025-04-10T12:10:00Z"
    },
    // More transactions...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Get Deposit Address

```
GET /wallet/deposit-address/:asset
```

Gets a deposit address for a specific asset.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Response:**

```json
{
  "asset": "BTC",
  "address": "bc1q9h6tlfk5r7d39q9u8lxt9mneec3crt8g5jug4r"
}
```

#### Withdraw

```
POST /wallet/withdraw
```

Initiates a withdrawal.

**Request Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**

```json
{
  "asset": "BTC",
  "amount": "0.1",
  "address": "bc1q9h6tlfk5r7d39q9u8lxt9mneec3crt8g5jug4r"
}
```

**Response:**

```json
{
  "id": "withdrawal123",
  "asset": "BTC",
  "amount": "0.1",
  "fee": "0.0001",
  "address": "bc1q9h6tlfk5r7d39q9u8lxt9mneec3crt8g5jug4r",
  "status": "pending",
  "createdAt": "2025-04-10T12:00:00Z"
}
```

### Market Data

#### Get Ticker

```
GET /market/ticker
```

Gets the ticker for all trading pairs.

**Response:**

```json
{
  "tickers": [
    {
      "baseAsset": "BTC",
      "quoteAsset": "RUNE",
      "last": "0.0001",
      "bid": "0.00009",
      "ask": "0.00011",
      "high": "0.00012",
      "low": "0.00008",
      "volume": "100.0",
      "change": "5.0"
    },
    // More tickers...
  ]
}
```

#### Get Orderbook

```
GET /market/orderbook/:baseAsset/:quoteAsset
```

Gets the orderbook for a specific trading pair.

**Query Parameters:**

- `limit` (optional): Number of orders to return for each side (default: 20)

**Response:**

```json
{
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "bids": [
    {
      "price": "0.00009",
      "amount": "10.0"
    },
    // More bids...
  ],
  "asks": [
    {
      "price": "0.00011",
      "amount": "5.0"
    },
    // More asks...
  ],
  "timestamp": "2025-04-10T12:00:00Z"
}
```

#### Get Recent Trades

```
GET /market/trades/:baseAsset/:quoteAsset
```

Gets recent trades for a specific trading pair.

**Query Parameters:**

- `limit` (optional): Number of trades to return (default: 20)

**Response:**

```json
{
  "baseAsset": "BTC",
  "quoteAsset": "RUNE",
  "trades": [
    {
      "price": "0.0001",
      "amount": "10.0",
      "side": "buy",
      "timestamp": "2025-04-10T12:00:00Z"
    },
    // More trades...
  ]
}
```

### WebSocket API

DarkSwap also provides a WebSocket API for real-time updates. The WebSocket endpoint is:

```
wss://ws.darkswap.io/v1
```

For development and testing, use:

```
wss://ws-dev.darkswap.io/v1
```

#### Authentication

To authenticate with the WebSocket API, send an authentication message after connecting:

```json
{
  "type": "auth",
  "token": "your_jwt_token"
}
```

#### Subscribing to Channels

To subscribe to a channel, send a subscription message:

```json
{
  "type": "subscribe",
  "channel": "channel_name",
  "params": {
    // Channel-specific parameters
  }
}
```

Available channels:

- `orderbook`: Real-time orderbook updates
- `trades`: Real-time trade updates
- `user_orders`: Real-time updates for your orders
- `user_trades`: Real-time updates for your trades
- `user_balance`: Real-time updates for your wallet balance

Example subscription to the orderbook channel:

```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "params": {
    "baseAsset": "BTC",
    "quoteAsset": "RUNE"
  }
}
```

#### Unsubscribing from Channels

To unsubscribe from a channel, send an unsubscription message:

```json
{
  "type": "unsubscribe",
  "channel": "channel_name",
  "params": {
    // Channel-specific parameters
  }
}
```

#### Message Format

Messages received from the WebSocket API have the following format:

```json
{
  "type": "message_type",
  "channel": "channel_name",
  "data": {
    // Message-specific data
  }
}
```

Example orderbook update message:

```json
{
  "type": "update",
  "channel": "orderbook",
  "data": {
    "baseAsset": "BTC",
    "quoteAsset": "RUNE",
    "bids": [
      {
        "price": "0.00009",
        "amount": "10.0"
      }
    ],
    "asks": [
      {
        "price": "0.00011",
        "amount": "5.0"
      }
    ],
    "timestamp": "2025-04-10T12:00:00Z"
  }
}
```

## Error Codes

DarkSwap API uses standard HTTP status codes to indicate the success or failure of an API request. In addition, the response body will contain more detailed information about the error.

### HTTP Status Codes

- `200 OK`: The request was successful
- `201 Created`: The resource was successfully created
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: The authenticated user does not have permission to access the requested resource
- `404 Not Found`: The requested resource was not found
- `409 Conflict`: The request could not be completed due to a conflict with the current state of the resource
- `429 Too Many Requests`: The user has sent too many requests in a given amount of time
- `500 Internal Server Error`: An error occurred on the server

### Error Response Format

```json
{
  "error": {
    "code": "error_code",
    "message": "Error message",
    "details": {
      // Additional error details
    }
  }
}
```

### Common Error Codes

- `invalid_request`: The request was invalid
- `authentication_failed`: Authentication failed
- `insufficient_permissions`: The authenticated user does not have permission to access the requested resource
- `resource_not_found`: The requested resource was not found
- `rate_limit_exceeded`: The user has sent too many requests in a given amount of time
- `internal_error`: An error occurred on the server

## Pagination

Many endpoints that return lists of resources support pagination. These endpoints accept the following query parameters:

- `page`: The page number (default: 1)
- `limit`: The number of items per page (default: 20, max: 100)

The response will include a pagination object with the following properties:

- `page`: The current page number
- `limit`: The number of items per page
- `total`: The total number of items
- `pages`: The total number of pages

Example:

```json
{
  "orders": [
    // Orders...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

## Versioning

The DarkSwap API is versioned using the URL path. The current version is `v1`. When a new version is released, the old version will be maintained for a period of time to allow for a smooth transition.

## Support

If you have any questions or need help with the DarkSwap API, please contact us at api@darkswap.io.