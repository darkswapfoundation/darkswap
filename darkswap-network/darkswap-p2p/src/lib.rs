//! P2P networking for DarkSwap.
//!
//! This library provides the P2P networking functionality for the DarkSwap application,
//! including peer discovery, message passing, and WebRTC transport.

use anyhow::Result;
use futures::{
    channel::mpsc,
    future::{self, Either},
    prelude::*,
    select,
};
use libp2p::{
    core::{
        muxing::StreamMuxerBox,
        transport::{Boxed, Transport},
        upgrade,
    },
    gossipsub::{
        self, Gossipsub, GossipsubEvent, GossipsubMessage, IdentTopic, MessageAuthenticity,
        MessageId, ValidationMode,
    },
    identity, mdns, noise,
    request_response::{self, ProtocolSupport, RequestResponse, RequestResponseEvent},
    swarm::{NetworkBehaviour, SwarmBuilder, SwarmEvent},
    tcp, yamux, PeerId, Swarm,
};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use thiserror::Error;
use tokio::sync::mpsc as tokio_mpsc;

/// Error type for the P2P networking.
#[derive(Debug, Error)]
pub enum P2PError {
    /// Error when connecting to a peer.
    #[error("Failed to connect to peer: {0}")]
    ConnectionError(String),

    /// Error when disconnecting from a peer.
    #[error("Failed to disconnect from peer: {0}")]
    DisconnectionError(String),

    /// Error when sending a message.
    #[error("Failed to send message: {0}")]
    SendError(String),

    /// Error when receiving a message.
    #[error("Failed to receive message: {0}")]
    ReceiveError(String),

    /// Error when serializing or deserializing a message.
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Other error.
    #[error("Other error: {0}")]
    Other(String),
}

/// Message types that can be sent over the P2P network.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum P2PMessage {
    /// Order-related messages.
    Order(OrderMessage),

    /// Trade-related messages.
    Trade(TradeMessage),

    /// Chat messages.
    Chat(ChatMessage),

    /// System messages.
    System(SystemMessage),
}

/// Order-related messages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrderMessage {
    /// Create a new order.
    CreateOrder {
        /// The order ID.
        id: String,
        /// The order type.
        order_type: OrderType,
        /// The asset to sell.
        sell_asset: String,
        /// The amount to sell.
        sell_amount: u64,
        /// The asset to buy.
        buy_asset: String,
        /// The amount to buy.
        buy_amount: u64,
    },

    /// Cancel an order.
    CancelOrder {
        /// The order ID.
        id: String,
    },

    /// Update an order.
    UpdateOrder {
        /// The order ID.
        id: String,
        /// The new sell amount.
        sell_amount: u64,
        /// The new buy amount.
        buy_amount: u64,
    },

    /// Get the order book.
    GetOrderBook,

    /// Order book response.
    OrderBook {
        /// The orders in the order book.
        orders: Vec<Order>,
    },
}

/// Order type.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderType {
    /// Buy order.
    Buy,
    /// Sell order.
    Sell,
}

/// An order in the order book.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    /// The order ID.
    pub id: String,
    /// The order type.
    pub order_type: OrderType,
    /// The asset to sell.
    pub sell_asset: String,
    /// The amount to sell.
    pub sell_amount: u64,
    /// The asset to buy.
    pub buy_asset: String,
    /// The amount to buy.
    pub buy_amount: u64,
    /// The peer ID of the order creator.
    pub peer_id: String,
}

/// Trade-related messages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeMessage {
    /// Propose a trade.
    ProposeTradeRequest {
        /// The trade ID.
        id: String,
        /// The order ID.
        order_id: String,
        /// The amount to trade.
        amount: u64,
    },

    /// Accept a trade proposal.
    AcceptTradeRequest {
        /// The trade ID.
        id: String,
    },

    /// Reject a trade proposal.
    RejectTradeRequest {
        /// The trade ID.
        id: String,
        /// The reason for rejection.
        reason: String,
    },

    /// Execute a trade.
    ExecuteTradeRequest {
        /// The trade ID.
        id: String,
        /// The transaction.
        transaction: Vec<u8>,
    },

    /// Confirm a trade execution.
    ConfirmTradeRequest {
        /// The trade ID.
        id: String,
        /// The transaction ID.
        transaction_id: String,
    },

    /// Cancel a trade.
    CancelTradeRequest {
        /// The trade ID.
        id: String,
        /// The reason for cancellation.
        reason: String,
    },
}

