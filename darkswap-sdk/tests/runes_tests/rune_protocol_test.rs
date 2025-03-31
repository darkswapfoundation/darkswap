use darkswap_sdk::runes::{Rune, RuneTransfer, RuneProtocol, Edict, Etching};
use darkswap_sdk::runestone::{Runestone, Terms};
use darkswap_sdk::types::RuneId;
use darkswap_sdk::error::Result;
use bitcoin::{
    Network,
    OutPoint, TxOut, Transaction, Txid, Address,
    hashes::Hash,
};
use std::collections::HashMap;
use std::str::FromStr;
use darkswap_sdk::bitcoin_utils::{generate_test_address, generate_test_address_unchecked};

#[test]
fn test_rune_protocol_creation() {
    let protocol = RuneProtocol::new(Network::Regtest);
    assert_eq!(protocol.network(), Network::Regtest);
}

#[test]
fn test_rune_registration() -> Result<()> {
    let mut protocol = RuneProtocol::new(Network::Regtest);
    let rune_id: RuneId = 123456789;
    let outpoint = OutPoint::new(Txid::all_zeros(), 0);
    let rune = Rune::new(
        rune_id,
        Some("TEST".to_string()),
        8,
        1_000_000,
        0,
        outpoint,
        0,
    );
    
    // Register the rune
    protocol.register_rune(rune.clone())?;
    
    // Verify the rune was registered
    let retrieved_rune = protocol.get_rune(&rune_id).unwrap();
    assert_eq!(retrieved_rune.id, rune_id);
    assert_eq!(retrieved_rune.symbol, Some("TEST".to_string()));
    assert_eq!(retrieved_rune.decimals, 8);
    assert_eq!(retrieved_rune.supply, 1_000_000);
    
    // Try to register the same rune again (should fail)
    let result = protocol.register_rune(rune.clone());
    assert!(result.is_err());
    
    Ok(())
}

#[test]
#[ignore]
fn test_rune_balances() -> Result<()> {
    let mut protocol = RuneProtocol::new(Network::Regtest);
    let rune_id: RuneId = 123456789;
    let outpoint = OutPoint::new(Txid::all_zeros(), 0);
    let rune = Rune::new(
        rune_id,
        Some("TEST".to_string()),
        8,
        1_000_000,
        0,
        outpoint,
        0,
    );
    
    // Register the rune
    protocol.register_rune(rune.clone())?;
    
    // Create addresses using our utility function
    let address1 = generate_test_address_unchecked(Network::Regtest, 1)?;
    let address2 = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Initial balances should be zero
    assert_eq!(protocol.get_balance(&address1, rune_id), 0);
    assert_eq!(protocol.get_balance(&address2, rune_id), 0);
    
    // Create a transfer
    let transfer = RuneTransfer::new(
        rune.clone(),
        address1.clone(),
        address2.clone(),
        1000,
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
    
    // Create a simple OP_RETURN script with rune data
    let mut builder = bitcoin::blockdata::script::Builder::new();
    builder = builder.push_opcode(bitcoin::opcodes::all::OP_RETURN);
    let data = b"RUNE:RUNE123:5000";
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
    protocol.process_transaction(&tx, 0)?;
    
    // Now the transfer should succeed
    let result = protocol.apply_transfer(&transfer);
    assert!(result.is_ok());
    
    // Check the updated balances
    assert_eq!(protocol.get_balance(&address1, rune_id), 4000); // 5000 - 1000
    assert_eq!(protocol.get_balance(&address2, rune_id), 1000);
    
    // Get all balances for address1
    let balances = protocol.get_balances(&address1);
    assert_eq!(balances.len(), 1);
    assert_eq!(balances[0].amount, 4000);
    assert_eq!(balances[0].rune.id, rune_id);
    
    Ok(())
}

#[test]
#[ignore]
fn test_runestone_creation_and_parsing() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    
    // Create a runestone with an edict
    let edict = Edict {
        id: 12345,
        amount: 1000,
        output: 1,
    };
    
    let etching = Etching {
        rune: 12345,
        symbol: Some("TEST".to_string()),
        decimals: Some(8),
        spacers: 0,
        amount: 1_000_000,
        terms: None,
    };
    
    let runestone = Runestone {
        edicts: vec![edict],
        etching: Some(etching),
        default_output: Some(1),
        burn: false,
    };
    
    // Convert runestone to script
    let script = runestone.to_script();
    
    // Create a transaction with the runestone script
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO.into(),
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
            TxOut {
                value: 546,
                script_pubkey: Address::from_str("bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080")
                    .unwrap()
                    .script_pubkey(),
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx);
    
    // Verify that a runestone was parsed
    assert!(parsed_runestone.is_some());
    
    Ok(())
}

#[test]
#[ignore]
fn test_rune_transaction_creation() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    
    // Create addresses using our utility function
    let from_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let to_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    let change_address = generate_test_address(Network::Regtest, 1)?;
    
    // Create a rune transfer
    let rune_id: RuneId = 123456789;
    let outpoint = OutPoint::new(Txid::all_zeros(), 0);
    let rune = Rune::new(
        rune_id,
        Some("TEST".to_string()),
        8,
        1_000_000,
        0,
        outpoint,
        0,
    );
    
    let transfer = RuneTransfer::new(
        rune,
        from_address.clone(),
        to_address.clone(),
        1000,
    );
    
    // Create inputs
    let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let txout = TxOut {
        value: 10000,
        script_pubkey: from_address.script_pubkey(),
    };
    let inputs = vec![(outpoint, txout)];
    
    // Create a transaction
    let tx = protocol.create_transfer_transaction(
        &transfer,
        inputs,
        &change_address,
        1.0,
    )?;
    
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
fn test_rune_transaction_validation() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    
    // Create addresses using our utility function
    let from_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let to_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Create a simple OP_RETURN script with rune data
    let mut builder = bitcoin::blockdata::script::Builder::new();
    builder = builder.push_opcode(bitcoin::opcodes::all::OP_RETURN);
    let data = b"RUNE:RUNE123:1000";
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
    let transfer = protocol.validate_transaction(&tx, from_address.clone(), to_address.clone())?;
    
    // Verify that a transfer was detected
    assert!(transfer.is_some());
    let transfer = transfer.unwrap();
    assert_eq!(transfer.rune.id, 123456789);
    assert_eq!(transfer.amount, 1000);
    
    Ok(())
}

#[test]
fn test_rune_etching_transaction() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    
    // Create address
    let address = Address::from_str("bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080").unwrap();
    let change_address = Address::from_str("bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080").unwrap();
    
    // Create inputs
    let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let txout = TxOut {
        value: 10000,
        script_pubkey: address.script_pubkey(),
    };
    let inputs = vec![(outpoint, txout)];
    
    // Create an etching transaction
    let tx = protocol.create_etching_transaction(
        Some("TEST".to_string()),
        8,
        1_000_000,
        &address,
        inputs,
        &change_address,
        1.0,
    )?;
    
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