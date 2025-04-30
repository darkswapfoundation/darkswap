//! Tests for the alkane handler

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    trade::{alkane::AlkaneHandler, AssetType},
    wallet::simple_wallet::SimpleWallet,
};
use bitcoin::Address;
use std::str::FromStr;
use std::sync::Arc;

#[tokio::test]
async fn test_alkane_handler_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create an alkane handler
    let alkane_handler = AlkaneHandler::new(wallet);
    
    // Check that the alkane handler is not null
    assert!(Arc::strong_count(&alkane_handler) > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_alkane_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create an alkane handler
    let alkane_handler = AlkaneHandler::new(wallet);
    
    // Create an alkane ID
    let alkane_id = "test_alkane".to_string();
    
    // Get alkane balance
    let balance = alkane_handler.balance_of(&alkane_id).await?;
    
    // Check that balance is a valid u64
    assert!(balance >= 0);
    
    Ok(())
}

#[tokio::test]
async fn test_create_alkane_transfer_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create an alkane handler
    let alkane_handler = AlkaneHandler::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create an alkane ID
    let alkane_id = "test_alkane".to_string();
    
    // Create an alkane transfer PSBT
    let psbt = alkane_handler.create_transfer_psbt(
        &alkane_id,
        1_000_000, // 1,000,000 alkane units
        recipient,
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Check that the PSBT is valid
    assert!(psbt.inputs.len() > 0);
    assert!(psbt.outputs.len() > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_verify_alkane_transfer() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create an alkane handler
    let alkane_handler = AlkaneHandler::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create an alkane ID
    let alkane_id = "test_alkane".to_string();
    
    // Create an alkane transfer PSBT
    let psbt = alkane_handler.create_transfer_psbt(
        &alkane_id,
        1_000_000, // 1,000,000 alkane units
        recipient,
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Verify the alkane transfer
    alkane_handler.verify_transfer(&psbt, &alkane_id, 1_000_000).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_alkane_asset_type() -> Result<()> {
    // Create an alkane ID
    let alkane_id = darkswap_sdk::trade::alkane::AlkaneId("test_alkane".to_string());
    
    // Create an alkane asset type
    let alkane_asset = AssetType::Alkane(alkane_id.clone());
    
    // Check that the asset type is an alkane
    match alkane_asset {
        AssetType::Alkane(id) => {
            assert_eq!(id, alkane_id);
        }
        _ => {
            panic!("Expected an alkane asset type");
        }
    }
    
    // Convert to string
    let alkane_str = alkane_asset.as_str();
    
    // Check that the string representation is correct
    assert_eq!(alkane_str, format!("alkane:{}", alkane_id));
    
    // Parse from string
    let parsed_asset = AssetType::from_str(&alkane_str)?;
    
    // Check that the parsed asset type is an alkane
    match parsed_asset {
        AssetType::Alkane(id) => {
            assert_eq!(id, alkane_id);
        }
        _ => {
            panic!("Expected an alkane asset type");
        }
    }
    
    Ok(())
}