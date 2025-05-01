//! PSBT handling for DarkSwap
//!
//! This module provides functionality for handling PSBTs (Partially Signed Bitcoin Transactions).

use std::str::FromStr;
use std::sync::Arc;

use anyhow::Result;
use bitcoin::{
    psbt::Psbt, OutPoint, ScriptBuf, Transaction, TxIn, TxOut, Txid,
    Sequence, Witness,
};

use crate::{
    error::Error,
    wallet::Wallet,
};

/// PSBT handler
pub struct PsbtHandler {
    /// Wallet
    pub wallet: Arc<dyn Wallet + Send + Sync>,
}

impl PsbtHandler {
    /// Create a new PSBT handler
    pub fn new(wallet: Arc<dyn Wallet + Send + Sync>) -> Self {
        Self { wallet }
    }

    /// Create a PSBT for a trade
    pub async fn create_trade_psbt(&self, outputs: Vec<TxOut>, fee_rate: f64) -> Result<Psbt> {
        // Get UTXOs
        let utxos = self.wallet.get_utxos()?;
        if utxos.is_empty() {
            return Err(Error::InvalidTransaction("No UTXOs available".to_string()).into());
        }

        // Calculate total output amount
        let output_amount: u64 = outputs.iter().map(|o| o.value).sum();

        // Calculate total input amount
        let mut input_amount: u64 = 0;
        let mut inputs = Vec::new();
        for utxo in utxos {
            // Create input
            let txid = Txid::from_str(&utxo.txid)?;
            let input = TxIn {
                previous_output: OutPoint {
                    txid,
                    vout: utxo.vout,
                },
                script_sig: ScriptBuf::new(),
                sequence: Sequence::MAX,
                witness: Witness::new(),
            };
            inputs.push(input);
            input_amount += utxo.amount;

            // If we have enough inputs, stop
            if input_amount >= output_amount {
                break;
            }
        }

        // Create transaction
        let tx = Transaction {
            version: 2,
            lock_time: bitcoin::locktime::absolute::LockTime::ZERO,
            input: inputs,
            output: outputs,
        };

        // Check if we have enough inputs
        if tx.input.is_empty() {
            return Err(Error::InvalidTransaction("Transaction has no inputs".to_string()).into());
        }

        // Check if we have outputs
        if tx.output.is_empty() {
            return Err(Error::InvalidTransaction("Transaction has no outputs".to_string()).into());
        }

        // Calculate fee
        let weight = tx.weight();
        let tx_size = u64::from(weight) / 4; // Convert weight to vsize
        let fee = (tx_size as f64 * fee_rate).ceil() as u64;
        if input_amount < output_amount + fee {
            return Err(Error::InvalidTransaction(format!(
                "Insufficient funds: {} < {} + {}",
                input_amount, output_amount, fee
            )).into());
        }

        // Create PSBT
        let psbt = Psbt::from_unsigned_tx(tx)?;

        Ok(psbt)
    }

    /// Sign a PSBT
    pub async fn sign_psbt(&self, psbt: Psbt) -> Result<Psbt> {
        // In a real implementation, we would sign the PSBT
        // For now, just return the same PSBT
        Ok(psbt)
    }

    /// Finalize a PSBT
    pub async fn finalize_psbt(&self, psbt: Psbt) -> Result<Transaction> {
        // In a real implementation, we would finalize the PSBT
        // For now, just extract the transaction
        Ok(psbt.extract_tx())
    }

    /// Broadcast a transaction
    pub async fn broadcast_transaction(&self, tx: Transaction) -> Result<Txid> {
        // In a real implementation, we would broadcast the transaction
        // For now, just return the transaction ID
        Ok(tx.txid())
    }

    /// Verify a PSBT
    pub async fn verify_psbt(&self, psbt: &Psbt) -> Result<bool> {
        // Check if the PSBT has inputs
        if psbt.inputs.is_empty() {
            return Err(Error::InvalidPsbt("PSBT has no inputs".to_string()).into());
        }

        // Check if the PSBT has outputs
        if psbt.outputs.is_empty() {
            return Err(Error::InvalidPsbt("PSBT has no outputs".to_string()).into());
        }

        // Check if the inputs have witness UTXOs
        for input in &psbt.inputs {
            if input.witness_utxo.is_none() {
                return Err(Error::InvalidPsbt("Missing witness UTXO".to_string()).into());
            }
        }

        Ok(true)
    }

    /// Calculate fee for a PSBT
    pub fn calculate_fee(&self, psbt: &Psbt) -> Result<u64> {
        // Calculate input amount
        let mut input_amount = 0;
        for input in &psbt.inputs {
            if let Some(utxo) = &input.witness_utxo {
                input_amount += utxo.value;
            } else {
                return Err(Error::InvalidPsbt("Missing witness UTXO".to_string()).into());
            }
        }

        // Calculate output amount
        let output_amount: u64 = psbt.unsigned_tx.output.iter().map(|o| o.value).sum();

        // Calculate fee
        let fee = input_amount - output_amount;

        // Calculate fee rate
        let weight = psbt.clone().extract_tx().weight();
        let vsize = u64::from(weight) as f64 / 4.0;
        let fee_rate = fee as f64 / vsize;

        // Check if fee is reasonable
        if fee_rate < 1.0 {
            return Err(Error::InvalidPsbt(format!("Fee rate too low: {} sat/vB", fee_rate)).into());
        }
        if fee_rate > 1000.0 {
            return Err(Error::InvalidPsbt(format!("Fee rate too high: {} sat/vB", fee_rate)).into());
        }

        Ok(fee)
    }
}

/// Helper function to convert a hex string to bytes
fn _hex_to_bytes(hex: &str) -> Result<Vec<u8>> {
    let mut bytes = Vec::new();
    for i in 0..(hex.len() / 2) {
        let res = u8::from_str_radix(&hex[2 * i..2 * i + 2], 16);
        match res {
            Ok(v) => bytes.push(v),
            Err(_) => return Err(Error::InvalidPsbt("Invalid hex string".to_string()).into()),
        }
    }
    Ok(bytes)
}

/// Helper function to convert bytes to a hex string
fn _bytes_to_hex(bytes: &[u8]) -> String {
    let mut hex = String::new();
    for byte in bytes {
        hex.push_str(&format!("{:02x}", byte));
    }
    hex
}