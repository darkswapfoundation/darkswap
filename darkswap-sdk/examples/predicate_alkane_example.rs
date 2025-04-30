//! Example of using predicate alkanes
//!
//! This example demonstrates how to create and use predicate alkanes in DarkSwap.

use anyhow::Result;
use bitcoin::{Script, Transaction, TxIn, TxOut, Witness, LockTime};
use darkswap_sdk::{
    DarkSwap,
    config::Config,
    predicates::{EqualityPredicateAlkane, Predicate},
    types::AlkaneId,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let darkswap = DarkSwap::new(config)?;
    
    // Create alkane IDs
    let left_id = AlkaneId("ALKANE:123".to_string());
    let right_id = AlkaneId("ALKANE:456".to_string());
    
    // Create amounts
    let left_amount = 100u128;
    let right_amount = 200u128;
    
    // Create an equality predicate alkane
    let predicate = darkswap.create_equality_predicate_alkane(
        left_id.clone(),
        left_amount,
        right_id.clone(),
        right_amount,
    );
    
    println!("Created {} predicate", predicate.name());
    println!("Description: {}", predicate.description());
    println!("Left alkane: {} = {}", predicate.left_alkane_id.0, predicate.left_amount);
    println!("Right alkane: {} = {}", predicate.right_alkane_id.0, predicate.right_amount);
    
    // Create a transaction with matching alkanes
    let tx = create_test_transaction(vec![
        (left_id, left_amount),
        (right_id, right_amount),
    ]);
    
    // Validate the transaction
    match darkswap.validate_predicate(&predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the predicate"),
        Ok(false) => println!("Transaction is invalid according to the predicate"),
        Err(e) => println!("Error validating transaction: {}", e),
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