//! Relay discovery mechanism
//!
//! This module provides functionality for discovering relay nodes in the P2P network.
//! It includes methods for finding relays, ranking them by performance, and maintaining
//! a list of known relays.

use crate::{Error, Result};
use libp2p::{
    core::multiaddr::Protocol,
    kad::{record::Key, Kademlia, KademliaEvent, QueryResult},
    Multiaddr, PeerId,
};
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tracing::{debug, info, warn};

/// Relay information
#[derive(Debug, Clone)]
pub struct RelayInfo {
    /// Relay peer ID
    pub peer_id: PeerId,
    /// Relay addresses
    pub addresses: Vec<Multiaddr>,
    /// Last seen timestamp
    pub last_seen: Instant,
    /// Success count
    pub success_count: u32,
    /// Failure count
    pub failure_count: u32,
    /// Average latency in milliseconds
    pub avg_latency_ms: u32,
    /// Whether the relay supports circuit relay v2
    pub supports_circuit_relay_v2: bool,
    /// Maximum number of concurrent connections
    pub max_connections: Option<u32>,
    /// Current number of connections
    pub current_connections: Option<u32>,
}

impl RelayInfo {
    /// Create a new relay info
    pub fn new(peer_id: PeerId, addresses: Vec<Multiaddr>) -> Self {
        Self {
            peer_id,
            addresses,
            last_seen: Instant::now(),
            success_count: 0,
            failure_count: 0,
            avg_latency_ms: 0,
            supports_circuit_relay_v2: false,
            max_connections: None,
            current_connections: None,
        }
    }

    /// Update the relay info with a successful connection
    pub fn record_success(&mut self, latency_ms: u32) {
        self.last_seen = Instant::now();
        self.success_count += 1;

        // Update average latency
        if self.avg_latency_ms == 0 {
            self.avg_latency_ms = latency_ms;
        } else {
            self.avg_latency_ms = (self.avg_latency_ms * 3 + latency_ms) / 4; // Weighted average
        }
    }

    /// Update the relay info with a failed connection
    pub fn record_failure(&mut self) {
        self.failure_count += 1;
    }

    /// Calculate the relay score (higher is better)
    pub fn score(&self) -> f64 {
        // Base score starts at 100
        let mut score = 100.0;

        // Success rate affects score
        let total_attempts = self.success_count + self.failure_count;
        if total_attempts > 0 {
            let success_rate = self.success_count as f64 / total_attempts as f64;
            score *= success_rate;
        }

        // Latency affects score (lower is better)
        if self.avg_latency_ms > 0 {
            // Normalize latency between 0.5 and 1.0
            // 50ms or less is ideal (1.0), 500ms or more is poor (0.5)
            let latency_factor = 1.0 - (self.avg_latency_ms.min(500) as f64 / 1000.0);
            score *= 0.5 + (latency_factor * 0.5);
        }

        // Recent relays are preferred
        let age_secs = self.last_seen.elapsed().as_secs();
        if age_secs > 3600 { // Older than 1 hour
            score *= 0.9;
        }

        // Circuit relay v2 support is preferred
        if self.supports_circuit_relay_v2 {
            score *= 1.2;
        }

        // Available capacity is preferred
        if let (Some(max), Some(current)) = (self.max_connections, self.current_connections) {
            if max > 0 {
                let usage_ratio = current as f64 / max as f64;
                // Penalize heavily loaded relays
                if usage_ratio > 0.8 {
                    score *= 0.7;
                }
            }
        }

        score
    }

    /// Check if the relay is expired
    pub fn is_expired(&self, ttl: Duration) -> bool {
        self.last_seen.elapsed() > ttl
    }
}

/// Relay discovery configuration
#[derive(Debug, Clone)]
pub struct RelayDiscoveryConfig {
    /// Bootstrap relays
    pub bootstrap_relays: Vec<(PeerId, Multiaddr)>,
    /// DHT query interval
    pub dht_query_interval: Duration,
    /// Relay TTL
    pub relay_ttl: Duration,
    /// Maximum number of relays to track
    pub max_relays: usize,
    /// Whether to enable DHT discovery
    pub enable_dht_discovery: bool,
    /// Whether to enable mDNS discovery
    pub enable_mdns_discovery: bool,
}

impl Default for RelayDiscoveryConfig {
    fn default() -> Self {
        Self {
            bootstrap_relays: vec![],
            dht_query_interval: Duration::from_secs(300), // 5 minutes
            relay_ttl: Duration::from_secs(3600 * 24), // 24 hours
            max_relays: 100,
            enable_dht_discovery: true,
            enable_mdns_discovery: true,
        }
    }
}

/// Relay discovery manager
pub struct RelayDiscoveryManager {
    /// Configuration
    config: RelayDiscoveryConfig,
    /// Known relays
    relays: Arc<Mutex<HashMap<PeerId, RelayInfo>>>,
    /// Last DHT query timestamp
    last_dht_query: Arc<Mutex<Instant>>,
}

