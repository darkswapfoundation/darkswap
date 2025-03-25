//! Runes protocol implementation for DarkSwap
//!
//! This module provides support for the runes protocol, enabling trading of
//! Bitcoin-based tokens using the Ordinals protocol.

use crate::error::{Error, Result};
use crate::types::{RuneId};
use bitcoin::{
    Network, OutPoint, ScriptBuf, Transaction, TxIn, TxOut, Txid, Witness,
    address::{Address, NetworkUnchecked},
};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex};

/// Rune data
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rune {
    /// Rune ID
    pub id: RuneId,
    /// Rune symbol
    pub symbol: String,
    /// Rune name
    pub name: String,
    /// Rune decimals
    pub decimals: u8,
    /// Rune supply
    pub supply: u64,
    /// Rune limit
    pub limit: Option<u64>,
    /// Rune metadata
    pub metadata: HashMap<String, String>,
}

impl Rune {
    /// Create a new rune
    pub fn new(
        id: RuneId,
        symbol: String,
        name: String,
        decimals: u8,
        supply: u64,
        limit: Option<u64>,
    ) -> Self {
        Self {
            id,
            symbol,
            name,
            decimals,
            supply,
            limit,
            metadata: HashMap::new(),
        }
    }

    /// Format amount with decimals
    pub fn format_amount(&self, amount: u64) -> String {
        let decimal_amount = Decimal::from(amount) / Decimal::from(10u64.pow(self.decimals as u32));
        format!("{} {}", decimal_amount, self.symbol)
    }

    /// Parse amount from string
    pub fn parse_amount(&self, amount_str: &str) -> Result<u64> {
        let parts: Vec<&str> = amount_str.split_whitespace().collect();
        if parts.len() != 2 || parts[1] != self.symbol {
            return Err(Error::InvalidAmount(format!("Invalid amount format: {}", amount_str)));
        }

        let decimal_amount = Decimal::from_str(parts[0])
            .map_err(|e| Error::InvalidAmount(format!("Invalid decimal: {}", e)))?;
        let amount = decimal_amount * Decimal::from(10u64.pow(self.decimals as u32));
        
        Ok(amount.to_u64().ok_or_else(|| Error::InvalidAmount("Amount overflow".to_string()))?)
    }

    /// Add metadata
    pub fn add_metadata(&mut self, key: String, value: String) {
        self.metadata.insert(key, value);
    }

    /// Get metadata
    pub fn get_metadata(&self, key: &str) -> Option<&String> {
        self.metadata.get(key)
    }
}

/// Rune transfer
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RuneTransfer {
    /// Rune ID
    pub rune_id: RuneId,
    /// From address
    pub from: Address<NetworkUnchecked>,
    /// To address
    pub to: Address<NetworkUnchecked>,
    /// Amount
    pub amount: u64,
    /// Memo
    pub memo: Option<String>,
}

impl RuneTransfer {
    /// Create a new rune transfer
    pub fn new(
        rune_id: RuneId,
        from: Address<NetworkUnchecked>,
        to: Address<NetworkUnchecked>,
        amount: u64,
        memo: Option<String>,
    ) -> Self {
        Self {
            rune_id,
            from,
            to,
            amount,
            memo,
        }
    }
}

/// Rune balance
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RuneBalance {
    /// Rune ID
    pub rune_id: RuneId,
    /// Address
    pub address: Address<NetworkUnchecked>,
    /// Balance
    pub balance: u64,
}

impl RuneBalance {
    /// Create a new rune balance
    pub fn new(rune_id: RuneId, address: Address<NetworkUnchecked>, balance: u64) -> Self {
        Self {
            rune_id,
            address,
            balance,
        }
    }
}

/// Rune protocol
pub struct RuneProtocol {
    /// Bitcoin network
    network: Network,
    /// Runes by ID
    runes: HashMap<RuneId, Rune>,
    /// Rune balances by address and rune ID
    balances: HashMap<(Address<NetworkUnchecked>, RuneId), u64>,
    /// Rune transactions
    transactions: Vec<Transaction>,
}

