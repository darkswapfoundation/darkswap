//! Integration tests for runes functionality
//!
//! This module provides integration tests for the runes functionality in DarkSwap.

use anyhow::Result;
use bitcoin::{Network, Transaction};
use rust_decimal::Decimal;
use std::sync::Arc;
use tokio::sync::mpsc;

use darkswap_sdk::{
    config::{BitcoinNetwork, Config},
    orderbook::{Order, OrderSide, OrderStatus},
    p2p::P2PNetwork,
    runes::{Rune, RuneId, Runestone},
    types::{Asset, Event},
    wallet::simple_wallet::SimpleWallet,
    DarkSwap,
};

/// Test creating a rune
#[tokio::test]
async fn test_create_rune() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create a rune
    let rune_id = 123456789;
    let rune = Rune::new(rune_id, "TestRune", 1000000);
    
    // Verify rune properties
    assert_eq!(rune.id, rune_id);
    assert_eq!(rune.name, "TestRune");
    assert_eq!(rune.supply, 1000000);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating a runestone
#[tokio::test]
async fn test_create_runestone() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create a runestone
    let runestone = Runestone::default();
    
    // Verify runestone properties
    assert_eq!(runestone.edicts.len(), 0);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating a rune etching transaction
#[tokio::test]
async fn test_create_etching_transaction() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    
    // Create a rune
    let rune_id = 123456789;
    let rune = Rune::new(rune_id, "TestRune", 1000000);
    
    // Create a runestone
    let mut runestone = Runestone::default();
    runestone.add_edict(0, rune_id, 1000000);
    
    // Create an etching transaction
    let tx = runestone.create_etching_transaction(
        &address,
        Some("TestRune"),
        Some("A test rune for DarkSwap"),
        None,
        Network::Regtest,
    )?;
    
    // Verify transaction properties
    assert!(tx.output.len() > 0);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating a rune transfer transaction
#[tokio::test]
async fn test_create_transfer_transaction() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    
    // Create a rune
    let rune_id = 123456789;
    
    // Create a runestone
    let mut runestone = Runestone::default();
    runestone.add_edict(0, rune_id, 1000000);
    
    // Create a transfer transaction
    let tx = runestone.create_transfer_transaction(
        &address,
        &address,
        Network::Regtest,
    )?;
    
    // Verify transaction properties
    assert!(tx.output.len() > 0);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test creating a BTC/Rune order
#[tokio::test]
async fn test_create_btc_rune_order() -> Result<()> {
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
    
    // Create a rune ID
    let rune_id = 123456789;
    
    // Create a BTC/Rune order
    let order = darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 runes
        Decimal::new(1, 5),    // 0.00001 BTC per rune
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Verify order properties
    assert_eq!(order.base_asset, Asset::Rune(rune_id));
    assert_eq!(order.quote_asset, Asset::Bitcoin);
    assert_eq!(order.side, OrderSide::Buy);
    assert_eq!(order.amount, Decimal::new(100, 0));
    assert_eq!(order.price, Decimal::new(1, 5));
    assert_eq!(order.status, OrderStatus::Open);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test getting BTC/Rune orders
#[tokio::test]
async fn test_get_btc_rune_orders() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create a rune ID
    let rune_id = 123456789;
    
    // Create a BTC/Rune order
    let order = darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 runes
        Decimal::new(1, 5),    // 0.00001 BTC per rune
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Get BTC/Rune orders
    let orders = darkswap.get_btc_rune_orders(rune_id).await?;
    
    // Verify orders
    assert_eq!(orders.len(), 1);
    assert_eq!(orders[0].id, order.id);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test getting best bid and ask for BTC/Rune
#[tokio::test]
async fn test_get_btc_rune_best_bid_ask() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create a rune ID
    let rune_id = 123456789;
    
    // Create a BTC/Rune buy order
    darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 runes
        Decimal::new(1, 5),    // 0.00001 BTC per rune
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Create a BTC/Rune sell order
    darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Sell,
        Decimal::new(200, 0),  // 200 runes
        Decimal::new(2, 5),    // 0.00002 BTC per rune
        Some(3600),            // 1 hour expiry
    ).await?;
    
    // Get best bid and ask
    let (bid, ask) = darkswap.get_btc_rune_best_bid_ask(rune_id).await?;
    
    // Verify bid and ask
    assert_eq!(bid, Some(Decimal::new(1, 5)));
    assert_eq!(ask, Some(Decimal::new(2, 5)));
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

/// Test cancelling a BTC/Rune order
#[tokio::test]
async fn test_cancel_btc_rune_order() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create a rune ID
    let rune_id = 123456789;
    
    // Create a BTC/Rune order
    let order = darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Buy,
        Decimal::new(100, 0),  // 100 runes
        Decimal::new(1, 5),    // 0.00001 BTC per rune
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