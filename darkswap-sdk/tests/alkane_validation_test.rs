use bitcoin::{
    psbt::Psbt, Address, Network, OutPoint, Script, Transaction, LockTime,
    TxOut, Txid, PubkeyHash,
    blockdata::opcodes::all,
};
use bitcoin::hashes::Hash;
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol};
use darkswap_sdk::error::Result;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[test]
fn test_alkane_validation() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

    // Create an Alkane protocol
    let alkane_protocol = Arc::new(Mutex::new(AlkaneProtocol::new(network)));

    // Create an Alkane
    let alkane_id = darkswap_sdk::types::AlkaneId("ALKANE123".to_string());
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
    {
        let mut protocol = alkane_protocol.lock().unwrap();
        protocol.register_alkane(alkane.clone())?;
    }

    // Create a transaction with an OP_RETURN output
    let mut tx = Transaction {
        version: 2,
        lock_time: LockTime::ZERO.into(),
        input: vec![
            bitcoin::TxIn {
                previous_output: OutPoint::new(Txid::all_zeros(), 0),
                script_sig: Script::default(),
                sequence: bitcoin::Sequence::MAX,
                witness: bitcoin::Witness::new(),
            }
        ],
        output: Vec::new(),
    };
// Create the OP_RETURN output with the alkane transfer data
    // Create the OP_RETURN output with the alkane transfer data
    let mut builder = bitcoin::blockdata::script::Builder::new();
    builder = builder.push_opcode(all::OP_RETURN);
    
    // Format: "ALKANE:<id>:<amount>"
    let data = "ALKANE:ALKANE123:10000000000";
    
    // Push the data as a single slice
    builder = builder.push_slice(data.as_bytes().to_vec());
    
    // Build the script
    let script = builder.into_script();
    
    // Add the script to the transaction
    tx.output.push(TxOut {
        value: 0,
        script_pubkey: script,
    });
    
    // Create a recipient address
    let pubkey_hash = PubkeyHash::from_raw_hash(bitcoin::hashes::hash160::Hash::from_slice(&[2; 20]).unwrap());
    let recipient_address = Address::p2pkh(&bitcoin::PublicKey::from_slice(&[2; 33]).unwrap(), network);
    
    // Add the recipient output
    tx.output.push(TxOut {
        value: 546, // Dust limit
        script_pubkey: recipient_address.script_pubkey(),
    });
    
    // Add a change output
    let pubkey_hash = PubkeyHash::from_raw_hash(bitcoin::hashes::hash160::Hash::from_slice(&[3; 20]).unwrap());
    let change_address = Address::p2pkh(&bitcoin::PublicKey::from_slice(&[3; 33]).unwrap(), network);
    
    tx.output.push(TxOut {
        value: 9303,
        script_pubkey: change_address.script_pubkey(),
    });
    
    // Validate the transaction
    let protocol = alkane_protocol.lock().unwrap();
    let transfer = protocol.validate_transaction(&tx)?;
    
    // Check that the transfer was found
    assert!(transfer.is_some());
    
    // Check that the transfer has the correct alkane ID and amount
    let transfer = transfer.unwrap();
    assert_eq!(transfer.alkane_id.0, "ALKANE123");
    assert_eq!(transfer.amount, 10000000000);
    
    Ok(())
}