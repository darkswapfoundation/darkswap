//! Server implementation for the DarkSwap Relay Server
//!
//! This module provides the main server implementation for the DarkSwap Relay Server.
//! It ties together the WebRTC manager, circuit relay manager, and signaling server.

use crate::{
    config::Config,
    error::Error,
    signaling::SignalingServer,
    circuit_relay::{CircuitRelayManager, CircuitRelayEvent},
    webrtc::{WebRtcManager, WebRtcTransportEvent},
    metrics::MetricsServer,
    utils,
    Result,
};
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;
use tracing::{debug, error, info, warn};

/// Server for the DarkSwap Relay
pub struct Server {
    /// Configuration
    config: Config,
    
    /// WebRTC manager
    webrtc_manager: Arc<WebRtcManager>,
    
    /// Circuit relay manager
    circuit_manager: Arc<CircuitRelayManager>,
    
    /// Signaling server
    signaling_server: SignalingServer,
    
    /// Metrics server (optional)
    metrics_server: Option<MetricsServer>,
}

impl Server {
    /// Create a new server
    pub fn new(config: Config) -> Result<Self> {
        // Create channels for communication between components
        let (webrtc_tx, webrtc_rx) = mpsc::channel(100);
        let (circuit_tx, circuit_rx) = mpsc::channel(100);
        let (signaling_tx, signaling_rx) = mpsc::channel(100);
        
        // Create WebRTC manager
        let webrtc_manager = Arc::new(WebRtcManager::new(
            config.clone(),
            webrtc_tx,
            circuit_rx,
        )?);
        
        // Create circuit relay manager
        let circuit_manager = Arc::new(CircuitRelayManager::new(
            config.clone(),
            circuit_tx,
            webrtc_rx,
        )?);
        
        // Create signaling server
        let signaling_server = SignalingServer::new(
            config.clone(),
            signaling_tx,
            signaling_rx,
            webrtc_manager.clone(),
            circuit_manager.clone(),
        )?;
        
        // Create metrics server if enabled
        let metrics_server = if config.enable_metrics {
            Some(MetricsServer::new(
                config.clone(),
                webrtc_manager.clone(),
                circuit_manager.clone(),
            )?)
        } else {
            None
        };
        
        Ok(Self {
            config,
            webrtc_manager,
            circuit_manager,
            signaling_server,
            metrics_server,
        })
    }
    
    /// Start the server
    pub async fn start(self) -> Result<()> {
        info!("Starting DarkSwap Relay Server v{}", crate::VERSION);
        
        // Start the WebRTC manager
        let webrtc_handle = {
            let mut manager = self.webrtc_manager.clone();
            tokio::spawn(async move {
                if let Err(e) = manager.run().await {
                    error!("WebRTC manager error: {}", e);
                }
            })
        };
        
        // Start the circuit relay manager
        let circuit_handle = {
            let mut manager = self.circuit_manager.clone();
            tokio::spawn(async move {
                if let Err(e) = manager.run().await {
                    error!("Circuit relay manager error: {}", e);
                }
            })
        };
        
        // Start the signaling server
        let signaling_handle = {
            let server = self.signaling_server;
            tokio::spawn(async move {
                if let Err(e) = server.run().await {
                    error!("Signaling server error: {}", e);
                }
            })
        };
        
        // Start the metrics server if enabled
        let metrics_handle = if let Some(metrics_server) = self.metrics_server {
            let handle = tokio::spawn(async move {
                if let Err(e) = metrics_server.run().await {
                    error!("Metrics server error: {}", e);
                }
            });
            Some(handle)
        } else {
            None
        };
        
        // Wait for all components to finish
        let mut handles: Vec<JoinHandle<()>> = vec![
            webrtc_handle,
            circuit_handle,
            signaling_handle,
        ];
        
        if let Some(handle) = metrics_handle {
            handles.push(handle);
        }
        
        // Wait for any component to finish (which likely means an error occurred)
        // Wait for all components to finish
        let results = tokio::join!(
            handles[0],
            handles[1],
            handles[2],
            async { if let Some(handle) = metrics_handle { Some(handle.await) } else { None } },
        );

        // Check for errors
        results.0.expect("WebRTC manager task failed");
        results.1.expect("Circuit relay manager task failed");
        results.2.expect("Signaling server task failed");
        if let Some(metrics_result) = results.3 {
            metrics_result.expect("Metrics server task failed");
        }
        
        info!("DarkSwap Relay Server stopped");
        
        Ok(())
    }
    
    /// Get the WebRTC manager
    pub fn webrtc_manager(&self) -> Arc<WebRtcManager> {
        self.webrtc_manager.clone()
    }
    
    /// Get the circuit relay manager
    pub fn circuit_manager(&self) -> Arc<CircuitRelayManager> {
        self.circuit_manager.clone()
    }
    
    /// Get the configuration
    pub fn config(&self) -> &Config {
        &self.config
    }
}

/// Create a new server with default configuration
pub async fn create_server() -> Result<Server> {
    let config = Config::default();
    Server::new(config)
}

/// Create a new server from a configuration file
pub async fn create_server_from_file(path: &str) -> Result<Server> {
    let config = Config::from_file(path)?;
    Server::new(config)
}

/// Run a server with default configuration
pub async fn run_server() -> Result<()> {
    let server = create_server().await?;
    server.start().await
}

/// Run a server from a configuration file
pub async fn run_server_from_file(path: &str) -> Result<()> {
    let server = create_server_from_file(path).await?;
    server.start().await
}