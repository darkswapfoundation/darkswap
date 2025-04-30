//! Authentication handlers for the REST API
//!
//! This module provides authentication handlers for the REST API.

use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::bridge::Bridge;
use crate::error::Result;
use crate::storage::Storage;

use super::Auth;

/// Login request
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    /// Username
    pub username: String,
    /// Password
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    /// JWT token
    pub token: String,
    /// User ID
    pub user_id: String,
    /// Username
    pub username: String,
}

/// Register request
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    /// Username
    pub username: String,
    /// Password
    pub password: String,
}

/// Register response
#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    /// JWT token
    pub token: String,
    /// User ID
    pub user_id: String,
    /// Username
    pub username: String,
}

/// User
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    /// User ID
    pub id: String,
    /// Username
    pub username: String,
    /// Password hash
    pub password_hash: String,
}

/// Login handler
pub async fn login(
    State(bridge): State<Arc<Mutex<Bridge>>>,
    Json(request): Json<LoginRequest>,
) -> Result<(StatusCode, Json<LoginResponse>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Get storage
    let storage_dir = bridge.config().bridge.storage_dir.clone();
    let storage = Storage::new(format!("{}/api", storage_dir))?;
    
    // Check if user exists
    if !storage.exists(&format!("users/{}.json", request.username)) {
        return Err(crate::error::Error::AuthError("Invalid username or password".to_string()));
    }
    
    // Load user
    let user: User = storage.load(&format!("users/{}.json", request.username))?;
    
    // Verify password
    if !Auth::verify_password(&request.password, &user.password_hash)? {
        return Err(crate::error::Error::AuthError("Invalid username or password".to_string()));
    }
    
    // Generate token
    let secret = b"secret"; // TODO: Use a proper secret
    let token = Auth::generate_token(&user.id, secret)?;
    
    // Return response
    let response = LoginResponse {
        token,
        user_id: user.id,
        username: user.username,
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Register handler
pub async fn register(
    State(bridge): State<Arc<Mutex<Bridge>>>,
    Json(request): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<RegisterResponse>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Get storage
    let storage_dir = bridge.config().bridge.storage_dir.clone();
    let storage = Storage::new(format!("{}/api", storage_dir))?;
    
    // Check if user exists
    if storage.exists(&format!("users/{}.json", request.username)) {
        return Err(crate::error::Error::AlreadyExistsError("Username already exists".to_string()));
    }
    
    // Hash password
    let password_hash = Auth::hash_password(&request.password)?;
    
    // Create user
    let user = User {
        id: crate::utils::generate_id(),
        username: request.username.clone(),
        password_hash,
    };
    
    // Save user
    storage.save(&format!("users/{}.json", request.username), &user)?;
    
    // Generate token
    let secret = b"secret"; // TODO: Use a proper secret
    let token = Auth::generate_token(&user.id, secret)?;
    
    // Return response
    let response = RegisterResponse {
        token,
        user_id: user.id,
        username: user.username,
    };
    
    Ok((StatusCode::CREATED, Json(response)))
}