/// Chat messages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// The sender of the message.
    pub sender: String,
    /// The recipient of the message.
    pub recipient: String,
    /// The message content.
    pub content: String,
    /// The timestamp of the message.
    pub timestamp: u64,
}

/// System messages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemMessage {
    /// Ping message.
    Ping {
        /// The timestamp of the ping.
        timestamp: u64,
    },

    /// Pong message.
    Pong {
        /// The timestamp of the original ping.
        timestamp: u64,
    },

    /// Peer discovery message.
    PeerDiscovery {
        /// The peer ID.
        peer_id: String,
        /// The peer addresses.
        addresses: Vec<String>,
    },
}

/// P2P network manager.
pub struct P2PManager {
    /// The libp2p swarm.
    swarm: Swarm<P2PBehaviour>,
    /// The peer ID of this node.
    peer_id: PeerId,
    /// The order book.
    order_book: Arc<Mutex<HashMap<String, Order>>>,
    /// The trades.
    trades: Arc<Mutex<HashMap<String, Trade>>>,
    /// The connected peers.
    peers: Arc<Mutex<HashSet<PeerId>>>,
    /// The sender for outgoing messages.
    message_sender: mpsc::Sender<(P2PMessage, Option<PeerId>)>,
    /// The receiver for outgoing messages.
    message_receiver: mpsc::Receiver<(P2PMessage, Option<PeerId>)>,
    /// The sender for incoming messages.
    incoming_sender: tokio_mpsc::Sender<(P2PMessage, PeerId)>,
    /// The receiver for incoming messages.
    incoming_receiver: tokio_mpsc::Receiver<(P2PMessage, PeerId)>,
}

/// A trade.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// The trade ID.
    pub id: String,
    /// The order ID.
    pub order_id: String,
    /// The amount to trade.
    pub amount: u64,
    /// The peer ID of the trade initiator.
    pub initiator: String,
    /// The peer ID of the trade counterparty.
    pub counterparty: String,
    /// The trade status.
    pub status: TradeStatus,
    /// The transaction.
    pub transaction: Option<Vec<u8>>,
    /// The transaction ID.
    pub transaction_id: Option<String>,
}

/// Trade status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradeStatus {
    /// The trade has been proposed.
    Proposed,
    /// The trade has been accepted.
    Accepted,
    /// The trade has been rejected.
    Rejected,
    /// The trade is being executed.
    Executing,
    /// The trade has been confirmed.
    Confirmed,
    /// The trade has been cancelled.
    Cancelled,
}

/// P2P network behaviour.
#[derive(NetworkBehaviour)]
pub struct P2PBehaviour {
    /// The gossipsub protocol.
    gossipsub: Gossipsub,
    /// The request-response protocol.
    request_response: RequestResponse<P2PCodec>,
    /// The mDNS protocol.
    mdns: mdns::async_io::Behaviour,
}

/// P2P codec for request-response.
#[derive(Debug, Clone)]
pub struct P2PCodec;

impl request_response::Codec for P2PCodec {
    type Protocol = &'static str;
    type Request = P2PMessage;
    type Response = P2PMessage;

    fn encode_request(&mut self, request: Self::Request) -> Vec<u8> {
        serde_json::to_vec(&request).unwrap()
    }

    fn decode_request(&mut self, bytes: &[u8]) -> Result<Self::Request, std::io::Error> {
        serde_json::from_slice(bytes).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
    }

    fn encode_response(&mut self, response: Self::Response) -> Vec<u8> {
        serde_json::to_vec(&response).unwrap()
    }

    fn decode_response(&mut self, bytes: &[u8]) -> Result<Self::Response, std::io::Error> {
        serde_json::from_slice(bytes).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
    }
}

impl P2PManager {
    /// Create a new P2P manager.
    pub async fn new() -> Result<Self, P2PError> {
        // Generate a random identity
        let local_key = identity::Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_key.public());

