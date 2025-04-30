//! WebRTC connection implementation
//!
//! This module provides a WebRTC connection implementation for the WebRTC transport.
//! It handles the actual WebRTC connection establishment and data channel management.

use crate::error::Error;
use crate::webrtc_signaling_client::WebRtcSignalingClient;
use futures::{
    channel::mpsc::{self, Receiver, Sender},
    SinkExt, StreamExt,
};
use libp2p::PeerId;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

/// WebRTC connection
pub struct WebRtcConnection {
    /// Peer ID
    pub peer_id: PeerId,
    /// Data channels
    pub data_channels: HashMap<String, DataChannel>,
    /// Connection state
    pub state: ConnectionState,
    /// ICE connection state
    pub ice_connection_state: IceConnectionState,
    /// Signaling state
    pub signaling_state: SignalingState,
}

/// WebRTC data channel
pub struct DataChannel {
    /// Label
    pub label: String,
    /// Whether the channel is ordered
    pub ordered: bool,
    /// Sender for outgoing data
    pub sender: Sender<Vec<u8>>,
    /// Receiver for incoming data
    pub receiver: Receiver<Vec<u8>>,
    /// Channel state
    pub state: DataChannelState,
}

/// WebRTC connection state
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConnectionState {
    /// New connection
    New,
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Disconnected
    Disconnected,
    /// Failed
    Failed,
    /// Closed
    Closed,
}

/// WebRTC ICE connection state
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum IceConnectionState {
    /// New connection
    New,
    /// Checking
    Checking,
    /// Connected
    Connected,
    /// Completed
    Completed,
    /// Failed
    Failed,
    /// Disconnected
    Disconnected,
    /// Closed
    Closed,
}

/// WebRTC signaling state
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SignalingState {
    /// Stable
    Stable,
    /// Have local offer
    HaveLocalOffer,
    /// Have remote offer
    HaveRemoteOffer,
    /// Have local pranswer
    HaveLocalPranswer,
    /// Have remote pranswer
    HaveRemotePranswer,
    /// Closed
    Closed,
}

/// WebRTC data channel state
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DataChannelState {
    /// Connecting
    Connecting,
    /// Open
    Open,
    /// Closing
    Closing,
    /// Closed
    Closed,
}

impl DataChannel {
    /// Create a new data channel
    pub fn new(label: String, ordered: bool) -> Self {
        let (tx1, rx1) = mpsc::channel(10);
        let (tx2, rx2) = mpsc::channel(10);
        
        DataChannel {
            label,
            ordered,
            sender: tx1,
            receiver: rx2,
            state: DataChannelState::Connecting,
        }
    }
    
    /// Send data through the channel
    pub async fn send(&mut self, data: Vec<u8>) -> Result<(), std::io::Error> {
        if self.state != DataChannelState::Open {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotConnected,
                "Data channel is not open",
            ));
        }
        
        self.sender.send(data).await
            .map_err(|_| std::io::Error::new(std::io::ErrorKind::BrokenPipe, "Channel closed"))
    }
    
    /// Receive data from the channel
    pub async fn receive(&mut self) -> Result<Vec<u8>, std::io::Error> {
        if self.state != DataChannelState::Open {
            return Err(std::io::Error::new(
                std::io::ErrorKind::NotConnected,
                "Data channel is not open",
            ));
        }
        
        self.receiver.next().await
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::BrokenPipe, "Channel closed"))
    }
    
    /// Close the data channel
    pub async fn close(&mut self) -> Result<(), std::io::Error> {
        self.state = DataChannelState::Closing;
        
        // In a real implementation, this would close the WebRTC data channel
        
        self.state = DataChannelState::Closed;
        
        Ok(())
    }
}

/// WebRTC connection manager
pub struct WebRtcConnectionManager {
    /// Local peer ID
    local_peer_id: PeerId,
    /// WebRTC signaling client
    signaling_client: Arc<WebRtcSignalingClient>,
    /// Connection pool
    connection_pool: Arc<crate::connection_pool::ConnectionPool>,
    /// ICE servers
    ice_servers: Vec<String>,
}

