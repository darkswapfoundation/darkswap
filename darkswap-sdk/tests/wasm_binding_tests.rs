//! Tests for the WebAssembly bindings

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    wasm::{DarkSwapWasm, WasmConfig},
};
use std::sync::Arc;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_wasm_initialization() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Check that DarkSwapWasm is initialized
    assert!(darkswap.is_initialized());
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    // Check that DarkSwapWasm is not initialized
    assert!(!darkswap.is_initialized());
    
    Ok(())
}

#[wasm_bindgen_test]
async fn test_wasm_wallet_operations() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    
    // Check that address is not empty
    assert!(!address.is_empty());
    
    // Check that address starts with a valid prefix for testnet
    assert!(address.starts_with("tb1") || address.starts_with("2") || address.starts_with("m") || address.starts_with("n"));
    
    // Get wallet balance
    let balance = darkswap.get_balance().await?;
    
    // Check that balance is a valid number
    assert!(balance >= 0);
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[wasm_bindgen_test]
async fn test_wasm_order_operations() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Create an order
    let order_id = darkswap.create_order(
        "buy",
        "BTC",
        "USD",
        "1.0",
        "20000.0",
        None,
    ).await?;
    
    // Check that order ID is not empty
    assert!(!order_id.is_empty());
    
    // Get the order
    let order = darkswap.get_order(&order_id).await?;
    
    // Check that the order is valid
    assert_eq!(order.id, order_id);
    assert_eq!(order.side, "buy");
    assert_eq!(order.base_asset, "BTC");
    assert_eq!(order.quote_asset, "USD");
    assert_eq!(order.amount, "1.0");
    assert_eq!(order.price, "20000.0");
    assert_eq!(order.status, "open");
    
    // Cancel the order
    darkswap.cancel_order(&order_id).await?;
    
    // Get the order again
    let order = darkswap.get_order(&order_id).await?;
    
    // Check that the order is canceled
    assert_eq!(order.status, "canceled");
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[wasm_bindgen_test]
async fn test_wasm_trade_operations() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Create an order
    let order_id = darkswap.create_order(
        "buy",
        "BTC",
        "USD",
        "1.0",
        "20000.0",
        None,
    ).await?;
    
    // Create a trade
    let trade_id = darkswap.create_trade(&order_id).await?;
    
    // Check that trade ID is not empty
    assert!(!trade_id.is_empty());
    
    // Get the trade
    let trade = darkswap.get_trade(&trade_id).await?;
    
    // Check that the trade is valid
    assert_eq!(trade.id, trade_id);
    assert_eq!(trade.order_id, order_id);
    assert_eq!(trade.status, "pending");
    
    // Accept the trade
    darkswap.accept_trade(&trade_id).await?;
    
    // Get the trade again
    let trade = darkswap.get_trade(&trade_id).await?;
    
    // Check that the trade is accepted
    assert_eq!(trade.status, "accepted");
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[wasm_bindgen_test]
async fn test_wasm_event_handling() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Create an event handler
    let events = Arc::new(std::sync::Mutex::new(Vec::new()));
    let events_clone = events.clone();
    
    // Register the event handler
    darkswap.on_event(move |event| {
        let mut events = events_clone.lock().unwrap();
        events.push(event.to_string());
    });
    
    // Create an order (this should trigger an event)
    let order_id = darkswap.create_order(
        "buy",
        "BTC",
        "USD",
        "1.0",
        "20000.0",
        None,
    ).await?;
    
    // Wait for the event to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the event was received
    let events = events.lock().unwrap();
    assert!(!events.is_empty());
    assert!(events[0].contains("order_created") || events[0].contains("OrderCreated"));
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[wasm_bindgen_test]
async fn test_wasm_error_handling() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Try to get wallet address without initializing
    let result = darkswap.get_address().await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error message is correct
    let err = result.unwrap_err();
    let err_string = err.to_string();
    assert!(err_string.contains("not initialized") || err_string.contains("Not initialized"));
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Try to get a non-existent order
    let result = darkswap.get_order("non_existent_order").await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error message is correct
    let err = result.unwrap_err();
    let err_string = err.to_string();
    assert!(err_string.contains("not found") || err_string.contains("Not found"));
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[wasm_bindgen_test]
async fn test_wasm_memory_usage() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Create a large number of orders to test memory usage
    for i in 0..10 {
        let order_id = darkswap.create_order(
            "buy",
            "BTC",
            "USD",
            &format!("{}.0", i + 1),
            &format!("{}000.0", i + 2),
            None,
        ).await?;
        
        // Check that order ID is not empty
        assert!(!order_id.is_empty());
    }
    
    // Get all orders
    let orders = darkswap.get_orders(None, None, None, None, None, None).await?;
    
    // Check that all orders were created
    assert_eq!(orders.len(), 10);
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}