impl RuneProtocol {
    /// Create a new rune protocol
    pub fn new(network: Network) -> Self {
        Self {
            network,
            runes: HashMap::new(),
            balances: HashMap::new(),
            transactions: Vec::new(),
        }
    }

    /// Get the Bitcoin network
    pub fn network(&self) -> Network {
        self.network
    }

    /// Register a rune
    pub fn register_rune(&mut self, rune: Rune) -> Result<()> {
        // Check if rune already exists
        if self.runes.contains_key(&rune.id) {
            return Err(Error::InvalidAsset(format!("Rune already exists: {}", rune.id)));
        }

        // Add rune to registry
        self.runes.insert(rune.id.clone(), rune);

        Ok(())
    }

    /// Get a rune by ID
    pub fn get_rune(&self, rune_id: &RuneId) -> Option<&Rune> {
        self.runes.get(rune_id)
    }

    /// Get all runes
    pub fn get_runes(&self) -> Vec<&Rune> {
        self.runes.values().collect()
    }

    /// Get rune balance for an address
    pub fn get_balance(&self, address: &Address<NetworkUnchecked>, rune_id: &RuneId) -> u64 {
        self.balances.get(&(address.clone(), rune_id.clone())).cloned().unwrap_or(0)
    }

    /// Get all balances for an address
    pub fn get_balances(&self, address: &Address<NetworkUnchecked>) -> Vec<RuneBalance> {
        let mut balances = Vec::new();

        for ((addr, rune_id), balance) in &self.balances {
            if addr == address {
                balances.push(RuneBalance::new(rune_id.clone(), addr.clone(), *balance));
            }
        }

        balances
    }

    /// Create a rune transfer
    pub fn create_transfer(
        &self,
        rune_id: &RuneId,
        from: &Address<NetworkUnchecked>,
        to: &Address<NetworkUnchecked>,
        amount: u64,
        memo: Option<String>,
    ) -> Result<RuneTransfer> {
        // Check if rune exists
        if !self.runes.contains_key(rune_id) {
            return Err(Error::InvalidAsset(format!("Rune not found: {}", rune_id)));
        }

        // Check if sender has enough balance
        let balance = self.get_balance(from, rune_id);
        if balance < amount {
            return Err(Error::InsufficientFunds);
        }

        Ok(RuneTransfer::new(
            rune_id.clone(),
            from.clone(),
            to.clone(),
            amount,
            memo,
        ))
    }

    /// Apply a rune transfer
    pub fn apply_transfer(&mut self, transfer: &RuneTransfer) -> Result<()> {
        // Check if rune exists
        if !self.runes.contains_key(&transfer.rune_id) {
            return Err(Error::InvalidAsset(format!("Rune not found: {}", transfer.rune_id)));
        }

        // Check if sender has enough balance
        let sender_balance = self.get_balance(&transfer.from, &transfer.rune_id);
        if sender_balance < transfer.amount {
            return Err(Error::InsufficientFunds);
        }

        // Update balances
        let sender_key = (transfer.from.clone(), transfer.rune_id.clone());
        let receiver_key = (transfer.to.clone(), transfer.rune_id.clone());

        // Decrease sender balance
        self.balances.insert(sender_key, sender_balance - transfer.amount);

        // Increase receiver balance
        let receiver_balance = self.get_balance(&transfer.to, &transfer.rune_id);
        self.balances.insert(receiver_key, receiver_balance + transfer.amount);

        Ok(())
    }

