//! Performance tests for DarkSwap

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    orderbook::{OrderSide, Orderbook},
    trade::{AssetType, TradeManager},
    types::Asset,
    wallet::simple_wallet::SimpleWallet,
    wasm::DarkSwapWasm,
};
use rust_decimal::Decimal;
use std::str::FromStr;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::mpsc;

#[tokio::test]
async fn test_orderbook_performance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a dummy P2P network
    let (network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    
    // Measure time to create 100 orders
    let start = Instant::now();
    
    for i in 0..100 {
        let side = if i % 2 == 0 { OrderSide::Buy } else { OrderSide::Sell };
        let price = Decimal::from_str(&format!("{}000.0", i % 10 + 1))?;
        
        orderbook.create_order(
            Asset::Bitcoin,
            Asset::Bitcoin,
            side,
            Decimal::from_str("1.0")?,
            price,
            None,
        ).await?;
    }
    
    let duration = start.elapsed();
    
    println!("Time to create 100 orders: {:?}", duration);
    
    // Check that the time is reasonable (less than 5 seconds)
    assert!(duration < Duration::from_secs(5));
    
    // Measure time to get all orders
    let start = Instant::now();
    
    let orders = orderbook.get_all_orders().await?;
    
    let duration = start.elapsed();
    
    println!("Time to get all orders: {:?}", duration);
    
    // Check that the time is reasonable (less than 1 second)
    assert!(duration < Duration::from_secs(1));
    
    // Check that all orders were created
    assert_eq!(orders.len(), 100);
    
    // Measure time to get best bid and ask
    let start = Instant::now();
    
    for _ in 0..100 {
        orderbook.get_best_bid_ask(&Asset::Bitcoin, &Asset::Bitcoin).await?;
    }
    
    let duration = start.elapsed();
    
    println!("Time to get best bid and ask 100 times: {:?}", duration);
    
    // Check that the time is reasonable (less than 1 second)
    assert!(duration < Duration::from_secs(1));
    
    Ok(())
}

#[tokio::test]
async fn test_trade_manager_performance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create a recipient address
    let recipient = bitcoin::Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Measure time to create 10 transfer PSBTs
    let start = Instant::now();
    
    for i in 0..10 {
        let amount = 100_000 * (i + 1);
        
        trade_manager.create_transfer_psbt(
            &AssetType::Bitcoin,
            amount,
            recipient.clone(),
            1.0,
        ).await?;
    }
    
    let duration = start.elapsed();
    
    println!("Time to create 10 transfer PSBTs: {:?}", duration);
    
    // Check that the time is reasonable (less than 5 seconds)
    assert!(duration < Duration::from_secs(5));
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "wasm")]
async fn test_wasm_initialization_performance() -> Result<()> {
    // Measure time to initialize DarkSwapWasm
    let start = Instant::now();
    
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = darkswap_sdk::wasm::WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    let duration = start.elapsed();
    
    println!("Time to initialize DarkSwapWasm: {:?}", duration);
    
    // Check that the time is reasonable (less than 5 seconds)
    assert!(duration < Duration::from_secs(5));
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[tokio::test]
#[cfg(feature = "wasm")]
async fn test_wasm_function_call_performance() -> Result<()> {
    // Create a DarkSwapWasm instance
    let darkswap = DarkSwapWasm::new();
    
    // Create a config
    let config = darkswap_sdk::wasm::WasmConfig {
        bitcoin_network: BitcoinNetwork::Testnet,
        relay_url: "wss://relay.example.com".to_string(),
        bootstrap_peers: vec!["peer1".to_string(), "peer2".to_string()],
        debug: true,
    };
    
    // Initialize DarkSwapWasm
    darkswap.initialize(config).await?;
    
    // Measure time to call get_address 100 times
    let start = Instant::now();
    
    for _ in 0..100 {
        darkswap.get_address().await?;
    }
    
    let duration = start.elapsed();
    
    println!("Time to call get_address 100 times: {:?}", duration);
    
    // Check that the time is reasonable (less than 1 second)
    assert!(duration < Duration::from_secs(1));
    
    // Measure time to create 10 orders
    let start = Instant::now();
    
    for i in 0..10 {
        darkswap.create_order(
            "buy",
            "BTC",
            "USD",
            &format!("{}.0", i + 1),
            &format!("{}000.0", i + 2),
            None,
        ).await?;
    }
    
    let duration = start.elapsed();
    
    println!("Time to create 10 orders: {:?}", duration);
    
    // Check that the time is reasonable (less than 5 seconds)
    assert!(duration < Duration::from_secs(5));
    
    // Shutdown DarkSwapWasm
    darkswap.shutdown().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_concurrent_operations_performance() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a dummy P2P network
    let (network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create orderbook
    let orderbook = Arc::new(Orderbook::new(network, wallet.clone(), event_sender));
    
    // Create trade manager
    let trade_manager = Arc::new(TradeManager::new(wallet));
    
    // Measure time to perform concurrent operations
    let start = Instant::now();
    
    // Create 10 tasks
    let mut tasks = Vec::new();
    
    for i in 0..10 {
        let orderbook_clone = orderbook.clone();
        let trade_manager_clone = trade_manager.clone();
        
        let task = tokio::spawn(async move {
            // Create an order
            let side = if i % 2 == 0 { OrderSide::Buy } else { OrderSide::Sell };
            let price = Decimal::from_str(&format!("{}000.0", i % 10 + 1)).unwrap();
            
            let order = orderbook_clone.create_order(
                Asset::Bitcoin,
                Asset::Bitcoin,
                side,
                Decimal::from_str("1.0").unwrap(),
                price,
                None,
            ).await.unwrap();
            
            // Get the order
            let retrieved_order = orderbook_clone.get_order(&order.id).await.unwrap();
            
            // Check that the retrieved order matches the created order
            assert_eq!(retrieved_order.id, order.id);
            
            // Get balance
            let balance = trade_manager_clone.balance(&AssetType::Bitcoin).await.unwrap();
            
            // Check that balance is a valid u64
            assert!(balance >= 0);
            
            // Get best bid and ask
            let (best_bid, best_ask) = orderbook_clone.get_best_bid_ask(&Asset::Bitcoin, &Asset::Bitcoin).await.unwrap();
            
            // Check that best bid and ask are valid
            if i % 2 == 0 {
                assert!(best_bid.is_some());
            } else {
                assert!(best_ask.is_some());
            }
        });
        
        tasks.push(task);
    }
    
    // Wait for all tasks to complete
    for task in tasks {
        task.await?;
    }
    
    let duration = start.elapsed();
    
    println!("Time to perform concurrent operations: {:?}", duration);
    
    // Check that the time is reasonable (less than 10 seconds)
    assert!(duration < Duration::from_secs(10));
    
    Ok(())
}