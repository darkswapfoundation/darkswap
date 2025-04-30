//! Tests for the API client

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    network::ApiClient,
    orderbook::{OrderSide, OrderStatus},
    types::{Asset, TradeId},
};
use rust_decimal::Decimal;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
struct MockApiServer {
    responses: Arc<RwLock<Vec<String>>>,
    requests: Arc<RwLock<Vec<String>>>,
}

impl MockApiServer {
    fn new() -> Self {
        Self {
            responses: Arc::new(RwLock::new(Vec::new())),
            requests: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    async fn add_response(&self, response: String) {
        let mut responses = self.responses.write().await;
        responses.push(response);
    }
    
    async fn get_request(&self, index: usize) -> Option<String> {
        let requests = self.requests.read().await;
        requests.get(index).cloned()
    }
    
    async fn handle_request(&self, request: String) -> String {
        let mut requests = self.requests.write().await;
        requests.push(request);
        
        let responses = self.responses.read().await;
        if responses.is_empty() {
            return "{}".to_string();
        }
        
        responses[responses.len() - 1].clone()
    }
}

#[tokio::test]
async fn test_api_client_initialization() -> Result<()> {
    // Create a mock API server
    let server = MockApiServer::new();
    
    // Create an API client
    let client = ApiClient::new(
        "http://localhost:8080",
        Box::new(move |request| {
            let server = server.clone();
            Box::pin(async move {
                server.handle_request(request).await
            })
        }),
    );
    
    // Check that the client is not null
    assert!(client.is_ok());
    
    Ok(())
}

#[tokio::test]
async fn test_api_client_get_balances() -> Result<()> {
    // Create a mock API server
    let server = MockApiServer::new();
    
    // Add a response for the get_balances request
    server.add_response(r#"
    [
        {
            "asset": "BTC",
            "balance": "1.0",
            "available": "0.5",
            "locked": "0.5"
        },
        {
            "asset": "RUNE:12345",
            "balance": "1000.0",
            "available": "1000.0",
            "locked": "0.0"
        }
    ]
    "#.to_string()).await;
    
    // Create an API client
    let client = ApiClient::new(
        "http://localhost:8080",
        Box::new(move |request| {
            let server = server.clone();
            Box::pin(async move {
                server.handle_request(request).await
            })
        }),
    )?;
    
    // Get balances
    let balances = client.get_balances().await?;
    
    // Check that the balances are correct
    assert_eq!(balances.len(), 2);
    assert_eq!(balances[0].asset, "BTC");
    assert_eq!(balances[0].balance, "1.0");
    assert_eq!(balances[0].available, "0.5");
    assert_eq!(balances[0].locked, "0.5");
    assert_eq!(balances[1].asset, "RUNE:12345");
    assert_eq!(balances[1].balance, "1000.0");
    assert_eq!(balances[1].available, "1000.0");
    assert_eq!(balances[1].locked, "0.0");
    
    Ok(())
}

#[tokio::test]
async fn test_api_client_get_deposit_address() -> Result<()> {
    // Create a mock API server
    let server = MockApiServer::new();
    
    // Add a response for the get_deposit_address request
    server.add_response(r#"
    {
        "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
    }
    "#.to_string()).await;
    
    // Create an API client
    let client = ApiClient::new(
        "http://localhost:8080",
        Box::new(move |request| {
            let server = server.clone();
            Box::pin(async move {
                server.handle_request(request).await
            })
        }),
    )?;
    
    // Get deposit address
    let address = client.get_deposit_address("BTC").await?;
    
    // Check that the address is correct
    assert_eq!(address, "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx");
    
    Ok(())
}

#[tokio::test]
async fn test_api_client_withdraw() -> Result<()> {
    // Create a mock API server
    let server = MockApiServer::new();
    
    // Add a response for the withdraw request
    server.add_response(r#"
    {
        "success": true,
        "txid": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    }
    "#.to_string()).await;
    
    // Create an API client
    let client = ApiClient::new(
        "http://localhost:8080",
        Box::new(move |request| {
            let server = server.clone();
            Box::pin(async move {
                server.handle_request(request).await
            })
        }),
    )?;
    
    // Withdraw
    let success = client.withdraw("BTC", "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", "0.1").await?;
    
    // Check that the withdrawal was successful
    assert!(success);
    
    // Check that the request was correct
    let request = server.get_request(0).await.unwrap();
    assert!(request.contains("BTC"));
    assert!(request.contains("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"));
    assert!(request.contains("0.1"));
    
    Ok(())
}

#[tokio::test]
async fn test_api_client_get_orders() -> Result<()> {
    // Create a mock API server
    let server = MockApiServer::new();
    
    // Add a response for the get_orders request
    server.add_response(r#"
    [
        {
            "id": "order1",
            "baseAsset": "BTC",
            "quoteAsset": "USD",
            "side": "buy",
            "amount": "1.0",
            "price": "20000.0",
            "status": "open",
            "timestamp": 1617235200,
            "expiry": 1617321600
        },
        {
            "id": "order2",
            "baseAsset": "BTC",
            "quoteAsset": "USD",
            "side": "sell",
            "amount": "0.5",
            "price": "21000.0",
            "status": "filled",
            "timestamp": 1617235300,
            "expiry": 1617321700
        }
    ]
    "#.to_string()).await;
    
    // Create an API client
    let client = ApiClient::new(
        "http://localhost:8080",
        Box::new(move |request| {
            let server = server.clone();
            Box::pin(async move {
                server.handle_request(request).await
            })
        }),
    )?;
    
    // Get orders
    let orders = client.get_orders(Some("BTC"), Some("USD"), Some("open"), Some("buy"), Some(1), Some(10)).await?;
    
    // Check that the orders are correct
    assert_eq!(orders.len(), 2);
    assert_eq!(orders[0].id, "order1");
    assert_eq!(orders[0].base_asset, "BTC");
    assert_eq!(orders[0].quote_asset, "USD");
    assert_eq!(orders[0].side, OrderSide::Buy);
    assert_eq!(orders[0].amount, Decimal::from_str("1.0")?);
    assert_eq!(orders[0].price, Decimal::from_str("20000.0")?);
    assert_eq!(orders[0].status, OrderStatus::Open);
    assert_eq!(orders[0].timestamp, 1617235200);
    assert_eq!(orders[0].expiry, 1617321600);
    assert_eq!(orders[1].id, "order2");
    assert_eq!(orders[1].base_asset, "BTC");
    assert_eq!(orders[1].quote_asset, "USD");
    assert_eq!(orders[1].side, OrderSide::Sell);
    assert_eq!(orders[1].amount, Decimal::from_str("0.5")?);
    assert_eq!(orders[1].price, Decimal::from_str("21000.0")?);
    assert_eq!(orders[1].status, OrderStatus::Filled);
    assert_eq!(orders[1].timestamp, 1617235300);
    assert_eq!(orders[1].expiry, 1617321700);
    
    Ok(())
}

#[tokio::test]
async fn test_api_client_error_handling() -> Result<()> {
    // Create a mock API server
    let server = MockApiServer::new();
    
    // Add an error response
    server.add_response(r#"
    {
        "error": "Invalid request",
        "code": 400
    }
    "#.to_string()).await;
    
    // Create an API client
    let client = ApiClient::new(
        "http://localhost:8080",
        Box::new(move |request| {
            let server = server.clone();
            Box::pin(async move {
                server.handle_request(request).await
            })
        }),
    )?;
    
    // Try to get balances
    let result = client.get_balances().await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the error message is correct
    let err = result.unwrap_err();
    let err_string = err.to_string();
    assert!(err_string.contains("Invalid request") || err_string.contains("400"));
    
    Ok(())
}