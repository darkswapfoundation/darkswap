//! WebRTC error handling
//!
//! This module provides error handling for WebRTC connections.

#![cfg(feature = "webrtc")]

use crate::error::{Error, Result};
use crate::types::PeerId;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Error type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WebRtcErrorType {
    /// Connection error
    Connection,
    /// Signaling error
    Signaling,
    /// Data channel error
    DataChannel,
    /// Message error
    Message,
    /// Timeout error
    Timeout,
    /// Unknown error
    Unknown,
}

/// Error record
#[derive(Debug, Clone)]
pub struct WebRtcErrorRecord {
    /// Error type
    pub error_type: WebRtcErrorType,
    /// Error message
    pub message: String,
    /// Timestamp
    pub timestamp: Instant,
    /// Retry count
    pub retry_count: u32,
    /// Current backoff interval in milliseconds
    pub current_backoff_ms: u64,
}

/// Error handler
pub struct WebRtcErrorHandler {
    /// Error records by peer ID
    error_records: Arc<Mutex<HashMap<PeerId, Vec<WebRtcErrorRecord>>>>,
    /// Max retry count
    max_retry_count: u32,
    /// Retry interval
    retry_interval: Duration,
    /// Error retention period
    error_retention_period: Duration,
}

impl WebRtcErrorHandler {
    /// Create a new error handler
    pub fn new(max_retry_count: u32, retry_interval: Duration, error_retention_period: Duration) -> Self {
        Self {
            error_records: Arc::new(Mutex::new(HashMap::new())),
            max_retry_count,
            retry_interval,
            error_retention_period,
        }
    }
    
    /// Record an error
    pub fn record_error(&self, peer_id: &PeerId, error_type: WebRtcErrorType, message: String) {
        let mut records = self.error_records.lock().unwrap();
        
        // Get or create the error records for this peer
        let peer_records = records.entry(peer_id.clone()).or_insert_with(Vec::new);
        
        // Find existing error of the same type
        let existing_error = peer_records.iter_mut().find(|r| r.error_type == error_type);
        
        if let Some(record) = existing_error {
            // Update existing error
            record.message = message;
            record.timestamp = Instant::now();
            record.retry_count += 1;
            
            // Apply exponential backoff (double the backoff interval with each retry)
            // Cap at 5 minutes (300,000 ms) to prevent excessive delays
            record.current_backoff_ms = (record.current_backoff_ms * 2).min(300_000);
            
            log::debug!(
                "Retry {} for peer {} error type {:?}, backoff: {}ms",
                record.retry_count,
                peer_id.0,
                error_type,
                record.current_backoff_ms
            );
        } else {
            // Create new error record with initial backoff from retry_interval
            let initial_backoff_ms = self.retry_interval.as_millis() as u64;
            
            peer_records.push(WebRtcErrorRecord {
                error_type,
                message,
                timestamp: Instant::now(),
                retry_count: 1,
                current_backoff_ms: initial_backoff_ms,
            });
            
            log::debug!(
                "First error for peer {} error type {:?}, initial backoff: {}ms",
                peer_id.0,
                error_type,
                initial_backoff_ms
            );
        }
    }
    
    /// Check if a peer has exceeded the max retry count for an error type
    pub fn has_exceeded_max_retries(&self, peer_id: &PeerId, error_type: WebRtcErrorType) -> bool {
        let records = self.error_records.lock().unwrap();
        
        if let Some(peer_records) = records.get(peer_id) {
            if let Some(record) = peer_records.iter().find(|r| r.error_type == error_type) {
                return record.retry_count > self.max_retry_count;
            }
        }
        
        false
    }
    
