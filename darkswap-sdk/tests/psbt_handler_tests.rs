//! Tests for the PSBT handler

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    orderbook::OrderId,
    types::{Asset, TradeId},
    wallet::{simple_wallet::SimpleWallet, WalletInterface},
};

#[tokio::test]
async fn test_psbt_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = OrderId("test_order".to_string());
    
    // Create a PSBT for an order
    let psbt = wallet.create_order_psbt(
        &order_id,
        &Asset::Bitcoin,
        &Asset::Bitcoin,
        100_000_000, // 1 BTC
        20_000_000_000, // 20,000 USD per BTC
    ).await?;
    
    // Check that PSBT is not empty
    assert!(!psbt.is_empty());
    
    // Verify PSBT
    let is_valid = wallet.verify_psbt(&psbt).await?;
    
    // Check that PSBT is valid
    assert!(is_valid);
    
    Ok(())
}

#[tokio::test]
async fn test_psbt_signing() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = OrderId("test_order".to_string());
    
    // Create a PSBT for an order
    let psbt = wallet.create_order_psbt(
        &order_id,
        &Asset::Bitcoin,
        &Asset::Bitcoin,
        100_000_000, // 1 BTC
        20_000_000_000, // 20,000 USD per BTC
    ).await?;
    
    // Sign PSBT
    let signed_psbt = wallet.sign_psbt(&psbt).await?;
    
    // Check that signed PSBT is not empty
    assert!(!signed_psbt.is_empty());
    
    // Verify signed PSBT
    let is_valid = wallet.verify_psbt(&signed_psbt).await?;
    
    // Check that signed PSBT is valid
    assert!(is_valid);
    
    Ok(())
}

#[tokio::test]
async fn test_trade_psbt_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create dummy IDs
    let order_id = OrderId("test_order".to_string());
    let trade_id = TradeId("test_trade".to_string());
    
    // Create a PSBT for a trade
    let psbt = wallet.create_trade_psbt(
        &trade_id,
        &order_id,
        &Asset::Bitcoin,
        &Asset::Bitcoin,
        100_000_000, // 1 BTC
        20_000_000_000, // 20,000 USD per BTC
    ).await?;
    
    // Check that PSBT is not empty
    assert!(!psbt.is_empty());
    
    // Verify PSBT
    let is_valid = wallet.verify_psbt(&psbt).await?;
    
    // Check that PSBT is valid
    assert!(is_valid);
    
    Ok(())
}

#[tokio::test]
async fn test_psbt_broadcast() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = OrderId("test_order".to_string());
    
    // Create a PSBT for an order
    let psbt = wallet.create_order_psbt(
        &order_id,
        &Asset::Bitcoin,
        &Asset::Bitcoin,
        100_000_000, // 1 BTC
        20_000_000_000, // 20,000 USD per BTC
    ).await?;
    
    // Sign PSBT
    let signed_psbt = wallet.sign_psbt(&psbt).await?;
    
    // Broadcast PSBT
    let txid = wallet.finalize_and_broadcast_psbt(&signed_psbt).await?;
    
    // Check that txid is not empty
    assert!(!txid.is_empty());
    
    // Check that txid is a valid hex string
    assert!(txid.chars().all(|c| c.is_ascii_hexdigit()));
    
    Ok(())
}

#[tokio::test]
async fn test_psbt_with_different_assets() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = OrderId("test_order".to_string());
    
    // Create a rune asset
    let rune_asset = Asset::Rune(12345);
    
    // Create a PSBT for an order with rune
    let psbt = wallet.create_order_psbt(
        &order_id,
        &rune_asset,
        &Asset::Bitcoin,
        100_000_000, // 1 RUNE
        20_000_000, // 0.2 BTC per RUNE
    ).await?;
    
    // Check that PSBT is not empty
    assert!(!psbt.is_empty());
    
    // Verify PSBT
    let is_valid = wallet.verify_psbt(&psbt).await?;
    
    // Check that PSBT is valid
    assert!(is_valid);
    
    // Create an alkane asset
    let alkane_id = darkswap_sdk::types::AlkaneId("test_alkane".to_string());
    let alkane_asset = Asset::Alkane(alkane_id);
    
    // Create a PSBT for an order with alkane
    let psbt = wallet.create_order_psbt(
        &order_id,
        &alkane_asset,
        &Asset::Bitcoin,
        100_000_000, // 1 ALKANE
        10_000_000, // 0.1 BTC per ALKANE
    ).await?;
    
    // Check that PSBT is not empty
    assert!(!psbt.is_empty());
    
    // Verify PSBT
    let is_valid = wallet.verify_psbt(&psbt).await?;
    
    // Check that PSBT is valid
    assert!(is_valid);
    
    Ok(())
}