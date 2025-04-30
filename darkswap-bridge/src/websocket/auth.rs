//! Authentication for WebSocket server
//!
//! This module provides authentication functionality for the WebSocket server.

use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query,
    },
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::api::auth::Auth;
use crate::error::{Error, Result};

/// Authentication query parameters
#[derive(Debug, Deserialize)]
pub struct AuthQuery {
    /// JWT token
    pub token: Option<String>,
}

/// Authentication result
#[derive(Debug, Serialize)]
pub struct AuthResult {
    /// Whether authentication was successful
    pub success: bool,
    /// User ID (if authentication was successful)
    pub user_id: Option<String>,
    /// Error message (if authentication failed)
    pub error: Option<String>,
}

/// Authenticate WebSocket connection
pub async fn authenticate(socket: &mut WebSocket, query: &HashMap<String, String>) -> Result<String> {
    // Check if token is provided
    let token = query.get("token").ok_or_else(|| {
        Error::AuthError("Token not provided".to_string())
    })?;
    
    // Validate token
    let secret = b"secret"; // TODO: Use a proper secret
    let claims = Auth::validate_token(token, secret)?;
    
    // Send authentication success message
    let auth_result = AuthResult {
        success: true,
        user_id: Some(claims.sub.clone()),
        error: None,
    };
    
    socket.send(Message::Text(serde_json::to_string(&auth_result)?)).await
        .map_err(|e| Error::WebSocketError(format!("Failed to send authentication result: {}", e)))?;
    
    Ok(claims.sub)
}

/// Handle authentication failure
pub async fn handle_auth_failure(socket: &mut WebSocket, error: &str) -> Result<()> {
    // Send authentication failure message
    let auth_result = AuthResult {
        success: false,
        user_id: None,
        error: Some(error.to_string()),
    };
    
    socket.send(Message::Text(serde_json::to_string(&auth_result)?)).await
        .map_err(|e| Error::WebSocketError(format!("Failed to send authentication result: {}", e)))?;
    
    Ok(())
}