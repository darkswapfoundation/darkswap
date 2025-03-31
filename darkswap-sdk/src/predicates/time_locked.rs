//! Time-locked predicate alkanes
//!
//! This module provides a time-locked predicate alkane implementation that enforces
//! time constraints on when a trade can be executed.

use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use bitcoin::Transaction;

use crate::alkanes::AlkaneId;
use crate::error::{Error, Result};
use crate::predicates::Predicate;

/// Time constraint type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TimeConstraint {
    /// Before a specific timestamp
    Before(u64),
    /// After a specific timestamp
    After(u64),
    /// Between two timestamps
    Between(u64, u64),
}

/// Time-locked predicate alkane
///
/// This predicate enforces time constraints on when a trade can be executed.
pub struct TimeLockedPredicateAlkane {
    /// Alkane ID
    pub alkane_id: AlkaneId,
    /// Amount
    pub amount: u128,
    /// Time constraint
    pub time_constraint: TimeConstraint,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl TimeLockedPredicateAlkane {
    /// Create a new time-locked predicate alkane
    pub fn new(
        alkane_id: AlkaneId,
        amount: u128,
        time_constraint: TimeConstraint,
    ) -> Self {
        Self {
            alkane_id,
            amount,
            time_constraint,
            metadata: HashMap::new(),
        }
    }
    
    /// Add metadata to the predicate
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
    
    /// Check if the current time satisfies the time constraint
    pub fn check_time_constraint(&self) -> Result<bool> {
        // Get current timestamp
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| Error::Other(format!("Failed to get current time: {}", e)))?
            .as_secs();
        
        // Check time constraint
        match self.time_constraint {
            TimeConstraint::Before(timestamp) => Ok(now < timestamp),
            TimeConstraint::After(timestamp) => Ok(now > timestamp),
            TimeConstraint::Between(start, end) => Ok(now > start && now < end),
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
    fn parse_alkane_output(&self, output: &bitcoin::TxOut) -> Result<Option<(AlkaneId, u128)>> {
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

impl Predicate for TimeLockedPredicateAlkane {
    fn validate(&self, tx: &Transaction) -> Result<bool> {
        // Check time constraint
        if !self.check_time_constraint()? {
            return Err(Error::InvalidTransaction("Time constraint not satisfied".to_string()));
        }
        
        // Extract alkane data from the transaction
        let alkane_data = self.extract_alkane_data(tx)?;
        
        // Check if the alkane is present with the correct amount
        let mut found = false;
        
        for (alkane_id, amount) in &alkane_data {
            if *alkane_id == self.alkane_id && *amount == self.amount {
                found = true;
                break;
            }
        }
        
        if found {
            Ok(true)
        } else {
            Err(Error::InvalidTransaction("Alkane not found or amount mismatch".to_string()))
        }
    }
    
    fn name(&self) -> &str {
        "TimeLockedPredicateAlkane"
    }
    
    fn description(&self) -> &str {
        "A predicate alkane contract that enforces time constraints on when a trade can be executed"
    }
}

/// Factory for creating time-locked predicate alkanes
pub struct TimeLockedPredicateAlkaneFactory;

impl TimeLockedPredicateAlkaneFactory {
    /// Create a new time-locked predicate alkane that can only be executed before a specific timestamp
    pub fn create_before(
        alkane_id: AlkaneId,
        amount: u128,
        timestamp: u64,
    ) -> TimeLockedPredicateAlkane {
        TimeLockedPredicateAlkane::new(
            alkane_id,
            amount,
            TimeConstraint::Before(timestamp),
        )
    }
    
    /// Create a new time-locked predicate alkane that can only be executed after a specific timestamp
    pub fn create_after(
        alkane_id: AlkaneId,
        amount: u128,
        timestamp: u64,
    ) -> TimeLockedPredicateAlkane {
        TimeLockedPredicateAlkane::new(
            alkane_id,
            amount,
            TimeConstraint::After(timestamp),
        )
    }
    
    /// Create a new time-locked predicate alkane that can only be executed between two timestamps
    pub fn create_between(
        alkane_id: AlkaneId,
        amount: u128,
        start_timestamp: u64,
        end_timestamp: u64,
    ) -> TimeLockedPredicateAlkane {
        TimeLockedPredicateAlkane::new(
            alkane_id,
            amount,
            TimeConstraint::Between(start_timestamp, end_timestamp),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::{Script, TxIn, TxOut, Witness, LockTime};
    
    #[test]
    fn test_time_locked_predicate_before() {
        // Create alkane ID
        let alkane_id = AlkaneId("test_alkane".to_string());
        
        // Create amount
        let amount = 100u128;
        
        // Create a timestamp in the future
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let future = now + 3600; // 1 hour in the future
        
        // Create the predicate
        let predicate = TimeLockedPredicateAlkaneFactory::create_before(
            alkane_id.clone(),
            amount,
            future,
        );
        
        // Create a transaction with the alkane
        let tx = create_test_transaction(vec![
            (alkane_id.clone(), amount),
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    #[test]
    fn test_time_locked_predicate_after() {
        // Create alkane ID
        let alkane_id = AlkaneId("test_alkane".to_string());
        
        // Create amount
        let amount = 100u128;
        
        // Create a timestamp in the past
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let past = now - 3600; // 1 hour in the past
        
        // Create the predicate
        let predicate = TimeLockedPredicateAlkaneFactory::create_after(
            alkane_id.clone(),
            amount,
            past,
        );
        
        // Create a transaction with the alkane
        let tx = create_test_transaction(vec![
            (alkane_id.clone(), amount),
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    #[test]
    fn test_time_locked_predicate_between() {
        // Create alkane ID
        let alkane_id = AlkaneId("test_alkane".to_string());
        
        // Create amount
        let amount = 100u128;
        
        // Create timestamps
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let past = now - 3600; // 1 hour in the past
        let future = now + 3600; // 1 hour in the future
        
        // Create the predicate
        let predicate = TimeLockedPredicateAlkaneFactory::create_between(
            alkane_id.clone(),
            amount,
            past,
            future,
        );
        
        // Create a transaction with the alkane
        let tx = create_test_transaction(vec![
            (alkane_id.clone(), amount),
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    #[test]
    fn test_time_locked_predicate_wrong_amount() {
        // Create alkane ID
        let alkane_id = AlkaneId("test_alkane".to_string());
        
        // Create amount
        let amount = 100u128;
        
        // Create a timestamp in the future
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let future = now + 3600; // 1 hour in the future
        
        // Create the predicate
        let predicate = TimeLockedPredicateAlkaneFactory::create_before(
            alkane_id.clone(),
            amount,
            future,
        );
        
        // Create a transaction with the wrong amount
        let tx = create_test_transaction(vec![
            (alkane_id.clone(), amount + 1),
        ]);
        
        // Validate the transaction
        let result = predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_err());
    }
    
    /// Create a test transaction with alkane data
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
}