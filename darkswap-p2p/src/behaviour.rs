//! Network behaviour for the DarkSwap P2P network.

use crate::config::Config;
use crate::message::Message;
use crate::protocol::{create_request_response, DarkSwapProtocol};
use libp2p::{
    gossipsub::{self, Gossipsub, GossipsubConfig, IdentTopic, MessageAuthenticity},
    identify::{self, Identify, IdentifyConfig},
    kad::{store::MemoryStore, Kademlia, KademliaConfig, KademliaEvent},
    mdns::{self, Mdns, MdnsConfig},
    ping::{self, Ping, PingConfig},
    request_response::{self, RequestResponse},
    swarm::NetworkBehaviour,
    Multiaddr, PeerId,
};
use std::collections::HashSet;
use std::time::Duration;

/// Network behaviour for the DarkSwap P2P network.
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "DarkSwapEvent")]
pub struct DarkSwapBehaviour {
    /// Ping protocol for keeping connections alive.
    ping: Ping,
    /// Identify protocol for exchanging peer information.
    identify: Identify,
    /// Kademlia DHT for peer discovery.
    kademlia: Kademlia<MemoryStore>,
    /// mDNS for local peer discovery.
    mdns: Mdns,
    /// Gossipsub for pubsub messaging.
    gossipsub: Gossipsub,
    /// Request-response protocol for direct messaging.
    request_response: RequestResponse<DarkSwapProtocol, Message, Message>,
}

/// Events emitted by the DarkSwap network behaviour.
#[derive(Debug)]
pub enum DarkSwapEvent {
    /// Ping event.
    Ping(ping::Event),
    /// Identify event.
    Identify(identify::Event),
    /// Kademlia event.
    Kademlia(KademliaEvent),
    /// mDNS event.
    Mdns(mdns::Event),
    /// Gossipsub event.
    Gossipsub(gossipsub::Event),
    /// Request-response event.
    RequestResponse(request_response::Event<Message, Message>),
}

impl From<ping::Event> for DarkSwapEvent {
    fn from(event: ping::Event) -> Self {
        Self::Ping(event)
    }
}

impl From<identify::Event> for DarkSwapEvent {
    fn from(event: identify::Event) -> Self {
        Self::Identify(event)
    }
}

impl From<KademliaEvent> for DarkSwapEvent {
    fn from(event: KademliaEvent) -> Self {
        Self::Kademlia(event)
    }
}

impl From<mdns::Event> for DarkSwapEvent {
    fn from(event: mdns::Event) -> Self {
        Self::Mdns(event)
    }
}

impl From<gossipsub::Event> for DarkSwapEvent {
    fn from(event: gossipsub::Event) -> Self {
        Self::Gossipsub(event)
    }
}

impl From<request_response::Event<Message, Message>> for DarkSwapEvent {
    fn from(event: request_response::Event<Message, Message>) -> Self {
        Self::RequestResponse(event)
    }
}

impl DarkSwapBehaviour {
    /// Create a new DarkSwap network behaviour.
    pub async fn new(
        local_peer_id: PeerId,
        config: &Config,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        // Create a Ping protocol
        let ping = Ping::new(PingConfig::new().with_interval(Duration::from_secs(30)));

        // Create an Identify protocol
        let identify = Identify::new(IdentifyConfig::new(
            "/darkswap/1.0.0".to_string(),
            local_peer_id,
        ));

        // Create a Kademlia DHT
        let store = MemoryStore::new(local_peer_id);
        let mut kademlia_config = KademliaConfig::default();
        kademlia_config.set_query_timeout(Duration::from_secs(5 * 60));
        let mut kademlia = Kademlia::with_config(local_peer_id, store, kademlia_config);

        // Create an mDNS discovery service
        let mdns = Mdns::new(MdnsConfig::default()).await?;

        // Create a Gossipsub protocol
        let gossipsub_config = GossipsubConfig::default();
        let gossipsub = Gossipsub::new(
            MessageAuthenticity::Signed(local_peer_id),
            gossipsub_config,
        )?;

        // Create a request-response protocol
        let request_response = create_request_response(local_peer_id);

        Ok(Self {
            ping,
            identify,
            kademlia,
            mdns,
            gossipsub,
            request_response,
        })
    }

    /// Subscribe to a topic.
    pub fn subscribe(&mut self, topic: &str) -> Result<bool, gossipsub::error::SubscriptionError> {
        let topic = IdentTopic::new(topic);
        self.gossipsub.subscribe(&topic)
    }

    /// Publish a message to a topic.
    pub fn publish(&mut self, topic: &str, data: impl Into<Vec<u8>>) -> Result<gossipsub::MessageId, gossipsub::error::PublishError> {
        let topic = IdentTopic::new(topic);
        self.gossipsub.publish(topic, data)
    }

    /// Send a request to a peer.
    pub fn send_request(&mut self, peer_id: &PeerId, request: Message) {
        self.request_response.send_request(peer_id, request);
    }

    /// Send a response to a request.
    pub fn send_response(&mut self, channel: request_response::ResponseChannel<Message>, response: Message) -> Result<(), request_response::OutboundFailure> {
        self.request_response.send_response(channel, response)
    }

    /// Add a known peer to the DHT.
    pub fn add_address(&mut self, peer_id: &PeerId, addr: &Multiaddr) {
        self.kademlia.add_address(peer_id, addr.clone());
    }

    /// Bootstrap the DHT.
    pub fn bootstrap(&mut self) -> Result<libp2p::kad::QueryId, libp2p::kad::NoKnownPeers> {
        self.kademlia.bootstrap()
    }
}