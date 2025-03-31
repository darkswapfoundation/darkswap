#[macro_use]
extern crate criterion;

use criterion::{black_box, Criterion, BenchmarkId};
use darkswap_sdk::{DarkSwap, config::Config};
use std::time::Duration;
use tokio::runtime::Runtime;

fn bench_peer_connection(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("peer_connection");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("direct_connection", |b| {
        b.iter(|| {
            rt.block_on(async {
                // Initialize two nodes with different ports
                let mut config1 = Config::default();
                config1.network.listen_port = 20000;
                
                let mut config2 = Config::default();
                config2.network.listen_port = 20001;
                
                let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
                let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
                
                // Start nodes
                node1.start().await.expect("Failed to start first node");
                node2.start().await.expect("Failed to start second node");
                
                // Get peer ID and address of second node
                let peer_id2 = node2.peer_id();
                let addrs2 = node2.listen_addresses().await.expect("Failed to get listen addresses");
                let addr2 = addrs2.first().expect("No listen addresses").clone();
                
                // Connect first node to second node
                node1.connect_peer(peer_id2, addr2).await.expect("Failed to connect to peer");
                
                // Verify connection
                let connected_peers = node1.connected_peers().await;
                assert!(connected_peers.contains(&peer_id2), "Peer connection failed");
                
                // Disconnect
                node1.disconnect_peer(peer_id2).await.expect("Failed to disconnect from peer");
                
                // Shutdown nodes
                node1.shutdown().await.expect("Failed to shutdown first node");
                node2.shutdown().await.expect("Failed to shutdown second node");
            });
        });
    });
    
    group.finish();
}

fn bench_message_broadcast(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("message_broadcast");
    group.measurement_time(Duration::from_secs(10));
    
    for num_nodes in [3, 5, 10].iter() {
        group.bench_with_input(BenchmarkId::new("nodes", num_nodes), num_nodes, |b, &num_nodes| {
            b.iter(|| {
                rt.block_on(async {
                    // Initialize nodes
                    let mut nodes = Vec::with_capacity(num_nodes);
                    for i in 0..num_nodes {
                        let mut config = Config::default();
                        config.network.listen_port = 20100 + i as u16;
                        let mut node = DarkSwap::new(config).expect("Failed to create node");
                        node.start().await.expect("Failed to start node");
                        nodes.push(node);
                    }
                    
                    // Connect nodes in a ring topology
                    for i in 0..num_nodes {
                        let next_i = (i + 1) % num_nodes;
                        let peer_id = nodes[next_i].peer_id();
                        let addrs = nodes[next_i].listen_addresses().await.expect("Failed to get listen addresses");
                        let addr = addrs.first().expect("No listen addresses").clone();
                        nodes[i].connect_peer(peer_id, addr).await.expect("Failed to connect to peer");
                    }
                    
                    // Broadcast a message from the first node
                    let message = b"Hello, world!".to_vec();
                    nodes[0].broadcast_message(message).await.expect("Failed to broadcast message");
                    
                    // Wait for message propagation (in a real benchmark, we would use a callback or event)
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    
                    // Shutdown nodes
                    for mut node in nodes {
                        node.shutdown().await.expect("Failed to shutdown node");
                    }
                });
            });
        });
    }
    
    group.finish();
}

fn bench_relay_connection(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("relay_connection");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("via_relay", |b| {
        b.iter(|| {
            rt.block_on(async {
                // Initialize relay node
                let mut relay_config = Config::default();
                relay_config.network.listen_port = 20200;
                relay_config.network.enable_relay = true;
                relay_config.network.max_relay_connections = 10;
                
                // Initialize two nodes behind simulated NATs
                let mut config1 = Config::default();
                config1.network.listen_port = 20201;
                config1.network.behind_nat = true;
                config1.network.relay_addresses = vec!["/ip4/127.0.0.1/tcp/20200".parse().expect("Invalid relay address")];
                
                let mut config2 = Config::default();
                config2.network.listen_port = 20202;
                config2.network.behind_nat = true;
                config2.network.relay_addresses = vec!["/ip4/127.0.0.1/tcp/20200".parse().expect("Invalid relay address")];
                
                // Create nodes
                let mut relay_node = DarkSwap::new(relay_config).expect("Failed to create relay node");
                let mut node1 = DarkSwap::new(config1).expect("Failed to create first node");
                let mut node2 = DarkSwap::new(config2).expect("Failed to create second node");
                
                // Start nodes
                relay_node.start().await.expect("Failed to start relay node");
                node1.start().await.expect("Failed to start first node");
                node2.start().await.expect("Failed to start second node");
                
                // Wait for nodes to connect to relay
                tokio::time::sleep(Duration::from_millis(100)).await;
                
                // Get peer IDs
                let relay_peer_id = relay_node.peer_id();
                let peer_id1 = node1.peer_id();
                let peer_id2 = node2.peer_id();
                
                // Connect node1 to node2 via relay
                node1.connect_peer_via_relay(peer_id2, relay_peer_id).await.expect("Failed to connect via relay");
                
                // Verify connection
                let connected_peers1 = node1.connected_peers().await;
                assert!(connected_peers1.contains(&peer_id2), "Node 1 not connected to Node 2");
                
                // Shutdown nodes
                node1.shutdown().await.expect("Failed to shutdown first node");
                node2.shutdown().await.expect("Failed to shutdown second node");
                relay_node.shutdown().await.expect("Failed to shutdown relay node");
            });
        });
    });
    
    group.finish();
}

criterion_group!(
    benches,
    bench_peer_connection,
    bench_message_broadcast,
    bench_relay_connection
);
criterion_main!(benches);