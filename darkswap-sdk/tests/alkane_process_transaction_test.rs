use bitcoin::{
    Address, Network, LockTime, PrivateKey, PublicKey,
    secp256k1::Secp256k1,
    blockdata::opcodes::all,
    blockdata::script::Builder,
};
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol};
use darkswap_sdk::error::Result;
use darkswap_sdk::types::AlkaneId;
use std::collections::HashMap;

#[test]
fn test_process_transaction() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

    // Create addresses
    // Create valid public keys for p2pkh addresses
    let secp = Secp256k1::new();
    let private_key1 = PrivateKey::from_slice(&[1; 32], Network::Regtest).unwrap();
    let private_key2 = PrivateKey::from_slice(&[2; 32], Network::Regtest).unwrap();
    let pubkey1 = PublicKey::from_private_key(&secp, &private_key1);
    let pubkey2 = PublicKey::from_private_key(&secp, &private_key2);
    
    let address1 = Address::p2pkh(&pubkey1, network);
    let address2 = Address::p2pkh(&pubkey2, network);

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
        lock_time: LockTime::ZERO.into(),
        input: vec![],
        output: vec![
            bitcoin::TxOut {
                value: 0,
                script_pubkey: {
                    // Create a script with OP_RETURN and data
                    let mut builder = Builder::new();
                    builder = builder.push_opcode(all::OP_RETURN);
                    
                    // Format: "ALKANE:<id>:<amount>"
                    let data = format!("ALKANE:{}:{}", alkane_id.0, 10000000000u128);
                    println!("OP_RETURN data: {}", data);
                    
                    // Push the data as a single chunk
                    builder = builder.push_slice(data.as_bytes());
                    
                    builder.into_script()
                },
            },
            bitcoin::TxOut {
                value: 546, // Dust limit
                script_pubkey: address1.script_pubkey(),
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
        lock_time: LockTime::ZERO.into(),
        input: vec![],
        output: vec![
            bitcoin::TxOut {
                value: 0,
                script_pubkey: {
                    // Create a script with OP_RETURN and data
                    let mut builder = Builder::new();
                    builder = builder.push_opcode(all::OP_RETURN);
                    
                    // Format: "<id>:<amount>" (without the ALKANE: prefix)
                    let data = format!("{}:{}", alkane_id.0, 10000000000u128);
                    println!("OP_RETURN data (without prefix): {}", data);
                    
                    // Push the data as a single chunk
                    builder = builder.push_slice(data.as_bytes());
                    
                    builder.into_script()
                },
            },
            bitcoin::TxOut {
                value: 546, // Dust limit
                script_pubkey: address1.script_pubkey(),
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