//! WebRTC transport implementation for rust-libp2p
//!
//! This module provides a WebRTC transport implementation for rust-libp2p,
//! allowing for browser-to-browser communication.
//!
//! This implementation uses the signaling server for WebRTC connection establishment.

use crate::error::Error;
use crate::signaling_client::{SignalingClient, SignalingEvent};
use crate::webrtc_signaling_client::WebRtcSignalingClient;
use crate::webrtc_connection::{WebRtcConnection, WebRtcConnectionManager, DataChannel};
use futures::{
    channel::mpsc,
    prelude::*,
    ready,
};
use libp2p::core::{
    connection::{ConnectionId, ConnectedPoint},
    transport::{ListenerId, Transport, TransportError, TransportEvent},
    Multiaddr, PeerId,
};
use std::{
    collections::HashMap,
    pin::Pin,
    task::{Context, Poll},
};

/// Data Channel
pub struct DataChannel {
    /// Label
    pub label: String,
    /// Ordered
    pub ordered: bool,
    /// Sender
    pub sender: mpsc::Sender<Vec<u8>>,
    /// Receiver
    pub receiver: mpsc::Receiver<Vec<u8>>,
}

impl DataChannel {
    /// Create a new data channel
    pub fn new(label: String, ordered: bool) -> Self {
        let (tx1, rx1) = mpsc::channel(100);
        let (tx2, rx2) = mpsc::channel(100);
        
        DataChannel {
            label,
            ordered,
            sender: tx1,
            receiver: rx2,
        }
    }

    /// Send data through the channel
    pub async fn send(&mut self, data: Vec<u8>) -> Result<(), std::io::Error> {
        self.sender.send(data).await
            .map_err(|_| std::io::Error::new(std::io::ErrorKind::BrokenPipe, "Channel closed"))
    }

    /// Receive data from the channel
    pub async fn receive(&mut self) -> Result<Vec<u8>, std::io::Error> {
        self.receiver.next().await
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::BrokenPipe, "Channel closed"))
    }
}

/// WebRTC transport implementation
pub struct WebRtcTransport {
    /// Local peer ID
    local_peer_id: PeerId,
    /// Listeners
    listeners: HashMap<ListenerId, mpsc::Sender<TransportEvent<WebRtcUpgrade, std::io::Error>>>,
    /// Next listener ID
    next_listener_id: ListenerId,
    /// Pending dials
    pending_dials: HashMap<PeerId, WebRtcDial>,
    /// ICE servers
    ice_servers: Vec<String>,
    /// Signaling client
    signaling_client: Option<SignalingClient>,
    /// WebRTC signaling client
    webrtc_signaling_client: Option<Arc<WebRtcSignalingClient>>,
    /// WebRTC connection manager
    webrtc_connection_manager: Option<Arc<WebRtcConnectionManager>>,
    /// Signaling server URL
    signaling_server_url: Option<String>,
}
/// WebRTC upgrade
pub struct WebRtcUpgrade {
    /// Peer ID
    peer_id: PeerId,
    /// SDP offer
    offer: Option<String>,
    /// ICE candidates
    ice_candidates: Vec<String>,
    /// Result sender
    result_sender: Option<mpsc::Sender<Result<WebRtcConnection, std::io::Error>>>,
    /// Result receiver
    result_receiver: Option<mpsc::Receiver<Result<WebRtcConnection, std::io::Error>>>,
}

impl Future for WebRtcUpgrade {
    type Output = Result<WebRtcConnection, std::io::Error>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // If we have a result receiver, poll it
        if let Some(receiver) = &mut self.result_receiver {
            match ready!(receiver.poll_next_unpin(cx)) {
                Some(Ok(connection)) => Poll::Ready(Ok(connection)),
                Some(Err(e)) => Poll::Ready(Err(e)),
                None => Poll::Ready(Err(std::io::Error::new(
                    std::io::ErrorKind::BrokenPipe,
                    "Connection closed",
                ))),
            }
        } else {
            // Create a new connection
            let data_channel = DataChannel::new("data".to_string(), true);
            let connection = WebRtcConnection {
                peer_id: self.peer_id.clone(),
                data_channels: HashMap::from([("data".to_string(), data_channel)]),
            };
            
            Poll::Ready(Ok(connection))
        }
    }
}

