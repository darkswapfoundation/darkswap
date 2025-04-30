# DarkSwap P2P

This crate provides the P2P networking functionality for the DarkSwap project. It includes:

- WebRTC transport for browser compatibility
- Circuit relay for NAT traversal
- P2P protocol handlers

## Features

- **WebRTC Transport**: WebRTC transport implementation for libp2p
- **WebRTC Signaling Client**: Client for WebRTC signaling server
- **Circuit Relay**: Circuit relay implementation for NAT traversal
- **P2P Protocol Handlers**: Handlers for P2P protocol messages
- **Connection Pooling**: Efficient reuse of WebRTC connections
- **Relay Discovery**: Mechanism for finding and ranking relay nodes
- **Relay Connection Pool**: Managed connections to relay nodes for NAT traversal
- **Authentication and Authorization**: Secure authentication for relay nodes
- **End-to-End Encryption**: Secure communication between peers
- **Metrics and Monitoring**: Comprehensive metrics collection and reporting
- **Cross-Platform Support**: Works on both native and WebAssembly targets

## Usage

Add this crate as a dependency in your `Cargo.toml`:

```toml
[dependencies]
darkswap-p2p = { path = "../darkswap-p2p" }
```

### Basic Example

```rust
use darkswap_p2p::{
    network::{Network, NetworkConfig, NetworkEvent},
    Error,
};
use darkswap_support::types::PeerId;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a network configuration
    let config = NetworkConfig {
        bootstrap_peers: vec![
            // Add bootstrap peers here
        ],
        topics: vec![
            "darkswap/orderbook/v1".to_string(),
            "darkswap/trade/v1".to_string(),
        ],
        relay_peers: vec![
            // Add relay peers here
        ],
        connection_timeout: Duration::from_secs(30),
    };

    // Create a network
    let mut network = Network::new(config).await?;
    println!("Local peer ID: {}", network.local_peer_id());

    // Listen on a local address
    network.listen_on("/ip4/127.0.0.1/tcp/0").await?;

    // Subscribe to topics
    network.subscribe("darkswap/orderbook/v1")?;
    network.subscribe("darkswap/trade/v1")?;

    // Handle events
    while let Some(event) = network.next_event().await {
        match event {
            NetworkEvent::PeerConnected(peer_id) => {
                println!("Peer connected: {}", peer_id);
            }
            NetworkEvent::PeerDisconnected(peer_id) => {
                println!("Peer disconnected: {}", peer_id);
            }
            NetworkEvent::MessageReceived { peer_id, topic, message } => {
                println!(
                    "Message received from {} on topic {}: {:?}",
                    peer_id, topic, message
                );
            }
            NetworkEvent::RelayReserved { relay_peer_id, reservation_id } => {
                println!(
                    "Relay reserved: {} with reservation ID {}",
                    relay_peer_id, reservation_id
                );
            }
            NetworkEvent::ConnectedThroughRelay { relay_peer_id, dst_peer_id } => {
                println!(
                    "Connected through relay {} to {}",
                    relay_peer_id, dst_peer_id
                );
            }
        }
    }

    Ok(())
}
```

## WebRTC Transport

The WebRTC transport implementation allows for browser-to-browser communication using WebRTC. It is enabled with the `wasm` feature:

```toml
[dependencies]
darkswap-p2p = { path = "../darkswap-p2p", features = ["wasm"] }
```

### WebRTC Example

```rust
use darkswap_p2p::{
    WebRtcTransport,
    WebRtcSignalingClient,
    error::Error,
};
use libp2p::{
    core::{
        transport::Transport,
        Multiaddr, PeerId,
    },
    identity,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a random identity
    let local_key = identity::Keypair::generate_ed25519();
    let local_peer_id = PeerId::from(local_key.public());
    
    // Create a WebRTC signaling client
    let webrtc_signaling_client = WebRtcSignalingClient::new(local_peer_id.clone());
    
    // Connect to the signaling server
    webrtc_signaling_client.connect("ws://localhost:9001/signaling").await?;
    
    // Create a WebRTC transport with the signaling client
    let mut webrtc_transport = WebRtcTransport::with_signaling_client(
        local_peer_id.clone(),
        Some(std::sync::Arc::new(webrtc_signaling_client)),
    );
    
    // Set the signaling server URL
    webrtc_transport.set_signaling_server("ws://localhost:9001/signaling".to_string());
    
    // Connect to the signaling server
    webrtc_transport.connect_to_signaling_server().await?;
    
    // Dial a peer
    let peer_id = PeerId::random();
    let addr = format!("/ip4/127.0.0.1/tcp/0/webrtc/p2p/{}", peer_id).parse::<Multiaddr>()?;
    let connection = webrtc_transport.dial(addr)?.await?;
    
    // Send and receive data
    if let Some(mut data_channel) = connection.data_channels.get("data") {
        data_channel.send(b"Hello, world!".to_vec()).await?;
        let data = data_channel.receive().await?;
        println!("Received: {}", String::from_utf8_lossy(&data));
    }
    
    Ok(())
}
```

