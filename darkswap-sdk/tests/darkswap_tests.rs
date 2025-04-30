//! Tests for the main DarkSwap struct

use anyhow::Result;
use darkswap_sdk::{
    config::Config,
    orderbook::OrderSide,
    types::{Asset, Event},
    DarkSwap,
};
use rust_decimal::Decimal;
use std::str::FromStr;
use tokio::time::timeout;

#[tokio::test]
async fn test_darkswap_creation() -> Result<()> {
    // Create configuration
    let config = Config::default();
    
    // Create DarkSwap instance
    let darkswap = DarkSwap::new(config)?;
    
    // Check that DarkSwap is created
    assert!(darkswap.network.is_none());
    assert!(darkswap.wallet.is_none());
    
    Ok(())
}

#[tokio::test]
async fn test_darkswap_start_stop() -> Result<()> {
    // Create configuration
    let config = Config::default();
    
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Check that components are initialized
    assert!(darkswap.network.is_some());
    assert!(darkswap.wallet.is_some());
    assert!(darkswap.orderbook.is_some());
    assert!(darkswap.trade_manager.is_some());
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    // Check that components are cleared
    assert!(darkswap.network.is_none());
    assert!(darkswap.wallet.is_none());
    assert!(darkswap.orderbook.is_none());
    assert!(darkswap.trade_manager.is_none());
    
    Ok(())
}

#[tokio::test]
async fn test_darkswap_wallet_operations() -> Result<()> {
    // Create configuration
    let config = Config::default();
    
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    
    // Check that address is not empty
    assert!(!address.is_empty());
    
    // Get wallet balance
    let balance = darkswap.get_balance().await?;
    
    // Check that balance is positive (simple wallet initializes with some funds)
    assert!(balance > 0);
    
    // Get Bitcoin balance
    let btc_balance = darkswap.get_asset_balance(&Asset::Bitcoin).await?;
    
    // Check that Bitcoin balance matches the general balance
    assert_eq!(balance, btc_balance);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_darkswap_order_operations() -> Result<()> {
    // Create configuration
    let config = Config::default();
    
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an order
    let order = darkswap.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Check that order is created
    assert_eq!(order.base_asset, Asset::Bitcoin);
    assert_eq!(order.quote_asset, Asset::Bitcoin);
    assert_eq!(order.side, OrderSide::Buy);
    assert_eq!(order.amount, Decimal::from_str("0.1")?);
    assert_eq!(order.price, Decimal::from_str("20000")?);
    
    // Get order by ID
    let retrieved_order = darkswap.get_order(&order.id).await?;
    
    // Check that retrieved order matches created order
    assert_eq!(retrieved_order.id, order.id);
    assert_eq!(retrieved_order.base_asset, order.base_asset);
    assert_eq!(retrieved_order.quote_asset, order.quote_asset);
    assert_eq!(retrieved_order.side, order.side);
    assert_eq!(retrieved_order.amount, order.amount);
    assert_eq!(retrieved_order.price, order.price);
    
    // Get orders for pair
    let orders = darkswap.get_orders(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    
    // Check that orders include our order
    assert!(orders.iter().any(|o| o.id == order.id));
    
    // Get best bid and ask
    let (bid, ask) = darkswap.get_best_bid_ask(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    
    // Check that best bid matches our order's price
    assert_eq!(bid, Some(Decimal::from_str("20000")?));
    
    // Cancel order
    darkswap.cancel_order(&order.id).await?;
    
    // Check that order is canceled
    let canceled_order = darkswap.get_order(&order.id).await?;
    assert_eq!(canceled_order.status, darkswap_sdk::orderbook::OrderStatus::Canceled);
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_darkswap_events() -> Result<()> {
    // Create configuration
    let config = Config::default();
    
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create an order (this should generate an OrderCreated event)
    let order = darkswap.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Wait for event
    let event = timeout(std::time::Duration::from_secs(1), darkswap.next_event()).await??;
    
    // Check that we received an OrderCreated event
    match event {
        Event::OrderCreated(created_order) => {
            assert_eq!(created_order.id, order.id);
        }
        _ => panic!("Expected OrderCreated event, got {:?}", event),
    }
    
    // Cancel order (this should generate an OrderCanceled event)
    darkswap.cancel_order(&order.id).await?;
    
    // Wait for event
    let event = timeout(std::time::Duration::from_secs(1), darkswap.next_event()).await??;
    
    // Check that we received an OrderCanceled event
    match event {
        Event::OrderCanceled(order_id) => {
            assert_eq!(order_id, order.id);
        }
        _ => panic!("Expected OrderCanceled event, got {:?}", event),
    }
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_darkswap_subscribe_to_events() -> Result<()> {
    // Create configuration
    let config = Config::default();
    
    // Create DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Subscribe to events
    let mut event_receiver = darkswap.subscribe_to_events().await;
    
    // Create an order (this should generate an OrderCreated event)
    let order = darkswap.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.1")?, // 0.1 BTC
        Decimal::from_str("20000")?, // 20,000 USD per BTC
        Some(3600), // 1 hour expiry
    ).await?;
    
    // Wait for event
    let event = timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await??;
    
    // Check that we received an OrderCreated event
    match event {
        Event::OrderCreated(created_order) => {
            assert_eq!(created_order.id, order.id);
        }
        _ => panic!("Expected OrderCreated event, got {:?}", event),
    }
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    Ok(())
}