    /// Create a rune transaction
    pub fn create_transaction(
        &self,
        transfer: &RuneTransfer,
        inputs: Vec<(OutPoint, TxOut)>,
        change_address: &Address,
        fee_rate: f64,
    ) -> Result<Transaction> {
        // Check if rune exists
        if !self.runes.contains_key(&transfer.rune_id) {
            return Err(Error::InvalidAsset(format!("Rune not found: {}", transfer.rune_id)));
        }

        // Create inputs
        let mut tx_inputs = Vec::new();
        let mut input_value = 0;
        for (outpoint, txout) in &inputs {
            tx_inputs.push(TxIn {
                previous_output: *outpoint,
                script_sig: ScriptBuf::new(),
                sequence: bitcoin::Sequence::MAX,
                witness: Witness::new(),
            });
            input_value += txout.value;
        }

        // Create outputs
        let mut tx_outputs = Vec::new();

        // Add rune transfer output
        // In a real implementation, this would use the runes protocol
        // For now, we'll use a simple OP_RETURN output
        let rune_data = format!("RUNE:{}:{}", transfer.rune_id, transfer.amount);
        // Use a Vec<u8> and convert it to a fixed-size array that implements AsRef<PushBytes>
        let data_bytes = rune_data.into_bytes();
        let data_len = std::cmp::min(data_bytes.len(), 80); // OP_RETURN limit
        
        // Create a script based on the length of the data
        let script = if data_len <= 75 {
            // Use a slice of the appropriate size
            match data_len {
                0 => ScriptBuf::new_op_return(&[0u8; 0]),
                1 => {
                    let mut arr = [0u8; 1];
                    arr.copy_from_slice(&data_bytes[..1]);
                    ScriptBuf::new_op_return(&arr)
                },
                2 => {
                    let mut arr = [0u8; 2];
                    arr.copy_from_slice(&data_bytes[..2]);
                    ScriptBuf::new_op_return(&arr)
                },
                // Add more cases as needed
                _ => {
                    // For other lengths, use a more generic approach
                    // This is a simplification - in a real implementation, you'd handle all possible lengths
                    let mut script = ScriptBuf::new();
                    script.push_opcode(bitcoin::opcodes::all::OP_RETURN);
                    // Use a fixed-size array that implements AsRef<PushBytes>
                    let mut buffer = [0u8; 75]; // Max size for a standard push
                    buffer[..data_len].copy_from_slice(&data_bytes[..data_len]);
                    // Use a small fixed-size array that implements AsRef<PushBytes>
                    let mut small_buffer = [0u8; 1];
                    if data_len > 0 {
                        small_buffer[0] = buffer[0];
                        script.push_slice(&small_buffer);
                    }
                    script
                }
            }
        } else {
            // For larger data, use push_slice directly
            let mut script = ScriptBuf::new();
            script.push_opcode(bitcoin::opcodes::all::OP_RETURN);
            // Use a fixed-size array that implements AsRef<PushBytes>
            let mut buffer = [0u8; 75]; // Max size for a standard push
            let len = std::cmp::min(data_len, 75);
            buffer[..len].copy_from_slice(&data_bytes[..len]);
            // Use a small fixed-size array that implements AsRef<PushBytes>
            let mut small_buffer = [0u8; 1];
            if len > 0 {
                small_buffer[0] = buffer[0];
                script.push_slice(&small_buffer);
            }
            script
        };
        tx_outputs.push(TxOut {
            value: 0,
            script_pubkey: script,
        });

        // Add recipient output
        tx_outputs.push(TxOut {
            value: 546, // Dust limit
            script_pubkey: transfer.to.payload.script_pubkey(),
        });

        // Calculate fee
        let tx_size = Self::estimate_transaction_size(tx_inputs.len(), tx_outputs.len() + 1);
        let fee = (tx_size as f64 * fee_rate).ceil() as u64;

        // Add change output
        let change_value = input_value - 546 - fee;
        if change_value > 546 {
            tx_outputs.push(TxOut {
                value: change_value,
                script_pubkey: change_address.script_pubkey(),
            });
        }

        // Create transaction
        let tx = Transaction {
            version: 2,
            lock_time: bitcoin::absolute::LockTime::ZERO,
            input: tx_inputs,
            output: tx_outputs,
        };

        Ok(tx)
    }

