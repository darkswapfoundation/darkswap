//! Tests for the wallet module

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    types::Asset,
    wallet::{simple_wallet::SimpleWallet, WalletInterface},
};
use rust_decimal::Decimal;
use std::str::FromStr;

#[tokio::test]
async fn test_simple_wallet_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Get address
    let address = wallet.get_address().await?;
    
    // Check that address is not empty
    assert!(!address.is_empty());
    
    // Check that address starts with a valid prefix for testnet
    assert!(address.starts_with("tb1") || address.starts_with("2") || address.starts_with("m") || address.starts_with("n"));
    
    Ok(())
}

#[tokio::test]
async fn test_simple_wallet_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Get balance
    let balance = wallet.get_balance().await?;
    
    // Check that balance is positive (simple wallet initializes with some funds)
    assert!(balance > 0);
    
    // Get Bitcoin balance
    let btc_balance = wallet.get_asset_balance(&Asset::Bitcoin).await?;
    
    // Check that Bitcoin balance matches the general balance
    assert_eq!(balance, btc_balance);
    
    Ok(())
}

#[tokio::test]
async fn test_simple_wallet_psbt_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = darkswap_sdk::orderbook::OrderId("test_order".to_string());
    
    // Create a PSBT
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
async fn test_simple_wallet_psbt_signing() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = darkswap_sdk::orderbook::OrderId("test_order".to_string());
    
    // Create a PSBT
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
async fn test_simple_wallet_psbt_broadcast() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = darkswap_sdk::orderbook::OrderId("test_order".to_string());
    
    // Create a PSBT
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