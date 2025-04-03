//! PSBT handler for DarkSwap
//!
//! This module provides functionality for creating and signing PSBTs (Partially Signed Bitcoin Transactions).

use crate::{
    error::Error,
    wallet::{Utxo, Wallet},
    Result,
};
use bitcoin::{
    psbt::{Psbt, PsbtInput, PsbtOutput},
    Address, Amount, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid,
};
use std::{collections::HashMap, sync::Arc};

/// PSBT handler
pub struct PsbtHandler {
    /// Wallet
    wallet: Arc<dyn Wallet + Send + Sync>,
}

impl PsbtHandler {
    /// Create a new PSBT handler
    pub fn new(wallet: Arc<dyn Wallet + Send + Sync>) -> Self {
        Self { wallet }
    }
    
    /// Create a PSBT for a trade
    pub async fn create_trade_psbt(
        &self,
        outputs: Vec<TxOut>,
        fee_rate: f64,
    ) -> Result<Psbt> {
        // Get UTXOs
        let utxos = self.wallet.utxos()?;
        
        // Create a transaction
        let tx = self.wallet.create_transaction(outputs, fee_rate)?;
        
        // Convert to PSBT
        let mut psbt = Psbt::from_unsigned_tx(tx)?;
        
        // Add UTXO information
        for (i, input) in psbt.inputs.iter_mut().enumerate() {
            let txin = &psbt.unsigned_tx.input[i];
            let utxo = utxos.iter().find(|u| u.outpoint() == txin.previous_output)
                .ok_or_else(|| Error::UtxoNotFound(txin.previous_output.to_string()))?;
            
            input.witness_utxo = Some(TxOut {
                value: utxo.amount,
                script_pubkey: utxo.script_pubkey.clone(),
            });
        }
        
        Ok(psbt)
    }
    
    /// Sign a PSBT
    pub async fn sign_psbt(&self, mut psbt: Psbt) -> Result<Psbt> {
        // Extract the transaction
        let tx = psbt.extract_tx();
        
        // Sign the transaction
        let signed_tx = self.wallet.sign_transaction(tx)?;
        
        // Convert back to PSBT
        let mut signed_psbt = Psbt::from_unsigned_tx(signed_tx)?;
        
        // Copy the input and output data from the original PSBT
        for (i, input) in psbt.inputs.iter().enumerate() {
            if i < signed_psbt.inputs.len() {
                signed_psbt.inputs[i].witness_utxo = input.witness_utxo.clone();
                signed_psbt.inputs[i].redeem_script = input.redeem_script.clone();
                signed_psbt.inputs[i].witness_script = input.witness_script.clone();
                signed_psbt.inputs[i].bip32_derivation = input.bip32_derivation.clone();
                signed_psbt.inputs[i].proprietary = input.proprietary.clone();
                signed_psbt.inputs[i].unknown = input.unknown.clone();
            }
        }
        
        for (i, output) in psbt.outputs.iter().enumerate() {
            if i < signed_psbt.outputs.len() {
                signed_psbt.outputs[i].redeem_script = output.redeem_script.clone();
                signed_psbt.outputs[i].witness_script = output.witness_script.clone();
                signed_psbt.outputs[i].bip32_derivation = output.bip32_derivation.clone();
                signed_psbt.outputs[i].proprietary = output.proprietary.clone();
                signed_psbt.outputs[i].unknown = output.unknown.clone();
            }
        }
        
        Ok(signed_psbt)
    }
    
    /// Finalize a PSBT
    pub async fn finalize_psbt(&self, psbt: Psbt) -> Result<Transaction> {
        // Extract the transaction
        let tx = psbt.extract_tx();
        
        // Verify the transaction
        self.verify_transaction(&tx)?;
        
        Ok(tx)
    }
    
    /// Verify a transaction
    pub fn verify_transaction(&self, tx: &Transaction) -> Result<()> {
        // Verify that the transaction is valid
        // This is a simplified implementation
        
        // Check that the transaction has inputs
        if tx.input.is_empty() {
            return Err(Error::InvalidTransaction("Transaction has no inputs".to_string()));
        }
        
        // Check that the transaction has outputs
        if tx.output.is_empty() {
            return Err(Error::InvalidTransaction("Transaction has no outputs".to_string()));
        }
        
        // Check that the transaction is not too large
        let tx_size = tx.get_weight() / 4; // Convert weight to vsize
        if tx_size > 100_000 {
            return Err(Error::InvalidTransaction(format!(
                "Transaction is too large: {} vbytes",
                tx_size
            )));
        }
        
        Ok(())
    }
    
    /// Broadcast a transaction
    pub async fn broadcast_transaction(&self, tx: Transaction) -> Result<Txid> {
        self.wallet.broadcast_transaction(tx)
    }
    
