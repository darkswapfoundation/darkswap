//! Metrics server for the DarkSwap Relay Server
//!
//! This module provides a metrics server for the DarkSwap Relay Server.
//! It exposes metrics in Prometheus format for monitoring.

use crate::{
    config::Config,
    error::Error,
    webrtc::WebRtcManager,
    circuit_relay::CircuitRelayManager,
    Result,
};
use prometheus::{
    Counter, Gauge, Histogram, HistogramOpts, IntCounter, IntCounterVec, IntGauge, IntGaugeVec,
    Opts, Registry,
};
use std::sync::Arc;
use tokio::time::Duration;
use warp::Filter;
use tracing::{debug, error, info, warn};

/// Metrics server
pub struct MetricsServer {
    /// Configuration
    config: Config,
    /// Registry
    registry: Registry,
    /// WebRTC manager
    webrtc_manager: Arc<WebRtcManager>,
    /// Circuit relay manager
    circuit_manager: Arc<CircuitRelayManager>,
    
    // WebRTC metrics
    /// Number of WebRTC connections
    webrtc_connections: IntGauge,
    /// Number of WebRTC peers
    webrtc_peers: IntGauge,
    /// Number of WebRTC data channels
    webrtc_data_channels: IntGauge,
    /// WebRTC connection errors
    webrtc_connection_errors: IntCounter,
    /// WebRTC data channel errors
    webrtc_data_channel_errors: IntCounter,
    /// WebRTC bytes sent
    webrtc_bytes_sent: IntCounter,
    /// WebRTC bytes received
    webrtc_bytes_received: IntCounter,
    
    // Circuit relay metrics
    /// Number of circuits
    circuits: IntGauge,
    /// Number of circuit reservations
    circuit_reservations: IntGauge,
    /// Number of circuit peers
    circuit_peers: IntGauge,
    /// Circuit creation errors
    circuit_creation_errors: IntCounter,
    /// Circuit bytes sent
    circuit_bytes_sent: IntCounter,
    /// Circuit bytes received
    circuit_bytes_received: IntCounter,
    
    // Signaling metrics
    /// Number of connected peers
    connected_peers: IntGauge,
    /// Number of signaling messages
    signaling_messages: IntCounterVec,
    /// Signaling errors
    signaling_errors: IntCounter,
}

impl MetricsServer {
    /// Create a new metrics server
    pub fn new(
        config: Config,
        webrtc_manager: Arc<WebRtcManager>,
        circuit_manager: Arc<CircuitRelayManager>,
    ) -> Result<Self> {
        // Create registry
        let registry = Registry::new();
        
        // Create WebRTC metrics
        let webrtc_connections = IntGauge::new("webrtc_connections", "Number of WebRTC connections")?;
        let webrtc_peers = IntGauge::new("webrtc_peers", "Number of WebRTC peers")?;
        let webrtc_data_channels = IntGauge::new("webrtc_data_channels", "Number of WebRTC data channels")?;
        let webrtc_connection_errors = IntCounter::new("webrtc_connection_errors", "WebRTC connection errors")?;
        let webrtc_data_channel_errors = IntCounter::new("webrtc_data_channel_errors", "WebRTC data channel errors")?;
        let webrtc_bytes_sent = IntCounter::new("webrtc_bytes_sent", "WebRTC bytes sent")?;
        let webrtc_bytes_received = IntCounter::new("webrtc_bytes_received", "WebRTC bytes received")?;
        
        // Create circuit relay metrics
        let circuits = IntGauge::new("circuits", "Number of circuits")?;
        let circuit_reservations = IntGauge::new("circuit_reservations", "Number of circuit reservations")?;
        let circuit_peers = IntGauge::new("circuit_peers", "Number of circuit peers")?;
        let circuit_creation_errors = IntCounter::new("circuit_creation_errors", "Circuit creation errors")?;
        let circuit_bytes_sent = IntCounter::new("circuit_bytes_sent", "Circuit bytes sent")?;
        let circuit_bytes_received = IntCounter::new("circuit_bytes_received", "Circuit bytes received")?;
        
        // Create signaling metrics
        let connected_peers = IntGauge::new("connected_peers", "Number of connected peers")?;
        let signaling_messages = IntCounterVec::new(
            Opts::new("signaling_messages", "Signaling messages"),
            &["type"],
        )?;
        let signaling_errors = IntCounter::new("signaling_errors", "Signaling errors")?;
        
        // Register metrics
        registry.register(Box::new(webrtc_connections.clone()))?;
        registry.register(Box::new(webrtc_peers.clone()))?;
        registry.register(Box::new(webrtc_data_channels.clone()))?;
        registry.register(Box::new(webrtc_connection_errors.clone()))?;
        registry.register(Box::new(webrtc_data_channel_errors.clone()))?;
        registry.register(Box::new(webrtc_bytes_sent.clone()))?;
        registry.register(Box::new(webrtc_bytes_received.clone()))?;
        
        registry.register(Box::new(circuits.clone()))?;
        registry.register(Box::new(circuit_reservations.clone()))?;
        registry.register(Box::new(circuit_peers.clone()))?;
        registry.register(Box::new(circuit_creation_errors.clone()))?;
        registry.register(Box::new(circuit_bytes_sent.clone()))?;
        registry.register(Box::new(circuit_bytes_received.clone()))?;
        
        registry.register(Box::new(connected_peers.clone()))?;
        registry.register(Box::new(signaling_messages.clone()))?;
        registry.register(Box::new(signaling_errors.clone()))?;
        
        Ok(Self {
            config,
            registry,
            webrtc_manager,
            circuit_manager,
            webrtc_connections,
            webrtc_peers,
            webrtc_data_channels,
            webrtc_connection_errors,
            webrtc_data_channel_errors,
            webrtc_bytes_sent,
            webrtc_bytes_received,
            circuits,
            circuit_reservations,
            circuit_peers,
            circuit_creation_errors,
            circuit_bytes_sent,
            circuit_bytes_received,
            connected_peers,
            signaling_messages,
            signaling_errors,
        })
    }
    
