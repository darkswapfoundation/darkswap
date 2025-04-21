use darkswap_p2p::{
    connection_pool::{ConnectionPool, ConnectionPoolConfig},
    metrics::{MetricsRegistry, P2PMetrics},
    relay_connection_pool::{RelayConnectionPool, RelayConnectionPoolConfig},
    relay_discovery::RelayDiscoveryConfig,
    webrtc_signaling_client::WebRtcSignalingClient,
};
use libp2p::PeerId;
use std::{
    convert::Infallible,
    net::SocketAddr,
    sync::Arc,
    time::Duration,
};
use tokio::time;
use warp::Filter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    println!("Starting P2P metrics server");
    
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
    let metrics = Arc::new(P2PMetrics::new(Duration::from_secs(1)));
    
    // Set the relay pool
    metrics.set_relay_pool(relay_pool.clone());
    
    // Simulate some initial activity
    metrics.record_connection_attempt();
    metrics.record_connection_success(50);
    metrics.record_connection_failure();
    
    // Update metrics
    metrics.update_metrics();
    
    // Create a background task to simulate network activity
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;
            
            // Simulate some network activity
            metrics_clone.record_connection_attempt();
            
            if rand::random::<bool>() {
                // Simulate a successful connection with random latency
                let latency = rand::random::<u64>() % 500;
                metrics_clone.record_connection_success(latency);
            } else {
                // Simulate a failed connection
                metrics_clone.record_connection_failure();
            }
            
            // Update metrics
            metrics_clone.update_metrics();
        }
    });
    
    // Create the metrics endpoint
    let metrics_route = {
        let metrics = metrics.clone();
        warp::path("metrics").map(move || {
            let prometheus_metrics = metrics.get_prometheus_metrics();
            warp::reply::with_header(
                prometheus_metrics,
                "content-type",
                "text/plain; version=0.0.4",
            )
        })
    };
    
    // Create the root endpoint
    let root_route = warp::path::end().map(|| {
        warp::reply::html(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <title>DarkSwap P2P Metrics</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        line-height: 1.6;
                    }
                    h1 {
                        color: #333;
                    }
                    a {
                        color: #0066cc;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .metrics-link {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 10px 15px;
                        background-color: #0066cc;
                        color: white;
                        border-radius: 4px;
                    }
                    .metrics-link:hover {
                        background-color: #0052a3;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>DarkSwap P2P Metrics</h1>
                    <p>This server exposes metrics for the DarkSwap P2P network.</p>
                    <p>The metrics are compatible with Prometheus and can be scraped at the <code>/metrics</code> endpoint.</p>
                    <a href="/metrics" class="metrics-link">View Metrics</a>
                    
                    <h2>Prometheus Configuration</h2>
                    <p>Add the following to your <code>prometheus.yml</code> file:</p>
                    <pre>
scrape_configs:
  - job_name: 'darkswap-p2p'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']
                    </pre>
                </div>
            </body>
            </html>
            "#
        )
    });
    
    // Combine the routes
    let routes = root_route.or(metrics_route);
    
    // Start the server
    let addr = ([127, 0, 0, 1], 9090).into();
    println!("Starting metrics server at http://localhost:9090");
    println!("Metrics available at http://localhost:9090/metrics");
    
    warp::serve(routes).run(addr).await;
    
    Ok(())
}

// Allow cloning P2PMetrics for the example
impl Clone for P2PMetrics {
    fn clone(&self) -> Self {
        Self {
            registry: self.registry.clone(),
            relay_pool: self.relay_pool.clone(),
            last_update: std::sync::Mutex::new(*self.last_update.lock().unwrap()),
            update_interval: self.update_interval,
        }
    }
}