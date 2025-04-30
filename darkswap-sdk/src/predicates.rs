//! Predicate Alkanes implementation
//!
//! This module provides the implementation of predicate alkanes for the DarkSwap SDK.
//! Predicate alkanes are specialized alkane contracts that enforce constraints on their inputs.
//! They are particularly useful for enforcing trade conditions between two parties.
pub mod time_locked;
pub mod composite;
pub mod multi_signature;

pub use time_locked::{TimeLockedPredicateAlkane, TimeLockedPredicateAlkaneFactory, TimeConstraint};
pub use composite::{CompositePredicateAlkane, CompositePredicateAlkaneFactory, LogicalOperator};
pub use multi_signature::{MultiSignaturePredicateAlkane, MultiSignaturePredicateAlkaneFactory};

use crate::alkanes::Alkane;
use crate::types::AlkaneId;
use crate::error::{Error, Result};
use bitcoin::{Transaction, TxOut};
use std::collections::HashMap;

/// Predicate trait provides common functionality for all predicates
pub trait Predicate {
    /// Validate a transaction against the predicate
    fn validate(&self, tx: &Transaction) -> Result<bool>;
    
    /// Get the predicate name
    fn name(&self) -> &str;
    
    /// Get the predicate description
    fn description(&self) -> &str;
}

/// EqualityPredicate enforces the quantities of alkanes sent to it in a two-party trade
pub struct EqualityPredicateAlkane {
    /// Alkane ID for the left side of the trade
    pub left_alkane_id: AlkaneId,
    /// Amount for the left side of the trade
    pub left_amount: u128,
    /// Alkane ID for the right side of the trade
    pub right_alkane_id: AlkaneId,
    /// Amount for the right side of the trade
    pub right_amount: u128,
    /// Metadata for the predicate
    pub metadata: HashMap<String, String>,
}

impl EqualityPredicateAlkane {
    /// Create a new EqualityPredicateAlkane
    pub fn new(
        left_alkane_id: AlkaneId,
        left_amount: u128,
        right_alkane_id: AlkaneId,
        right_amount: u128,
    ) -> Self {
        Self {
            left_alkane_id,
            left_amount,
            right_alkane_id,
            right_amount,
            metadata: HashMap::new(),
        }
    }
    
    /// Add metadata to the predicate
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
    
    /// Filter alkanes based on sequence and amount
    pub fn filter(&self, tx: &Transaction) -> Result<bool> {
        // Check if the transaction has at least two outputs
        if tx.output.len() < 2 {
            return Err(Error::InvalidTransaction("Transaction must have at least two outputs".to_string()));
        }
        
        // Extract the alkane data from the transaction
        let alkane_data = self.extract_alkane_data(tx)?;
        
        // Check if we have exactly two alkanes
        if alkane_data.len() != 2 {
            return Err(Error::InvalidTransaction("EqualityPredicate only handles 2 alkanes".to_string()));
        }
        
        // Check if the alkanes match the required parameters
        let mut found_left = false;
        let mut found_right = false;
        
        for (alkane_id, amount) in &alkane_data {
            if *alkane_id == self.left_alkane_id && *amount == self.left_amount {
                found_left = true;
            } else if *alkane_id == self.right_alkane_id && *amount == self.right_amount {
                found_right = true;
            }
        }
        
        if found_left && found_right {
            Ok(true)
        } else {
            Err(Error::InvalidTransaction("EqualityPredicate failed: alkanes do not match required parameters".to_string()))
        }
    }
    
    /// Extract alkane data from a transaction
    fn extract_alkane_data(&self, tx: &Transaction) -> Result<Vec<(AlkaneId, u128)>> {
        let mut alkane_data = Vec::new();
        
        for output in &tx.output {
            if let Some((alkane_id, amount)) = self.parse_alkane_output(output)? {
                alkane_data.push((alkane_id, amount));
            }
        }
        
        Ok(alkane_data)
    }
    
    /// Parse an output to extract alkane data
    fn parse_alkane_output(&self, output: &TxOut) -> Result<Option<(AlkaneId, u128)>> {
        // Check if the output is an OP_RETURN output
        if !output.script_pubkey.is_op_return() {
            return Ok(None);
        }
        
        // Extract the data from the OP_RETURN output
        let data = output.script_pubkey.as_bytes();
        
        // Skip the OP_RETURN opcode
        if data.len() <= 1 {
            return Ok(None);
        }
        
        // Try to parse the data as a string
        if let Ok(data_str) = std::str::from_utf8(&data[1..]) {
            // Remove ASCII 1 bytes from the string
            let clean_data_str: String = data_str.chars().filter(|&c| c != '\u{1}').collect();
            
            // Check if it's an alkane transfer
            if let Some(alkane_data) = clean_data_str.strip_prefix("ALKANE:") {
                let parts: Vec<&str> = alkane_data.split(':').collect();
                
                if parts.len() >= 2 {
                    // Clean the parts
                    let clean_parts: Vec<String> = parts.iter()
                        .map(|&part| part.chars().filter(|&c| c != '\u{1}').collect())
                        .collect();
                    
                    // Get the alkane ID and amount
                    let alkane_id_str = &clean_parts[0];
                    if let Ok(amount) = clean_parts[1].parse::<u128>() {
                        let alkane_id = AlkaneId(alkane_id_str.clone());
                        return Ok(Some((alkane_id, amount)));
                    }
                }
            }
        }
        
        Ok(None)
    }
}

