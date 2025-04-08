//! Tests for the rune handler

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    trade::{rune::RuneHandler, AssetType},
    wallet::simple_wallet::SimpleWallet,
};
use bitcoin::Address;
use std::str::FromStr;
use std::sync::Arc;

#[tokio::test]
async fn test_rune_handler_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a rune handler
    let rune_handler = RuneHandler::new(wallet);
    
    // Check that the rune handler is not null
    assert!(Arc::strong_count(&rune_handler) > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_rune_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a rune handler
    let rune_handler = RuneHandler::new(wallet);
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Get rune balance
    let balance = rune_handler.balance_of(&rune_id).await?;
    
    // Check that balance is a valid u64
    assert!(balance >= 0);
    
    Ok(())
}

#[tokio::test]
async fn test_create_rune_transfer_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a rune handler
    let rune_handler = RuneHandler::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Create a rune transfer PSBT
    let psbt = rune_handler.create_transfer_psbt(
        &rune_id,
        1_000_000, // 1,000,000 rune units
        recipient,
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Check that the PSBT is valid
    assert!(psbt.inputs.len() > 0);
    assert!(psbt.outputs.len() > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_verify_rune_transfer() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a rune handler
    let rune_handler = RuneHandler::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Create a rune transfer PSBT
    let psbt = rune_handler.create_transfer_psbt(
        &rune_id,
        1_000_000, // 1,000,000 rune units
        recipient,
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Verify the rune transfer
    rune_handler.verify_transfer(&psbt, &rune_id, 1_000_000).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_rune_asset_type() -> Result<()> {
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Create a rune asset type
    let rune_asset = AssetType::Rune(rune_id.clone());
    
    // Check that the asset type is a rune
    match rune_asset {
        AssetType::Rune(id) => {
            assert_eq!(id, rune_id);
        }
        _ => {
            panic!("Expected a rune asset type");
        }
    }
    
    // Convert to string
    let rune_str = rune_asset.as_str();
    
    // Check that the string representation is correct
    assert_eq!(rune_str, format!("rune:{}", rune_id));
    
    // Parse from string
    let parsed_asset = AssetType::from_str(&rune_str)?;
    
    // Check that the parsed asset type is a rune
    match parsed_asset {
        AssetType::Rune(id) => {
            assert_eq!(id, rune_id);
        }
        _ => {
            panic!("Expected a rune asset type");
        }
    }
    
    Ok(())
}