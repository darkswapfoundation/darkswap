# WebSocketClient Component Documentation

## Overview

The `WebSocketClient` is a core utility class in the DarkSwap platform that handles WebSocket connections for real-time communication with the DarkSwap server. It provides methods for connecting, disconnecting, sending messages, and handling events.

## Constructor

```typescript
constructor(options: WebSocketClientOptions)
```

### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `WebSocketClientOptions` | `undefined` | Configuration options for the WebSocket client. |

### WebSocketClientOptions

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | `undefined` | The URL of the WebSocket server. |
| `reconnectInterval` | `number` | `1000` | The interval in milliseconds between reconnection attempts. |
| `maxReconnectAttempts` | `number` | `5` | The maximum number of reconnection attempts. |
| `reconnectOnClose` | `boolean` | `true` | Whether to automatically reconnect when the connection is closed. |
| `debug` | `boolean` | `false` | Whether to enable debug logging. |

## Properties

| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | The URL of the WebSocket server. |
| `status` | `WebSocketStatus` | The current status of the WebSocket connection. |
| `socket` | `WebSocket \| null` | The WebSocket instance. |
| `reconnectInterval` | `number` | The interval in milliseconds between reconnection attempts. |
| `maxReconnectAttempts` | `number` | The maximum number of reconnection attempts. |
| `reconnectAttempts` | `number` | The current number of reconnection attempts. |
| `reconnectOnClose` | `boolean` | Whether to automatically reconnect when the connection is closed. |
| `debug` | `boolean` | Whether to enable debug logging. |
| `eventHandlers` | `Map<string, Set<EventHandler>>` | A map of event handlers. |

## Methods

### connect

```typescript
connect(): Promise<void>
```

Connects to the WebSocket server.

#### Returns

A promise that resolves when the connection is established.

#### Example

```typescript
const client = new WebSocketClient({
  url: 'ws://localhost:8000/ws',
});

try {
  await client.connect();
  console.log('Connected to WebSocket server');
} catch (error) {
  console.error('Failed to connect to WebSocket server:', error);
}
```

### disconnect

```typescript
disconnect(): void
```

Disconnects from the WebSocket server.

#### Example

```typescript
client.disconnect();
console.log('Disconnected from WebSocket server');
```

### send

```typescript
send(message: string | object): void
```

Sends a message to the WebSocket server.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `message` | `string \| object` | The message to send. If an object is provided, it will be converted to a JSON string. |

#### Example

```typescript
// Sending a string message
client.send('Hello, server!');

// Sending an object message
client.send({
  type: 'trade_offer',
  payload: {
    makerAsset: { type: 'bitcoin' },
    makerAmount: 100000000,
    takerAsset: { type: 'rune', id: 'rune-1' },
    takerAmount: 1000,
  },
});
```

### on

```typescript
on(event: string, handler: EventHandler): void
```

Registers an event handler.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `event` | `string` | The event name. |
| `handler` | `EventHandler` | The event handler function. |

#### Example

```typescript
// Handling a message event
client.on('message', (message) => {
  console.log('Received message:', message);
});

// Handling a specific message type
client.on('trade_offer_received', (offer) => {
  console.log('Received trade offer:', offer);
});

// Handling connection events
client.on('open', () => {
  console.log('WebSocket connection opened');
});

client.on('close', () => {
  console.log('WebSocket connection closed');
});

client.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### off

```typescript
off(event: string, handler: EventHandler): void
```

Unregisters an event handler.

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `event` | `string` | The event name. |
| `handler` | `EventHandler` | The event handler function. |

#### Example

```typescript
const handleMessage = (message) => {
  console.log('Received message:', message);
};

// Register the event handler
client.on('message', handleMessage);

// Unregister the event handler
client.off('message', handleMessage);
```

### getStatus

```typescript
getStatus(): WebSocketStatus
```

Gets the current status of the WebSocket connection.

#### Returns

The current status of the WebSocket connection.

#### Example

```typescript
const status = client.getStatus();
console.log('WebSocket status:', status);
```

## Events

The `WebSocketClient` emits the following events:

| Event | Description | Payload |
|-------|-------------|---------|
| `open` | Emitted when the WebSocket connection is opened. | `undefined` |
| `close` | Emitted when the WebSocket connection is closed. | `CloseEvent` |
| `error` | Emitted when an error occurs. | `Event` |
| `message` | Emitted when a message is received. | `MessageEvent` |
| `status_change` | Emitted when the WebSocket status changes. | `WebSocketStatus` |
| `reconnect_attempt` | Emitted when a reconnection attempt is made. | `number` (attempt number) |
| `reconnect_success` | Emitted when a reconnection is successful. | `undefined` |
| `reconnect_failure` | Emitted when all reconnection attempts fail. | `undefined` |
| `*` | Emitted for all message types. | `any` |

In addition to these events, the `WebSocketClient` also emits events for specific message types. For example, if a message with `type: 'trade_offer_received'` is received, an event with the name `'trade_offer_received'` will be emitted with the message payload.

## WebSocketStatus

The `WebSocketStatus` enum represents the possible states of the WebSocket connection:

```typescript
enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
}
```

## Usage

### Basic Usage

```typescript
import { WebSocketClient } from '../utils/WebSocketClient';

