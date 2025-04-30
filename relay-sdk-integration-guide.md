# Relay Server and SDK Integration Guide

This document provides detailed guidance for integrating the DarkSwap Relay Server with the DarkSwap SDK, enabling reliable peer-to-peer connections even when peers are behind NATs.

## Architecture Overview

The integration between the relay server and SDK consists of several key components:

1. **Relay Server**: Provides WebRTC signaling and circuit relay functionality
2. **SDK Relay Manager**: Manages connections to relay servers and handles relay circuits
3. **WebRTC Transport**: Establishes direct WebRTC connections when possible
4. **Circuit Relay**: Handles data transfer through relay circuits when direct connections fail

```
┌─────────────────┐                 ┌─────────────────┐
│                 │                 │                 │
│  DarkSwap SDK   │◄───WebRTC───────►  DarkSwap SDK   │
│    (Peer A)     │                 │    (Peer B)     │
│                 │                 │                 │
└────────┬────────┘                 └────────┬────────┘
         │                                   │
         │                                   │
         │                                   │
         │         ┌─────────────┐           │
         │         │             │           │
         └─────────►Relay Server ◄───────────┘
                   │             │
                   └─────────────┘
```

## Integration Components

### 1. Relay Manager in SDK

The `RelayManager` class in the SDK is responsible for:

- Connecting to relay servers
- Establishing relay circuits between peers
- Sending and receiving data through relay connections
- Handling reconnection and error recovery

```rust
pub struct RelayManager {
    config: RelayManagerConfig,
    connections: Arc<RwLock<HashMap<String, RelayConnection>>>,
    webrtc_transport: Arc<WebRtcTransport>,
    circuit_relay: Arc<CircuitRelay>,
    peer_id: PeerId,
    event_sender: mpsc::Sender<RelayEvent>,
    event_receiver: mpsc::Receiver<RelayEvent>,
}
```

### 2. Relay Server Components

The relay server provides:

- **Signaling Server**: WebSocket-based signaling for WebRTC connection establishment
- **Circuit Relay**: Relay functionality for peers that can't connect directly
- **Authentication**: JWT-based authentication for secure peer identification
- **Rate Limiting**: Protection against DoS attacks and resource abuse

### 3. P2P Network Integration

The `P2PNetwork` class integrates with the relay manager:

```rust
pub struct P2PNetwork {
    local_peer_id: PeerId,
    webrtc_transport: Option<Arc<DarkSwapWebRtcTransport>>,
    webrtc_signaling: Option<WebRtcSignalingClient>,
    circuit_relay: Option<Arc<CircuitRelay>>,
    relay_manager: Option<RelayManager>,
    connected_peers: Arc<Mutex<HashMap<PeerId, Multiaddr>>>,
    event_sender: mpsc::Sender<Event>,
    listen_addresses: Vec<Multiaddr>,
    bootstrap_peers: Vec<Multiaddr>,
    relay_servers: Vec<Multiaddr>,
    topics: HashMap<String, String>,
}
```

## Integration Steps

### 1. Configure Relay Servers

Add relay servers to the SDK configuration:

```rust
// In config.rs
pub struct Config {
    pub p2p: P2PConfig,
    // ...
}

pub struct P2PConfig {
    pub relay_servers: Vec<Multiaddr>,
    // ...
}
```

Example configuration:

```rust
let mut config = Config::default();
config.p2p.relay_servers.push(
    "/ip4/127.0.0.1/tcp/9002/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
        .parse::<Multiaddr>()
        .unwrap(),
);
```

### 2. Initialize Relay Manager

Initialize the relay manager in the P2PNetwork start method:

