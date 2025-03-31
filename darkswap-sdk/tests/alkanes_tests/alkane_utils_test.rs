use darkswap_sdk::alkanes::{Alkane, AlkaneProperties};
use darkswap_sdk::types::AlkaneId;
use darkswap_sdk::error::Result;
use bitcoin::{
    Network,
    OutPoint,
    hashes::Hash,
};
use std::collections::HashMap;

#[test]
fn test_alkane_format_amount() -> Result<()> {
    // Create a test alkane with 8 decimals
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let mut properties = HashMap::new();
    properties.insert("website".to_string(), "https://example.com".to_string());
    
    let mut alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    alkane.properties = Some(AlkaneProperties {
        name: "Test Alkane".to_string(),
        description: Some("A test alkane for unit tests".to_string()),
        icon: None,
        metadata: properties,
    });
    
    // Test formatting different amounts
    assert_eq!(alkane.format_amount(0), "0");
    assert_eq!(alkane.format_amount(1), "0.00000001");
    assert_eq!(alkane.format_amount(10), "0.0000001");
    assert_eq!(alkane.format_amount(100), "0.000001");
    assert_eq!(alkane.format_amount(1000), "0.00001");
    assert_eq!(alkane.format_amount(10000), "0.0001");
    assert_eq!(alkane.format_amount(100000), "0.001");
    assert_eq!(alkane.format_amount(1000000), "0.01");
    assert_eq!(alkane.format_amount(10000000), "0.1");
    assert_eq!(alkane.format_amount(100000000), "1");
    assert_eq!(alkane.format_amount(1000000000), "10");
    assert_eq!(alkane.format_amount(10000000000), "100");
    assert_eq!(alkane.format_amount(100000000000), "1000");
    
    // Test with trailing zeros
    assert_eq!(alkane.format_amount(100000000 + 10000000), "1.1");
    assert_eq!(alkane.format_amount(100000000 + 1000000), "1.01");
    assert_eq!(alkane.format_amount(100000000 + 100000), "1.001");
    
    // Create a test alkane with 0 decimals
    let alkane_id = AlkaneId("ALKANE456".to_string());
    let mut alkane = Alkane::new(
        alkane_id.clone(),
        "TEST2".to_string(),
        "Test Alkane 2".to_string(),
        0,
        1_000_000,
        Some(1_000_000),
    );
    
    // Test formatting with 0 decimals
    assert_eq!(alkane.format_amount(0), "0");
    assert_eq!(alkane.format_amount(1), "1");
    assert_eq!(alkane.format_amount(10), "10");
    assert_eq!(alkane.format_amount(100), "100");
    assert_eq!(alkane.format_amount(1000), "1000");
    
    Ok(())
}

#[test]
fn test_alkane_parse_amount() -> Result<()> {
    // Create a test alkane with 8 decimals
    let alkane_id = AlkaneId("ALKANE123".to_string());
    let mut properties = HashMap::new();
    properties.insert("website".to_string(), "https://example.com".to_string());
    
    let mut alkane = Alkane::new(
        alkane_id.clone(),
        "TEST".to_string(),
        "Test Alkane".to_string(),
        8,
        1_000_000,
        Some(1_000_000),
    );
    
    alkane.properties = Some(AlkaneProperties {
        name: "Test Alkane".to_string(),
        description: Some("A test alkane for unit tests".to_string()),
        icon: None,
        metadata: properties,
    });
    
    // Test parsing different amounts
    assert_eq!(alkane.parse_amount("0")?, 0);
    assert_eq!(alkane.parse_amount("1")?, 100000000);
    assert_eq!(alkane.parse_amount("10")?, 1000000000);
    assert_eq!(alkane.parse_amount("0.1")?, 10000000);
    assert_eq!(alkane.parse_amount("0.01")?, 1000000);
    assert_eq!(alkane.parse_amount("0.001")?, 100000);
    assert_eq!(alkane.parse_amount("0.0001")?, 10000);
    assert_eq!(alkane.parse_amount("0.00001")?, 1000);
    assert_eq!(alkane.parse_amount("0.000001")?, 100);
    assert_eq!(alkane.parse_amount("0.0000001")?, 10);
    assert_eq!(alkane.parse_amount("0.00000001")?, 1);
    
    // Test with trailing zeros
    assert_eq!(alkane.parse_amount("1.1")?, 110000000);
    assert_eq!(alkane.parse_amount("1.01")?, 101000000);
    assert_eq!(alkane.parse_amount("1.001")?, 100100000);
    
    // Create a test alkane with 0 decimals
    let alkane_id = AlkaneId("ALKANE456".to_string());
    let mut alkane = Alkane::new(
        alkane_id.clone(),
        "TEST2".to_string(),
        "Test Alkane 2".to_string(),
        0,
        1_000_000,
        Some(1_000_000),
    );
    
    // Test parsing with 0 decimals
    assert_eq!(alkane.parse_amount("0")?, 0);
    assert_eq!(alkane.parse_amount("1")?, 1);
    assert_eq!(alkane.parse_amount("10")?, 10);
    assert_eq!(alkane.parse_amount("100")?, 100);
    assert_eq!(alkane.parse_amount("1000")?, 1000);
    
    // Test invalid formats
    assert!(alkane.parse_amount("invalid").is_err());
    assert!(alkane.parse_amount("1.1").is_err()); // Decimal not allowed for 0 decimals
    assert!(alkane.parse_amount("1.1.1").is_err()); // Multiple decimal points
    
    Ok(())
}

#[test]
fn test_alkane_from_rune() -> Result<()> {
    // Create a test rune
    let outpoint = OutPoint::new(bitcoin::Txid::from_hash(bitcoin::hashes::Hash::all_zeros()), 0);
    let rune_id = 123456789u128;
    let rune = darkswap_sdk::runes::Rune::new(
        rune_id,
        Some("TEST".to_string()),
        8,
        1_000_000,
        0,
        outpoint.clone(),
        0,
    );
    
    // Create properties for the alkane
    let mut properties = HashMap::new();
    properties.insert("website".to_string(), "https://example.com".to_string());
    
    let alkane_properties = AlkaneProperties {
        name: "Test Alkane".to_string(),
        description: Some("A test alkane from rune".to_string()),
        icon: None,
        metadata: properties,
    };
    
    // Create an alkane from the rune
    let alkane = Alkane::from_rune(&rune, alkane_properties);
    
    // Verify the alkane properties
    assert_eq!(alkane.id, AlkaneId(format!("ALKANE:{}", rune.id)));
    assert_eq!(alkane.symbol, "TEST");
    assert_eq!(alkane.decimals, 8);
    assert_eq!(alkane.supply, 1_000_000);
    assert_eq!(alkane.timestamp, 0);
    assert_eq!(alkane.etching_outpoint, outpoint);
    assert_eq!(alkane.etching_height, 0);
    assert!(alkane.properties.is_some());
    let props = alkane.properties.unwrap();
    assert_eq!(props.name, "Test Alkane");
    assert_eq!(props.description, Some("A test alkane from rune".to_string()));
    
    Ok(())
}