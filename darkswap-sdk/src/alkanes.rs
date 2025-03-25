//! Alkanes protocol implementation for DarkSwap
//!
//! This module provides support for the alkanes protocol, enabling trading of
//! Bitcoin-based metaprotocol tokens.

use crate::error::{Error, Result};
use crate::types::{AlkaneId};
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

/// Alkane data
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Alkane {
    /// Alkane ID
    pub id: AlkaneId,
    /// Alkane symbol
    pub symbol: String,
    /// Alkane name
    pub name: String,
    /// Alkane decimals
    pub decimals: u8,
    /// Alkane supply
    pub supply: u64,
    /// Alkane limit
    pub limit: Option<u64>,
    /// Alkane metadata
    pub metadata: HashMap<String, String>,
}

impl Alkane {
    /// Create a new alkane
    pub fn new(
        id: AlkaneId,
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

/// Alkane transfer
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AlkaneTransfer {
    /// Alkane ID
    pub alkane_id: AlkaneId,
    /// From address
    pub from: Address<NetworkUnchecked>,
    /// To address
    pub to: Address<NetworkUnchecked>,
    /// Amount
    pub amount: u64,
    /// Memo
    pub memo: Option<String>,
}

impl AlkaneTransfer {
    /// Create a new alkane transfer
    pub fn new(
        alkane_id: AlkaneId,
        from: Address<NetworkUnchecked>,
        to: Address<NetworkUnchecked>,
        amount: u64,
        memo: Option<String>,
    ) -> Self {
        Self {
            alkane_id,
            from,
            to,
            amount,
            memo,
        }
    }
}

/// Alkane balance
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AlkaneBalance {
    /// Alkane ID
    pub alkane_id: AlkaneId,
    /// Address
    pub address: Address<NetworkUnchecked>,
    /// Balance
    pub balance: u64,
}

impl AlkaneBalance {
    /// Create a new alkane balance
    pub fn new(alkane_id: AlkaneId, address: Address<NetworkUnchecked>, balance: u64) -> Self {
        Self {
            alkane_id,
            address,
            balance,
        }
    }
}

/// Alkane protocol
pub struct AlkaneProtocol {
    /// Bitcoin network
    network: Network,
    /// Alkanes by ID
    alkanes: HashMap<AlkaneId, Alkane>,
    /// Alkane balances by address and alkane ID
    balances: HashMap<(Address<NetworkUnchecked>, AlkaneId), u64>,
    /// Alkane transactions
    transactions: Vec<Transaction>,
}

impl AlkaneProtocol {
    /// Create a new alkane protocol
    pub fn new(network: Network) -> Self {
        Self {
            network,
            alkanes: HashMap::new(),
            balances: HashMap::new(),
            transactions: Vec::new(),
        }
    }

    /// Get the Bitcoin network
    pub fn network(&self) -> Network {
        self.network
    }

    /// Register an alkane
    pub fn register_alkane(&mut self, alkane: Alkane) -> Result<()> {
        // Check if alkane already exists
        if self.alkanes.contains_key(&alkane.id) {
            return Err(Error::InvalidAsset(format!("Alkane already exists: {}", alkane.id)));
        }

        // Add alkane to registry
        self.alkanes.insert(alkane.id.clone(), alkane);

        Ok(())
    }

    /// Get an alkane by ID
    pub fn get_alkane(&self, alkane_id: &AlkaneId) -> Option<&Alkane> {
        self.alkanes.get(alkane_id)
    }

    /// Get all alkanes
    pub fn get_alkanes(&self) -> Vec<&Alkane> {
        self.alkanes.values().collect()
    }

    /// Get alkane balance for an address
    pub fn get_balance(&self, address: &Address<NetworkUnchecked>, alkane_id: &AlkaneId) -> u64 {
        self.balances.get(&(address.clone(), alkane_id.clone())).cloned().unwrap_or(0)
    }

    /// Get all balances for an address
    pub fn get_balances(&self, address: &Address<NetworkUnchecked>) -> Vec<AlkaneBalance> {
        let mut balances = Vec::new();

        for ((addr, alkane_id), balance) in &self.balances {
            if addr == address {
                balances.push(AlkaneBalance::new(alkane_id.clone(), addr.clone(), *balance));
            }
        }

        balances
    }

    /// Create an alkane transfer
    pub fn create_transfer(
        &self,
        alkane_id: &AlkaneId,
        from: &Address<NetworkUnchecked>,
        to: &Address<NetworkUnchecked>,
        amount: u64,
        memo: Option<String>,
    ) -> Result<AlkaneTransfer> {
        // Check if alkane exists
        if !self.alkanes.contains_key(alkane_id) {
            return Err(Error::InvalidAsset(format!("Alkane not found: {}", alkane_id)));
        }

        // Check if sender has enough balance
        let balance = self.get_balance(from, alkane_id);
        if balance < amount {
            return Err(Error::InsufficientFunds);
        }

        Ok(AlkaneTransfer::new(
            alkane_id.clone(),
            from.clone(),
            to.clone(),
            amount,
            memo,
        ))
    }

    /// Apply an alkane transfer
    pub fn apply_transfer(&mut self, transfer: &AlkaneTransfer) -> Result<()> {
        // Check if alkane exists
        if !self.alkanes.contains_key(&transfer.alkane_id) {
            return Err(Error::InvalidAsset(format!("Alkane not found: {}", transfer.alkane_id)));
        }

        // Check if sender has enough balance
        let sender_balance = self.get_balance(&transfer.from, &transfer.alkane_id);
        if sender_balance < transfer.amount {
            return Err(Error::InsufficientFunds);
        }

        // Update balances
        let sender_key = (transfer.from.clone(), transfer.alkane_id.clone());
        let receiver_key = (transfer.to.clone(), transfer.alkane_id.clone());

        // Decrease sender balance
        self.balances.insert(sender_key, sender_balance - transfer.amount);

        // Increase receiver balance
        let receiver_balance = self.get_balance(&transfer.to, &transfer.alkane_id);
        self.balances.insert(receiver_key, receiver_balance + transfer.amount);

        Ok(())
    }

    /// Create an alkane transaction
    pub fn create_transaction(
        &self,
        transfer: &AlkaneTransfer,
        inputs: Vec<(OutPoint, TxOut)>,
        change_address: &Address,
        fee_rate: f64,
    ) -> Result<Transaction> {
        // Check if alkane exists
        if !self.alkanes.contains_key(&transfer.alkane_id) {
            return Err(Error::InvalidAsset(format!("Alkane not found: {}", transfer.alkane_id)));
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

        // Add alkane transfer output
        // In a real implementation, this would use the alkanes protocol
        // For now, we'll use a simple OP_RETURN output
        let alkane_data = format!("ALKANE:{}:{}", transfer.alkane_id, transfer.amount);
        // Use a Vec<u8> and convert it to a fixed-size array that implements AsRef<PushBytes>
        let data_bytes = alkane_data.into_bytes();
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

    /// Validate an alkane transaction
    pub fn validate_transaction(&self, transaction: &Transaction) -> Result<Option<AlkaneTransfer>> {
        // In a real implementation, this would validate the transaction against the alkanes protocol
        // For now, we'll just check if it has an OP_RETURN output with the right format
        for output in &transaction.output {
            if output.script_pubkey.is_op_return() {
                let data = output.script_pubkey.as_bytes();
                if data.len() > 8 && &data[0..8] == b"ALKANE:" {
                    let data_str = String::from_utf8_lossy(&data[8..]);
                    let parts: Vec<&str> = data_str.split(':').collect();
                    if parts.len() == 2 {
                        let alkane_id = AlkaneId(parts[0].to_string());
                        let amount = parts[1].parse::<u64>().map_err(|_| {
                            Error::InvalidTransaction("Invalid alkane amount".to_string())
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
                        
                        return Ok(Some(AlkaneTransfer::new(
                            alkane_id,
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
    pub fn process_transaction(&mut self, transaction: &Transaction) -> Result<Option<AlkaneTransfer>> {
        // Validate the transaction
        let transfer = self.validate_transaction(transaction)?;

        // If it's a valid alkane transfer, apply it
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

/// Thread-safe alkane protocol
pub struct ThreadSafeAlkaneProtocol {
    /// Inner alkane protocol
    inner: Arc<Mutex<AlkaneProtocol>>,
}

impl ThreadSafeAlkaneProtocol {
    /// Create a new thread-safe alkane protocol
    pub fn new(network: Network) -> Self {
        Self {
            inner: Arc::new(Mutex::new(AlkaneProtocol::new(network))),
        }
    }

    /// Register an alkane
    pub fn register_alkane(&self, alkane: Alkane) -> Result<()> {
        let mut protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        protocol.register_alkane(alkane)
    }

    /// Get an alkane by ID
    pub fn get_alkane(&self, alkane_id: &AlkaneId) -> Result<Option<Alkane>> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        Ok(protocol.get_alkane(alkane_id).cloned())
    }

    /// Get all alkanes
    pub fn get_alkanes(&self) -> Result<Vec<Alkane>> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        Ok(protocol.get_alkanes().into_iter().cloned().collect())
    }

    /// Get alkane balance for an address
    pub fn get_balance(&self, address: &Address<NetworkUnchecked>, alkane_id: &AlkaneId) -> Result<u64> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        Ok(protocol.get_balance(address, alkane_id))
    }

    /// Get all balances for an address
    pub fn get_balances(&self, address: &Address<NetworkUnchecked>) -> Result<Vec<AlkaneBalance>> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        Ok(protocol.get_balances(address))
    }

    /// Create an alkane transfer
    pub fn create_transfer(
        &self,
        alkane_id: &AlkaneId,
        from: &Address<NetworkUnchecked>,
        to: &Address<NetworkUnchecked>,
        amount: u64,
        memo: Option<String>,
    ) -> Result<AlkaneTransfer> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        protocol.create_transfer(alkane_id, from, to, amount, memo)
    }

    /// Apply an alkane transfer
    pub fn apply_transfer(&self, transfer: &AlkaneTransfer) -> Result<()> {
        let mut protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        protocol.apply_transfer(transfer)
    }

    /// Create an alkane transaction
    pub fn create_transaction(
        &self,
        transfer: &AlkaneTransfer,
        inputs: Vec<(OutPoint, TxOut)>,
        change_address: &Address,
        fee_rate: f64,
    ) -> Result<Transaction> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        protocol.create_transaction(transfer, inputs, change_address, fee_rate)
    }

    /// Validate an alkane transaction
    pub fn validate_transaction(&self, transaction: &Transaction) -> Result<Option<AlkaneTransfer>> {
        let protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        protocol.validate_transaction(transaction)
    }

    /// Process a transaction
    pub fn process_transaction(&self, transaction: &Transaction) -> Result<Option<AlkaneTransfer>> {
        let mut protocol = self.inner.lock().map_err(|_| Error::AlkaneLockError)?;
        protocol.process_transaction(transaction)
    }
}

impl Clone for ThreadSafeAlkaneProtocol {
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
    fn test_alkane_creation() {
        let alkane = Alkane::new(
            AlkaneId("test_alkane".to_string()),
            "TEST".to_string(),
            "Test Alkane".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );

        assert_eq!(alkane.id.0, "test_alkane");
        assert_eq!(alkane.symbol, "TEST");
        assert_eq!(alkane.name, "Test Alkane");
        assert_eq!(alkane.decimals, 8);
        assert_eq!(alkane.supply, 1_000_000);
        assert_eq!(alkane.limit, Some(1_000_000));
    }

    #[test]
    fn test_alkane_format_amount() {
        let alkane = Alkane::new(
            AlkaneId("test_alkane".to_string()),
            "TEST".to_string(),
            "Test Alkane".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );

        assert_eq!(alkane.format_amount(100_000_000), "1 TEST");
        assert_eq!(alkane.format_amount(50_000_000), "0.5 TEST");
        assert_eq!(alkane.format_amount(1), "0.00000001 TEST");
    }

    #[test]
    fn test_alkane_parse_amount() {
        let alkane = Alkane::new(
            AlkaneId("test_alkane".to_string()),
            "TEST".to_string(),
            "Test Alkane".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );

        assert_eq!(alkane.parse_amount("1 TEST").unwrap(), 100_000_000);
        assert_eq!(alkane.parse_amount("0.5 TEST").unwrap(), 50_000_000);
        assert_eq!(alkane.parse_amount("0.00000001 TEST").unwrap(), 1);
        assert!(alkane.parse_amount("1 BTC").is_err());
    }

    #[test]
    fn test_alkane_protocol() {
        let mut protocol = AlkaneProtocol::new(Network::Testnet);
        
        // Register an alkane
        let alkane = Alkane::new(
            AlkaneId("test_alkane".to_string()),
            "TEST".to_string(),
            "Test Alkane".to_string(),
            8,
            1_000_000,
            Some(1_000_000),
        );
        protocol.register_alkane(alkane.clone()).unwrap();
        
        // Check that the alkane was registered
        let registered_alkane = protocol.get_alkane(&AlkaneId("test_alkane".to_string())).unwrap();
        assert_eq!(registered_alkane.id, alkane.id);
        
        // Add balance
        let from_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
        let to_address = Address::from_str("tb1q0sqzfp2lssp0ygk4pg9c5zqgwza0uwgws5tv0x").unwrap();
        protocol.balances.insert((from_address.clone(), alkane.id.clone()), 1000);
        
        // Create transfer
        let transfer = protocol.create_transfer(
            &alkane.id,
            &from_address,
            &to_address,
            500,
            None,
        ).unwrap();
        
        // Apply transfer
        protocol.apply_transfer(&transfer).unwrap();
        
        // Check balances
        assert_eq!(protocol.get_balance(&from_address, &alkane.id), 500);
        assert_eq!(protocol.get_balance(&to_address, &alkane.id), 500);
    }
}