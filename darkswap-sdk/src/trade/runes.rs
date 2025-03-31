//! Runes trade execution
//!
//! This module provides functionality for executing trades involving runes.

use anyhow::Result;
use bitcoin::Transaction;
use rust_decimal::Decimal;
use std::sync::Arc;

use crate::error::Error;
use crate::orderbook::{Order, OrderId, OrderSide};
use crate::runes::{Rune, RuneId, Runestone};
use crate::trade::{Trade, TradeId, TradeState};
use crate::types::Asset;
use crate::wallet::WalletInterface;

/// Rune trade executor
pub struct RuneTradeExecutor {
    /// Wallet
    wallet: Arc<dyn WalletInterface>,
}

impl RuneTradeExecutor {
    /// Create a new rune trade executor
    pub fn new(wallet: Arc<dyn WalletInterface>) -> Self {
        Self { wallet }
    }

    /// Create a PSBT for a rune trade
    pub async fn create_rune_trade_psbt(
        &self,
        trade: &Trade,
        is_maker: bool,
    ) -> Result<String> {
        // Check if the trade involves runes
        let (rune_asset, other_asset) = match (&trade.base_asset, &trade.quote_asset) {
            (Asset::Rune(rune_id), other) => (Asset::Rune(*rune_id), other.clone()),
            (other, Asset::Rune(rune_id)) => (Asset::Rune(*rune_id), other.clone()),
            _ => return Err(Error::Other("Trade does not involve runes".to_string()).into()),
        };

        // Get the rune ID
        let rune_id = match &rune_asset {
            Asset::Rune(id) => *id,
            _ => unreachable!(),
        };

        // Determine if we're sending or receiving runes
        let is_sending_runes = match (is_maker, &trade.base_asset, trade.side) {
            (true, Asset::Rune(_), OrderSide::Sell) => true,
            (true, Asset::Rune(_), OrderSide::Buy) => false,
            (true, _, OrderSide::Sell) => false,
            (true, _, OrderSide::Buy) => true,
            (false, Asset::Rune(_), OrderSide::Sell) => false,
            (false, Asset::Rune(_), OrderSide::Buy) => true,
            (false, _, OrderSide::Sell) => true,
            (false, _, OrderSide::Buy) => false,
        };

        // Get the amount of runes to send or receive
        let rune_amount = match trade.base_asset {
            Asset::Rune(_) => trade.amount.to_u128().unwrap_or(0) as u64,
            _ => {
                // Calculate the amount of runes based on the price
                let total_value = trade.amount * trade.price;
                total_value.to_u128().unwrap_or(0) as u64
            }
        };

        // Get the amount of the other asset to send or receive
        let other_amount = match trade.base_asset {
            Asset::Rune(_) => {
                // Calculate the amount of the other asset based on the price
                let total_value = trade.amount * trade.price;
                total_value.to_u128().unwrap_or(0) as u64
            }
            _ => trade.amount.to_u128().unwrap_or(0) as u64,
        };

        // Get the wallet address
        let address = self.wallet.get_address().await?;

        if is_sending_runes {
            // Create a runestone for sending runes
            let mut runestone = Runestone::default();
            runestone.add_edict(0, rune_id, rune_amount as u128);

            // Create a transfer transaction
            let tx = runestone.create_transfer_transaction(
                &address,
                &address, // TODO: Replace with the recipient's address
                bitcoin::Network::Regtest, // TODO: Get the network from the wallet
            )?;

            // Convert the transaction to a PSBT
            let psbt = self.transaction_to_psbt(&tx)?;

            Ok(psbt)
        } else {
            // Create a PSBT for receiving runes
            // In a real implementation, we would create a PSBT that expects to receive runes
            // For now, just create a dummy PSBT
            self.wallet
                .create_trade_psbt(
                    &trade.id,
                    &trade.order_id,
                    &trade.base_asset,
                    &trade.quote_asset,
                    rune_amount,
                    other_amount,
                )
                .await
        }
    }

    /// Convert a transaction to a PSBT
    fn transaction_to_psbt(&self, tx: &Transaction) -> Result<String> {
        // In a real implementation, we would convert the transaction to a PSBT
        // For now, just return a dummy PSBT
        Ok("dummy_psbt".to_string())
    }

    /// Verify a rune trade PSBT
    pub async fn verify_rune_trade_psbt(&self, psbt: &str, trade: &Trade) -> Result<bool> {
        // In a real implementation, we would verify that the PSBT contains the expected runes
        // For now, just return true
        Ok(true)
    }

    /// Sign a rune trade PSBT
    pub async fn sign_rune_trade_psbt(&self, psbt: &str) -> Result<String> {
        // In a real implementation, we would sign the PSBT
        // For now, just return the same PSBT
        Ok(psbt.to_string())
    }

    /// Finalize and broadcast a rune trade PSBT
    pub async fn finalize_and_broadcast_rune_trade_psbt(&self, psbt: &str) -> Result<String> {
        // In a real implementation, we would finalize and broadcast the PSBT
        // For now, just return a dummy txid
        Ok("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string())
    }
}