impl RelayDiscoveryManager {
    /// Create a new relay discovery manager
    pub fn new(config: RelayDiscoveryConfig) -> Self {
        let mut relays = HashMap::new();

        // Add bootstrap relays
        for (peer_id, addr) in &config.bootstrap_relays {
            let relay_info = RelayInfo::new(peer_id.clone(), vec![addr.clone()]);
            relays.insert(peer_id.clone(), relay_info);
        }

        Self {
            config,
            relays: Arc::new(Mutex::new(relays)),
            last_dht_query: Arc::new(Mutex::new(Instant::now())),
        }
    }

    /// Add a relay
    pub fn add_relay(&self, peer_id: PeerId, addresses: Vec<Multiaddr>) {
        let mut relays = self.relays.lock().unwrap();

        // Check if we already know this relay
        if let Some(relay) = relays.get_mut(&peer_id) {
            // Update addresses
            for addr in addresses {
                if !relay.addresses.contains(&addr) {
                    relay.addresses.push(addr);
                }
            }

            // Update last seen timestamp
            relay.last_seen = Instant::now();
        } else {
            // Add new relay
            let relay_info = RelayInfo::new(peer_id.clone(), addresses);
            relays.insert(peer_id, relay_info);

            // Prune if necessary
            if relays.len() > self.config.max_relays {
                self.prune_relays();
            }
        }
    }

    /// Get a relay by peer ID
    pub fn get_relay(&self, peer_id: &PeerId) -> Option<RelayInfo> {
        let relays = self.relays.lock().unwrap();
        relays.get(peer_id).cloned()
    }

    /// Get all relays
    pub fn get_relays(&self) -> Vec<RelayInfo> {
        let relays = self.relays.lock().unwrap();
        relays.values().cloned().collect()
    }

    /// Get the best relays
    pub fn get_best_relays(&self, count: usize) -> Vec<RelayInfo> {
        let relays = self.relays.lock().unwrap();

        // Convert to vector and sort by score
        let mut relay_vec: Vec<RelayInfo> = relays.values().cloned().collect();
        relay_vec.sort_by(|a, b| b.score().partial_cmp(&a.score()).unwrap_or(std::cmp::Ordering::Equal));

        // Return the top N relays
        relay_vec.into_iter().take(count).collect()
    }

    /// Record a successful connection through a relay
    pub fn record_success(&self, peer_id: &PeerId, latency_ms: u32) {
        let mut relays = self.relays.lock().unwrap();
        if let Some(relay) = relays.get_mut(peer_id) {
            relay.record_success(latency_ms);
        }
    }

    /// Record a failed connection through a relay
    pub fn record_failure(&self, peer_id: &PeerId) {
        let mut relays = self.relays.lock().unwrap();
        if let Some(relay) = relays.get_mut(peer_id) {
            relay.record_failure();
        }
    }

    /// Prune expired relays
    pub fn prune_relays(&self) {
        let mut relays = self.relays.lock().unwrap();

        // Remove expired relays
        relays.retain(|_, relay| !relay.is_expired(self.config.relay_ttl));

        // If we still have too many relays, remove the worst ones
        if relays.len() > self.config.max_relays {
            // Convert to vector and sort by score
            let mut relay_vec: Vec<(PeerId, f64)> = relays
                .iter()
                .map(|(peer_id, relay)| (peer_id.clone(), relay.score()))
                .collect();

            relay_vec.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

            // Remove the worst relays
            let to_remove = relay_vec.len() - self.config.max_relays;
            for (peer_id, _) in relay_vec.iter().take(to_remove) {
                relays.remove(peer_id);
            }
        }
    }

    /// Discover relays using DHT
    pub async fn discover_relays_dht(&self, kad: &mut Kademlia<MemoryStore>) -> Result<()> {
        // Check if it's time to query the DHT
        {
            let mut last_dht_query = self.last_dht_query.lock().unwrap();
            if last_dht_query.elapsed() < self.config.dht_query_interval {
                return Ok(());
            }
            *last_dht_query = Instant::now();
        }

        // Query the DHT for relay nodes
        let key = Key::new(&b"/libp2p/relay/v2"[..]);
        kad.get_providers(key);

        Ok(())
    }

