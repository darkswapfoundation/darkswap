//! IPC utilities for DarkSwap Bridge
//!
//! This module provides utilities for inter-process communication (IPC)
//! between the bridge and the wallet and network adapters.

use std::sync::{Arc, Mutex};

use ipc_channel::ipc::{self, IpcError, IpcReceiver as IpcReceiverInner, IpcSender as IpcSenderInner, TryRecvError};
use serde::{de::DeserializeOwned, Serialize};

use crate::error::{Error, Result};

/// IPC sender wrapper
#[derive(Clone)]
pub struct IpcSender<T> {
    /// Inner IPC sender
    inner: Arc<Mutex<IpcSenderInner<T>>>,
}

impl<T: Serialize> IpcSender<T> {
    /// Create a new IPC sender
    pub fn new(sender: IpcSenderInner<T>) -> Self {
        Self {
            inner: Arc::new(Mutex::new(sender)),
        }
    }

    /// Send a message
    pub fn send(&self, message: T) -> Result<()> {
        let sender = self.inner.lock().unwrap();
        sender.send(message).map_err(|e| {
            Error::IpcError(format!("Failed to send message: {}", e))
        })
    }
}

/// IPC receiver wrapper
#[derive(Clone)]
pub struct IpcReceiver<T> {
    /// Inner IPC receiver
    inner: Arc<Mutex<IpcReceiverInner<T>>>,
}

impl<T: DeserializeOwned> IpcReceiver<T> {
    /// Create a new IPC receiver
    pub fn new(receiver: IpcReceiverInner<T>) -> Self {
        Self {
            inner: Arc::new(Mutex::new(receiver)),
        }
    }

    /// Receive a message
    pub fn recv(&self) -> Result<T> {
        let receiver = self.inner.lock().unwrap();
        receiver.recv().map_err(|e| {
            Error::IpcError(format!("Failed to receive message: {}", e))
        })
    }

    /// Try to receive a message
    pub fn try_recv(&self) -> std::result::Result<T, TryRecvError> {
        let receiver = self.inner.lock().unwrap();
        receiver.try_recv()
    }
}

/// Create an IPC channel
pub fn channel<T>() -> Result<(IpcSender<T>, IpcReceiver<T>)> {
    let (sender, receiver) = ipc::channel()?;
    Ok((IpcSender::new(sender), IpcReceiver::new(receiver)))
}

/// Connect to an IPC server
pub fn connect<T>(name: &str) -> Result<IpcSender<T>> {
    let sender = ipc::IpcSender::connect(name)?;
    Ok(IpcSender::new(sender))
}

/// Create an IPC server
pub fn server<T>() -> Result<(String, IpcReceiver<T>)> {
    let (server, receiver) = ipc::IpcOneShotServer::new()?;
    Ok((server.get_name().to_string(), IpcReceiver::new(receiver)))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_ipc_channel() {
        let (sender, receiver) = channel::<String>().unwrap();
        
        sender.send("Hello, world!".to_string()).unwrap();
        
        let message = receiver.recv().unwrap();
        assert_eq!(message, "Hello, world!");
    }
}