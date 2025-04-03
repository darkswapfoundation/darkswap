//! Cryptographic utilities for the DarkSwap platform.

use darkswap_lib::{Error, Result};
use rand::{rngs::OsRng, RngCore};
use sha2::Digest;

/// Generate a random secret key.
pub fn generate_secret_key() -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// Hash a password using a secure algorithm.
pub fn hash_password(password: &str) -> Result<String> {
    // In a real implementation, you would use a proper password hashing algorithm like Argon2.
    // For this example, we'll just use a simple hash.
    let mut hasher = sha2::Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    Ok(hex::encode(result))
}

/// Verify a password against a hash.
pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    let password_hash = hash_password(password)?;
    Ok(password_hash == hash)
}

/// Generate a JWT token.
pub fn generate_token(
    user_id: &str,
    roles: Vec<String>,
    secret_key: &str,
    expiration: u64,
) -> Result<String> {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde::{Deserialize, Serialize};
    use std::time::{SystemTime, UNIX_EPOCH};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        roles: Vec<String>,
        exp: u64,
        iat: u64,
        iss: String,
        aud: String,
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| Error::Internal(format!("Failed to get current time: {}", e)))?
        .as_secs();

    let claims = Claims {
        sub: user_id.to_string(),
        roles,
        exp: now + expiration,
        iat: now,
        iss: "darkswap".to_string(),
        aud: "darkswap-api".to_string(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret_key.as_bytes()),
    )
    .map_err(|e| Error::Internal(format!("Failed to generate token: {}", e)))?;

    Ok(token)
}

/// Validate a JWT token.
pub fn validate_token(token: &str, secret_key: &str) -> Result<(String, Vec<String>)> {
    use jsonwebtoken::{decode, DecodingKey, Validation};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        roles: Vec<String>,
        exp: u64,
        iat: u64,
        iss: String,
        aud: String,
    }

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret_key.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| Error::Authentication(format!("Invalid token: {}", e)))?;

    Ok((token_data.claims.sub, token_data.claims.roles))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_secret_key() {
        let key1 = generate_secret_key();
        let key2 = generate_secret_key();
        assert_ne!(key1, key2);
        assert_eq!(key1.len(), 64); // 32 bytes = 64 hex chars
    }

    #[test]
    fn test_hash_password() {
        let password = "password123";
        let hash = hash_password(password).unwrap();
        assert_ne!(hash, password);
        assert_eq!(hash.len(), 64); // SHA-256 = 32 bytes = 64 hex chars
    }

    #[test]
    fn test_verify_password() {
        let password = "password123";
        let hash = hash_password(password).unwrap();
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_generate_and_validate_token() {
        let user_id = "user123";
        let roles = vec!["user".to_string(), "admin".to_string()];
        let secret_key = "test_secret_key";
        let expiration = 3600; // 1 hour

        let token = generate_token(user_id, roles.clone(), secret_key, expiration).unwrap();
        let (sub, token_roles) = validate_token(&token, secret_key).unwrap();

        assert_eq!(sub, user_id);
        assert_eq!(token_roles, roles);
    }
}