impl WebRtcConnectionManager {
    /// Create a new WebRTC connection manager
    pub fn new(local_peer_id: PeerId, signaling_client: Arc<WebRtcSignalingClient>) -> Self {
        // Create a default connection pool configuration
        let pool_config = crate::connection_pool::ConnectionPoolConfig::default();
        
        // Create the connection pool
        let connection_pool = Arc::new(crate::connection_pool::ConnectionPool::new(pool_config));
        
        WebRtcConnectionManager {
            local_peer_id,
            signaling_client,
            connection_pool,
            ice_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
        }
    }
    
    /// Create a new WebRTC connection manager with a custom connection pool
    pub fn with_connection_pool(
        local_peer_id: PeerId,
        signaling_client: Arc<WebRtcSignalingClient>,
        connection_pool: Arc<crate::connection_pool::ConnectionPool>
    ) -> Self {
        WebRtcConnectionManager {
            local_peer_id,
            signaling_client,
            connection_pool,
            ice_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
        }
    }
    
    /// Add an ICE server
    pub fn add_ice_server(&mut self, server: String) {
        self.ice_servers.push(server);
    }
    
    /// Create a connection to a peer
    pub async fn create_connection(&self, peer_id: &PeerId) -> Result<WebRtcConnection, Error> {
        // Check if we already have a connection to this peer in the pool
        if let Some(connection) = self.connection_pool.get(peer_id) {
            // We found a reusable connection in the pool
            return Ok(connection.as_ref().clone());
        }
        
        // Create a new connection
        let mut connection = WebRtcConnection {
            peer_id: peer_id.clone(),
            data_channels: HashMap::new(),
            state: ConnectionState::New,
            ice_connection_state: IceConnectionState::New,
            signaling_state: SignalingState::Stable,
        };
        
        // Create a data channel
        let data_channel = DataChannel::new("data".to_string(), true);
        connection.data_channels.insert("data".to_string(), data_channel);
        
        // Update the connection state
        connection.state = ConnectionState::Connecting;
        
        // Create an offer
        let offer = self.signaling_client.create_offer(peer_id).await?;
        
        // Update the signaling state
        connection.signaling_state = SignalingState::HaveLocalOffer;
        
        // Wait for the connection to be established
        self.signaling_client.wait_for_connection(peer_id).await?;
        
        // Update the connection state
        connection.state = ConnectionState::Connected;
        connection.ice_connection_state = IceConnectionState::Connected;
        connection.signaling_state = SignalingState::Stable;
        
        // Update the data channel state
        for (_, data_channel) in connection.data_channels.iter_mut() {
            data_channel.state = DataChannelState::Open;
        }
        
        // Add the connection to the pool
        self.connection_pool.add(peer_id.clone(), connection.clone());
        
        Ok(connection)
    }
    
    /// Accept a connection from a peer
    pub async fn accept_connection(&self, peer_id: &PeerId, offer: &str) -> Result<WebRtcConnection, Error> {
        // Check if we already have a connection to this peer in the pool
        if let Some(connection) = self.connection_pool.get(peer_id) {
            // We found a reusable connection in the pool
            return Ok(connection.as_ref().clone());
        }
        
        // Create a new connection
        let mut connection = WebRtcConnection {
            peer_id: peer_id.clone(),
            data_channels: HashMap::new(),
            state: ConnectionState::New,
            ice_connection_state: IceConnectionState::New,
            signaling_state: SignalingState::HaveRemoteOffer,
        };
        
        // Create a data channel
        let data_channel = DataChannel::new("data".to_string(), true);
        connection.data_channels.insert("data".to_string(), data_channel);
        
        // Update the connection state
        connection.state = ConnectionState::Connecting;
        
        // Create an answer
        let answer = format!("v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE data\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:dummy\r\na=ice-pwd:dummy\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:data\r\na=sctp-port:5000\r\n");
        
        // Send the answer
        self.signaling_client.signaling_client().send_answer(&peer_id.to_string(), &answer).await?;
        
        // Update the signaling state
        connection.signaling_state = SignalingState::Stable;
        
        // Wait for the connection to be established
        self.signaling_client.wait_for_connection(peer_id).await?;
        
        // Update the connection state
        connection.state = ConnectionState::Connected;
        connection.ice_connection_state = IceConnectionState::Connected;
        
        // Update the data channel state
        for (_, data_channel) in connection.data_channels.iter_mut() {
            data_channel.state = DataChannelState::Open;
        }
        
        // Add the connection to the pool
        self.connection_pool.add(peer_id.clone(), connection.clone());
        
        Ok(connection)
    }
    
