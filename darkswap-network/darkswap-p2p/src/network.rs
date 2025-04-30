//! Network module for the DarkSwap P2P network.

use crate::behaviour::DarkSwapBehaviour;
use crate::config::Config;
use crate::error::Error;
use crate::message::Message;
use futures::{
    channel::mpsc,
    future::{self, Either},
    prelude::*,
    stream::StreamExt,
};
use libp2p::{
    core::transport::OrTransport,
    gossipsub::{IdentTopic, MessageId},
    identity::Keypair,
    noise,
    request_response::ResponseChannel,
    swarm::{SwarmBuilder, SwarmEvent},
    tcp, yamux, Multiaddr, PeerId, Swarm, Transport,
};
use log::{debug, error, info, warn};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// P2P network.
pub struct Network {
    /// Local peer ID.
    local_peer_id: PeerId,
    /// Swarm.
    swarm: Swarm<DarkSwapBehaviour>,
    /// Connected peers.
    connected_peers: Arc<RwLock<HashMap<PeerId, Multiaddr>>>,
}

impl Network {
    /// Create a new P2P network.
    pub async fn new(config: &Config) -> Result<Self, Error> {
        // Create a keypair for the local peer
        let local_keypair = Keypair::generate_ed25519();
        let local_peer_id = PeerId::from(local_keypair.public());

        // Create a transport
        let noise_keys = noise::Keypair::<noise::X25519Spec>::new()
            .into_authentic(&local_keypair)
            .map_err(|e| Error::TransportError(e.to_string()))?;

        let transport = tcp::tokio::Transport::new(tcp::Config::default())
            .upgrade(libp2p::core::upgrade::Version::V1)
            .authenticate(noise::NoiseConfig::xx(noise_keys).into_authenticated())
            .multiplex(yamux::YamuxConfig::default())
            .boxed();

        // Create a behaviour
        let behaviour = DarkSwapBehaviour::new(local_keypair, config).await
            .map_err(|e| Error::BehaviourError(e.to_string()))?;

        // Create a swarm
        let swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, local_peer_id)
            .build();

