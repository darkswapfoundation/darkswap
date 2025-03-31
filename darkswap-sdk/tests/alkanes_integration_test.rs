//! Integration tests for alkanes functionality
//!
//! This module provides integration tests for the alkanes functionality in DarkSwap.

use anyhow::Result;
use bitcoin::{Network, Transaction};
use rust_decimal::Decimal;
use std::sync::Arc;
use tokio::sync::mpsc;

use darkswap_sdk::{
    alkanes::{Alkane, AlkaneId},
    config::{BitcoinNetwork, Config},
    orderbook::{Order, OrderSide, OrderStatus},
    p2p::P2PNetwork,
    types::{Asset, Event},
    wallet::simple_wallet::SimpleWallet,
    DarkSwap,
};

/// Test creating an alkane
#[tokio::test]
async fn test_create_alkane() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create an alkane
    let alkane = Alkane::new(alkane_id.clone(), "TestAlkane", 1000000);
    
    // Verify alkane properties
    assert_eq!(alkane.id, alkane_id);
    assert_eq!(alkane.name, "TestAlkane");
    assert_eq!(alkane.supply, 1000000);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating an alkane etching transaction
#[tokio::test]
async fn test_create_alkane_etching_transaction() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create an alkane
    let alkane = Alkane::new(alkane_id.clone(), "TestAlkane", 1000000);
    
    // Create metadata
    let mut metadata = std::collections::HashMap::new();
    metadata.insert("description".to_string(), "A test alkane for DarkSwap".to_string());
    
    // Create an etching transaction
    let tx = alkane.create_etching_transaction(
        &address,
        &metadata,
        None,
        Network::Regtest,
    )?;
    
    // Verify transaction properties
    assert!(tx.output.len() > 0);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating an alkane transfer transaction
#[tokio::test]
async fn test_create_alkane_transfer_transaction() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create an alkane
    let alkane = Alkane::new(alkane_id.clone(), "TestAlkane", 1000000);
    
    // Create a transfer transaction
    let tx = alkane.create_transfer_transaction(
        &address,
        &address,
        1000,
        Network::Regtest,
    )?;
    
    // Verify transaction properties
    assert!(tx.output.len() > 0);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating a BTC/Alkane order
#[tokio::test]
async fn test_create_btc_alkane_order() -> Result<()> {
    // Create event channel
    let (event_sender, _) = mpsc::channel(100);
    
    // Create network
    let config = Config::default();
    let network = Arc::new(tokio::sync::RwLock::new(P2PNetwork::new(&config, event_sender.clone())?));
    
    // Create wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Regtest)?);
    
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create a BTC/Alkane order
    let order = darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 alkanes
        Decimal::new(1, 5),    // 0.00001 BTC per alkane
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Verify order properties
    assert_eq!(order.base_asset, Asset::Alkane(alkane_id));
    assert_eq!(order.quote_asset, Asset::Bitcoin);
    assert_eq!(order.side, OrderSide::Buy);
    assert_eq!(order.amount, Decimal::new(100, 0));
    assert_eq!(order.price, Decimal::new(1, 5));
    assert_eq!(order.status, OrderStatus::Open);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test getting BTC/Alkane orders
#[tokio::test]
async fn test_get_btc_alkane_orders() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create a BTC/Alkane order
    let order = darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 alkanes
        Decimal::new(1, 5),    // 0.00001 BTC per alkane
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Get BTC/Alkane orders
    let orders = darkswap.get_btc_alkane_orders(&alkane_id).await?;
    
    // Verify orders
    assert_eq!(orders.len(), 1);
    assert_eq!(orders[0].id, order.id);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test getting best bid and ask for BTC/Alkane
#[tokio::test]
async fn test_get_btc_alkane_best_bid_ask() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create a BTC/Alkane buy order
    darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 alkanes
        Decimal::new(1, 5),    // 0.00001 BTC per alkane
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Create a BTC/Alkane sell order
    darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Sell,
        Decimal::new(200, 0),  // 200 alkanes
        Decimal::new(2, 5),    // 0.00002 BTC per alkane
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Get best bid and ask
    let (bid, ask) = darkswap.get_btc_alkane_best_bid_ask(&alkane_id).await?;
    
    // Verify bid and ask
    assert_eq!(bid, Some(Decimal::new(1, 5)));
    assert_eq!(ask, Some(Decimal::new(2, 5)));
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test cancelling a BTC/Alkane order
#[tokio::test]
async fn test_cancel_btc_alkane_order() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create a BTC/Alkane order
    let order = darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 alkanes
        Decimal::new(1, 5),    // 0.00001 BTC per alkane
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Cancel the order
    darkswap.cancel_order(&order.id).await?;
    
    // Get the order
    let canceled_order = darkswap.get_order(&order.id).await?;
    
    // Verify order status
    assert_eq!(canceled_order.status, OrderStatus::Canceled);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}