    /// Check if a peer should be retried
    pub fn should_retry(&self, peer_id: &PeerId, error_type: WebRtcErrorType) -> bool {
        // Check if the peer has exceeded the max retry count
        if self.has_exceeded_max_retries(peer_id, error_type) {
            log::debug!(
                "Not retrying peer {} error type {:?}: max retries exceeded",
                peer_id.0,
                error_type
            );
            return false;
        }
        
        // Check if enough time has passed since the last retry
        let records = self.error_records.lock().unwrap();
        
        if let Some(peer_records) = records.get(peer_id) {
            if let Some(record) = peer_records.iter().find(|r| r.error_type == error_type) {
                let backoff_duration = Duration::from_millis(record.current_backoff_ms);
                let should_retry = record.timestamp.elapsed() >= backoff_duration;
                
                if should_retry {
                    log::debug!(
                        "Retrying peer {} error type {:?} after {}ms backoff",
                        peer_id.0,
                        error_type,
                        record.current_backoff_ms
                    );
                } else {
                    log::debug!(
                        "Not retrying peer {} error type {:?} yet, waiting for {}ms backoff",
                        peer_id.0,
                        error_type,
                        record.current_backoff_ms
                    );
                }
                
                return should_retry;
            }
        }
        
        // No record found, so we should retry
        log::debug!("No error record found for peer {} error type {:?}, allowing retry", peer_id.0, error_type);
        true
    }
    
    /// Reset the retry count for a peer and error type
    pub fn reset_retry_count(&self, peer_id: &PeerId, error_type: WebRtcErrorType) {
        let mut records = self.error_records.lock().unwrap();
        
        if let Some(peer_records) = records.get_mut(peer_id) {
            if let Some(record) = peer_records.iter_mut().find(|r| r.error_type == error_type) {
                record.retry_count = 0;
            }
        }
    }
    
    /// Get the error records for a peer
    pub fn get_error_records(&self, peer_id: &PeerId) -> Vec<WebRtcErrorRecord> {
        let records = self.error_records.lock().unwrap();
        
        if let Some(peer_records) = records.get(peer_id) {
            peer_records.clone()
        } else {
            Vec::new()
        }
    }
    
    /// Clear the error records for a peer
    pub fn clear_error_records(&self, peer_id: &PeerId) {
        let mut records = self.error_records.lock().unwrap();
        records.remove(peer_id);
    }
    
    /// Start the cleanup task
    pub fn start_cleanup_task(&self) {
        let error_records = self.error_records.clone();
        let error_retention_period = self.error_retention_period;
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            
            loop {
                interval.tick().await;
                
                // Clean up old error records
                let mut records = error_records.lock().unwrap();
                
                for peer_records in records.values_mut() {
                    peer_records.retain(|record| record.timestamp.elapsed() < error_retention_period);
                }
                
                // Remove peers with no error records
                records.retain(|_, peer_records| !peer_records.is_empty());
            }
        });
    }
    
    /// Internal method to handle errors with common logic
    fn handle_error_internal(&self, peer_id: &PeerId, error_type: WebRtcErrorType, error: Error) -> Result<Error> {
        // Record the error
        self.record_error(peer_id, error_type, error.to_string());
        
        // Log the error for debugging
        log::debug!("WebRTC error: {:?} for peer {}: {}", error_type, peer_id.0, error);
        
        // Check if we should retry
        if self.should_retry(peer_id, error_type) {
            // Return the original error to trigger a retry
            Ok(error)
        } else {
            // Return a fatal error
            Ok(Error::NetworkError(format!("WebRTC error: {}, max retries exceeded", error)))
        }
    }
    
    /// Handle a WebRTC error
    pub fn handle_error(&self, peer_id: &PeerId, error_type: WebRtcErrorType, error: Error) -> Result<()> {
        match self.handle_error_internal(peer_id, error_type, error) {
            Ok(e) => Err(e),
            Err(e) => Err(e),
        }
    }
    
    /// Handle a WebRTC error with a custom return type
    pub fn handle_error_with_return<T>(&self, peer_id: &PeerId, error_type: WebRtcErrorType, error: Error) -> Result<T> {
        match self.handle_error_internal(peer_id, error_type, error) {
            Ok(e) => Err(e),
            Err(e) => Err(e),
        }
    }
    
    /// Get all error records for all peers
    pub fn get_all_error_records(&self) -> HashMap<PeerId, Vec<WebRtcErrorRecord>> {
        let records = self.error_records.lock().unwrap();
        records.clone()
    }
    
    /// Get the maximum retry count
    pub fn get_max_retry_count(&self) -> u32 {
        self.max_retry_count
    }
    
    /// Set the maximum retry count
    pub fn set_max_retry_count(&mut self, count: u32) {
        self.max_retry_count = count;
    }
    
    /// Get the retry interval
    pub fn get_retry_interval(&self) -> Duration {
        self.retry_interval
    }
    
    /// Set the retry interval
    pub fn set_retry_interval(&mut self, interval: Duration) {
        self.retry_interval = interval;
    }
    
    /// Get the error retention period
    pub fn get_error_retention_period(&self) -> Duration {
        self.error_retention_period
    }
    
    /// Set the error retention period
    pub fn set_error_retention_period(&mut self, period: Duration) {
        self.error_retention_period = period;
    }
}

