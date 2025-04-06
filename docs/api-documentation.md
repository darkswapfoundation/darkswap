# DarkSwap API Documentation

## Overview

The DarkSwap API provides programmatic access to the DarkSwap platform, allowing developers to integrate DarkSwap functionality into their applications. This document provides comprehensive documentation for all available API endpoints, request/response formats, authentication methods, error codes, and rate limits.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.darkswap.io/v1
```

For development and testing, you can use the staging environment:

```
https://api-staging.darkswap.io/v1
```

## Authentication

### JWT Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT). To authenticate, include the JWT token in the `Authorization` header of your request:

```
Authorization: Bearer <your_jwt_token>
```

### Obtaining a JWT Token

To obtain a JWT token, use the `/auth/login` endpoint with your credentials:

```http
POST /auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

The response will include a JWT token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-04-05T16:00:00Z"
}
```

### Token Refresh

JWT tokens expire after a certain period. To refresh your token before it expires, use the `/auth/refresh` endpoint:

```http
POST /auth/refresh
Authorization: Bearer <your_current_jwt_token>
```

The response will include a new JWT token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-04-05T16:00:00Z"
}
```

## API Endpoints

### Health Check

#### GET /health

Check the health status of the API.

**Authentication:** None

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-04-05T12:00:00Z"
}
```

### Orders

#### GET /orders

Get a list of orders.

**Authentication:** Required

**Query Parameters:**

- `base_asset` (optional): Filter by base asset (e.g., "BTC")
- `quote_asset` (optional): Filter by quote asset (e.g., "USD")
- `side` (optional): Filter by side ("buy" or "sell")
- `status` (optional): Filter by status ("open", "filled", "cancelled", "expired")
- `limit` (optional): Maximum number of orders to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
{
  "orders": [
    {
      "id": "order123",
      "base_asset": "BTC",
      "quote_asset": "USD",
      "side": "buy",
      "amount": 1.5,
      "price": 50000,
      "total": 75000,
      "timestamp": "2025-04-05T12:00:00Z",
      "status": "open",
      "maker": "user123"
    },
    ...
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

#### POST /orders

Create a new order.

**Authentication:** Required

**Request Body:**

```json
{
  "base_asset": "BTC",
  "quote_asset": "USD",
  "side": "buy",
  "amount": 1.5,
  "price": 50000,
  "expiry": 3600
}
```

**Response:**

```json
{
  "id": "order123",
  "base_asset": "BTC",
  "quote_asset": "USD",
  "side": "buy",
  "amount": 1.5,
  "price": 50000,
  "total": 75000,
  "timestamp": "2025-04-05T12:00:00Z",
  "status": "open",
  "maker": "user123",
  "expiry": "2025-04-05T13:00:00Z"
}
```

#### GET /orders/{id}

Get details of a specific order.

**Authentication:** Required

**Path Parameters:**

- `id`: Order ID

**Response:**

```json
{
  "id": "order123",
  "base_asset": "BTC",
  "quote_asset": "USD",
  "side": "buy",
  "amount": 1.5,
  "price": 50000,
  "total": 75000,
  "timestamp": "2025-04-05T12:00:00Z",
  "status": "open",
  "maker": "user123",
  "expiry": "2025-04-05T13:00:00Z"
}
```

#### DELETE /orders/{id}

Cancel an order.

**Authentication:** Required

**Path Parameters:**

- `id`: Order ID

**Response:**

```json
{
  "id": "order123",
  "status": "cancelled",
  "timestamp": "2025-04-05T12:30:00Z"
}
```

#### POST /orders/{id}/take

Take an order.

**Authentication:** Required

**Path Parameters:**

- `id`: Order ID

**Request Body:**

```json
{
  "amount": 1.0
}
```

**Response:**

```json
{
  "trade_id": "trade123",
  "order_id": "order123",
  "base_asset": "BTC",
  "quote_asset": "USD",
  "side": "buy",
  "amount": 1.0,
  "price": 50000,
  "total": 50000,
  "timestamp": "2025-04-05T12:30:00Z",
  "status": "pending",
  "maker": "user123",
  "taker": "user456"
}
```

### Trades

#### GET /trades

Get a list of trades.

**Authentication:** Required

**Query Parameters:**

- `base_asset` (optional): Filter by base asset (e.g., "BTC")
- `quote_asset` (optional): Filter by quote asset (e.g., "USD")
- `side` (optional): Filter by side ("buy" or "sell")
- `status` (optional): Filter by status ("pending", "completed", "failed")
- `limit` (optional): Maximum number of trades to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
{
  "trades": [
    {
      "id": "trade123",
      "order_id": "order123",
      "base_asset": "BTC",
      "quote_asset": "USD",
      "side": "buy",
      "amount": 1.0,
      "price": 50000,
      "total": 50000,
      "timestamp": "2025-04-05T12:30:00Z",
      "status": "completed",
      "maker": "user123",
      "taker": "user456",
      "txid": "tx123"
    },
    ...
  ],
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

#### GET /trades/{id}

Get details of a specific trade.

**Authentication:** Required

**Path Parameters:**

- `id`: Trade ID

**Response:**

```json
{
  "id": "trade123",
  "order_id": "order123",
  "base_asset": "BTC",
  "quote_asset": "USD",
  "side": "buy",
  "amount": 1.0,
  "price": 50000,
  "total": 50000,
  "timestamp": "2025-04-05T12:30:00Z",
  "status": "completed",
  "maker": "user123",
  "taker": "user456",
  "txid": "tx123"
}
```

### Markets

#### GET /markets

Get a list of markets.

**Authentication:** None

**Response:**

```json
{
  "markets": [
    {
      "base_asset": "BTC",
      "quote_asset": "USD",
      "last_price": 50000,
      "change_24h": 2.5,
      "high_24h": 51000,
      "low_24h": 49000,
      "volume_24h": 100,
      "timestamp": "2025-04-05T12:00:00Z"
    },
    ...
  ]
}
```

#### GET /markets/{base_asset}/{quote_asset}

Get details of a specific market.

**Authentication:** None

**Path Parameters:**

- `base_asset`: Base asset (e.g., "BTC")
- `quote_asset`: Quote asset (e.g., "USD")

**Response:**

```json
{
  "base_asset": "BTC",
  "quote_asset": "USD",
  "last_price": 50000,
  "change_24h": 2.5,
  "high_24h": 51000,
  "low_24h": 49000,
  "volume_24h": 100,
  "timestamp": "2025-04-05T12:00:00Z",
  "price_history": [
    {
      "timestamp": "2025-04-05T11:00:00Z",
      "price": 49500
    },
    {
      "timestamp": "2025-04-05T10:00:00Z",
      "price": 49000
    },
    ...
  ]
}
```

### Runes

#### GET /runes

Get a list of runes.

**Authentication:** None

**Query Parameters:**

- `limit` (optional): Maximum number of runes to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `sort_by` (optional): Sort by field (price, market_cap, volume_24h)
- `order` (optional): Sort order (asc, desc)

**Response:**

```json
{
  "runes": [
    {
      "id": "RUNE:123",
      "name": "Example Rune",
      "supply": 1000000,
      "price": 10,
      "market_cap": 10000000,
      "volume_24h": 500000,
      "change_24h": 5.0
    },
    ...
  ],
  "total": 500,
  "limit": 100,
  "offset": 0
}
```

#### GET /runes/{id}

Get details of a specific rune.

**Authentication:** None

**Path Parameters:**

- `id`: Rune ID (e.g., "RUNE:123")

**Response:**

```json
{
  "id": "RUNE:123",
  "name": "Example Rune",
  "supply": 1000000,
  "price": 10,
  "market_cap": 10000000,
  "volume_24h": 500000,
  "change_24h": 5.0,
  "description": "Example rune description",
  "creator": "user123",
  "created_at": "2025-01-01T00:00:00Z",
  "transactions": [
    {
      "txid": "tx123",
      "timestamp": "2025-04-05T12:00:00Z",
      "amount": 1000,
      "type": "mint"
    },
    ...
  ]
}
```

### Alkanes

#### GET /alkanes

Get a list of alkanes.

**Authentication:** None

**Query Parameters:**

- `limit` (optional): Maximum number of alkanes to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `sort_by` (optional): Sort by field (price, market_cap, volume_24h)
- `order` (optional): Sort order (asc, desc)

**Response:**

```json
{
  "alkanes": [
    {
      "id": "ALKANE:456",
      "name": "Example Alkane",
      "supply": 1000000,
      "price": 20,
      "market_cap": 20000000,
      "volume_24h": 1000000,
      "change_24h": 10.0
    },
    ...
  ],
  "total": 200,
  "limit": 100,
  "offset": 0
}
```

#### GET /alkanes/{id}

Get details of a specific alkane.

**Authentication:** None

**Path Parameters:**

- `id`: Alkane ID (e.g., "ALKANE:456")

**Response:**

```json
{
  "id": "ALKANE:456",
  "name": "Example Alkane",
  "supply": 1000000,
  "price": 20,
  "market_cap": 20000000,
  "volume_24h": 1000000,
  "change_24h": 10.0,
  "description": "Example alkane description",
  "creator": "user456",
  "created_at": "2025-02-01T00:00:00Z",
  "transactions": [
    {
      "txid": "tx456",
      "timestamp": "2025-04-05T12:00:00Z",
      "amount": 2000,
      "type": "mint"
    },
    ...
  ]
}
```

### Wallet

#### GET /wallet/balance

Get wallet balance.

**Authentication:** Required

**Response:**

```json
{
  "balances": {
    "BTC": 1.5,
    "RUNE:123": 1000,
    "ALKANE:456": 2000
  }
}
```

#### GET /wallet/addresses

Get wallet addresses.

**Authentication:** Required

**Response:**

```json
{
  "addresses": {
    "bitcoin": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "ethereum": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  }
}
```

#### GET /wallet/transactions

Get wallet transactions.

**Authentication:** Required

**Query Parameters:**

- `asset` (optional): Filter by asset (e.g., "BTC", "RUNE:123")
- `type` (optional): Filter by type ("deposit", "withdrawal", "trade")
- `status` (optional): Filter by status ("pending", "confirmed", "failed")
- `limit` (optional): Maximum number of transactions to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
{
  "transactions": [
    {
      "id": "tx123",
      "type": "deposit",
      "status": "confirmed",
      "amount": 1.0,
      "asset": "BTC",
      "timestamp": "2025-04-05T12:00:00Z",
      "txid": "1a2b3c4d5e6f7g8h9i0j"
    },
    ...
  ],
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

### WebSocket

#### GET /ws

WebSocket endpoint for real-time updates.

**Authentication:** Required (via query parameter or initial message)

**Connection:**

```
wss://api.darkswap.io/v1/ws?token=<your_jwt_token>
```

**Subscribe to Events:**

```json
{
  "type": "Subscribe",
  "payload": {
    "events": ["order_created", "order_cancelled", "trade_started"]
  }
}
```

**Unsubscribe from Events:**

```json
{
  "type": "Unsubscribe",
  "payload": {
    "events": ["order_created"]
  }
}
```

**Event Types:**

- `order_created`: New order created
- `order_cancelled`: Order cancelled
- `order_filled`: Order filled
- `trade_started`: Trade started
- `trade_completed`: Trade completed
- `trade_failed`: Trade failed
- `market_update`: Market data updated

**Example Event:**

```json
{
  "type": "order_created",
  "payload": {
    "order": {
      "id": "order123",
      "base_asset": "BTC",
      "quote_asset": "USD",
      "side": "buy",
      "amount": 1.5,
      "price": 50000,
      "total": 75000,
      "timestamp": "2025-04-05T12:00:00Z",
      "status": "open",
      "maker": "user123"
    }
  }
}
```

## Error Codes

The API uses standard HTTP status codes to indicate the success or failure of a request. In addition, the response body will include an error code and message for more detailed information.

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
    "code": "invalid_request",
    "message": "Invalid request parameters",
    "details": {
      "field": "amount",
      "reason": "must be greater than 0"
    }
  }
}
```

