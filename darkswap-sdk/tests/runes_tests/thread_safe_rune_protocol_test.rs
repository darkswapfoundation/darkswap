use darkswap_sdk::runes::{Rune, RuneTransfer, ThreadSafeRuneProtocol};
use darkswap_sdk::types::RuneId;
use darkswap_sdk::error::Result;
use bitcoin::{
    Network,
    OutPoint, TxOut, Transaction,
    address::{Address, NetworkUnchecked},
    hashes::Hash,
};
use std::sync::Arc;
use std::str::FromStr;
use darkswap_sdk::bitcoin_utils::{generate_test_address, generate_test_address_unchecked};
use std::thread;

#[test]
fn test_thread_safe_rune_protocol_creation() -> Result<()> {
    let protocol = ThreadSafeRuneProtocol::new(Network::Regtest);
    
    // Register a rune
    let rune_id = RuneId("RUNE123".to_string());
    let rune = Rune::new(
        rune_id.clone(),
        "TEST".to_string(),
        "Test Rune".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    protocol.register_rune(rune.clone())?;
    
    // Verify the rune was registered
    let retrieved_rune = protocol.get_rune(&rune_id)?;
    assert!(retrieved_rune.is_some());
    let retrieved_rune = retrieved_rune.unwrap();
    assert_eq!(retrieved_rune.id, rune_id);
    
    Ok(())
}

#[test]
#[ignore]
fn test_thread_safe_rune_protocol_concurrent_access() -> Result<()> {
    let protocol = Arc::new(ThreadSafeRuneProtocol::new(Network::Regtest));
    
    // Register a rune
    let rune_id = RuneId("RUNE123".to_string());
    let rune = Rune::new(
        rune_id.clone(),
        "TEST".to_string(),
        "Test Rune".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    protocol.register_rune(rune.clone())?;
    
    // Create addresses using our utility function
    let address1 = generate_test_address_unchecked(Network::Regtest, 1)?;
    let address2 = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Manually set a balance for address1
    let transfer = RuneTransfer::new(
        rune_id.clone(),
        address1.clone(),
        address1.clone(),
        5000,
        None,
    );
    
    // Create a transaction to set the initial balance
    let outpoint = OutPoint::new(bitcoin::Txid::from_raw_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let txout = TxOut {
        value: 10000,
        script_pubkey: address1.payload.script_pubkey(),
    };
    
    // Create a simple OP_RETURN script with rune data
    let mut script = bitcoin::ScriptBuf::new();
    script.push_opcode(bitcoin::opcodes::all::OP_RETURN);
    let data = b"RUNE:RUNE123:5000";
    let mut buffer = [0u8; 1];
    buffer[0] = data[0];
    script.push_slice(&buffer);
    
    // Create a transaction
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![
            bitcoin::TxIn {
                previous_output: outpoint,
                script_sig: bitcoin::ScriptBuf::new(),
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
                script_pubkey: address1.payload.script_pubkey(),
            },
        ],
    };
    
    // Process the transaction to set the initial balance
    protocol.process_transaction(&tx)?;
    
    // Verify the initial balance
    assert_eq!(protocol.get_balance(&address1, &rune_id)?, 5000);
    
    // Create multiple threads to transfer runes concurrently
    let mut handles = vec![];
    let num_threads = 5;
    let amount_per_thread = 100;
    
    for i in 0..num_threads {
        let protocol_clone = Arc::clone(&protocol);
        let rune_id_clone = rune_id.clone();
        let address1_clone = address1.clone();
        let address2_clone = address2.clone();
        
        let handle = thread::spawn(move || -> Result<()> {
            // Create a transfer
            let transfer = RuneTransfer::new(
                rune_id_clone,
                address1_clone.clone(),
                address2_clone,
                amount_per_thread,
                Some(format!("Thread {}", i)),
            );
            
            // Create inputs
            let outpoint = OutPoint::new(bitcoin::Txid::from_raw_hash(bitcoin::hashes::Hash::all_zeros()), i as u32);
            let txout = TxOut {
                value: 10000,
                script_pubkey: address1_clone.payload.script_pubkey(),
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
    assert_eq!(protocol.get_balance(&address1, &rune_id)?, 5000 - (num_threads * amount_per_thread));
    assert_eq!(protocol.get_balance(&address2, &rune_id)?, num_threads * amount_per_thread);
    
    Ok(())
}