/// WebRTC dial
pub struct WebRtcDial {
    /// Peer ID
    peer_id: PeerId,
    /// SDP offer
    offer: Option<String>,
    /// ICE candidates
    ice_candidates: Vec<String>,
    /// Result sender
    result_sender: mpsc::Sender<Result<WebRtcConnection, std::io::Error>>,
    /// Result receiver
    result_receiver: mpsc::Receiver<Result<WebRtcConnection, std::io::Error>>,
}

impl WebRtcTransport {
    /// Create a new WebRTC transport
    pub fn new(local_peer_id: PeerId) -> Self {
        Self::with_signaling_client(local_peer_id, None)
    }

    /// Create a new WebRTC transport with a signaling client
    pub fn with_signaling_client(local_peer_id: PeerId, webrtc_signaling_client: Option<Arc<WebRtcSignalingClient>>) -> Self {
        WebRtcTransport {
            local_peer_id,
            listeners: HashMap::new(),
            next_listener_id: ListenerId::new(),
            pending_dials: HashMap::new(),
            ice_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
            ],
            signaling_client: None,
            webrtc_signaling_client,
            signaling_server_url: None,
        }
    }

    /// Set the signaling server URL
    pub fn set_signaling_server(&mut self, url: String) {
        self.signaling_server_url = Some(url);
    }

    /// Check if the address is supported
    pub fn can_dial(&self, addr: &Multiaddr) -> bool {
        addr.iter().any(|p| match p {
            libp2p::multiaddr::Protocol::WebRTC => true,
            _ => false,
        })
    }
    
    /// Connect to the signaling server
    pub async fn connect_to_signaling_server(&mut self) -> Result<(), Error> {
        if let Some(url) = &self.signaling_server_url {
            // Create and connect the signaling client
            let signaling_client = SignalingClient::new(self.local_peer_id.to_string());
            signaling_client.connect(url).await?;
            self.signaling_client = Some(signaling_client);
            
            // Create and connect the WebRTC signaling client if not already provided
            if self.webrtc_signaling_client.is_none() {
                let webrtc_signaling_client = WebRtcSignalingClient::new(self.local_peer_id.clone());
                webrtc_signaling_client.connect(url).await?;
                self.webrtc_signaling_client = Some(Arc::new(webrtc_signaling_client));
            }
            
            // Create the WebRTC connection manager if not already provided
            if self.webrtc_connection_manager.is_none() {
                let webrtc_connection_manager = WebRtcConnectionManager::new(
                    self.local_peer_id.clone(),
                    self.webrtc_signaling_client.as_ref().unwrap().clone(),
                );
                self.webrtc_connection_manager = Some(Arc::new(webrtc_connection_manager));
            }
            
            Ok(())
        } else {
            Err(Error::WebSocketError("Signaling server URL not set".to_string()))
        }
    }
    
    /// Add an ICE server
    pub fn add_ice_server(&mut self, server: String) {
        self.ice_servers.push(server);
    }

    /// Create a WebRTC offer
    pub async fn create_offer(&self, peer_id: &PeerId) -> Result<String, std::io::Error> {
        // Use the WebRTC signaling client if available
        if let Some(webrtc_signaling_client) = &self.webrtc_signaling_client {
            webrtc_signaling_client.create_offer(peer_id)
                .await
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
        } else {
            // Fallback to dummy implementation
            Ok(format!("dummy_offer_for_{}", peer_id))
        }
    }

    /// Process a WebRTC answer
    pub async fn process_answer(&self, peer_id: &PeerId, answer: &str) -> Result<(), std::io::Error> {
        // Use the WebRTC signaling client if available
        if let Some(webrtc_signaling_client) = &self.webrtc_signaling_client {
            webrtc_signaling_client.process_answer(peer_id, answer)
                .await
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
        } else {
            // Fallback to dummy implementation
            log::debug!("Processing WebRTC answer from peer {}: {}", peer_id, answer);
            Ok(())
        }
    }

    /// Add an ICE candidate
    pub async fn add_ice_candidate(&self, peer_id: &PeerId, candidate: &str) -> Result<(), std::io::Error> {
        // Use the WebRTC signaling client if available
        if let Some(webrtc_signaling_client) = &self.webrtc_signaling_client {
            webrtc_signaling_client.add_ice_candidate(peer_id, candidate, "data", 0)
                .await
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
        } else {
            // Fallback to dummy implementation
            log::debug!("Adding ICE candidate for peer {}: {}", peer_id, candidate);
            Ok(())
        }
    }

    /// Handle a new connection
    pub async fn handle_new_connection(&mut self, peer_id: PeerId) -> Result<(), std::io::Error> {
        // Create a new data channel
        let data_channel = DataChannel::new("data".to_string(), true);
        
        // Create a new connection
        let connection = WebRtcConnection {
            peer_id: peer_id.clone(),
            data_channels: HashMap::from([("data".to_string(), data_channel)]),
        };
        
        // Find the listener to notify
        if let Some((listener_id, _)) = self.listeners.iter().next() {
            let event = TransportEvent::Incoming {
                listener_id: *listener_id,
                upgrade: WebRtcUpgrade {
                    peer_id,
                    offer: None,
                    ice_candidates: Vec::new(),
                    result_sender: None,
                    result_receiver: None,
                },
                local_addr: "/ip4/127.0.0.1/tcp/0/webrtc".parse().unwrap(),
                send_back_addr: "/ip4/127.0.0.1/tcp/0/webrtc".parse().unwrap(),
            };
            
            // Send the event to the listener
            if let Some(sender) = self.listeners.get(listener_id) {
                sender.clone().send(event).await
                    .map_err(|_| std::io::Error::new(std::io::ErrorKind::BrokenPipe, "Channel closed"))?;
            }
        }
        
        Ok(())
    }
}
impl Transport for WebRtcTransport {
    type Output = WebRtcConnection;
    type Error = std::io::Error;
    type Listener = mpsc::Receiver<TransportEvent<WebRtcUpgrade, Self::Error>>;
    type ListenerUpgrade = WebRtcUpgrade;
    type Dial = WebRtcDial;