## WebRTC Signaling Client

The WebRTC signaling client is used to establish WebRTC connections between peers. It connects to a signaling server and exchanges SDP offers, answers, and ICE candidates.

```rust
use darkswap_p2p::WebRtcSignalingClient;
use libp2p::PeerId;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a WebRTC signaling client
    let client = WebRtcSignalingClient::new(PeerId::random());
    
    // Connect to the signaling server
    client.connect("ws://localhost:9001/signaling").await?;
    
    // Create an offer
    let peer_id = PeerId::random();
    let offer = client.create_offer(&peer_id).await?;
    
    // Wait for the connection to be established
    client.wait_for_connection(&peer_id).await?;
    
    Ok(())
}
```

## Signaling Server

A simple signaling server is included in the examples. It can be run with:

```bash
cargo run --example signaling_server
```

The signaling server listens on `ws://localhost:9001/signaling` by default.

## Circuit Relay

The circuit relay implementation allows for NAT traversal by relaying connections through a relay node. It is based on the circuit relay v2 protocol from libp2p.

## Network

The `Network` struct is the main entry point for the P2P networking functionality. It provides methods for:

- Connecting to peers
- Listening for connections
- Subscribing to topics
- Publishing messages
- Handling events
## Connection Pool

The connection pool allows for efficient reuse of WebRTC connections. It manages the lifecycle of connections, including creation, reuse, and cleanup.

```rust
use darkswap_p2p::{
    connection_pool::{ConnectionPool, ConnectionPoolConfig},
    webrtc_connection::WebRtcConnectionManager,
};
use std::{sync::Arc, time::Duration};

// Create a connection pool configuration
let pool_config = ConnectionPoolConfig {
    max_connections: 100,
    ttl: Duration::from_secs(300), // 5 minutes
    max_age: Duration::from_secs(3600), // 1 hour
    enable_reuse: true,
};

// Create a connection pool
let connection_pool = Arc::new(ConnectionPool::new(pool_config));

// Create a WebRTC connection manager with the connection pool
let connection_manager = WebRtcConnectionManager::with_connection_pool(
    local_peer_id,
    signaling_client,
    connection_pool,
);

// Create a connection (will be added to the pool)
let connection = connection_manager.create_connection(&peer_id).await?;

// Get a connection from the pool (if available)
if let Some(connection) = connection_manager.get_connection(&peer_id) {
    // Use the connection
}

// Release a connection back to the pool
connection_manager.release_connection(&peer_id);

// Close a connection and remove it from the pool
connection_manager.close_connection(&peer_id).await?;

// Get connection pool statistics
let stats = connection_manager.get_connection_stats();
println!("Total connections: {}", stats.total_connections);
println!("In-use connections: {}", stats.in_use_connections);
println!("Idle connections: {}", stats.idle_connections);

// Prune the connection pool (remove expired connections)
connection_manager.prune_connections();
```

## Relay Discovery

The relay discovery mechanism allows for finding and ranking relay nodes in the P2P network. It includes methods for discovering relays, tracking their performance, and selecting the best relays for connection.

```rust
use darkswap_p2p::relay_discovery::{RelayDiscoveryManager, RelayDiscoveryConfig};
use libp2p::{Multiaddr, PeerId};
use std::time::Duration;

// Create a relay discovery configuration
let config = RelayDiscoveryConfig {
    bootstrap_relays: vec![
        (PeerId::random(), "/ip4/127.0.0.1/tcp/9002".parse().unwrap()),
        (PeerId::random(), "/ip4/127.0.0.1/tcp/9003".parse().unwrap()),
    ],
    dht_query_interval: Duration::from_secs(300),
    relay_ttl: Duration::from_secs(3600),
    max_relays: 100,
    enable_dht_discovery: true,
    enable_mdns_discovery: true,
};

// Create a relay discovery manager
let relay_discovery = RelayDiscoveryManager::new(config);

// Add a relay
let peer_id = PeerId::random();
let addr = "/ip4/127.0.0.1/tcp/9004".parse::<Multiaddr>().unwrap();
relay_discovery.add_relay(peer_id.clone(), vec![addr]);

// Get the best relays
let best_relays = relay_discovery.get_best_relays(5);
for relay in best_relays {
    println!("Relay: {}, Score: {}", relay.peer_id, relay.score());
}

// Record a successful connection
relay_discovery.record_success(&peer_id, 50); // 50ms latency

// Record a failed connection
relay_discovery.record_failure(&peer_id);

// Prune expired relays
relay_discovery.prune_relays();
```

