//! Multi-signature predicate alkane example
//!
//! This example demonstrates how to create and use multi-signature predicate alkanes in DarkSwap.

use anyhow::Result;
use bitcoin::{PrivateKey, PublicKey, Network, Transaction, TxIn, TxOut, Witness, LockTime};
use bitcoin::secp256k1::Secp256k1;
use std::time::{SystemTime, UNIX_EPOCH};
use std::sync::Arc;

use darkswap_sdk::{
    DarkSwap,
    config::Config,
    predicates::{
        Predicate,
        MultiSignaturePredicateAlkane,
    },
    types::AlkaneId,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let darkswap = DarkSwap::new(config)?;
    
    // Create private keys
    let private_key1 = PrivateKey::from_wif("cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy")?;
    let private_key2 = PrivateKey::from_wif("cRGkipHiYFRSAgdY9NjUT4ESg7ic3dpGZ5GNxABDUJHx6M8GbKgN")?;
    let private_key3 = PrivateKey::from_wif("cTivdBnq7FLxxuuNmgFnYddGsn9mvKV1PZEPw2mfQQBVHfzZ7KqR")?;
    
    // Get public keys
    let secp = Secp256k1::new();
    let public_key1 = private_key1.public_key(&secp);
    let public_key2 = private_key2.public_key(&secp);
    let public_key3 = private_key3.public_key(&secp);
    
    println!("Public key 1: {}", public_key1);
    println!("Public key 2: {}", public_key2);
    println!("Public key 3: {}", public_key3);
    
    // Create a multi-signature predicate alkane
    let alkane_id = AlkaneId("multi_sig_alkane".to_string());
    let amount = 100u128;
    let public_keys = vec![public_key1, public_key2, public_key3];
    let required_signatures = 2;
    
    let multi_sig_predicate = darkswap.create_multi_signature_predicate_alkane(
        alkane_id.clone(),
        amount,
        public_keys.clone(),
        required_signatures,
    );
    
    println!("\nCreated {} predicate", multi_sig_predicate.name());
    println!("Description: {}", multi_sig_predicate.description());
    println!("Alkane: {} = {}", multi_sig_predicate.alkane_id.0, multi_sig_predicate.amount);
    println!("Required signatures: {}/{}", multi_sig_predicate.required_signatures, multi_sig_predicate.public_keys.len());
    
    // Create a transaction with the alkane
    let tx = create_test_transaction(
        &alkane_id,
        amount,
        &multi_sig_predicate,
    );
    
    // Validate the transaction
    match darkswap.validate_predicate(&multi_sig_predicate, &tx) {
        Ok(true) => println!("\nTransaction is valid according to the multi-signature predicate"),
        Ok(false) => println!("\nTransaction is invalid according to the multi-signature predicate"),
        Err(e) => println!("\nError validating transaction with multi-signature predicate: {}", e),
    }
    
    // Create a composite predicate with a time-locked predicate
    println!("\nCreating a composite predicate with a time-locked predicate...");
    
    // Get current timestamp
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs();
    
    // Create a time-locked predicate
    let time_locked_predicate = darkswap.create_time_locked_before_predicate_alkane(
        alkane_id.clone(),
        amount,
        now + 3600, // 1 hour from now
    );
    
    println!("Created {} predicate", time_locked_predicate.name());
    println!("Description: {}", time_locked_predicate.description());
    println!("Alkane: {} = {}", time_locked_predicate.alkane_id.0, time_locked_predicate.amount);
    println!("Time constraint: Before {}", now + 3600);
    
    // Create a composite predicate with AND operator
    let mut composite_predicate = darkswap.create_composite_and_predicate_alkane();
    composite_predicate.add_predicate(Box::new(multi_sig_predicate.clone()));
    composite_predicate.add_predicate(Box::new(time_locked_predicate.clone()));
    
    println!("\nCreated {} predicate with AND operator", composite_predicate.name());
    println!("Description: {}", composite_predicate.description());
    
    // Validate the transaction against the composite predicate
    match darkswap.validate_predicate(&composite_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the composite predicate"),
        Ok(false) => println!("Transaction is invalid according to the composite predicate"),
        Err(e) => println!("Error validating transaction with composite predicate: {}", e),
    }
    
    // Create a composite predicate with OR operator
    let mut composite_or_predicate = darkswap.create_composite_or_predicate_alkane();
    composite_or_predicate.add_predicate(Box::new(multi_sig_predicate.clone()));
    composite_or_predicate.add_predicate(Box::new(time_locked_predicate.clone()));
    
    println!("\nCreated {} predicate with OR operator", composite_or_predicate.name());
    println!("Description: {}", composite_or_predicate.description());
    
    // Validate the transaction against the composite OR predicate
    match darkswap.validate_predicate(&composite_or_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the composite OR predicate"),
        Ok(false) => println!("Transaction is invalid according to the composite OR predicate"),
        Err(e) => println!("Error validating transaction with composite OR predicate: {}", e),
    }
    
    // Create a more complex scenario
    println!("\nCreating a more complex scenario...");
    
    // Create a time-locked predicate that will fail (already expired)
    let expired_predicate = darkswap.create_time_locked_before_predicate_alkane(
        alkane_id.clone(),
        amount,
        now - 3600, // 1 hour ago
    );
    
    // Create a multi-signature predicate with higher threshold
    let high_threshold_predicate = darkswap.create_multi_signature_predicate_alkane(
        alkane_id.clone(),
        amount,
        public_keys.clone(),
        3, // Require all 3 signatures
    );
    
    // Create a nested composite predicate
    let mut nested_composite = darkswap.create_composite_and_predicate_alkane();
    nested_composite.add_predicate(Box::new(high_threshold_predicate));
    nested_composite.add_predicate(Box::new(expired_predicate));
    
    // Create a top-level composite predicate
    let mut complex_predicate = darkswap.create_composite_or_predicate_alkane();
    complex_predicate.add_predicate(Box::new(nested_composite));
    complex_predicate.add_predicate(Box::new(multi_sig_predicate.clone()));
    
    println!("Created a complex composite predicate");
    
    // Validate the transaction against the complex predicate
    match darkswap.validate_predicate(&complex_predicate, &tx) {
        Ok(true) => println!("Transaction is valid according to the complex predicate"),
        Ok(false) => println!("Transaction is invalid according to the complex predicate"),
        Err(e) => println!("Error validating transaction with complex predicate: {}", e),
    }
    
    Ok(())
}

/// Create a test transaction with alkane data and multi-signature script
fn create_test_transaction(
    alkane_id: &AlkaneId,
    amount: u128,
    predicate: &MultiSignaturePredicateAlkane,
) -> Transaction {
    let mut tx = Transaction {
        version: 2,
        lock_time: LockTime::ZERO.into(),
        input: Vec::new(),
        output: Vec::new(),
    };
    
    // Add inputs with multi-signature script
    tx.input.push(TxIn {
        previous_output: bitcoin::OutPoint::null(),
        script_sig: predicate.create_script(),
        sequence: bitcoin::Sequence::MAX,
        witness: Witness::new(),
    });
    
    tx.input.push(TxIn {
        previous_output: bitcoin::OutPoint::null(),
        script_sig: bitcoin::Script::new(),
        sequence: bitcoin::Sequence::MAX,
        witness: Witness::new(),
    });
    
    // Add the alkane output
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
    
    // Add a dummy recipient output
    tx.output.push(TxOut {
        value: 546, // Dust limit
        script_pubkey: bitcoin::Script::new(),
    });
    
    tx
}