// Create a new WebSocketClient
const client = new WebSocketClient({
  url: 'ws://localhost:8000/ws',
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
  reconnectOnClose: true,
  debug: true,
});

// Connect to the WebSocket server
client.connect()
  .then(() => {
    console.log('Connected to WebSocket server');
  })
  .catch((error) => {
    console.error('Failed to connect to WebSocket server:', error);
  });

// Handle messages
client.on('message', (message) => {
  console.log('Received message:', message);
});

// Handle specific message types
client.on('trade_offer_received', (offer) => {
  console.log('Received trade offer:', offer);
});

// Handle connection events
client.on('open', () => {
  console.log('WebSocket connection opened');
});

client.on('close', () => {
  console.log('WebSocket connection closed');
});

client.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Send a message
client.send({
  type: 'trade_offer',
  payload: {
    makerAsset: { type: 'bitcoin' },
    makerAmount: 100000000,
    takerAsset: { type: 'rune', id: 'rune-1' },
    takerAmount: 1000,
  },
});

// Disconnect from the WebSocket server
client.disconnect();
```

### With React

```tsx
import React, { useEffect, useState } from 'react';
import { WebSocketClient, WebSocketStatus } from '../utils/WebSocketClient';

const WebSocketComponent: React.FC = () => {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Create a new WebSocketClient
    const newClient = new WebSocketClient({
      url: 'ws://localhost:8000/ws',
    });

    // Set the client state
    setClient(newClient);

    // Handle status changes
    newClient.on('status_change', (newStatus) => {
      setStatus(newStatus);
    });

    // Handle messages
    newClient.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, JSON.stringify(message)]);
    });

    // Connect to the WebSocket server
    newClient.connect().catch((error) => {
      console.error('Failed to connect to WebSocket server:', error);
    });

    // Clean up on unmount
    return () => {
      newClient.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (client && status === WebSocketStatus.CONNECTED) {
      client.send({
        type: 'ping',
        payload: {
          timestamp: Date.now(),
        },
      });
    }
  };

  return (
    <div>
      <div>Status: {status}</div>
      <button onClick={handleSendMessage} disabled={status !== WebSocketStatus.CONNECTED}>
        Send Ping
      </button>
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
```

## Implementation Details

### Reconnection Logic

The `WebSocketClient` includes automatic reconnection logic that attempts to reconnect to the WebSocket server when the connection is lost. The reconnection logic works as follows:

1. When the WebSocket connection is closed, the `onClose` event handler is called.
2. If `reconnectOnClose` is `true`, the client will attempt to reconnect after `reconnectInterval` milliseconds.
3. If the reconnection fails, the client will continue to attempt to reconnect until `maxReconnectAttempts` is reached.
4. If all reconnection attempts fail, the client will emit a `reconnect_failure` event.

### Message Parsing

The `WebSocketClient` automatically parses incoming messages as JSON. If the message is not valid JSON, it will be passed as-is to the event handlers.

For messages that are successfully parsed as JSON, the client will emit an event with the message type (if available) and the message payload. For example, if a message with `type: 'trade_offer_received'` is received, an event with the name `'trade_offer_received'` will be emitted with the message payload.

### Error Handling

The `WebSocketClient` includes error handling for various scenarios:

1. **Connection Errors**: If the WebSocket connection fails to establish, the `connect` method will reject with an error.
2. **Message Parsing Errors**: If a message cannot be parsed as JSON, the client will log an error (if `debug` is `true`) and emit the message as-is.
3. **Send Errors**: If a message cannot be sent because the WebSocket connection is not open, the `send` method will throw an error.

## Testing

The `WebSocketClient` can be tested using the following test cases:

1. **Connection**: Test that the client can connect to a WebSocket server.
2. **Disconnection**: Test that the client can disconnect from a WebSocket server.
3. **Sending Messages**: Test that the client can send messages to a WebSocket server.
4. **Receiving Messages**: Test that the client can receive messages from a WebSocket server.
5. **Reconnection**: Test that the client can reconnect to a WebSocket server when the connection is lost.
6. **Event Handling**: Test that the client emits the correct events.

Example test:

```typescript
import { WebSocketClient, WebSocketStatus } from '../utils/WebSocketClient';
import { Server } from 'mock-socket';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let server: Server;
  const url = 'ws://localhost:8080';

  beforeEach(() => {
    server = new Server(url);
    client = new WebSocketClient({ url });
  });

  afterEach(() => {
    client.disconnect();
    server.close();
  });

  it('should connect to a WebSocket server', async () => {
    const connectPromise = client.connect();
    
    server.on('connection', (socket) => {
      socket.send(JSON.stringify({ type: 'connected' }));
    });
    
    await connectPromise;
    
    expect(client.getStatus()).toBe(WebSocketStatus.CONNECTED);
  });

  it('should send messages to a WebSocket server', async () => {
    const connectPromise = client.connect();
    
    let receivedMessage: any = null;
    
    server.on('connection', (socket) => {
      socket.on('message', (message) => {
        receivedMessage = JSON.parse(message.toString());
      });
      socket.send(JSON.stringify({ type: 'connected' }));
    });
    
    await connectPromise;
    
    client.send({ type: 'test', payload: { foo: 'bar' } });
    
    // Wait for the message to be received
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    expect(receivedMessage).toEqual({ type: 'test', payload: { foo: 'bar' } });
  });

  // Add more tests here...
});