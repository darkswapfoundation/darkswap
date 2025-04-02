# DarkSwap Relay Server

The DarkSwap Relay Server provides WebRTC signaling and circuit relay functionality for the DarkSwap P2P network. It enables peers to connect to each other even when behind NATs, using WebRTC for browser-to-browser communication and circuit relay for NAT traversal.

## Features

- **WebRTC Signaling**: WebSocket-based signaling server for WebRTC connection establishment
- **Circuit Relay**: Relay functionality for peers that can't connect directly
- **Authentication**: JWT-based authentication for secure peer identification
- **Rate Limiting**: Protection against DoS attacks and resource abuse
- **Metrics**: Prometheus metrics for monitoring
- **Configuration**: Flexible configuration via TOML files and environment variables

## Requirements

- Rust 1.70 or later
- OpenSSL development libraries
- CMake (for WebRTC dependencies)

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/darkswap/darkswap-relay.git
   cd darkswap-relay
   ```

2. Build the relay server:
   ```bash
   cargo build --release
   ```

3. Generate certificates for WebRTC:
   ```bash
   ./generate-certs.sh
   ```

4. Run the relay server:
   ```bash
   ./target/release/darkswap-relay --config config.toml
   ```

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t darkswap-relay .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 9002:9002 -p 9003:9003 -p 9090:9090 -v $(pwd)/config.toml:/app/config.toml darkswap-relay
   ```

## Configuration

The relay server can be configured using a TOML file or environment variables.

### Configuration File

Create a `config.toml` file with the following structure:

```toml
# WebRTC configuration
[webrtc]
stun_servers = ["stun:stun.l.google.com:19302"]
ice_gathering_timeout = 10
connection_establishment_timeout = 30
data_channel_establishment_timeout = 10

# Network configuration
[network]
listen_address = "0.0.0.0"
signaling_port = 9002
webrtc_port = 9003
metrics_port = 9090

# Security configuration
[security]
peer_timeout = 300
connection_timeout = 60

# Relay configuration
[relay]
max_circuit_duration = 3600
max_circuit_bytes = 10485760
max_circuits = 1000
max_circuits_per_peer = 10
max_bandwidth_per_circuit = 1048576
reservation_duration = 3600
circuit_cleanup_interval = 60
reservation_cleanup_interval = 300

# Enable metrics
enable_metrics = true
```

### Environment Variables

The relay server can also be configured using environment variables. See the `.env.example` file for a list of available environment variables.

## Usage

### Running the Server

```bash
# Run with default configuration
./target/release/darkswap-relay

# Run with a custom configuration file
./target/release/darkswap-relay --config my-config.toml

# Generate a default configuration file
./target/release/darkswap-relay generate-config --output my-config.toml

# Generate a token for a peer
./target/release/darkswap-relay generate-token --peer-id my-peer-id --roles user
```

### Using the Client Library

The relay server comes with a JavaScript client library that can be used to connect to the relay server from a web browser.

```javascript
// Create a client
const client = new DarkSwapRelayClient({
  signalUrl: 'ws://localhost:9002/signaling',
  peerId: 'my-peer-id',
  onPeerConnected: (peerId) => console.log(`Peer connected: ${peerId}`),
  onMessage: (data, peerId) => console.log(`Message from ${peerId}: ${data}`)
});

// Connect to the signaling server
await client.connect();

// Connect to a peer
await client.connectToPeer('other-peer-id');

// Send a message to a peer
await client.sendToPeer('other-peer-id', 'Hello, world!');

// Connect to a peer via relay
const relayId = await client.connectToPeerViaRelay('other-peer-id');

// Send a message to a peer via relay
await client.sendToPeerViaRelay(relayId, 'Hello, world!');
```

## Monitoring

The relay server exposes Prometheus metrics on port 9090 (by default). You can use Prometheus and Grafana to monitor the relay server.

```bash
# Access metrics
curl http://localhost:9090/metrics
```

## Security

The relay server supports the following security features:

- **TLS**: Secure WebSocket connections with TLS
- **Authentication**: JWT-based authentication for peers
- **Rate Limiting**: Protection against DoS attacks
- **Bandwidth Limiting**: Limit bandwidth usage for relay connections

## Development

### Building

```bash
# Build in debug mode
cargo build

# Build in release mode
cargo build --release

# Run tests
cargo test

# Run with logging
RUST_LOG=debug cargo run
```

### Directory Structure

- `src/`: Source code
  - `auth.rs`: Authentication system
  - `circuit_relay.rs`: Circuit relay implementation
  - `config.rs`: Configuration system
  - `error.rs`: Error types
  - `main.rs`: Main entry point
  - `metrics.rs`: Metrics server
  - `rate_limit.rs`: Rate limiting system
  - `server.rs`: Server implementation
  - `signaling.rs`: Signaling server
  - `utils.rs`: Utility functions
  - `webrtc.rs`: WebRTC manager
- `client/`: JavaScript client library
- `certs/`: Certificates for WebRTC
- `tests/`: Integration tests

## License

This project is licensed under the MIT License - see the LICENSE file for details.