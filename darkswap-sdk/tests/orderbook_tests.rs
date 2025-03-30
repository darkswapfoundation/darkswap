//! Tests for the orderbook module

use anyhow::Result;
use darkswap_sdk::{
    config::{BitcoinNetwork, Config},
    orderbook::{Order, OrderSide, OrderStatus, Orderbook},
    p2p::P2PNetwork,
    types::{Asset, Event},
    wallet::simple_wallet::SimpleWallet,
};
use rust_decimal::Decimal;
use std::{str::FromStr, sync::Arc};
use tokio::sync::mpsc;

#[tokio::test]
async fn test_orderbook_creation() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel::<Event>(100);
    
    // Create config
    let config = Config::default();
    
    // Create P2P network
    let network = P2PNetwork::new(&config, event_sender.clone())?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    let wallet = Arc::new(wallet);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    
    // Check that orderbook is created
    assert!(orderbook.start().await.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_order_creation() -> Result<()> {
    // Create event channel
    let (event_sender, mut event_receiver) = mpsc::channel::<Event>(100);
    
    // Create config
    let config = Config::default();
    
    // Create P2P network
    let network = P2PNetwork::new(&config, event_sender.clone())?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    let wallet = Arc::new(wallet);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    orderbook.start().await?;
    
    // Create an order
    let order = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Check order properties
    assert_eq!(order.base_asset, Asset::Bitcoin);
    assert_eq!(order.quote_asset, Asset::Bitcoin);
    assert_eq!(order.side, OrderSide::Buy);
    assert_eq!(order.amount, Decimal::from_str("0.1")?);
    assert_eq!(order.price, Decimal::from_str("20000")?);
    assert_eq!(order.status, OrderStatus::Open);
    
    // Check that order expiry is set
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    assert!(order.expiry > now);
    assert!(order.expiry <= now + 3600);
    
    // Check that we received an OrderCreated event
    let event = tokio::time::timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await?.ok_or(anyhow::anyhow!("No event received"))?;
    match event {
        Event::OrderCreated(created_order) => {
            assert_eq!(created_order.id, order.id);
        }
        _ => panic!("Expected OrderCreated event, got {:?}", event),
    }
    
    Ok(())
}

#[tokio::test]
async fn test_order_cancellation() -> Result<()> {
    // Create event channel
    let (event_sender, mut event_receiver) = mpsc::channel::<Event>(100);
    
    // Create config
    let config = Config::default();
    
    // Create P2P network
    let network = P2PNetwork::new(&config, event_sender.clone())?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    let wallet = Arc::new(wallet);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    orderbook.start().await?;
    
    // Create an order
    let order = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Consume the OrderCreated event
    let _ = tokio::time::timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await?.ok_or(anyhow::anyhow!("No event received"))?;
    
    // Cancel the order
    orderbook.cancel_order(&order.id).await?;
    
    // Check that we received an OrderCancelled event
    let event = tokio::time::timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await?.ok_or(anyhow::anyhow!("No event received"))?;
    match event {
        Event::OrderCancelled(order_id) => {
            assert_eq!(order_id, order.id);
        }
        _ => panic!("Expected OrderCanceled event, got {:?}", event),
    }
    
    // Check that the order is now canceled
    let canceled_order = orderbook.get_order(&order.id).await?;
    assert_eq!(canceled_order.status, OrderStatus::Canceled);
    
    Ok(())
}

#[tokio::test]
async fn test_get_orders() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel::<Event>(100);
    
    // Create config
    let config = Config::default();
    
    // Create P2P network
    let network = P2PNetwork::new(&config, event_sender.clone())?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    let wallet = Arc::new(wallet);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    orderbook.start().await?;
    
    // Create multiple orders
    let order1 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    let order2 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Sell,
        Decimal::from_str("0.2")?, // 0.2 BTC
        Decimal::from_str("21000")?, // 21,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    let order3 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Rune(123),
        OrderSide::Buy,
        Decimal::from_str("0.3")?, // 0.3 BTC
        Decimal::from_str("0.001")?, // 0.001 BTC per RUNE
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Get orders for BTC/BTC pair
    let btc_btc_orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    
    // Check that we got the correct orders
    assert_eq!(btc_btc_orders.len(), 2);
    assert!(btc_btc_orders.iter().any(|o| o.id == order1.id));
    assert!(btc_btc_orders.iter().any(|o| o.id == order2.id));
    
    // Get orders for BTC/RUNE pair
    let btc_rune_orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Rune(123)).await?;
    
    // Check that we got the correct orders
    assert_eq!(btc_rune_orders.len(), 1);
    assert!(btc_rune_orders.iter().any(|o| o.id == order3.id));
    
    Ok(())
}

#[tokio::test]
async fn test_get_best_bid_ask() -> Result<()> {
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel::<Event>(100);
    
    // Create config
    let config = Config::default();
    
    // Create P2P network
    let network = P2PNetwork::new(&config, event_sender.clone())?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    let wallet = Arc::new(wallet);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    orderbook.start().await?;
    
    // Create multiple orders with different prices
    let _order1 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("19000")?, // 19,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    let _order2 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC (best bid)
        Some(3600), // 1 hour expiry
    ).await?;
    
    let _order3 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Sell,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("21000")?, // 21,000 USD per BTC (best ask)
        Some(3600), // 1 hour expiry
    ).await?;
    
    let _order4 = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Sell,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("22000")?, // 22,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Get best bid and ask
    let (bid, ask) = orderbook.get_best_bid_ask(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    
    // Check that we got the correct values
    assert_eq!(bid, Some(Decimal::from_str("20000")?));
    assert_eq!(ask, Some(Decimal::from_str("21000")?));
    
    Ok(())
}