    /// Process a Kademlia event
    pub fn process_kademlia_event(&self, event: KademliaEvent) {
        match event {
            KademliaEvent::OutboundQueryCompleted { result, .. } => {
                match result {
                    QueryResult::GetProviders(Ok(providers)) => {
                        for peer in providers.providers {
                            // Add the peer as a potential relay
                            let addresses = providers.closest_peers
                                .iter()
                                .filter_map(|(p, addrs)| if p == &peer { Some(addrs.clone()) } else { None })
                                .flatten()
                                .collect::<Vec<_>>();

                            self.add_relay(peer, addresses);
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }

    /// Process a discovered peer
    pub fn process_discovered_peer(&self, peer_id: PeerId, addresses: Vec<Multiaddr>) {
        // Check if any of the addresses contain the /p2p-circuit protocol
        let is_relay = addresses.iter().any(|addr| {
            addr.iter().any(|proto| matches!(proto, Protocol::P2pCircuit))
        });

        if is_relay {
            self.add_relay(peer_id, addresses);
        }
    }
}

/// Memory store for Kademlia
pub struct MemoryStore;

impl libp2p::kad::store::RecordStore for MemoryStore {
    type RecordsIter<'a> = Box<dyn Iterator<Item = Cow<'a, libp2p::kad::record::Record>> + 'a>;
    type ProvidedIter<'a> = Box<dyn Iterator<Item = Cow<'a, libp2p::kad::record::ProviderRecord>> + 'a>;
    type Error = std::io::Error;

    fn get(&self, _key: &Key) -> Option<Cow<'_, libp2p::kad::record::Record>> {
        None
    }

    fn put(&mut self, _record: libp2p::kad::record::Record) -> Result<(), libp2p::kad::store::Error> {
        Ok(())
    }

    fn remove(&mut self, _key: &Key) {
        // No-op
    }

    fn records(&self) -> Self::RecordsIter<'_> {
        Box::new(std::iter::empty())
    }

    fn add_provider(&mut self, _record: libp2p::kad::record::ProviderRecord) -> Result<(), libp2p::kad::store::Error> {
        Ok(())
    }

    fn providers(&self, _key: &Key) -> Vec<libp2p::kad::record::ProviderRecord> {
        Vec::new()
    }

    fn provided(&self) -> Self::ProvidedIter<'_> {
        Box::new(std::iter::empty())
    }

    fn remove_provider(&mut self, _key: &Key, _provider: &PeerId) {
        // No-op
    }
}

impl libp2p::kad::store::ProviderStore for MemoryStore {
    type Error = std::io::Error;

    fn providers(&self, _key: &Key) -> Result<Vec<libp2p::kad::record::ProviderRecord>, Self::Error> {
        Ok(Vec::new())
    }

    fn add_provider(&mut self, _record: libp2p::kad::record::ProviderRecord) -> Result<(), Self::Error> {
        Ok(())
    }

    fn remove_provider(&mut self, _key: &Key, _provider: &PeerId) -> Result<(), Self::Error> {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relay_info() {
        let peer_id = PeerId::random();
        let addr = "/ip4/127.0.0.1/tcp/8000".parse::<Multiaddr>().unwrap();

        let mut relay_info = RelayInfo::new(peer_id, vec![addr]);

        // Test initial state
        assert_eq!(relay_info.success_count, 0);
        assert_eq!(relay_info.failure_count, 0);
        assert_eq!(relay_info.avg_latency_ms, 0);

        // Test recording success
        relay_info.record_success(100);
        assert_eq!(relay_info.success_count, 1);
        assert_eq!(relay_info.avg_latency_ms, 100);

        // Test recording another success
        relay_info.record_success(200);
        assert_eq!(relay_info.success_count, 2);
        assert_eq!(relay_info.avg_latency_ms, 125); // (100*3 + 200)/4 = 125

        // Test recording failure
        relay_info.record_failure();
        assert_eq!(relay_info.failure_count, 1);

        // Test score calculation
        let score = relay_info.score();
        assert!(score > 0.0);

        // Test expiration
        assert!(!relay_info.is_expired(Duration::from_secs(3600)));
    }

    #[test]
    fn test_relay_discovery_manager() {
        let peer_id1 = PeerId::random();
        let peer_id2 = PeerId::random();
        let addr1 = "/ip4/127.0.0.1/tcp/8000".parse::<Multiaddr>().unwrap();
        let addr2 = "/ip4/127.0.0.1/tcp/8001".parse::<Multiaddr>().unwrap();

        let config = RelayDiscoveryConfig {
            bootstrap_relays: vec![(peer_id1.clone(), addr1.clone())],
            ..Default::default()
        };

        let manager = RelayDiscoveryManager::new(config);

        // Test bootstrap relay
        let relays = manager.get_relays();
        assert_eq!(relays.len(), 1);
        assert_eq!(relays[0].peer_id, peer_id1);

        // Test adding a relay
        manager.add_relay(peer_id2.clone(), vec![addr2.clone()]);
        let relays = manager.get_relays();
        assert_eq!(relays.len(), 2);

        // Test getting a specific relay
        let relay = manager.get_relay(&peer_id2).unwrap();
        assert_eq!(relay.peer_id, peer_id2);
        assert_eq!(relay.addresses[0], addr2);

        // Test recording success and failure
        manager.record_success(&peer_id1, 50);
        manager.record_failure(&peer_id2);

        // Test getting best relays
        let best_relays = manager.get_best_relays(1);
        assert_eq!(best_relays.len(), 1);
        assert_eq!(best_relays[0].peer_id, peer_id1); // peer_id1 should be better due to success
    }
}