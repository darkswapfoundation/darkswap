//! Network functionality for the P2P network.

use crate::behaviour::{DarkSwapBehaviour, DarkSwapEvent};
use crate::config::Config;
use crate::message::Message;
use crate::transport::create_transport;
use darkswap_lib::Error;
use futures::{
    channel::mpsc,
    future::{self, Either},
    prelude::*,
    stream::StreamExt,
};
use libp2p::{
    core::transport::OrTransport,
    gossipsub::{self, IdentTopic, TopicHash},
    identity::{Keypair, PublicKey},
    noise,
    swarm::{SwarmBuilder, SwarmEvent},
    yamux, Multiaddr, PeerId, Swarm, Transport,
};
use std::collections::{HashMap, HashSet};
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;
use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};

/// A P2P network.
pub struct Network {
    /// The libp2p swarm.
    swarm: Swarm<DarkSwapBehaviour>,
    /// The local peer ID.
    local_peer_id: PeerId,
    /// The local keypair.
    keypair: Keypair,
    /// The network configuration.
    config: Config,
    /// The message sender.
    message_sender: UnboundedSender<Message>,
    /// The message receiver.
    message_receiver: UnboundedReceiver<Message>,
    /// The subscribed topics.
    subscribed_topics: HashSet<String>,
    /// The connected peers.
    connected_peers: HashMap<PeerId, HashSet<Multiaddr>>,
}

impl Network {
    /// Create a new P2P network.
    pub async fn new(
        keypair: Keypair,
        config: Config,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let local_peer_id = PeerId::from(keypair.public());

        // Create the transport
        let transport = create_transport(&keypair)?;

        // Create the behaviour
        let behaviour = DarkSwapBehaviour::new(local_peer_id, &config).await?;

        // Create the swarm
        let swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, local_peer_id)
            .build();

        // Create the message channel
        let (message_sender, message_receiver) = tokio::sync::mpsc::unbounded_channel();

