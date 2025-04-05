//! Configuration for the DarkSwap P2P network.

use libp2p::Multiaddr;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Configuration for the DarkSwap P2P network.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Bootstrap peers.
    pub bootstrap_peers: Vec<String>,
    /// Listen addresses.
    pub listen_addresses: Vec<String>,
    /// Dial addresses.
    pub dial_addresses: Vec<String>,
    /// Relay addresses.
    pub relay_addresses: Vec<String>,
    /// Ping interval.
    pub ping_interval: u64,
    /// Ping timeout.
    pub ping_timeout: u64,
    /// Identify interval.
    pub identify_interval: u64,
    /// Identify timeout.
    pub identify_timeout: u64,
    /// Kademlia query timeout.
    pub kademlia_query_timeout: u64,
    /// Kademlia replication factor.
    pub kademlia_replication_factor: u32,
    /// Kademlia record TTL.
    pub kademlia_record_ttl: u64,
    /// Kademlia provider record TTL.
    pub kademlia_provider_record_ttl: u64,
    /// Gossipsub heartbeat interval.
    pub gossipsub_heartbeat_interval: u64,
    /// Gossipsub heartbeat initial delay.
    pub gossipsub_heartbeat_initial_delay: u64,
    /// Gossipsub history length.
    pub gossipsub_history_length: u32,
    /// Gossipsub history gossip.
    pub gossipsub_history_gossip: u32,
    /// Gossipsub mesh n.
    pub gossipsub_mesh_n: u32,
    /// Gossipsub mesh n low.
    pub gossipsub_mesh_n_low: u32,
    /// Gossipsub mesh n high.
    pub gossipsub_mesh_n_high: u32,
    /// Gossipsub retain score.
    pub gossipsub_retain_score: u32,
    /// Gossipsub gossip factor.
    pub gossipsub_gossip_factor: f64,
    /// Gossipsub prune peers.
    pub gossipsub_prune_peers: u32,
    /// Gossipsub prune threshold.
    pub gossipsub_prune_threshold: f64,
    /// Gossipsub d.
    pub gossipsub_d: u32,
    /// Gossipsub d low.
    pub gossipsub_d_low: u32,
    /// Gossipsub d high.
    pub gossipsub_d_high: u32,
    /// Gossipsub d score.
    pub gossipsub_d_score: f64,
    /// Gossipsub d out.
    pub gossipsub_d_out: u32,
    /// Request-response timeout.
    pub request_response_timeout: u64,
    /// Request-response rate limit.
    pub request_response_rate_limit: u32,
    /// Request-response concurrency limit.
    pub request_response_concurrency_limit: u32,
    /// Circuit relay enabled.
    pub circuit_relay_enabled: bool,
    /// Circuit relay hop enabled.
    pub circuit_relay_hop_enabled: bool,
    /// Circuit relay active connections.
    pub circuit_relay_active_connections: u32,
    /// Circuit relay max connections.
    pub circuit_relay_max_connections: u32,
    /// Circuit relay buffer size.
    pub circuit_relay_buffer_size: u32,
    /// Circuit relay max circuit duration.
    pub circuit_relay_max_circuit_duration: u64,
    /// Circuit relay max circuit bytes.
    pub circuit_relay_max_circuit_bytes: u64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            bootstrap_peers: vec![],
            listen_addresses: vec!["/ip4/0.0.0.0/tcp/0".to_string()],
            dial_addresses: vec![],
            relay_addresses: vec![],
            ping_interval: 30,
            ping_timeout: 10,
            identify_interval: 300,
            identify_timeout: 10,
            kademlia_query_timeout: 300,
            kademlia_replication_factor: 20,
            kademlia_record_ttl: 36000,
            kademlia_provider_record_ttl: 36000,
            gossipsub_heartbeat_interval: 1,
            gossipsub_heartbeat_initial_delay: 0,
            gossipsub_history_length: 5,
            gossipsub_history_gossip: 3,
            gossipsub_mesh_n: 6,
            gossipsub_mesh_n_low: 4,
            gossipsub_mesh_n_high: 12,
            gossipsub_retain_score: 4,
            gossipsub_gossip_factor: 0.25,
            gossipsub_prune_peers: 16,
            gossipsub_prune_threshold: 0.2,
            gossipsub_d: 6,
            gossipsub_d_low: 4,
            gossipsub_d_high: 12,
            gossipsub_d_score: 0.5,
            gossipsub_d_out: 2,
            request_response_timeout: 10,
            request_response_rate_limit: 100,
            request_response_concurrency_limit: 100,
            circuit_relay_enabled: true,
            circuit_relay_hop_enabled: false,
            circuit_relay_active_connections: 2,
            circuit_relay_max_connections: 4,
            circuit_relay_buffer_size: 2048,
            circuit_relay_max_circuit_duration: 300,
            circuit_relay_max_circuit_bytes: 1024 * 1024,
        }
    }
}

impl Config {
    /// Create a new configuration.
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a bootstrap peer.
    pub fn add_bootstrap_peer(&mut self, peer: String) {
        self.bootstrap_peers.push(peer);
    }

    /// Add a listen address.
    pub fn add_listen_address(&mut self, addr: String) {
        self.listen_addresses.push(addr);
    }

    /// Add a dial address.
    pub fn add_dial_address(&mut self, addr: String) {
        self.dial_addresses.push(addr);
    }

    /// Add a relay address.
    pub fn add_relay_address(&mut self, addr: String) {
        self.relay_addresses.push(addr);
    }

    /// Set the ping interval.
    pub fn set_ping_interval(&mut self, interval: u64) {
        self.ping_interval = interval;
    }

    /// Set the ping timeout.
    pub fn set_ping_timeout(&mut self, timeout: u64) {
        self.ping_timeout = timeout;
    }

