//! Configuration for the DarkSwap Relay Server
//!
//! This module provides configuration functionality for the relay server.

use crate::{
    error::Error,
    Result,
};
use serde::{Deserialize, Serialize};
use std::{
    fs::File,
    io::Read,
    path::Path,
    time::Duration,
};
use tracing::{debug, error, info, warn};

/// STUN server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StunServer {
    /// URL
    pub url: String,
}

/// TURN server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurnServer {
    /// URL
    pub url: String,
    /// Username
    pub username: String,
    /// Credential
    pub credential: String,
}

/// WebRTC configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRtcConfig {
    /// STUN servers
    #[serde(default)]
    pub stun_servers: Vec<String>,
    /// TURN servers
    #[serde(default)]
    pub turn_servers: Vec<TurnServer>,
    /// ICE gathering timeout in seconds
    #[serde(default = "default_ice_gathering_timeout")]
    pub ice_gathering_timeout: u64,
    /// Connection establishment timeout in seconds
    #[serde(default = "default_connection_establishment_timeout")]
    pub connection_establishment_timeout: u64,
    /// Data channel establishment timeout in seconds
    #[serde(default = "default_data_channel_establishment_timeout")]
    pub data_channel_establishment_timeout: u64,
}

/// Network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Listen address
    #[serde(default = "default_listen_address")]
    pub listen_address: String,
    /// Signaling port
    #[serde(default = "default_signaling_port")]
    pub signaling_port: u16,
    /// WebRTC port
    #[serde(default = "default_webrtc_port")]
    pub webrtc_port: u16,
    /// Metrics port
    #[serde(default = "default_metrics_port")]
    pub metrics_port: u16,
    /// External address
    #[serde(default)]
    pub external_address: Option<String>,
}

/// Security configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// TLS certificate path
    pub cert_path: Option<String>,
    /// TLS key path
    pub key_path: Option<String>,
    /// Peer timeout in seconds
    #[serde(default = "default_peer_timeout")]
    pub peer_timeout: u64,
    /// Connection timeout in seconds
    #[serde(default = "default_connection_timeout")]
    pub connection_timeout: u64,
}

/// Relay configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayConfig {
    /// Maximum circuit duration in seconds
    #[serde(default = "default_max_circuit_duration")]
    pub max_circuit_duration: u64,
    /// Maximum circuit bytes
    #[serde(default = "default_max_circuit_bytes")]
    pub max_circuit_bytes: u64,
    /// Maximum circuits
    #[serde(default = "default_max_circuits")]
    pub max_circuits: u64,
    /// Maximum circuits per peer
    #[serde(default = "default_max_circuits_per_peer")]
    pub max_circuits_per_peer: u64,
    /// Maximum bandwidth per circuit in bytes per second
    #[serde(default = "default_max_bandwidth_per_circuit")]
    pub max_bandwidth_per_circuit: u64,
    /// Reservation duration in seconds
    #[serde(default = "default_reservation_duration")]
    pub reservation_duration: u64,
    /// Circuit cleanup interval in seconds
    #[serde(default = "default_circuit_cleanup_interval")]
    pub circuit_cleanup_interval: u64,
    /// Reservation cleanup interval in seconds
    #[serde(default = "default_reservation_cleanup_interval")]
    pub reservation_cleanup_interval: u64,
}

/// Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// WebRTC configuration
    #[serde(default)]
    pub webrtc: WebRtcConfig,
    /// Network configuration
    #[serde(default)]
    pub network: NetworkConfig,
    /// Security configuration
    #[serde(default)]
    pub security: SecurityConfig,
    /// Relay configuration
    #[serde(default)]
    pub relay: RelayConfig,
    /// Enable metrics
    #[serde(default = "default_enable_metrics")]
    pub enable_metrics: bool,
}

impl Default for WebRtcConfig {
    fn default() -> Self {
        Self {
            stun_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
            turn_servers: Vec::new(),
            ice_gathering_timeout: default_ice_gathering_timeout(),
            connection_establishment_timeout: default_connection_establishment_timeout(),
            data_channel_establishment_timeout: default_data_channel_establishment_timeout(),
        }
    }
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_address: default_listen_address(),
            signaling_port: default_signaling_port(),
            webrtc_port: default_webrtc_port(),
            metrics_port: default_metrics_port(),
            external_address: None,
        }
    }
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            cert_path: None,
            key_path: None,
            peer_timeout: default_peer_timeout(),
            connection_timeout: default_connection_timeout(),
        }
    }
}

