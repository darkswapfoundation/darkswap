//! Utility functions for DarkSwap Bridge
//!
//! This module provides utility functions for the DarkSwap Bridge.

use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::error::{Error, Result};

/// Get the current timestamp in seconds
pub fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs()
}

/// Get the current timestamp in milliseconds
pub fn current_timestamp_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis()
}

/// Generate a random ID
pub fn generate_id() -> String {
    use rand::{rngs::OsRng, RngCore};
    
    let mut bytes = [0u8; 16];
    OsRng.fill_bytes(&mut bytes);
    
    hex::encode(bytes)
}

/// Get the home directory
pub fn home_dir() -> Result<PathBuf> {
    dirs::home_dir().ok_or_else(|| Error::OtherError("Failed to get home directory".to_string()))
}

/// Get the config directory
pub fn config_dir() -> Result<PathBuf> {
    dirs::config_dir().ok_or_else(|| Error::OtherError("Failed to get config directory".to_string()))
}

/// Get the data directory
pub fn data_dir() -> Result<PathBuf> {
    dirs::data_dir().ok_or_else(|| Error::OtherError("Failed to get data directory".to_string()))
}

/// Get the cache directory
pub fn cache_dir() -> Result<PathBuf> {
    dirs::cache_dir().ok_or_else(|| Error::OtherError("Failed to get cache directory".to_string()))
}

/// Format a satoshi amount as BTC
pub fn format_btc(satoshis: u64) -> String {
    let btc = satoshis as f64 / 100_000_000.0;
    format!("{:.8} BTC", btc)
}

/// Parse a BTC amount as satoshis
pub fn parse_btc(btc: &str) -> Result<u64> {
    let btc = btc.trim();
    
    // Remove "BTC" suffix if present
    let btc = btc.trim_end_matches("BTC").trim();
    
    // Parse as f64
    let btc = btc.parse::<f64>().map_err(|e| {
        Error::InvalidArgumentError(format!("Failed to parse BTC amount: {}", e))
    })?;
    
    // Convert to satoshis
    let satoshis = (btc * 100_000_000.0).round() as u64;
    
    Ok(satoshis)
}

/// Format a satoshi amount as sats
pub fn format_sats(satoshis: u64) -> String {
    format!("{} sats", satoshis)
}

/// Parse a sats amount as satoshis
pub fn parse_sats(sats: &str) -> Result<u64> {
    let sats = sats.trim();
    
    // Remove "sats" suffix if present
    let sats = sats.trim_end_matches("sats").trim();
    
    // Parse as u64
    let satoshis = sats.parse::<u64>().map_err(|e| {
        Error::InvalidArgumentError(format!("Failed to parse sats amount: {}", e))
    })?;
    
    Ok(satoshis)
}

/// Format a timestamp as a human-readable date
pub fn format_date(timestamp: u64) -> String {
    use chrono::{DateTime, Local, TimeZone};
    
    let datetime = Local.timestamp_opt(timestamp as i64, 0).unwrap();
    datetime.format("%Y-%m-%d %H:%M:%S").to_string()
}

/// Format a duration in seconds as a human-readable string
pub fn format_duration(seconds: u64) -> String {
    let days = seconds / (24 * 60 * 60);
    let hours = (seconds % (24 * 60 * 60)) / (60 * 60);
    let minutes = (seconds % (60 * 60)) / 60;
    let seconds = seconds % 60;
    
    if days > 0 {
        format!("{}d {}h {}m {}s", days, hours, minutes, seconds)
    } else if hours > 0 {
        format!("{}h {}m {}s", hours, minutes, seconds)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, seconds)
    } else {
        format!("{}s", seconds)
    }
}

/// Truncate a string to a maximum length
pub fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len - 3])
    }
}

/// Truncate a transaction ID
pub fn truncate_txid(txid: &str) -> String {
    if txid.len() <= 10 {
        txid.to_string()
    } else {
        format!("{}...{}", &txid[..6], &txid[txid.len() - 4..])
    }
}

/// Truncate an address
pub fn truncate_address(address: &str) -> String {
    if address.len() <= 10 {
        address.to_string()
    } else {
        format!("{}...{}", &address[..6], &address[address.len() - 4..])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_current_timestamp() {
        let timestamp = current_timestamp();
        assert!(timestamp > 0);
    }
    
    #[test]
    fn test_current_timestamp_millis() {
        let timestamp = current_timestamp_millis();
        assert!(timestamp > 0);
    }
    
    #[test]
    fn test_generate_id() {
        let id1 = generate_id();
        let id2 = generate_id();
        
        assert_eq!(id1.len(), 32);
        assert_eq!(id2.len(), 32);
        assert_ne!(id1, id2);
    }
    
    #[test]
    fn test_format_parse_btc() {
        let satoshis = 123456789;
        let btc = format_btc(satoshis);
        assert_eq!(btc, "1.23456789 BTC");
        
        let parsed = parse_btc(&btc).unwrap();
        assert_eq!(parsed, satoshis);
    }
    
    #[test]
    fn test_format_parse_sats() {
        let satoshis = 123456789;
        let sats = format_sats(satoshis);
        assert_eq!(sats, "123456789 sats");
        
        let parsed = parse_sats(&sats).unwrap();
        assert_eq!(parsed, satoshis);
    }
    
    #[test]
    fn test_format_date() {
        let timestamp = 1617235678;
        let date = format_date(timestamp);
        assert!(!date.is_empty());
    }
    
    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(30), "30s");
        assert_eq!(format_duration(90), "1m 30s");
        assert_eq!(format_duration(3600), "1h 0m 0s");
        assert_eq!(format_duration(86400), "1d 0h 0m 0s");
        assert_eq!(format_duration(90061), "1d 1h 1m 1s");
    }
    
    #[test]
    fn test_truncate() {
        assert_eq!(truncate("Hello", 10), "Hello");
        assert_eq!(truncate("Hello, world!", 10), "Hello,...");
    }
    
    #[test]
    fn test_truncate_txid() {
        assert_eq!(truncate_txid("1234567890"), "1234567890");
        assert_eq!(truncate_txid("1a2b3c4d5e6f7g8h9i0j"), "1a2b3c...0j");
    }
    
    #[test]
    fn test_truncate_address() {
        assert_eq!(truncate_address("1234567890"), "1234567890");
        assert_eq!(truncate_address("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"), "bc1qar...mdq");
    }
}