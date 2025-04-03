//! Formatting utilities for the DarkSwap platform.

use darkswap_lib::{Error, Result};

/// Format a Bitcoin amount as a string.
pub fn format_btc(amount: f64) -> String {
    format!("{:.8} BTC", amount)
}

/// Format a Rune amount as a string.
pub fn format_rune(amount: f64, rune_id: &str) -> String {
    format!("{:.2} RUNE:{}", amount, rune_id)
}

/// Format an Alkane amount as a string.
pub fn format_alkane(amount: f64, alkane_id: &str) -> String {
    format!("{:.2} ALKANE:{}", amount, alkane_id)
}

/// Format a price as a string.
pub fn format_price(price: f64) -> String {
    format!("{:.2}", price)
}

/// Format a timestamp as a human-readable string.
pub fn format_timestamp(timestamp: u64) -> String {
    use chrono::{DateTime, TimeZone, Utc};
    let datetime = Utc.timestamp_opt(timestamp as i64, 0).unwrap();
    datetime.format("%Y-%m-%d %H:%M:%S UTC").to_string()
}

/// Format a duration as a human-readable string.
pub fn format_duration(seconds: u64) -> String {
    let days = seconds / 86400;
    let hours = (seconds % 86400) / 3600;
    let minutes = (seconds % 3600) / 60;
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

/// Format a file size as a human-readable string.
pub fn format_file_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;
    const TB: u64 = GB * 1024;

    if bytes < KB {
        format!("{} B", bytes)
    } else if bytes < MB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else if bytes < GB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes < TB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else {
        format!("{:.2} TB", bytes as f64 / TB as f64)
    }
}

/// Parse a Bitcoin amount from a string.
pub fn parse_btc(amount: &str) -> Result<f64> {
    let amount = amount
        .trim()
        .trim_end_matches("BTC")
        .trim()
        .parse::<f64>()
        .map_err(|e| Error::Validation(format!("Invalid BTC amount: {}", e)))?;
    Ok(amount)
}

/// Parse a Rune amount from a string.
pub fn parse_rune(amount: &str) -> Result<(f64, String)> {
    let parts: Vec<&str> = amount.trim().split_whitespace().collect();
    if parts.len() != 2 {
        return Err(Error::Validation(format!(
            "Invalid Rune amount format: {}",
            amount
        )));
    }

    let amount = parts[0]
        .parse::<f64>()
        .map_err(|e| Error::Validation(format!("Invalid Rune amount: {}", e)))?;

    let rune_id = parts[1]
        .trim_start_matches("RUNE:")
        .to_string();

    Ok((amount, rune_id))
}

/// Parse an Alkane amount from a string.
pub fn parse_alkane(amount: &str) -> Result<(f64, String)> {
    let parts: Vec<&str> = amount.trim().split_whitespace().collect();
    if parts.len() != 2 {
        return Err(Error::Validation(format!(
            "Invalid Alkane amount format: {}",
            amount
        )));
    }

    let amount = parts[0]
        .parse::<f64>()
        .map_err(|e| Error::Validation(format!("Invalid Alkane amount: {}", e)))?;

    let alkane_id = parts[1]
        .trim_start_matches("ALKANE:")
        .to_string();

    Ok((amount, alkane_id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_btc() {
        assert_eq!(format_btc(1.23456789), "1.23456789 BTC");
        assert_eq!(format_btc(0.00000001), "0.00000001 BTC");
    }

    #[test]
    fn test_format_rune() {
        assert_eq!(format_rune(1.23, "ABC"), "1.23 RUNE:ABC");
        assert_eq!(format_rune(0.01, "XYZ"), "0.01 RUNE:XYZ");
    }

    #[test]
    fn test_format_alkane() {
        assert_eq!(format_alkane(1.23, "ABC"), "1.23 ALKANE:ABC");
        assert_eq!(format_alkane(0.01, "XYZ"), "0.01 ALKANE:XYZ");
    }

    #[test]
    fn test_format_price() {
        assert_eq!(format_price(1.23), "1.23");
        assert_eq!(format_price(0.01), "0.01");
    }

    #[test]
    fn test_format_timestamp() {
        assert_eq!(format_timestamp(0), "1970-01-01 00:00:00 UTC");
        assert_eq!(format_timestamp(1609459200), "2021-01-01 00:00:00 UTC");
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
    fn test_format_file_size() {
        assert_eq!(format_file_size(500), "500 B");
        assert_eq!(format_file_size(1500), "1.46 KB");
        assert_eq!(format_file_size(1500000), "1.43 MB");
        assert_eq!(format_file_size(1500000000), "1.40 GB");
        assert_eq!(format_file_size(1500000000000), "1.36 TB");
    }

    #[test]
    fn test_parse_btc() {
        assert_eq!(parse_btc("1.23456789 BTC").unwrap(), 1.23456789);
        assert_eq!(parse_btc("0.00000001").unwrap(), 0.00000001);
    }

    #[test]
    fn test_parse_rune() {
        let (amount, rune_id) = parse_rune("1.23 RUNE:ABC").unwrap();
        assert_eq!(amount, 1.23);
        assert_eq!(rune_id, "ABC");
    }

    #[test]
    fn test_parse_alkane() {
        let (amount, alkane_id) = parse_alkane("1.23 ALKANE:ABC").unwrap();
        assert_eq!(amount, 1.23);
        assert_eq!(alkane_id, "ABC");
    }
}