## Relay Connection Pool

The relay connection pool combines the connection pool with relay discovery to efficiently manage connections to relay nodes. It automatically maintains a specified number of connections to the best available relays.

```rust
use darkswap_p2p::{
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig},
    relay_discovery::RelayDiscoveryConfig,
    connection_pool::ConnectionPoolConfig,
};
use libp2p::PeerId;
use std::{sync::Arc, time::Duration};

// Create configurations
let relay_discovery_config = RelayDiscoveryConfig::default();
let connection_pool_config = ConnectionPoolConfig::default();

// Create relay connection pool configuration
let relay_pool_config = RelayConnectionPoolConfig {
    connection_pool_config,
    relay_discovery_config,
    max_relay_connections: 3,
    min_relay_connections: 1,
    connection_check_interval: Duration::from_secs(60),
    auto_connect: true,
};

// Create relay connection pool
let relay_pool = RelayConnectionPool::new(
    relay_pool_config,
    local_peer_id,
    signaling_client,
);

// Start the relay connection pool
relay_pool.start().await?;

// Connect to a peer through a relay
let connection = relay_pool.connect_via_relay(&peer_id).await?;

// Connect to the best available relay
let relay_connection = relay_pool.connect_to_best_relay().await?;

// Check and maintain relay connections
relay_pool.check_connections().await?;

// Get relay connection status
let status = relay_pool.get_relay_status(&peer_id);
println!("Relay status: {:?}", status);

// Get connection statistics
let stats = relay_pool.get_connection_stats();
println!("Connected relays: {}", relay_pool.connected_relay_count());
```

## Authentication and Authorization

The authentication module provides functionality for authenticating and authorizing peers in the P2P network, with a focus on relay nodes. It supports multiple authentication methods, including shared key, challenge-response, and public key authentication.

```rust
use darkswap_p2p::{
    auth::{AuthManager, AuthManagerConfig, AuthMethod, AuthorizationLevel},
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig},
};
use std::{collections::HashSet, time::Duration};

// Create a set of trusted peers
let mut trusted_peers = HashSet::new();
trusted_peers.insert(trusted_peer_id);

// Create a set of banned peers
let mut banned_peers = HashSet::new();
banned_peers.insert(banned_peer_id);

// Create authentication configuration
let auth_config = AuthManagerConfig {
    auth_method: AuthMethod::SharedKey,
    shared_key: Some(b"secret-key".to_vec()),
    token_ttl: Duration::from_secs(3600),
    challenge_ttl: Duration::from_secs(60),
    trusted_peers,
    banned_peers,
    default_auth_level: AuthorizationLevel::Basic,
    require_auth: true,
};

// Create relay connection pool configuration with authentication
let relay_pool_config = RelayConnectionPoolConfig {
    // ... other configuration ...
    auth_config: Some(auth_config),
    require_relay_auth: true,
    min_relay_auth_level: AuthorizationLevel::Relay,
};

// Create relay connection pool
let relay_pool = RelayConnectionPool::new(
    relay_pool_config,
    local_peer_id,
    signaling_client,
);

// Generate a challenge for a relay
let challenge = relay_pool.generate_relay_challenge(&relay_id).await?;

// Verify a challenge response
relay_pool.verify_relay_challenge_response(&relay_id, &response).await?;

// Authenticate a relay with a token
relay_pool.authenticate_relay(&relay_id, &token).await?;
```

The authentication system supports the following features:

- **Multiple Authentication Methods**: Shared key, challenge-response, and public key authentication
- **Authorization Levels**: Different levels of authorization for different peers
- **Trusted Peers**: Automatically authorize trusted peers
- **Banned Peers**: Automatically reject banned peers
- **Token-Based Authentication**: Generate and validate authentication tokens
- **Challenge-Response Authentication**: Generate challenges and verify responses
- **Automatic Token Expiration**: Tokens and challenges automatically expire after a configurable TTL