```rust
// In p2p/mod.rs
pub async fn start(&mut self) -> Result<()> {
    // Create WebRTC transport
    let webrtc_transport = DarkSwapWebRtcTransport::new(
        ice_servers,
        signaling_server_url.clone(),
    ).await?;
    
    let webrtc_transport = Arc::new(webrtc_transport);
    self.webrtc_transport = Some(webrtc_transport.clone());

    // Create circuit relay
    let circuit_relay = CircuitRelay::new(
        webrtc_transport.clone(),
        self.local_peer_id,
    );
    
    let circuit_relay = Arc::new(circuit_relay);
    self.circuit_relay = Some(circuit_relay.clone());
    
    // Create relay manager
    let mut relay_servers = Vec::new();
    
    // Convert relay server multiaddrs to relay server configs
    for addr in &self.relay_servers {
        if let Some(peer_id) = Self::extract_peer_id(addr) {
            // Extract the host and port from the multiaddr
            let mut host = String::new();
            let mut port = 9002; // Default signaling port
            
            for proto in addr.iter() {
                match proto {
                    Protocol::Ip4(ip) => host = ip.to_string(),
                    Protocol::Ip6(ip) => host = ip.to_string(),
                    Protocol::Dns(domain) => host = domain.to_string(),
                    Protocol::Dns4(domain) => host = domain.to_string(),
                    Protocol::Dns6(domain) => host = domain.to_string(),
                    Protocol::Tcp(p) => port = p,
                    _ => {}
                }
            }
            
            // Create the relay server URL
            let url = format!("ws://{}:{}/signaling", host, port);
            
            // Create the relay server config
            let server = RelayServer {
                id: peer_id.to_string(),
                url,
                status: RelayServerStatus::Unknown,
                last_ping: None,
                latency_ms: None,
            };
            
            relay_servers.push(server);
        }
    }
    
    // Create the relay manager config
    let relay_config = RelayManagerConfig {
        servers: relay_servers,
        connection_timeout: 30,
        ping_interval: 30,
        reconnect_interval: 5,
        max_reconnect_attempts: 5,
    };
    
    // Create the relay manager
    let mut relay_manager = RelayManager::new(
        relay_config,
        webrtc_transport.clone(),
        circuit_relay.clone(),
        self.local_peer_id,
    );
    
    // Start the relay manager
    tokio::spawn(async move {
        if let Err(e) = relay_manager.start().await {
            error!("Failed to start relay manager: {:?}", e);
        }
    });
    
    self.relay_manager = Some(relay_manager);

    // Process events
    self.process_events().await?;

    Ok(())
}
```

### 3. Implement Connection Methods

Add methods to the P2PNetwork class for relay connections:

```rust
/// Connect to a peer via relay
pub async fn connect_via_relay(&mut self, peer_id: PeerId) -> Result<String> {
    // Check if we have a relay manager
    if let Some(relay_manager) = &self.relay_manager {
        // Connect to the peer via relay
        let relay_id = relay_manager.connect_to_peer(&peer_id).await?;
        
        info!("Connected to peer {} via relay (ID: {})", peer_id, relay_id);
        
        Ok(relay_id)
    } else {
        Err(anyhow::anyhow!("Relay manager not initialized"))
    }
}

/// Send data to a peer via relay
pub async fn send_via_relay(&mut self, peer_id: PeerId, relay_id: &str, data: Vec<u8>) -> Result<()> {
    // Check if we have a relay manager
    if let Some(relay_manager) = &self.relay_manager {
        // Send data to the peer via relay
        relay_manager.send_data(&peer_id, relay_id, &data).await?;
        
        debug!("Sent data to peer {} via relay: {} bytes", peer_id, data.len());
        
        Ok(())
    } else {
        Err(anyhow::anyhow!("Relay manager not initialized"))
    }
}

/// Close a relay connection
pub async fn close_relay(&mut self, relay_id: &str) -> Result<()> {
    // Check if we have a relay manager
    if let Some(relay_manager) = &self.relay_manager {
        // Close the relay connection
        relay_manager.close_relay(relay_id).await?;
        
        info!("Closed relay connection: {}", relay_id);
        
        Ok(())
    } else {
        Err(anyhow::anyhow!("Relay manager not initialized"))
    }
}
```

### 4. Implement Automatic Fallback

Add automatic fallback to relay when direct connections fail:

```rust
/// Connect to a peer
pub async fn connect_to_peer(&mut self, peer_id: PeerId) -> Result<()> {
    // Try direct connection first
    match self.connect_direct(peer_id).await {
        Ok(_) => {
            info!("Connected to peer {} directly", peer_id);
            Ok(())
        }
        Err(e) => {
            warn!("Failed to connect directly to peer {}: {:?}", peer_id, e);
            
            // Fall back to relay
            info!("Falling back to relay for peer {}", peer_id);
            self.connect_via_relay(peer_id).await?;
            
            Ok(())
        }
    }
}
```