    /// Run the metrics server
    pub async fn run(self) -> Result<()> {
        // Get address
        let addr = self.config.metrics_address().parse()?;
        
        // Create routes
        let registry = self.registry.clone();
        let metrics_route = warp::path("metrics").map(move || {
            let encoder = prometheus::TextEncoder::new();
            let metric_families = registry.gather();
            let mut buffer = Vec::new();
            encoder.encode(&metric_families, &mut buffer).unwrap();
            String::from_utf8(buffer).unwrap()
        });
        
        // Start the server
        info!("Starting metrics server on {}", addr);
        
        // Spawn a task to update metrics
        let webrtc_manager = self.webrtc_manager.clone();
        let circuit_manager = self.circuit_manager.clone();
        let webrtc_connections = self.webrtc_connections.clone();
        let webrtc_peers = self.webrtc_peers.clone();
        let circuits = self.circuits.clone();
        let circuit_reservations = self.circuit_reservations.clone();
        let circuit_peers = self.circuit_peers.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(1));
            
            loop {
                interval.tick().await;
                
                // Update WebRTC metrics
                let (webrtc_conn_count, webrtc_peer_count) = webrtc_manager.get_metrics();
                webrtc_connections.set(webrtc_conn_count as i64);
                webrtc_peers.set(webrtc_peer_count as i64);
                
                // Update circuit relay metrics
                let (circuit_count, reservation_count, peer_count) = circuit_manager.get_metrics();
                circuits.set(circuit_count as i64);
                circuit_reservations.set(reservation_count as i64);
                circuit_peers.set(peer_count as i64);
            }
        });
        
        // Start the server
        warp::serve(metrics_route).run(addr).await;
        
        Ok(())
    }
    
    /// Increment WebRTC connection errors
    pub fn increment_webrtc_connection_errors(&self) {
        self.webrtc_connection_errors.inc();
    }
    
    /// Increment WebRTC data channel errors
    pub fn increment_webrtc_data_channel_errors(&self) {
        self.webrtc_data_channel_errors.inc();
    }
    
    /// Add WebRTC bytes sent
    pub fn add_webrtc_bytes_sent(&self, bytes: u64) {
        self.webrtc_bytes_sent.inc_by(bytes);
    }
    
    /// Add WebRTC bytes received
    pub fn add_webrtc_bytes_received(&self, bytes: u64) {
        self.webrtc_bytes_received.inc_by(bytes);
    }
    
    /// Increment circuit creation errors
    pub fn increment_circuit_creation_errors(&self) {
        self.circuit_creation_errors.inc();
    }
    
    /// Add circuit bytes sent
    pub fn add_circuit_bytes_sent(&self, bytes: u64) {
        self.circuit_bytes_sent.inc_by(bytes);
    }
    
    /// Add circuit bytes received
    pub fn add_circuit_bytes_received(&self, bytes: u64) {
        self.circuit_bytes_received.inc_by(bytes);
    }
    
    /// Set connected peers
    pub fn set_connected_peers(&self, count: usize) {
        self.connected_peers.set(count as i64);
    }
    
    /// Increment signaling messages
    pub fn increment_signaling_messages(&self, message_type: &str) {
        self.signaling_messages.with_label_values(&[message_type]).inc();
    }
    
    /// Increment signaling errors
    pub fn increment_signaling_errors(&self) {
        self.signaling_errors.inc();
    }
}