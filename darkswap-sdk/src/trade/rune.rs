//! Rune handler for DarkSwap
//!
//! This module provides functionality for creating and verifying rune transactions.

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

/// Rune ID
pub type RuneId = String;

/// Rune handler
pub struct RuneHandler {
    /// Wallet
    wallet: Arc<dyn Wallet + Send + Sync>,
}

impl RuneHandler {
    /// Create a new rune handler
    pub fn new(wallet: Arc<dyn Wallet + Send + Sync>) -> Self {
        Self { wallet }
    }
    
    /// Get the rune balance
    pub async fn balance(&self) -> Result<HashMap<RuneId, u64>> {
        self.wallet.rune_balance()
    }
    
    /// Get the balance of a specific rune
    pub async fn balance_of(&self, rune_id: &str) -> Result<u64> {
        let balances = self.wallet.rune_balance()?;
        Ok(balances.get(rune_id).copied().unwrap_or(0))
    }
    
    /// Create a PSBT for a rune transfer
    pub async fn create_transfer_psbt(
        &self,
        rune_id: &str,
        amount: u64,
        recipient: Address,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Get the rune balance
        let balances = self.wallet.rune_balance()?;
        
        // Check if we have enough runes
        let balance = balances.get(rune_id).copied().unwrap_or(0);
        if balance < amount {
            return Err(Error::InsufficientFunds(format!(
                "Insufficient rune balance: have {}, need {}",
                balance, amount
            )));
        }
        
        // Create a transaction with the rune transfer
        // This is a simplified implementation
        // In a real implementation, we would need to create a proper rune transfer transaction
        let mut outputs = Vec::new();
        
        // Add the recipient output
        outputs.push(TxOut {
            value: 546, // Minimum dust amount
            script_pubkey: recipient.script_pubkey(),
        });
        
        // Create a transaction
        let tx = self.wallet.create_transaction(outputs, fee_rate)?;
        
        // Convert to PSBT
        let mut psbt = Psbt::from_unsigned_tx(tx)?;
        
        // Add rune transfer data
        // This is a simplified implementation
        // In a real implementation, we would need to add proper rune transfer data
        // For now, we'll just add a dummy proprietary field to indicate a rune transfer
        for output in psbt.outputs.iter_mut() {
            let mut key = Vec::new();
            key.extend_from_slice(b"rune");
            key.extend_from_slice(rune_id.as_bytes());
            
            let mut value = Vec::new();
            value.extend_from_slice(&amount.to_le_bytes());
            
            output.proprietary.insert((0x00, key), value);
        }
        
        Ok(psbt)
    }
    
    /// Verify a rune transfer
    pub async fn verify_transfer(&self, psbt: &Psbt, rune_id: &str, amount: u64) -> Result<()> {
        // Verify that the PSBT contains a valid rune transfer
        // This is a simplified implementation
        // In a real implementation, we would need to verify the rune transfer data
        
        // Check that the PSBT has outputs
        if psbt.outputs.is_empty() {
            return Err(Error::InvalidPsbt("PSBT has no outputs".to_string()));
        }
        
        // Check that at least one output has the rune transfer data
        let mut found = false;
        for output in &psbt.outputs {
            for ((prefix, key), value) in &output.proprietary {
                if *prefix == 0x00 && key.starts_with(b"rune") && key[4..] == rune_id.as_bytes() {
                    // Check the amount
                    if value.len() >= 8 {
                        let mut amount_bytes = [0u8; 8];
                        amount_bytes.copy_from_slice(&value[0..8]);
                        let transfer_amount = u64::from_le_bytes(amount_bytes);
                        
                        if transfer_amount == amount {
                            found = true;
                            break;
                        }
                    }
                }
            }
            
            if found {
                break;
            }
        }
        
        if !found {
            return Err(Error::InvalidPsbt(format!(
                "PSBT does not contain a valid rune transfer for {} with amount {}",
                rune_id, amount
            )));
        }
        
        Ok(())
    }
    
    /// Create a PSBT for a rune issuance
    pub async fn create_issuance_psbt(
        &self,
        rune_id: &str,
        amount: u64,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Create a transaction with the rune issuance
        // This is a simplified implementation
        // In a real implementation, we would need to create a proper rune issuance transaction
        let mut outputs = Vec::new();
        
        // Add an output to ourselves
        let addresses = self.wallet.addresses()?;
        let address = addresses.first().ok_or_else(|| Error::NoAddresses)?;
        
        outputs.push(TxOut {
            value: 546, // Minimum dust amount
            script_pubkey: address.script_pubkey(),
        });
        
        // Create a transaction
        let tx = self.wallet.create_transaction(outputs, fee_rate)?;
        
        // Convert to PSBT
        let mut psbt = Psbt::from_unsigned_tx(tx)?;
        
        // Add rune issuance data
        // This is a simplified implementation
        // In a real implementation, we would need to add proper rune issuance data
        // For now, we'll just add a dummy proprietary field to indicate a rune issuance
        for output in psbt.outputs.iter_mut() {
            let mut key = Vec::new();
            key.extend_from_slice(b"rune_issue");
            key.extend_from_slice(rune_id.as_bytes());
            
            let mut value = Vec::new();
            value.extend_from_slice(&amount.to_le_bytes());
            
            output.proprietary.insert((0x00, key), value);
        }
        
        Ok(psbt)
    }
    
