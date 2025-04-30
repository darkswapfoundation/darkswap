//! WebSocket handlers for DarkSwap daemon
//!
//! This module provides WebSocket handlers for real-time updates from the DarkSwap daemon.

use axum::{
    extract::{
        ws::{Message, WebSocket},
        WebSocketUpgrade,
        State,
    },
    response::IntoResponse,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::api::ApiState;

/// WebSocket message
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WebSocketMessage {
    /// Subscribe to events
    Subscribe {
        /// Event types to subscribe to
        events: Vec<String>,
    },
    /// Unsubscribe from events
    Unsubscribe {
        /// Event types to unsubscribe from
        events: Vec<String>,
    },
    /// Event
    Event {
        /// Event type
        event_type: String,
        /// Event data
        data: serde_json::Value,
    },
    /// Error
    Error {
        /// Error message
        message: String,
    },
}

/// WebSocket handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<ApiState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

/// Handle WebSocket connection
async fn handle_socket(socket: WebSocket, state: Arc<ApiState>) {
    // Split socket into sender and receiver
    let (mut sender, mut receiver) = socket.split();

    // Create a channel for sending messages to the WebSocket
    let (tx, mut rx) = mpsc::channel::<Message>(100);

    // Generate a client ID
    let client_id = Uuid::new_v4().to_string();

    // Spawn a task to forward messages from the channel to the WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if sender.send(message).await.is_err() {
                break;
            }
        }
    });

    // Create a channel for DarkSwap events
    let (event_tx, mut event_rx) = mpsc::channel::<darkswap_sdk::types::Event>(100);
    
    // Clone the state and event sender for the background task
    let state_clone = state.clone();
    
    // Spawn a background task to subscribe to events and forward them to our channel
    tokio::spawn(async move {
        let darkswap = state_clone.darkswap.lock().await;
        let receiver = darkswap.subscribe_to_events().await;
        
        let mut receiver = receiver;
        while let Some(event) = receiver.recv().await {
            if event_tx.send(event).await.is_err() {
                break;
            }
        }
    });

    // Spawn a task to forward DarkSwap events to the WebSocket
    let tx_clone = tx.clone();
    let mut event_task = tokio::spawn(async move {
        while let Some(event) = event_rx.recv().await {
            // Convert event to WebSocket message
            let event_type = match &event {
                darkswap_sdk::types::Event::OrderCreated(_) => "order_created",
                darkswap_sdk::types::Event::OrderCancelled(_) => "order_canceled",
                darkswap_sdk::types::Event::OrderFilled(_) => "order_filled",
                darkswap_sdk::types::Event::OrderExpired(_) => "order_expired",
                darkswap_sdk::types::Event::OrderUpdated(_) => "order_updated",
                darkswap_sdk::types::Event::TradeStarted(_) => "trade_started",
                darkswap_sdk::types::Event::TradeCompleted(_) => "trade_completed",
                darkswap_sdk::types::Event::TradeFailed(_) => "trade_failed",
                darkswap_sdk::types::Event::TradeCreated(_) => "trade_created",
                darkswap_sdk::types::Event::TradeUpdated(_) => "trade_updated",
                darkswap_sdk::types::Event::TradeCancelled(_) => "trade_cancelled",
                darkswap_sdk::types::Event::TradeExpired(_) => "trade_expired",
                darkswap_sdk::types::Event::PeerConnected(_) => "peer_connected",
                darkswap_sdk::types::Event::PeerDisconnected(_) => "peer_disconnected",
            };

            // Serialize event data
            let data = match serde_json::to_value(&event) {
                Ok(value) => value,
                Err(_) => continue,
            };

            // Create WebSocket message
            let ws_message = WebSocketMessage::Event {
                event_type: event_type.to_string(),
                data,
            };

            // Serialize WebSocket message
            let message_text = match serde_json::to_string(&ws_message) {
                Ok(text) => text,
                Err(_) => continue,
            };

            // Send WebSocket message
            if tx_clone.send(Message::Text(message_text)).await.is_err() {
                break;
            }
        }
    });

    // Process incoming messages
    let mut subscribed_events = Vec::new();
    
    while let Some(Ok(message)) = receiver.next().await {
        match message {
            Message::Text(text) => {
                // Parse message
                match serde_json::from_str::<WebSocketMessage>(&text) {
                    Ok(WebSocketMessage::Subscribe { events }) => {
                        // Subscribe to events
                        for event in events {
                            if !subscribed_events.contains(&event) {
                                subscribed_events.push(event);
                            }
                        }
                        
                        // Send confirmation
                        let response = WebSocketMessage::Event {
                            event_type: "subscribed".to_string(),
                            data: serde_json::json!({
                                "events": subscribed_events,
                            }),
                        };
                        
                        let response_text = serde_json::to_string(&response).unwrap();
                        let _ = tx.send(Message::Text(response_text)).await;
                    }
                    Ok(WebSocketMessage::Unsubscribe { events }) => {
                        // Unsubscribe from events
                        subscribed_events.retain(|e| !events.contains(e));
                        
                        // Send confirmation
                        let response = WebSocketMessage::Event {
                            event_type: "unsubscribed".to_string(),
                            data: serde_json::json!({
                                "events": subscribed_events,
                            }),
                        };
                        
                        let response_text = serde_json::to_string(&response).unwrap();
                        let _ = tx.send(Message::Text(response_text)).await;
                    }
                    _ => {
                        // Send error
                        let response = WebSocketMessage::Error {
                            message: "Invalid message".to_string(),
                        };
                        
                        let response_text = serde_json::to_string(&response).unwrap();
                        let _ = tx.send(Message::Text(response_text)).await;
                    }
                }
            }
            Message::Close(_) => {
                break;
            }
            _ => {}
        }
    }

    // Cancel the tasks
    send_task.abort();
    event_task.abort();
}

/// Send event to WebSocket clients
pub async fn send_event(
    clients: &std::collections::HashMap<String, mpsc::Sender<Message>>,
    event_type: &str,
    data: serde_json::Value,
) {
    // Create event message
    let event = WebSocketMessage::Event {
        event_type: event_type.to_string(),
        data,
    };
    
    let event_text = match serde_json::to_string(&event) {
        Ok(text) => text,
        Err(_) => return,
    };
    
    // Send event to all clients
    for (_, sender) in clients {
        let _ = sender.send(Message::Text(event_text.clone())).await;
    }
}