### 5. Implement Connection Pool

Create a connection pool for efficient connection management:

```rust
/// Connection pool
pub struct ConnectionPool {
    /// Direct connections
    direct_connections: HashMap<PeerId, Arc<WebRtcConnection>>,
    /// Relay connections
    relay_connections: HashMap<PeerId, (String, Arc<RelayConnection>)>,
    /// Connection timeout
    connection_timeout: Duration,
    /// Maximum connections
    max_connections: usize,
    /// Last activity times
    last_activity: HashMap<PeerId, Instant>,
}

impl ConnectionPool {
    /// Create a new connection pool
    pub fn new(connection_timeout: Duration, max_connections: usize) -> Self {
        Self {
            direct_connections: HashMap::new(),
            relay_connections: HashMap::new(),
            connection_timeout,
            max_connections,
            last_activity: HashMap::new(),
        }
    }
    
    /// Get a connection to a peer
    pub fn get_connection(&mut self, peer_id: &PeerId) -> Option<Connection> {
        // Update last activity time
        self.last_activity.insert(*peer_id, Instant::now());
        
        // Try direct connection first
        if let Some(conn) = self.direct_connections.get(peer_id) {
            return Some(Connection::Direct(conn.clone()));
        }
        
        // Fall back to relay connection
        if let Some((relay_id, conn)) = self.relay_connections.get(peer_id) {
            return Some(Connection::Relay(relay_id.clone(), conn.clone()));
        }
        
        None
    }
    
    /// Add a direct connection
    pub fn add_direct_connection(&mut self, peer_id: PeerId, connection: Arc<WebRtcConnection>) {
        // Update last activity time
        self.last_activity.insert(peer_id, Instant::now());
        
        // Add the connection
        self.direct_connections.insert(peer_id, connection);
        
        // Remove any relay connection to the same peer
        self.relay_connections.remove(&peer_id);
        
        // Prune old connections if needed
        self.prune_connections();
    }
    
    /// Add a relay connection
    pub fn add_relay_connection(&mut self, peer_id: PeerId, relay_id: String, connection: Arc<RelayConnection>) {
        // Update last activity time
        self.last_activity.insert(peer_id, Instant::now());
        
        // Add the connection
        self.relay_connections.insert(peer_id, (relay_id, connection));
        
        // Prune old connections if needed
        self.prune_connections();
    }
    
    /// Prune old connections
    fn prune_connections(&mut self) {
        // Check if we need to prune
        if self.direct_connections.len() + self.relay_connections.len() <= self.max_connections {
            return;
        }
        
        // Get the current time
        let now = Instant::now();
        
        // Find connections to prune
        let mut to_prune = Vec::new();
        
        for (peer_id, last_activity) in &self.last_activity {
            if now.duration_since(*last_activity) > self.connection_timeout {
                to_prune.push(*peer_id);
            }
        }
        
        // Prune connections
        for peer_id in to_prune {
            self.direct_connections.remove(&peer_id);
            self.relay_connections.remove(&peer_id);
            self.last_activity.remove(&peer_id);
        }
    }
}
```

### 6. Implement Connection Metrics

Add metrics for connection quality and performance:

