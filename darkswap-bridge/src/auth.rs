//! Authentication utilities for DarkSwap Bridge
//!
//! This module provides utilities for authentication and encryption.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use hmac::{Hmac, Mac};
use rand::{rngs::OsRng, RngCore};
use sha2::Sha256;
use std::fmt;

use crate::error::{Error, Result};

/// Authentication key
pub struct AuthKey {
    /// Key bytes
    key: [u8; 32],
}

impl AuthKey {
    /// Create a new random authentication key
    pub fn new_random() -> Self {
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        Self { key }
    }

    /// Create an authentication key from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() != 32 {
            return Err(Error::AuthError("Invalid key length".to_string()));
        }
        
        let mut key = [0u8; 32];
        key.copy_from_slice(bytes);
        
        Ok(Self { key })
    }

    /// Get the key bytes
    pub fn as_bytes(&self) -> &[u8] {
        &self.key
    }

    /// Create an HMAC from the key
    pub fn create_hmac(&self) -> Hmac<Sha256> {
        Hmac::<Sha256>::new_from_slice(&self.key).expect("HMAC can take key of any size")
    }

    /// Create an AES-GCM cipher from the key
    pub fn create_cipher(&self) -> Aes256Gcm {
        Aes256Gcm::new_from_slice(&self.key).expect("AES-GCM can take key of any size")
    }
}

impl fmt::Debug for AuthKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("AuthKey")
            .field("key", &"[redacted]")
            .finish()
    }
}

/// Authentication token
#[derive(Debug, Clone)]
pub struct AuthToken {
    /// Token bytes
    token: Vec<u8>,
}

impl AuthToken {
    /// Create a new random authentication token
    pub fn new_random() -> Self {
        let mut token = vec![0u8; 32];
        OsRng.fill_bytes(&mut token);
        Self { token }
    }

    /// Create an authentication token from bytes
    pub fn from_bytes(bytes: &[u8]) -> Self {
        Self {
            token: bytes.to_vec(),
        }
    }

    /// Get the token bytes
    pub fn as_bytes(&self) -> &[u8] {
        &self.token
    }
}

/// Authentication utilities
pub struct Auth;

impl Auth {
    /// Generate an HMAC for a message
    pub fn generate_hmac(key: &AuthKey, message: &[u8]) -> Vec<u8> {
        let mut mac = key.create_hmac();
        mac.update(message);
        mac.finalize().into_bytes().to_vec()
    }

    /// Verify an HMAC for a message
    pub fn verify_hmac(key: &AuthKey, message: &[u8], hmac: &[u8]) -> bool {
        let mut mac = key.create_hmac();
        mac.update(message);
        mac.verify_slice(hmac).is_ok()
    }

    /// Encrypt data
    pub fn encrypt(key: &AuthKey, data: &[u8]) -> Result<Vec<u8>> {
        // Generate a random nonce
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Create cipher
        let cipher = key.create_cipher();
        
        // Encrypt data
        let ciphertext = cipher.encrypt(nonce, data).map_err(|e| {
            Error::AuthError(format!("Encryption failed: {}", e))
        })?;
        
        // Combine nonce and ciphertext
        let mut result = Vec::with_capacity(nonce_bytes.len() + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);
        
        Ok(result)
    }

    /// Decrypt data
    pub fn decrypt(key: &AuthKey, data: &[u8]) -> Result<Vec<u8>> {
        // Split data into nonce and ciphertext
        if data.len() < 12 {
            return Err(Error::AuthError("Invalid encrypted data".to_string()));
        }
        
        let nonce = Nonce::from_slice(&data[..12]);
        let ciphertext = &data[12..];
        
        // Create cipher
        let cipher = key.create_cipher();
        
        // Decrypt data
        let plaintext = cipher.decrypt(nonce, ciphertext).map_err(|e| {
            Error::AuthError(format!("Decryption failed: {}", e))
        })?;
        
        Ok(plaintext)
    }

    /// Derive a key from a passphrase
    pub fn derive_key(passphrase: &str, salt: &[u8]) -> AuthKey {
        // Use PBKDF2 to derive a key from the passphrase
        let mut key = [0u8; 32];
        pbkdf2::pbkdf2::<Hmac<Sha256>>(
            passphrase.as_bytes(),
            salt,
            10000,
            &mut key,
        );
        
        AuthKey { key }
    }

    /// Generate a random salt
    pub fn generate_salt() -> [u8; 16] {
        let mut salt = [0u8; 16];
        OsRng.fill_bytes(&mut salt);
        salt
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_hmac() {
        let key = AuthKey::new_random();
        let message = b"Hello, world!";
        
        let hmac = Auth::generate_hmac(&key, message);
        assert!(Auth::verify_hmac(&key, message, &hmac));
        assert!(!Auth::verify_hmac(&key, b"Wrong message", &hmac));
        
        let wrong_key = AuthKey::new_random();
        assert!(!Auth::verify_hmac(&wrong_key, message, &hmac));
    }
    
    #[test]
    fn test_encryption() {
        let key = AuthKey::new_random();
        let data = b"Hello, world!";
        
        let encrypted = Auth::encrypt(&key, data).unwrap();
        let decrypted = Auth::decrypt(&key, &encrypted).unwrap();
        
        assert_eq!(decrypted, data);
        
        let wrong_key = AuthKey::new_random();
        assert!(Auth::decrypt(&wrong_key, &encrypted).is_err());
    }
    
    #[test]
    fn test_key_derivation() {
        let passphrase = "correct horse battery staple";
        let salt = Auth::generate_salt();
        
        let key1 = Auth::derive_key(passphrase, &salt);
        let key2 = Auth::derive_key(passphrase, &salt);
        let key3 = Auth::derive_key("wrong passphrase", &salt);
        
        assert_eq!(key1.as_bytes(), key2.as_bytes());
        assert_ne!(key1.as_bytes(), key3.as_bytes());
    }
}