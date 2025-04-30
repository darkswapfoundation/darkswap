//! Wallet module for DarkSwap
//!
//! This module provides wallet functionality for DarkSwap, including Bitcoin, runes, and alkanes.

use anyhow::Result;
use async_trait::async_trait;
use thiserror::Error;
use std::sync::Arc;

use crate::types::{Asset, OrderId, TradeId};
use crate::config;
use crate::error::Error as DarkSwapError;

pub mod bdk_wallet;
pub mod simple_wallet;

/// UTXO (Unspent Transaction Output)
#[derive(Debug, Clone)]
pub struct Utxo {
    /// Transaction ID
    pub txid: String,
    /// Output index
    pub vout: u32,
    /// Amount in satoshis
    pub amount: u64,
    /// Script pubkey in hex
    pub script_pubkey: String,
}

/// Wallet interface
#[async_trait]
pub trait Wallet: Send + Sync {
    /// Get wallet address
    fn get_address(&self) -> Result<String>;

    /// Get wallet balance
    fn get_balance(&self) -> Result<u64>;

    /// Get wallet UTXOs
    fn get_utxos(&self) -> Result<Vec<Utxo>>;
}

/// Wallet error
#[derive(Debug, Error)]
pub enum WalletError {
    /// Insufficient funds
    #[error("Insufficient funds")]
    InsufficientFunds,
    /// Invalid address
    #[error("Invalid address: {0}")]
    InvalidAddress(String),
    /// Invalid amount
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
    /// Invalid asset
    #[error("Invalid asset: {0}")]
    InvalidAsset(String),
    /// Invalid PSBT
    #[error("Invalid PSBT: {0}")]
    InvalidPsbt(String),
    /// Unsupported asset
    #[error("Unsupported asset: {0}")]
    UnsupportedAsset(String),
    /// Other error
    #[error("Wallet error: {0}")]
    Other(String),
}

/// Wallet interface
#[async_trait]
pub trait WalletInterface: Send + Sync {
    /// Get wallet address
    async fn get_address(&self) -> Result<String>;

    /// Get wallet balance
    async fn get_balance(&self) -> Result<u64>;

    /// Get asset balance
    async fn get_asset_balance(&self, asset: &Asset) -> Result<u64>;

    /// Create and sign a PSBT for an order
    async fn create_order_psbt(
        &self,
        order_id: &OrderId,
        base_asset: &Asset,
        quote_asset: &Asset,
        amount: u64,
        price: u64,
    ) -> Result<String>;

    /// Create and sign a PSBT for a trade
    async fn create_trade_psbt(
        &self,
        trade_id: &TradeId,
        order_id: &OrderId,
        base_asset: &Asset,
        quote_asset: &Asset,
        amount: u64,
        price: u64,
    ) -> Result<String>;

    /// Sign a PSBT
    async fn sign_psbt(&self, psbt_base64: &str) -> Result<String>;

    /// Finalize and broadcast a PSBT
    async fn finalize_and_broadcast_psbt(&self, psbt_base64: &str) -> Result<String>;

    /// Verify a PSBT
    async fn verify_psbt(&self, psbt_base64: &str) -> Result<bool>;
}

/// Create a wallet based on the configuration
pub fn create_wallet(config: &config::WalletConfig) -> Result<Arc<dyn Wallet + Send + Sync>> {
    match config.wallet_type.as_str() {
        "simple" => {
            let wallet = simple_wallet::SimpleWallet::new(None, config::BitcoinNetwork::Testnet)?;
            Ok(Arc::new(wallet))
        },
        "bdk" => {
            let network = match config.bitcoin_network {
                config::BitcoinNetwork::Mainnet => bitcoin::Network::Bitcoin,
                config::BitcoinNetwork::Testnet => bitcoin::Network::Testnet,
                config::BitcoinNetwork::Regtest => bitcoin::Network::Regtest,
                config::BitcoinNetwork::Signet => bitcoin::Network::Signet,
            };
            
            let wallet = bdk_wallet::BdkWallet::from_mnemonic(
                config.mnemonic.as_deref(),
                config.password.as_deref(),
                network,
            )?;
            
            Ok(Arc::new(wallet))
        },
        _ => Err(DarkSwapError::ConfigError(format!("Unknown wallet type: {}", config.wallet_type)).into()),
    }
}