//! WebSocket server for DarkSwap Bridge
//!
//! This module provides a WebSocket server for the DarkSwap Bridge.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex as StdMutex};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures::{SinkExt, StreamExt};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, mpsc, Mutex};
use tower_http::cors::{Any, CorsLayer};

use crate::bridge::Bridge;
use crate::error::{Error, Result};
use crate::message::{Message as BridgeMessage, ResponseMessage};

mod auth;
mod handlers;
mod models;

/// WebSocket server
pub struct WebSocketServer {
    /// Bridge
    bridge: Arc<Mutex<Bridge>>,
    /// Address to bind to
    addr: SocketAddr,
    /// Connected clients
    clients: Arc<StdMutex<HashMap<String, mpsc::Sender<Message>>>>,
    /// Broadcast channel
    broadcast_tx: broadcast::Sender<WebSocketEvent>,
}

impl WebSocketServer {
    /// Create a new WebSocket server
    pub fn new(bridge: Arc<Mutex<Bridge>>, addr: SocketAddr) -> Self {
        let (broadcast_tx, _) = broadcast::channel(100);
        
        Self {
            bridge,
            addr,
            clients: Arc::new(StdMutex::new(HashMap::new())),
            broadcast_tx,
        }
    }

    /// Start the WebSocket server
    pub async fn start(&self) -> Result<()> {
        info!("Starting WebSocket server on {}", self.addr);
        
        // Create CORS layer
        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);
        
        // Create router
        let router = Router::new()
            // WebSocket route
            .route("/ws", get(Self::ws_handler))
            // WebSocket with authentication route
            .route("/ws/auth", get(Self::ws_auth_handler))
            // WebSocket with topic route
            .route("/ws/topic/:topic", get(Self::ws_topic_handler))
            // Apply middleware
            .layer(cors)
            .with_state((
                self.bridge.clone(),
                self.clients.clone(),
                self.broadcast_tx.clone(),
            ));
        
        // Start server
        axum::Server::bind(&self.addr)
            .serve(router.into_make_service())
            .await
            .map_err(|e| {
                error!("WebSocket server error: {}", e);
                Error::WebSocketError(format!("WebSocket server error: {}", e))
            })?;
        
