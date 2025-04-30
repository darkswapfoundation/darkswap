//! Bridge implementation for DarkSwap Bridge
//!
//! This module provides the core bridge functionality that enables communication
//! between the wallet and networking components of DarkSwap.

use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use log::{debug, error, info, warn};
use tokio::sync::mpsc;
use tokio::time;

use crate::config::BridgeConfig;
use crate::error::{Error, Result};
use crate::ipc::{IpcReceiver, IpcSender};
use crate::message::{Message, ResponseMessage, SystemMessage};

/// Bridge component
pub struct Bridge {
    /// Bridge configuration
    config: BridgeConfig,
    /// Wallet adapter process
    wallet_process: Option<Child>,
    /// Network adapter process
    network_process: Option<Child>,
    /// Wallet adapter sender
    wallet_sender: Option<IpcSender<Message>>,
    /// Wallet adapter receiver
    wallet_receiver: Option<IpcReceiver<Message>>,
    /// Network adapter sender
    network_sender: Option<IpcSender<Message>>,
    /// Network adapter receiver
    network_receiver: Option<IpcReceiver<Message>>,
    /// Running flag
    running: Arc<Mutex<bool>>,
}

impl Bridge {
    /// Create a new bridge
    pub fn new(config: BridgeConfig) -> Result<Self> {
        Ok(Self {
            config,
            wallet_process: None,
            network_process: None,
            wallet_sender: None,
            wallet_receiver: None,
            network_sender: None,
            network_receiver: None,
            running: Arc::new(Mutex::new(false)),
        })
    }

    /// Start the bridge
    pub async fn start(&mut self) -> Result<()> {
        info!("Starting bridge");
        
        // Check if already running
        {
            let mut running = self.running.lock().unwrap();
            if *running {
                return Err(Error::BridgeError("Bridge is already running".to_string()));
            }
            *running = true;
        }
        
        // Start wallet adapter if auto-start is enabled
        if self.config.auto_start {
            self.start_wallet_adapter()?;
        }
        
        // Start network adapter if auto-start is enabled
        if self.config.auto_start {
            self.start_network_adapter()?;
        }
        
        // Start message handling
        self.start_message_handling().await?;
        
        Ok(())
    }

    /// Stop the bridge
    pub async fn stop(&mut self) -> Result<()> {
        info!("Stopping bridge");
        
        // Check if running
        {
            let mut running = self.running.lock().unwrap();
            if !*running {
                return Err(Error::BridgeError("Bridge is not running".to_string()));
            }
            *running = false;
        }
        
        // Send shutdown message to wallet adapter
        if let Some(sender) = &self.wallet_sender {
            let _ = sender.send(Message::System(SystemMessage::Shutdown));
        }
        
        // Send shutdown message to network adapter
        if let Some(sender) = &self.network_sender {
            let _ = sender.send(Message::System(SystemMessage::Shutdown));
        }
        
        // Wait for processes to exit
        if let Some(mut process) = self.wallet_process.take() {
            let _ = process.kill();
            let _ = process.wait();
        }
        
        if let Some(mut process) = self.network_process.take() {
            let _ = process.kill();
            let _ = process.wait();
        }
        
        // Clean up IPC channels
        self.wallet_sender = None;
        self.wallet_receiver = None;
        self.network_sender = None;
        self.network_receiver = None;
        
        Ok(())
    }

    /// Start the wallet adapter
    pub fn start_wallet_adapter(&mut self) -> Result<()> {
        info!("Starting wallet adapter");
        
        // Create IPC channels
        let (bridge_sender, adapter_receiver) = ipc_channel::ipc::channel()?;
        let (adapter_sender, bridge_receiver) = ipc_channel::ipc::channel()?;
        
        // Start wallet adapter process
        let mut command = Command::new(&self.config.wallet_adapter_path);
        command
            .arg("--bridge-sender")
            .arg(ipc_channel::ipc::IpcSender::format(&adapter_sender))
            .arg("--bridge-receiver")
            .arg(ipc_channel::ipc::IpcReceiver::format(&adapter_receiver))
            .arg("--storage-dir")
            .arg(&self.config.storage_dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit());
        
        let process = command.spawn().map_err(|e| {
            Error::ProcessError(format!("Failed to start wallet adapter: {}", e))
        })?;
        
        // Store process and channels
        self.wallet_process = Some(process);
        self.wallet_sender = Some(IpcSender::new(bridge_sender));
        self.wallet_receiver = Some(IpcReceiver::new(bridge_receiver));
        
        Ok(())
    }

