# DarkSwap API Documentation

## Overview

The DarkSwap API provides endpoints for interacting with the DarkSwap platform. This document describes the available endpoints, their parameters, and their responses.

## Base URL

The base URL for the API is:

- Development: `http://localhost:8000/api`
- Production: `https://api.darkswap.io/api`

## Authentication

Some endpoints require authentication. To authenticate, include an `Authorization` header with a bearer token:

```
Authorization: Bearer <token>
```

## Error Handling

All API endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error codes:

- `400`: Bad Request - The request was invalid
- `401`: Unauthorized - Authentication is required
- `403`: Forbidden - The authenticated user does not have permission
- `404`: Not Found - The requested resource was not found
- `500`: Internal Server Error - An error occurred on the server

## Endpoints

### Peer

#### Get Peer ID

Get the local peer ID.

- **URL**: `/peer/id`
- **Method**: `GET`
- **Authentication**: Not required

**Response**:

```json
{
  "success": true,
  "data": {
    "peerId": "12D3KooWHFrmLWTTDD4NodngtRMmCCPcpZMEBZDXhGZ1FydNEMTK"
  }
}
```

#### Get Connected Peers

Get a list of connected peers.

- **URL**: `/peer/connected`
- **Method**: `GET`
- **Authentication**: Not required

**Response**:

```json
{
  "success": true,
  "data": {
    "peers": [
      "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
      "12D3KooWPBFzpNemfrwjMSTSQpQQBXKJhQxGRjGYWyBiKL5oNMYS",
      "12D3KooWQYzCrTUdJ8C7L3Uj9UQPi2xvwCNUBr2VEBwAQTJv8CgD"
    ]
  }
}
```

### Wallet

#### Get Bitcoin Balance

Get the Bitcoin balance.

- **URL**: `/wallet/balance/bitcoin`
- **Method**: `GET`
- **Authentication**: Required

**Response**:

```json
{
  "success": true,
  "data": {
    "balance": 100000000
  }
}
```

#### Get Rune Balance

Get the balance of a specific rune.

- **URL**: `/wallet/balance/rune/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Parameters**:
  - `id`: The ID of the rune

**Response**:

```json
{
  "success": true,
  "data": {
    "balance": 1000
  }
}
```

#### Get Alkane Balance

Get the balance of a specific alkane.

- **URL**: `/wallet/balance/alkane/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Parameters**:
  - `id`: The ID of the alkane

**Response**:

```json
{
  "success": true,
  "data": {
    "balance": 500
  }
}
```

#### Get All Balances

Get all balances.

- **URL**: `/wallet/balances`
- **Method**: `GET`
- **Authentication**: Required

**Response**:

```json
{
  "success": true,
  "data": {
    "balances": {
      "bitcoin": 100000000,
      "rune:rune-1": 1000,
      "rune:rune-2": 2000,
      "alkane:alkane-1": 500,
      "alkane:alkane-2": 1000
    }
  }
}
```

### Trade

#### Create Trade Offer

Create a new trade offer.

- **URL**: `/trade/offer`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:

```json
{
  "makerAsset": {
    "type": "bitcoin"
  },
  "makerAmount": 100000000,
  "takerAsset": {
    "type": "rune",
    "id": "rune-1"
  },
  "takerAmount": 1000
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "offerId": "offer-123"
  }
}
```

#### Accept Trade Offer

Accept a trade offer.

- **URL**: `/trade/offer/:id/accept`
- **Method**: `POST`
- **Authentication**: Required
- **Parameters**:
  - `id`: The ID of the trade offer

**Response**:

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

#### Cancel Trade Offer

Cancel a trade offer.

- **URL**: `/trade/offer/:id/cancel`
- **Method**: `POST`
- **Authentication**: Required
- **Parameters**:
  - `id`: The ID of the trade offer

**Response**:

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

#### Get Trade Offers

Get a list of trade offers.

- **URL**: `/trade/offers`
- **Method**: `GET`
- **Authentication**: Not required

**Response**:

```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": "offer-1",
        "maker": "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
        "makerAsset": {
          "type": "bitcoin"
        },
        "makerAmount": 100000000,
        "takerAsset": {
          "type": "rune",
          "id": "rune-1"
        },
        "takerAmount": 1000,
        "expiry": 1712246400,
        "status": "open"
      },
      {
        "id": "offer-2",
        "maker": "12D3KooWPBFzpNemfrwjMSTSQpQQBXKJhQxGRjGYWyBiKL5oNMYS",
        "makerAsset": {
          "type": "rune",
          "id": "rune-1"
        },
        "makerAmount": 500,
        "takerAsset": {
          "type": "bitcoin"
        },
        "takerAmount": 50000000,
        "expiry": 1712246400,
        "status": "open"
      }
    ]
  }
}
```

