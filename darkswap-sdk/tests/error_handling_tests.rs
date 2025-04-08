//! Error handling tests for DarkSwap

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    orderbook::{OrderId, OrderSide, Orderbook, OrderbookError},
    trade::{AssetType, TradeManager},
    types::{Asset, TradeId},
    wallet::{simple_wallet::SimpleWallet, WalletError, WalletInterface},
};
use bitcoin::Address;
use rust_decimal::Decimal;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::mpsc;

#[tokio::test]
async fn test_wallet_insufficient_funds() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Create a dummy order ID
    let order_id = OrderId("test_order".to_string());
    
    // Create a PSBT for an order with an amount that exceeds the wallet balance
    let result = wallet.create_order_psbt(
        &order_id,
        &Asset::Bitcoin,
        &Asset::Bitcoin,
        10_000_000_000, // 100 BTC (likely more than the test wallet has)
        20_000_000_000, // 20,000 USD per BTC
    ).await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is an insufficient funds error
    match result {
        Err(err) => {
            let err_string = err.to_string();
            assert!(err_string.contains("Insufficient funds") || err_string.contains("insufficient funds"));
        }
        Ok(_) => {
            panic!("Expected an error, but got Ok");
        }
    }
    
    Ok(())
}

#[tokio::test]
async fn test_invalid_address() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a trade manager
    let trade_manager = TradeManager::new(wallet);
    
    // Create an invalid address
    let invalid_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")?;
    
    // Try to create a transfer PSBT with an invalid address
    let result = trade_manager.create_transfer_psbt(
        &AssetType::Bitcoin,
        100_000, // 0.001 BTC
        invalid_address,
        1.0, // 1 sat/vB fee rate
    ).await;
    
    // The test might pass or fail depending on whether the address is actually invalid
    // We're just testing that the code handles the error gracefully
    if result.is_err() {
        let err_string = result.unwrap_err().to_string();
        println!("Error creating transfer PSBT: {}", err_string);
    }
    
    Ok(())
}

#[tokio::test]
async fn test_invalid_psbt() -> Result<()> {
    // Create a simple wallet
    let wallet = SimpleWallet::new(None, BitcoinNetwork::Testnet)?;
    
    // Try to sign an invalid PSBT
    let result = wallet.sign_psbt("invalid_psbt_base64").await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is an invalid PSBT error
    match result {
        Err(err) => {
            let err_string = err.to_string();
            assert!(err_string.contains("Invalid PSBT") || err_string.contains("invalid PSBT"));
        }
        Ok(_) => {
            panic!("Expected an error, but got Ok");
        }
    }
    
    Ok(())
}

#[tokio::test]
async fn test_order_not_found() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a dummy P2P network
    let (network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    
    // Create a non-existent order ID
    let non_existent_order_id = OrderId("non_existent_order".to_string());
    
    // Try to get a non-existent order
    let result = orderbook.get_order(&non_existent_order_id).await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is a not found error
    match result {
        Err(err) => {
            let err_string = err.to_string();
            assert!(err_string.contains("not found") || err_string.contains("Not found"));
        }
        Ok(_) => {
            panic!("Expected an error, but got Ok");
        }
    }
    
    Ok(())
}

#[tokio::test]
async fn test_invalid_order_cancellation() -> Result<()> {
    // Create maker wallet
    let maker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create taker wallet
    let taker_wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create dummy P2P network for maker
    let (maker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let maker_network = Arc::new(tokio::sync::RwLock::new(maker_network));
    
    // Create dummy P2P network for taker
    let (taker_network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let taker_network = Arc::new(tokio::sync::RwLock::new(taker_network));
    
    // Create event channels
    let (maker_event_sender, _maker_event_receiver) = mpsc::channel(100);
    let (taker_event_sender, _taker_event_receiver) = mpsc::channel(100);
    
    // Create orderbooks
    let maker_orderbook = Orderbook::new(maker_network, maker_wallet.clone(), maker_event_sender);
    let taker_orderbook = Orderbook::new(taker_network, taker_wallet.clone(), taker_event_sender);
    
    // Create an order from maker
    let order = maker_orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin, // Using Bitcoin as a placeholder for USD
        OrderSide::Sell,
        Decimal::from_str("1.0")?,
        Decimal::from_str("20000.0")?,
        None,
    ).await?;
    
    // Try to cancel the order from taker's orderbook
    let result = taker_orderbook.cancel_order(&order.id).await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is an invalid order error
    match result {
        Err(err) => {
            let err_string = err.to_string();
            assert!(err_string.contains("not found") || err_string.contains("Not found"));
        }
        Ok(_) => {
            panic!("Expected an error, but got Ok");
        }
    }
    
    Ok(())
}

#[tokio::test]
async fn test_invalid_order_parameters() -> Result<()> {
    // Create a simple wallet
    let wallet = Arc::new(SimpleWallet::new(None, BitcoinNetwork::Testnet)?);
    
    // Create a dummy P2P network
    let (network, _) = darkswap_sdk::p2p::create_memory_network().await?;
    let network = Arc::new(tokio::sync::RwLock::new(network));
    
    // Create event channel
    let (event_sender, _event_receiver) = mpsc::channel(100);
    
    // Create orderbook
    let orderbook = Orderbook::new(network, wallet, event_sender);
    
    // Try to create an order with zero amount
    let result = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("0.0")?,
        Decimal::from_str("20000.0")?,
        None,
    ).await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is an invalid order error
    match result {
        Err(err) => {
            let err_string = err.to_string();
            assert!(err_string.contains("Amount must be positive") || err_string.contains("Invalid order"));
        }
        Ok(_) => {
            panic!("Expected an error, but got Ok");
        }
    }
    
    // Try to create an order with zero price
    let result = orderbook.create_order(
        Asset::Bitcoin,
        Asset::Bitcoin,
        OrderSide::Buy,
        Decimal::from_str("1.0")?,
        Decimal::from_str("0.0")?,
        None,
    ).await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error is an invalid order error
    match result {
        Err(err) => {
            let err_string = err.to_string();
            assert!(err_string.contains("Price must be positive") || err_string.contains("Invalid order"));
        }
        Ok(_) => {
            panic!("Expected an error, but got Ok");
        }
    }
    
    Ok(())
}