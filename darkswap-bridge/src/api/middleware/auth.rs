//! Authentication middleware for the REST API
//!
//! This module provides authentication middleware for the REST API.

use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::bridge::Bridge;
use crate::error::Error;

use crate::api::auth::Auth;

/// Authentication layer
pub fn auth_layer() -> axum::middleware::from_fn_with_state<Arc<Mutex<Bridge>>, fn(Request, Arc<Mutex<Bridge>>, Next) -> Result<Response, StatusCode>> {
    axum::middleware::from_fn_with_state(auth_middleware)
}

/// Authentication middleware
pub async fn auth_middleware(
    mut req: Request,
    state: Arc<Mutex<Bridge>>,
    next: Next,
) -> Result<Response, StatusCode> {
    // Skip authentication for login and register routes
    let path = req.uri().path();
    if path == "/api/auth/login" || path == "/api/auth/register" {
        return Ok(next.run(req).await);
    }
    
    // Get authorization header
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| {
            if header.starts_with("Bearer ") {
                Some(header[7..].to_string())
            } else {
                None
            }
        });
    
    // Check if authorization header exists
    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };
    
    // Validate token
    let secret = b"secret"; // TODO: Use a proper secret
    let claims = match Auth::validate_token(&token, secret) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };
    
    // Add user ID to request extensions
    req.extensions_mut().insert(claims.sub);
    
    // Continue with the request
    Ok(next.run(req).await)
}