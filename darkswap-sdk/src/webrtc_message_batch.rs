//! WebRTC message batching
//!
//! This module provides message batching for WebRTC data channels.

#![cfg(feature = "webrtc")]

use crate::error::{Error, Result};
use crate::types::PeerId;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;

/// Message batch
pub struct MessageBatch {
    /// Messages
    messages: Vec<Vec<u8>>,
    /// Maximum batch size
    max_size: usize,
    /// Maximum batch age
    max_age: Duration,
    /// Batch creation time
    creation_time: Instant,
}

impl MessageBatch {
    /// Create a new message batch
    pub fn new(max_size: usize, max_age: Duration) -> Self {
        Self {
            messages: Vec::new(),
            max_size,
            max_age,
            creation_time: Instant::now(),
        }
    }
    
    /// Add a message to the batch
    pub fn add_message(&mut self, message: Vec<u8>) -> bool {
        // Check if the batch is full
        if self.messages.len() >= self.max_size {
            return false;
        }
        
        // Add the message
        self.messages.push(message);
        
        // Return true if the batch is full
        self.messages.len() >= self.max_size
    }
    
    /// Check if the batch is ready to be sent
    pub fn is_ready(&self) -> bool {
        // Check if the batch is full
        if self.messages.len() >= self.max_size {
            return true;
        }
        
        // Check if the batch is too old
        if self.creation_time.elapsed() >= self.max_age {
            return true;
        }
        
        false
    }
    
    /// Get the messages
    pub fn get_messages(&self) -> &[Vec<u8>] {
        &self.messages
    }
    
    /// Take the messages
    pub fn take_messages(&mut self) -> Vec<Vec<u8>> {
        std::mem::take(&mut self.messages)
    }
    
    /// Reset the batch
    pub fn reset(&mut self) {
        self.messages.clear();
        self.creation_time = Instant::now();
    }
    
    /// Get the number of messages
    pub fn len(&self) -> usize {
        self.messages.len()
    }
    
    /// Check if the batch is empty
    pub fn is_empty(&self) -> bool {
        self.messages.is_empty()
    }
}

/// Message batcher
pub struct MessageBatcher {
    /// Batches by peer ID
    batches: Arc<Mutex<HashMap<PeerId, MessageBatch>>>,
    /// Maximum batch size
    max_size: usize,
    /// Maximum batch age
    max_age: Duration,
    /// Batch sender
    batch_sender: mpsc::Sender<(PeerId, Vec<Vec<u8>>)>,
    /// Batch receiver
    batch_receiver: mpsc::Receiver<(PeerId, Vec<Vec<u8>>)>,
}

impl MessageBatcher {
    /// Create a new message batcher
    pub fn new(max_size: usize, max_age: Duration) -> Self {
        let (batch_sender, batch_receiver) = mpsc::channel(100);
        
        Self {
            batches: Arc::new(Mutex::new(HashMap::new())),
            max_size,
            max_age,
            batch_sender,
            batch_receiver,
        }
    }
    
    /// Add a message to a batch
    pub fn add_message(&self, peer_id: &PeerId, message: Vec<u8>) -> Result<()> {
        let mut batches = self.batches.lock().unwrap();
        
        // Get or create the batch
        let batch = batches.entry(peer_id.clone()).or_insert_with(|| {
            MessageBatch::new(self.max_size, self.max_age)
        });
        
        // Add the message to the batch
        let is_full = batch.add_message(message);
        
        // Check if the batch is ready to be sent
        if is_full || batch.is_ready() {
            // Take the messages
            let messages = batch.take_messages();
            
            // Reset the batch
            batch.reset();
            
            // Send the batch
            let batch_sender = self.batch_sender.clone();
            let peer_id_clone = peer_id.clone();
            
            tokio::spawn(async move {
                if let Err(e) = batch_sender.send((peer_id_clone, messages)).await {
                    eprintln!("Failed to send batch: {}", e);
                }
            });
        }
        
        Ok(())
    }
    
    /// Get the batch receiver
    pub fn receiver(&mut self) -> mpsc::Receiver<(PeerId, Vec<Vec<u8>>)> {
        std::mem::replace(&mut self.batch_receiver, mpsc::channel(100).1)
    }
    
    /// Start the batch flusher
    pub fn start_batch_flusher(&self) {
        let batches = self.batches.clone();
        let batch_sender = self.batch_sender.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(100));
            
