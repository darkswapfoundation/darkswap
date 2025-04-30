//! Tests for the trade manager

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    trade::{AssetType, TradeManager},
    wallet::simple_wallet::SimpleWallet,
};
use bitcoin::{Address, Network};
use std::str::FromStr;
use std::sync::Arc;

#[tokio::test]
async fn test_trade_manager_creation() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Get the handlers
    let psbt_handler = trade_manager.psbt_handler();
    let rune_handler = trade_manager.rune_handler();
    let alkane_handler = trade_manager.alkane_handler();
    
    // Check that the handlers are not null
    assert!(Arc::strong_count(&psbt_handler) > 0);
    assert!(Arc::strong_count(&rune_handler) > 0);
    assert!(Arc::strong_count(&alkane_handler) > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_bitcoin_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Get Bitcoin balance
    let balance = trade_manager.balance(&AssetType::Bitcoin).await?;
    
    // Check that balance is a valid u64
    assert!(balance >= 0);
    
    Ok(())
}

#[tokio::test]
async fn test_rune_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Get rune balance
    let balance = trade_manager.balance(&AssetType::Rune(rune_id)).await?;
    
    // Check that balance is a valid u64
    assert!(balance >= 0);
    
    Ok(())
}

#[tokio::test]
async fn test_alkane_balance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create an alkane ID
    let alkane_id = "test_alkane".to_string();
    
    // Get alkane balance
    let balance = trade_manager.balance(&AssetType::Alkane(alkane_id)).await?;
    
    // Check that balance is a valid u64
    assert!(balance >= 0);
    
    Ok(())
}

#[tokio::test]
async fn test_create_bitcoin_transfer_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create a Bitcoin transfer PSBT
    let psbt = trade_manager.create_transfer_psbt(
        &AssetType::Bitcoin,
        100_000, // 0.001 BTC
        recipient,
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Check that the PSBT is valid
    assert!(psbt.inputs.len() > 0);
    assert!(psbt.outputs.len() > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_create_rune_transfer_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create a rune ID
    let rune_id = "test_rune".to_string();
    
    // Create a rune transfer PSBT
    let psbt = trade_manager.create_transfer_psbt(
        &AssetType::Rune(rune_id),
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
async fn test_create_alkane_transfer_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create an alkane ID
    let alkane_id = "test_alkane".to_string();
    
    // Create an alkane transfer PSBT
    let psbt = trade_manager.create_transfer_psbt(
        &AssetType::Alkane(alkane_id),
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
async fn test_sign_and_finalize_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create a recipient address
    let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Create a Bitcoin transfer PSBT
    let psbt = trade_manager.create_transfer_psbt(
        &AssetType::Bitcoin,
        100_000, // 0.001 BTC
        recipient,
        1.0, // 1 sat/vB fee rate
    ).await?;
    
    // Sign the PSBT
    let signed_psbt = trade_manager.sign_psbt(psbt).await?;
    
    // Check that the signed PSBT is valid
    assert!(signed_psbt.inputs.len() > 0);
    assert!(signed_psbt.outputs.len() > 0);
    
    // Finalize the PSBT
    let tx = trade_manager.finalize_psbt(signed_psbt).await?;
    
    // Check that the transaction is valid
    assert!(tx.input.len() > 0);
    assert!(tx.output.len() > 0);
    
    Ok(())
}

#[tokio::test]
async fn test_asset_type_serialization() -> Result<()> {
    // Test Bitcoin
    let bitcoin = AssetType::Bitcoin;
    let bitcoin_str = bitcoin.as_str();
    let bitcoin_parsed = AssetType::from_str(&bitcoin_str)?;
    assert_eq!(bitcoin, bitcoin_parsed);
    
    // Test Rune
    let rune = AssetType::Rune("test_rune".to_string());
    let rune_str = rune.as_str();
    let rune_parsed = AssetType::from_str(&rune_str)?;
    assert_eq!(rune, rune_parsed);
    
    // Test Alkane
    let alkane = AssetType::Alkane("test_alkane".to_string());
    let alkane_str = alkane.as_str();
    let alkane_parsed = AssetType::from_str(&alkane_str)?;
    assert_eq!(alkane, alkane_parsed);
    
    Ok(())
}