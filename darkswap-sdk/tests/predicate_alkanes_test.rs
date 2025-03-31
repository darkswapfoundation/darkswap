//! Tests for predicate alkanes
//!
//! This module provides tests for the predicate alkanes functionality in DarkSwap.

use anyhow::Result;
use bitcoin::{Script, Transaction, TxIn, TxOut, Witness, LockTime};
use std::collections::HashMap;

use darkswap_sdk::{
    alkanes::AlkaneId,
    config::Config,
    predicates::{EqualityPredicateAlkane, Predicate, PredicateAlkaneFactory},
    DarkSwap,
};

/// Test creating an equality predicate alkane
#[test]
fn test_create_equality_predicate_alkane() -> Result<()> {
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate
    let predicate = PredicateAlkaneFactory::create_equality_predicate(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    // Verify predicate properties
    assert_eq!(predicate.left_alkane_id, left_id);
    assert_eq!(predicate.left_amount, left_amount);
    assert_eq!(predicate.right_alkane_id, right_id);
    assert_eq!(predicate.right_amount, right_amount);
    assert_eq!(predicate.name(), "EqualityPredicateAlkane");
    
    Ok(())
}

/// Test validating a transaction with an equality predicate alkane
#[test]
fn test_validate_equality_predicate_alkane() -> Result<()> {
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate
    let predicate = PredicateAlkaneFactory::create_equality_predicate(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    // Create a transaction with matching alkanes
    let tx = create_test_transaction(vec![
        (left_id.clone(), left_amount),
        (right_id.clone(), right_amount),
    ]);
    
    // Validate the transaction
    let result = predicate.validate(&tx)?;
    
    // Verify the result
    assert!(result);
    
    Ok(())
}

/// Test validating a transaction with wrong amounts
#[test]
fn test_validate_equality_predicate_alkane_wrong_amounts() -> Result<()> {
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate
    let predicate = PredicateAlkaneFactory::create_equality_predicate(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    // Create a transaction with wrong amounts
    let tx = create_test_transaction(vec![
        (left_id.clone(), left_amount + 1),
        (right_id.clone(), right_amount),
    ]);
    
    // Validate the transaction
    let result = predicate.validate(&tx);
    
    // Verify the result
    assert!(result.is_err());
    
    Ok(())
}

/// Test validating a transaction with wrong IDs
#[test]
fn test_validate_equality_predicate_alkane_wrong_ids() -> Result<()> {
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    let wrong_id = AlkaneId("wrong_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate
    let predicate = PredicateAlkaneFactory::create_equality_predicate(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    // Create a transaction with wrong IDs
    let tx = create_test_transaction(vec![
        (left_id.clone(), left_amount),
        (wrong_id.clone(), right_amount),
    ]);
    
    // Validate the transaction
    let result = predicate.validate(&tx);
    
    // Verify the result
    assert!(result.is_err());
    
    Ok(())
}

/// Test validating a transaction with wrong number of alkanes
#[test]
fn test_validate_equality_predicate_alkane_wrong_count() -> Result<()> {
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate
    let predicate = PredicateAlkaneFactory::create_equality_predicate(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    // Create a transaction with only one alkane
    let tx = create_test_transaction(vec![
        (left_id.clone(), left_amount),
    ]);
    
    // Validate the transaction
    let result = predicate.validate(&tx);
    
    // Verify the result
    assert!(result.is_err());
    
    Ok(())
}

/// Test adding metadata to a predicate
#[test]
fn test_predicate_metadata() -> Result<()> {
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate with metadata
    let predicate = PredicateAlkaneFactory::create_equality_predicate(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    )
    .with_metadata("creator", "test_user")
    .with_metadata("expiry", "2025-12-31");
    
    // Verify metadata
    assert_eq!(predicate.metadata.get("creator"), Some(&"test_user".to_string()));
    assert_eq!(predicate.metadata.get("expiry"), Some(&"2025-12-31".to_string()));
    
    Ok(())
}

/// Test integration with DarkSwap
#[tokio::test]
async fn test_darkswap_predicate_integration() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let darkswap = DarkSwap::new(config)?;
    
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create the predicate using DarkSwap
    let predicate = darkswap.create_equality_predicate_alkane(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    // Create a transaction with matching alkanes
    let tx = create_test_transaction(vec![
        (left_id.clone(), left_amount),
        (right_id.clone(), right_amount),
    ]);
    
    // Validate the transaction using DarkSwap
    let result = darkswap.validate_predicate(&predicate, &tx)?;
    
    // Verify the result
    assert!(result);
    
    Ok(())
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