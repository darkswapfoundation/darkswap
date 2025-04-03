//! Bitcoin Development Kit (BDK) wallet implementation
//!
//! This module provides a wallet implementation using the Bitcoin Development Kit (BDK).

#[cfg(feature = "bdk-wallet")]
use crate::{
    error::Error,
    wallet::{Utxo, Wallet},
    Result,
};

#[cfg(feature = "bdk-wallet")]
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

#[cfg(feature = "bdk-wallet")]
use bitcoin::{
    Address, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid,
};

#[cfg(feature = "bdk-wallet")]
use std::{
    collections::HashMap,
    str::FromStr,
    sync::{Arc, Mutex},
};

/// BDK wallet
#[cfg(feature = "bdk-wallet")]
pub struct BdkWallet {
    /// Inner wallet
    inner: Arc<Mutex<bdk::Wallet<ElectrumBlockchain, MemoryDatabase>>>,
    /// Network
    network: Network,
}

#[cfg(feature = "bdk-wallet")]
impl BdkWallet {
    /// Create a new BDK wallet from a mnemonic
    pub fn from_mnemonic(
        mnemonic: &str,
        password: Option<&str>,
        network: Network,
    ) -> Result<Self> {
        // Parse the mnemonic
        let mnemonic = Mnemonic::from_str(mnemonic).map_err(|e| Error::Wallet(e.to_string()))?;

        // Generate the extended key
        let xkey = mnemonic
            .into_extended_key()
            .map_err(|e| Error::Wallet(e.to_string()))?;

        // Get the extended public key
        let xpub = xkey.into_xpub(network);

        // Create the descriptor
        let descriptor = Descriptor::new_wpkh(xpub).map_err(|e| Error::Wallet(e.to_string()))?;

        // Create the wallet
        let wallet = bdk::Wallet::new(
            descriptor,
            None,
            network,
            MemoryDatabase::default(),
        )
        .map_err(|e| Error::Wallet(e.to_string()))?;

        // Create the blockchain client
        let config = ElectrumBlockchainConfig {
            url: "ssl://electrum.blockstream.info:60002".to_string(),
            socks5: None,
            retry: 3,
            timeout: Some(5),
            stop_gap: 10,
            validate_domain: true,
        };
        let blockchain = ElectrumBlockchain::from_config(&config)
            .map_err(|e| Error::Wallet(e.to_string()))?;

        // Sync the wallet
        wallet
            .sync(&blockchain, SyncOptions::default())
            .map_err(|e| Error::Wallet(e.to_string()))?;

        Ok(Self {
            inner: Arc::new(Mutex::new(wallet)),
            network,
        })
    }

    /// Get the wallet balance
    pub fn get_balance(&self) -> Result<u64> {
        let wallet = self.inner.lock().unwrap();
        let balance = wallet.get_balance().map_err(|e| Error::Wallet(e.to_string()))?;
        Ok(balance.confirmed)
    }

    /// Get the wallet address
    pub fn get_address(&self) -> Result<String> {
        let wallet = self.inner.lock().unwrap();
        let address = wallet
            .get_address(AddressIndex::New)
            .map_err(|e| Error::Wallet(e.to_string()))?;
        Ok(address.address.to_string())
    }

    /// Get the wallet UTXOs
    pub fn get_utxos(&self) -> Result<Vec<Utxo>> {
        let wallet = self.inner.lock().unwrap();
        let utxos = wallet.list_unspent().map_err(|e| Error::Wallet(e.to_string()))?;
        let mut result = Vec::new();
        for utxo in utxos {
            result.push(Utxo {
                txid: utxo.outpoint.txid.to_string(),
                vout: utxo.outpoint.vout,
                amount: utxo.txout.value,
                script_pubkey: hex::encode(utxo.txout.script_pubkey.as_bytes()),
            });
        }
        Ok(result)
    }
}

#[cfg(feature = "bdk-wallet")]
impl Wallet for BdkWallet {
    fn get_balance(&self) -> Result<u64> {
        self.get_balance()
    }

    fn get_address(&self) -> Result<String> {
        self.get_address()
    }

    fn get_utxos(&self) -> Result<Vec<Utxo>> {
        self.get_utxos()
    }
}

// Stub implementation for when the bdk-wallet feature is not enabled
#[cfg(not(feature = "bdk-wallet"))]
pub struct BdkWallet {}

#[cfg(not(feature = "bdk-wallet"))]
impl BdkWallet {
    pub fn from_mnemonic(
        _mnemonic: &str,
        _password: Option<&str>,
        _network: bitcoin::Network,
    ) -> crate::Result<Self> {
        Err(crate::error::Error::Wallet(
            "BDK wallet is not enabled. Enable the bdk-wallet feature to use this functionality."
                .to_string(),
        ))
    }
}