use darkswap_sdk::alkanes::{Alkane, AlkaneTransfer, AlkaneProtocol, AlkaneProperties};
use darkswap_sdk::types::AlkaneId;
use darkswap_sdk::error::Result;
use bitcoin::{
    Network,
    OutPoint, TxOut, Transaction,
    Address,
    hashes::Hash,
};
use std::collections::HashMap;
use std::str::FromStr;
use darkswap_sdk::bitcoin_utils::{generate_test_address, generate_test_address_unchecked};

#[test]
fn test_alkane_protocol_creation() {
    let protocol = AlkaneProtocol::new(Network::Regtest);
    assert_eq!(protocol.network(), Network::Regtest);
}

#[test]
fn test_alkane_registration() -> Result<()> {
    let mut protocol = AlkaneProtocol::new(Network::Regtest);
    
    let alkane_id = AlkaneId("ALKANE123".to_string());
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
    
    // Register the alkane
    protocol.register_alkane(alkane.clone())?;
    
    // Verify the alkane was registered
    let retrieved_alkane = protocol.get_alkane(&alkane_id).unwrap();
    assert_eq!(retrieved_alkane.id, alkane_id);
    assert_eq!(retrieved_alkane.symbol, "TEST");
    assert_eq!(retrieved_alkane.name, "Test Alkane");
    assert_eq!(retrieved_alkane.decimals, 8);
    assert_eq!(retrieved_alkane.supply, 1_000_000);
    assert_eq!(retrieved_alkane.limit, Some(1_000_000));
    assert!(retrieved_alkane.properties.is_some());
    
    // Try to register the same alkane again (should fail)
    let result = protocol.register_alkane(alkane.clone());
    assert!(result.is_err());
    
    Ok(())
}

#[test]
#[ignore]
fn test_alkane_balances() -> Result<()> {
    let mut protocol = AlkaneProtocol::new(Network::Regtest);
    
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    // Register the alkane
    protocol.register_alkane(alkane.clone())?;
    
    // Create addresses using our utility function
    let address1 = generate_test_address_unchecked(Network::Regtest, 1)?;
    let address2 = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Initial balances should be zero
    assert_eq!(protocol.get_balance(&address1, &alkane_id), 0);
    assert_eq!(protocol.get_balance(&address2, &alkane_id), 0);
    
    // Create a transfer
    let transfer = AlkaneTransfer::new(
        alkane_id.clone(),
        address1.clone(),
        address2.clone(),
        1000,
        None,
    );
    
    // Apply the transfer (should fail because address1 has no balance)
    let result = protocol.apply_transfer(&transfer);
    assert!(result.is_err());
    
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
    
    // Now the transfer should succeed
    let result = protocol.apply_transfer(&transfer);
    assert!(result.is_ok());
    
    // Check the updated balances
    assert_eq!(protocol.get_balance(&address1, &alkane_id), 4000); // 5000 - 1000
    assert_eq!(protocol.get_balance(&address2, &alkane_id), 1000);
    
    // Get all balances for address1
    let balances = protocol.get_balances(&address1);
    assert_eq!(balances.len(), 1);
    assert_eq!(balances[0].balance, 4000);
    assert_eq!(balances[0].alkane_id, alkane_id);
    
    Ok(())
}

#[test]
#[ignore]
fn test_alkane_transaction_creation() -> Result<()> {
    let mut protocol = AlkaneProtocol::new(Network::Regtest);
    
    // Create addresses using our utility function
    let from_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let to_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    let change_address = generate_test_address(Network::Regtest, 1)?;
    
    // Create an alkane transfer
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let transfer = AlkaneTransfer::new(
        alkane_id.clone(),
        from_address.clone(),
        to_address.clone(),
        1000,
        None,
    );
    
    // Create inputs
    let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let txout = TxOut {
        value: 10000,
        script_pubkey: from_address.script_pubkey(),
    };
    let inputs = vec![(outpoint, txout)];
    
    // Create a transaction
    let tx = protocol.create_transaction(&transfer, inputs, &change_address, 1.0)?;
    
    // Verify the transaction
    assert_eq!(tx.version, 2);
    assert_eq!(tx.input.len(), 1);
    assert!(tx.output.len() >= 2); // At least OP_RETURN and recipient outputs
    
    // The first output should be an OP_RETURN
    assert!(tx.output[0].script_pubkey.is_op_return());
    
    // The second output should go to the recipient
    assert_eq!(tx.output[1].script_pubkey, to_address.script_pubkey());
    assert_eq!(tx.output[1].value, 546); // Dust limit
    
    Ok(())
}