    /// Combine PSBTs
    pub async fn combine_psbts(&self, psbts: Vec<Psbt>) -> Result<Psbt> {
        if psbts.is_empty() {
            return Err(Error::InvalidPsbt("No PSBTs to combine".to_string()));
        }
        
        let mut combined = psbts[0].clone();
        
        for psbt in psbts.iter().skip(1) {
            combined.combine(psbt.clone())?;
        }
        
        Ok(combined)
    }
    
    /// Extract transaction from PSBT
    pub fn extract_tx(&self, psbt: Psbt) -> Result<Transaction> {
        Ok(psbt.extract_tx())
    }
    
    /// Get the fee for a PSBT
    pub fn get_fee(&self, psbt: &Psbt) -> Result<u64> {
        // Calculate the input amount
        let mut input_amount = 0;
        for input in &psbt.inputs {
            if let Some(witness_utxo) = &input.witness_utxo {
                input_amount += witness_utxo.value;
            } else {
                return Err(Error::InvalidPsbt("Missing witness UTXO".to_string()));
            }
        }
        
        // Calculate the output amount
        let output_amount: u64 = psbt.unsigned_tx.output.iter().map(|o| o.value).sum();
        
        // Calculate the fee
        let fee = input_amount - output_amount;
        
        Ok(fee)
    }
    
    /// Get the fee rate for a PSBT
    pub fn get_fee_rate(&self, psbt: &Psbt) -> Result<f64> {
        // Get the fee
        let fee = self.get_fee(psbt)?;
        
        // Calculate the vsize
        let vsize = psbt.extract_tx().get_weight() as f64 / 4.0;
        
        // Calculate the fee rate
        let fee_rate = fee as f64 / vsize;
        
        Ok(fee_rate)
    }
    
    /// Add a change output to a PSBT
    pub async fn add_change_output(&self, mut psbt: Psbt, fee_rate: f64) -> Result<Psbt> {
        // Get the fee
        let fee = self.get_fee(&psbt)?;
        
        // Get the vsize
        let vsize = psbt.extract_tx().get_weight() as f64 / 4.0;
        
        // Calculate the target fee
        let target_fee = (vsize * fee_rate) as u64;
        
        // Calculate the change amount
        if fee > target_fee {
            let change_amount = fee - target_fee;
            
            // Get a change address
            let addresses = self.wallet.addresses()?;
            let change_address = addresses.first().ok_or_else(|| Error::NoAddresses)?;
            
            // Add the change output
            let mut tx = psbt.extract_tx();
            tx.output.push(TxOut {
                value: change_amount,
                script_pubkey: change_address.script_pubkey(),
            });
            
            // Convert back to PSBT
            let mut new_psbt = Psbt::from_unsigned_tx(tx)?;
            
            // Copy the input and output data from the original PSBT
            for (i, input) in psbt.inputs.iter().enumerate() {
                if i < new_psbt.inputs.len() {
                    new_psbt.inputs[i] = input.clone();
                }
            }
            
            for (i, output) in psbt.outputs.iter().enumerate() {
                if i < new_psbt.outputs.len() {
                    new_psbt.outputs[i] = output.clone();
                }
            }
            
            psbt = new_psbt;
        }
        
        Ok(psbt)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wallet::bdk_wallet::BdkWallet;
    use std::sync::Arc;
    
    #[tokio::test]
    async fn test_create_trade_psbt() {
        // Create a wallet
        let (wallet, _) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Create a PSBT handler
        let psbt_handler = PsbtHandler::new(Arc::new(wallet));
        
        // Create a PSBT
        let outputs = vec![
            TxOut {
                value: 1000,
                script_pubkey: Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")
                    .unwrap()
                    .script_pubkey(),
            },
        ];
        
        // This will fail because the wallet has no UTXOs
        let result = psbt_handler.create_trade_psbt(outputs, 1.0).await;
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_verify_transaction() {
        // Create a wallet
        let (wallet, _) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Create a PSBT handler
        let psbt_handler = PsbtHandler::new(Arc::new(wallet));
        
        // Create a transaction
        let tx = Transaction {
            version: 2,
            lock_time: 0,
            input: vec![
                TxIn {
                    previous_output: OutPoint {
                        txid: Txid::from_str("0000000000000000000000000000000000000000000000000000000000000000").unwrap(),
                        vout: 0,
                    },
                    script_sig: Script::new(),
                    sequence: 0xFFFFFFFF,
                    witness: Vec::new(),
                },
            ],
            output: vec![
                TxOut {
                    value: 1000,
                    script_pubkey: Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")
                        .unwrap()
                        .script_pubkey(),
                },
            ],
        };
        
        // Verify the transaction
        let result = psbt_handler.verify_transaction(&tx);
        assert!(result.is_ok());
    }
}