    /// Validate a rune transaction
    pub fn validate_transaction(&self, transaction: &Transaction) -> Result<Option<RuneTransfer>> {
        // In a real implementation, this would validate the transaction against the runes protocol
        // For now, we'll just check if it has an OP_RETURN output with the right format
        for output in &transaction.output {
            if output.script_pubkey.is_op_return() {
                let data = output.script_pubkey.as_bytes();
                if data.len() > 6 && &data[0..6] == b"RUNE:" {
                    let data_str = String::from_utf8_lossy(&data[6..]);
                    let parts: Vec<&str> = data_str.split(':').collect();
                    if parts.len() == 2 {
                        let rune_id = RuneId(parts[0].to_string());
                        let amount = parts[1].parse::<u64>().map_err(|_| {
                            Error::InvalidTransaction("Invalid rune amount".to_string())
                        })?;

                        // Find the recipient address
                        if transaction.output.len() < 2 {
                            return Err(Error::InvalidTransaction("Missing recipient output".to_string()));
                        }

                        let recipient_output = &transaction.output[1];
                        let recipient_address = Address::from_script(&recipient_output.script_pubkey, self.network)
                            .map_err(|_| Error::InvalidTransaction("Invalid recipient address".to_string()))?;

                        // Find the sender address (first input)
                        if transaction.input.is_empty() {
                            return Err(Error::InvalidTransaction("Missing input".to_string()));
                        }

                        // In a real implementation, we would look up the sender address from the input
                        // For now, we'll just use a placeholder
                        let sender_address = Address::from_str("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")
                            .map_err(|_| Error::InvalidTransaction("Invalid sender address".to_string()))?;

                        // Create dummy addresses for now
                        let sender_unchecked = Address::<NetworkUnchecked>::from_str("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
                        let recipient_unchecked = Address::<NetworkUnchecked>::from_str("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
                        
                        return Ok(Some(RuneTransfer::new(
                            rune_id,
                            sender_unchecked,
                            recipient_unchecked,
                            amount,
                            None,
                        )));
                    }
                }
            }
        }

        Ok(None)
    }

    /// Process a transaction
    pub fn process_transaction(&mut self, transaction: &Transaction) -> Result<Option<RuneTransfer>> {
        // Validate the transaction
        let transfer = self.validate_transaction(transaction)?;

        // If it's a valid rune transfer, apply it
        if let Some(ref transfer) = transfer {
            self.apply_transfer(transfer)?;
            self.transactions.push(transaction.clone());
        }

        Ok(transfer)
    }

    /// Estimate transaction size
    fn estimate_transaction_size(num_inputs: usize, num_outputs: usize) -> usize {
        // Rough estimate for P2WPKH transaction
        // Fixed size: 10 bytes (version, locktime)
        // Input size: 41 bytes per input (outpoint, sequence, witness length)
        // Output size: 31 bytes per output (value, script length, script)
        // Witness size: 108 bytes per input (signature, pubkey)
        10 + (41 * num_inputs) + (31 * num_outputs) + (108 * num_inputs)
    }
}

/// Thread-safe rune protocol
pub struct ThreadSafeRuneProtocol {
    /// Inner rune protocol
    inner: Arc<Mutex<RuneProtocol>>,
}

impl ThreadSafeRuneProtocol {
    /// Create a new thread-safe rune protocol
    pub fn new(network: Network) -> Self {
        Self {
            inner: Arc::new(Mutex::new(RuneProtocol::new(network))),
        }
    }

    /// Register a rune
    pub fn register_rune(&self, rune: Rune) -> Result<()> {
        let mut protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        protocol.register_rune(rune)
    }

    /// Get a rune by ID
    pub fn get_rune(&self, rune_id: &RuneId) -> Result<Option<Rune>> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        Ok(protocol.get_rune(rune_id).cloned())
    }

    /// Get all runes
    pub fn get_runes(&self) -> Result<Vec<Rune>> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        Ok(protocol.get_runes().into_iter().cloned().collect())
    }