            loop {
                interval.tick().await;
                
                // Check all batches
                let mut ready_batches = Vec::new();
                
                {
                    let mut batches_lock = batches.lock().unwrap();
                    
                    for (peer_id, batch) in batches_lock.iter_mut() {
                        if batch.is_ready() && !batch.is_empty() {
                            // Take the messages
                            let messages = batch.take_messages();
                            
                            // Reset the batch
                            batch.reset();
                            
                            // Add to ready batches
                            ready_batches.push((peer_id.clone(), messages));
                        }
                    }
                }
                
                // Send ready batches
                for (peer_id, messages) in ready_batches {
                    let batch_sender = batch_sender.clone();
                    let peer_id_clone = peer_id.clone();
                    
                    tokio::spawn(async move {
                        if let Err(e) = batch_sender.send((peer_id_clone, messages)).await {
                            eprintln!("Failed to send batch: {}", e);
                        }
                    });
                }
            }
        });
    }
}

impl Clone for MessageBatcher {
    fn clone(&self) -> Self {
        let (batch_sender, batch_receiver) = mpsc::channel(100);
        
        Self {
            batches: self.batches.clone(),
            max_size: self.max_size,
            max_age: self.max_age,
            batch_sender,
            batch_receiver,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[test]
    fn test_message_batch_creation() {
        let batch = MessageBatch::new(10, Duration::from_secs(1));
        
        assert_eq!(batch.len(), 0);
        assert!(batch.is_empty());
        assert!(!batch.is_ready());
    }
    
    #[test]
    fn test_message_batch_add_message() {
        let mut batch = MessageBatch::new(2, Duration::from_secs(1));
        
        // Add a message
        let is_full = batch.add_message(vec![1, 2, 3]);
        assert!(!is_full);
        assert_eq!(batch.len(), 1);
        assert!(!batch.is_empty());
        
        // Add another message
        let is_full = batch.add_message(vec![4, 5, 6]);
        assert!(is_full);
        assert_eq!(batch.len(), 2);
        assert!(!batch.is_empty());
        
        // Try to add another message
        let is_full = batch.add_message(vec![7, 8, 9]);
        assert!(!is_full); // Should return false because the batch is already full
        assert_eq!(batch.len(), 2);
        assert!(!batch.is_empty());
    }
    
    #[test]
    fn test_message_batch_is_ready() {
        // Test with full batch
        let mut batch = MessageBatch::new(2, Duration::from_secs(1));
        batch.add_message(vec![1, 2, 3]);
        batch.add_message(vec![4, 5, 6]);
        assert!(batch.is_ready());
        
        // Test with old batch
        let mut batch = MessageBatch::new(10, Duration::from_millis(10));
        batch.add_message(vec![1, 2, 3]);
        std::thread::sleep(Duration::from_millis(20));
        assert!(batch.is_ready());
    }
    
    #[test]
    fn test_message_batch_take_messages() {
        let mut batch = MessageBatch::new(10, Duration::from_secs(1));
        batch.add_message(vec![1, 2, 3]);
        batch.add_message(vec![4, 5, 6]);
        
        let messages = batch.take_messages();
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0], vec![1, 2, 3]);
        assert_eq!(messages[1], vec![4, 5, 6]);
        
        assert_eq!(batch.len(), 0);
        assert!(batch.is_empty());
    }
    
    #[test]
    fn test_message_batch_reset() {
        let mut batch = MessageBatch::new(10, Duration::from_secs(1));
        batch.add_message(vec![1, 2, 3]);
        batch.add_message(vec![4, 5, 6]);
        
        batch.reset();
        assert_eq!(batch.len(), 0);
        assert!(batch.is_empty());
    }
    
    #[tokio::test]
    async fn test_message_batcher_creation() {
        let batcher = MessageBatcher::new(10, Duration::from_secs(1));
        
        assert_eq!(batcher.max_size, 10);
        assert_eq!(batcher.max_age, Duration::from_secs(1));
        assert_eq!(batcher.batches.lock().unwrap().len(), 0);
    }
    
    #[tokio::test]
    async fn test_message_batcher_add_message() {
        let batcher = MessageBatcher::new(2, Duration::from_secs(1));
        let peer_id = PeerId("test".to_string());
        
        // Add a message
        batcher.add_message(&peer_id, vec![1, 2, 3]).unwrap();
        assert_eq!(batcher.batches.lock().unwrap().get(&peer_id).unwrap().len(), 1);
        
        // Add another message (this should trigger a batch send)
        batcher.add_message(&peer_id, vec![4, 5, 6]).unwrap();
        
        // The batch should be reset after sending
        assert_eq!(batcher.batches.lock().unwrap().get(&peer_id).unwrap().len(), 0);
    }
}