    /// Start the network adapter
    pub fn start_network_adapter(&mut self) -> Result<()> {
        info!("Starting network adapter");
        
        // Create IPC channels
        let (bridge_sender, adapter_receiver) = ipc_channel::ipc::channel()?;
        let (adapter_sender, bridge_receiver) = ipc_channel::ipc::channel()?;
        
        // Start network adapter process
        let mut command = Command::new(&self.config.network_adapter_path);
        command
            .arg("--bridge-sender")
            .arg(ipc_channel::ipc::IpcSender::format(&adapter_sender))
            .arg("--bridge-receiver")
            .arg(ipc_channel::ipc::IpcReceiver::format(&adapter_receiver))
            .arg("--storage-dir")
            .arg(&self.config.storage_dir)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit());
        
        if self.config.auto_connect {
            command.arg("--auto-connect");
        }
        
        let process = command.spawn().map_err(|e| {
            Error::ProcessError(format!("Failed to start network adapter: {}", e))
        })?;
        
        // Store process and channels
        self.network_process = Some(process);
        self.network_sender = Some(IpcSender::new(bridge_sender));
        self.network_receiver = Some(IpcReceiver::new(bridge_receiver));
        
        Ok(())
    }

    /// Start message handling
    async fn start_message_handling(&self) -> Result<()> {
        info!("Starting message handling");
        
        // Create channels for message handling
        let (wallet_tx, mut wallet_rx) = mpsc::channel(100);
        let (network_tx, mut network_rx) = mpsc::channel(100);
        
        // Clone necessary data for message handling
        let running = self.running.clone();
        let wallet_receiver = self.wallet_receiver.clone();
        let network_receiver = self.network_receiver.clone();
        let wallet_sender = self.wallet_sender.clone();
        let network_sender = self.network_sender.clone();
        
        // Spawn task to handle messages from wallet adapter
        if let Some(receiver) = &wallet_receiver {
            let receiver = receiver.clone();
            let tx = wallet_tx.clone();
            let running_clone = running.clone();
            
            tokio::spawn(async move {
                let receiver = receiver;
                
                loop {
                    // Check if bridge is still running
                    {
                        let running = running_clone.lock().unwrap();
                        if !*running {
                            break;
                        }
                    }
                    
                    // Try to receive message
                    match receiver.try_recv() {
                        Ok(message) => {
                            if let Err(e) = tx.send(message).await {
                                error!("Failed to forward message from wallet adapter: {}", e);
                            }
                        }
                        Err(ipc_channel::ipc::TryRecvError::Empty) => {
                            // No message available, sleep for a bit
                            time::sleep(Duration::from_millis(10)).await;
                        }
                        Err(e) => {
                            error!("Failed to receive message from wallet adapter: {}", e);
                            break;
                        }
                    }
                }
            });
        }
        
        // Spawn task to handle messages from network adapter
        if let Some(receiver) = &network_receiver {
            let receiver = receiver.clone();
            let tx = network_tx.clone();
            let running_clone = running.clone();
            
            tokio::spawn(async move {
                let receiver = receiver;
                
                loop {
                    // Check if bridge is still running
                    {
                        let running = running_clone.lock().unwrap();
                        if !*running {
                            break;
                        }
                    }
                    
                    // Try to receive message
                    match receiver.try_recv() {
                        Ok(message) => {
                            if let Err(e) = tx.send(message).await {
                                error!("Failed to forward message from network adapter: {}", e);
                            }
                        }
                        Err(ipc_channel::ipc::TryRecvError::Empty) => {
                            // No message available, sleep for a bit
                            time::sleep(Duration::from_millis(10)).await;
                        }
                        Err(e) => {
                            error!("Failed to receive message from network adapter: {}", e);
                            break;
                        }
                    }
                }
            });
        }
        
        // Spawn task to handle messages from both adapters
        tokio::spawn(async move {
            loop {
                // Check if bridge is still running
                {
                    let running_guard = running.lock().unwrap();
                    if !*running_guard {
                        break;
                    }
                }
                
                tokio::select! {
                    // Handle messages from wallet adapter
                    Some(message) = wallet_rx.recv() => {
                        debug!("Received message from wallet adapter: {:?}", message);
                        
                        // Handle message based on type
                        match &message {
                            Message::Wallet(_) => {
                                // Forward wallet message to network adapter
                                if let Some(sender) = &network_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward message to network adapter: {}", e);
                                    }
                                }
                            }
                            Message::Network(_) => {
                                // Forward network message to network adapter
                                if let Some(sender) = &network_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward message to network adapter: {}", e);
                                    }
                                }
                            }
                            Message::System(SystemMessage::Ping) => {
                                // Respond to ping with pong
                                if let Some(sender) = &wallet_sender {
                                    if let Err(e) = sender.send(Message::System(SystemMessage::Pong)) {
                                        error!("Failed to send pong to wallet adapter: {}", e);
                                    }
                                }
                            }
                            Message::Response(_) => {
                                // Forward response to network adapter
                                if let Some(sender) = &network_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward response to network adapter: {}", e);
                                    }
                                }
                            }
                            Message::Error(_) => {
                                // Forward error to network adapter
                                if let Some(sender) = &network_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward error to network adapter: {}", e);
                                    }
                                }
                            }
                            _ => {
                                // Ignore other messages
                            }
                        }
                    }
                    
                    // Handle messages from network adapter
                    Some(message) = network_rx.recv() => {
                        debug!("Received message from network adapter: {:?}", message);
                        
                        // Handle message based on type
                        match &message {
                            Message::Wallet(_) => {
                                // Forward wallet message to wallet adapter
                                if let Some(sender) = &wallet_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward message to wallet adapter: {}", e);
                                    }
                                }
                            }
                            Message::Network(_) => {
                                // Forward network message to wallet adapter
                                if let Some(sender) = &wallet_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward message to wallet adapter: {}", e);
                                    }
                                }
                            }
                            Message::System(SystemMessage::Ping) => {
                                // Respond to ping with pong
                                if let Some(sender) = &network_sender {
                                    if let Err(e) = sender.send(Message::System(SystemMessage::Pong)) {
                                        error!("Failed to send pong to network adapter: {}", e);
                                    }
                                }
                            }
                            Message::Response(_) => {
                                // Forward response to wallet adapter
                                if let Some(sender) = &wallet_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward response to wallet adapter: {}", e);
                                    }
                                }
                            }
                            Message::Error(_) => {
                                // Forward error to wallet adapter
                                if let Some(sender) = &wallet_sender {
                                    if let Err(e) = sender.send(message) {
                                        error!("Failed to forward error to wallet adapter: {}", e);
                                    }
                                }
                            }
                            _ => {
                                // Ignore other messages
                            }
                        }
                    }
                    
                    // No messages received, sleep for a bit
                    else => {
                        time::sleep(Duration::from_millis(10)).await;
                    }
                }
            }
        });
        
        Ok(())
    }

    /// Send a message to the wallet adapter
    pub fn send_to_wallet(&self, message: Message) -> Result<()> {
        if let Some(sender) = &self.wallet_sender {
            sender.send(message)?;
            Ok(())
        } else {
            Err(Error::BridgeError("Wallet adapter not connected".to_string()))
        }
    }

    /// Send a message to the network adapter
    pub fn send_to_network(&self, message: Message) -> Result<()> {
        if let Some(sender) = &self.network_sender {
            sender.send(message)?;
            Ok(())
        } else {
            Err(Error::BridgeError("Network adapter not connected".to_string()))
        }
    }

    /// Check if the bridge is running
    pub fn is_running(&self) -> bool {
        let running = self.running.lock().unwrap();
        *running
    }

    /// Check if the wallet adapter is connected
    pub fn is_wallet_connected(&self) -> bool {
        self.wallet_sender.is_some() && self.wallet_receiver.is_some()
    }

    /// Check if the network adapter is connected
    pub fn is_network_connected(&self) -> bool {
        self.network_sender.is_some() && self.network_receiver.is_some()
    }
}

impl Drop for Bridge {
    fn drop(&mut self) {
        // Kill processes if they are still running
        if let Some(mut process) = self.wallet_process.take() {
            let _ = process.kill();
            let _ = process.wait();
        }
        
        if let Some(mut process) = self.network_process.take() {
            let _ = process.kill();
            let _ = process.wait();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_bridge() {
        let config = BridgeConfig {
            wallet_adapter_path: "darkswap-wallet-adapter".to_string(),
            network_adapter_path: "darkswap-network-adapter".to_string(),
            storage_dir: "./storage".to_string(),
            auto_start: false,
            auto_connect: false,
        };
        
        let bridge = Bridge::new(config);
        assert!(bridge.is_ok());
    }
}