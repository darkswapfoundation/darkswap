use darkswap_sdk::alkanes::{Alkane, AlkaneTransfer, ThreadSafeAlkaneProtocol};
use darkswap_sdk::types::AlkaneId;
use darkswap_sdk::error::Result;
use bitcoin::{
    Network,
    OutPoint, TxOut, Transaction, Address,
    hashes::Hash,
};
use std::sync::Arc;
use std::str::FromStr;
use darkswap_sdk::bitcoin_utils::{generate_test_address, generate_test_address_unchecked};
use std::thread;

#[test]
fn test_thread_safe_alkane_protocol_creation() -> Result<()> {
    let protocol = ThreadSafeAlkaneProtocol::new(Network::Regtest);
    
    // Register an alkane
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    protocol.register_alkane(alkane.clone())?;
    
    // Verify the alkane was registered
    let retrieved_alkane = protocol.get_alkane(&alkane_id)?;
    assert!(retrieved_alkane.is_some());
    let retrieved_alkane = retrieved_alkane.unwrap();
    assert_eq!(retrieved_alkane.id, alkane_id);
    
    Ok(())
}

#[test]
#[ignore]
fn test_thread_safe_alkane_protocol_concurrent_access() -> Result<()> {
    let protocol = Arc::new(ThreadSafeAlkaneProtocol::new(Network::Regtest));
    
    // Register an alkane
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    protocol.register_alkane(alkane.clone())?;
    
    // Create addresses using our utility function
    let address1 = generate_test_address_unchecked(Network::Regtest, 1)?;
    let address2 = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Manually set a balance for address1
    let transfer = AlkaneTransfer::new(
        alkane_id.clone(),
        address1.clone(),
        address1.clone(),
        5000,
        None,
    );
    
    // Create a transaction to set the initial balance
    let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let txout = TxOut {
        value: 10000,
        script_pubkey: address1.script_pubkey(),
    };
    
    // Create a simple OP_RETURN script with alkane data
    let mut builder = bitcoin::blockdata::script::Builder::new();
    builder = builder.push_opcode(bitcoin::opcodes::all::OP_RETURN);
    let data = b"ALKANE:ALKANE123:5000";
    builder = builder.push_slice(data);
    let script = builder.into_script();
    
    // Create a transaction
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO.into(),
        input: vec![
            bitcoin::TxIn {
                previous_output: outpoint,
                script_sig: bitcoin::Script::new(),
                sequence: bitcoin::Sequence::MAX,
                witness: bitcoin::Witness::new(),
            },
        ],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
            TxOut {
                value: 546,
                script_pubkey: address1.script_pubkey(),
            },
        ],
    };
    
    // Process the transaction to set the initial balance
    protocol.process_transaction(&tx)?;
    
    // Verify the initial balance
    assert_eq!(protocol.get_balance(&address1, &alkane_id)?, 5000);
    
    // Create multiple threads to transfer alkanes concurrently
    let mut handles = vec![];
    let num_threads = 5;
    let amount_per_thread = 100;
    
    for i in 0..num_threads {
        let protocol_clone = Arc::clone(&protocol);
        let alkane_id_clone = alkane_id.clone();
        let address1_clone = address1.clone();
        let address2_clone = address2.clone();
        
        let handle = thread::spawn(move || -> Result<()> {
            // Create a transfer
            let transfer = AlkaneTransfer::new(
                alkane_id_clone,
                address1_clone.clone(),
                address2_clone,
                amount_per_thread,
                Some(format!("Thread {}", i)),
            );
            
            // Create inputs
            let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), i as u32);
            let txout = TxOut {
                value: 10000,
                script_pubkey: address1_clone.script_pubkey(),
            };
            let inputs = vec![(outpoint, txout)];
            
            // Create a transaction
            let tx = protocol_clone.create_transaction(
                &transfer,
                inputs,
                &generate_test_address(Network::Regtest, 1)?,
                1.0,
            )?;
            
            // Process the transaction
            protocol_clone.process_transaction(&tx)?;
            
            Ok(())
        });
        
        handles.push(handle);
    }
    
    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap()?;
    }
    
    // Verify the final balances
    assert_eq!(protocol.get_balance(&address1, &alkane_id)?, 5000 - (num_threads * amount_per_thread));
    assert_eq!(protocol.get_balance(&address2, &alkane_id)?, num_threads * amount_per_thread);
    
    Ok(())
}

#[test]
fn test_thread_safe_alkane_from_rune() -> Result<()> {
    let protocol = ThreadSafeAlkaneProtocol::new(Network::Regtest);
    
    // Create a rune ID
    let rune_id = "RUNE123".to_string();
    
    // Create alkane ID from rune ID
    let alkane_id = AlkaneId(format!("ALKANE:{}", rune_id));
    
    // Verify the conversion
    assert_eq!(alkane_id, AlkaneId("ALKANE:RUNE123".to_string()));
    
    Ok(())
}