        Ok(Self {
            local_peer_id,
            swarm,
            connected_peers: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Start listening on the given address.
    pub async fn listen_on(&mut self, addr: &Multiaddr) -> Result<(), Error> {
        match self.swarm.listen_on(addr.clone()) {
            Ok(_) => {
                info!("Listening on {}", addr);
                Ok(())
            }
            Err(e) => {
                error!("Failed to listen on {}: {}", addr, e);
                Err(Error::ListenError(e.to_string()))
            }
        }
    }

    /// Dial the given address.
    pub async fn dial(&mut self, addr: &Multiaddr) -> Result<(), Error> {
        match self.swarm.dial(addr.clone()) {
            Ok(_) => {
                info!("Dialing {}", addr);
                Ok(())
            }
            Err(e) => {
                error!("Failed to dial {}: {}", addr, e);
                Err(Error::DialError(e.to_string()))
            }
        }
    }

    /// Dial the given peer ID.
    pub async fn dial_peer_id(&mut self, peer_id: &PeerId, addr: &Multiaddr) -> Result<(), Error> {
        match self.swarm.dial(addr.clone()) {
            Ok(_) => {
                info!("Dialing peer {} at {}", peer_id, addr);
                Ok(())
            }
            Err(e) => {
                error!("Failed to dial peer {} at {}: {}", peer_id, addr, e);
                Err(Error::DialError(e.to_string()))
            }
        }
    }

    /// Bootstrap the DHT.
    pub async fn bootstrap(&mut self) -> Result<(), Error> {
        match self.swarm.behaviour_mut().bootstrap() {
            Ok(query_id) => {
                info!("Bootstrapping DHT with query ID {:?}", query_id);
                Ok(())
            }
            Err(e) => {
                error!("Failed to bootstrap DHT: {}", e);
                Err(Error::BootstrapError(e.to_string()))
            }
        }
    }

    /// Run the network.
    pub async fn run(&mut self) -> Result<(), Error> {
        loop {
            tokio::select! {
                event = self.swarm.select_next_some() => {
                    self.handle_swarm_event(event).await?;
                }
            }
        }
    }

    /// Subscribe to a topic.
    pub async fn subscribe(&mut self, topic: &str) -> Result<bool, Error> {
        let topic = IdentTopic::new(topic);
        match self.swarm.behaviour_mut().subscribe(&topic) {
            Ok(subscribed) => Ok(subscribed),
            Err(e) => Err(Error::SubscribeError(e.to_string())),
        }
    }

    /// Publish a message to a topic.
    pub async fn publish(&mut self, topic: &str, message: &Message) -> Result<MessageId, Error> {
        let topic = IdentTopic::new(topic);
        match self.swarm.behaviour_mut().publish(&topic, serde_json::to_vec(&message)
            .map_err(|e| Error::SerializationError(e.to_string()))?) {
            Ok(message_id) => Ok(message_id),
            Err(e) => Err(Error::PublishError(e.to_string())),
        }
    }

    /// Send a request to a peer.
    pub async fn send_request(&mut self, peer_id: &PeerId, message: Message) {
        self.swarm.behaviour_mut().send_request(peer_id, message);
    }

    /// Send a response to a request.
    pub async fn send_response(&mut self, peer_id: &PeerId, message: Message) {
        self.swarm.behaviour_mut().send_request(peer_id, message);
    }

    /// Get the local peer ID.
    pub fn local_peer_id(&self) -> &PeerId {
        &self.local_peer_id
    }

    /// Get the connected peers.
    pub async fn connected_peers(&self) -> HashMap<PeerId, Multiaddr> {
        self.connected_peers.read().await.clone()
    }

    /// Handle a swarm event.
    async fn handle_swarm_event(&mut self, event: SwarmEvent<crate::behaviour::DarkSwapEvent, libp2p::swarm::ConnectionHandlerUpgrErr<std::io::Error>>) -> Result<(), Error> {
        match event {
            SwarmEvent::NewListenAddr { address, .. } => {
                info!("Listening on {}", address);
            }
            SwarmEvent::ConnectionEstablished {
                peer_id, endpoint, ..
            } => {
                if let libp2p::core::ConnectedPoint::Dialer { address, .. } = endpoint {
                    info!("Connected to {} at {}", peer_id, address);
                    self.connected_peers
                        .write()
                        .await
                        .insert(peer_id, address.clone());
                }
            }
            SwarmEvent::ConnectionClosed { peer_id, .. } => {
                info!("Disconnected from {}", peer_id);
                self.connected_peers.write().await.remove(&peer_id);
            }
            SwarmEvent::Behaviour(crate::behaviour::DarkSwapEvent::RequestResponse(
                libp2p::request_response::Event::Message {
                    peer,
                    message:
                        libp2p::request_response::Message::Request {
                            request, channel, ..
                        },
                },
            )) => {
                debug!("Received request from {}: {:?}", peer, request);
                // Handle the request and send a response
                let response = Message::Response {
                    id: "response".to_string(),
                    data: "response data".to_string(),
                };
                match self.swarm.behaviour_mut().send_response(channel, response) {
                    Ok(_) => {}
                    Err(e) => {
                        error!("Failed to send response: {}", e);
                    }
                }
            }
            SwarmEvent::Behaviour(crate::behaviour::DarkSwapEvent::RequestResponse(
                libp2p::request_response::Event::Message {
                    peer,
                    message: libp2p::request_response::Message::Response { response, .. },
                },
            )) => {
                debug!("Received response from {}: {:?}", peer, response);
                // Handle the response
            }
            SwarmEvent::Behaviour(crate::behaviour::DarkSwapEvent::Gossipsub(
                libp2p::gossipsub::Event::Message {
                    propagation_source,
                    message_id,
                    message,
                },
            )) => {
                debug!(
                    "Received gossipsub message from {}: {:?}",
                    propagation_source, message
                );
                // Handle the message
            }
            _ => {}
        }
        Ok(())
    }
}