    /// Close a connection
    pub async fn close_connection(&self, peer_id: &PeerId) -> Result<(), Error> {
        // Get the connection from the pool
        if let Some(connection_arc) = self.connection_pool.get(peer_id) {
            // Clone the connection to work with it
            let mut connection = connection_arc.as_ref().clone();
            
            // Close all data channels
            for (_, mut data_channel) in connection.data_channels.drain() {
                data_channel.close().await.map_err(|e| Error::WebSocketError(e.to_string()))?;
            }
            
            // Update the connection state
            connection.state = ConnectionState::Closed;
            connection.ice_connection_state = IceConnectionState::Closed;
            connection.signaling_state = SignalingState::Closed;
            
            // Remove the connection from the pool
            self.connection_pool.remove(peer_id);
            
            Ok(())
        } else {
            Err(Error::PeerNotFound(peer_id.to_string()))
        }
    }
    
    /// Get a connection
    pub fn get_connection(&self, peer_id: &PeerId) -> Option<WebRtcConnection> {
        self.connection_pool.get(peer_id).map(|conn| conn.as_ref().clone())
    }
    
    /// Get all connections
    pub fn get_connections(&self) -> Vec<WebRtcConnection> {
        // This is a bit inefficient as we're cloning all connections,
        // but it maintains the same API as before
        let stats = self.connection_pool.stats();
        let mut connections = Vec::with_capacity(stats.total_connections);
        
        // We don't have a direct way to get all connections from the pool,
        // so we'll just return an empty vector for now
        // In a real implementation, we would add a method to the connection pool
        // to get all connections
        
        connections
    }
    
    /// Get connection pool statistics
    pub fn get_connection_stats(&self) -> crate::connection_pool::ConnectionPoolStats {
        self.connection_pool.stats()
    }
    
    /// Release a connection back to the pool
    pub fn release_connection(&self, peer_id: &PeerId) {
        self.connection_pool.release(peer_id);
    }
    
    /// Prune the connection pool
    pub fn prune_connections(&self) {
        self.connection_pool.prune();
    }
}

impl Clone for WebRtcConnection {
    fn clone(&self) -> Self {
        // Create a new connection with the same peer ID and state
        let mut connection = WebRtcConnection {
            peer_id: self.peer_id.clone(),
            data_channels: HashMap::new(),
            state: self.state.clone(),
            ice_connection_state: self.ice_connection_state.clone(),
            signaling_state: self.signaling_state.clone(),
        };
        
        // Clone the data channels
        for (label, data_channel) in &self.data_channels {
            let new_data_channel = DataChannel::new(label.clone(), data_channel.ordered);
            connection.data_channels.insert(label.clone(), new_data_channel);
        }
        
        connection
    }
}

impl WebRtcConnection {
    /// Create a new mock connection for testing
    #[cfg(test)]
    pub fn new_mock() -> Self {
        let peer_id = PeerId::random();
        let mut connection = WebRtcConnection {
            peer_id,
            data_channels: HashMap::new(),
            state: ConnectionState::Connected,
            ice_connection_state: IceConnectionState::Connected,
            signaling_state: SignalingState::Stable,
        };
        
        // Create a data channel
        let data_channel = DataChannel::new("data".to_string(), true);
        connection.data_channels.insert("data".to_string(), data_channel);
        
        connection
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_data_channel() {
        // Create a data channel
        let mut data_channel = DataChannel::new("test".to_string(), true);
        
        // Set the state to open
        data_channel.state = DataChannelState::Open;
        
        // Send data
        data_channel.send(b"Hello, world!".to_vec()).await.unwrap();
        
        // Receive data
        let data = data_channel.receive().await.unwrap();
        assert_eq!(data, b"Hello, world!");
    }
}