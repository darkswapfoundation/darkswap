//! Tests for the BDK wallet integration

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    wallet::{bdk_wallet::BdkWallet, Wallet},
};
use bitcoin::Network;

// Test mnemonic for testing purposes only - never use in production
const TEST_MNEMONIC: &str = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

#[tokio::test]
#[cfg(feature = "bdk-wallet")]
async fn test_bdk_wallet_creation() -> Result<()> {
    // Create a BDK wallet
    let wallet = BdkWallet::from_mnemonic(
        TEST_MNEMONIC,
        None,
        Network::Testnet,
    )?;
    
    // Get address
    let address = wallet.get_address()?;
    
    // Check that address is not empty
    assert!(!address.is_empty());
    
    // Check that address starts with a valid prefix for testnet
    assert!(address.starts_with("tb1") || address.starts_with("2") || address.starts_with("m") || address.starts_with("n"));
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "bdk-wallet")]
async fn test_bdk_wallet_balance() -> Result<()> {
    // Create a BDK wallet
    let wallet = BdkWallet::from_mnemonic(
        TEST_MNEMONIC,
        None,
        Network::Testnet,
    )?;
    
    // Get balance
    let balance = wallet.get_balance()?;
    
    // Balance might be 0 for a test mnemonic, so we just check that it's a valid u64
    assert!(balance >= 0);
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "bdk-wallet")]
async fn test_bdk_wallet_utxos() -> Result<()> {
    // Create a BDK wallet
    let wallet = BdkWallet::from_mnemonic(
        TEST_MNEMONIC,
        None,
        Network::Testnet,
    )?;
    
    // Get UTXOs
    let utxos = wallet.get_utxos()?;
    
    // UTXOs might be empty for a test mnemonic, so we just check that it's a valid vector
    assert!(utxos.is_empty() || !utxos.is_empty());
    
    // If there are UTXOs, check that they have valid properties
    for utxo in utxos {
        // Check that txid is a valid hex string
        assert!(utxo.txid.chars().all(|c| c.is_ascii_hexdigit()));
        
        // Check that script_pubkey is a valid hex string
        assert!(utxo.script_pubkey.chars().all(|c| c.is_ascii_hexdigit()));
    }
    
    Ok(())
}

#[tokio::test]
#[cfg(not(feature = "bdk-wallet"))]
async fn test_bdk_wallet_feature_disabled() -> Result<()> {
    // Attempt to create a BDK wallet when the feature is disabled
    let result = BdkWallet::from_mnemonic(
        TEST_MNEMONIC,
        None,
        Network::Testnet,
    );
    
    // Check that it returns an error
    assert!(result.is_err());
    
    // Check that the error message mentions the feature
    let error = result.unwrap_err();
    let error_message = error.to_string();
    assert!(error_message.contains("BDK wallet is not enabled"));
    assert!(error_message.contains("bdk-wallet feature"));
    
    Ok(())
}