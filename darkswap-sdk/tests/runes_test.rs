use darkswap_sdk::runes::{Rune, RuneBalance, RuneTransfer, RuneProtocol, ThreadSafeRuneProtocol};
use darkswap_sdk::runestone::{Runestone, Edict, Etching, Terms};
use darkswap_sdk::error::{Error, Result};
use bitcoin::{
    address::{NetworkUnchecked, NetworkChecked},
    Network, OutPoint, ScriptBuf, Transaction, TxIn, TxOut, Witness,
    hashes::Hash,
    psbt::Psbt,
};
use darkswap_sdk::bitcoin_utils::{BitcoinWallet, SimpleWallet, generate_test_address_unchecked};
use std::str::FromStr;

// Mock wallet for testing
struct MockWallet {
    network: Network,
    address: bitcoin::Address,
    utxos: Vec<(OutPoint, TxOut)>,
}

impl MockWallet {
    fn new(network: Network) -> Self {
        let address = bitcoin::Address::from_str("bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080")
            .unwrap()
            .require_network(network)
            .unwrap();
        
        let outpoint = OutPoint {
            txid: bitcoin::Txid::from_str("0000000000000000000000000000000000000000000000000000000000000001").unwrap(),
            vout: 0,
        };
        
        let txout = TxOut {
            value: 100_000_000, // 1 BTC
            script_pubkey: address.payload.script_pubkey(),
        };
        
        Self {
            network,
            address,
            utxos: vec![(outpoint, txout)],
        }
    }
}

impl BitcoinWallet for MockWallet {
    fn network(&self) -> Network {
        self.network
    }
    
    fn get_address(&self, _index: u32) -> Result<bitcoin::Address> {
        Ok(self.address.clone())
    }
    
    fn get_addresses(&self) -> Result<Vec<bitcoin::Address>> {
        Ok(vec![self.address.clone()])
    }
    
    fn get_utxos(&self) -> Result<Vec<(OutPoint, TxOut)>> {
        Ok(self.utxos.clone())
    }
    
    fn sign_psbt(&self, _psbt: &mut Psbt) -> Result<()> {
        // Mock implementation
        Ok(())
    }
    
    fn broadcast_transaction(&self, tx: &Transaction) -> Result<bitcoin::Txid> {
        // Mock implementation
        Ok(tx.txid())
    }
}

#[test]
fn test_rune_creation() -> Result<()> {
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    assert_eq!(rune.id, 123456789);
    assert_eq!(rune.symbol, Some("TEST".to_string()));
    assert_eq!(rune.decimals, 8);
    assert_eq!(rune.supply, 21000000);
    
    Ok(())
}

#[test]
fn test_rune_format_amount() -> Result<()> {
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    assert_eq!(rune.format_amount(100000000), "1");
    assert_eq!(rune.format_amount(123456789), "1.23456789");
    assert_eq!(rune.format_amount(100000000000), "1000");
    assert_eq!(rune.format_amount(123), "0.00000123");
    
    Ok(())
}

#[test]
fn test_rune_parse_amount() -> Result<()> {
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    assert_eq!(rune.parse_amount("1")?, 100000000);
    assert_eq!(rune.parse_amount("1.23456789")?, 123456789);
    assert_eq!(rune.parse_amount("1000")?, 100000000000);
    assert_eq!(rune.parse_amount("0.00000123")?, 123);
    
    Ok(())
}

#[test]
fn test_rune_protocol() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    assert_eq!(protocol.get_runes().len(), 0);
    
    Ok(())
}

#[test]
fn test_rune_protocol_register_rune() -> Result<()> {
    let mut protocol = RuneProtocol::new(Network::Regtest);
    
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    protocol.register_rune(rune);
    
    assert_eq!(protocol.get_runes().len(), 1);
    assert_eq!(protocol.get_rune(123456789).unwrap().id, 123456789);
    
    Ok(())
}

#[test]
fn test_thread_safe_rune_protocol() -> Result<()> {
    let protocol = ThreadSafeRuneProtocol::new(Network::Regtest);
    
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    protocol.register_rune(rune)?;
    
    assert_eq!(protocol.get_runes()?.len(), 1);
    assert_eq!(protocol.get_rune(123456789)?.unwrap().id, 123456789);
    
    Ok(())
}

#[test]
fn test_runestone_creation() -> Result<()> {
    let runestone = Runestone {
        edicts: vec![
            Edict {
                id: 123456789,
                amount: 1000000000,
                output: 1,
            },
        ],
        etching: None,
        default_output: None,
        burn: false,
    };
    
    let script = runestone.to_script();
    assert!(script.is_op_return());
    
    Ok(())
}