```rust
/// Connection metrics
pub struct ConnectionMetrics {
    /// Round-trip time in milliseconds
    pub rtt_ms: u64,
    /// Packet loss percentage
    pub packet_loss: f64,
    /// Bytes sent
    pub bytes_sent: u64,
    /// Bytes received
    pub bytes_received: u64,
    /// Connection type
    pub connection_type: ConnectionType,
    /// Last activity time
    pub last_activity: Instant,
}

/// Connection type
pub enum ConnectionType {
    /// Direct WebRTC connection
    Direct,
    /// Relay connection
    Relay(String),
}

impl ConnectionMetrics {
    /// Create new connection metrics
    pub fn new(connection_type: ConnectionType) -> Self {
        Self {
            rtt_ms: 0,
            packet_loss: 0.0,
            bytes_sent: 0,
            bytes_received: 0,
            connection_type,
            last_activity: Instant::now(),
        }
    }
    
    /// Update round-trip time
    pub fn update_rtt(&mut self, rtt_ms: u64) {
        self.rtt_ms = rtt_ms;
        self.last_activity = Instant::now();
    }
    
    /// Update packet loss
    pub fn update_packet_loss(&mut self, packet_loss: f64) {
        self.packet_loss = packet_loss;
        self.last_activity = Instant::now();
    }
    
    /// Add bytes sent
    pub fn add_bytes_sent(&mut self, bytes: u64) {
        self.bytes_sent += bytes;
        self.last_activity = Instant::now();
    }
    
    /// Add bytes received
    pub fn add_bytes_received(&mut self, bytes: u64) {
        self.bytes_received += bytes;
        self.last_activity = Instant::now();
    }
}
```

## Testing the Integration

### 1. Unit Tests

Create unit tests for the relay manager:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_relay_manager_creation() {
        // Create a mock WebRTC transport
        let webrtc_transport = Arc::new(MockWebRtcTransport::new());
        
        // Create a mock circuit relay
        let circuit_relay = Arc::new(MockCircuitRelay::new());
        
        // Create a peer ID
        let peer_id = PeerId::random();
        
        // Create a relay server
        let server = RelayServer {
            id: "test-server".to_string(),
            url: "ws://localhost:9002/signaling".to_string(),
            status: RelayServerStatus::Unknown,
            last_ping: None,
            latency_ms: None,
        };
        
        // Create a relay manager config
        let config = RelayManagerConfig {
            servers: vec![server],
            connection_timeout: 30,
            ping_interval: 30,
            reconnect_interval: 5,
            max_reconnect_attempts: 5,
        };
        
        // Create a relay manager
        let relay_manager = RelayManager::new(
            config,
            webrtc_transport,
            circuit_relay,
            peer_id,
        );
        
        // Check that the relay manager was created successfully
        assert_eq!(relay_manager.config.servers.len(), 1);
        assert_eq!(relay_manager.config.servers[0].id, "test-server");
    }
    
    #[tokio::test]
    async fn test_connect_to_peer() {
        // Create a mock relay manager
        let mut relay_manager = create_mock_relay_manager();
        
        // Create a peer ID
        let peer_id = PeerId::random();
        
        // Connect to the peer
        let result = relay_manager.connect_to_peer(&peer_id).await;
        
        // Check that the connection was successful
        assert!(result.is_ok());
        let relay_id = result.unwrap();
        assert!(!relay_id.is_empty());
    }
    
    #[tokio::test]
    async fn test_send_data() {
        // Create a mock relay manager
        let mut relay_manager = create_mock_relay_manager();
        
        // Create a peer ID
        let peer_id = PeerId::random();
        
        // Connect to the peer
        let relay_id = relay_manager.connect_to_peer(&peer_id).await.unwrap();
        
        // Send data
        let data = b"Hello, world!".to_vec();
        let result = relay_manager.send_data(&peer_id, &relay_id, &data).await;
        
        // Check that the data was sent successfully
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_close_relay() {
        // Create a mock relay manager
        let mut relay_manager = create_mock_relay_manager();
        
        // Create a peer ID
        let peer_id = PeerId::random();
        
        // Connect to the peer
        let relay_id = relay_manager.connect_to_peer(&peer_id).await.unwrap();
        
        // Close the relay
        let result = relay_manager.close_relay(&relay_id).await;
        
        // Check that the relay was closed successfully
        assert!(result.is_ok());
    }
    
    // Helper function to create a mock relay manager
    fn create_mock_relay_manager() -> RelayManager {
        // Create a mock WebRTC transport
        let webrtc_transport = Arc::new(MockWebRtcTransport::new());
        
        // Create a mock circuit relay
        let circuit_relay = Arc::new(MockCircuitRelay::new());
        
        // Create a peer ID
        let peer_id = PeerId::random();
        
        // Create a relay server
        let server = RelayServer {
            id: "test-server".to_string(),
            url: "ws://localhost:9002/signaling".to_string(),
            status: RelayServerStatus::Unknown,
            last_ping: None,
            latency_ms: None,
        };
        
        // Create a relay manager config
        let config = RelayManagerConfig {
            servers: vec![server],
            connection_timeout: 30,
            ping_interval: 30,
            reconnect_interval: 5,
            max_reconnect_attempts: 5,
        };
        
        // Create a relay manager
        RelayManager::new(
            config,
            webrtc_transport,
            circuit_relay,
            peer_id,
        )
    }
}
```

### 2. Integration Tests

Create integration tests for the P2PNetwork with relay:

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_p2p_network_with_relay() {
        // Create a config with a relay server
        let mut config = Config::default();
        config.p2p.relay_servers.push(
            "/ip4/127.0.0.1/tcp/9002/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
                .parse::<Multiaddr>()
                .unwrap(),
        );
        
        // Create event channels
        let (tx1, mut rx1) = mpsc::channel(100);
        let (tx2, mut rx2) = mpsc::channel(100);
        
        // Create P2P networks
        let mut network1 = P2PNetwork::new(&config, tx1).unwrap();
        let mut network2 = P2PNetwork::new(&config, tx2).unwrap();
        
        // Start the networks
        network1.start().await.unwrap();
        network2.start().await.unwrap();
        
        // Get peer IDs
        let peer_id1 = network1.local_peer_id();
        let peer_id2 = network2.local_peer_id();
        
        // Connect via relay
        let relay_id = network1.connect_via_relay(peer_id2).await.unwrap();
        
        // Send data
        let data = b"Hello, world!".to_vec();
        network1.send_via_relay(peer_id2, &relay_id, data.clone()).await.unwrap();
        
        // Wait for the data to be received
        let mut received = false;
        while let Some(event) = rx2.recv().await {
            if let Event::P2P(P2PEvent::DataReceived { from, data: received_data }) = event {
                if from == peer_id1 && received_data == data {
                    received = true;
                    break;
                }
            }
        }
        
        // Check that the data was received
        assert!(received);
        
        // Close the relay connection
        network1.close_relay(&relay_id).await.unwrap();
        
        // Stop the networks
        network1.stop().await.unwrap();
        network2.stop().await.unwrap();
    }
}
```