        // Create a transport
        let transport = tcp::async_io::Transport::new(tcp::Config::default())
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::NoiseAuthenticated::xx(&local_key).unwrap())
            .multiplex(yamux::YamuxConfig::default())
            .boxed();

        // Create a gossipsub protocol
        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(10))
            .validation_mode(ValidationMode::Strict)
            .build()
            .unwrap();

        let gossipsub = Gossipsub::new(
            MessageAuthenticity::Signed(local_key.clone()),
            gossipsub_config,
        )
        .unwrap();

        // Create a request-response protocol
        let request_response = RequestResponse::new(
            P2PCodec,
            vec![(
                "/darkswap/request-response/1.0.0",
                ProtocolSupport::Full,
            )],
            Default::default(),
        );

        // Create an mDNS protocol
        let mdns = mdns::async_io::Behaviour::new(mdns::Config::default(), local_peer_id).unwrap();

        // Create a behaviour
        let behaviour = P2PBehaviour {
            gossipsub,
            request_response,
            mdns,
        };

        // Create a swarm
        let swarm = SwarmBuilder::with_async_std_executor(transport, behaviour, local_peer_id)
            .build();

        // Create channels for message passing
        let (message_sender, message_receiver) = mpsc::channel(100);
        let (incoming_sender, incoming_receiver) = tokio_mpsc::channel(100);

        Ok(Self {
            swarm,
            peer_id: local_peer_id,
            order_book: Arc::new(Mutex::new(HashMap::new())),
            trades: Arc::new(Mutex::new(HashMap::new())),
            peers: Arc::new(Mutex::new(HashSet::new())),
            message_sender,
            message_receiver,
            incoming_sender,
            incoming_receiver,
        })
    }

    /// Start the P2P manager.
    pub async fn start(&mut self) -> Result<(), P2PError> {
        // Subscribe to the order book topic
        let order_book_topic = IdentTopic::new("darkswap/orderbook");
        self.swarm
            .behaviour_mut()
            .gossipsub
            .subscribe(&order_book_topic)
            .map_err(|e| P2PError::Other(format!("Failed to subscribe to order book topic: {}", e)))?;

        // Subscribe to the trade topic
        let trade_topic = IdentTopic::new("darkswap/trade");
        self.swarm
            .behaviour_mut()
            .gossipsub
            .subscribe(&trade_topic)
            .map_err(|e| P2PError::Other(format!("Failed to subscribe to trade topic: {}", e)))?;

        // Subscribe to the chat topic
        let chat_topic = IdentTopic::new("darkswap/chat");
        self.swarm
            .behaviour_mut()
            .gossipsub
            .subscribe(&chat_topic)
            .map_err(|e| P2PError::Other(format!("Failed to subscribe to chat topic: {}", e)))?;

        // Start listening on a random port
        self.swarm
            .listen_on("/ip4/0.0.0.0/tcp/0".parse().unwrap())
            .map_err(|e| P2PError::Other(format!("Failed to listen: {}", e)))?;

        // Main event loop
        loop {
            select! {
                // Handle swarm events
                event = self.swarm.select_next_some() => {
                    match event {
                        SwarmEvent::Behaviour(behaviour_event) => {
                            match behaviour_event {
                                // Handle gossipsub events
                                P2PBehaviourEvent::Gossipsub(gossipsub_event) => {
                                    match gossipsub_event {
                                        GossipsubEvent::Message {
                                            propagation_source,
                                            message_id,
                                            message,
                                        } => {
                                            // Deserialize the message
                                            match serde_json::from_slice::<P2PMessage>(&message.data) {
                                                Ok(p2p_message) => {
                                                    // Forward the message to the application
                                                    if let Err(e) = self.incoming_sender.send((p2p_message, propagation_source)).await {
                                                        error!("Failed to forward message: {}", e);
                                                    }
                                                }
                                                Err(e) => {
                                                    error!("Failed to deserialize message: {}", e);
                                                }
                                            }
                                        }
                                        _ => {}
                                    }
                                }
                                // Handle request-response events
                                P2PBehaviourEvent::RequestResponse(request_response_event) => {
                                    match request_response_event {
                                        RequestResponseEvent::Message {
                                            peer,
                                            message,
                                        } => {
                                            match message {
                                                request_response::Message::Request {
                                                    request_id,
                                                    request,
                                                    channel,
                                                } => {
                                                    // Forward the request to the application
                                                    if let Err(e) = self.incoming_sender.send((request, peer)).await {
                                                        error!("Failed to forward request: {}", e);
                                                    }
                                                }
                                                request_response::Message::Response {
                                                    request_id,
                                                    response,
                                                } => {
                                                    // Forward the response to the application
                                                    if let Err(e) = self.incoming_sender.send((response, peer)).await {
                                                        error!("Failed to forward response: {}", e);
                                                    }
                                                }
                                            }
                                        }
                                        _ => {}
                                    }
                                }
                                // Handle mDNS events
                                P2PBehaviourEvent::Mdns(mdns_event) => {
                                    match mdns_event {
                                        mdns::Event::Discovered(peers) => {
                                            for (peer_id, _) in peers {
                                                // Add the peer to the set of connected peers
                                                self.peers.lock().unwrap().insert(peer_id);
                                            }
                                        }
                                        mdns::Event::Expired(peers) => {
                                            for (peer_id, _) in peers {
                                                // Remove the peer from the set of connected peers
                                                self.peers.lock().unwrap().remove(&peer_id);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
                // Handle outgoing messages
                message = self.message_receiver.next() => {
                    if let Some((message, peer_id)) = message {
                        // Serialize the message
                        let message_bytes = match serde_json::to_vec(&message) {
                            Ok(bytes) => bytes,
                            Err(e) => {
                                error!("Failed to serialize message: {}", e);
                                continue;
                            }
                        };

                        // Send the message
                        match &message {
                            P2PMessage::Order(_) => {
                                // Publish to the order book topic
                                let topic = IdentTopic::new("darkswap/orderbook");
                                if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, message_bytes) {
                                    error!("Failed to publish order message: {}", e);
                                }
                            }
                            P2PMessage::Trade(_) => {
                                if let Some(peer_id) = peer_id {
                                    // Send to a specific peer
                                    self.swarm.behaviour_mut().request_response.send_request(&peer_id, message);
                                } else {
                                    // Publish to the trade topic
                                    let topic = IdentTopic::new("darkswap/trade");
                                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, message_bytes) {
                                        error!("Failed to publish trade message: {}", e);
                                    }
                                }
                            }
                            P2PMessage::Chat(chat_message) => {
                                if let Some(peer_id) = peer_id {
                                    // Send to a specific peer
                                    self.swarm.behaviour_mut().request_response.send_request(&peer_id, message);
                                } else {
                                    // Publish to the chat topic
                                    let topic = IdentTopic::new("darkswap/chat");
                                    if let Err(e) = self.swarm.behaviour_mut().gossipsub.publish(topic, message_bytes) {
                                        error!("Failed to publish chat message: {}", e);
                                    }
                                }
                            }
                            P2PMessage::System(_) => {
                                if let Some(peer_id) = peer_id {
                                    // Send to a specific peer
                                    self.swarm.behaviour_mut().request_response.send_request(&peer_id, message);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /// Connect to a peer.
    pub async fn connect(&mut self, address: &str) -> Result<(), P2PError> {
        // Parse the address
        let addr = address
            .parse()
            .map_err(|e| P2PError::ConnectionError(format!("Invalid address: {}", e)))?;

        // Connect to the peer
        self.swarm
            .dial(addr)
            .map_err(|e| P2PError::ConnectionError(format!("Failed to dial: {}", e)))?;

        Ok(())
    }

    /// Disconnect from a peer.
    pub async fn disconnect(&mut self, peer_id: &str) -> Result<(), P2PError> {
        // Parse the peer ID
        let peer_id = peer_id
            .parse::<PeerId>()
            .map_err(|e| P2PError::DisconnectionError(format!("Invalid peer ID: {}", e)))?;

        // Disconnect from the peer
        // Note: libp2p doesn't have a direct way to disconnect from a specific peer,
        // so we would need to implement this differently in a real application.
        Ok(())
    }

    /// Send a message to a peer.
    pub async fn send_message(
        &self,
        message: P2PMessage,
        peer_id: Option<&str>,
    ) -> Result<(), P2PError> {
        // Parse the peer ID if provided
        let peer_id = if let Some(peer_id) = peer_id {
            Some(
                peer_id
                    .parse::<PeerId>()
                    .map_err(|e| P2PError::SendError(format!("Invalid peer ID: {}", e)))?,
            )
        } else {
            None
        };

        // Send the message
        self.message_sender
            .clone()
            .send((message, peer_id))
            .await
            .map_err(|e| P2PError::SendError(format!("Failed to send message: {}", e)))?;

        Ok(())
    }

    /// Receive a message.
    pub async fn receive_message(&mut self) -> Result<(P2PMessage, String), P2PError> {
        // Receive the message
        let (message, peer_id) = self
            .incoming_receiver
            .recv()
            .await
            .ok_or_else(|| P2PError::ReceiveError("Channel closed".to_string()))?;

        Ok((message, peer_id.to_string()))
    }

    /// Get the list of connected peers.
    pub fn get_peers(&self) -> Vec<String> {
        self.peers
            .lock()
            .unwrap()
            .iter()
            .map(|peer_id| peer_id.to_string())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_p2p_manager_creation() {
        let manager = P2PManager::new().await;
        assert!(manager.is_ok());
    }
}