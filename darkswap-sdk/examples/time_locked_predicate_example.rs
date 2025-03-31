//! Example of using time-locked predicate alkanes
//!
//! This example demonstrates how to create and use time-locked predicate alkanes in DarkSwap.

use anyhow::Result;
use bitcoin::{Script, Transaction, TxIn, TxOut, Witness, LockTime};
use std::time::{SystemTime, UNIX_EPOCH};
use darkswap_sdk::{
    DarkSwap,
    config::Config,
    predicates::{TimeLockedPredicateAlkane, TimeConstraint, Predicate},
    types::AlkaneId,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let darkswap = DarkSwap::new(config)?;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create amount
    let amount = 100u128;
    
    // Get current timestamp
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs();
    
    // Create timestamps
    let one_hour_ago = now - 3600;
    let one_hour_later = now + 3600;
    let two_hours_later = now + 7200;
    
    println!("Current time: {}", now);
    println!("One hour ago: {}", one_hour_ago);
    println!("One hour later: {}", one_hour_later);
    println!("Two hours later: {}", two_hours_later);
    
    // Create a time-locked predicate alkane that can only be executed before a specific timestamp
    let before_predicate = darkswap.create_time_locked_before_predicate_alkane(
        alkane_id.clone(),
        amount,
        one_hour_later,
    );
    
    println!("\nCreated {} predicate", before_predicate.name());
    println!("Description: {}", before_predicate.description());
    println!("Alkane: {} = {}", before_predicate.alkane_id.0, before_predicate.amount);
    println!("Time constraint: Before {}", one_hour_later);
    
    // Create a time-locked predicate alkane that can only be executed after a specific timestamp
    let after_predicate = darkswap.create_time_locked_after_predicate_alkane(
        alkane_id.clone(),
        amount,
        one_hour_ago,
    );
    
    println!("\nCreated {} predicate", after_predicate.name());
    println!("Description: {}", after_predicate.description());
    println!("Alkane: {} = {}", after_predicate.alkane_id.0, after_predicate.amount);
    println!("Time constraint: After {}", one_hour_ago);
    
    // Create a time-locked predicate alkane that can only be executed between two timestamps
    let between_predicate = darkswap.create_time_locked_between_predicate_alkane(
        alkane_id.clone(),
        amount,
        one_hour_ago,
        one_hour_later,
    );
    
    println!("\nCreated {} predicate", between_predicate.name());
    println!("Description: {}", between_predicate.description());
    println!("Alkane: {} = {}", between_predicate.alkane_id.0, between_predicate.amount);
    println!("Time constraint: Between {} and {}", one_hour_ago, one_hour_later);
    
    // Create a transaction with the alkane
    let tx = create_test_transaction(vec![
        (alkane_id.clone(), amount),
    ]);
    
    // Validate the transaction against the predicates
    match darkswap.validate_predicate(&before_predicate, &tx) {
        Ok(true) => println!("\nTransaction is valid according to the before predicate"),
        Ok(false) => println!("\nTransaction is invalid according to the before predicate"),
        Err(e) => println!("\nError validating transaction with before predicate: {}", e),
    }
    
    match darkswap.validate_predicate(&after_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the after predicate"),
        Ok(false) => println!("Transaction is invalid according to the after predicate"),
        Err(e) => println!("Error validating transaction with after predicate: {}", e),
    }
    
    match darkswap.validate_predicate(&between_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the between predicate"),
        Ok(false) => println!("Transaction is invalid according to the between predicate"),
        Err(e) => println!("Error validating transaction with between predicate: {}", e),
    }
    
    // Create a time-locked predicate alkane that will fail validation
    let future_predicate = darkswap.create_time_locked_after_predicate_alkane(
        alkane_id.clone(),
        amount,
        two_hours_later,
    );
    
    println!("\nCreated {} predicate", future_predicate.name());
    println!("Description: {}", future_predicate.description());
    println!("Alkane: {} = {}", future_predicate.alkane_id.0, future_predicate.amount);
    println!("Time constraint: After {}", two_hours_later);
    
    // Validate the transaction against the future predicate
    match darkswap.validate_predicate(&future_predicate, &tx) {
        Ok(true) => println!("\nTransaction is valid according to the future predicate"),
        Ok(false) => println!("\nTransaction is invalid according to the future predicate"),
        Err(e) => println!("\nError validating transaction with future predicate: {}", e),
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