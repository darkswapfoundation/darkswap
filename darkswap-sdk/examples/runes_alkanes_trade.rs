//! Example of trading runes and alkanes
//!
//! This example demonstrates how to create and execute trades involving runes and alkanes.

use anyhow::Result;
use rust_decimal::Decimal;
use std::sync::Arc;
use tokio::sync::mpsc;

use darkswap_sdk::{
    config::Config,
    orderbook::{Order, OrderSide},
    types::{Asset, Event, RuneId, AlkaneId},
    DarkSwap,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a DarkSwap instance
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    // Create a channel to receive events
    let (event_sender, mut event_receiver) = mpsc::channel(100);
    
    // Subscribe to events
    let mut event_subscription = darkswap.subscribe_to_events().await;
    
    // Spawn a task to forward events
    tokio::spawn(async move {
        while let Some(event) = event_subscription.recv().await {
            let _ = event_sender.send(event).await;
        }
    });
    
    // Create a rune ID
    let rune_id = 123456789;
    
    // Create an alkane ID
    let alkane_id = AlkaneId("test_alkane".to_string());
    
    // Create a BTC/Rune sell order
    println!("Creating a BTC/Rune sell order...");
    let btc_rune_order = darkswap.create_btc_rune_order(
        rune_id,
        OrderSide::Sell,
        Decimal::new(100, 0),  // 100 runes
        Decimal::new(1, 5),    // 0.00001 BTC per rune
        Some(3600),            // 1 hour expiry
    ).await?;
    
    println!("BTC/Rune sell order created: {}", btc_rune_order.id.0);
    
    // Create a BTC/Alkane sell order
    println!("Creating a BTC/Alkane sell order...");
    let btc_alkane_order = darkswap.create_btc_alkane_order(
        alkane_id.clone(),
        OrderSide::Sell,
        Decimal::new(200, 0),  // 200 alkanes
        Decimal::new(2, 5),    // 0.00002 BTC per alkane
        Some(3600),            // 1 hour expiry
    ).await?;
    
    println!("BTC/Alkane sell order created: {}", btc_alkane_order.id.0);
    
    // Get all BTC/Rune orders
    println!("Getting all BTC/Rune orders...");
    let btc_rune_orders = darkswap.get_btc_rune_orders(rune_id).await?;
    
    println!("Found {} BTC/Rune orders", btc_rune_orders.len());
    for order in &btc_rune_orders {
        println!("  Order {}: {} {} at {} BTC", order.id.0, order.amount, order.base_asset, order.price);
    }
    
    // Get all BTC/Alkane orders
    println!("Getting all BTC/Alkane orders...");
    let btc_alkane_orders = darkswap.get_btc_alkane_orders(&alkane_id).await?;
    
    println!("Found {} BTC/Alkane orders", btc_alkane_orders.len());
    for order in &btc_alkane_orders {
        println!("  Order {}: {} {} at {} BTC", order.id.0, order.amount, order.base_asset, order.price);
    }
    
    // Get best bid and ask for BTC/Rune
    println!("Getting best bid and ask for BTC/Rune...");
    let (bid, ask) = darkswap.get_btc_rune_best_bid_ask(rune_id).await?;
    
    println!("BTC/Rune best bid: {:?}", bid);
    println!("BTC/Rune best ask: {:?}", ask);
    
    // Get best bid and ask for BTC/Alkane
    println!("Getting best bid and ask for BTC/Alkane...");
    let (bid, ask) = darkswap.get_btc_alkane_best_bid_ask(&alkane_id).await?;
    
    println!("BTC/Alkane best bid: {:?}", bid);
    println!("BTC/Alkane best ask: {:?}", ask);
    
    // Execute a trade for the BTC/Rune order
    println!("Executing a trade for the BTC/Rune order...");
    let trade = darkswap.create_trade(&btc_rune_orders[0], Decimal::new(50, 0)).await?;
    
    println!("Trade created: {}", trade.id.0);
    
    // Wait for trade events
    println!("Waiting for trade events...");
    while let Some(event) = event_receiver.recv().await {
        match event {
            Event::TradeStarted(trade_id) => {
                println!("Trade started: {}", trade_id.0);
            }
            Event::TradeCompleted(trade_id) => {
                println!("Trade completed: {}", trade_id.0);
                break;
            }
            Event::TradeFailed(trade_id) => {
                println!("Trade failed: {}", trade_id.0);
                break;
            }
            _ => {}
        }
    }
    
    // Execute a trade for the BTC/Alkane order
    println!("Executing a trade for the BTC/Alkane order...");
    let trade = darkswap.create_trade(&btc_alkane_orders[0], Decimal::new(100, 0)).await?;
    
    println!("Trade created: {}", trade.id.0);
    
    // Wait for trade events
    println!("Waiting for trade events...");
    while let Some(event) = event_receiver.recv().await {
        match event {
            Event::TradeStarted(trade_id) => {
                println!("Trade started: {}", trade_id.0);
            }
            Event::TradeCompleted(trade_id) => {
                println!("Trade completed: {}", trade_id.0);
                break;
            }
            Event::TradeFailed(trade_id) => {
                println!("Trade failed: {}", trade_id.0);
                break;
            }
            _ => {}
        }
    }
    
    // Create a predicate alkane trade
    println!("Creating a predicate alkane trade...");
    
    // Create an equality predicate alkane
    let left_alkane_id = AlkaneId("left_alkane".to_string());
    let right_alkane_id = AlkaneId("right_alkane".to_string());
    
    let predicate = darkswap.create_equality_predicate_alkane(
        left_alkane_id.clone(),
        100,
        right_alkane_id.clone(),
        200,
    );
    
    println!("Equality predicate alkane created");
    
    // Create a time-locked predicate alkane
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let time_locked_predicate = darkswap.create_time_locked_between_predicate_alkane(
        alkane_id.clone(),
        100,
        now - 3600, // 1 hour ago
        now + 3600, // 1 hour from now
    );
    
    println!("Time-locked predicate alkane created");
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    println!("DarkSwap stopped");
    
    Ok(())
}