        Ok(Self {
            swarm,
            local_peer_id,
            keypair,
            config,
            message_sender,
            message_receiver,
            subscribed_topics: HashSet::new(),
            connected_peers: HashMap::new(),
        })
    }

    /// Start the network.
    pub async fn start(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Listen on the configured addresses
        for addr in &self.config.listen_addresses {
            let addr = addr.parse::<Multiaddr>()?;
            self.swarm.listen_on(addr)?;
        }

        // Connect to bootstrap peers
        for peer in &self.config.bootstrap_peers {
            let (peer_id, addr) = parse_peer_id_and_addr(peer)?;
            self.swarm.dial(addr.clone())?;
            self.connected_peers
                .entry(peer_id)
                .or_default()
                .insert(addr);
        }

        // Connect to relay servers
        for relay in &self.config.relay_servers {
            let (peer_id, addr) = parse_peer_id_and_addr(relay)?;
            self.swarm.dial(addr.clone())?;
            self.connected_peers
                .entry(peer_id)
                .or_default()
                .insert(addr);
        }

        // Bootstrap the DHT
        if self.config.enable_dht {
            match self.swarm.behaviour_mut().bootstrap() {
                Ok(_) => println!("DHT bootstrap started"),
                Err(e) => println!("DHT bootstrap failed: {}", e),
            }
        }

        Ok(())
    }

    /// Run the network event loop.
    pub async fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        loop {
            tokio::select! {
                // Process incoming messages from the application
                Some(message) = self.message_receiver.recv() => {
                    self.handle_app_message(message).await?;
                }
                // Process swarm events
                event = self.swarm.select_next_some() => {
                    self.handle_swarm_event(event).await?;
                }
                // Process other events
                // ...
            }
        }
    }

    /// Handle a message from the application.
    async fn handle_app_message(&mut self, message: Message) -> Result<(), Error> {
        // Handle the message based on its type
        match message {
            Message::Order(ref order) => {
                // Publish the order to the orderbook topic
                let topic = format!("darkswap/orderbook/{}/{}", order.base_asset, order.quote_asset);
                if !self.subscribed_topics.contains(&topic) {
                    self.swarm.behaviour_mut().subscribe(&topic)
                        .map_err(|e| Error::P2P(format!("Failed to subscribe to topic: {}", e)))?;
                    self.subscribed_topics.insert(topic.clone());
                }
                self.swarm.behaviour_mut().publish(&topic, serde_json::to_vec(&message)
                    .map_err(|e| Error::P2P(format!("Failed to serialize message: {}", e)))?)
                    .map_err(|e| Error::P2P(format!("Failed to publish message: {}", e)))?;
            }
            Message::Trade(ref trade) => {
                // Send the trade message directly to the peer
                let peer_id = PeerId::from_bytes(&hex::decode(&trade.maker_peer_id)
                    .map_err(|e| Error::P2P(format!("Failed to decode peer ID: {}", e)))?)
                    .map_err(|e| Error::P2P(format!("Invalid peer ID: {}", e)))?;
                self.swarm.behaviour_mut().send_request(&peer_id, message);
            }
            Message::Chat(ref chat) => {
                // Send the chat message directly to the peer
                let peer_id = PeerId::from_bytes(&hex::decode(&chat.recipient_peer_id)
                    .map_err(|e| Error::P2P(format!("Failed to decode peer ID: {}", e)))?)
                    .map_err(|e| Error::P2P(format!("Invalid peer ID: {}", e)))?;
                self.swarm.behaviour_mut().send_request(&peer_id, message);
            }
            Message::Ping => {
                // Ignore ping messages from the application
            }
            Message::Pong => {
                // Ignore pong messages from the application
            }
        }

        Ok(())
    }

    /// Handle a swarm event.
    async fn handle_swarm_event(&mut self, event: SwarmEvent<DarkSwapEvent, libp2p::swarm::ConnectionHandlerErr<std::io::Error>>) -> Result<(), Error> {
        match event {
            SwarmEvent::Behaviour(DarkSwapEvent::Gossipsub(gossipsub_event)) => {
                if let gossipsub::GossipsubEvent::Message {
                    propagation_source,
                    message_id,
                    message,
                } = gossipsub_event
                {
                    // Handle a gossipsub message
                    let message: Message = serde_json::from_slice(&message.data)
                        .map_err(|e| Error::P2P(format!("Failed to deserialize message: {}", e)))?;
                    self.message_sender.send(message)
                        .map_err(|e| Error::P2P(format!("Failed to send message: {}", e)))?;
                }
            }
            SwarmEvent::Behaviour(DarkSwapEvent::RequestResponse(request_response_event)) => {
                match request_response_event {
                    libp2p::request_response::RequestResponseEvent::Message {
                        peer,
                        message,
                    } => {
                        // Handle a request-response message
                        match message {
                            libp2p::request_response::RequestResponseMessage::Request {
                                request_id,
                                request,
                                channel,
                            } => {
                                // Handle the request
                                self.message_sender.send(request)
                                    .map_err(|e| Error::P2P(format!("Failed to send message: {}", e)))?;
                                // Send a response
                                let response = Message::Pong;
                                self.swarm.behaviour_mut().send_response(channel, response)
                                    .map_err(|e| Error::P2P(format!("Failed to send response: {}", e)))?;
                            }
                            libp2p::request_response::RequestResponseMessage::Response {
                                request_id,
                                response,
                            } => {
                                // Handle the response
                                self.message_sender.send(response)
                                    .map_err(|e| Error::P2P(format!("Failed to send message: {}", e)))?;
                            }
                        }
                    }
                    _ => {}
                }
            }
            SwarmEvent::NewListenAddr { address, .. } => {
                println!("Listening on {}", address);
            }
            SwarmEvent::ConnectionEstablished {
                peer_id, endpoint, ..
            } => {
                println!("Connected to {}", peer_id);
                if let libp2p::core::ConnectedPoint::Dialer { address, .. } = endpoint {
                    self.connected_peers
                        .entry(peer_id)
                        .or_default()
                        .insert(address);
                }
            }
            SwarmEvent::ConnectionClosed { peer_id, .. } => {
                println!("Disconnected from {}", peer_id);
                self.connected_peers.remove(&peer_id);
            }
            _ => {}
        }

        Ok(())
    }

    /// Get the local peer ID.
    pub fn local_peer_id(&self) -> &PeerId {
        &self.local_peer_id
    }

    /// Get the local keypair.
    pub fn keypair(&self) -> &Keypair {
        &self.keypair
    }

    /// Get the message sender.
    pub fn message_sender(&self) -> UnboundedSender<Message> {
        self.message_sender.clone()
    }

    /// Get the connected peers.
    pub fn connected_peers(&self) -> &HashMap<PeerId, HashSet<Multiaddr>> {
        &self.connected_peers
    }
}

/// Parse a peer ID and address from a string.
fn parse_peer_id_and_addr(peer: &str) -> Result<(PeerId, Multiaddr), Box<dyn std::error::Error>> {
    let mut parts = peer.split('/');
    let peer_id = parts.next().ok_or_else(|| Error::P2P("Invalid peer ID".to_string()))?;
    let addr = format!("/{}", parts.collect::<Vec<_>>().join("/"));

    let peer_id = PeerId::from_bytes(&hex::decode(peer_id)?)
        .map_err(|e| Error::P2P(format!("Invalid peer ID: {}", e)))?;
    let addr = addr.parse::<Multiaddr>()?;

    Ok((peer_id, addr))
}