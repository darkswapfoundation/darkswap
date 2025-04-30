//! Example of using composite predicate alkanes
//!
//! This example demonstrates how to create and use composite predicate alkanes in DarkSwap.

use anyhow::Result;
use bitcoin::{Script, Transaction, TxIn, TxOut, Witness, LockTime};
use std::time::{SystemTime, UNIX_EPOCH};
use std::sync::Arc;

use darkswap_sdk::{
    DarkSwap,
    config::Config,
    predicates::{
        Predicate,
        TimeConstraint,
        LogicalOperator,
        EqualityPredicateAlkane,
        TimeLockedPredicateAlkane,
        CompositePredicateAlkane,
    },
    types::AlkaneId,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let darkswap = DarkSwap::new(config)?;
    
    // Create alkane IDs
    let left_id = AlkaneId("left_alkane".to_string());
    let right_id = AlkaneId("right_alkane".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Get current timestamp
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs();
    
    println!("Current time: {}", now);
    
    // Create an equality predicate alkane
    let equality_predicate = darkswap.create_equality_predicate_alkane(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    println!("\nCreated {} predicate", equality_predicate.name());
    println!("Description: {}", equality_predicate.description());
    println!("Left alkane: {} = {}", equality_predicate.left_alkane_id.0, equality_predicate.left_amount);
    println!("Right alkane: {} = {}", equality_predicate.right_alkane_id.0, equality_predicate.right_amount);
    
    // Create a time-locked predicate alkane
    let time_locked_predicate = darkswap.create_time_locked_before_predicate_alkane(
        left_id.clone(),
        left_amount,
        now + 3600, // 1 hour from now
    );
    
    println!("\nCreated {} predicate", time_locked_predicate.name());
    println!("Description: {}", time_locked_predicate.description());
    println!("Alkane: {} = {}", time_locked_predicate.alkane_id.0, time_locked_predicate.amount);
    println!("Time constraint: Before {}", now + 3600);
    
    // Create a composite predicate alkane with AND operator
    let mut composite_and_predicate = darkswap.create_composite_and_predicate_alkane();
    composite_and_predicate.add_predicate(Box::new(equality_predicate.clone()));
    composite_and_predicate.add_predicate(Box::new(time_locked_predicate.clone()));
    
    println!("\nCreated {} predicate with AND operator", composite_and_predicate.name());
    println!("Description: {}", composite_and_predicate.description());
    
    // Create a composite predicate alkane with OR operator
    let mut composite_or_predicate = darkswap.create_composite_or_predicate_alkane();
    composite_or_predicate.add_predicate(Box::new(equality_predicate.clone()));
    composite_or_predicate.add_predicate(Box::new(time_locked_predicate.clone()));
    
    println!("\nCreated {} predicate with OR operator", composite_or_predicate.name());
    println!("Description: {}", composite_or_predicate.description());
    
    // Create a transaction with matching alkanes
    let tx = create_test_transaction(vec![
        (left_id.clone(), left_amount),
        (right_id.clone(), right_amount),
    ]);
    
    // Validate the transaction against the predicates
    match darkswap.validate_predicate(&equality_predicate, &tx) {
        Ok(true) => println!("\nTransaction is valid according to the equality predicate"),
        Ok(false) => println!("\nTransaction is invalid according to the equality predicate"),
        Err(e) => println!("\nError validating transaction with equality predicate: {}", e),
    }
    
    match darkswap.validate_predicate(&time_locked_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the time-locked predicate"),
        Ok(false) => println!("Transaction is invalid according to the time-locked predicate"),
        Err(e) => println!("Error validating transaction with time-locked predicate: {}", e),
    }
    
    match darkswap.validate_predicate(&composite_and_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the composite AND predicate"),
        Ok(false) => println!("Transaction is invalid according to the composite AND predicate"),
        Err(e) => println!("Error validating transaction with composite AND predicate: {}", e),
    }
    
    match darkswap.validate_predicate(&composite_or_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the composite OR predicate"),
        Ok(false) => println!("Transaction is invalid according to the composite OR predicate"),
        Err(e) => println!("Error validating transaction with composite OR predicate: {}", e),
    }
    
    // Create a more complex composite predicate
    println!("\nCreating a more complex composite predicate...");
    
    // Create a time-locked predicate that will fail (already expired)
    let expired_predicate = darkswap.create_time_locked_before_predicate_alkane(
        left_id.clone(),
        left_amount,
        now - 3600, // 1 hour ago
    );
    
    // Create a nested composite predicate
    let mut nested_composite = darkswap.create_composite_and_predicate_alkane();
    nested_composite.add_predicate(Box::new(equality_predicate.clone()));
    nested_composite.add_predicate(Box::new(expired_predicate));
    
    // Create a top-level composite predicate
    let mut complex_predicate = darkswap.create_composite_or_predicate_alkane();
    complex_predicate.add_predicate(Box::new(nested_composite));
    complex_predicate.add_predicate(Box::new(time_locked_predicate.clone()));
    
    println!("Created a complex composite predicate");
    
    // Validate the transaction against the complex predicate
    match darkswap.validate_predicate(&complex_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the complex predicate"),
        Ok(false) => println!("Transaction is invalid according to the complex predicate"),
        Err(e) => println!("Error validating transaction with complex predicate: {}", e),
    }
    
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