    /// Verify a rune issuance
    pub async fn verify_issuance(&self, psbt: &Psbt, rune_id: &str, amount: u64) -> Result<()> {
        // Verify that the PSBT contains a valid rune issuance
        // This is a simplified implementation
        // In a real implementation, we would need to verify the rune issuance data
        
        // Check that the PSBT has outputs
        if psbt.outputs.is_empty() {
            return Err(Error::InvalidPsbt("PSBT has no outputs".to_string()));
        }
        
        // Check that at least one output has the rune issuance data
        let mut found = false;
        for output in &psbt.outputs {
            for ((prefix, key), value) in &output.proprietary {
                if *prefix == 0x00 && key.starts_with(b"rune_issue") && key[10..] == rune_id.as_bytes() {
                    // Check the amount
                    if value.len() >= 8 {
                        let mut amount_bytes = [0u8; 8];
                        amount_bytes.copy_from_slice(&value[0..8]);
                        let issuance_amount = u64::from_le_bytes(amount_bytes);
                        
                        if issuance_amount == amount {
                            found = true;
                            break;
                        }
                    }
                }
            }
            
            if found {
                break;
            }
        }
        
        if !found {
            return Err(Error::InvalidPsbt(format!(
                "PSBT does not contain a valid rune issuance for {} with amount {}",
                rune_id, amount
            )));
        }
        
        Ok(())
    }
    
    /// Create a PSBT for a rune burn
    pub async fn create_burn_psbt(
        &self,
        rune_id: &str,
        amount: u64,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Get the rune balance
        let balances = self.wallet.rune_balance()?;
        
        // Check if we have enough runes
        let balance = balances.get(rune_id).copied().unwrap_or(0);
        if balance < amount {
            return Err(Error::InsufficientFunds(format!(
                "Insufficient rune balance: have {}, need {}",
                balance, amount
            )));
        }
        
        // Create a transaction with the rune burn
        // This is a simplified implementation
        // In a real implementation, we would need to create a proper rune burn transaction
        let mut outputs = Vec::new();
        
        // Add an OP_RETURN output
        let script = Script::new_op_return(&[0x62, 0x75, 0x72, 0x6e]); // "burn" in ASCII
        
        outputs.push(TxOut {
            value: 0,
            script_pubkey: script,
        });
        
        // Create a transaction
        let tx = self.wallet.create_transaction(outputs, fee_rate)?;
        
        // Convert to PSBT
        let mut psbt = Psbt::from_unsigned_tx(tx)?;
        
        // Add rune burn data
        // This is a simplified implementation
        // In a real implementation, we would need to add proper rune burn data
        // For now, we'll just add a dummy proprietary field to indicate a rune burn
        for output in psbt.outputs.iter_mut() {
            let mut key = Vec::new();
            key.extend_from_slice(b"rune_burn");
            key.extend_from_slice(rune_id.as_bytes());
            
            let mut value = Vec::new();
            value.extend_from_slice(&amount.to_le_bytes());
            
            output.proprietary.insert((0x00, key), value);
        }
        
        Ok(psbt)
    }
    
    /// Verify a rune burn
    pub async fn verify_burn(&self, psbt: &Psbt, rune_id: &str, amount: u64) -> Result<()> {
        // Verify that the PSBT contains a valid rune burn
        // This is a simplified implementation
        // In a real implementation, we would need to verify the rune burn data
        
        // Check that the PSBT has outputs
        if psbt.outputs.is_empty() {
            return Err(Error::InvalidPsbt("PSBT has no outputs".to_string()));
        }
        
        // Check that at least one output has the rune burn data
        let mut found = false;
        for output in &psbt.outputs {
            for ((prefix, key), value) in &output.proprietary {
                if *prefix == 0x00 && key.starts_with(b"rune_burn") && key[9..] == rune_id.as_bytes() {
                    // Check the amount
                    if value.len() >= 8 {
                        let mut amount_bytes = [0u8; 8];
                        amount_bytes.copy_from_slice(&value[0..8]);
                        let burn_amount = u64::from_le_bytes(amount_bytes);
                        
                        if burn_amount == amount {
                            found = true;
                            break;
                        }
                    }
                }
            }
            
            if found {
                break;
            }
        }
        
        if !found {
            return Err(Error::InvalidPsbt(format!(
                "PSBT does not contain a valid rune burn for {} with amount {}",
                rune_id, amount
            )));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wallet::bdk_wallet::BdkWallet;
    use std::sync::Arc;
    
    #[tokio::test]
    async fn test_create_transfer_psbt() {
        // Create a wallet
        let (wallet, _) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Create a rune handler
        let rune_handler = RuneHandler::new(Arc::new(wallet));
        
        // Create a PSBT for a rune transfer
        let recipient = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
        
        // This will fail because the wallet has no runes
        let result = rune_handler.create_transfer_psbt("test_rune", 1000, recipient, 1.0).await;
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_verify_transfer() {
        // Create a wallet
        let (wallet, _) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Create a rune handler
        let rune_handler = RuneHandler::new(Arc::new(wallet));
        
        // Create a PSBT
        let mut psbt = Psbt::new();
        
        // Add an output
        psbt.unsigned_tx.output.push(TxOut {
            value: 546,
            script_pubkey: Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")
                .unwrap()
                .script_pubkey(),
        });
        
        // Add rune transfer data
        let mut output = PsbtOutput::default();
        let mut key = Vec::new();
        key.extend_from_slice(b"rune");
        key.extend_from_slice(b"test_rune");
        
        let mut value = Vec::new();
        value.extend_from_slice(&1000u64.to_le_bytes());
        
        output.proprietary.insert((0x00, key), value);
        psbt.outputs.push(output);
        
        // Verify the transfer
        let result = rune_handler.verify_transfer(&psbt, "test_rune", 1000).await;
        assert!(result.is_ok());
    }
}