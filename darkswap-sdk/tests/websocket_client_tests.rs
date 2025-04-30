//! Tests for the WebSocket client

use anyhow::Result;
use darkswap_sdk::{
    config::BitcoinNetwork,
    network::WebSocketClient,
    types::Event,
};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

struct MockWebSocketServer {
    receiver: mpsc::Receiver<String>,
    sender: mpsc::Sender<String>,
}

impl MockWebSocketServer {
    fn new() -> (Self, mpsc::Sender<String>, mpsc::Receiver<String>) {
        let (client_to_server_tx, client_to_server_rx) = mpsc::channel(100);
        let (server_to_client_tx, server_to_client_rx) = mpsc::channel(100);
        
        let server = Self {
            receiver: client_to_server_rx,
            sender: server_to_client_tx,
        };
        
        (server, client_to_server_tx, server_to_client_rx)
    }
    
    async fn run(&mut self) {
        while let Some(message) = self.receiver.recv().await {
            // Echo the message back
            let _ = self.sender.send(message).await;
        }
    }
}

#[tokio::test]
async fn test_websocket_client_connection() -> Result<()> {
    // Create a mock WebSocket server
    let (mut server, client_to_server_tx, server_to_client_rx) = MockWebSocketServer::new();
    
    // Run the server in a separate task
    tokio::spawn(async move {
        server.run().await;
    });
    
    // Create a WebSocket client
    let client = WebSocketClient::new(
        "ws://localhost:8080",
        client_to_server_tx,
        server_to_client_rx,
    );
    
    // Connect to the server
    client.connect().await?;
    
    // Check that the client is connected
    assert!(client.is_connected());
    
    // Disconnect from the server
    client.disconnect().await?;
    
    // Check that the client is disconnected
    assert!(!client.is_connected());
    
    Ok(())
}

#[tokio::test]
async fn test_websocket_client_message_sending() -> Result<()> {
    // Create a mock WebSocket server
    let (mut server, client_to_server_tx, server_to_client_rx) = MockWebSocketServer::new();
    
    // Run the server in a separate task
    tokio::spawn(async move {
        server.run().await;
    });
    
    // Create a WebSocket client
    let client = WebSocketClient::new(
        "ws://localhost:8080",
        client_to_server_tx,
        server_to_client_rx,
    );
    
    // Connect to the server
    client.connect().await?;
    
    // Create a message
    let message = "Hello, server!";
    
    // Send the message
    client.send(message).await?;
    
    // Wait for the message to be echoed back
    let received_message = client.receive().await?;
    
    // Check that the received message matches the sent message
    assert_eq!(received_message, message);
    
    // Disconnect from the server
    client.disconnect().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_websocket_client_reconnection() -> Result<()> {
    // Create a mock WebSocket server
    let (mut server, client_to_server_tx, server_to_client_rx) = MockWebSocketServer::new();
    
    // Run the server in a separate task
    tokio::spawn(async move {
        server.run().await;
    });
    
    // Create a WebSocket client with reconnection enabled
    let client = WebSocketClient::with_reconnect(
        "ws://localhost:8080",
        client_to_server_tx,
        server_to_client_rx,
        5000, // 5 seconds reconnect interval
        3, // 3 reconnect attempts
    );
    
    // Connect to the server
    client.connect().await?;
    
    // Check that the client is connected
    assert!(client.is_connected());
    
    // Simulate a disconnection
    client.disconnect().await?;
    
    // Check that the client is disconnected
    assert!(!client.is_connected());
    
    // Reconnect to the server
    client.reconnect().await?;
    
    // Check that the client is connected again
    assert!(client.is_connected());
    
    // Disconnect from the server
    client.disconnect().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_websocket_client_event_handling() -> Result<()> {
    // Create a mock WebSocket server
    let (mut server, client_to_server_tx, server_to_client_rx) = MockWebSocketServer::new();
    
    // Run the server in a separate task
    tokio::spawn(async move {
        server.run().await;
    });
    
    // Create a WebSocket client
    let client = WebSocketClient::new(
        "ws://localhost:8080",
        client_to_server_tx,
        server_to_client_rx,
    );
    
    // Connect to the server
    client.connect().await?;
    
    // Create an event handler
    let event_handler = Arc::new(RwLock::new(Vec::new()));
    let event_handler_clone = event_handler.clone();
    
    // Register the event handler
    client.on_message(move |message| {
        let mut events = event_handler_clone.write().unwrap();
        events.push(message.to_string());
    });
    
    // Send a message
    client.send("Event 1").await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Send another message
    client.send("Event 2").await?;
    
    // Wait for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Check that the event handler received both messages
    let events = event_handler.read().unwrap();
    assert_eq!(events.len(), 2);
    assert_eq!(events[0], "Event 1");
    assert_eq!(events[1], "Event 2");
    
    // Disconnect from the server
    client.disconnect().await?;
    
    Ok(())
}

#[tokio::test]
async fn test_websocket_client_error_handling() -> Result<()> {
    // Create a WebSocket client with an invalid URL
    let (client_to_server_tx, _) = mpsc::channel(100);
    let (_, server_to_client_rx) = mpsc::channel(100);
    
    let client = WebSocketClient::new(
        "invalid-url",
        client_to_server_tx,
        server_to_client_rx,
    );
    
    // Try to connect to the server
    let result = client.connect().await;
    
    // Check that the result is an error
    assert!(result.is_err());
    
    // Check that the client is not connected
    assert!(!client.is_connected());
    
    Ok(())
}