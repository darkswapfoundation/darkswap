//! Trade module for DarkSwap
//!
//! This module provides trade functionality for DarkSwap.

use std::sync::Arc;

use bitcoin::{psbt::Psbt, Transaction, Txid};

use crate::error::Error;
use crate::wallet::Wallet;

pub mod protocol;
pub mod psbt;
pub mod rune;
pub mod alkane;

/// Trade manager
pub struct TradeManager {
    /// Wallet
    _wallet: Arc<dyn Wallet + Send + Sync>,
    /// PSBT handler
    psbt_handler: psbt::PsbtHandler,
}

impl TradeManager {
    /// Create a new trade manager
    pub fn new(wallet: Arc<dyn Wallet + Send + Sync>) -> Self {
        Self {
            _wallet: wallet.clone(),
            psbt_handler: psbt::PsbtHandler::new(wallet),
        }
    }

    /// Create a PSBT for a trade
    pub async fn create_trade_psbt(&self, outputs: Vec<bitcoin::TxOut>, fee_rate: f64) -> crate::error::Result<Psbt> {
        self.psbt_handler.create_trade_psbt(outputs, fee_rate).await
            .map_err(|e| Error::TradeError(format!("Failed to create trade PSBT: {}", e)))
    }
    
    /// Create a transfer PSBT
    pub async fn create_transfer_psbt(
        &self,
        _asset_id: &str,
        _amount: u64,
        recipient: bitcoin::Address,
        fee_rate: f64,
    ) -> crate::error::Result<Psbt> {
        // Create an output for the recipient
        let output = bitcoin::TxOut {
            value: 546, // Minimum dust amount
            script_pubkey: recipient.script_pubkey(),
        };
        
        // Create a PSBT with the output
        let psbt = self.create_trade_psbt(vec![output], fee_rate).await?;
        
        // In a real implementation, we would add asset transfer data to the PSBT
        // For now, just return the PSBT
        
        Ok(psbt)
    }

    /// Sign a PSBT
    pub async fn sign_psbt(&self, psbt: Psbt) -> crate::error::Result<Psbt> {
        self.psbt_handler.sign_psbt(psbt).await
            .map_err(|e| Error::TradeError(format!("Failed to sign PSBT: {}", e)))
    }

    /// Finalize a PSBT
    pub async fn finalize_psbt(&self, psbt: Psbt) -> crate::error::Result<Transaction> {
        self.psbt_handler.finalize_psbt(psbt).await
            .map_err(|e| Error::TradeError(format!("Failed to finalize PSBT: {}", e)))
    }

    /// Broadcast a transaction
    pub async fn broadcast_transaction(&self, tx: Transaction) -> crate::error::Result<Txid> {
        self.psbt_handler.broadcast_transaction(tx).await
            .map_err(|e| Error::TradeError(format!("Failed to broadcast transaction: {}", e)))
    }

    /// Verify a PSBT
    pub async fn verify_psbt(&self, psbt: &Psbt) -> crate::error::Result<bool> {
        self.psbt_handler.verify_psbt(psbt).await
            .map_err(|e| Error::TradeError(format!("Failed to verify PSBT: {}", e)))
    }

    /// Calculate fee for a PSBT
    pub fn calculate_fee(&self, psbt: &Psbt) -> crate::error::Result<u64> {
        self.psbt_handler.calculate_fee(psbt)
            .map_err(|e| Error::TradeError(format!("Failed to calculate fee: {}", e)))
    }
}
