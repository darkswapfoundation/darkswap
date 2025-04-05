//! Core library for DarkSwap.
//!
//! This library provides the core functionality for the DarkSwap application,
//! including wallet management, transaction creation, and other Bitcoin-related
//! functionality.

use anyhow::Result;
use bitcoin::{Address, Network, Transaction};
use bdk::{
    blockchain::{Blockchain, ElectrumBlockchain},
    database::MemoryDatabase,
    electrum_client::Client,
    wallet::{AddressIndex, AddressInfo},
    KeychainKind, SyncOptions, Wallet,
};
use bip39::{Language, Mnemonic, Seed};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use thiserror::Error;

/// Error type for the DarkSwap library.
#[derive(Debug, Error)]
pub enum DarkSwapError {
    /// Error when creating a wallet.
    #[error("Failed to create wallet: {0}")]
    WalletCreationError(String),

    /// Error when opening a wallet.
    #[error("Failed to open wallet: {0}")]
    WalletOpenError(String),

    /// Error when closing a wallet.
    #[error("Failed to close wallet: {0}")]
    WalletCloseError(String),

    /// Error when getting the balance of a wallet.
    #[error("Failed to get balance: {0}")]
    BalanceError(String),

    /// Error when creating an address.
    #[error("Failed to create address: {0}")]
    AddressError(String),

    /// Error when creating a transaction.
    #[error("Failed to create transaction: {0}")]
    TransactionError(String),

    /// Error when signing a transaction.
    #[error("Failed to sign transaction: {0}")]
    SigningError(String),

    /// Error when broadcasting a transaction.
    #[error("Failed to broadcast transaction: {0}")]
    BroadcastError(String),

    /// Error when serializing or deserializing data.
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Other error.
    #[error("Other error: {0}")]
    Other(String),
}

/// Wallet manager for DarkSwap.
pub struct WalletManager {
    /// The wallets managed by this manager.
    wallets: HashMap<String, DarkSwapWallet>,
    /// The network to use.
    network: Network,
    /// The electrum server to use.
    electrum_server: String,
}

impl WalletManager {
    /// Create a new wallet manager.
    pub fn new(network: Network, electrum_server: String) -> Self {
        Self {
            wallets: HashMap::new(),
            network,
            electrum_server,
        }
    }

    /// Create a new wallet.
    pub fn create_wallet(&mut self, name: &str, passphrase: &str) -> Result<(), DarkSwapError> {
        if self.wallets.contains_key(name) {
            return Err(DarkSwapError::WalletCreationError(format!(
                "Wallet {} already exists",
                name
            )));
        }

        // Generate a new mnemonic
        let mnemonic = Mnemonic::generate(12).map_err(|e| {
            DarkSwapError::WalletCreationError(format!("Failed to generate mnemonic: {}", e))
        })?;

        // Create a new wallet
        let wallet = DarkSwapWallet::new(&mnemonic.phrase(), passphrase, self.network, &self.electrum_server)
            .map_err(|e| DarkSwapError::WalletCreationError(e.to_string()))?;

        // Add the wallet to the manager
        self.wallets.insert(name.to_string(), wallet);

        Ok(())
    }

    /// Open an existing wallet.
    pub fn open_wallet(&mut self, name: &str, passphrase: &str) -> Result<(), DarkSwapError> {
        // TODO: Implement wallet opening from storage
        Err(DarkSwapError::WalletOpenError(
            "Not implemented".to_string(),
        ))
    }

    /// Close a wallet.
    pub fn close_wallet(&mut self, name: &str) -> Result<(), DarkSwapError> {
        if !self.wallets.contains_key(name) {
            return Err(DarkSwapError::WalletCloseError(format!(
                "Wallet {} does not exist",
                name
            )));
        }

        // Remove the wallet from the manager
        self.wallets.remove(name);

        Ok(())
    }

    /// Get the balance of a wallet.
    pub fn get_balance(&self, name: &str) -> Result<(u64, u64), DarkSwapError> {
        let wallet = self.get_wallet(name)?;
        wallet.get_balance()
    }

    /// Create a new address.
    pub fn create_address(&self, name: &str) -> Result<String, DarkSwapError> {
        let wallet = self.get_wallet(name)?;
        wallet.create_address()
    }

    /// Create a transaction.
    pub fn create_transaction(
        &self,
        name: &str,
        recipient: &str,
        amount: u64,
        fee_rate: u64,
    ) -> Result<Vec<u8>, DarkSwapError> {
        let wallet = self.get_wallet(name)?;
        wallet.create_transaction(recipient, amount, fee_rate)
    }

    /// Sign a transaction.
    pub fn sign_transaction(&self, name: &str, transaction: &[u8]) -> Result<Vec<u8>, DarkSwapError> {
        let wallet = self.get_wallet(name)?;
        wallet.sign_transaction(transaction)
    }

    /// Broadcast a transaction.
    pub fn broadcast_transaction(&self, name: &str, transaction: &[u8]) -> Result<String, DarkSwapError> {
        let wallet = self.get_wallet(name)?;
        wallet.broadcast_transaction(transaction)
    }

