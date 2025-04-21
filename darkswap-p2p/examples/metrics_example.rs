use darkswap_p2p::{
    connection_pool::{ConnectionPool, ConnectionPoolConfig},
    metrics::{MetricsRegistry, P2PMetrics},
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig},
    relay_discovery::RelayDiscoveryConfig,
    webrtc_signaling_client::WebRtcSignalingClient,
};
use libp2p::PeerId;
use std::{sync::Arc, time::Duration};
use tokio::time;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting P2P metrics example");
    
    // Create a local peer ID
    let local_peer_id = PeerId::random();
    println!("Local peer ID: {}", local_peer_id);
    
    // Create a WebRTC signaling client
    let signaling_client = Arc::new(WebRtcSignalingClient::new(local_peer_id.clone()));
    
    // Connect to the signaling server
    println!("Connecting to signaling server...");
    signaling_client.connect("ws://localhost:9001/signaling").await?;
    println!("Connected to signaling server");
    
    // Create a connection pool configuration
    let pool_config = ConnectionPoolConfig {
        max_connections: 10,
        ttl: Duration::from_secs(60),
        max_age: Duration::from_secs(3600),
        enable_reuse: true,
    };
    
    // Create a connection pool
    let connection_pool = Arc::new(ConnectionPool::new(pool_config));
    
    // Create some test relay peer IDs and addresses
    let relay_id1 = PeerId::random();
    let relay_id2 = PeerId::random();
    
    let relay_addr1 = "/ip4/127.0.0.1/tcp/9002".parse()?;
    let relay_addr2 = "/ip4/127.0.0.1/tcp/9003".parse()?;
    
    // Create relay discovery configuration
    let relay_discovery_config = RelayDiscoveryConfig {
        bootstrap_relays: vec![
            (relay_id1.clone(), relay_addr1.clone()),
            (relay_id2.clone(), relay_addr2.clone()),
        ],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create relay connection pool configuration
    let relay_pool_config = RelayConnectionPoolConfig {
        connection_pool_config: pool_config,
        relay_discovery_config,
        max_relay_connections: 3,
        min_relay_connections: 1,
        connection_check_interval: Duration::from_secs(10),
        auto_connect: false, // Disable auto-connect for testing
    };
    
    // Create relay connection pool
    let relay_pool = Arc::new(RelayConnectionPool::new(
        relay_pool_config,
        local_peer_id.clone(),
        signaling_client,
    ));
    
    // Start the relay connection pool
    relay_pool.start().await?;
    
    // Create P2P metrics
    let mut metrics = P2PMetrics::new(Duration::from_secs(1));
    
    // Set the relay pool
    metrics.set_relay_pool(relay_pool.clone());
    
    // Simulate some activity
    println!("Simulating P2P network activity...");
    
    // Record connection attempts
    metrics.record_connection_attempt();
    metrics.record_connection_attempt();
    metrics.record_connection_attempt();
    
    // Record successful connections with different latencies
    metrics.record_connection_success(50);
    metrics.record_connection_success(150);
    
    // Record a failed connection
    metrics.record_connection_failure();
    
    // Update metrics
    metrics.update_metrics();
    
    // Get metrics registry
    let registry = metrics.registry();
    
    // Print metrics
    println!("P2P Metrics:");
    
    // Get connection attempts
    if let Some(metric) = registry.get_metric("p2p_connection_attempts") {
        println!("Connection attempts: {:?}", metric.value);
    }
    
    // Get connection successes
    if let Some(metric) = registry.get_metric("p2p_connection_successes") {
        println!("Connection successes: {:?}", metric.value);
    }
    
    // Get connection failures
    if let Some(metric) = registry.get_metric("p2p_connection_failures") {
        println!("Connection failures: {:?}", metric.value);
    }
    
    // Get connection latency
    if let Some(metric) = registry.get_metric("p2p_connection_latency_ms") {
        println!("Connection latency: {:?}", metric.value);
    }
    
    // Get Prometheus metrics
    println!("\nPrometheus Metrics:");
    println!("{}", metrics.get_prometheus_metrics());
    
    // Simulate a metrics server
    println!("\nStarting metrics server...");
    println!("Metrics available at http://localhost:9090/metrics");
    
    // In a real implementation, we would start a web server to serve the metrics
    // For this example, we'll just update the metrics periodically
    
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            metrics_clone.update_metrics();
            println!("\nUpdated metrics:");
            println!("{}", metrics_clone.get_prometheus_metrics());
        }
    });
    
    // Wait for user input to exit
    println!("\nPress Enter to exit...");
    let mut input = String::new();
    std::io::stdin().read_line(&mut input)?;
    
    println!("Metrics example completed");
    
    Ok(())
}

// Allow cloning P2PMetrics for the example
impl Clone for P2PMetrics {
    fn clone(&self) -> Self {
        Self {
            registry: self.registry.clone(),
            relay_pool: self.relay_pool.clone(),
            last_update: Mutex::new(*self.last_update.lock().unwrap()),
            update_interval: self.update_interval,
        }
    }
}