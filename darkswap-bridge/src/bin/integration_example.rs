//! Example application that uses the DarkSwap bridge integration.
//!
//! This binary demonstrates how to use the integration manager to interact with
//! the wallet and network components.

use darkswap_bridge::{
    BridgeMessage, IntegrationManager, NetworkMessage, NetworkResponseData, SystemMessage,
    WalletMessage, WalletResponseData,
};
use log::{debug, error, info, warn};
use std::env;
use std::process::exit;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();

    info!("Starting DarkSwap integration example");

    // Create an integration manager
    let mut manager = IntegrationManager::new()?;

    // Start the integration manager
    manager.start()?;

    info!("Integration manager started");

    // Start a task to receive messages
    let mut manager_clone = manager.clone();
    tokio::spawn(async move {
        loop {
            match manager_clone.receive_message().await {
                Ok(message) => {
                    match message {
                        BridgeMessage::Wallet(WalletMessage::Response { request_id, data }) => {
                            match data {
                                WalletResponseData::Success => {
                                    info!("Wallet request {} succeeded", request_id);
                                }
                                WalletResponseData::Error(error) => {
                                    error!("Wallet request {} failed: {}", request_id, error);
                                }
                                WalletResponseData::Balance { confirmed, unconfirmed } => {
                                    info!(
                                        "Wallet balance: confirmed={}, unconfirmed={}",
                                        confirmed, unconfirmed
                                    );
                                }
                                WalletResponseData::Address(address) => {
                                    info!("Wallet address: {}", address);
                                }
                                WalletResponseData::Transaction(transaction) => {
                                    info!("Wallet transaction: {} bytes", transaction.len());
                                }
                                WalletResponseData::TransactionId(txid) => {
                                    info!("Wallet transaction ID: {}", txid);
                                }
                            }
                        }
                        BridgeMessage::Network(NetworkMessage::Response { request_id, data }) => {
                            match data {
                                NetworkResponseData::Success => {
                                    info!("Network request {} succeeded", request_id);
                                }
                                NetworkResponseData::Error(error) => {
                                    error!("Network request {} failed: {}", request_id, error);
                                }
                                NetworkResponseData::Peers(peers) => {
                                    info!("Connected peers: {:?}", peers);
                                }
                                NetworkResponseData::Message { address, message } => {
                                    info!(
                                        "Received message from {}: {} bytes",
                                        address,
                                        message.len()
                                    );
                                }
                            }
                        }
                        BridgeMessage::System(SystemMessage::Pong) => {
                            info!("Received pong");
                        }
                        _ => {
                            debug!("Received message: {:?}", message);
                        }
                    }
                }
                Err(e) => {
                    error!("Error receiving message: {}", e);
                    break;
                }
            }
        }
    });

    // Create a wallet
    info!("Creating wallet");
    manager.create_wallet("my_wallet", "password123").await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Get the balance
    info!("Getting wallet balance");
    manager.get_balance("my_wallet").await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Create an address
    info!("Creating wallet address");
    manager.create_address("my_wallet").await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Connect to a peer
    info!("Connecting to peer");
    manager.connect_to_peer("peer1.example.com:8333").await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Get the list of peers
    info!("Getting list of peers");
    manager.get_peers().await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Send a message to a peer
    info!("Sending message to peer");
    manager
        .send_message_to_peer("peer1.example.com:8333", b"Hello, world!")
        .await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Broadcast a message
    info!("Broadcasting message");
    manager.broadcast_message(b"Hello, everyone!").await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Ping the system
    info!("Pinging system");
    manager.ping().await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Close the wallet
    info!("Closing wallet");
    manager.close_wallet("my_wallet").await?;

    // Wait for a bit
    sleep(Duration::from_secs(1)).await;

    // Disconnect from the peer
    info!("Disconnecting from peer");
    manager.disconnect_from_peer("peer1.example.com:8333").await?;

    // Wait for a bit
    sleep(Duration::from_secs(5)).await;

    // Stop the integration manager
    info!("Stopping integration manager");
    manager.stop()?;

    info!("Integration example completed");

    Ok(())
}