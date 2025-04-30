//! Example of trading runes and alkanes
//!
//! This example demonstrates how to create and manage orders for runes and alkanes.

use anyhow::Result;
use rust_decimal::Decimal;
use darkswap_sdk::{
    DarkSwap,
    config::Config,
    orderbook::OrderSide,
    types::{Asset, AlkaneId, RuneId, Event},
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    println!("DarkSwap started");
    
    // Create a rune ID
    let rune_id: RuneId = 123456789;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create a BTC/Rune sell order
    println!("Creating BTC/Rune sell order...");
    let btc_rune_order = darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Sell,
        Decimal::new(100, 0),  // 100 runes
        Decimal::new(1, 5),    // 0.00001 BTC per rune
        Some(3600),            // 1 hour expiry
    ).await?;
    
    println!("Created BTC/Rune sell order: {}", btc_rune_order.id);
    
    // Create a BTC/Alkane buy order
    println!("Creating BTC/Alkane buy order...");
    let btc_alkane_order = darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Buy,
        Decimal::new(50, 0),   // 50 alkanes
        Decimal::new(2, 5),    // 0.00002 BTC per alkane
        Some(7200),            // 2 hours expiry
    ).await?;
    
    println!("Created BTC/Alkane buy order: {}", btc_alkane_order.id);
    
    // Create a Rune/Alkane order
    println!("Creating Rune/Alkane order...");
    let rune_alkane_order = darkswap.create_order(
        Asset::Alkane(alkane_id.clone()),
        Asset::Rune(rune_id),
        OrderSide::Buy,
        Decimal::new(25, 0),   // 25 alkanes
        Decimal::new(10, 0),   // 10 runes per alkane
        Some(14400),           // 4 hours expiry
    ).await?;
    
    println!("Created Rune/Alkane order: {}", rune_alkane_order.id);
    
    // Get all BTC/Rune orders
    println!("Getting BTC/Rune orders...");
    let btc_rune_orders = darkswap.get_btc_rune_orders(rune_id).await?;
    
    println!("Found {} BTC/Rune orders", btc_rune_orders.len());
    
    // Get all BTC/Alkane orders
    println!("Getting BTC/Alkane orders...");
    let btc_alkane_orders = darkswap.get_btc_alkane_orders(&alkane_id).await?;
    
    println!("Found {} BTC/Alkane orders", btc_alkane_orders.len());
    
    // Get all Rune/Alkane orders
    println!("Getting Rune/Alkane orders...");
    let rune_alkane_orders = darkswap.get_orders(
        &Asset::Alkane(alkane_id.clone()),
        &Asset::Rune(rune_id),
    ).await?;
    
    println!("Found {} Rune/Alkane orders", rune_alkane_orders.len());
    
    // Get best bid and ask for BTC/Rune
    println!("Getting best bid and ask for BTC/Rune...");
    let (bid, ask) = darkswap.get_btc_rune_best_bid_ask(rune_id).await?;
    
    println!("BTC/Rune best bid: {:?}, best ask: {:?}", bid, ask);
    
    // Get best bid and ask for BTC/Alkane
    println!("Getting best bid and ask for BTC/Alkane...");
    let (bid, ask) = darkswap.get_btc_alkane_best_bid_ask(&alkane_id).await?;
    
    println!("BTC/Alkane best bid: {:?}, best ask: {:?}", bid, ask);
    
    // Get best bid and ask for Rune/Alkane
    println!("Getting best bid and ask for Rune/Alkane...");
    let (bid, ask) = darkswap.get_best_bid_ask(
        &Asset::Alkane(alkane_id.clone()),
        &Asset::Rune(rune_id),
    ).await?;
    
    println!("Rune/Alkane best bid: {:?}, best ask: {:?}", bid, ask);
    
    // Cancel the BTC/Rune order
    println!("Cancelling BTC/Rune order...");
    darkswap.cancel_order(&btc_rune_order.id).await?;
    
    println!("Cancelled BTC/Rune order");
    
    // Wait for events
    println!("Waiting for events...");
    for _ in 0..5 {
        if let Some(event) = darkswap.next_event().await {
            println!("Received event: {:?}", event);
        }
    }
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    println!("DarkSwap stopped");
    
    Ok(())
}