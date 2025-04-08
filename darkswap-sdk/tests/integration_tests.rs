//! Integration tests for DarkSwap

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
async fn test_full_trade_flow() -> Result<()> {
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
    let (maker_event_sender, _maker_event_receiver) = mpsc::channel(100);
    let (taker_event_sender, _taker_event_receiver) = mpsc::channel(100);
    
    // Create orderbooks
    let maker_orderbook = Orderbook::new(maker_network, maker_wallet.clone(), maker_event_sender);
    let taker_orderbook = Orderbook::new(taker_network, taker_wallet.clone(), taker_event_sender);
    
    // Create trade managers
    let maker_trade_manager = TradeManager::new(maker_wallet.clone());
    let taker_trade_manager = TradeManager::new(taker_wallet.clone());
    
    // Create an order from maker
    let order = maker_orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin, // Using Bitcoin as a placeholder for USD
        OrderSide::Sell,
        Decimal::from_str("1.0")?,
        Decimal::from_str("20000.0")?,
        None,
    ).await?;
    
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
        100_000_000, // 1 BTC
        20_000_000_000, // 20,000 USD per BTC
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
    
    Ok(())
}

#[tokio::test]
async fn test_rune_alkane_trade_flow() -> Result<()> {
    // Create maker wallet
    let maker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create taker wallet
    let taker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create trade managers
    let maker_trade_manager = TradeManager::new(maker_wallet.clone());
    let taker_trade_manager = TradeManager::new(taker_wallet.clone());
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Create an alkane ID
    let alkane_id = darkswap_sdk::trade::alkane::AlkaneId("test_alkane".to_string());
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Maker creates a rune transfer PSBT
    let rune_psbt = maker_trade_manager.create_transfer_psbt(
        &AssetType::Rune(rune_id.clone()),
        1_000_000, // 1,000,000 rune units
        recipient.clone(),
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Maker signs the rune PSBT
    let signed_rune_psbt = maker_trade_manager.sign_psbt(rune_psbt).await?;
    
    // Maker finalizes the rune PSBT
    let rune_tx = maker_trade_manager.finalize_psbt(signed_rune_psbt).await?;
    
    // Maker broadcasts the rune transaction
    let rune_txid = maker_trade_manager.broadcast_transaction(rune_tx).await?;
    
    // Check that rune txid is not empty
    assert!(!rune_txid.to_string().is_empty());
    
    // Taker creates an alkane transfer PSBT
    let alkane_psbt = taker_trade_manager.create_transfer_psbt(
        &AssetType::Alkane(alkane_id.clone()),
        1_000_000, // 1,000,000 alkane units
        recipient.clone(),
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Taker signs the alkane PSBT
    let signed_alkane_psbt = taker_trade_manager.sign_psbt(alkane_psbt).await?;
    
    // Taker finalizes the alkane PSBT
    let alkane_tx = taker_trade_manager.finalize_psbt(signed_alkane_psbt).await?;
    
    // Taker broadcasts the alkane transaction
    let alkane_txid = taker_trade_manager.broadcast_transaction(alkane_tx).await?;
    
    // Check that alkane txid is not empty
    assert!(!alkane_txid.to_string().is_empty());
    
    Ok(())
}

#[tokio::test]
async fn test_order_matching() -> Result<()> {
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
    let (maker_event_sender, _maker_event_receiver) = mpsc::channel(100);
    let (taker_event_sender, _taker_event_receiver) = mpsc::channel(100);
    
    // Create orderbooks
    let maker_orderbook = Orderbook::new(maker_network, maker_wallet.clone(), maker_event_sender);
    let taker_orderbook = Orderbook::new(taker_network, taker_wallet.clone(), taker_event_sender);
    
    // Create a sell order from maker
    let sell_order = maker_orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin, // Using Bitcoin as a placeholder for USD
        OrderSide::Sell,
        Decimal::from_str("1.0")?,
        Decimal::from_str("20000.0")?,
        None,
    ).await?;
    
    // Create a buy order from taker
    let buy_order = taker_orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin, // Using Bitcoin as a placeholder for USD
        OrderSide::Buy,
        Decimal::from_str("1.0")?,
        Decimal::from_str("20000.0")?,
        None,
    ).await?;
    
    // Get best bid and ask from maker's perspective
    let (best_bid, best_ask) = maker_orderbook.get_best_bid_ask(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    
    // Check that best bid is the taker's buy order price
    assert_eq!(best_bid, Some(Decimal::from_str("20000.0")?));
    
    // Check that best ask is the maker's sell order price
    assert_eq!(best_ask, Some(Decimal::from_str("20000.0")?));
    
    // Get best bid and ask from taker's perspective
    let (best_bid, best_ask) = taker_orderbook.get_best_bid_ask(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    
    // Check that best bid is the taker's buy order price
    assert_eq!(best_bid, Some(Decimal::from_str("20000.0")?));
    
    // Check that best ask is the maker's sell order price
    assert_eq!(best_ask, Some(Decimal::from_str("20000.0")?));
    
    Ok(())
}