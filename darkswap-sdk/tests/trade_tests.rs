//! Tests for the trade module

use anyhow::Result;
use darkswap_sdk::{
    config::{BitcoinNetwork, Config},
    orderbook::{Order, OrderId, OrderSide, OrderStatus, Orderbook},
    p2p::P2PNetwork,
    trade::{Trade, TradeId, TradeManager, TradeState},
    types::{Asset, Event},
    wallet::simple_wallet::SimpleWallet,
};
use rust_decimal::Decimal;
use std::{str::FromStr, sync::Arc};
use tokio::sync::mpsc;

#[tokio::test]
async fn test_trade_manager_creation() -> Result<()> {
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
    
    // Create trade manager
    let trade_manager = TradeManager::new(network, wallet, event_sender);
    
    // Check that trade manager is created
    assert!(trade_manager.start().await.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_trade_creation() -> Result<()> {
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
    
    // Create trade manager
    let trade_manager = TradeManager::new(network.clone(), wallet.clone(), event_sender.clone());
    trade_manager.start().await?;
    
    // Create an order
    let maker = "maker_peer_id".to_string();
    let order = Order {
        id: OrderId("test_order".to_string()),
        maker: maker.clone(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Bitcoin,
        side: OrderSide::Sell,
        amount: Decimal::from_str("1.0")?,
        price: Decimal::from_str("20000")?,
        status: OrderStatus::Open,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        expiry: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600,
    };
    
    // Create a trade
    let trade = trade_manager.create_trade(&order, Decimal::from_str("0.5")?).await?;
    
    // Check trade properties
    assert_eq!(trade.order_id, order.id);
    assert_eq!(trade.maker_peer_id, maker);
    assert_eq!(trade.base_asset, Asset::Bitcoin);
    assert_eq!(trade.quote_asset, Asset::Bitcoin);
    assert_eq!(trade.amount, Decimal::from_str("0.5")?);
    assert_eq!(trade.price, Decimal::from_str("20000")?);
    assert_eq!(trade.state, TradeState::Initialized);
    
    // Check that trade expiry is set
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    assert!(trade.expires_at > now);
    
    // Check that we received a TradeStarted event
    let event = tokio::time::timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await??;
    match event {
        Event::TradeStarted(started_trade) => {
            assert_eq!(started_trade.id, trade.id);
        }
        _ => panic!("Expected TradeStarted event, got {:?}", event),
    }
    
    Ok(())
}

#[tokio::test]
async fn test_trade_cancellation() -> Result<()> {
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
    
    // Create trade manager
    let trade_manager = TradeManager::new(network.clone(), wallet.clone(), event_sender.clone());
    trade_manager.start().await?;
    
    // Create an order
    let maker = "maker_peer_id".to_string();
    let order = Order {
        id: OrderId("test_order".to_string()),
        maker: maker.clone(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Bitcoin,
        side: OrderSide::Sell,
        amount: Decimal::from_str("1.0")?,
        price: Decimal::from_str("20000")?,
        status: OrderStatus::Open,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        expiry: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600,
    };
    
    // Create a trade
    let trade = trade_manager.create_trade(&order, Decimal::from_str("0.5")?).await?;
    
    // Consume the TradeStarted event
    let _ = tokio::time::timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await??;
    
    // Cancel the trade
    trade_manager.cancel_trade(&trade.id, "Test cancellation").await?;
    
    // Check that we received a TradeFailed event
    let event = tokio::time::timeout(std::time::Duration::from_secs(1), event_receiver.recv()).await??;
    match event {
        Event::TradeFailed(failed_trade) => {
            assert_eq!(failed_trade.id, trade.id);
            assert_eq!(failed_trade.state, TradeState::Canceled);
        }
        _ => panic!("Expected TradeFailed event, got {:?}", event),
    }
    
    // Check that the trade is now canceled
    let canceled_trade = trade_manager.get_trade(&trade.id).await?;
    assert_eq!(canceled_trade.state, TradeState::Canceled);
    
    Ok(())
}

#[tokio::test]
async fn test_get_trades() -> Result<()> {
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
    
    // Create trade manager
    let trade_manager = TradeManager::new(network.clone(), wallet.clone(), event_sender.clone());
    trade_manager.start().await?;
    
    // Create multiple orders
    let maker = "maker_peer_id".to_string();
    let order1 = Order {
        id: OrderId("test_order_1".to_string()),
        maker: maker.clone(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Bitcoin,
        side: OrderSide::Sell,
        amount: Decimal::from_str("1.0")?,
        price: Decimal::from_str("20000")?,
        status: OrderStatus::Open,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        expiry: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600,
    };
    
    let order2 = Order {
        id: OrderId("test_order_2".to_string()),
        maker: maker.clone(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(123),
        side: OrderSide::Buy,
        amount: Decimal::from_str("0.5")?,
        price: Decimal::from_str("0.001")?,
        status: OrderStatus::Open,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        expiry: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600,
    };
    
    // Create trades
    let trade1 = trade_manager.create_trade(&order1, Decimal::from_str("0.5")?).await?;
    let trade2 = trade_manager.create_trade(&order2, Decimal::from_str("0.2")?).await?;
    
    // Get all trades
    let trades = trade_manager.get_trades().await;
    
    // Check that we got the correct trades
    assert_eq!(trades.len(), 2);
    assert!(trades.iter().any(|t| t.id == trade1.id));
    assert!(trades.iter().any(|t| t.id == trade2.id));
    
    Ok(())
}