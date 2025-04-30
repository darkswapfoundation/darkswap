//! Integration module for the DarkSwap bridge.
//!
//! This module provides integration between the bridge and the DarkSwap application.

use crate::{
    BridgeClient, BridgeError, BridgeMessage, NetworkMessage, SystemMessage, WalletMessage,
    WalletResponseData,
};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tokio::sync::mpsc;

/// Integration manager for the DarkSwap bridge.
pub struct IntegrationManager {
    /// The bridge client.
    bridge_client: Arc<Mutex<BridgeClient>>,
    /// The sender for outgoing messages.
    message_sender: mpsc::Sender<BridgeMessage>,
    /// The receiver for incoming messages.
    message_receiver: mpsc::Receiver<BridgeMessage>,
    /// Whether the manager is running.
    running: Arc<Mutex<bool>>,
}

impl IntegrationManager {
    /// Create a new integration manager.
    pub fn new() -> Result<Self, BridgeError> {
        // Create a bridge client
        let bridge_client = BridgeClient::new()?;

        // Create channels for message passing
        let (message_sender, message_receiver) = mpsc::channel(100);

        Ok(Self {
            bridge_client: Arc::new(Mutex::new(bridge_client)),
            message_sender,
            message_receiver,
            running: Arc::new(Mutex::new(false)),
        })
    }

    /// Start the integration manager.
    pub fn start(&self) -> Result<(), BridgeError> {
        // Set the running flag
        *self.running.lock().unwrap() = true;

        // Clone the bridge client and running flag
        let bridge_client = self.bridge_client.clone();
        let running = self.running.clone();
        let message_sender = self.message_sender.clone();

        // Start a thread to receive messages from the bridge
        thread::spawn(move || {
            while *running.lock().unwrap() {
                // Receive a message from the bridge
                match bridge_client.lock().unwrap().receive() {
                    Ok(message) => {
                        // Forward the message to the application
                        let message_sender = message_sender.clone();
                        tokio::spawn(async move {
                            if let Err(e) = message_sender.send(message).await {
                                error!("Failed to forward message: {}", e);
                            }
                        });
                    }
                    Err(e) => {
                        error!("Error receiving message: {}", e);
                        // Sleep for a bit before trying again
                        thread::sleep(Duration::from_secs(1));
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop the integration manager.
    pub fn stop(&self) -> Result<(), BridgeError> {
        // Set the running flag
        *self.running.lock().unwrap() = false;

        // Shutdown the bridge client
        self.bridge_client.lock().unwrap().shutdown()?;

        Ok(())
    }

    /// Send a message to the wallet component.
    pub async fn send_to_wallet(&self, message: WalletMessage) -> Result<(), BridgeError> {
        self.bridge_client
            .lock()
            .unwrap()
            .send_to_wallet(BridgeMessage::Wallet(message))
    }

    /// Send a message to the network component.
    pub async fn send_to_network(&self, message: NetworkMessage) -> Result<(), BridgeError> {
        self.bridge_client
            .lock()
            .unwrap()
            .send_to_network(BridgeMessage::Network(message))
    }

    /// Receive a message from the bridge.
    pub async fn receive_message(&mut self) -> Result<BridgeMessage, BridgeError> {
        self.message_receiver
            .recv()
            .await
            .ok_or_else(|| BridgeError::ReceiveError("Channel closed".to_string()))
    }

    /// Create a new wallet.
    pub async fn create_wallet(&self, name: &str, passphrase: &str) -> Result<(), BridgeError> {
        let message = WalletMessage::CreateWallet {
            name: name.to_string(),
            passphrase: passphrase.to_string(),
        };
        self.send_to_wallet(message).await
    }

    /// Open an existing wallet.
    pub async fn open_wallet(&self, name: &str, passphrase: &str) -> Result<(), BridgeError> {
        let message = WalletMessage::OpenWallet {
            name: name.to_string(),
            passphrase: passphrase.to_string(),
        };
        self.send_to_wallet(message).await
    }

    /// Close a wallet.
    pub async fn close_wallet(&self, name: &str) -> Result<(), BridgeError> {
        let message = WalletMessage::CloseWallet {
            name: name.to_string(),
        };
        self.send_to_wallet(message).await
    }

    /// Get the balance of a wallet.
    pub async fn get_balance(&self, name: &str) -> Result<(), BridgeError> {
        let message = WalletMessage::GetBalance {
            name: name.to_string(),
        };
        self.send_to_wallet(message).await
    }

    /// Create a new address.
    pub async fn create_address(&self, name: &str) -> Result<(), BridgeError> {
        let message = WalletMessage::CreateAddress {
            name: name.to_string(),
        };
        self.send_to_wallet(message).await
    }

    /// Create a transaction.
    pub async fn create_transaction(
        &self,
        name: &str,
        recipient: &str,
        amount: u64,
        fee_rate: u64,
    ) -> Result<(), BridgeError> {
        let message = WalletMessage::CreateTransaction {
            name: name.to_string(),
            recipient: recipient.to_string(),
            amount,
            fee_rate,
        };
        self.send_to_wallet(message).await
    }

    /// Sign a transaction.
    pub async fn sign_transaction(&self, name: &str, transaction: &[u8]) -> Result<(), BridgeError> {
        let message = WalletMessage::SignTransaction {
            name: name.to_string(),
            transaction: transaction.to_vec(),
        };
        self.send_to_wallet(message).await
    }

    /// Broadcast a transaction.
    pub async fn broadcast_transaction(
        &self,
        name: &str,
        transaction: &[u8],
    ) -> Result<(), BridgeError> {
        let message = WalletMessage::BroadcastTransaction {
            name: name.to_string(),
            transaction: transaction.to_vec(),
        };
        self.send_to_wallet(message).await
    }

    /// Connect to a peer.
    pub async fn connect_to_peer(&self, address: &str) -> Result<(), BridgeError> {
        let message = NetworkMessage::Connect {
            address: address.to_string(),
        };
        self.send_to_network(message).await
    }

    /// Disconnect from a peer.
    pub async fn disconnect_from_peer(&self, address: &str) -> Result<(), BridgeError> {
        let message = NetworkMessage::Disconnect {
            address: address.to_string(),
        };
        self.send_to_network(message).await
    }

    /// Send a message to a peer.
    pub async fn send_message_to_peer(
        &self,
        address: &str,
        message: &[u8],
    ) -> Result<(), BridgeError> {
        let message = NetworkMessage::SendMessage {
            address: address.to_string(),
            message: message.to_vec(),
        };
        self.send_to_network(message).await
    }

    /// Broadcast a message to all peers.
    pub async fn broadcast_message(&self, message: &[u8]) -> Result<(), BridgeError> {
        let message = NetworkMessage::BroadcastMessage {
            message: message.to_vec(),
        };
        self.send_to_network(message).await
    }

    /// Get the list of connected peers.
    pub async fn get_peers(&self) -> Result<(), BridgeError> {
        let message = NetworkMessage::GetPeers;
        self.send_to_network(message).await
    }

    /// Ping the system.
    pub async fn ping(&self) -> Result<(), BridgeError> {
        let message = SystemMessage::Ping;
        self.bridge_client
            .lock()
            .unwrap()
            .send_to_wallet(BridgeMessage::System(message.clone()))?;
        self.bridge_client
            .lock()
            .unwrap()
            .send_to_network(BridgeMessage::System(message))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_integration_manager_creation() {
        let manager = IntegrationManager::new();
        assert!(manager.is_ok());
    }
}