## End-to-End Encryption

The encryption module provides functionality for secure end-to-end encrypted communication between peers in the P2P network. It supports multiple encryption algorithms and key exchange methods, with a focus on forward secrecy and ephemeral keys.

```rust
use darkswap_p2p::{
    encryption::{EncryptionConfig, EncryptionManager, KeyExchangeAlgorithm, EncryptionAlgorithm},
};
use libp2p::PeerId;
use std::time::Duration;

// Create encryption configuration
let config = EncryptionConfig {
    key_exchange_algorithm: KeyExchangeAlgorithm::X25519,
    encryption_algorithm: EncryptionAlgorithm::AesGcm256,
    key_rotation_interval: Duration::from_secs(3600),
    use_forward_secrecy: true,
    use_ephemeral_keys: true,
};

// Create encryption managers for Alice and Bob
let alice_encryption_manager = EncryptionManager::new(config.clone())?;
let bob_encryption_manager = EncryptionManager::new(config)?;

// Generate ephemeral key pairs
let alice_public_key = alice_encryption_manager.generate_ephemeral_key_pair(&bob_id)?;
let bob_public_key = bob_encryption_manager.generate_ephemeral_key_pair(&alice_id)?;

// Perform key exchange
alice_encryption_manager.perform_key_exchange(&bob_id, &bob_public_key)?;
bob_encryption_manager.perform_key_exchange(&alice_id, &alice_public_key)?;

// Alice encrypts a message for Bob
let plaintext = b"Hello, Bob! This is a secret message from Alice.";
let ciphertext = alice_encryption_manager.encrypt(&bob_id, plaintext)?;

// Bob decrypts the message from Alice
let decrypted = bob_encryption_manager.decrypt(&alice_id, &ciphertext)?;
assert_eq!(plaintext, decrypted.as_slice());

// Rotate keys periodically
alice_encryption_manager.rotate_keys()?;
bob_encryption_manager.rotate_keys()?;

// Prune expired keys
alice_encryption_manager.prune_expired_keys();
bob_encryption_manager.prune_expired_keys();
```

The encryption system supports the following features:

- **Multiple Encryption Algorithms**: AES-GCM-256 and ChaCha20-Poly1305
- **Key Exchange**: X25519 key exchange for secure key agreement
- **Forward Secrecy**: Ensures that session keys will not be compromised even if long-term keys are compromised
- **Ephemeral Keys**: Uses short-lived keys for enhanced security
- **Key Rotation**: Automatically rotates keys at configurable intervals
- **Session Management**: Manages encryption sessions for multiple peers
- **Automatic Key Expiration**: Keys automatically expire after a configurable TTL

## Metrics and Monitoring

The metrics module provides functionality for collecting and reporting metrics about the P2P network, including connection statistics, relay performance, and network health. The metrics are compatible with Prometheus and can be easily integrated with Grafana for visualization.

```rust
use darkswap_p2p::{
    metrics::{MetricsRegistry, P2PMetrics},
    relay_connection_pool::RelayConnectionPool,
};
use std::{sync::Arc, time::Duration};

// Create P2P metrics with a 1-second update interval
let mut metrics = P2PMetrics::new(Duration::from_secs(1));

// Set the relay pool to collect metrics from
metrics.set_relay_pool(relay_pool);

// Record connection events
metrics.record_connection_attempt();
metrics.record_connection_success(50); // 50ms latency
metrics.record_connection_failure();

// Update metrics
metrics.update_metrics();

// Get metrics registry
let registry = metrics.registry();

// Get a specific metric
let connection_attempts = registry.get_metric("p2p_connection_attempts");

// Get all metrics
let all_metrics = registry.get_metrics();

// Get metrics in Prometheus format
let prometheus_metrics = metrics.get_prometheus_metrics();

// In a real application, you would expose these metrics via HTTP
// For example, using warp:
let metrics_clone = metrics.clone();
let metrics_route = warp::path("metrics").map(move || {
    let prometheus_metrics = metrics_clone.get_prometheus_metrics();
    warp::reply::with_header(
        prometheus_metrics,
        "content-type",
        "text/plain; version=0.0.4",
    )
});
```

The following metrics are collected:

