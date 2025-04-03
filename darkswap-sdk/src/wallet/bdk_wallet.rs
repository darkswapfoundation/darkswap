//! Bitcoin Development Kit (BDK) wallet implementation
//!
//! This module provides a wallet implementation using the Bitcoin Development Kit (BDK).

use crate::{
    error::Error,
    wallet::{Utxo, Wallet},
    Result,
};
use bdk::{
    blockchain::{
        electrum::{ElectrumBlockchain, ElectrumBlockchainConfig},
        Blockchain,
    },
    database::MemoryDatabase,
    descriptor::{Descriptor, DescriptorPublicKey},
    keys::{
        bip39::{Mnemonic, WordCount},
        DerivableKey, ExtendedKey, GeneratableKey, GeneratedKey,
    },
    miniscript::policy::Concrete,
    wallet::{
        AddressIndex, AddressInfo, Balance, ChangeSet, FeeRate, GetAddress, ScriptType,
        SyncOptions, TxBuilder,
    },
    SignOptions, SyncOptions as BdkSyncOptions,
};
use bitcoin::{
    Address, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid,
};
use std::{
    collections::HashMap,
    str::FromStr,
    sync::{Arc, Mutex},
};

/// BDK wallet
pub struct BdkWallet {
    /// Inner wallet
    inner: Arc<Mutex<bdk::Wallet<ElectrumBlockchain, MemoryDatabase>>>,
    /// Network
    network: Network,
}

impl BdkWallet {
    /// Create a new BDK wallet from a mnemonic
    pub fn from_mnemonic(
        mnemonic: &str,
        password: Option<&str>,
        network: Network,
        electrum_url: &str,
    ) -> Result<Self> {
        // Parse the mnemonic
        let mnemonic = Mnemonic::from_str(mnemonic)?;
        
        // Generate the seed
        let seed = mnemonic.to_seed(password.unwrap_or(""));
        
        // Generate the master key
        let master_key = ExtendedKey::from_seed(&seed)?;
        
        // Generate the descriptor public key
        let xprv = master_key.into_xprv(network)?;
        let descriptor_key = DescriptorPublicKey::from_str(&format!("{}/*", xprv))?;
        
        // Create the descriptor
        let descriptor = Descriptor::new_wpkh(descriptor_key.clone())?;
        let change_descriptor = Descriptor::new_wpkh(descriptor_key)?;
        
        // Create the blockchain
        let config = ElectrumBlockchainConfig {
            url: electrum_url.to_string(),
            socks5: None,
            retry: 3,
            timeout: Some(5),
            stop_gap: 10,
            validate_domain: true,
        };
        let blockchain = ElectrumBlockchain::from_config(&config)?;
        
        // Create the wallet
        let wallet = bdk::Wallet::new(
            &descriptor.to_string(),
            Some(&change_descriptor.to_string()),
            network,
            MemoryDatabase::default(),
        )?;
        
        // Create the BDK wallet
        let bdk_wallet = Self {
            inner: Arc::new(Mutex::new(wallet)),
            network,
        };
        
        // Sync the wallet
        bdk_wallet.sync()?;
        
        Ok(bdk_wallet)
    }
    
    /// Create a new BDK wallet from a descriptor
    pub fn from_descriptor(
        descriptor: &str,
        change_descriptor: Option<&str>,
        network: Network,
        electrum_url: &str,
    ) -> Result<Self> {
        // Create the blockchain
        let config = ElectrumBlockchainConfig {
            url: electrum_url.to_string(),
            socks5: None,
            retry: 3,
            timeout: Some(5),
            stop_gap: 10,
            validate_domain: true,
        };
        let blockchain = ElectrumBlockchain::from_config(&config)?;
        
        // Create the wallet
        let wallet = bdk::Wallet::new(
            descriptor,
            change_descriptor,
            network,
            MemoryDatabase::default(),
        )?;
        
        // Create the BDK wallet
        let bdk_wallet = Self {
            inner: Arc::new(Mutex::new(wallet)),
            network,
        };
        
        // Sync the wallet
        bdk_wallet.sync()?;
        
        Ok(bdk_wallet)
    }
    
    /// Generate a new BDK wallet
    pub fn generate(
        network: Network,
        electrum_url: &str,
    ) -> Result<(Self, String)> {
        // Generate a new mnemonic
        let mnemonic = Mnemonic::generate(WordCount::Words12)?;
        let mnemonic_str = mnemonic.to_string();
        
        // Create the wallet
        let wallet = Self::from_mnemonic(&mnemonic_str, None, network, electrum_url)?;
        
        Ok((wallet, mnemonic_str))
    }
    
    /// Sync the wallet
    pub fn sync(&self) -> Result<()> {
        let mut wallet = self.inner.lock().unwrap();
        wallet.sync(BdkSyncOptions::default())?;
        Ok(())
    }
}

impl Wallet for BdkWallet {
    fn network(&self) -> Network {
        self.network
    }
    
