//! Simple trade example
//!
//! This example demonstrates how to use the DarkSwap SDK to create and take orders.

use std::str::FromStr;

use anyhow::Result;
use darkswap_sdk::{
    config::Config,
    orderbook::OrderSide,
    types::{Asset, Event},
    DarkSwap,
};
use rust_decimal::Decimal;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    println!("Starting DarkSwap simple trade example...");

    // Create configuration
    let mut config = Config::default();
    
    // Set wallet type to simple (in-memory wallet)
    config.wallet.wallet_type = "simple".to_string();
    
    // Create two DarkSwap instances (maker and taker)
    let mut maker = DarkSwap::new(config.clone())?;
    let mut taker = DarkSwap::new(config.clone())?;
    
    // Start both instances
    println!("Starting maker...");
    maker.start().await?;
    
    println!("Starting taker...");
    taker.start().await?;
    
    // Get wallet addresses
    let maker_address = maker.get_address().await?;
    let taker_address = taker.get_address().await?;
    
    println!("Maker address: {}", maker_address);
    println!("Taker address: {}", taker_address);
    
    // Get wallet balances
    let maker_balance = maker.get_balance().await?;
    let taker_balance = taker.get_balance().await?;
    
    println!("Maker balance: {} satoshis", maker_balance);
    println!("Taker balance: {} satoshis", taker_balance);
    
    // Create an order (maker)
    println!("Creating order...");
    let order = maker.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Sell,
        Decimal::from_str("0.01")?, // 0.01 BTC
        Decimal::from_str("20000")?, // 20,000 BTC/USD
        Some(3600), // 1 hour expiry
    ).await?;
    
    println!("Order created: {:?}", order);
    
    // Wait for the order to propagate
    println!("Waiting for order to propagate...");
    sleep(Duration::from_secs(2)).await;
    
    // Take the order (taker)
    println!("Taking order...");
    let trade = taker.take_order(&order.id, Decimal::from_str("0.005")?).await?;
    
    println!("Trade created: {:?}", trade);
    
    // Process events
    println!("Processing events...");
    
    // Spawn a task to process maker events
    let maker_handle = tokio::spawn(async move {
        while let Some(event) = maker.next_event().await {
            println!("Maker event: {:?}", event);
            
            match event {
                Event::TradeCompleted(trade) => {
                    println!("Maker: Trade completed: {:?}", trade);
                    break;
                }
                Event::TradeFailed(trade) => {
                    println!("Maker: Trade failed: {:?}", trade);
                    break;
                }
                _ => {}
            }
        }
    });
    
    // Process taker events
    while let Some(event) = taker.next_event().await {
        println!("Taker event: {:?}", event);
        
        match event {
            Event::TradeCompleted(trade) => {
                println!("Taker: Trade completed: {:?}", trade);
                break;
            }
            Event::TradeFailed(trade) => {
                println!("Taker: Trade failed: {:?}", trade);
                break;
            }
            _ => {}
        }
    }
    
    // Wait for maker to finish
    maker_handle.await?;
    
    println!("Trade completed successfully!");
    
    Ok(())
}