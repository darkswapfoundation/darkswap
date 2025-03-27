use bitcoin::{
    address::NetworkUnchecked, Address, Network, PubkeyHash,
    hashes::{Hash, hash160},
};
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol, AlkaneTransfer};
use darkswap_sdk::error::Result;
use darkswap_sdk::types::AlkaneId;
use std::collections::HashMap;

// A simple mock implementation of the AlkaneProtocol for testing
struct MockAlkaneProtocol {
    network: Network,
    alkanes: HashMap<String, Alkane>,
    balances: HashMap<String, HashMap<String, u128>>,
}

impl MockAlkaneProtocol {
    fn new(network: Network) -> Self {
        Self {
            network,
            alkanes: HashMap::new(),
            balances: HashMap::new(),
        }
    }

    fn register_alkane(&mut self, alkane: Alkane) -> Result<()> {
        self.alkanes.insert(alkane.id.0.clone(), alkane);
        Ok(())
    }

    fn get_balance(&self, address: &Address<NetworkUnchecked>, alkane_id: &AlkaneId) -> u128 {
        let address_str = format!("{:?}", address);
        
        if let Some(address_balances) = self.balances.get(&address_str) {
            if let Some(balance) = address_balances.get(&alkane_id.0) {
                return *balance;
            }
        }
        
        0
    }

    fn set_balance(&mut self, address: &Address<NetworkUnchecked>, alkane_id: &AlkaneId, amount: u128) {
        let address_str = format!("{:?}", address);
        
        self.balances
            .entry(address_str)
            .or_insert_with(HashMap::new)
            .insert(alkane_id.0.clone(), amount);
    }

    fn apply_transfer(&mut self, transfer: &AlkaneTransfer) -> Result<()> {
        let from_str = format!("{:?}", transfer.from);
        let to_str = format!("{:?}", transfer.to);
        let alkane_id_str = transfer.alkane_id.0.clone();
        
        // Check if the alkane exists
        if !self.alkanes.contains_key(&alkane_id_str) {
            return Err(darkswap_sdk::error::Error::AlkaneNotFound(alkane_id_str.clone()));
        }
        
        // Check if the sender has enough balance
        let sender_balance = self.get_balance(&transfer.from, &transfer.alkane_id);
        if sender_balance < transfer.amount {
            return Err(darkswap_sdk::error::Error::InsufficientBalance);
        }
        
        // Update the sender's balance
        self.balances
            .entry(from_str)
            .or_insert_with(HashMap::new)
            .entry(alkane_id_str.clone())
            .and_modify(|balance| *balance -= transfer.amount)
            .or_insert(sender_balance - transfer.amount);
        
        // Update the recipient's balance
        self.balances
            .entry(to_str)
            .or_insert_with(HashMap::new)
            .entry(alkane_id_str)
            .and_modify(|balance| *balance += transfer.amount)
            .or_insert(transfer.amount);
        
        Ok(())
    }
}

#[test]
fn test_mock_alkane_transfer() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

    // Create addresses
    let pubkey_hash1 = PubkeyHash::from_raw_hash(hash160::Hash::hash(&[1; 20]));
    let pubkey_hash2 = PubkeyHash::from_raw_hash(hash160::Hash::hash(&[2; 20]));
    
    let address1 = Address::<NetworkUnchecked>::new(network, bitcoin::address::Payload::PubkeyHash(pubkey_hash1));
    let address2 = Address::<NetworkUnchecked>::new(network, bitcoin::address::Payload::PubkeyHash(pubkey_hash2));

    // Create a mock AlkaneProtocol
    let mut protocol = MockAlkaneProtocol::new(network);

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
    
    // Set initial balance for address1
    protocol.set_balance(&address1, &alkane_id, 10000000000);
    
    // Check balances after setting initial balance
    let address1_balance = protocol.get_balance(&address1, &alkane_id);
    let address2_balance = protocol.get_balance(&address2, &alkane_id);
    
    println!("After setting balance:");
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