    /// Set the identify interval.
    pub fn set_identify_interval(&mut self, interval: u64) {
        self.identify_interval = interval;
    }

    /// Set the identify timeout.
    pub fn set_identify_timeout(&mut self, timeout: u64) {
        self.identify_timeout = timeout;
    }

    /// Set the Kademlia query timeout.
    pub fn set_kademlia_query_timeout(&mut self, timeout: u64) {
        self.kademlia_query_timeout = timeout;
    }

    /// Set the Kademlia replication factor.
    pub fn set_kademlia_replication_factor(&mut self, factor: u32) {
        self.kademlia_replication_factor = factor;
    }

    /// Set the Kademlia record TTL.
    pub fn set_kademlia_record_ttl(&mut self, ttl: u64) {
        self.kademlia_record_ttl = ttl;
    }

    /// Set the Kademlia provider record TTL.
    pub fn set_kademlia_provider_record_ttl(&mut self, ttl: u64) {
        self.kademlia_provider_record_ttl = ttl;
    }

    /// Set the Gossipsub heartbeat interval.
    pub fn set_gossipsub_heartbeat_interval(&mut self, interval: u64) {
        self.gossipsub_heartbeat_interval = interval;
    }

    /// Set the Gossipsub heartbeat initial delay.
    pub fn set_gossipsub_heartbeat_initial_delay(&mut self, delay: u64) {
        self.gossipsub_heartbeat_initial_delay = delay;
    }

    /// Set the Gossipsub history length.
    pub fn set_gossipsub_history_length(&mut self, length: u32) {
        self.gossipsub_history_length = length;
    }

    /// Set the Gossipsub history gossip.
    pub fn set_gossipsub_history_gossip(&mut self, gossip: u32) {
        self.gossipsub_history_gossip = gossip;
    }

    /// Set the Gossipsub mesh n.
    pub fn set_gossipsub_mesh_n(&mut self, n: u32) {
        self.gossipsub_mesh_n = n;
    }

    /// Set the Gossipsub mesh n low.
    pub fn set_gossipsub_mesh_n_low(&mut self, n: u32) {
        self.gossipsub_mesh_n_low = n;
    }

    /// Set the Gossipsub mesh n high.
    pub fn set_gossipsub_mesh_n_high(&mut self, n: u32) {
        self.gossipsub_mesh_n_high = n;
    }

    /// Set the Gossipsub retain score.
    pub fn set_gossipsub_retain_score(&mut self, score: u32) {
        self.gossipsub_retain_score = score;
    }

    /// Set the Gossipsub gossip factor.
    pub fn set_gossipsub_gossip_factor(&mut self, factor: f64) {
        self.gossipsub_gossip_factor = factor;
    }

    /// Set the Gossipsub prune peers.
    pub fn set_gossipsub_prune_peers(&mut self, peers: u32) {
        self.gossipsub_prune_peers = peers;
    }

    /// Set the Gossipsub prune threshold.
    pub fn set_gossipsub_prune_threshold(&mut self, threshold: f64) {
        self.gossipsub_prune_threshold = threshold;
    }

    /// Set the Gossipsub d.
    pub fn set_gossipsub_d(&mut self, d: u32) {
        self.gossipsub_d = d;
    }

    /// Set the Gossipsub d low.
    pub fn set_gossipsub_d_low(&mut self, d: u32) {
        self.gossipsub_d_low = d;
    }

    /// Set the Gossipsub d high.
    pub fn set_gossipsub_d_high(&mut self, d: u32) {
        self.gossipsub_d_high = d;
    }

    /// Set the Gossipsub d score.
    pub fn set_gossipsub_d_score(&mut self, score: f64) {
        self.gossipsub_d_score = score;
    }

    /// Set the Gossipsub d out.
    pub fn set_gossipsub_d_out(&mut self, d: u32) {
        self.gossipsub_d_out = d;
    }

    /// Set the request-response timeout.
    pub fn set_request_response_timeout(&mut self, timeout: u64) {
        self.request_response_timeout = timeout;
    }

    /// Set the request-response rate limit.
    pub fn set_request_response_rate_limit(&mut self, limit: u32) {
        self.request_response_rate_limit = limit;
    }

    /// Set the request-response concurrency limit.
    pub fn set_request_response_concurrency_limit(&mut self, limit: u32) {
        self.request_response_concurrency_limit = limit;
    }

    /// Set the circuit relay enabled flag.
    pub fn set_circuit_relay_enabled(&mut self, enabled: bool) {
        self.circuit_relay_enabled = enabled;
    }

    /// Set the circuit relay hop enabled flag.
    pub fn set_circuit_relay_hop_enabled(&mut self, enabled: bool) {
        self.circuit_relay_hop_enabled = enabled;
    }

    /// Set the circuit relay active connections.
    pub fn set_circuit_relay_active_connections(&mut self, connections: u32) {
        self.circuit_relay_active_connections = connections;
    }

    /// Set the circuit relay max connections.
    pub fn set_circuit_relay_max_connections(&mut self, connections: u32) {
        self.circuit_relay_max_connections = connections;
    }

    /// Set the circuit relay buffer size.
    pub fn set_circuit_relay_buffer_size(&mut self, size: u32) {
        self.circuit_relay_buffer_size = size;
    }

    /// Set the circuit relay max circuit duration.
    pub fn set_circuit_relay_max_circuit_duration(&mut self, duration: u64) {
        self.circuit_relay_max_circuit_duration = duration;
    }

    /// Set the circuit relay max circuit bytes.
    pub fn set_circuit_relay_max_circuit_bytes(&mut self, bytes: u64) {
        self.circuit_relay_max_circuit_bytes = bytes;
    }
}