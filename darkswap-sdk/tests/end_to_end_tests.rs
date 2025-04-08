//! End-to-end tests for DarkSwap

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    orderbook::{OrderId, OrderSide, Orderbook},
    trade::{AssetType, TradeManager},
    types::{Asset, TradeId},
    wallet::simple_wallet::SimpleWallet,
};
use bitcoin::Address;
use rust_decimal::Decimal;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::mpsc;

#[tokio::test]
#[ignore] // This test is ignored by default because it requires a running Bitcoin node
async fn test_end_to_end_bitcoin_trade() -> Result<()> {
    // Create maker wallet
    let maker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create taker wallet
    let taker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create dummy P2P network for maker
    let (maker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let maker_network = Arc::new(tokio::sync::RwLock::new(maker_network));
    
    // Create dummy P2P network for taker
    let (taker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let taker_network = Arc::new(tokio::sync::RwLock::new(taker_network));
    
    // Create event channels
    let (maker_event_sender, mut maker_event_receiver) = mpsc::channel(100);
    let (taker_event_sender, mut taker_event_receiver) = mpsc::channel(100);
    
    // Create orderbooks
    let maker_orderbook = Orderbook::new(maker_network, maker_wallet.clone(), maker_event_sender);
    let taker_orderbook = Orderbook::new(taker_network, taker_wallet.clone(), taker_event_sender);
    
    // Create trade managers
    let maker_trade_manager = TradeManager::new(maker_wallet.clone());
    let taker_trade_manager = TradeManager::new(taker_wallet.clone());
    
    // Start the orderbooks
    maker_orderbook.start().await?;
    taker_orderbook.start().await?;
    
    // Create an order from maker
    let order = maker_orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin, // Using Bitcoin as a placeholder for USD
        OrderSide::Sell,
        Decimal::from_str("0.001")?, // 0.001 BTC
        Decimal::from_str("20000.0")?, // $20,000 per BTC
        None,
    ).await?;
    
    // Wait for the order to be created
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the order was created
    let maker_event = maker_event_receiver.try_recv();
    assert!(maker_event.is_ok());
    
    // Taker gets the order
    let retrieved_order = taker_orderbook.get_order(&order.id).await?;
    
    // Check that the retrieved order matches the created order
    assert_eq!(retrieved_order.id, order.id);
    assert_eq!(retrieved_order.base_asset, order.base_asset);
    assert_eq!(retrieved_order.quote_asset, order.quote_asset);
    assert_eq!(retrieved_order.side, order.side);
    assert_eq!(retrieved_order.amount, order.amount);
    assert_eq!(retrieved_order.price, order.price);
    assert_eq!(retrieved_order.status, order.status);
    
    // Create a trade ID
    let trade_id = TradeId("test_trade".to_string());
    
    // Taker creates a PSBT for the trade
    let taker_psbt = taker_wallet.create_trade_psbt(
        &trade_id,
        &order.id,
        &Asset::Bitcoin,
        &Asset::Bitcoin,
        100_000, // 0.001 BTC
        20_000_000_000, // $20,000 per BTC
    ).await?;
    
    // Taker signs the PSBT
    let signed_taker_psbt = taker_wallet.sign_psbt(&taker_psbt).await?;
    
    // Maker verifies the PSBT
    let is_valid = maker_wallet.verify_psbt(&signed_taker_psbt).await?;
    assert!(is_valid);
    
    // Maker signs the PSBT
    let signed_maker_psbt = maker_wallet.sign_psbt(&signed_taker_psbt).await?;
    
    // Taker verifies the PSBT
    let is_valid = taker_wallet.verify_psbt(&signed_maker_psbt).await?;
    assert!(is_valid);
    
    // Taker finalizes and broadcasts the PSBT
    let txid = taker_wallet.finalize_and_broadcast_psbt(&signed_maker_psbt).await?;
    
    // Check that txid is not empty
    assert!(!txid.is_empty());
    
    // Check that txid is a valid hex string
    assert!(txid.chars().all(|c| c.is_ascii_hexdigit()));
    
    // Wait for the transaction to be confirmed
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
    
    // Check that the order is filled
    let updated_order = maker_orderbook.get_order(&order.id).await?;
    assert_eq!(updated_order.status, darkswap_sdk::orderbook::OrderStatus::Filled);
    
    Ok(())
}

#[tokio::test]
#[ignore] // This test is ignored by default because it requires a running Bitcoin node
async fn test_end_to_end_rune_trade() -> Result<()> {
    // Create maker wallet
    let maker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create taker wallet
    let taker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create dummy P2P network for maker
    let (maker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let maker_network = Arc::new(tokio::sync::RwLock::new(maker_network));
    
    // Create dummy P2P network for taker
    let (taker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let taker_network = Arc::new(tokio::sync::RwLock::new(taker_network));
    
    // Create event channels
    let (maker_event_sender, mut maker_event_receiver) = mpsc::channel(100);
    let (taker_event_sender, mut taker_event_receiver) = mpsc::channel(100);
    
    // Create orderbooks
    let maker_orderbook = Orderbook::new(maker_network, maker_wallet.clone(), maker_event_sender);
    let taker_orderbook = Orderbook::new(taker_network, taker_wallet.clone(), taker_event_sender);
    
    // Create trade managers
    let maker_trade_manager = TradeManager::new(maker_wallet.clone());
    let taker_trade_manager = TradeManager::new(taker_wallet.clone());
    
    // Start the orderbooks
    maker_orderbook.start().await?;
    taker_orderbook.start().await?;
    
    // Create a rune asset
    let rune_id = "test_rune".to_string();
    let rune_asset = Asset::Rune(rune_id.clone());
    
    // Create an order from maker
    let order = maker_orderbook.create_order(
        rune_asset.clone(),
        Asset::Bitcoin,
        OrderSide::Sell,
        Decimal::from_str("1000.0")?, // 1000 rune units
        Decimal::from_str("0.0001")?, // 0.0001 BTC per rune unit
        None,
    ).await?;
    
    // Wait for the order to be created
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the order was created
    let maker_event = maker_event_receiver.try_recv();
    assert!(maker_event.is_ok());
    
    // Taker gets the order
    let retrieved_order = taker_orderbook.get_order(&order.id).await?;
    
    // Check that the retrieved order matches the created order
    assert_eq!(retrieved_order.id, order.id);
    assert_eq!(retrieved_order.base_asset, order.base_asset);
    assert_eq!(retrieved_order.quote_asset, order.quote_asset);
    assert_eq!(retrieved_order.side, order.side);
    assert_eq!(retrieved_order.amount, order.amount);
    assert_eq!(retrieved_order.price, order.price);
    assert_eq!(retrieved_order.status, order.status);
    
    // Create a trade ID
    let trade_id = TradeId("test_trade".to_string());
    
    // Taker creates a PSBT for the trade
    let taker_psbt = taker_wallet.create_trade_psbt(
        &trade_id,
        &order.id,
        &rune_asset,
        &Asset::Bitcoin,
        1_000_000, // 1000 rune units
        10_000, // 0.0001 BTC per rune unit
    ).await?;
    
    // Taker signs the PSBT
    let signed_taker_psbt = taker_wallet.sign_psbt(&taker_psbt).await?;
    
    // Maker verifies the PSBT
    let is_valid = maker_wallet.verify_psbt(&signed_taker_psbt).await?;
    assert!(is_valid);
    
    // Maker signs the PSBT
    let signed_maker_psbt = maker_wallet.sign_psbt(&signed_taker_psbt).await?;
    
    // Taker verifies the PSBT
    let is_valid = taker_wallet.verify_psbt(&signed_maker_psbt).await?;
    assert!(is_valid);
    
    // Taker finalizes and broadcasts the PSBT
    let txid = taker_wallet.finalize_and_broadcast_psbt(&signed_maker_psbt).await?;
    
    // Check that txid is not empty
    assert!(!txid.is_empty());
    
    // Check that txid is a valid hex string
    assert!(txid.chars().all(|c| c.is_ascii_hexdigit()));
    
    // Wait for the transaction to be confirmed
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
    
    // Check that the order is filled
    let updated_order = maker_orderbook.get_order(&order.id).await?;
    assert_eq!(updated_order.status, darkswap_sdk::orderbook::OrderStatus::Filled);
    
    Ok(())
}

#[tokio::test]
#[ignore] // This test is ignored by default because it requires a running Bitcoin node
async fn test_end_to_end_alkane_trade() -> Result<()> {
    // Create maker wallet
    let maker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create taker wallet
    let taker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create dummy P2P network for maker
    let (maker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let maker_network = Arc::new(tokio::sync::RwLock::new(maker_network));
    
    // Create dummy P2P network for taker
    let (taker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let taker_network = Arc::new(tokio::sync::RwLock::new(taker_network));
    
    // Create event channels
    let (maker_event_sender, mut maker_event_receiver) = mpsc::channel(100);
    let (taker_event_sender, mut taker_event_receiver) = mpsc::channel(100);
    
    // Create orderbooks
    let maker_orderbook = Orderbook::new(maker_network, maker_wallet.clone(), maker_event_sender);
    let taker_orderbook = Orderbook::new(taker_network, taker_wallet.clone(), taker_event_sender);
    
    // Create trade managers
    let maker_trade_manager = TradeManager::new(maker_wallet.clone());
    let taker_trade_manager = TradeManager::new(taker_wallet.clone());
    
    // Start the orderbooks
    maker_orderbook.start().await?;
    taker_orderbook.start().await?;
    
    // Create an alkane asset
    let alkane_id = darkswap_sdk::trade::alkane::AlkaneId("test_alkane".to_string());
    let alkane_asset = Asset::Alkane(alkane_id.clone());
    
    // Create an order from maker
    let order = maker_orderbook.create_order(
        alkane_asset.clone(),
        Asset::Bitcoin,
        OrderSide::Sell,
        Decimal::from_str("1000.0")?, // 1000 alkane units
        Decimal::from_str("0.0001")?, // 0.0001 BTC per alkane unit
        None,
    ).await?;
    
    // Wait for the order to be created
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the order was created
    let maker_event = maker_event_receiver.try_recv();
    assert!(maker_event.is_ok());
    
    // Taker gets the order
    let retrieved_order = taker_orderbook.get_order(&order.id).await?;
    
    // Check that the retrieved order matches the created order
    assert_eq!(retrieved_order.id, order.id);
    assert_eq!(retrieved_order.base_asset, order.base_asset);
    assert_eq!(retrieved_order.quote_asset, order.quote_asset);
    assert_eq!(retrieved_order.side, order.side);
    assert_eq!(retrieved_order.amount, order.amount);
    assert_eq!(retrieved_order.price, order.price);
    assert_eq!(retrieved_order.status, order.status);
    
    // Create a trade ID
    let trade_id = TradeId("test_trade".to_string());
    
    // Taker creates a PSBT for the trade
    let taker_psbt = taker_wallet.create_trade_psbt(
        &trade_id,
        &order.id,
        &alkane_asset,
        &Asset::Bitcoin,
        1_000_000, // 1000 alkane units
        10_000, // 0.0001 BTC per alkane unit
    ).await?;
    
    // Taker signs the PSBT
    let signed_taker_psbt = taker_wallet.sign_psbt(&taker_psbt).await?;
    
    // Maker verifies the PSBT
    let is_valid = maker_wallet.verify_psbt(&signed_taker_psbt).await?;
    assert!(is_valid);
    
    // Maker signs the PSBT
    let signed_maker_psbt = maker_wallet.sign_psbt(&signed_taker_psbt).await?;
    
    // Taker verifies the PSBT
    let is_valid = taker_wallet.verify_psbt(&signed_maker_psbt).await?;
    assert!(is_valid);
    
    // Taker finalizes and broadcasts the PSBT
    let txid = taker_wallet.finalize_and_broadcast_psbt(&signed_maker_psbt).await?;
    
    // Check that txid is not empty
    assert!(!txid.is_empty());
    
    // Check that txid is a valid hex string
    assert!(txid.chars().all(|c| c.is_ascii_hexdigit()));
    
    // Wait for the transaction to be confirmed
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
    
    // Check that the order is filled
    let updated_order = maker_orderbook.get_order(&order.id).await?;
    assert_eq!(updated_order.status, darkswap_sdk::orderbook::OrderStatus::Filled);
    
    Ok(())
}