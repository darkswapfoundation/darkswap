use bitcoin::{
    address::NetworkUnchecked, Address, Network, PubkeyHash,
    hashes::{Hash, hash160},
};
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol, AlkaneTransfer};
use darkswap_sdk::error::Result;
use darkswap_sdk::types::AlkaneId;
use std::collections::HashMap;

#[test]
fn test_process_transaction() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

    // Create addresses
    let pubkey_hash1 = PubkeyHash::from_raw_hash(hash160::Hash::hash(&[1; 20]));
    let pubkey_hash2 = PubkeyHash::from_raw_hash(hash160::Hash::hash(&[2; 20]));
    
    let address1 = Address::<NetworkUnchecked>::new(network, bitcoin::address::Payload::PubkeyHash(pubkey_hash1));
    let address2 = Address::<NetworkUnchecked>::new(network, bitcoin::address::Payload::PubkeyHash(pubkey_hash2));

    // Create an Alkane protocol
    let mut protocol = AlkaneProtocol::new(network);

    // Create an Alkane
    let alkane_id = AlkaneId("123".to_string());
    let mut properties = HashMap::new();
    properties.insert("website".to_string(), "https://example.com".to_string());

    let mut alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );

    alkane.properties = Some(AlkaneProperties {
        name: "Test Alkane".to_string(),
        description: Some("A test alkane for unit tests".to_string()),
        icon: None,
        metadata: properties,
    });

    // Register the Alkane
    protocol.register_alkane(alkane.clone())?;
    
    // Check initial balances
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("Initial address1 balance: {}", address1_balance);
    println!("Initial address2 balance: {}", address2_balance);
    
    assert_eq!(address1_balance, 0);
    assert_eq!(address2_balance, 0);
    
    // Create a transaction to mint initial balance to address1
    // This is a special case for testing purposes
    let tx = bitcoin::Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            bitcoin::TxOut {
                value: 0,
                script_pubkey: {
                    let mut script = bitcoin::ScriptBuf::new();
                    script.push_opcode(bitcoin::opcodes::all::OP_RETURN);
                    
                    // Format: "ALKANE:<id>:<amount>"
                    let data = format!("ALKANE:{}:{}", alkane_id.0, 10000000000u128);
                    println!("OP_RETURN data: {}", data);
                    
                    // Push the data byte by byte
                    for byte in data.as_bytes() {
                        script.push_slice(&[*byte]);
                    }
                    
                    script
                },
            },
            bitcoin::TxOut {
                value: 546, // Dust limit
                script_pubkey: address1.payload.script_pubkey(),
            },
        ],
    };
    
    // Process the transaction to add initial balance
    protocol.process_transaction(&tx, 100)?;
    
    // Check balances after initial transaction
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("After process_transaction:");
    println!("Address1 balance: {}", address1_balance);
    println!("Address2 balance: {}", address2_balance);
    
    // Try with a different format for the OP_RETURN data
    let tx2 = bitcoin::Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            bitcoin::TxOut {
                value: 0,
                script_pubkey: {
                    let mut script = bitcoin::ScriptBuf::new();
                    script.push_opcode(bitcoin::opcodes::all::OP_RETURN);
                    
                    // Format: "<id>:<amount>" (without the ALKANE: prefix)
                    let data = format!("{}:{}", alkane_id.0, 10000000000u128);
                    println!("OP_RETURN data (without prefix): {}", data);
                    
                    // Push the data byte by byte
                    for byte in data.as_bytes() {
                        script.push_slice(&[*byte]);
                    }
                    
                    script
                },
            },
            bitcoin::TxOut {
                value: 546, // Dust limit
                script_pubkey: address1.payload.script_pubkey(),
            },
        ],
    };
    
    // Process the transaction to add initial balance
    protocol.process_transaction(&tx2, 100)?;
    
    // Check balances after second transaction
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("After second process_transaction:");
    println!("Address1 balance: {}", address1_balance);
    println!("Address2 balance: {}", address2_balance);
    
    Ok(())
}