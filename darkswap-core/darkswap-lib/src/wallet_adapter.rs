//! Wallet adapter for the DarkSwap bridge.
//!
//! This module provides an adapter between the bridge and the wallet functionality.

use crate::{DarkSwapError, WalletManager};
use anyhow::Result;
use bitcoin::Network;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Message types for wallet operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WalletMessage {
    /// Create a new wallet.
    CreateWallet {
        /// The name of the wallet.
        name: String,
        /// The passphrase for the wallet.
        passphrase: String,
    },

    /// Open an existing wallet.
    OpenWallet {
        /// The name of the wallet.
        name: String,
        /// The passphrase for the wallet.
        passphrase: String,
    },

    /// Close a wallet.
    CloseWallet {
        /// The name of the wallet.
        name: String,
    },

    /// Get the balance of a wallet.
    GetBalance {
        /// The name of the wallet.
        name: String,
    },

    /// Create a new address.
    CreateAddress {
        /// The name of the wallet.
        name: String,
    },

    /// Create a transaction.
    CreateTransaction {
        /// The name of the wallet.
        name: String,
        /// The recipient address.
        recipient: String,
        /// The amount to send.
        amount: u64,
        /// The fee rate in satoshis per byte.
        fee_rate: u64,
    },

    /// Sign a transaction.
    SignTransaction {
        /// The name of the wallet.
        name: String,
        /// The transaction to sign.
        transaction: Vec<u8>,
    },

    /// Broadcast a transaction.
    BroadcastTransaction {
        /// The name of the wallet.
        name: String,
        /// The transaction to broadcast.
        transaction: Vec<u8>,
    },

    /// Response to a wallet message.
    Response {
        /// The request ID.
        request_id: String,
        /// The response data.
        data: WalletResponseData,
    },
}

/// Response data for wallet messages.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WalletResponseData {
    /// Success response.
    Success,

    /// Error response.
    Error(String),

    /// Balance response.
    Balance {
        /// The confirmed balance.
        confirmed: u64,
        /// The unconfirmed balance.
        unconfirmed: u64,
    },

    /// Address response.
    Address(String),

    /// Transaction response.
    Transaction(Vec<u8>),

    /// Transaction ID response.
    TransactionId(String),
}

/// Wallet adapter for the DarkSwap bridge.
pub struct WalletAdapter {
    /// The wallet manager.
    wallet_manager: Arc<Mutex<WalletManager>>,
}

impl WalletAdapter {
    /// Create a new wallet adapter.
    pub fn new(network: Network, electrum_server: String) -> Self {
        let wallet_manager = WalletManager::new(network, electrum_server);
        Self {
            wallet_manager: Arc::new(Mutex::new(wallet_manager)),
        }
    }

    /// Handle a wallet message.
    pub fn handle_message(&self, message: WalletMessage) -> Result<Option<WalletMessage>, DarkSwapError> {
        match message {
            WalletMessage::CreateWallet { name, passphrase } => {
                info!("Creating wallet: {}", name);
                let mut wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.create_wallet(&name, &passphrase) {
                    Ok(_) => {
                        let response = WalletMessage::Response {
                            request_id: "create_wallet".to_string(),
                            data: WalletResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "create_wallet".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::OpenWallet { name, passphrase } => {
                info!("Opening wallet: {}", name);
                let mut wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.open_wallet(&name, &passphrase) {
                    Ok(_) => {
                        let response = WalletMessage::Response {
                            request_id: "open_wallet".to_string(),
                            data: WalletResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "open_wallet".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::CloseWallet { name } => {
                info!("Closing wallet: {}", name);
                let mut wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.close_wallet(&name) {
                    Ok(_) => {
                        let response = WalletMessage::Response {
                            request_id: "close_wallet".to_string(),
                            data: WalletResponseData::Success,
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "close_wallet".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::GetBalance { name } => {
                info!("Getting balance for wallet: {}", name);
                let wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.get_balance(&name) {
                    Ok((confirmed, unconfirmed)) => {
                        let response = WalletMessage::Response {
                            request_id: "get_balance".to_string(),
                            data: WalletResponseData::Balance {
                                confirmed,
                                unconfirmed,
                            },
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "get_balance".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::CreateAddress { name } => {
                info!("Creating address for wallet: {}", name);
                let wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.create_address(&name) {
                    Ok(address) => {
                        let response = WalletMessage::Response {
                            request_id: "create_address".to_string(),
                            data: WalletResponseData::Address(address),
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "create_address".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::CreateTransaction {
                name,
                recipient,
                amount,
                fee_rate,
            } => {
                info!(
                    "Creating transaction for wallet: {} to {} with amount: {} and fee rate: {}",
                    name, recipient, amount, fee_rate
                );
                let wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.create_transaction(&name, &recipient, amount, fee_rate) {
                    Ok(transaction) => {
                        let response = WalletMessage::Response {
                            request_id: "create_transaction".to_string(),
                            data: WalletResponseData::Transaction(transaction),
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "create_transaction".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::SignTransaction { name, transaction } => {
                info!("Signing transaction for wallet: {}", name);
                let wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.sign_transaction(&name, &transaction) {
                    Ok(signed_transaction) => {
                        let response = WalletMessage::Response {
                            request_id: "sign_transaction".to_string(),
                            data: WalletResponseData::Transaction(signed_transaction),
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "sign_transaction".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::BroadcastTransaction { name, transaction } => {
                info!("Broadcasting transaction for wallet: {}", name);
                let wallet_manager = self.wallet_manager.lock().unwrap();
                match wallet_manager.broadcast_transaction(&name, &transaction) {
                    Ok(txid) => {
                        let response = WalletMessage::Response {
                            request_id: "broadcast_transaction".to_string(),
                            data: WalletResponseData::TransactionId(txid),
                        };
                        Ok(Some(response))
                    }
                    Err(e) => {
                        let response = WalletMessage::Response {
                            request_id: "broadcast_transaction".to_string(),
                            data: WalletResponseData::Error(e.to_string()),
                        };
                        Ok(Some(response))
                    }
                }
            }
            WalletMessage::Response { .. } => {
                // Ignore responses
                Ok(None)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wallet_adapter_creation() {
        let adapter = WalletAdapter::new(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002".to_string(),
        );
        assert!(adapter.wallet_manager.lock().unwrap().create_wallet("test_wallet", "password").is_ok());
    }
}