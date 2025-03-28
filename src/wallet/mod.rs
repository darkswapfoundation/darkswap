//! Wallet module for DarkSwap
//!
//! This module provides wallet functionality for DarkSwap, including Bitcoin, runes, and alkanes.

use std::fmt;

use anyhow::Result;
use async_trait::async_trait;
use thiserror::Error;

use crate::orderbook::OrderId;
use crate::types::{Asset, TradeId};

pub mod bdk_wallet;
pub mod simple_wallet;

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