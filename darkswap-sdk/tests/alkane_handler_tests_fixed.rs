//! Tests for the alkane handler

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    trade::alkane::AlkaneHandler,
    types::{Asset, AlkaneId},
    wallet::simple_wallet::SimpleWallet,
};
use std::str::FromStr;
use std::sync::Arc;

#[tokio::test]
async fn test_alkane_handler_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create an alkane handler
    let alkane_handler = AlkaneHandler::new(wallet, bitcoin::Network::Testnet);
    
    // Check that the alkane handler is created
    assert!(alkane_handler.get_alkane_balance_for("test_alkane").await.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_alkane_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create an alkane handler
    let alkane_handler = AlkaneHandler::new(wallet, bitcoin::Network::Testnet);
    
    // Create an alkane ID
    let alkane_id = "test_alkane".to_string();
    
    // Get alkane balance
    let balance = alkane_handler.get_alkane_balance_for(&alkane_id).await?;
    
    // Check that balance is a valid u64 (no need to compare with 0 since u64 is always >= 0)
    assert!(balance == 0); // We expect 0 balance in the test environment
    
    Ok(())
}

// Skip the transfer tests since they require actual alkane balances
// In a real test environment, we would mock the alkane handler or set up test alkanes

#[tokio::test]
async fn test_alkane_asset_type() -> Result<()> {
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create an alkane asset type
    let alkane_asset = Asset::Alkane(alkane_id.clone());
    
    // Check that the asset type is an alkane
    match alkane_asset {
        Asset::Alkane(ref id) => { // Use ref to borrow the id instead of moving it
            assert_eq!(*id, alkane_id);
        }
        _ => {
            panic!("Expected an alkane asset type");
        }
    }
    
    // Convert to string
    let alkane_str = alkane_asset.to_string();
    
    // Check that the string representation is correct
    assert_eq!(alkane_str, format!("ALKANE:{}", alkane_id));
    
    // Parse from string
    let parsed_asset = Asset::from_str(&alkane_str).map_err(|e| anyhow::anyhow!(e))?;
    
    // Check that the parsed asset type is an alkane
    match parsed_asset {
        Asset::Alkane(id) => {
            assert_eq!(id, alkane_id);
        }
        _ => {
            panic!("Expected an alkane asset type");
        }
    }
    
    Ok(())
}