//! Authentication system for the DarkSwap Relay Server
//!
//! This module provides authentication functionality for the relay server.
//! It implements JWT-based authentication for peers.

use crate::{
    config::Config,
    error::Error,
    Result,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{
    decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};

/// Authentication claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (peer ID)
    pub sub: String,
    /// Issued at
    pub iat: i64,
    /// Expiration time
    pub exp: i64,
    /// Issuer
    pub iss: String,
    /// Roles
    pub roles: Vec<String>,
}

/// Authentication token
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    /// Token value
    pub value: String,
    /// Expiration time
    pub expires_at: i64,
}

/// Authentication manager
pub struct AuthManager {
    /// Configuration
    config: Config,
    /// Secret key
    secret: String,
    /// Token expiry in seconds
    token_expiry: i64,
    /// Admin token
    admin_token: String,
    /// Revoked tokens
    revoked_tokens: Arc<RwLock<Vec<String>>>,
}

impl AuthManager {
    /// Create a new authentication manager
    pub fn new(config: Config) -> Result<Self> {
        // Get authentication settings from environment variables
        let secret = std::env::var("DARKSWAP_RELAY_AUTH_SECRET")
            .unwrap_or_else(|_| "default-secret-key-change-me".to_string());
        
        let token_expiry = std::env::var("DARKSWAP_RELAY_AUTH_TOKEN_EXPIRY")
            .ok()
            .and_then(|s| s.parse::<i64>().ok())
            .unwrap_or(86400); // 24 hours
        
        let admin_token = std::env::var("DARKSWAP_RELAY_AUTH_ADMIN_TOKEN")
            .unwrap_or_else(|_| "admin-token-change-me".to_string());
        
        Ok(Self {
            config,
            secret,
            token_expiry,
            admin_token,
            revoked_tokens: Arc::new(RwLock::new(Vec::new())),
        })
    }
    
    /// Generate a token for a peer
    pub async fn generate_token(&self, peer_id: &str, roles: Vec<String>) -> Result<Token> {
        let now = Utc::now();
        let expires_at = now + Duration::seconds(self.token_expiry);
        
        let claims = Claims {
            sub: peer_id.to_string(),
            iat: now.timestamp(),
            exp: expires_at.timestamp(),
            iss: "darkswap-relay".to_string(),
            roles,
        };
        
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        ).map_err(|e| Error::Other(format!("Failed to generate token: {}", e)))?;
        
        Ok(Token {
            value: token,
            expires_at: expires_at.timestamp(),
        })
    }
    
    /// Validate a token
    pub async fn validate_token(&self, token: &str) -> Result<Claims> {
        // Check if the token is revoked
        {
            let revoked_tokens = self.revoked_tokens.read().await;
            if revoked_tokens.contains(&token.to_string()) {
                return Err(Error::PermissionDenied("Token has been revoked".to_string()));
            }
        }
        
        // Validate the token
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        ).map_err(|e| Error::PermissionDenied(format!("Invalid token: {}", e)))?;
        
        Ok(token_data.claims)
    }
    
    /// Revoke a token
    pub async fn revoke_token(&self, token: &str) -> Result<()> {
        let mut revoked_tokens = self.revoked_tokens.write().await;
        revoked_tokens.push(token.to_string());
        Ok(())
    }
    
    /// Extract token from various sources
    pub fn extract_token(request: &axum::http::Request<axum::body::Body>) -> Option<String> {
        // Try to extract from Authorization header
        if let Some(auth_header) = request.headers().get(axum::http::header::AUTHORIZATION) {
            if let Ok(auth_str) = auth_header.to_str() {
                if auth_str.starts_with("Bearer ") {
                    return Some(auth_str[7..].to_string());
                }
            }
        }
        
        // Try to extract from query parameters
        if let Some(query) = request.uri().query() {
            for pair in query.split('&') {
                if let Some((key, value)) = pair.split_once('=') {
                    if key == "token" {
                        return Some(value.to_string());
                    }
                }
            }
        }
        
        // Try to extract from cookies
        if let Some(cookie_header) = request.headers().get(axum::http::header::COOKIE) {
            if let Ok(cookie_str) = cookie_header.to_str() {
                for cookie in cookie_str.split(';') {
                    if let Some((key, value)) = cookie.trim().split_once('=') {
                        if key == "token" {
                            return Some(value.to_string());
                        }
                    }
                }
            }
        }
        
        None
    }
    
    /// Extract token from WebSocket message
    pub fn extract_token_from_message(msg: &str) -> Option<String> {
        // Try to parse the message as JSON
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(msg) {
            // Check if the message has a token field
            if let Some(token) = json.get("token").and_then(|t| t.as_str()) {
                return Some(token.to_string());
            }
            
            // Check if the message has an auth field with a token subfield
            if let Some(auth) = json.get("auth") {
                if let Some(token) = auth.get("token").and_then(|t| t.as_str()) {
                    return Some(token.to_string());
                }
            }
        }
        
        None
    }
    
    /// Check if a token has a specific role
    pub async fn has_role(&self, token: &str, role: &str) -> Result<bool> {
        let claims = self.validate_token(token).await?;
        Ok(claims.roles.contains(&role.to_string()))
    }
    
    /// Check if a token is an admin token
    pub async fn is_admin_token(&self, token: &str) -> Result<bool> {
        if token == self.admin_token {
            return Ok(true);
        }
        
        self.has_role(token, "admin").await
    }
    
    /// Clean up expired revoked tokens
    pub async fn cleanup_revoked_tokens(&self) -> Result<()> {
        let mut revoked_tokens = self.revoked_tokens.write().await;
        let now = Utc::now().timestamp();
        
        // Keep only tokens that are not expired
        // This is a simplification - in a real implementation, we would store the expiration time
        // with each revoked token and remove only those that are expired
        if revoked_tokens.len() > 1000 {
            revoked_tokens.clear();
            debug!("Cleared revoked tokens cache (exceeded 1000 entries)");
        }
        
        Ok(())
    }
}