impl Predicate for EqualityPredicateAlkane {
    fn validate(&self, tx: &Transaction) -> Result<bool> {
        self.filter(tx)
    }
    
    fn name(&self) -> &str {
        "EqualityPredicateAlkane"
    }
    
    fn description(&self) -> &str {
        "A predicate alkane contract that enforces the quantities of alkanes sent to it in a two-party trade"
    }
}

/// Factory for creating predicate alkanes
pub struct PredicateAlkaneFactory;

impl PredicateAlkaneFactory {
    /// Create a new EqualityPredicateAlkane
    pub fn create_equality_predicate(
        left_alkane_id: AlkaneId,
        left_amount: u128,
        right_alkane_id: AlkaneId,
        right_amount: u128,
    ) -> EqualityPredicateAlkane {
        EqualityPredicateAlkane::new(
            left_alkane_id,
            left_amount,
            right_alkane_id,
            right_amount,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::{Script, Transaction, TxIn, TxOut, Witness, LockTime};
    
    fn create_test_transaction(alkane_data: Vec<(AlkaneId, u128)>) -> Transaction {
        let mut tx = Transaction {
            version: 2,
            lock_time: LockTime::ZERO.into(),
            input: Vec::new(),
            output: Vec::new(),
        };
        
        // Add a dummy input
        tx.input.push(TxIn {
            previous_output: bitcoin::OutPoint::null(),
            script_sig: Script::new(),
            sequence: bitcoin::Sequence::MAX,
            witness: Witness::new(),
        });
        
        // Add the alkane outputs
        for (alkane_id, amount) in alkane_data {
            // Create the OP_RETURN output with the alkane transfer data
            let mut builder = bitcoin::blockdata::script::Builder::new();
            builder = builder.push_opcode(bitcoin::blockdata::opcodes::all::OP_RETURN);
            
            // Format: "ALKANE:<id>:<amount>"
            let data = format!("ALKANE:{}:{}", alkane_id.0, amount);
            builder = builder.push_slice(data.as_bytes());
            
            // Build the script
            let script = builder.into_script();
            
            tx.output.push(TxOut {
                value: 0,
                script_pubkey: script,
            });
        }
        
        // Add a dummy recipient output
        tx.output.push(TxOut {
            value: 546, // Dust limit
            script_pubkey: Script::new(),
        });
        
        tx
    }
    
    #[test]
    fn test_equality_predicate_success() {
        // Create alkane IDs
        let left_id = AlkaneId("123".to_string());
        let right_id = AlkaneId("456".to_string());
        
        // Create amounts
        let left_amount = 100u128;
        let right_amount = 200u128;
        
        // Create the predicate
        let predicate = EqualityPredicateAlkane::new(
            left_id.clone(),
            left_amount,
            right_id.clone(),
            right_amount,
        );
        
        // Create a transaction with matching alkanes
        let tx = create_test_transaction(vec![
            (left_id, left_amount),
            (right_id, right_amount),
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    #[test]
    fn test_equality_predicate_wrong_amount() {
        // Create alkane IDs
        let left_id = AlkaneId("123".to_string());
        let right_id = AlkaneId("456".to_string());
        
        // Create amounts
        let left_amount = 100u128;
        let right_amount = 200u128;
        
        // Create the predicate
        let predicate = EqualityPredicateAlkane::new(
            left_id.clone(),
            left_amount,
            right_id.clone(),
            right_amount,
        );
        
        // Create a transaction with wrong amount
        let tx = create_test_transaction(vec![
            (left_id, left_amount),
            (right_id, 300u128), // Wrong amount
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_equality_predicate_wrong_id() {
        // Create alkane IDs
        let left_id = AlkaneId("123".to_string());
        let right_id = AlkaneId("456".to_string());
        
        // Create amounts
        let left_amount = 100u128;
        let right_amount = 200u128;
        
        // Create the predicate
        let predicate = EqualityPredicateAlkane::new(
            left_id.clone(),
            left_amount,
            right_id,
            right_amount,
        );
        
        // Create a transaction with wrong ID
        let tx = create_test_transaction(vec![
            (left_id, left_amount),
            (AlkaneId("789".to_string()), right_amount), // Wrong ID
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_equality_predicate_wrong_alkane_count() {
        // Create alkane IDs
        let left_id = AlkaneId("123".to_string());
        let right_id = AlkaneId("456".to_string());
        
        // Create amounts
        let left_amount = 100u128;
        let right_amount = 200u128;
        
        // Create the predicate
        let predicate = EqualityPredicateAlkane::new(
            left_id.clone(),
            left_amount,
            right_id,
            right_amount,
        );
        
        // Create a transaction with only one alkane
        let tx = create_test_transaction(vec![
            (left_id, left_amount),
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        assert!(result.is_err());
    }
}