#### Get Trade History

Get the trade history.

- **URL**: `/trade/history`
- **Method**: `GET`
- **Authentication**: Required

**Response**:

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "trade-1",
        "timestamp": 1709481600,
        "type": "buy",
        "assetType": {
          "type": "rune",
          "id": "rune-1"
        },
        "amount": 1000,
        "price": 0.0001,
        "status": "completed"
      },
      {
        "id": "trade-2",
        "timestamp": 1709395200,
        "type": "sell",
        "assetType": {
          "type": "alkane",
          "id": "alkane-1"
        },
        "amount": 500,
        "price": 0.0002,
        "status": "completed"
      }
    ]
  }
}
```

## WebSocket API

The DarkSwap platform also provides a WebSocket API for real-time updates.

### Connection

Connect to the WebSocket server at:

- Development: `ws://localhost:8000/ws`
- Production: `wss://api.darkswap.io/ws`

### Message Format

All messages have the following format:

```json
{
  "type": "message_type",
  "payload": {
    // Message-specific data
  }
}
```

### Message Types

#### trade_offer_received

Sent when a new trade offer is received.

```json
{
  "type": "trade_offer_received",
  "payload": {
    "id": "offer-123",
    "maker": "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
    "makerAsset": {
      "type": "bitcoin"
    },
    "makerAmount": 100000000,
    "takerAsset": {
      "type": "rune",
      "id": "rune-1"
    },
    "takerAmount": 1000,
    "expiry": 1712246400,
    "status": "open"
  }
}
```

#### trade_offer_accepted

Sent when a trade offer is accepted.

```json
{
  "type": "trade_offer_accepted",
  "payload": {
    "id": "offer-123",
    "maker": "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
    "makerAsset": {
      "type": "bitcoin"
    },
    "makerAmount": 100000000,
    "takerAsset": {
      "type": "rune",
      "id": "rune-1"
    },
    "takerAmount": 1000,
    "expiry": 1712246400,
    "status": "accepted"
  }
}
```

#### trade_completed

Sent when a trade is completed.

```json
{
  "type": "trade_completed",
  "payload": {
    "offer": {
      "id": "offer-123",
      "maker": "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
      "makerAsset": {
        "type": "bitcoin"
      },
      "makerAmount": 100000000,
      "takerAsset": {
        "type": "rune",
        "id": "rune-1"
      },
      "takerAmount": 1000,
      "expiry": 1712246400,
      "status": "completed"
    },
    "history": {
      "id": "trade-123",
      "timestamp": 1709481600,
      "type": "buy",
      "assetType": {
        "type": "rune",
        "id": "rune-1"
      },
      "amount": 1000,
      "price": 0.0001,
      "status": "completed"
    }
  }
}
```

#### trade_cancelled

Sent when a trade offer is cancelled.

```json
{
  "type": "trade_cancelled",
  "payload": {
    "id": "offer-123",
    "maker": "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
    "makerAsset": {
      "type": "bitcoin"
    },
    "makerAmount": 100000000,
    "takerAsset": {
      "type": "rune",
      "id": "rune-1"
    },
    "takerAmount": 1000,
    "expiry": 1712246400,
    "status": "cancelled"
  }
}
```

#### trade_expired

Sent when a trade offer expires.

```json
{
  "type": "trade_expired",
  "payload": {
    "id": "offer-123",
    "maker": "12D3KooWJWEKvgCnqJG7KdSB1qNqyJZiS9MQzrjM1mMQzZUYAHGg",
    "makerAsset": {
      "type": "bitcoin"
    },
    "makerAmount": 100000000,
    "takerAsset": {
      "type": "rune",
      "id": "rune-1"
    },
    "takerAmount": 1000,
    "expiry": 1712246400,
    "status": "expired"
  }
}
```

#### balance_changed

Sent when a balance changes.

```json
{
  "type": "balance_changed",
  "payload": {
    "bitcoin": 100000000,
    "rune:rune-1": 1000,
    "rune:rune-2": 2000,
    "alkane:alkane-1": 500,
    "alkane:alkane-2": 1000
  }
}
```

## Rate Limits

The API has the following rate limits:

- 100 requests per minute per IP address
- 1000 requests per hour per IP address
- 10000 requests per day per IP address

If you exceed these limits, you will receive a `429 Too Many Requests` response.