/// Authentication middleware for the signaling server
pub struct AuthMiddleware {
    /// Authentication manager
    auth_manager: Arc<AuthManager>,
}

impl AuthMiddleware {
    /// Create a new authentication middleware
    pub fn new(auth_manager: Arc<AuthManager>) -> Self {
        Self {
            auth_manager,
        }
    }
    
    /// Authenticate a request
    pub async fn authenticate(&self, token: &str) -> Result<Claims> {
        self.auth_manager.validate_token(token).await
    }
    
    /// Check if a request is authorized for a specific role
    pub async fn authorize(&self, token: &str, role: &str) -> Result<bool> {
        self.auth_manager.has_role(token, role).await
    }
}

/// Authentication API
pub struct AuthApi {
    /// Authentication manager
    auth_manager: Arc<AuthManager>,
}

impl AuthApi {
    /// Create a new authentication API
    pub fn new(auth_manager: Arc<AuthManager>) -> Self {
        Self {
            auth_manager,
        }
    }
    
    /// Generate a token
    pub async fn generate_token(&self, peer_id: &str, roles: Vec<String>) -> Result<Token> {
        self.auth_manager.generate_token(peer_id, roles).await
    }
    
    /// Revoke a token
    pub async fn revoke_token(&self, token: &str) -> Result<()> {
        self.auth_manager.revoke_token(token).await
    }
    
    /// Validate a token
    pub async fn validate_token(&self, token: &str) -> Result<Claims> {
        self.auth_manager.validate_token(token).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_generate_and_validate_token() {
        let config = Config::default();
        let auth_manager = AuthManager::new(config).unwrap();
        
        let peer_id = "test-peer";
        let roles = vec!["user".to_string()];
        
        let token = auth_manager.generate_token(peer_id, roles).await.unwrap();
        let claims = auth_manager.validate_token(&token.value).await.unwrap();
        
        assert_eq!(claims.sub, peer_id);
        assert_eq!(claims.roles, vec!["user"]);
        assert!(claims.exp > Utc::now().timestamp());
    }
    
    #[tokio::test]
    async fn test_revoke_token() {
        let config = Config::default();
        let auth_manager = AuthManager::new(config).unwrap();
        
        let peer_id = "test-peer";
        let roles = vec!["user".to_string()];
        
        let token = auth_manager.generate_token(peer_id, roles).await.unwrap();
        
        // Token should be valid
        let result = auth_manager.validate_token(&token.value).await;
        assert!(result.is_ok());
        
        // Revoke the token
        auth_manager.revoke_token(&token.value).await.unwrap();
        
        // Token should be invalid
        let result = auth_manager.validate_token(&token.value).await;
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_has_role() {
        let config = Config::default();
        let auth_manager = AuthManager::new(config).unwrap();
        
        let peer_id = "test-peer";
        let roles = vec!["user".to_string(), "premium".to_string()];
        
        let token = auth_manager.generate_token(peer_id, roles).await.unwrap();
        
        // Check roles
        assert!(auth_manager.has_role(&token.value, "user").await.unwrap());
        assert!(auth_manager.has_role(&token.value, "premium").await.unwrap());
        assert!(!auth_manager.has_role(&token.value, "admin").await.unwrap());
    }
}