- **p2p_connections_total**: Total number of connections in the pool
- **p2p_connections_active**: Number of active connections
- **p2p_connections_idle**: Number of idle connections
- **p2p_connection_attempts**: Number of connection attempts
- **p2p_connection_successes**: Number of successful connections
- **p2p_connection_failures**: Number of failed connections
- **p2p_relay_connections**: Number of relay connections
- **p2p_connection_latency_ms**: Connection latency in milliseconds
- **p2p_relay_score**: Score for each relay

## Examples

The following examples are included:

- **webrtc_example.rs**: Demonstrates how to use the WebRTC transport for peer-to-peer communication
- **signaling_server.rs**: A simple WebRTC signaling server
- **simple_node.rs**: A simple P2P node using the Network API
- **connection_pool_example.rs**: Demonstrates how to use the connection pool for efficient connection management
- **relay_connection_example.rs**: Shows how to use the relay connection pool for NAT traversal
- **auth_relay_example.rs**: Demonstrates how to use authentication with relay connections
- **encryption_example.rs**: Shows how to use end-to-end encryption between peers
- **metrics_example.rs**: Demonstrates how to use the metrics system for monitoring
- **metrics_server.rs**: Runs a Prometheus-compatible metrics server

To run an example:

```bash
# Run the signaling server
cargo run --example signaling_server

# In another terminal, run the WebRTC example
cargo run --example webrtc_example ws://localhost:9001/signaling <peer-id>

# Or run the connection pool example
cargo run --example connection_pool_example

# Or run the relay connection example
cargo run --example relay_connection_example

# Or run the metrics example
cargo run --example metrics_example

# Or run the metrics server (requires warp)
cargo run --example metrics_server

# Or run the authenticated relay example
cargo run --example auth_relay_example

# Or run the encryption example
cargo run --example encryption_example
```

### Prometheus Integration

The metrics server example provides a Prometheus-compatible HTTP endpoint that can be scraped by Prometheus. To use it with Prometheus, add the following to your `prometheus.yml` file:

```yaml
scrape_configs:
  - job_name: 'darkswap-p2p'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']
```

Then start Prometheus with:

```bash
prometheus --config.file=prometheus.yml
```

You can then view the metrics in the Prometheus web UI at http://localhost:9090.

### Grafana Dashboard

To visualize the metrics in Grafana, you can create a dashboard with the following panels:

1. **Connection Pool Stats**:
   - Total connections
   - Active connections
   - Idle connections

2. **Connection Performance**:
   - Connection attempts
   - Connection successes
   - Connection failures
   - Success rate (calculated as successes / attempts)

3. **Connection Latency**:
   - Average connection latency
   - Connection latency histogram

4. **Relay Stats**:
   - Connected relays
   - Relay scores

Example Grafana query for connection success rate:
```
sum(rate(p2p_connection_successes[5m])) / sum(rate(p2p_connection_attempts[5m]))
```

A complete Grafana dashboard configuration is provided in `examples/grafana-dashboard.json`. To use it:

1. Start Prometheus and configure it to scrape the metrics server
2. Start Grafana and configure it to use Prometheus as a data source
3. Import the dashboard by going to Dashboards > Import and pasting the contents of `examples/grafana-dashboard.json`

The dashboard includes the following panels:
- Connection Pool Stats
- Connection Performance
- Connection Success Rate
- Connection Latency
- Relay Connections
- Relay Scores

![Grafana Dashboard](https://example.com/darkswap-p2p-dashboard.png)

### Prometheus Alerts

The `examples/prometheus-alerts.yml` file contains a set of alerting rules for Prometheus that can be used to monitor the P2P network. To use it, add the following to your `prometheus.yml` file:

```yaml
rule_files:
  - 'prometheus-alerts.yml'
```

The alerts include:

- **LowConnectionSuccessRate**: Triggers when the connection success rate drops below 80% for 5 minutes
- **HighConnectionLatency**: Triggers when the 90th percentile connection latency is above 500ms for 5 minutes
- **NoConnectedRelays**: Triggers when there are no connected relays for 5 minutes
- **LowRelayConnections**: Triggers when there are fewer than 2 connected relays for 5 minutes
- **HighConnectionFailureRate**: Triggers when the connection failure rate is above 20% for 5 minutes
- **TooManyActiveConnections**: Triggers when there are more than 100 active connections for 5 minutes
- **LowIdleConnections**: Triggers when there are fewer than 10 idle connections for 5 minutes
- **LowRelayScore**: Triggers when a relay's score drops below 50 for 5 minutes

You can customize these alerts to suit your specific requirements by modifying the thresholds and durations.
See the `examples` directory for more examples of how to use this crate.