### Common Error Codes

- `invalid_request`: The request was invalid
- `authentication_failed`: Authentication failed
- `permission_denied`: The authenticated user does not have permission to access the requested resource
- `resource_not_found`: The requested resource was not found
- `resource_conflict`: The request could not be completed due to a conflict with the current state of the resource
- `rate_limit_exceeded`: The user has sent too many requests in a given amount of time
- `internal_error`: An error occurred on the server

## Rate Limits

The API enforces rate limits to prevent abuse and ensure fair usage. Rate limits are applied per user and per IP address.

### Rate Limit Headers

The following headers are included in the response to provide information about the rate limits:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the current time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets, in UTC epoch seconds

### Rate Limit Tiers

The API has different rate limit tiers based on the user's account type:

- **Basic**: 100 requests per minute
- **Premium**: 500 requests per minute
- **Enterprise**: 1000 requests per minute

### Rate Limit Exceeded

If the rate limit is exceeded, the API will return a `429 Too Many Requests` response with the following body:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "reset": 1712336400
    }
  }
}
```

## Pagination

Many API endpoints that return lists of items support pagination using the `limit` and `offset` query parameters:

- `limit`: Maximum number of items to return (default: 100, max: 1000)
- `offset`: Offset for pagination (default: 0)

The response will include the total number of items, the limit, and the offset:

```json
{
  "items": [...],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

## Versioning

The API is versioned using the URL path. The current version is `v1`. When a new version is released, the old version will be maintained for a period of time to allow for a smooth transition.

## Support

If you have any questions or need assistance with the API, please contact our support team at api-support@darkswap.io or join our Discord community at https://discord.gg/darkswap.