impl Clone for WebRtcErrorHandler {
    fn clone(&self) -> Self {
        Self {
            error_records: self.error_records.clone(),
            max_retry_count: self.max_retry_count,
            retry_interval: self.retry_interval,
            error_retention_period: self.error_retention_period,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;
    
    #[test]
    fn test_error_handler_creation() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_secs(1), Duration::from_secs(60));
        
        assert_eq!(handler.max_retry_count, 3);
        assert_eq!(handler.retry_interval, Duration::from_secs(1));
        assert_eq!(handler.error_retention_period, Duration::from_secs(60));
    }
    
    #[test]
    fn test_record_error() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_secs(1), Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        // Record an error
        handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed".to_string());
        
        // Check that the error was recorded
        let records = handler.get_error_records(&peer_id);
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].error_type, WebRtcErrorType::Connection);
        assert_eq!(records[0].message, "Connection failed");
        assert_eq!(records[0].retry_count, 1);
        assert_eq!(records[0].current_backoff_ms, 1000); // Initial backoff from retry_interval
        
        // Record another error of the same type
        handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed again".to_string());
        
        // Check that the retry count was incremented and backoff doubled
        let records = handler.get_error_records(&peer_id);
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].error_type, WebRtcErrorType::Connection);
        assert_eq!(records[0].message, "Connection failed again");
        assert_eq!(records[0].retry_count, 2);
        assert_eq!(records[0].current_backoff_ms, 2000); // Doubled backoff
        
        // Record an error of a different type
        handler.record_error(&peer_id, WebRtcErrorType::Signaling, "Signaling failed".to_string());
        
        // Check that a new error record was created
        let records = handler.get_error_records(&peer_id);
        assert_eq!(records.len(), 2);
        
        // Find the signaling error record
        let signaling_record = records.iter().find(|r| r.error_type == WebRtcErrorType::Signaling).unwrap();
        assert_eq!(signaling_record.current_backoff_ms, 1000); // Initial backoff
    }
    
    #[test]
    fn test_has_exceeded_max_retries() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_secs(1), Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        // Record errors up to the max retry count
        for i in 0..3 {
            handler.record_error(&peer_id, WebRtcErrorType::Connection, format!("Connection failed {}", i));
        }
        
        // Check that we haven't exceeded the max retry count yet
        assert!(!handler.has_exceeded_max_retries(&peer_id, WebRtcErrorType::Connection));
        
        // Record one more error
        handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed again".to_string());
        
        // Check that we've now exceeded the max retry count
        assert!(handler.has_exceeded_max_retries(&peer_id, WebRtcErrorType::Connection));
    }
    
    #[test]
    fn test_should_retry() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_millis(100), Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        // Record an error
        handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed".to_string());
        
        // Check that we shouldn't retry yet
        assert!(!handler.should_retry(&peer_id, WebRtcErrorType::Connection));
        
        // Wait for the initial backoff interval
        sleep(Duration::from_millis(150));
        
        // Check that we should retry now
        assert!(handler.should_retry(&peer_id, WebRtcErrorType::Connection));
        
        // Record another error (retry #2)
        handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed again".to_string());
        
        // Verify backoff has doubled (now 200ms)
        let records = handler.get_error_records(&peer_id);
        assert_eq!(records[0].current_backoff_ms, 200);
        
        // Wait for less than the doubled backoff
        sleep(Duration::from_millis(150));
        
        // Check that we shouldn't retry yet
        assert!(!handler.should_retry(&peer_id, WebRtcErrorType::Connection));
        
        // Wait for the remaining doubled backoff
        sleep(Duration::from_millis(100));
        
        // Check that we should retry now
        assert!(handler.should_retry(&peer_id, WebRtcErrorType::Connection));
        
        // Record errors up to the max retry count
        for _ in 0..2 {
            handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed".to_string());
        }
        
        // Check that we shouldn't retry anymore due to max retries
        assert!(!handler.should_retry(&peer_id, WebRtcErrorType::Connection));
    }
    
    #[test]
    fn test_reset_retry_count() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_secs(1), Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        // Record errors up to the max retry count
        for i in 0..4 {
            handler.record_error(&peer_id, WebRtcErrorType::Connection, format!("Connection failed {}", i));
        }
        
        // Check that we've exceeded the max retry count
        assert!(handler.has_exceeded_max_retries(&peer_id, WebRtcErrorType::Connection));
        
        // Reset the retry count
        handler.reset_retry_count(&peer_id, WebRtcErrorType::Connection);
        
        // Check that we haven't exceeded the max retry count anymore
        assert!(!handler.has_exceeded_max_retries(&peer_id, WebRtcErrorType::Connection));
    }
    
    #[test]
    fn test_clear_error_records() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_secs(1), Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        // Record some errors
        handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed".to_string());
        handler.record_error(&peer_id, WebRtcErrorType::Signaling, "Signaling failed".to_string());
        
        // Check that the errors were recorded
        let records = handler.get_error_records(&peer_id);
        assert_eq!(records.len(), 2);
        
        // Clear the error records
        handler.clear_error_records(&peer_id);
        
        // Check that the errors were cleared
        let records = handler.get_error_records(&peer_id);
        assert_eq!(records.len(), 0);
    }
    
    #[test]
    fn test_handle_error() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_millis(100), Duration::from_secs(60));
        let peer_id = PeerId("test".to_string());
        
        // Handle an error
        let error = Error::NetworkError("Connection failed".to_string());
        let result = handler.handle_error(&peer_id, WebRtcErrorType::Connection, error);
        
        // Check that the error was returned
        assert!(result.is_err());
        
        // Record errors up to the max retry count
        for _ in 0..3 {
            handler.record_error(&peer_id, WebRtcErrorType::Connection, "Connection failed".to_string());
        }
        
        // Handle another error
        let error = Error::NetworkError("Connection failed".to_string());
        let result = handler.handle_error(&peer_id, WebRtcErrorType::Connection, error);
        
        // Check that a fatal error was returned
        assert!(result.is_err());
        if let Err(Error::NetworkError(msg)) = result {
            assert!(msg.contains("max retries exceeded"));
        } else {
            panic!("Expected NetworkError");
        }
    }
    
    #[test]
    fn test_get_all_error_records() {
        let handler = WebRtcErrorHandler::new(3, Duration::from_secs(1), Duration::from_secs(60));
        
        // Create multiple peers with errors
        let peer_id1 = PeerId("test1".to_string());
        let peer_id2 = PeerId("test2".to_string());
        
        // Record errors for peer 1
        handler.record_error(&peer_id1, WebRtcErrorType::Connection, "Connection failed".to_string());
        handler.record_error(&peer_id1, WebRtcErrorType::Signaling, "Signaling failed".to_string());
        
        // Record errors for peer 2
        handler.record_error(&peer_id2, WebRtcErrorType::Message, "Message failed".to_string());
        
        // Get all error records
        let all_records = handler.get_all_error_records();
        
        // Check that we have records for both peers
        assert_eq!(all_records.len(), 2);
        assert!(all_records.contains_key(&peer_id1));
        assert!(all_records.contains_key(&peer_id2));
        
        // Check peer 1 records
        let peer1_records = all_records.get(&peer_id1).unwrap();
        assert_eq!(peer1_records.len(), 2);
        
        // Check peer 2 records
        let peer2_records = all_records.get(&peer_id2).unwrap();
        assert_eq!(peer2_records.len(), 1);
        assert_eq!(peer2_records[0].error_type, WebRtcErrorType::Message);
    }
}