        Ok(())
    }

    /// WebSocket handler
    async fn ws_handler(
        ws: WebSocketUpgrade,
        State((bridge, clients, broadcast_tx)): State<(
            Arc<Mutex<Bridge>>,
            Arc<StdMutex<HashMap<String, mpsc::Sender<Message>>>>,
            broadcast::Sender<WebSocketEvent>,
        )>,
    ) -> impl IntoResponse {
        ws.on_upgrade(|socket| Self::handle_socket(socket, bridge, clients, broadcast_tx, None))
    }

    /// WebSocket with authentication handler
    async fn ws_auth_handler(
        ws: WebSocketUpgrade,
        State((bridge, clients, broadcast_tx)): State<(
            Arc<Mutex<Bridge>>,
            Arc<StdMutex<HashMap<String, mpsc::Sender<Message>>>>,
            broadcast::Sender<WebSocketEvent>,
        )>,
    ) -> impl IntoResponse {
        ws.on_upgrade(|socket| Self::handle_socket(socket, bridge, clients, broadcast_tx, None))
    }

    /// WebSocket with topic handler
    async fn ws_topic_handler(
        ws: WebSocketUpgrade,
        Path(topic): Path<String>,
        State((bridge, clients, broadcast_tx)): State<(
            Arc<Mutex<Bridge>>,
            Arc<StdMutex<HashMap<String, mpsc::Sender<Message>>>>,
            broadcast::Sender<WebSocketEvent>,
        )>,
    ) -> impl IntoResponse {
        ws.on_upgrade(|socket| Self::handle_socket(socket, bridge, clients, broadcast_tx, Some(topic)))
    }

    /// Handle WebSocket connection
    async fn handle_socket(
        socket: WebSocket,
        bridge: Arc<Mutex<Bridge>>,
        clients: Arc<StdMutex<HashMap<String, mpsc::Sender<Message>>>>,
        broadcast_tx: broadcast::Sender<WebSocketEvent>,
        topic: Option<String>,
    ) {
        // Split socket into sender and receiver
        let (mut sender, mut receiver) = socket.split();
        
        // Create client ID
        let client_id = uuid::Uuid::new_v4().to_string();
        
        // Create channel for sending messages to client
        let (client_tx, mut client_rx) = mpsc::channel(100);
        
        // Add client to clients map
        {
            let mut clients = clients.lock().unwrap();
            clients.insert(client_id.clone(), client_tx);
        }
        
        // Subscribe to broadcast channel
        let mut broadcast_rx = broadcast_tx.subscribe();
        
        // Send welcome message
        let welcome_message = WebSocketEvent {
            event_type: "welcome".to_string(),
            data: serde_json::json!({
                "client_id": client_id,
                "topic": topic,
            }),
        };
        
        if let Err(e) = sender.send(Message::Text(serde_json::to_string(&welcome_message).unwrap())).await {
            error!("Failed to send welcome message: {}", e);
        }
        
        // Handle incoming messages
        let mut recv_task = tokio::spawn(async move {
            while let Some(result) = receiver.next().await {
                match result {
                    Ok(Message::Text(text)) => {
                        debug!("Received message: {}", text);
                        
                        // Parse message
                        match serde_json::from_str::<WebSocketCommand>(&text) {
                            Ok(command) => {
                                // Handle command
                                match command.command.as_str() {
                                    "subscribe" => {
                                        // TODO: Handle subscribe command
                                    }
                                    "unsubscribe" => {
                                        // TODO: Handle unsubscribe command
                                    }
                                    "ping" => {
                                        // Send pong message
                                        let pong_message = WebSocketEvent {
                                            event_type: "pong".to_string(),
                                            data: serde_json::json!({}),
                                        };
                                        
                                        if let Err(e) = sender.send(Message::Text(serde_json::to_string(&pong_message).unwrap())).await {
                                            error!("Failed to send pong message: {}", e);
                                        }
                                    }
                                    _ => {
                                        // Unknown command
                                        let error_message = WebSocketEvent {
                                            event_type: "error".to_string(),
                                            data: serde_json::json!({
                                                "message": format!("Unknown command: {}", command.command),
                                            }),
                                        };
                                        
                                        if let Err(e) = sender.send(Message::Text(serde_json::to_string(&error_message).unwrap())).await {
                                            error!("Failed to send error message: {}", e);
                                        }
                                    }
                                }
                            }
                            Err(e) => {
                                // Invalid message
                                let error_message = WebSocketEvent {
                                    event_type: "error".to_string(),
                                    data: serde_json::json!({
                                        "message": format!("Invalid message: {}", e),
                                    }),
                                };
                                
                                if let Err(e) = sender.send(Message::Text(serde_json::to_string(&error_message).unwrap())).await {
                                    error!("Failed to send error message: {}", e);
                                }
                            }
                        }
                    }
                    Ok(Message::Binary(_)) => {
                        // Binary messages are not supported
                        let error_message = WebSocketEvent {
                            event_type: "error".to_string(),
                            data: serde_json::json!({
                                "message": "Binary messages are not supported",
                            }),
                        };
                        
                        if let Err(e) = sender.send(Message::Text(serde_json::to_string(&error_message).unwrap())).await {
                            error!("Failed to send error message: {}", e);
                        }
                    }
                    Ok(Message::Ping(data)) => {
                        // Respond to ping with pong
                        if let Err(e) = sender.send(Message::Pong(data)).await {
                            error!("Failed to send pong: {}", e);
                        }
                    }
                    Ok(Message::Pong(_)) => {
                        // Ignore pong messages
                    }
                    Ok(Message::Close(_)) => {
                        // Client closed connection
                        break;
                    }
                    Err(e) => {
                        // Error receiving message
                        error!("Error receiving message: {}", e);
                        break;
                    }
                }
            }
            
            // Remove client from clients map
            {
                let mut clients = clients.lock().unwrap();
                clients.remove(&client_id);
            }
        });
        
        // Handle outgoing messages
        let mut send_task = tokio::spawn(async move {
            loop {
                tokio::select! {
                    // Handle messages from client channel
                    Some(message) = client_rx.recv() => {
                        if let Err(e) = sender.send(message).await {
                            error!("Failed to send message to client: {}", e);
                            break;
                        }
                    }
                    
                    // Handle messages from broadcast channel
                    Ok(event) = broadcast_rx.recv() => {
                        // Check if client is subscribed to this topic
                        if let Some(ref topic) = topic {
                            if event.event_type != *topic && event.event_type != "broadcast" {
                                continue;
                            }
                        }
                        
                        // Send event to client
                        if let Err(e) = sender.send(Message::Text(serde_json::to_string(&event).unwrap())).await {
                            error!("Failed to send broadcast message to client: {}", e);
                            break;
                        }
                    }
                }
            }
        });
        
        // Wait for either task to finish
        tokio::select! {
            _ = &mut recv_task => send_task.abort(),
            _ = &mut send_task => recv_task.abort(),
        }
    }

    /// Broadcast event to all clients
    pub fn broadcast(&self, event: WebSocketEvent) -> Result<()> {
        self.broadcast_tx.send(event).map_err(|e| {
            Error::WebSocketError(format!("Failed to broadcast event: {}", e))
        })?;
        
        Ok(())
    }

    /// Send event to specific client
    pub fn send_to_client(&self, client_id: &str, event: WebSocketEvent) -> Result<()> {
        let clients = self.clients.lock().unwrap();
        
        if let Some(client_tx) = clients.get(client_id) {
            let message = Message::Text(serde_json::to_string(&event).unwrap());
            
            client_tx.try_send(message).map_err(|e| {
                Error::WebSocketError(format!("Failed to send event to client: {}", e))
            })?;
            
            Ok(())
        } else {
            Err(Error::NotFoundError(format!("Client not found: {}", client_id)))
        }
    }
}

/// WebSocket event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketEvent {
    /// Event type
    pub event_type: String,
    /// Event data
    pub data: serde_json::Value,
}

/// WebSocket command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketCommand {
    /// Command
    pub command: String,
    /// Command data
    pub data: serde_json::Value,
}