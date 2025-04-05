//! Network routes for the REST API
//!
//! This module provides network routes for the REST API.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::bridge::Bridge;
use crate::error::Result;
use crate::message::{Message, NetworkMessage, ResponseMessage};

/// Handle network message
pub async fn handle_network_message(
    State(bridge): State<Arc<Mutex<Bridge>>>,
    Json(message): Json<NetworkMessage>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to network adapter
    bridge.send_to_network(Message::Network(message))?;
    
    // TODO: Wait for response
    
    // Return success response
    let response = ResponseMessage::Success;
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get network status
pub async fn get_network_status(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to network adapter
    bridge.send_to_network(Message::Network(NetworkMessage::GetStatus))?;
    
    // TODO: Wait for response
    
    // Return status response
    let response = ResponseMessage::NetworkStatus {
        connected: true,
        peer_count: 0,
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get network peers
pub async fn get_network_peers(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to network adapter
    bridge.send_to_network(Message::Network(NetworkMessage::GetPeers))?;
    
    // TODO: Wait for response
    
    // Return peers response
    let response = ResponseMessage::Peers {
        peers: vec![],
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Connect to peer request
#[derive(Debug, Deserialize)]
pub struct ConnectToPeerRequest {
    /// Peer address
    pub address: String,
}

/// Connect to peer
pub async fn connect_to_peer(
    State(bridge): State<Arc<Mutex<Bridge>>>,
    Json(request): Json<ConnectToPeerRequest>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to network adapter
    bridge.send_to_network(Message::Network(NetworkMessage::Connect {
        address: request.address,
    }))?;
    
    // TODO: Wait for response
    
    // Return success response
    let response = ResponseMessage::Success;
    
    Ok((StatusCode::OK, Json(response)))
}

/// Disconnect from peer request
#[derive(Debug, Deserialize)]
pub struct DisconnectFromPeerRequest {
    /// Peer address
    pub address: String,
}

/// Disconnect from peer
pub async fn disconnect_from_peer(
    State(bridge): State<Arc<Mutex<Bridge>>>,
    Json(request): Json<DisconnectFromPeerRequest>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to network adapter
    bridge.send_to_network(Message::Network(NetworkMessage::Disconnect {
        address: request.address,
    }))?;
    
    // TODO: Wait for response
    
    // Return success response
    let response = ResponseMessage::Success;
    
    Ok((StatusCode::OK, Json(response)))
}