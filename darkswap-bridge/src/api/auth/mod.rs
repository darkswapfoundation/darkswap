//! Authentication module for the REST API
//!
//! This module provides authentication functionality for the REST API.

pub mod handlers;
pub mod models;

use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crate::error::{Error, Result};

/// JWT claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// Expiration time (as Unix timestamp)
    pub exp: u64,
    /// Issued at (as Unix timestamp)
    pub iat: u64,
}

/// Authentication utilities
pub struct Auth;

impl Auth {
    /// Generate a JWT token
    pub fn generate_token(user_id: &str, secret: &[u8]) -> Result<String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| Error::AuthError(format!("Failed to get current time: {}", e)))?
            .as_secs();
        
        let claims = Claims {
            sub: user_id.to_string(),
            exp: now + 24 * 3600, // 24 hours
            iat: now,
        };
        
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret),
        )
        .map_err(|e| Error::AuthError(format!("Failed to generate token: {}", e)))?;
        
        Ok(token)
    }

    /// Validate a JWT token
    pub fn validate_token(token: &str, secret: &[u8]) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret),
            &Validation::default(),
        )
        .map_err(|e| Error::AuthError(format!("Failed to validate token: {}", e)))?;
        
        Ok(token_data.claims)
    }

    /// Hash a password
    pub fn hash_password(password: &str) -> Result<String> {
        let salt = crate::utils::generate_id();
        let hash = crate::auth::Auth::derive_key(password, salt.as_bytes());
        
        Ok(format!("{}:{}", salt, hex::encode(hash.as_bytes())))
    }

    /// Verify a password
    pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
        let parts: Vec<&str> = hash.split(':').collect();
        if parts.len() != 2 {
            return Err(Error::AuthError("Invalid hash format".to_string()));
        }
        
        let salt = parts[0];
        let hash_hex = parts[1];
        
        let hash_bytes = hex::decode(hash_hex)
            .map_err(|e| Error::AuthError(format!("Failed to decode hash: {}", e)))?;
        
        let derived_key = crate::auth::Auth::derive_key(password, salt.as_bytes());
        
        Ok(derived_key.as_bytes() == hash_bytes.as_slice())
    }
}