    fn address_translation(&self, server: &Multiaddr, observed: &Multiaddr) -> Option<Multiaddr> {
        // For WebRTC, we don't do any address translation
        None
    }

    fn listen_on(&mut self, addr: Multiaddr) -> Result<ListenerId, TransportError<Self::Error>> {
        log::debug!("Listening on {}", addr);
        
        // Check if the address is supported
        if !self.can_dial(&addr) {
            return Err(TransportError::MultiaddrNotSupported(addr));
        }
        
        let (tx, rx) = mpsc::channel(10);
        let listener_id = self.next_listener_id;
        self.next_listener_id = ListenerId::new();
        
        self.listeners.insert(listener_id, tx.clone());
        
        // If we have a signaling client, use it to handle incoming connections
        if let Some(signaling_client) = &self.signaling_client {
            // Subscribe to all events
            let mut events = signaling_client.subscribe("*");
            
            // Process events in a separate task
            let local_peer_id = self.local_peer_id.clone();
            let tx_clone = tx.clone();
            
            tokio::spawn(async move {
                while let Some(event) = events.next().await {
                    match event {
                        SignalingEvent::OfferReceived { from, sdp } => {
                            // Process the offer
                            // In a real implementation, this would create a WebRTC connection
                            
                            // For now, just create a dummy connection
                            let peer_id = PeerId::from_bytes(from.as_bytes()).unwrap_or(PeerId::random());
                            let event = TransportEvent::Incoming {
                                listener_id,
                                upgrade: WebRtcUpgrade {
                                    peer_id: peer_id.clone(),
                                    offer: Some(sdp),
                                    ice_candidates: Vec::new(),
                                    result_sender: None,
                                    result_receiver: None,
                                },
                                local_addr: format!("/ip4/127.0.0.1/tcp/0/webrtc/p2p/{}", local_peer_id).parse().unwrap(),
                                send_back_addr: format!("/ip4/127.0.0.1/tcp/0/webrtc/p2p/{}", peer_id).parse().unwrap(),
                            };
                            
                            let _ = tx_clone.clone().try_send(event);
                        }
                        _ => {}
                    }
                }
            });
        }
        
        Ok(listener_id)
    }

    fn remove_listener(&mut self, id: ListenerId) -> bool {
        self.listeners.remove(&id).is_some()
    }

    fn dial(&mut self, addr: Multiaddr) -> Result<Self::Dial, TransportError<Self::Error>> {
        log::debug!("Dialing {}", addr);
        
        // Check if the address is supported
        if !self.can_dial(&addr) {
            return Err(TransportError::MultiaddrNotSupported(addr));
        }
        
        // Extract peer ID from address
        let peer_id = match addr.iter().find_map(|p| match p {
            libp2p::multiaddr::Protocol::P2p(hash) => Some(PeerId::from_multihash(hash).unwrap()),
            _ => None,
        }) {
            Some(peer_id) => peer_id,
            None => return Err(TransportError::Other(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "WebRTC address must contain a peer ID",
            ))),
        };
        
