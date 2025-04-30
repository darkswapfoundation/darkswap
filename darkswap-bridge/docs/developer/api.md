# DarkSwap Bridge API Reference

This document provides a comprehensive reference for the DarkSwap Bridge API, which allows developers to interact with the bridge programmatically.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Wallet](#wallet-endpoints)
  - [Network](#network-endpoints)
  - [Orders](#order-endpoints)
  - [Trades](#trade-endpoints)
  - [System](#system-endpoints)
- [WebSocket API](#websocket-api)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The DarkSwap Bridge API is a RESTful API that allows developers to interact with the bridge programmatically. The API is built using Express.js and provides endpoints for authentication, wallet management, network management, order management, trade management, and system management.

The API is available at `http://localhost:3001/api` by default, but the port can be configured in the `.env` file.

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. To authenticate, you need to send a POST request to the `/api/auth/login` endpoint with your username and password. The server will respond with a JWT token that you can use for subsequent requests.

### Example

```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

To use the token, include it in the `Authorization` header of your requests:

```http
GET /api/bridge/wallet/status HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. In case of an error, the response body will contain a JSON object with an error message:

```json
{
  "message": "Error message"
}
```

Common error codes:

- `400 Bad Request`: The request was malformed or missing required parameters
- `401 Unauthorized`: Authentication is required or the provided credentials are invalid
- `403 Forbidden`: The authenticated user does not have permission to access the requested resource
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: An unexpected error occurred on the server

## API Endpoints

### Authentication Endpoints

#### Login

```
POST /api/auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Register (Development Only)

```
POST /api/auth/register
```

Registers a new user. This endpoint is only available in development mode.

**Request Body:**

```json
{
  "username": "newuser",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Wallet Endpoints

#### Send Wallet Message

```
POST /api/bridge/wallet
```

Sends a message to the wallet component.

**Request Body:**

```json
{
  "action": "create_wallet",
  "payload": {
    "name": "my_wallet",
    "passphrase": "my_passphrase"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    // Response data depends on the action
  }
}
```

#### Get Wallet Status

```
GET /api/bridge/wallet/status
```

Gets the status of the wallet component.

**Response:**

```json
{
  "status": "connected"
}
```

#### Get Wallet Balance

```
GET /api/bridge/wallet/balance
```

Gets the balance of the currently open wallet.

**Response:**

```json
{
  "confirmed": 1000000,
  "unconfirmed": 0
}
```

### Network Endpoints

#### Send Network Message

```
POST /api/bridge/network
```

Sends a message to the network component.

**Request Body:**

```json
{
  "action": "connect",
  "payload": {
    "address": "peer1.example.com:8333"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    // Response data depends on the action
  }
}
```

#### Get Network Status

```
GET /api/bridge/network/status
```

Gets the status of the network component.

**Response:**

```json
{
  "status": "connected"
}
```

#### Get Connected Peers

```
GET /api/bridge/network/peers
```

Gets the list of connected peers.

**Response:**

```json
{
  "peers": [
    "peer1.example.com:8333",
    "peer2.example.com:8333"
  ]
}
```

### Order Endpoints

#### Get Orders

```
GET /api/bridge/orders
```

Gets the list of orders.

**Response:**

```json
{
  "orders": [
    {
      "id": "order1",
      "order_type": "buy",
      "sell_asset": "BTC",
      "sell_amount": 100000,
      "buy_asset": "RUNE",
      "buy_amount": 10000000,
      "peer_id": "peer1.example.com:8333",
      "timestamp": 1617235678000,
      "status": "open"
    }
  ]
}
```

### Trade Endpoints

#### Get Trades

```
GET /api/bridge/trades
```

Gets the list of trades.

**Response:**

```json
{
  "trades": [
    {
      "id": "trade1",
      "order_id": "order1",
      "amount": 100000,
      "initiator": "peer1.example.com:8333",
      "counterparty": "peer2.example.com:8333",
      "timestamp": 1617235678000,
      "status": "proposed"
    }
  ]
}
```

### System Endpoints

#### Send System Message

```
POST /api/bridge/system
```

Sends a message to the system.

**Request Body:**

```json
{
  "action": "save_settings",
  "payload": {
    "log_level": "debug",
    "auto_start": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    // Response data depends on the action
  }
}
```

## WebSocket API

The DarkSwap Bridge also provides a WebSocket API for real-time updates. The WebSocket server is available at `ws://localhost:3001` by default.

To authenticate with the WebSocket server, send a message with the following format:

```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Once authenticated, you will receive real-time updates for the following events:

- `wallet_status`: Updates on wallet status
- `network_status`: Updates on network status
- `wallet_balance`: Updates on wallet balance
- `connected_peers`: Updates on connected peers
- `orders`: Updates on orders
- `trades`: Updates on trades

Example of a WebSocket message:

```json
{
  "type": "wallet_status",
  "data": {
    "status": "connected"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The default rate limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per IP address

If you exceed these limits, you will receive a `429 Too Many Requests` response.

## Examples

### Creating a Wallet

```javascript
const axios = require('axios');

async function createWallet() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Create wallet
    const createWalletResponse = await axios.post('http://localhost:3001/api/bridge/wallet', {
      action: 'create_wallet',
      payload: {
        name: 'my_wallet',
        passphrase: 'my_passphrase'
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Wallet created:', createWalletResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

createWallet();
```

### Connecting to a Peer

```javascript
const axios = require('axios');

async function connectToPeer() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Connect to peer
    const connectResponse = await axios.post('http://localhost:3001/api/bridge/network', {
      action: 'connect',
      payload: {
        address: 'peer1.example.com:8333'
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Connected to peer:', connectResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

connectToPeer();
```

### Creating an Order

```javascript
const axios = require('axios');

async function createOrder() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Create order
    const createOrderResponse = await axios.post('http://localhost:3001/api/bridge/network', {
      action: 'create_order',
      payload: {
        order_type: 'buy',
        sell_asset: 'BTC',
        sell_amount: 100000,
        buy_asset: 'RUNE',
        buy_amount: 10000000
      }
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Order created:', createOrderResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

createOrder();