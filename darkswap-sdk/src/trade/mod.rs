//! Trade module for DarkSwap
//!
//! This module provides functionality for trading Bitcoin, runes, and alkanes.

pub mod alkane;
pub mod psbt;
pub mod rune;
pub mod protocol;

use crate::{
    error::Error,
    wallet::Wallet,
    Result,
};
use bitcoin::{
    psbt::Psbt,
    Address, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid,
};
use std::{collections::HashMap, sync::Arc};

/// Re-export types
pub use alkane::AlkaneId;
pub use rune::RuneId;

/// Asset type
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AssetType {
    /// Bitcoin
    Bitcoin,
    /// Rune
    Rune(RuneId),
    /// Alkane
    Alkane(AlkaneId),
}

impl AssetType {
    /// Get the asset type as a string
    pub fn as_str(&self) -> String {
        match self {
            AssetType::Bitcoin => "bitcoin".to_string(),
            AssetType::Rune(id) => format!("rune:{}", id),
            AssetType::Alkane(id) => format!("alkane:{}", id),
        }
    }
    
    /// Parse an asset type from a string
    pub fn from_str(s: &str) -> Result<Self> {
        if s == "bitcoin" {
            Ok(AssetType::Bitcoin)
        } else if s.starts_with("rune:") {
            let id = s.strip_prefix("rune:").unwrap();
            Ok(AssetType::Rune(id.to_string()))
        } else if s.starts_with("alkane:") {
            let id = s.strip_prefix("alkane:").unwrap();
            Ok(AssetType::Alkane(id.to_string()))
        } else {
            Err(Error::InvalidAssetType(s.to_string()))
        }
    }
}

/// Trade manager
pub struct TradeManager {
    /// PSBT handler
    psbt_handler: Arc<psbt::PsbtHandler>,
    /// Rune handler
    rune_handler: Arc<rune::RuneHandler>,
    /// Alkane handler
    alkane_handler: Arc<alkane::AlkaneHandler>,
}

impl TradeManager {
    /// Create a new trade manager
    pub fn new(wallet: Arc<dyn Wallet + Send + Sync>) -> Self {
        let psbt_handler = Arc::new(psbt::PsbtHandler::new(wallet.clone()));
        let rune_handler = Arc::new(rune::RuneHandler::new(wallet.clone()));
        let alkane_handler = Arc::new(alkane::AlkaneHandler::new(wallet));
        
        Self {
            psbt_handler,
            rune_handler,
            alkane_handler,
        }
    }
    
    /// Get the PSBT handler
    pub fn psbt_handler(&self) -> Arc<psbt::PsbtHandler> {
        self.psbt_handler.clone()
    }
    
    /// Get the rune handler
    pub fn rune_handler(&self) -> Arc<rune::RuneHandler> {
        self.rune_handler.clone()
    }
    
    /// Get the alkane handler
    pub fn alkane_handler(&self) -> Arc<alkane::AlkaneHandler> {
        self.alkane_handler.clone()
    }
    
    /// Get the balance of an asset
    pub async fn balance(&self, asset_type: &AssetType) -> Result<u64> {
        match asset_type {
            AssetType::Bitcoin => {
                // Get the Bitcoin balance
                let wallet = self.psbt_handler.wallet.clone();
                wallet.balance()
            }
            AssetType::Rune(id) => {
                // Get the rune balance
                self.rune_handler.balance_of(id).await
            }
            AssetType::Alkane(id) => {
                // Get the alkane balance
                self.alkane_handler.balance_of(id).await
            }
        }
    }
    
    /// Create a PSBT for a transfer
    pub async fn create_transfer_psbt(
        &self,
        asset_type: &AssetType,
        amount: u64,
        recipient: Address,
        fee_rate: f64,
    ) -> Result<Psbt> {
        match asset_type {
            AssetType::Bitcoin => {
                // Create a Bitcoin transfer PSBT
                let outputs = vec![
                    TxOut {
                        value: amount,
                        script_pubkey: recipient.script_pubkey(),
                    },
                ];
                
                self.psbt_handler.create_trade_psbt(outputs, fee_rate).await
            }
            AssetType::Rune(id) => {
                // Create a rune transfer PSBT
                self.rune_handler.create_transfer_psbt(id, amount, recipient, fee_rate).await
            }
            AssetType::Alkane(id) => {
                // Create an alkane transfer PSBT
                self.alkane_handler.create_transfer_psbt(id, amount, recipient, fee_rate).await
            }
        }
    }
    
    /// Verify a transfer
    pub async fn verify_transfer(
        &self,
        psbt: &Psbt,
        asset_type: &AssetType,
        amount: u64,
    ) -> Result<()> {
        match asset_type {
            AssetType::Bitcoin => {
                // Verify a Bitcoin transfer
                // This is a simplified implementation
                // In a real implementation, we would need to verify the Bitcoin transfer
                Ok(())
            }
            AssetType::Rune(id) => {
                // Verify a rune transfer
                self.rune_handler.verify_transfer(psbt, id, amount).await
            }
            AssetType::Alkane(id) => {
                // Verify an alkane transfer
                self.alkane_handler.verify_transfer(psbt, id, amount).await
            }
        }
    }
    
    /// Sign a PSBT
    pub async fn sign_psbt(&self, psbt: Psbt) -> Result<Psbt> {
        self.psbt_handler.sign_psbt(psbt).await
    }
    
    /// Finalize a PSBT
    pub async fn finalize_psbt(&self, psbt: Psbt) -> Result<Transaction> {
        self.psbt_handler.finalize_psbt(psbt).await
    }
    
    /// Broadcast a transaction
    pub async fn broadcast_transaction(&self, tx: Transaction) -> Result<Txid> {
        self.psbt_handler.broadcast_transaction(tx).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wallet::bdk_wallet::BdkWallet;
    use std::sync::Arc;
    
    #[tokio::test]
    async fn test_asset_type() {
        // Test Bitcoin
        let bitcoin = AssetType::Bitcoin;
        let bitcoin_str = bitcoin.as_str();
        let bitcoin_parsed = AssetType::from_str(&bitcoin_str).unwrap();
        assert_eq!(bitcoin, bitcoin_parsed);
        
        // Test Rune
        let rune = AssetType::Rune("test_rune".to_string());
        let rune_str = rune.as_str();
        let rune_parsed = AssetType::from_str(&rune_str).unwrap();
        assert_eq!(rune, rune_parsed);
        
        // Test Alkane
        let alkane = AssetType::Alkane("test_alkane".to_string());
        let alkane_str = alkane.as_str();
        let alkane_parsed = AssetType::from_str(&alkane_str).unwrap();
        assert_eq!(alkane, alkane_parsed);
    }
    
    #[tokio::test]
    async fn test_trade_manager() {
        // Create a wallet
        let (wallet, _) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Create a trade manager
        let trade_manager = TradeManager::new(Arc::new(wallet));
        
        // Get the handlers
        let psbt_handler = trade_manager.psbt_handler();
        let rune_handler = trade_manager.rune_handler();
        let alkane_handler = trade_manager.alkane_handler();
        
        // Check that the handlers are not null
        assert!(psbt_handler.is_some());
        assert!(rune_handler.is_some());
        assert!(alkane_handler.is_some());
    }
}
