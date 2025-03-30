use bitcoin::{
    Address, Network, PrivateKey, PublicKey,
    secp256k1::Secp256k1,
};
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol, AlkaneTransfer};
use darkswap_sdk::error::Result;
use darkswap_sdk::types::AlkaneId;
use std::collections::HashMap;

// Helper function to add balance to an address
fn add_balance(
    protocol: &mut AlkaneProtocol,
    alkane_id: &AlkaneId,
    address: &Address,
    amount: u128,
) -> Result<()> {
    // Use the set_balance_for_testing method to directly set the balance
    protocol.set_balance_for_testing(address, alkane_id, amount);
    
    Ok(())
}

#[test]
fn test_alkane_protocol_simple() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

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
    
    // Create a transfer from address1 to address2
    // This should fail with InsufficientBalance because address1 has no balance
    let transfer = AlkaneTransfer {
        alkane_id: alkane_id.clone(),
        from: address1.clone(),
        to: address2.clone(),
        amount: 5000000000, // 50 with 8 decimals
        memo: Some("Transfer".to_string()),
    };
    
    // Apply the transfer - this should fail with InsufficientBalance
    let result = protocol.apply_transfer(&transfer);
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is InsufficientBalance
    match result {
        Err(darkswap_sdk::error::Error::InsufficientBalance) => {
            println!("Got expected InsufficientBalance error");
        },
        _ => {
            panic!("Expected InsufficientBalance error, got {:?}", result);
        }
    }
    
    Ok(())
}

#[test]
fn test_alkane_protocol_with_initial_balance() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

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
    
    // Print the alkane ID
    println!("Alkane ID: {}", alkane_id.0);
    println!("Registered alkanes: {:?}", protocol.get_alkanes().iter().map(|a| &a.id.0).collect::<Vec<_>>());
    
    // Set the initial balance directly using the set_balance_for_testing method
    protocol.set_balance_for_testing(&address1, &alkane_id, 10000000000);
    
    // Check balances after setting initial balance
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("After setting initial balance:");
    println!("Address1 balance: {}", address1_balance);
    println!("Address2 balance: {}", address2_balance);
    
    // Check balances again
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("After helper function:");
    println!("Address1 balance: {}", address1_balance);
    println!("Address2 balance: {}", address2_balance);
    
    assert_eq!(address1_balance, 10000000000);
    assert_eq!(address2_balance, 0);
    
    // Create a transfer from address1 to address2
    let transfer = AlkaneTransfer {
        alkane_id: alkane_id.clone(),
        from: address1.clone(),
        to: address2.clone(),
        amount: 5000000000, // 50 with 8 decimals
        memo: Some("Transfer".to_string()),
    };
    
    // Apply the transfer - this should succeed now
    protocol.apply_transfer(&transfer)?;
    
    // Check final balances
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("After transfer:");
    println!("Address1 balance: {}", address1_balance);
    println!("Address2 balance: {}", address2_balance);
    
    assert_eq!(address1_balance, 5000000000);
    assert_eq!(address2_balance, 5000000000);
    
    Ok(())
}