## Common Issues and Solutions

### 1. Connection Failures

**Issue**: WebRTC connections fail to establish between peers.

**Solution**:
- Ensure STUN/TURN servers are correctly configured
- Verify that signaling messages are being exchanged properly
- Check for firewall or NAT issues
- Implement proper error handling and retry logic

### 2. Authentication Errors

**Issue**: Authentication fails when connecting to the relay server.

**Solution**:
- Verify that JWT tokens are being generated correctly
- Check that the relay server has the correct public key for validation
- Ensure token expiration times are reasonable
- Implement token refresh mechanism

### 3. Performance Issues

**Issue**: Relay connections have high latency or low throughput.

**Solution**:
- Implement connection pooling to reuse connections
- Add connection quality monitoring
- Implement circuit prioritization based on performance
- Use multiple relay servers for redundancy

### 4. Security Concerns

**Issue**: Potential security vulnerabilities in relay connections.

**Solution**:
- Implement proper authentication and authorization
- Add rate limiting to prevent DoS attacks
- Use secure WebSocket connections (WSS)
- Implement request signature validation

## Best Practices

1. **Error Handling**: Implement robust error handling for all network operations
2. **Reconnection Logic**: Add automatic reconnection for failed connections
3. **Fallback Mechanism**: Implement automatic fallback to relay when direct connections fail
4. **Monitoring**: Add comprehensive metrics for connection quality and performance
5. **Testing**: Create thorough unit and integration tests for all components
6. **Documentation**: Document all public APIs and protocols
7. **Security**: Implement proper authentication, authorization, and rate limiting

## Next Steps

1. Complete the implementation of the connection pool
2. Add automatic fallback to relay when direct connections fail
3. Implement connection quality monitoring
4. Create comprehensive tests for the integration
5. Add detailed metrics for monitoring
6. Document the integration API and protocols