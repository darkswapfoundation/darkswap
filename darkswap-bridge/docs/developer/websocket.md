# DarkSwap Bridge WebSocket API Reference

This document provides a comprehensive reference for the DarkSwap Bridge WebSocket API, which allows developers to receive real-time updates from the bridge.

## Table of Contents

- [Overview](#overview)
- [Connection](#connection)
- [Authentication](#authentication)
- [Message Format](#message-format)
- [Event Types](#event-types)
  - [Wallet Events](#wallet-events)
  - [Network Events](#network-events)
  - [Order Events](#order-events)
  - [Trade Events](#trade-events)
  - [System Events](#system-events)
- [Sending Messages](#sending-messages)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

The DarkSwap Bridge WebSocket API provides real-time updates for various events in the bridge, such as wallet status changes, network status changes, new orders, and trade updates. This allows developers to build responsive applications that can react to changes in the bridge state without polling the REST API.

## Connection

To connect to the WebSocket API, use the following URL:

```
ws://localhost:3001
```

The port can be configured in the `.env` file.

## Authentication

To authenticate with the WebSocket server, send a message with the following format immediately after connecting:

```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The token is the same JWT token that you use for the REST API. If the token is valid, the server will respond with a success message:

```json
{
  "type": "auth_result",
  "success": true
}
```

If the token is invalid, the server will respond with an error message and close the connection:

```json
{
  "type": "auth_result",
  "success": false,
  "message": "Invalid token"
}
```

## Message Format

All messages sent and received through the WebSocket API are JSON objects with the following format:

```json
{
  "type": "event_type",
  "data": {
    // Event-specific data
  }
}
```

The `type` field indicates the type of event, and the `data` field contains event-specific data.

## Event Types

### Wallet Events

#### wallet_status

Sent when the wallet status changes.

```json
{
  "type": "wallet_status",
  "data": {
    "status": "connected"
  }
}
```

Possible status values:
- `connected`: The wallet is connected to the bridge
- `disconnected`: The wallet is not connected to the bridge
- `syncing`: The wallet is syncing with the blockchain
- `error`: The wallet encountered an error

#### wallet_balance

Sent when the wallet balance changes.

```json
{
  "type": "wallet_balance",
  "data": {
    "confirmed": 1000000,
    "unconfirmed": 0
  }
}
```

#### wallet_transaction

Sent when a new transaction is received or when an existing transaction is confirmed.

```json
{
  "type": "wallet_transaction",
  "data": {
    "txid": "1a2b3c4d5e6f7g8h9i0j",
    "amount": 100000,
    "recipient": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    "timestamp": 1617235678000,
    "status": "pending"
  }
}
```

Possible status values:
- `pending`: The transaction is pending confirmation
- `confirmed`: The transaction is confirmed
- `failed`: The transaction failed

#### wallet_address

Sent when a new address is created.

```json
{
  "type": "wallet_address",
  "data": {
    "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
  }
}
```

### Network Events

#### network_status

Sent when the network status changes.

```json
{
  "type": "network_status",
  "data": {
    "status": "connected"
  }
}
```

Possible status values:
- `connected`: The network is connected to the bridge
- `disconnected`: The network is not connected to the bridge
- `error`: The network encountered an error

#### connected_peers

Sent when the list of connected peers changes.

```json
{
  "type": "connected_peers",
  "data": {
    "peers": [
      "peer1.example.com:8333",
      "peer2.example.com:8333"
    ]
  }
}
```

#### peer_connected

Sent when a new peer connects.

```json
{
  "type": "peer_connected",
  "data": {
    "peer": "peer1.example.com:8333"
  }
}
```

#### peer_disconnected

Sent when a peer disconnects.

```json
{
  "type": "peer_disconnected",
  "data": {
    "peer": "peer1.example.com:8333"
  }
}
```

#### message_received

Sent when a message is received from a peer.

```json
{
  "type": "message_received",
  "data": {
    "from": "peer1.example.com:8333",
    "message": "Hello, world!",
    "timestamp": 1617235678000
  }
}
```

### Order Events

#### orders

Sent when the list of orders changes.

```json
{
  "type": "orders",
  "data": {
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
}
```

#### order_created

Sent when a new order is created.

```json
{
  "type": "order_created",
  "data": {
    "order": {
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
  }
}
```

#### order_cancelled

Sent when an order is cancelled.

```json
{
  "type": "order_cancelled",
  "data": {
    "order_id": "order1"
  }
}
```

#### order_filled

Sent when an order is filled.

```json
{
  "type": "order_filled",
  "data": {
    "order_id": "order1",
    "trade_id": "trade1"
  }
}
```

### Trade Events

#### trades

Sent when the list of trades changes.

```json
{
  "type": "trades",
  "data": {
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
}
```

#### trade_proposed

Sent when a new trade is proposed.

```json
{
  "type": "trade_proposed",
  "data": {
    "trade": {
      "id": "trade1",
      "order_id": "order1",
      "amount": 100000,
      "initiator": "peer1.example.com:8333",
      "counterparty": "peer2.example.com:8333",
      "timestamp": 1617235678000,
      "status": "proposed"
    }
  }
}
```

#### trade_accepted

Sent when a trade is accepted.

```json
{
  "type": "trade_accepted",
  "data": {
    "trade_id": "trade1"
  }
}
```

#### trade_rejected

Sent when a trade is rejected.

```json
{
  "type": "trade_rejected",
  "data": {
    "trade_id": "trade1",
    "reason": "Rejected by user"
  }
}
```

#### trade_executing

Sent when a trade is being executed.

```json
{
  "type": "trade_executing",
  "data": {
    "trade_id": "trade1",
    "transaction_id": "1a2b3c4d5e6f7g8h9i0j"
  }
}
```

#### trade_confirmed

Sent when a trade is confirmed.

```json
{
  "type": "trade_confirmed",
  "data": {
    "trade_id": "trade1",
    "transaction_id": "1a2b3c4d5e6f7g8h9i0j"
  }
}
```

#### trade_cancelled

Sent when a trade is cancelled.

```json
{
  "type": "trade_cancelled",
  "data": {
    "trade_id": "trade1",
    "reason": "Cancelled by user"
  }
}
```

### System Events

#### system_status

Sent when the system status changes.

```json
{
  "type": "system_status",
  "data": {
    "status": "running"
  }
}
```

Possible status values:
- `starting`: The system is starting
- `running`: The system is running
- `stopping`: The system is stopping
- `error`: The system encountered an error

#### system_error

Sent when the system encounters an error.

```json
{
  "type": "system_error",
  "data": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Sending Messages

You can also send messages to the WebSocket server. The format is the same as for received messages:

```json
{
  "type": "message_type",
  "data": {
    // Message-specific data
  }
}
```

### Ping

You can send a ping message to check if the connection is still alive:

```json
{
  "type": "ping",
  "data": {
    "timestamp": 1617235678000
  }
}
```

The server will respond with a pong message:

```json
{
  "type": "pong",
  "data": {
    "timestamp": 1617235678000
  }
}
```

## Error Handling

If an error occurs while processing a message, the server will send an error message:

```json
{
  "type": "error",
  "data": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

## Examples

### Connecting and Authenticating

```javascript
const WebSocket = require('ws');

// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:3001');

// Handle connection open
ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }));
});

// Handle messages
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'auth_result') {
    if (message.success) {
      console.log('Authentication successful');
    } else {
      console.error('Authentication failed:', message.message);
      ws.close();
    }
  } else {
    console.log('Received message:', message);
  }
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle connection close
ws.on('close', () => {
  console.log('Disconnected from WebSocket server');
});
```

### Listening for Events

```javascript
const WebSocket = require('ws');

// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:3001');

// Handle connection open
ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }));
});

// Handle messages
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  switch (message.type) {
    case 'auth_result':
      if (message.success) {
        console.log('Authentication successful');
      } else {
        console.error('Authentication failed:', message.message);
        ws.close();
      }
      break;
    
    case 'wallet_status':
      console.log('Wallet status:', message.data.status);
      break;
    
    case 'network_status':
      console.log('Network status:', message.data.status);
      break;
    
    case 'order_created':
      console.log('New order:', message.data.order);
      break;
    
    case 'trade_proposed':
      console.log('New trade proposal:', message.data.trade);
      break;
    
    default:
      console.log('Received message:', message);
  }
});

// Send a ping every 30 seconds
setInterval(() => {
  ws.send(JSON.stringify({
    type: 'ping',
    data: {
      timestamp: Date.now()
    }
  }));
}, 30000);