    /// Get a wallet by name.
    fn get_wallet(&self, name: &str) -> Result<&DarkSwapWallet, DarkSwapError> {
        self.wallets.get(name).ok_or_else(|| {
            DarkSwapError::WalletOpenError(format!("Wallet {} does not exist", name))
        })
    }
}

/// A DarkSwap wallet.
pub struct DarkSwapWallet {
    /// The BDK wallet.
    wallet: Wallet<ElectrumBlockchain, MemoryDatabase>,
}

impl DarkSwapWallet {
    /// Create a new DarkSwap wallet.
    pub fn new(
        mnemonic: &str,
        passphrase: &str,
        network: Network,
        electrum_server: &str,
    ) -> Result<Self, anyhow::Error> {
        // Parse the mnemonic
        let mnemonic = Mnemonic::parse(mnemonic)?;

        // Generate the seed
        let seed = Seed::new(&mnemonic, passphrase);

        // Create the BDK wallet
        let client = Client::new(electrum_server)?;
        let blockchain = ElectrumBlockchain::from(client);
        let wallet = Wallet::new(
            bdk::template::Bip84(seed.as_bytes(), KeychainKind::External),
            Some(bdk::template::Bip84(seed.as_bytes(), KeychainKind::Internal)),
            network,
            MemoryDatabase::default(),
        )?;

        // Sync the wallet
        wallet.sync(&blockchain, SyncOptions::default())?;

        Ok(Self { wallet })
    }

    /// Get the balance of the wallet.
    pub fn get_balance(&self) -> Result<(u64, u64), DarkSwapError> {
        let balance = self.wallet.get_balance().map_err(|e| {
            DarkSwapError::BalanceError(format!("Failed to get balance: {}", e))
        })?;

        Ok((balance.confirmed, balance.untrusted_pending))
    }

    /// Create a new address.
    pub fn create_address(&self) -> Result<String, DarkSwapError> {
        let address_info = self
            .wallet
            .get_address(AddressIndex::New)
            .map_err(|e| DarkSwapError::AddressError(format!("Failed to create address: {}", e)))?;

        Ok(address_info.address.to_string())
    }

    /// Create a transaction.
    pub fn create_transaction(
        &self,
        recipient: &str,
        amount: u64,
        fee_rate: u64,
    ) -> Result<Vec<u8>, DarkSwapError> {
        // Parse the recipient address
        let address = Address::from_str(recipient).map_err(|e| {
            DarkSwapError::TransactionError(format!("Invalid recipient address: {}", e))
        })?;

        // Create a transaction builder
        let mut builder = self.wallet.build_tx();

        // Add the recipient
        builder.add_recipient(address.script_pubkey(), amount);

        // Set the fee rate
        builder.fee_rate(bdk::FeeRate::from_sat_per_vb(fee_rate));

        // Build the transaction
        let (psbt, _) = builder.finish().map_err(|e| {
            DarkSwapError::TransactionError(format!("Failed to build transaction: {}", e))
        })?;

        // Serialize the PSBT
        let psbt_bytes = psbt.serialize();

        Ok(psbt_bytes)
    }

    /// Sign a transaction.
    pub fn sign_transaction(&self, transaction: &[u8]) -> Result<Vec<u8>, DarkSwapError> {
        // Deserialize the PSBT
        let mut psbt = bitcoin::psbt::PartiallySignedTransaction::deserialize(transaction)
            .map_err(|e| {
                DarkSwapError::SigningError(format!("Failed to deserialize transaction: {}", e))
            })?;

        // Sign the transaction
        let finalized = self.wallet.sign(&mut psbt, None).map_err(|e| {
            DarkSwapError::SigningError(format!("Failed to sign transaction: {}", e))
        })?;

        if !finalized {
            warn!("Transaction not finalized after signing");
        }

        // Serialize the signed PSBT
        let signed_psbt_bytes = psbt.serialize();

        Ok(signed_psbt_bytes)
    }

    /// Broadcast a transaction.
    pub fn broadcast_transaction(&self, transaction: &[u8]) -> Result<String, DarkSwapError> {
        // Deserialize the PSBT
        let psbt = bitcoin::psbt::PartiallySignedTransaction::deserialize(transaction)
            .map_err(|e| {
                DarkSwapError::BroadcastError(format!("Failed to deserialize transaction: {}", e))
            })?;

        // Extract the transaction
        let tx = psbt.extract_tx().map_err(|e| {
            DarkSwapError::BroadcastError(format!("Failed to extract transaction: {}", e))
        })?;

        // Broadcast the transaction
        let blockchain = self.wallet.client().clone();
        let txid = blockchain
            .broadcast(&tx)
            .map_err(|e| DarkSwapError::BroadcastError(format!("Failed to broadcast transaction: {}", e)))?;

        Ok(txid.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wallet_creation() {
        let mut manager = WalletManager::new(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002".to_string(),
        );

        let result = manager.create_wallet("test_wallet", "password");
        assert!(result.is_ok());
    }
}