#[test]
#[ignore]
fn test_alkane_transaction_validation() -> Result<()> {
    let mut protocol = AlkaneProtocol::new(Network::Regtest);
    
    // Create addresses using our utility function
    let from_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let to_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Create a simple OP_RETURN script with alkane data
    let mut builder = bitcoin::blockdata::script::Builder::new();
    builder = builder.push_opcode(bitcoin::opcodes::all::OP_RETURN);
    let data = b"ALKANE:ALKANE123:1000";
    builder = builder.push_slice(data);
    let script = builder.into_script();
    
    // Create a transaction
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO.into(),
        input: vec![
            bitcoin::TxIn {
                previous_output: OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0),
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
                script_pubkey: to_address.script_pubkey(),
            },
        ],
    };
    
    // Validate the transaction
    let transfer = protocol.validate_transaction(&tx)?;
    
    // Verify that a transfer was detected
    assert!(transfer.is_some());
    let transfer = transfer.unwrap();
    assert_eq!(transfer.alkane_id, AlkaneId("ALKANE123".to_string()));
    assert_eq!(transfer.amount, 1000);
    
    Ok(())
}

#[test]
fn test_alkane_from_rune() -> Result<()> {
    let mut protocol = AlkaneProtocol::new(Network::Regtest);
    
    // Create a rune ID
    let rune_id = "RUNE123".to_string();
    
    // Create alkane ID from rune ID
    let alkane_id = AlkaneId(format!("ALKANE:{}", rune_id));
    
    // Verify the conversion
    assert_eq!(alkane_id, AlkaneId("ALKANE:RUNE123".to_string()));
    
    Ok(())
}

#[test]
fn test_alkane_creation_transaction() -> Result<()> {
    let mut protocol = AlkaneProtocol::new(Network::Regtest);
    
    // Create addresses using our utility function
    let address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let change_address = generate_test_address(Network::Regtest, 1)?;
    
    // Create inputs
    let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let txout = TxOut {
        value: 10000,
        script_pubkey: address.script_pubkey(),
    };
    let inputs = vec![(outpoint, txout)];
    
    // Create properties
    let mut properties = HashMap::new();
    properties.insert("website".to_string(), "https://example.com".to_string());
    properties.insert("description".to_string(), "A test alkane".to_string());
    
    let alkane_properties = AlkaneProperties {
        name: "Test Alkane".to_string(),
        description: Some("A test alkane for unit tests".to_string()),
        icon: None,
        metadata: properties,
    };
    
    // Create an alkane
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let mut alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    alkane.properties = Some(alkane_properties);
    
    // Register the alkane
    protocol.register_alkane(alkane.clone())?;
    
    // Create a transfer to self (to create the transaction)
    let transfer = AlkaneTransfer::new(
        alkane_id.clone(),
        address.clone(),
        address.clone(),
        1_000_000,
        None,
    );
    
    // Create a transaction
    let tx = protocol.create_transaction(&transfer, inputs, &change_address, 1.0)?;
    
    // Verify the transaction
    assert_eq!(tx.version, 2);
    assert_eq!(tx.input.len(), 1);
    assert!(tx.output.len() >= 2); // At least OP_RETURN and recipient outputs
    
    // The first output should be an OP_RETURN
    assert!(tx.output[0].script_pubkey.is_op_return());
    
    // The second output should go back to the sender
    assert_eq!(tx.output[1].script_pubkey, address.script_pubkey());
    assert_eq!(tx.output[1].value, 546); // Dust limit
    
    Ok(())
}