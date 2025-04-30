//! Example of using the DarkSwap Bridge integration
//!
//! This example demonstrates how to use the DarkSwap Bridge integration
//! to interact with the DarkSwap Bridge.

use darkswap_sdk::bridge_integration::{BridgeConfig, BridgeIntegration, OrderType};
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize logger
    env_logger::init();
    
    // Create bridge configuration
    let config = BridgeConfig {
        bridge_path: "darkswap-bridge".to_string(),
        storage_dir: "./storage".to_string(),
        run_as_server: true,
        log_level: "info".to_string(),
    };
    
    // Create bridge integration
    let mut bridge = BridgeIntegration::new(config);
    
    // Start bridge
    println!("Starting bridge...");
    bridge.start().await?;
    
    // Check if bridge is running
    if bridge.is_running() {
        println!("Bridge is running");
    } else {
        println!("Bridge is not running");
        return Ok(());
    }
    
    // Create wallet
    println!("Creating wallet...");
    bridge.create_wallet("my_wallet", "my_passphrase").await?;
    
    // Open wallet
    println!("Opening wallet...");
    bridge.open_wallet("my_wallet", "my_passphrase").await?;
    
    // Get wallet status
    println!("Getting wallet status...");
    let status = bridge.get_wallet_status().await?;
    println!("Wallet status: {:?}", status);
    
    // Get wallet balance
    println!("Getting wallet balance...");
    let balance = bridge.get_wallet_balance().await?;
    println!("Wallet balance: {} confirmed, {} unconfirmed", balance.confirmed, balance.unconfirmed);
    
    // Create address
    println!("Creating address...");
    let address = bridge.create_address().await?;
    println!("Address: {}", address);
    
    // Connect to peer
    println!("Connecting to peer...");
    bridge.connect_peer("peer1.example.com:8333").await?;
    
    // Get network status
    println!("Getting network status...");
    let status = bridge.get_network_status().await?;
    println!("Network status: {:?}", status);
    
    // Get connected peers
    println!("Getting connected peers...");
    let peers = bridge.get_peers().await?;
    println!("Connected peers: {:?}", peers);
    
    // Create order
    println!("Creating order...");
    let order_id = bridge.create_order(
        OrderType::Buy,
        "BTC",
        100000, // 0.001 BTC
        "RUNE",
        10000000, // 100 RUNE
    ).await?;
    println!("Order created: {}", order_id);
    
    // Get orders
    println!("Getting orders...");
    let orders = bridge.get_orders().await?;
    println!("Orders: {:?}", orders);
    
    // Take order
    println!("Taking order...");
    let trade_id = bridge.take_order(&order_id).await?;
    println!("Trade created: {}", trade_id);
    
    // Get trades
    println!("Getting trades...");
    let trades = bridge.get_trades().await?;
    println!("Trades: {:?}", trades);
    
    // Accept trade
    println!("Accepting trade...");
    bridge.accept_trade(&trade_id).await?;
    
    // Execute trade
    println!("Executing trade...");
    let txid = bridge.execute_trade(&trade_id).await?;
    println!("Transaction created: {}", txid);
    
    // Confirm trade
    println!("Confirming trade...");
    bridge.confirm_trade(&trade_id).await?;
    
    // Close wallet
    println!("Closing wallet...");
    bridge.close_wallet().await?;
    
    // Stop bridge
    println!("Stopping bridge...");
    bridge.stop().await?;
    
    println!("Example completed successfully");
    
    Ok(())
}