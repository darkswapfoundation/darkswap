//! Performance optimization example
//!
//! This example demonstrates how to use the performance profiling and optimization features
//! of the DarkSwap SDK.

use anyhow::Result;
use std::time::Duration;
use tokio::time;

use darkswap_sdk::{
    config::Config,
    DarkSwap,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Create a configuration with performance profiling enabled
    let mut config = Config::default();
    config.performance.enabled = true;
    config.performance.enable_caching = true;
    config.performance.profile_critical_paths = true;
    
    // Create a DarkSwap instance
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    darkswap.start().await?;
    
    println!("Performance profiling enabled: {}", config.performance.enabled);
    println!("Caching enabled: {}", config.performance.enable_caching);
    println!("Profile critical paths: {}", config.performance.profile_critical_paths);
    
    // Perform some operations to profile
    println!("\nPerforming operations to profile...");
    
    // Get wallet address
    let address = darkswap.get_address().await?;
    println!("Wallet address: {}", address);
    
    // Get wallet balance
    let balance = darkswap.get_balance().await?;
    println!("Wallet balance: {} satoshis", balance);
    
    // Create some orders
    for i in 0..5 {
        let price = rust_decimal::Decimal::new(1000 + i, 2); // 10.00 + i/100
        let amount = rust_decimal::Decimal::new(100, 2); // 1.00
        
        let order = darkswap.create_order(
            darkswap_sdk::types::Asset::Bitcoin,
            darkswap_sdk::types::Asset::Bitcoin,
            darkswap_sdk::orderbook::OrderSide::Buy,
            amount,
            price,
            Some(3600),
        ).await?;
        
        println!("Created order {}: {} BTC at {} BTC", order.id.0, amount, price);
    }
    
    // Get orders
    let orders = darkswap.get_orders(
        &darkswap_sdk::types::Asset::Bitcoin,
        &darkswap_sdk::types::Asset::Bitcoin,
    ).await?;
    
    println!("Found {} orders", orders.len());
    
    // Get best bid and ask
    let (bid, ask) = darkswap.get_best_bid_ask(
        &darkswap_sdk::types::Asset::Bitcoin,
        &darkswap_sdk::types::Asset::Bitcoin,
    ).await?;
    
    println!("Best bid: {:?}", bid);
    println!("Best ask: {:?}", ask);
    
    // Wait a bit to collect metrics
    println!("\nWaiting for metrics collection...");
    time::sleep(Duration::from_secs(1)).await;
    
    // Print performance metrics
    println!("\nPerformance metrics:");
    darkswap.print_performance_metrics().await?;
    
    // Test caching
    println!("\nTesting caching...");
    
    // Enable caching for orderbook operations
    darkswap.enable_cache("orderbook").await?;
    
    // Perform the same operation multiple times
    println!("Performing the same operation multiple times...");
    
    for i in 0..5 {
        let start = std::time::Instant::now();
        
        let orders = darkswap.get_orders(
            &darkswap_sdk::types::Asset::Bitcoin,
            &darkswap_sdk::types::Asset::Bitcoin,
        ).await?;
        
        let duration = start.elapsed();
        println!("Iteration {}: Found {} orders in {:?}", i, orders.len(), duration);
    }
    
    // Print performance metrics again
    println!("\nPerformance metrics after caching:");
    darkswap.print_performance_metrics().await?;
    
    // Clear cache
    println!("\nClearing cache...");
    darkswap.clear_cache("orderbook").await?;
    
    // Perform the operation again
    println!("Performing the operation again after clearing cache...");
    
    let start = std::time::Instant::now();
    
    let orders = darkswap.get_orders(
        &darkswap_sdk::types::Asset::Bitcoin,
        &darkswap_sdk::types::Asset::Bitcoin,
    ).await?;
    
    let duration = start.elapsed();
    println!("Found {} orders in {:?}", orders.len(), duration);
    
    // Reset performance metrics
    println!("\nResetting performance metrics...");
    darkswap.reset_performance_metrics().await?;
    
    // Print performance metrics after reset
    println!("\nPerformance metrics after reset:");
    darkswap.print_performance_metrics().await?;
    
    // Disable performance profiling
    println!("\nDisabling performance profiling...");
    darkswap.disable_performance_profiling()?;
    
    // Stop DarkSwap
    darkswap.stop().await?;
    
    println!("\nDarkSwap stopped successfully");
    
    Ok(())
}