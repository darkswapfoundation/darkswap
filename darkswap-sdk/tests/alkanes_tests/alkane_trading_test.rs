use darkswap_sdk::alkanes::{Alkane, AlkaneProperties, AlkaneProtocol};
use darkswap_sdk::types::{AlkaneId, OrderSide, OrderStatus};
use darkswap_sdk::error::Result;
use darkswap_sdk::orderbook::{Order, OrderBook};
use darkswap_sdk::trade::Trade;
use bitcoin::{
    Network,
    OutPoint,
    Address,
    hashes::Hash,
};
use std::collections::HashMap;
use std::str::FromStr;
use darkswap_sdk::bitcoin_utils::{generate_test_address, generate_test_address_unchecked};
use rust_decimal::Decimal;

#[test]
fn test_alkane_order_creation() -> Result<()> {
    // Create a test alkane
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
    
    // Create an orderbook
    let mut orderbook = OrderBook::new();
    
    // Create a maker address
    let maker_address = generate_test_address_unchecked(Network::Regtest, 1)?;
    let maker_peer_id = "QmMaker".to_string();
    
    // Create an order for the alkane
    let base_asset = format!("alkane:{}", alkane_id.0);
    let quote_asset = "btc".to_string();
    let amount = Decimal::from_str("100")?;
    let price = Decimal::from_str("0.0001")?;
    let side = OrderSide::Sell;
    let timestamp = 1234567890;
    let expiry = 1234567890 + 86400; // 1 day expiry
    let order = Order::new(
        darkswap_sdk::types::PeerId(maker_peer_id.clone()),
        darkswap_sdk::types::Asset(base_asset.clone()),
        darkswap_sdk::types::Asset(quote_asset.clone()),
        darkswap_sdk::orderbook::OrderSide::Sell,
        amount,
        price,
        timestamp,
    );
    
    // Add the order to the orderbook
    orderbook.add_order(order.clone());
    
    // Verify the order was added
    let orders = orderbook.get_orders(&base_asset, &quote_asset);
    assert_eq!(orders.len(), 1);
    assert_eq!(orders[0].maker, maker_peer_id);
    assert_eq!(orders[0].base_asset, base_asset);
    assert_eq!(orders[0].quote_asset, quote_asset);
    assert_eq!(orders[0].side, side);
    assert_eq!(orders[0].amount, amount);
    assert_eq!(orders[0].price, price);
    assert_eq!(orders[0].timestamp, timestamp);
    assert_eq!(orders[0].expiry, expiry);
    assert_eq!(orders[0].status, OrderStatus::Open);
    
    // Get the best bid/ask
    let (bid, ask) = orderbook.get_best_bid_ask(&base_asset, &quote_asset);
    assert_eq!(bid, None); // No buy orders
    assert_eq!(ask, Some(price)); // Our sell order
    
    // Create a buy order
    let buy_order = Order::new(
        darkswap_sdk::types::PeerId("QmBuyer".to_string()),
        darkswap_sdk::types::Asset(base_asset.clone()),
        darkswap_sdk::types::Asset(quote_asset.clone()),
        darkswap_sdk::orderbook::OrderSide::Buy,
        amount,
        price,
        timestamp,
    );
    
    // Add the buy order to the orderbook
    orderbook.add_order(buy_order.clone());
    
    // Verify both orders are in the orderbook
    let orders = orderbook.get_orders(&base_asset, &quote_asset);
    assert_eq!(orders.len(), 2);
    
    // Get the best bid/ask again
    let (bid, ask) = orderbook.get_best_bid_ask(&base_asset, &quote_asset);
    assert_eq!(bid, Some(price)); // Our buy order
    assert_eq!(ask, Some(price)); // Our sell order
    
    Ok(())
}

#[test]
fn test_alkane_trade_creation() -> Result<()> {
    // Create a test alkane
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
    
    // Create an orderbook
    let mut orderbook = OrderBook::new();
    
    // Create maker and taker addresses
    let maker_peer_id = "QmMaker".to_string();
    let taker_peer_id = "QmTaker".to_string();
    
    // Create an order for the alkane
    let base_asset = format!("alkane:{}", alkane_id.0);
    let quote_asset = "btc".to_string();
    let amount = Decimal::from_str("100")?;
    let price = Decimal::from_str("0.0001")?;
    let side = OrderSide::Sell;
    let timestamp = 1234567890;
    let expiry = 1234567890 + 86400; // 1 day expiry
    let order = Order::new(
        darkswap_sdk::types::PeerId(maker_peer_id.clone()),
        darkswap_sdk::types::Asset(base_asset.clone()),
        darkswap_sdk::types::Asset(quote_asset.clone()),
        darkswap_sdk::orderbook::OrderSide::Sell,
        amount,
        price,
        timestamp,
    );
    
    // Add the order to the orderbook
    orderbook.add_order(order.clone());
    
    // Create a trade
    let trade = Trade::new(&order, taker_peer_id.clone(), amount);
    
    // Verify the trade properties
    assert_eq!(trade.order_id, order.id);
    assert_eq!(trade.maker, maker_peer_id.clone());
    assert_eq!(trade.taker, taker_peer_id.clone());
    assert_eq!(trade.base_asset, darkswap_sdk::types::Asset(base_asset.clone()));
    assert_eq!(trade.quote_asset, darkswap_sdk::types::Asset(quote_asset.clone()));
    assert_eq!(trade.side, darkswap_sdk::orderbook::OrderSide::Sell);
    assert_eq!(trade.amount, amount);
    assert_eq!(trade.price, price);
    
    Ok(())
}