    fn addresses(&self) -> Result<Vec<Address>> {
        let wallet = self.inner.lock().unwrap();
        
        // Get the addresses
        let mut addresses = Vec::new();
        
        // Get the external addresses
        for i in 0..10 {
            let address_info = wallet.get_address(AddressIndex::Peek(i))?;
            addresses.push(address_info.address);
        }
        
        Ok(addresses)
    }
    
    fn balance(&self) -> Result<u64> {
        let wallet = self.inner.lock().unwrap();
        
        // Get the balance
        let balance = wallet.get_balance()?;
        
        Ok(balance.confirmed)
    }
    
    fn utxos(&self) -> Result<Vec<Utxo>> {
        let wallet = self.inner.lock().unwrap();
        
        // Get the UTXOs
        let bdk_utxos = wallet.list_unspent()?;
        
        // Convert to our UTXO type
        let mut utxos = Vec::new();
        for bdk_utxo in bdk_utxos {
            utxos.push(Utxo {
                txid: bdk_utxo.outpoint.txid,
                vout: bdk_utxo.outpoint.vout,
                amount: bdk_utxo.txout.value,
                script_pubkey: bdk_utxo.txout.script_pubkey.clone(),
                confirmed: true, // BDK only returns confirmed UTXOs by default
            });
        }
        
        Ok(utxos)
    }
    
    fn create_transaction(&self, outputs: Vec<TxOut>, fee_rate: f64) -> Result<Transaction> {
        let mut wallet = self.inner.lock().unwrap();
        
        // Create a transaction builder
        let mut builder = wallet.build_tx();
        
        // Add the outputs
        for output in outputs {
            builder.add_recipient(output.script_pubkey, output.value);
        }
        
        // Set the fee rate
        builder.fee_rate(FeeRate::from_sat_per_vb(fee_rate as f32));
        
        // Enable RBF
        builder.enable_rbf();
        
        // Build the transaction
        let (psbt, _) = builder.finish()?;
        
        // Extract the transaction
        let tx = psbt.extract_tx();
        
        Ok(tx)
    }
    
    fn sign_transaction(&self, tx: Transaction) -> Result<Transaction> {
        let mut wallet = self.inner.lock().unwrap();
        
        // Create a PSBT from the transaction
        let mut psbt = bdk::bitcoin::psbt::PartiallySignedTransaction::from_unsigned_tx(tx)?;
        
        // Sign the PSBT
        wallet.sign(&mut psbt, SignOptions::default())?;
        
        // Extract the transaction
        let tx = psbt.extract_tx();
        
        Ok(tx)
    }
    
    fn broadcast_transaction(&self, tx: Transaction) -> Result<Txid> {
        let wallet = self.inner.lock().unwrap();
        
        // Broadcast the transaction
        let txid = wallet.broadcast(tx)?;
        
        Ok(txid)
    }
    
    fn get_transaction(&self, txid: Txid) -> Result<Transaction> {
        let wallet = self.inner.lock().unwrap();
        
        // Get the transaction
        let tx = wallet.get_tx(&txid)?;
        
        Ok(tx)
    }
    
    fn rune_balance(&self) -> Result<HashMap<String, u64>> {
        // This is a simplified implementation
        // In a real implementation, we would need to scan the blockchain for rune transactions
        
        // For now, just return an empty map
        Ok(HashMap::new())
    }
    
    fn alkane_balance(&self) -> Result<HashMap<String, u64>> {
        // This is a simplified implementation
        // In a real implementation, we would need to scan the blockchain for alkane transactions
        
        // For now, just return an empty map
        Ok(HashMap::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_generate_wallet() {
        // Generate a new wallet
        let (wallet, mnemonic) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Check that the mnemonic is valid
        assert_eq!(mnemonic.split_whitespace().count(), 12);
        
        // Check that the wallet has the correct network
        assert_eq!(wallet.network(), Network::Testnet);
    }
    
    #[test]
    fn test_from_mnemonic() {
        // Create a wallet from a mnemonic
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let wallet = BdkWallet::from_mnemonic(
            mnemonic,
            None,
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Check that the wallet has the correct network
        assert_eq!(wallet.network(), Network::Testnet);
        
        // Check that the wallet has the correct addresses
        let addresses = wallet.addresses().unwrap();
        assert!(!addresses.is_empty());
    }
    
    #[test]
    fn test_from_descriptor() {
        // Create a wallet from a descriptor
        let descriptor = "wpkh(tprv8ZgxMBicQKsPd7Uf69XL1XwhmjHopUGep8GuEiJDZmbQz6o58LninorQAfcKZWARbtRtfnLcJ5MQ2AtHcQJCCRUcMRvmDUjyEmNUWwx8UbK/84'/0'/0'/0/*)";
        let wallet = BdkWallet::from_descriptor(
            descriptor,
            None,
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Check that the wallet has the correct network
        assert_eq!(wallet.network(), Network::Testnet);
        
        // Check that the wallet has the correct addresses
        let addresses = wallet.addresses().unwrap();
        assert!(!addresses.is_empty());
    }
}