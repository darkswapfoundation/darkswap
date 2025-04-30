//! Utility functions for the DarkSwap library.

use crate::error::{Error, Result};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Generate a unique ID.
pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

/// Get the current timestamp in seconds.
pub fn current_timestamp() -> u64 {
    Utc::now().timestamp() as u64
}

/// Get the current timestamp as a DateTime.
pub fn current_datetime() -> DateTime<Utc> {
    Utc::now()
}

/// Parse a timestamp from a string.
pub fn parse_timestamp(timestamp: &str) -> Result<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(timestamp)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| Error::Internal(format!("Failed to parse timestamp: {}", e)))
}

/// Format a timestamp as an RFC 3339 string.
pub fn format_timestamp(timestamp: DateTime<Utc>) -> String {
    timestamp.to_rfc3339()
}

/// Convert a string to a decimal.
pub fn parse_decimal(value: &str) -> Result<f64> {
    value
        .parse::<f64>()
        .map_err(|e| Error::Validation(format!("Failed to parse decimal: {}", e)))
}

/// Format a decimal as a string.
pub fn format_decimal(value: f64, precision: usize) -> String {
    format!("{:.1$}", value, precision)
}

/// Validate a Bitcoin address.
pub fn validate_bitcoin_address(address: &str) -> bool {
    // This is a simplified validation that just checks the format.
    // In a real implementation, you would use a Bitcoin library to validate the address.
    address.starts_with("1") || address.starts_with("3") || address.starts_with("bc1")
}

/// Validate a rune ID.
pub fn validate_rune_id(id: &str) -> bool {
    // This is a simplified validation that just checks the format.
    // In a real implementation, you would use a more sophisticated validation.
    id.len() <= 16 && id.chars().all(|c| c.is_alphanumeric())
}

/// Validate an alkane ID.
pub fn validate_alkane_id(id: &str) -> bool {
    // This is a simplified validation that just checks the format.
    // In a real implementation, you would use a more sophisticated validation.
    id.len() <= 16 && id.chars().all(|c| c.is_alphanumeric())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_id() {
        let id1 = generate_id();
        let id2 = generate_id();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_current_timestamp() {
        let timestamp = current_timestamp();
        assert!(timestamp > 0);
    }

    #[test]
    fn test_current_datetime() {
        let datetime = current_datetime();
        assert!(datetime.timestamp() > 0);
    }

    #[test]
    fn test_parse_timestamp() {
        let timestamp = "2023-01-01T00:00:00Z";
        let datetime = parse_timestamp(timestamp).unwrap();
        assert_eq!(datetime.to_rfc3339(), "2023-01-01T00:00:00+00:00");
    }

    #[test]
    fn test_format_timestamp() {
        let datetime = Utc::now();
        let formatted = format_timestamp(datetime);
        assert!(formatted.contains("T"));
        assert!(formatted.contains("Z") || formatted.contains("+"));
    }

    #[test]
    fn test_parse_decimal() {
        let value = "123.45";
        let decimal = parse_decimal(value).unwrap();
        assert_eq!(decimal, 123.45);
    }

    #[test]
    fn test_format_decimal() {
        let value = 123.456789;
        let formatted = format_decimal(value, 2);
        assert_eq!(formatted, "123.46");
    }

    #[test]
    fn test_validate_bitcoin_address() {
        assert!(validate_bitcoin_address("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"));
        assert!(validate_bitcoin_address("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"));
        assert!(validate_bitcoin_address("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"));
        assert!(!validate_bitcoin_address("invalid-address"));
    }

    #[test]
    fn test_validate_rune_id() {
        assert!(validate_rune_id("RUNE123"));
        assert!(validate_rune_id("123456789012345"));
        assert!(!validate_rune_id("RUNE123!"));
        assert!(!validate_rune_id("12345678901234567"));
    }

    #[test]
    fn test_validate_alkane_id() {
        assert!(validate_alkane_id("ALKANE123"));
        assert!(validate_alkane_id("123456789012345"));
        assert!(!validate_alkane_id("ALKANE123!"));
        assert!(!validate_alkane_id("12345678901234567"));
    }
}