use bitcoin::{
    address::NetworkUnchecked, psbt::Psbt, Address, Network, OutPoint, ScriptBuf, Transaction,
    TxOut, Txid, PubkeyHash,
};
use bitcoin::hashes::hash160;
use bitcoin::hashes::Hash;
use darkswap_sdk::alkane_trade::ThreadSafeAlkaneTradeExecutor;
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol};
use darkswap_sdk::bitcoin_utils::BitcoinWallet;
use darkswap_sdk::error::Result;
use darkswap_sdk::orderbook::{Order, OrderSide};
use darkswap_sdk::trade::Trade;
use darkswap_sdk::types::{AlkaneId, Asset, PeerId};
use rust_decimal::Decimal;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

struct MockWallet {
    network: Network,
    address: Address<NetworkUnchecked>,
    utxos: Vec<(OutPoint, TxOut)>,
}

impl MockWallet {
    fn new(network: Network, address: Address<NetworkUnchecked>) -> Self {
        Self {
            network,
            address,
            utxos: Vec::new(),
        }
    }

    fn add_utxo(&mut self, value: u64) {
        let outpoint = OutPoint::new(
            Txid::from_str("0000000000000000000000000000000000000000000000000000000000000000").unwrap(),
            self.utxos.len() as u32,
        );
        let txout = TxOut {
            value,
            script_pubkey: self.address.payload.script_pubkey(),
        };
        self.utxos.push((outpoint, txout));
    }
}
impl BitcoinWallet for MockWallet {
    fn network(&self) -> Network {
        self.network
    }

    fn get_address(&self, _index: u32) -> Result<Address> {
        // Convert from NetworkUnchecked to NetworkChecked
        let address = Address::new(self.network, self.address.payload.clone());
        Ok(address)
    }

    fn get_addresses(&self) -> Result<Vec<Address>> {
        let address = self.get_address(0)?;
        Ok(vec![address])
    }

    fn get_utxos(&self) -> Result<Vec<(OutPoint, TxOut)>> {
        Ok(self.utxos.clone())
    }

    fn sign_psbt(&self, _psbt: &mut Psbt) -> Result<()> {
        Ok(())
    }

    fn broadcast_transaction(&self, _tx: &Transaction) -> Result<Txid> {
        // Return a dummy txid
        Ok(Txid::from_str("0000000000000000000000000000000000000000000000000000000000000000").unwrap())
    }
}

#[test]
fn test_alkane_trade() -> Result<()> {
    // Create a network
    let network = Network::Regtest;

    // Create an Alkane protocol
    let alkane_protocol = Arc::new(Mutex::new(AlkaneProtocol::new(network)));

    // Create an Alkane
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

    // Register the Alkane
    {
        let mut protocol = alkane_protocol.lock().unwrap();
        protocol.register_alkane(alkane.clone())?;
        
        // Print all registered alkanes
        println!("Registered alkanes: {}", protocol.get_alkanes().len());
        for alkane in protocol.get_alkanes() {
            println!("Alkane: id={}, symbol={}", alkane.id.0, alkane.symbol);
        }
    }

    // Verify the alkane was registered
    {
        let protocol = alkane_protocol.lock().unwrap();
        let alkanes = protocol.get_alkanes();
        assert_eq!(alkanes.len(), 1);
        assert_eq!(alkanes[0].id.0, alkane_id.0);
    }

    Ok(())
}