#[test]
fn test_runestone_parsing() -> Result<()> {
    // Create a runestone
    let original_runestone = Runestone {
        edicts: vec![
            Edict {
                id: 123456789,
                amount: 1000000000,
                output: 1,
            },
        ],
        etching: None,
        default_output: None,
        burn: false,
    };
    
    // Create a transaction with the runestone
    let script = original_runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Parse the runestone from the transaction
    let parsed_runestone = Runestone::parse(&tx).unwrap();
    
    // Check that the parsed runestone matches the original
    assert_eq!(parsed_runestone.edicts.len(), 1);
    assert_eq!(parsed_runestone.edicts[0].id, 123456789);
    assert_eq!(parsed_runestone.edicts[0].amount, 1000000000);
    assert_eq!(parsed_runestone.edicts[0].output, 1);
    assert_eq!(parsed_runestone.etching, None);
    assert_eq!(parsed_runestone.default_output, None);
    assert_eq!(parsed_runestone.burn, false);
    
    Ok(())
}

#[test]
fn test_rune_transfer() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    let wallet = MockWallet::new(Network::Regtest);
    
    // Create a rune
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    // Create a transfer
    let from_address = generate_test_address_unchecked(Network::Regtest, 0)?;
    let to_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    
    let transfer = RuneTransfer {
        rune,
        amount: 1000000000,
        from: from_address,
        to: to_address,
    };
    
    // Create a transaction for the transfer
    let txout = TxOut {
        value: 546,
        script_pubkey: transfer.to.payload.script_pubkey(),
    };
    
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let inputs = vec![(outpoint, txout)];
    
    Ok(())
}

#[test]
fn test_rune_etching() -> Result<()> {
    let protocol = RuneProtocol::new(Network::Regtest);
    let wallet = MockWallet::new(Network::Regtest);
    
    // Create an etching
    let etching = Etching {
        rune: 123456789,
        symbol: Some("TEST".to_string()),
        decimals: Some(8),
        spacers: 0,
        amount: 21000000,
        terms: None,
    };
    
    // Create a runestone with the etching
    let runestone = Runestone {
        edicts: vec![],
        etching: Some(etching),
        default_output: None,
        burn: false,
    };
    
    // Create a transaction with the runestone
    let script = runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Process the transaction
    let mut protocol = RuneProtocol::new(Network::Regtest);
    protocol.process_transaction(&tx, 0)?;
    
    // Check that the rune was created
    assert_eq!(protocol.get_runes().len(), 1);
    assert_eq!(protocol.get_rune(123456789).unwrap().id, 123456789);
    
    Ok(())
}

#[test]
fn test_rune_balance() -> Result<()> {
    let mut protocol = RuneProtocol::new(Network::Regtest);
    
    // Create a rune
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    protocol.register_rune(rune.clone());
    
    // Create a runestone with an edict
    let edict = Edict {
        id: 123456789,
        amount: 1000000000,
        output: 0,
    };
    
    let runestone = Runestone {
        edicts: vec![edict],
        etching: None,
        default_output: None,
        burn: false,
    };
    
    // Create a transaction with the runestone
    let script = runestone.to_script();
    
    let address = generate_test_address_unchecked(Network::Regtest, 0)?;
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 546,
                script_pubkey: address.payload.script_pubkey(),
            },
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Process the transaction
    protocol.process_transaction(&tx, 0)?;
    
    // Check the balance
    let balance = protocol.get_balance(&address, 123456789);
    assert_eq!(balance, 1000000000);
    
    // Check all balances
    let balances = protocol.get_balances(&address);
    assert_eq!(balances.len(), 1);
    assert_eq!(balances[0].rune.id, 123456789);
    assert_eq!(balances[0].amount, 1000000000);
    
    Ok(())
}

#[test]
fn test_validate_transfer() -> Result<()> {
    let mut protocol = RuneProtocol::new(Network::Regtest);
    
    // Create a rune
    let outpoint = OutPoint::new(bitcoin::Txid::all_zeros(), 0);
    let rune = Rune::new(
        123456789,
        Some("TEST".to_string()),
        8,
        21000000,
        0,
        outpoint,
        0,
    );
    
    protocol.register_rune(rune.clone());
    
    // Create addresses
    let from_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let to_address = generate_test_address_unchecked(Network::Regtest, 2)?;
    
    // Create a runestone with an edict
    let edict = Edict {
        id: 123456789,
        amount: 1000000000,
        output: 0,
    };
    
    let runestone = Runestone {
        edicts: vec![edict],
        etching: None,
        default_output: None,
        burn: false,
    };
    
    // Create a transaction with the runestone
    let script = runestone.to_script();
    
    let tx = Transaction {
        version: 2,
        lock_time: bitcoin::absolute::LockTime::ZERO,
        input: vec![],
        output: vec![
            TxOut {
                value: 546,
                script_pubkey: to_address.payload.script_pubkey(),
            },
            TxOut {
                value: 0,
                script_pubkey: script,
            },
        ],
    };
    
    // Validate the transfer
    let result = protocol.validate_transfer(&tx, 123456789, 1000000000, &from_address, &to_address);
    
    // The validation should fail because the from_address doesn't have enough balance
    assert!(result.is_err());
    
    Ok(())
}