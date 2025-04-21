use darkswap_p2p::{
    relay_discovery::{RelayDiscoveryManager, RelayDiscoveryConfig, RelayInfo},
};
use libp2p::{Multiaddr, PeerId};
use std::time::Duration;

#[tokio::test]
async fn test_relay_discovery_basic() {
    // Create a relay discovery configuration
    let config = RelayDiscoveryConfig {
        bootstrap_relays: vec![],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create a relay discovery manager
    let manager = RelayDiscoveryManager::new(config);
    
    // Create some test relays
    let peer_id1 = PeerId::random();
    let peer_id2 = PeerId::random();
    let addr1 = "/ip4/127.0.0.1/tcp/9002".parse::<Multiaddr>().unwrap();
    let addr2 = "/ip4/127.0.0.1/tcp/9003".parse::<Multiaddr>().unwrap();
    
    // Add the relays
    manager.add_relay(peer_id1.clone(), vec![addr1.clone()]);
    manager.add_relay(peer_id2.clone(), vec![addr2.clone()]);
    
    // Check that the relays are in the manager
    let relays = manager.get_relays();
    assert_eq!(relays.len(), 2);
    
    // Get a specific relay
    let relay = manager.get_relay(&peer_id1);
    assert!(relay.is_some());
    assert_eq!(relay.unwrap().peer_id, peer_id1);
    
    // Record success and failure
    manager.record_success(&peer_id1, 50);
    manager.record_failure(&peer_id2);
    
    // Get the best relays
    let best_relays = manager.get_best_relays(1);
    assert_eq!(best_relays.len(), 1);
    assert_eq!(best_relays[0].peer_id, peer_id1);
}

#[tokio::test]
async fn test_relay_discovery_bootstrap() {
    // Create some test relays
    let peer_id1 = PeerId::random();
    let peer_id2 = PeerId::random();
    let addr1 = "/ip4/127.0.0.1/tcp/9002".parse::<Multiaddr>().unwrap();
    let addr2 = "/ip4/127.0.0.1/tcp/9003".parse::<Multiaddr>().unwrap();
    
    // Create a relay discovery configuration with bootstrap relays
    let config = RelayDiscoveryConfig {
        bootstrap_relays: vec![
            (peer_id1.clone(), addr1.clone()),
            (peer_id2.clone(), addr2.clone()),
        ],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create a relay discovery manager
    let manager = RelayDiscoveryManager::new(config);
    
    // Check that the bootstrap relays are in the manager
    let relays = manager.get_relays();
    assert_eq!(relays.len(), 2);
    
    // Get the bootstrap relays
    let relay1 = manager.get_relay(&peer_id1);
    let relay2 = manager.get_relay(&peer_id2);
    assert!(relay1.is_some());
    assert!(relay2.is_some());
    assert_eq!(relay1.unwrap().peer_id, peer_id1);
    assert_eq!(relay2.unwrap().peer_id, peer_id2);
}

#[tokio::test]
async fn test_relay_discovery_pruning() {
    // Create a relay discovery configuration with a small max_relays
    let config = RelayDiscoveryConfig {
        bootstrap_relays: vec![],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 2,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create a relay discovery manager
    let manager = RelayDiscoveryManager::new(config);
    
    // Add several relays
    for i in 0..5 {
        let peer_id = PeerId::random();
        let addr = format!("/ip4/127.0.0.1/tcp/900{}", i).parse::<Multiaddr>().unwrap();
        manager.add_relay(peer_id, vec![addr]);
    }
    
    // Check that the manager has been pruned to max_relays
    let relays = manager.get_relays();
    assert_eq!(relays.len(), 2);
}

#[tokio::test]
async fn test_relay_info_scoring() {
    // Create some test relays with different characteristics
    let peer_id1 = PeerId::random();
    let peer_id2 = PeerId::random();
    let peer_id3 = PeerId::random();
    
    let addr1 = "/ip4/127.0.0.1/tcp/9001".parse::<Multiaddr>().unwrap();
    let addr2 = "/ip4/127.0.0.1/tcp/9002".parse::<Multiaddr>().unwrap();
    let addr3 = "/ip4/127.0.0.1/tcp/9003".parse::<Multiaddr>().unwrap();
    
    // Create a relay discovery configuration
    let config = RelayDiscoveryConfig {
        bootstrap_relays: vec![],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_secs(3600),
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create a relay discovery manager
    let manager = RelayDiscoveryManager::new(config);
    
    // Add the relays
    manager.add_relay(peer_id1.clone(), vec![addr1.clone()]);
    manager.add_relay(peer_id2.clone(), vec![addr2.clone()]);
    manager.add_relay(peer_id3.clone(), vec![addr3.clone()]);
    
    // Record different performance characteristics
    
    // Relay 1: Good performance (low latency, high success rate)
    for _ in 0..10 {
        manager.record_success(&peer_id1, 50);
    }
    
    // Relay 2: Medium performance (medium latency, some failures)
    for _ in 0..7 {
        manager.record_success(&peer_id2, 150);
    }
    for _ in 0..3 {
        manager.record_failure(&peer_id2);
    }
    
    // Relay 3: Poor performance (high latency, many failures)
    for _ in 0..3 {
        manager.record_success(&peer_id3, 300);
    }
    for _ in 0..7 {
        manager.record_failure(&peer_id3);
    }
    
    // Get the best relays
    let best_relays = manager.get_best_relays(3);
    assert_eq!(best_relays.len(), 3);
    
    // Check that the relays are ordered by score (best first)
    assert_eq!(best_relays[0].peer_id, peer_id1);
    assert_eq!(best_relays[1].peer_id, peer_id2);
    assert_eq!(best_relays[2].peer_id, peer_id3);
    
    // Check the scores
    assert!(best_relays[0].score() > best_relays[1].score());
    assert!(best_relays[1].score() > best_relays[2].score());
}

#[tokio::test]
async fn test_relay_info_expiration() {
    // Create a relay with a very short TTL
    let config = RelayDiscoveryConfig {
        bootstrap_relays: vec![],
        dht_query_interval: Duration::from_secs(300),
        relay_ttl: Duration::from_millis(100), // Very short TTL for testing
        max_relays: 10,
        enable_dht_discovery: false,
        enable_mdns_discovery: false,
    };
    
    // Create a relay discovery manager
    let manager = RelayDiscoveryManager::new(config);
    
    // Add a relay
    let peer_id = PeerId::random();
    let addr = "/ip4/127.0.0.1/tcp/9001".parse::<Multiaddr>().unwrap();
    manager.add_relay(peer_id.clone(), vec![addr]);
    
    // Check that the relay is in the manager
    let relays = manager.get_relays();
    assert_eq!(relays.len(), 1);
    
    // Wait for the TTL to expire
    tokio::time::sleep(Duration::from_millis(200)).await;
    
    // Prune expired relays
    manager.prune_relays();
    
    // Check that the relay has been pruned
    let relays = manager.get_relays();
    assert_eq!(relays.len(), 0);
}