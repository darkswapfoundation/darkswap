use darkswap_sdk::alkane_trade::{AlkaneTradeExecutor, ThreadSafeAlkaneTradeExecutor};
use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol};
use darkswap_sdk::bitcoin_utils::{BitcoinWallet, generate_test_address_unchecked};
use darkswap_sdk::error::Result;
use darkswap_sdk::orderbook::{Order, OrderSide};
use darkswap_sdk::trade::Trade;
use darkswap_sdk::types::{AlkaneId, Asset, PeerId};
use bitcoin::{
    Network, Address,
    OutPoint, TxOut, Transaction, psbt::Psbt,
    hashes::Hash,
};
use rust_decimal::Decimal;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

struct MockWallet {
    network: Network,
    address: Address,
    utxos: Vec<(OutPoint, TxOut)>,
}

impl MockWallet {
    fn new(network: Network, address: Address) -> Self {
        Self {
            network,
            address,
            utxos: Vec::new(),
        }
    }

    fn add_utxo(&mut self, value: u64) {
        let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), self.utxos.len() as u32);
        let txout = TxOut {
            value,
            script_pubkey: self.address.script_pubkey(),
        };
        self.utxos.push((outpoint, txout));
    }
}

impl BitcoinWallet for MockWallet {
    fn get_address(&self) -> Result<Address> {
        Ok(self.address.clone())
    }

    fn get_utxos(&self) -> Result<Vec<(OutPoint, TxOut)>> {
        Ok(self.utxos.clone())
    }

    fn sign_psbt(&self, _psbt: &mut Psbt) -> Result<()> {
        Ok(())
    }
}

#[test]
fn test_alkane_trade_executor() -> Result<()> {
    // Create the Alkane protocol
    let alkane_protocol = Arc::new(Mutex::new(AlkaneProtocol::new(Network::Regtest)));
    
    // Create the Alkane trade executor
    let executor = ThreadSafeAlkaneTradeExecutor::new(Network::Regtest, alkane_protocol.clone());
    
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
    }
    
    // Create maker and taker addresses
    let maker_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let taker_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Create maker and taker wallets
    let mut maker_wallet = MockWallet::new(Network::Regtest, maker_address.clone());
    let mut taker_wallet = MockWallet::new(Network::Regtest, taker_address.clone());
    
    // Add UTXOs to the wallets
    maker_wallet.add_utxo(10000);
    taker_wallet.add_utxo(10000);
    
    // Create an order
    let maker_peer_id = PeerId("QmMaker".to_string());
    let taker_peer_id = PeerId("QmTaker".to_string());
    let base_asset = Asset::Alkane(alkane_id.clone());
    let quote_asset = Asset::Bitcoin;
    let amount = Decimal::from_str("100")?;
    let price = Decimal::from_str("0.0001")?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let order = Order::new(
        maker_peer_id.clone(),
        base_asset.clone(),
        quote_asset.clone(),
        OrderSide::Sell,
        amount,
        price,
        timestamp,
    );
    
    // Create a trade
    let trade = Trade::new(&order, taker_peer_id.clone(), amount);
    
    // Create change addresses
    let maker_change_address = generate_test_address_unchecked(Network::Regtest, 3)?;
    let taker_change_address = generate_test_address_unchecked(Network::Regtest, 4)?;
    
    // Create a PSBT for the trade
    let psbt = executor.create_psbt(
        &trade,
        &maker_wallet,
        &taker_wallet,
        &maker_change_address,
        &taker_change_address,
        1.0,
    )?;
    
    // Verify the PSBT
    let is_valid = executor.verify_psbt(&trade, &psbt)?;
    assert!(is_valid);
    
    Ok(())
}

#[test]
fn test_alkane_trade_execution() -> Result<()> {
    // Create the Alkane protocol
    let alkane_protocol = Arc::new(Mutex::new(AlkaneProtocol::new(Network::Regtest)));
    
    // Create the Alkane trade executor
    let executor = ThreadSafeAlkaneTradeExecutor::new(Network::Regtest, alkane_protocol.clone());
    
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
    }
    
    // Create maker and taker addresses
    let maker_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let taker_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Create maker and taker wallets
    let mut maker_wallet = MockWallet::new(Network::Regtest, maker_address.clone());
    let mut taker_wallet = MockWallet::new(Network::Regtest, taker_address.clone());
    
    // Add UTXOs to the wallets
    maker_wallet.add_utxo(10000);
    taker_wallet.add_utxo(10000);
    
    // Create an order
    let maker_peer_id = PeerId("QmMaker".to_string());
    let taker_peer_id = PeerId("QmTaker".to_string());
    let base_asset = Asset::Alkane(alkane_id.clone());
    let quote_asset = Asset::Bitcoin;
    let amount = Decimal::from_str("100")?;
    let price = Decimal::from_str("0.0001")?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let order = Order::new(
        maker_peer_id.clone(),
        base_asset.clone(),
        quote_asset.clone(),
        OrderSide::Sell,
        amount,
        price,
        timestamp,
    );
    
    // Create a trade
    let trade = Trade::new(&order, taker_peer_id.clone(), amount);
    
    // Create change addresses
    let maker_change_address = generate_test_address_unchecked(Network::Regtest, 3)?;
    let taker_change_address = generate_test_address_unchecked(Network::Regtest, 4)?;
    
    // Create a PSBT for the trade
    let psbt = executor.create_psbt(
        &trade,
        &maker_wallet,
        &taker_wallet,
        &maker_change_address,
        &taker_change_address,
        1.0,
    )?;
    
    // Execute the trade
    executor.execute_trade(&trade, &psbt, 100)?;
    
    // Verify the balances
    {
        let protocol = alkane_protocol.lock().unwrap();
        let maker_balance = protocol.get_balance(&maker_address, &alkane_id);
        let taker_balance = protocol.get_balance(&taker_address, &alkane_id);
        
        // The maker should have 0 balance (sold all)
        assert_eq!(maker_balance, 0);
        
        // The taker should have the amount of the trade
        assert_eq!(taker_balance, 10000000000); // 100 with 8 decimals
    }
    
    Ok(())
}