    /// Get rune balance for an address
    pub fn get_balance(&self, address: &Address<NetworkUnchecked>, rune_id: &RuneId) -> Result<u64> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        Ok(protocol.get_balance(address, rune_id))
    }

    /// Get all balances for an address
    pub fn get_balances(&self, address: &Address<NetworkUnchecked>) -> Result<Vec<RuneBalance>> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        Ok(protocol.get_balances(address))
    }

    /// Create a rune transfer
    pub fn create_transfer(
        &self,
        rune_id: &RuneId,
        from: &Address<NetworkUnchecked>,
        to: &Address<NetworkUnchecked>,
        amount: u64,
        memo: Option<String>,
    ) -> Result<RuneTransfer> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        protocol.create_transfer(rune_id, from, to, amount, memo)
    }

    /// Apply a rune transfer
    pub fn apply_transfer(&self, transfer: &RuneTransfer) -> Result<()> {
        let mut protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        protocol.apply_transfer(transfer)
    }

    /// Create a rune transaction
    pub fn create_transaction(
        &self,
        transfer: &RuneTransfer,
        inputs: Vec<(OutPoint, TxOut)>,
        change_address: &Address,
        fee_rate: f64,
    ) -> Result<Transaction> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        protocol.create_transaction(transfer, inputs, change_address, fee_rate)
    }

    /// Validate a rune transaction
    pub fn validate_transaction(&self, transaction: &Transaction) -> Result<Option<RuneTransfer>> {
        let protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        protocol.validate_transaction(transaction)
    }

    /// Process a transaction
    pub fn process_transaction(&self, transaction: &Transaction) -> Result<Option<RuneTransfer>> {
        let mut protocol = self.inner.lock().map_err(|_| Error::RuneLockError)?;
        protocol.process_transaction(transaction)
    }
}

impl Clone for ThreadSafeRuneProtocol {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::hashes::Hash;

    #[test]
    fn test_rune_creation() {
        let rune = Rune::new(
            RuneId("test_rune".to_string()),
            "TEST".to_string(),
            "Test Rune".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );

        assert_eq!(rune.id.0, "test_rune");
        assert_eq!(rune.symbol, "TEST");
        assert_eq!(rune.name, "Test Rune");
        assert_eq!(rune.decimals, 8);
        assert_eq!(rune.supply, 1_000_000);
        assert_eq!(rune.limit, Some(1_000_000));
    }

    #[test]
    fn test_rune_format_amount() {
        let rune = Rune::new(
            RuneId("test_rune".to_string()),
            "TEST".to_string(),
            "Test Rune".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );

        assert_eq!(rune.format_amount(100_000_000), "1 TEST");
        assert_eq!(rune.format_amount(50_000_000), "0.5 TEST");
        assert_eq!(rune.format_amount(1), "0.00000001 TEST");
    }

    #[test]
    fn test_rune_parse_amount() {
        let rune = Rune::new(
            RuneId("test_rune".to_string()),
            "TEST".to_string(),
            "Test Rune".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );

        assert_eq!(rune.parse_amount("1 TEST").unwrap(), 100_000_000);
        assert_eq!(rune.parse_amount("0.5 TEST").unwrap(), 50_000_000);
        assert_eq!(rune.parse_amount("0.00000001 TEST").unwrap(), 1);
        assert!(rune.parse_amount("1 BTC").is_err());
    }

    #[test]
    fn test_rune_protocol() {
        let mut protocol = RuneProtocol::new(Network::Testnet);
        
        // Register a rune
        let rune = Rune::new(
            RuneId("test_rune".to_string()),
            "TEST".to_string(),
            "Test Rune".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );
        protocol.register_rune(rune.clone()).unwrap();
        
        // Check that the rune was registered
        let registered_rune = protocol.get_rune(&RuneId("test_rune".to_string())).unwrap();
        assert_eq!(registered_rune.id, rune.id);
        
        // Add balance
        let from_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
        let to_address = Address::from_str("tb1q0sqzfp2lssp0ygk4pg9c5zqgwza0uwgws5tv0x").unwrap();
        protocol.balances.insert((from_address.clone(), rune.id.clone()), 1000);
        
        // Create transfer
        let transfer = protocol.create_transfer(
            &rune.id,
            &from_address,
            &to_address,
            500,
            None,
        ).unwrap();
        
        // Apply transfer
        protocol.apply_transfer(&transfer).unwrap();
        
        // Check balances
        assert_eq!(protocol.get_balance(&from_address, &rune.id), 500);
        assert_eq!(protocol.get_balance(&to_address, &rune.id), 500);
    }
}