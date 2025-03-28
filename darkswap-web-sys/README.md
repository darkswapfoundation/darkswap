# DarkSwap Web-Sys

This crate provides WebAssembly bindings for the DarkSwap P2P networking functionality. It allows the DarkSwap P2P network to be used in web browsers.

## Features

- **WebAssembly Bindings**: Compile the Rust code to WebAssembly for use in browsers
- **JavaScript API**: Provide a JavaScript API for interacting with the P2P network
- **Browser Integration**: Use the browser's native WebRTC support for P2P communication
- **Event System**: Provide callbacks for network events

## Usage

### Building

To build the WebAssembly bindings, you need to have `wasm-pack` installed:

```bash
cargo install wasm-pack
```

Then, build the crate:

```bash
wasm-pack build --target web
```

This will generate a `pkg` directory containing the WebAssembly module and JavaScript bindings.

### Using in a Web Application

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DarkSwap WebAssembly Example</title>
</head>
<body>
    <script type="module">
        import init, { DarkSwapNetwork } from './pkg/darkswap_web_sys.js';

        async function run() {
            await init();
            
            // Create a new DarkSwap network
            const network = new DarkSwapNetwork();
            
            // Get the local peer ID
            const peerId = network.local_peer_id();
            console.log(`Local peer ID: ${peerId}`);
            
            // Set up event listeners
            network.on_peer_connected((peerId) => {
                console.log(`Peer connected: ${peerId}`);
            });
            
            network.on_peer_disconnected((peerId) => {
                console.log(`Peer disconnected: ${peerId}`);
            });
            
            network.on_message((peerId, topic, message) => {
                const decoder = new TextDecoder();
                const messageText = decoder.decode(message);
                console.log(`Message from ${peerId} on ${topic}: ${messageText}`);
            });
            
            // Subscribe to topics
            network.subscribe('darkswap/orderbook/v1');
            network.subscribe('darkswap/trade/v1');
            
            // Listen for connections
            await network.listen_on('/ip4/0.0.0.0/tcp/0/ws');
            
            // Connect to a peer
            try {
                await network.connect('/ip4/127.0.0.1/tcp/8000/p2p/QmExample');
                console.log('Connected to peer');
            } catch (error) {
                console.error(`Failed to connect: ${error}`);
            }
            
            // Publish a message
            const encoder = new TextEncoder();
            const message = encoder.encode('Hello, DarkSwap!');
            await network.publish('darkswap/test', message);
        }
        
        run();
    </script>
</body>
</html>
```

## API Reference

### `DarkSwapNetwork`

The main class for interacting with the DarkSwap P2P network.

#### Constructor

```javascript
const network = new DarkSwapNetwork();
```

#### Methods

- `local_peer_id()`: Get the local peer ID
- `connect(addr)`: Connect to a peer
- `connect_through_relay(relayPeerId, dstPeerId)`: Connect to a peer through a relay
- `listen_on(addr)`: Listen on the given address
- `subscribe(topic)`: Subscribe to a topic
- `unsubscribe(topic)`: Unsubscribe from a topic
- `publish(topic, message)`: Publish a message to a topic

#### Event Callbacks

- `on_peer_connected(callback)`: Register a callback for peer connection events
- `on_peer_disconnected(callback)`: Register a callback for peer disconnection events
- `on_message(callback)`: Register a callback for message events
- `on_relay_reserved(callback)`: Register a callback for relay reservation events
- `on_connected_through_relay(callback)`: Register a callback for connected through relay events

## Examples

See the `examples` directory for more examples of how to use this crate.