impl Default for RelayConfig {
    fn default() -> Self {
        Self {
            max_circuit_duration: default_max_circuit_duration(),
            max_circuit_bytes: default_max_circuit_bytes(),
            max_circuits: default_max_circuits(),
            max_circuits_per_peer: default_max_circuits_per_peer(),
            max_bandwidth_per_circuit: default_max_bandwidth_per_circuit(),
            reservation_duration: default_reservation_duration(),
            circuit_cleanup_interval: default_circuit_cleanup_interval(),
            reservation_cleanup_interval: default_reservation_cleanup_interval(),
        }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            webrtc: WebRtcConfig::default(),
            network: NetworkConfig::default(),
            security: SecurityConfig::default(),
            relay: RelayConfig::default(),
            enable_metrics: default_enable_metrics(),
        }
    }
}

impl Config {
    /// Load configuration from a file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        // Open the file
        let mut file = File::open(path)?;
        
        // Read the file
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        
        // Parse the file
        let config: Config = toml::from_str(&contents)?;
        
        Ok(config)
    }
    
    /// Get the signaling address
    pub fn signaling_address(&self) -> String {
        format!("{}:{}", self.network.listen_address, self.network.signaling_port)
    }
    
    /// Get the WebRTC address
    pub fn webrtc_address(&self) -> String {
        format!("{}:{}", self.network.listen_address, self.network.webrtc_port)
    }
    
    /// Get the metrics address
    pub fn metrics_address(&self) -> String {
        format!("{}:{}", self.network.listen_address, self.network.metrics_port)
    }
    
    /// Get the external address
    pub fn external_address(&self) -> Option<String> {
        self.network.external_address.clone()
    }
    
    /// Get the connection timeout
    pub fn connection_timeout(&self) -> Duration {
        Duration::from_secs(self.security.connection_timeout)
    }
    
    /// Get the maximum circuit duration
    pub fn max_circuit_duration(&self) -> Duration {
        Duration::from_secs(self.relay.max_circuit_duration)
    }
    
    /// Get the maximum circuits per peer
    pub fn max_circuits_per_peer(&self) -> usize {
        self.relay.max_circuits_per_peer as usize
    }
    
    /// Get the reservation duration
    pub fn reservation_duration(&self) -> Duration {
        Duration::from_secs(self.relay.reservation_duration)
    }
    
    /// Get the circuit cleanup interval
    pub fn circuit_cleanup_interval(&self) -> Duration {
        Duration::from_secs(self.relay.circuit_cleanup_interval)
    }
    
    /// Get the reservation cleanup interval
    pub fn reservation_cleanup_interval(&self) -> Duration {
        Duration::from_secs(self.relay.reservation_cleanup_interval)
    }
}

// Default values
fn default_listen_address() -> String {
    "0.0.0.0".to_string()
}

fn default_signaling_port() -> u16 {
    9002
}

fn default_webrtc_port() -> u16 {
    9003
}

fn default_metrics_port() -> u16 {
    9090
}

fn default_peer_timeout() -> u64 {
    300
}

fn default_connection_timeout() -> u64 {
    60
}

fn default_ice_gathering_timeout() -> u64 {
    10
}

fn default_connection_establishment_timeout() -> u64 {
    30
}

fn default_data_channel_establishment_timeout() -> u64 {
    10
}

fn default_max_circuit_duration() -> u64 {
    3600
}

fn default_max_circuit_bytes() -> u64 {
    10 * 1024 * 1024
}

fn default_max_circuits() -> u64 {
    1000
}

fn default_max_circuits_per_peer() -> u64 {
    10
}

fn default_max_bandwidth_per_circuit() -> u64 {
    1024 * 1024
}

fn default_reservation_duration() -> u64 {
    3600
}

fn default_circuit_cleanup_interval() -> u64 {
    60
}

fn default_reservation_cleanup_interval() -> u64 {
    300
}

fn default_enable_metrics() -> bool {
    true
}