        let (tx, rx) = mpsc::channel(1);
        
        let dial = WebRtcDial {
            peer_id: peer_id.clone(),
            offer: None,
            ice_candidates: Vec::new(),
            result_sender: tx.clone(),
            result_receiver: rx,
        };
        
        self.pending_dials.insert(peer_id.clone(), dial.clone());
        
        // If we have a WebRTC connection manager, use it to establish the WebRTC connection
        if let Some(webrtc_connection_manager) = &self.webrtc_connection_manager {
            // Create a connection
            match webrtc_connection_manager.create_connection(&peer_id).await {
                Ok(connection) => {
                    // Send the connection to the result sender
                    if let Err(e) = dial.result_sender.clone().try_send(Ok(connection)) {
                        log::error!("Failed to send connection: {}", e);
                    }
                }
                Err(e) => {
                    log::error!("Failed to create connection: {}", e);
                    // Send the error to the result sender
                    if let Err(e) = dial.result_sender.clone().try_send(Err(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        e.to_string(),
                    ))) {
                        log::error!("Failed to send error: {}", e);
                    }
                }
            }
            
            // Process events in a separate task
            let peer_id_clone = peer_id.clone();
            let tx_clone = tx.clone();
            
            tokio::spawn(async move {
                while let Some(event) = events.next().await {
                    match event {
                        SignalingEvent::AnswerReceived { from, sdp } => {
                            if from == peer_id_clone.to_string() {
                                // Process the answer
                                // In a real implementation, this would create a WebRTC connection
                                
                                // For now, just create a dummy connection
                                let data_channel = DataChannel::new("data".to_string(), true);
                                let connection = WebRtcConnection {
                                    peer_id: peer_id_clone.clone(),
                                    data_channels: HashMap::from([("data".to_string(), data_channel)]),
                                };
                                
                                let _ = tx_clone.clone().try_send(Ok(connection));
                            }
                        }
                        SignalingEvent::IceCandidateReceived { from, candidate, sdp_mid, sdp_m_line_index } => {
                            if from == peer_id_clone.to_string() {
                                // Process the ICE candidate
                                // In a real implementation, this would add the ICE candidate to the WebRTC connection
                                log::debug!("Received ICE candidate from {}: {}", from, candidate);
                            }
                        }
                        _ => {}
                    }
                }
            });
        }
        
        Ok(dial)
    }

    fn dial_as_listener(&mut self, addr: Multiaddr) -> Result<Self::Dial, TransportError<Self::Error>> {
        self.dial(addr)
    }

    fn poll(
        mut self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
    ) -> Poll<TransportEvent<Self::ListenerUpgrade, Self::Error>> {
        // In a real implementation, this would poll for WebRTC events
        Poll::Pending
    }
    
}

// Clone implementation for WebRtcDial
impl Clone for WebRtcDial {
    fn clone(&self) -> Self {
        let (tx, rx) = mpsc::channel(1);
        
        WebRtcDial {
            peer_id: self.peer_id.clone(),
            offer: self.offer.clone(),
            ice_candidates: self.ice_candidates.clone(),
            result_sender: tx,
            result_receiver: rx,
        }
    }
}

// Future implementation for WebRtcDial
impl Future for WebRtcDial {
    type Output = Result<WebRtcConnection, std::io::Error>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // Poll the result receiver
        match ready!(self.result_receiver.poll_next_unpin(cx)) {
            Some(Ok(connection)) => {
                // We no longer need to return the ConnectedPoint
                Poll::Ready(Ok(connection))
            }
            Some(Err(e)) => Poll::Ready(Err(e)),
            None => Poll::Ready(Err(std::io::Error::new(
                std::io::ErrorKind::BrokenPipe,
                "Connection closed",
            ))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_can_dial() {
        let transport = WebRtcTransport::new(PeerId::random());
        
        let addr: Multiaddr = "/ip4/127.0.0.1/tcp/8000/webrtc/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSupNKC".parse().unwrap();
        assert!(transport.can_dial(&addr));
        
        let addr: Multiaddr = "/ip4/127.0.0.1/tcp/8000/p2p/QmcgpsyWgH8Y8ajJz1Cu72KnS5uo2Aa2LpzU7kinSupNKC".parse().unwrap();
        assert!(!transport.can_dial(&addr));
    }
}