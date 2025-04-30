//! Composite predicate alkanes
//!
//! This module provides a composite predicate alkane implementation that combines multiple predicates.

use std::collections::HashMap;

use anyhow::Result;
use bitcoin::Transaction;

use crate::error::Error;
use crate::predicates::Predicate;

/// Logical operator for combining predicates
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogicalOperator {
    /// All predicates must be satisfied (AND)
    And,
    /// At least one predicate must be satisfied (OR)
    Or,
}

/// Composite predicate alkane
///
/// This predicate combines multiple predicates using a logical operator.
pub struct CompositePredicateAlkane {
    /// Predicates
    predicates: Vec<Box<dyn Predicate>>,
    /// Logical operator
    operator: LogicalOperator,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl CompositePredicateAlkane {
    /// Create a new composite predicate alkane
    pub fn new(operator: LogicalOperator) -> Self {
        Self {
            predicates: Vec::new(),
            operator,
            metadata: HashMap::new(),
        }
    }
    
    /// Add a predicate to the composite
    pub fn add_predicate(&mut self, predicate: Box<dyn Predicate>) {
        self.predicates.push(predicate);
    }
    
    /// Add metadata to the predicate
    pub fn with_metadata(mut self, key: &str, value: &str) -> Self {
        self.metadata.insert(key.to_string(), value.to_string());
        self
    }
}

impl Predicate for CompositePredicateAlkane {
    fn validate(&self, tx: &Transaction) -> std::result::Result<bool, crate::error::Error> {
        match self.operator {
            LogicalOperator::And => {
                // All predicates must be satisfied
                for predicate in &self.predicates {
                    if !predicate.validate(tx)? {
                        return Ok(false);
                    }
                }
                Ok(true)
            }
            LogicalOperator::Or => {
                // At least one predicate must be satisfied
                if self.predicates.is_empty() {
                    return Ok(false);
                }
                
                for predicate in &self.predicates {
                    if predicate.validate(tx)? {
                        return Ok(true);
                    }
                }
                Ok(false)
            }
        }
    }
    
    fn name(&self) -> &str {
        "CompositePredicateAlkane"
    }
    
    fn description(&self) -> &str {
        match self.operator {
            LogicalOperator::And => "A predicate alkane contract that requires all predicates to be satisfied",
            LogicalOperator::Or => "A predicate alkane contract that requires at least one predicate to be satisfied",
        }
    }
}

/// Factory for creating composite predicate alkanes
pub struct CompositePredicateAlkaneFactory;

impl CompositePredicateAlkaneFactory {
    /// Create a new composite predicate alkane with AND operator
    pub fn create_and() -> CompositePredicateAlkane {
        CompositePredicateAlkane::new(LogicalOperator::And)
    }
    
    /// Create a new composite predicate alkane with OR operator
    pub fn create_or() -> CompositePredicateAlkane {
        CompositePredicateAlkane::new(LogicalOperator::Or)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::alkanes::AlkaneId;
    use crate::predicates::{EqualityPredicateAlkane, PredicateAlkaneFactory, TimeLockedPredicateAlkane, TimeConstraint};
    
    /// Test composite predicate with AND operator
    #[test]
    fn test_composite_predicate_and() {
        // Create alkane IDs
        let left_id = AlkaneId("left_alkane".to_string());
        let right_id = AlkaneId("right_alkane".to_string());
        
        // Create amounts
        let left_amount = 100u128;
        let right_amount = 200u128;
        
        // Create an equality predicate
        let equality_predicate = PredicateAlkaneFactory::create_equality_predicate(
            left_id.clone(),
            left_amount,
            right_id.clone(),
            right_amount,
        );
        
        // Create a time-locked predicate
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let time_locked_predicate = TimeLockedPredicateAlkane::new(
            left_id.clone(),
            left_amount,
            TimeConstraint::Before(now + 3600), // 1 hour from now
        );
        
        // Create a composite predicate with AND operator
        let mut composite_predicate = CompositePredicateAlkaneFactory::create_and();
        composite_predicate.add_predicate(Box::new(equality_predicate));
        composite_predicate.add_predicate(Box::new(time_locked_predicate));
        
        // Create a transaction with matching alkanes
        let tx = create_test_transaction(vec![
            (left_id.clone(), left_amount),
            (right_id.clone(), right_amount),
        ]);
        
        // Validate the transaction
        let result = composite_predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    /// Test composite predicate with OR operator
    #[test]
    fn test_composite_predicate_or() {
        // Create alkane IDs
        let left_id = AlkaneId("left_alkane".to_string());
        let right_id = AlkaneId("right_alkane".to_string());
        
        // Create amounts
        let left_amount = 100u128;
        let right_amount = 200u128;
        
        // Create an equality predicate
        let equality_predicate = PredicateAlkaneFactory::create_equality_predicate(
            left_id.clone(),
            left_amount,
            right_id.clone(),
            right_amount,
        );
        
        // Create a time-locked predicate with an expired timestamp
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let time_locked_predicate = TimeLockedPredicateAlkane::new(
            left_id.clone(),
            left_amount,
            TimeConstraint::Before(now - 3600), // 1 hour ago
        );
        
        // Create a composite predicate with OR operator
        let mut composite_predicate = CompositePredicateAlkaneFactory::create_or();
        composite_predicate.add_predicate(Box::new(equality_predicate));
        composite_predicate.add_predicate(Box::new(time_locked_predicate));
        
        // Create a transaction with matching alkanes
        let tx = create_test_transaction(vec![
            (left_id.clone(), left_amount),
            (right_id.clone(), right_amount),
        ]);
        
        // Validate the transaction
        let result = composite_predicate.validate(&tx);
        
        // Verify the result
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
    
    /// Create a test transaction with alkane data
    fn create_test_transaction(alkane_data: Vec<(AlkaneId, u128)>) -> Transaction {
        let mut tx = Transaction {
            version: 2,
            lock_time: bitcoin::LockTime::ZERO.into(),
            input: Vec::new(),
            output: Vec::new(),
        };
        
        // Add a dummy input
        tx.input.push(bitcoin::TxIn {
            previous_output: bitcoin::OutPoint::null(),
            script_sig: bitcoin::Script::new(),
            sequence: bitcoin::Sequence::MAX,
            witness: bitcoin::Witness::new(),
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
            
            tx.output.push(bitcoin::TxOut {
                value: 0,
                script_pubkey: script,
            });
        }
        
        // Add a dummy recipient output
        tx.output.push(bitcoin::TxOut {
            value: 546, // Dust limit
            script_pubkey: bitcoin::Script::new(),
        });
        
        tx
    }
}