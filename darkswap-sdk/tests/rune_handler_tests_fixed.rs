//! Tests for the rune handler

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    trade::rune::RuneHandler,
    types::Asset,
    wallet::simple_wallet::SimpleWallet,
};
use bitcoin::{Address, Network};
use std::str::FromStr;
use std::sync::Arc;

#[tokio::test]
async fn test_rune_handler_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a rune handler
    let rune_handler = RuneHandler::new(wallet, bitcoin::Network::Testnet);
    
    // Check that the rune handler is created
    assert!(rune_handler.balance_of("test_rune").await.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_rune_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a rune handler
    let rune_handler = RuneHandler::new(wallet, bitcoin::Network::Testnet);
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Get rune balance
    let balance = rune_handler.balance_of(&rune_id).await?;
    
    // Check that balance is a valid u64 (no need to compare with 0 since u64 is always >= 0)
    assert!(balance == 0); // We expect 0 balance in the test environment
    
    Ok(())
}

// Skip the transfer tests since they require actual rune balances
// In a real test environment, we would mock the rune handler or set up test runes

#[tokio::test]
async fn test_rune_asset_type() -> Result<()> {
    // Create a rune ID
    let rune_id: u64 = 0x123;
    
    // Create a rune asset type
    let rune_asset = Asset::Rune(rune_id);
    
    // Check that the asset type is a rune
    match rune_asset {
        Asset::Rune(id) => {
            assert_eq!(id, rune_id);
        }
        _ => {
            panic!("Expected a rune asset type");
        }
    }
    
    // Convert to string
    let rune_str = rune_asset.to_string();
    
    // Check that the string representation is correct
    assert_eq!(rune_str, format!("RUNE:{:x}", rune_id));
    
    // Parse from string
    let parsed_asset = Asset::from_str(&rune_str).map_err(|e| anyhow::anyhow!(e))?;
    
    // Check that the parsed asset type is a rune
    match parsed_asset {
        Asset::Rune(id) => {
            assert_eq!(id, rune_id);
        }
        _ => {
            panic!("Expected a rune asset type");
        }
    }
    
    Ok(())
}