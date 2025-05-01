//! End-to-end encryption for P2P communications
//!
//! This module provides functionality for encrypting and decrypting
//! messages between peers, with a focus on relay communications.

use darkswap_lib::{Error, Result};
use libp2p::PeerId;
use ring::{
    aead::{self, BoundKey, OpeningKey, SealingKey, UnboundKey},
    agreement,
    digest,
    hkdf,
    rand::{SecureRandom, SystemRandom},
};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tracing::{debug, info, warn};

/// Key exchange algorithm
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KeyExchangeAlgorithm {
    /// X25519 key exchange
    X25519,
}

/// Encryption algorithm
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EncryptionAlgorithm {
    /// AES-GCM-256
    AesGcm256,
    /// ChaCha20-Poly1305
    ChaCha20Poly1305,
}

/// Encryption configuration
#[derive(Debug, Clone)]
pub struct EncryptionConfig {
    /// Key exchange algorithm
    pub key_exchange_algorithm: KeyExchangeAlgorithm,
    /// Encryption algorithm
    pub encryption_algorithm: EncryptionAlgorithm,
    /// Key rotation interval
    pub key_rotation_interval: Duration,
    /// Whether to use forward secrecy
    pub use_forward_secrecy: bool,
    /// Whether to use ephemeral keys
    pub use_ephemeral_keys: bool,
}

impl Default for EncryptionConfig {
    fn default() -> Self {
        Self {
            key_exchange_algorithm: KeyExchangeAlgorithm::X25519,
            encryption_algorithm: EncryptionAlgorithm::AesGcm256,
            key_rotation_interval: Duration::from_secs(3600), // 1 hour
            use_forward_secrecy: true,
            use_ephemeral_keys: true,
        }
    }
}

/// Session key
#[derive(Debug)]
struct SessionKey {
    /// Key material
    key_material: Vec<u8>,
    /// Creation time
    created_at: Instant,
    /// Expiration time
    expires_at: Instant,
    /// Whether this is an ephemeral key
    is_ephemeral: bool,
}

impl SessionKey {
    /// Create a new session key
    fn new(key_material: Vec<u8>, ttl: Duration, is_ephemeral: bool) -> Self {
        let now = Instant::now();
        Self {
            key_material,
            created_at: now,
            expires_at: now + ttl,
            is_ephemeral,
        }
    }

    /// Check if the key is expired
    fn is_expired(&self) -> bool {
        Instant::now() > self.expires_at
    }

    /// Get the remaining time until expiration
    fn time_remaining(&self) -> Duration {
        if self.is_expired() {
            Duration::from_secs(0)
        } else {
            self.expires_at - Instant::now()
        }
    }
}

/// Key pair
#[derive(Debug)]
struct KeyPair {
    /// Private key
    private_key: Vec<u8>,
    /// Public key
    public_key: Vec<u8>,
    /// Creation time
    created_at: Instant,
    /// Whether this is an ephemeral key pair
    is_ephemeral: bool,
}

impl KeyPair {
    /// Generate a new key pair for X25519
    fn generate_x25519(rng: &SystemRandom, is_ephemeral: bool) -> Result<Self> {
        let private_key = agreement::EphemeralPrivateKey::generate(&agreement::X25519, rng)
            .map_err(|_| Error::EncryptionError("Failed to generate private key".to_string()))?;
        
        let public_key = private_key.compute_public_key()
            .map_err(|_| Error::EncryptionError("Failed to compute public key".to_string()))?
            .as_ref()
            .to_vec();
        
        let private_key = private_key.as_ref().to_vec();
        
        Ok(Self {
            private_key,
            public_key,
            created_at: Instant::now(),
            is_ephemeral,
        })
    }
}

/// Encryption manager
pub struct EncryptionManager {
    /// Configuration
    config: EncryptionConfig,
    /// Random number generator
    rng: SystemRandom,
    /// Long-term key pair
    long_term_key_pair: KeyPair,
    /// Ephemeral key pairs
    ephemeral_key_pairs: Mutex<HashMap<PeerId, KeyPair>>,
    /// Session keys
    session_keys: Mutex<HashMap<PeerId, SessionKey>>,
    /// Last key rotation time
    last_key_rotation: Mutex<Instant>,
}

impl EncryptionManager {
    /// Create a new encryption manager
    pub fn new(config: EncryptionConfig) -> Result<Self> {
        let rng = SystemRandom::new();
        
        // Generate long-term key pair
        let long_term_key_pair = match config.key_exchange_algorithm {
            KeyExchangeAlgorithm::X25519 => KeyPair::generate_x25519(&rng, false)?,
        };
        
        Ok(Self {
            config,
            rng,
            long_term_key_pair,
            ephemeral_key_pairs: Mutex::new(HashMap::new()),
            session_keys: Mutex::new(HashMap::new()),
            last_key_rotation: Mutex::new(Instant::now()),
        })
    }
    
    /// Get the public key
    pub fn get_public_key(&self) -> Vec<u8> {
        self.long_term_key_pair.public_key.clone()
    }
    
    /// Generate an ephemeral key pair for a peer
    pub fn generate_ephemeral_key_pair(&self, peer_id: &PeerId) -> Result<Vec<u8>> {
        if !self.config.use_ephemeral_keys {
            return Ok(self.long_term_key_pair.public_key.clone());
        }
        
        let key_pair = match self.config.key_exchange_algorithm {
            KeyExchangeAlgorithm::X25519 => KeyPair::generate_x25519(&self.rng, true)?,
        };
        
        let public_key = key_pair.public_key.clone();
        
        let mut ephemeral_key_pairs = self.ephemeral_key_pairs.lock().unwrap();
        ephemeral_key_pairs.insert(peer_id.clone(), key_pair);
        
        Ok(public_key)
    }
    
    /// Perform key exchange with a peer
    pub fn perform_key_exchange(&self, peer_id: &PeerId, peer_public_key: &[u8]) -> Result<()> {
        // Get the appropriate private key
        let private_key = if self.config.use_ephemeral_keys {
            let ephemeral_key_pairs = self.ephemeral_key_pairs.lock().unwrap();
            if let Some(key_pair) = ephemeral_key_pairs.get(peer_id) {
                key_pair.private_key.clone()
            } else {
                return Err(Error::EncryptionError("No ephemeral key pair found for peer".to_string()));
            }
        } else {
            self.long_term_key_pair.private_key.clone()
        };
        
        // Perform key agreement
        let shared_secret = match self.config.key_exchange_algorithm {
            KeyExchangeAlgorithm::X25519 => {
                let private_key = agreement::UnparsedPrivateKey::new(&agreement::X25519, &private_key);
                let peer_public_key = agreement::UnparsedPublicKey::new(&agreement::X25519, peer_public_key);
                
                let mut shared_secret = vec![0u8; 32];
                agreement::agree_ephemeral(
                    private_key,
                    &peer_public_key,
                    |secret| {
                        shared_secret.copy_from_slice(secret);
                        Ok(())
                    },
                )
                .map_err(|_| Error::EncryptionError("Key agreement failed".to_string()))?;
                
                shared_secret
            }
        };
        
        // Derive session key
        let salt = [0u8; 32]; // In a real implementation, use a proper salt
        let info = b"DarkSwap P2P Encryption";
        
        let hkdf = hkdf::Hkdf::<digest::SHA256>::new(Some(&salt), &shared_secret);
        let mut session_key = vec![0u8; 32];
        hkdf.expand(info, &mut session_key)
            .map_err(|_| Error::EncryptionError("HKDF expansion failed".to_string()))?;
        
        // Store the session key
        let mut session_keys = self.session_keys.lock().unwrap();
        session_keys.insert(
            peer_id.clone(),
            SessionKey::new(
                session_key,
                self.config.key_rotation_interval,
                self.config.use_ephemeral_keys,
            ),
        );
        
        Ok(())
    }
    
    /// Encrypt a message for a peer
    pub fn encrypt(&self, peer_id: &PeerId, plaintext: &[u8]) -> Result<Vec<u8>> {
        // Get the session key
        let session_keys = self.session_keys.lock().unwrap();
        let session_key = session_keys.get(peer_id)
            .ok_or_else(|| Error::EncryptionError("No session key found for peer".to_string()))?;
        
        if session_key.is_expired() {
            return Err(Error::EncryptionError("Session key expired".to_string()));
        }
        
        // Generate a random nonce
        let mut nonce = vec![0u8; 12];
        self.rng.fill(&mut nonce)
            .map_err(|_| Error::EncryptionError("Failed to generate nonce".to_string()))?;
        
        // Encrypt the message
        let mut ciphertext = match self.config.encryption_algorithm {
            EncryptionAlgorithm::AesGcm256 => {
                let key = aead::UnboundKey::new(&aead::AES_256_GCM, &session_key.key_material)
                    .map_err(|_| Error::EncryptionError("Failed to create encryption key".to_string()))?;
                
                let nonce_sequence = aead::Nonce::assume_unique_for_key(nonce.clone().try_into().unwrap());
                let mut sealing_key = aead::SealingKey::new(key, nonce_sequence);
                
                let mut in_out = plaintext.to_vec();
                sealing_key.seal_in_place_append_tag(aead::Aad::empty(), &mut in_out)
                    .map_err(|_| Error::EncryptionError("Encryption failed".to_string()))?;
                
                in_out
            }
            EncryptionAlgorithm::ChaCha20Poly1305 => {
                let key = aead::UnboundKey::new(&aead::CHACHA20_POLY1305, &session_key.key_material)
                    .map_err(|_| Error::EncryptionError("Failed to create encryption key".to_string()))?;
                
                let nonce_sequence = aead::Nonce::assume_unique_for_key(nonce.clone().try_into().unwrap());
                let mut sealing_key = aead::SealingKey::new(key, nonce_sequence);
                
                let mut in_out = plaintext.to_vec();
                sealing_key.seal_in_place_append_tag(aead::Aad::empty(), &mut in_out)
                    .map_err(|_| Error::EncryptionError("Encryption failed".to_string()))?;
                
                in_out
            }
        };
        
        // Prepend the nonce to the ciphertext
        let mut result = nonce;
        result.append(&mut ciphertext);
        
        Ok(result)
    }
    
    /// Decrypt a message from a peer
    pub fn decrypt(&self, peer_id: &PeerId, ciphertext: &[u8]) -> Result<Vec<u8>> {
        if ciphertext.len() < 12 {
            return Err(Error::EncryptionError("Ciphertext too short".to_string()));
        }
        
        // Extract the nonce and ciphertext
        let nonce = &ciphertext[0..12];
        let ciphertext = &ciphertext[12..];
        
        // Get the session key
        let session_keys = self.session_keys.lock().unwrap();
        let session_key = session_keys.get(peer_id)
            .ok_or_else(|| Error::EncryptionError("No session key found for peer".to_string()))?;
        
        if session_key.is_expired() {
            return Err(Error::EncryptionError("Session key expired".to_string()));
        }
        
        // Decrypt the message
        let plaintext = match self.config.encryption_algorithm {
            EncryptionAlgorithm::AesGcm256 => {
                let key = aead::UnboundKey::new(&aead::AES_256_GCM, &session_key.key_material)
                    .map_err(|_| Error::EncryptionError("Failed to create decryption key".to_string()))?;
                
                let nonce_sequence = aead::Nonce::assume_unique_for_key(nonce.try_into().unwrap());
                let mut opening_key = aead::OpeningKey::new(key, nonce_sequence);
                
                let mut in_out = ciphertext.to_vec();
                opening_key.open_in_place(aead::Aad::empty(), &mut in_out)
                    .map_err(|_| Error::EncryptionError("Decryption failed".to_string()))?;
                
                in_out
            }
            EncryptionAlgorithm::ChaCha20Poly1305 => {
                let key = aead::UnboundKey::new(&aead::CHACHA20_POLY1305, &session_key.key_material)
                    .map_err(|_| Error::EncryptionError("Failed to create decryption key".to_string()))?;
                
                let nonce_sequence = aead::Nonce::assume_unique_for_key(nonce.try_into().unwrap());
                let mut opening_key = aead::OpeningKey::new(key, nonce_sequence);
                
                let mut in_out = ciphertext.to_vec();
                opening_key.open_in_place(aead::Aad::empty(), &mut in_out)
                    .map_err(|_| Error::EncryptionError("Decryption failed".to_string()))?;
                
                in_out
            }
        };
        
        Ok(plaintext)
    }
    
    /// Rotate keys
    pub fn rotate_keys(&self) -> Result<()> {
        let mut last_key_rotation = self.last_key_rotation.lock().unwrap();
        if last_key_rotation.elapsed() < self.config.key_rotation_interval {
            return Ok(());
        }
        
        *last_key_rotation = Instant::now();
        
        // Generate new ephemeral key pairs for all peers
        if self.config.use_ephemeral_keys {
            let mut ephemeral_key_pairs = self.ephemeral_key_pairs.lock().unwrap();
            let peers: Vec<PeerId> = ephemeral_key_pairs.keys().cloned().collect();
            
            for peer_id in peers {
                let key_pair = match self.config.key_exchange_algorithm {
                    KeyExchangeAlgorithm::X25519 => KeyPair::generate_x25519(&self.rng, true)?,
                };
                
                ephemeral_key_pairs.insert(peer_id, key_pair);
            }
        }
        
        Ok(())
    }
    
    /// Prune expired keys
    pub fn prune_expired_keys(&self) {
        // Prune expired session keys
        let mut session_keys = self.session_keys.lock().unwrap();
        session_keys.retain(|_, key| !key.is_expired());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    
    #[test]
    fn test_encryption_manager() {
        // Create encryption configuration
        let config = EncryptionConfig {
            key_exchange_algorithm: KeyExchangeAlgorithm::X25519,
            encryption_algorithm: EncryptionAlgorithm::AesGcm256,
            key_rotation_interval: Duration::from_secs(3600),
            use_forward_secrecy: true,
            use_ephemeral_keys: true,
        };
        
        // Create encryption manager
        let encryption_manager = EncryptionManager::new(config).unwrap();
        
        // Generate ephemeral key pair for peer
        let peer_id = PeerId::random();
        let public_key = encryption_manager.generate_ephemeral_key_pair(&peer_id).unwrap();
        
        // Create another encryption manager for the peer
        let peer_encryption_manager = EncryptionManager::new(config).unwrap();
        let peer_public_key = peer_encryption_manager.generate_ephemeral_key_pair(&peer_id).unwrap();
        
        // Perform key exchange
        encryption_manager.perform_key_exchange(&peer_id, &peer_public_key).unwrap();
        peer_encryption_manager.perform_key_exchange(&peer_id, &public_key).unwrap();
        
        // Encrypt a message
        let plaintext = b"Hello, world!";
        let ciphertext = encryption_manager.encrypt(&peer_id, plaintext).unwrap();
        
        // Decrypt the message
        let decrypted = peer_encryption_manager.decrypt(&peer_id, &ciphertext).unwrap();
        
        assert_eq!(plaintext, decrypted.as_slice());
    }
    
    #[test]
    fn test_key_rotation() {
        // Create encryption configuration with short rotation interval
        let config = EncryptionConfig {
            key_exchange_algorithm: KeyExchangeAlgorithm::X25519,
            encryption_algorithm: EncryptionAlgorithm::AesGcm256,
            key_rotation_interval: Duration::from_millis(100),
            use_forward_secrecy: true,
            use_ephemeral_keys: true,
        };
        
        // Create encryption manager
        let encryption_manager = EncryptionManager::new(config).unwrap();
        
        // Generate ephemeral key pair for peer
        let peer_id = PeerId::random();
        let public_key = encryption_manager.generate_ephemeral_key_pair(&peer_id).unwrap();
        
        // Create another encryption manager for the peer
        let peer_encryption_manager = EncryptionManager::new(config).unwrap();
        let peer_public_key = peer_encryption_manager.generate_ephemeral_key_pair(&peer_id).unwrap();
        
        // Perform key exchange
        encryption_manager.perform_key_exchange(&peer_id, &peer_public_key).unwrap();
        peer_encryption_manager.perform_key_exchange(&peer_id, &public_key).unwrap();
        
        // Encrypt a message
        let plaintext = b"Hello, world!";
        let ciphertext = encryption_manager.encrypt(&peer_id, plaintext).unwrap();
        
        // Decrypt the message
        let decrypted = peer_encryption_manager.decrypt(&peer_id, &ciphertext).unwrap();
        
        assert_eq!(plaintext, decrypted.as_slice());
        
        // Wait for key rotation
        std::thread::sleep(Duration::from_millis(200));
        
        // Rotate keys
        encryption_manager.rotate_keys().unwrap();
        peer_encryption_manager.rotate_keys().unwrap();
        
        // Generate new ephemeral key pair for peer
        let public_key = encryption_manager.generate_ephemeral_key_pair(&peer_id).unwrap();
        let peer_public_key = peer_encryption_manager.generate_ephemeral_key_pair(&peer_id).unwrap();
        
        // Perform key exchange again
        encryption_manager.perform_key_exchange(&peer_id, &peer_public_key).unwrap();
        peer_encryption_manager.perform_key_exchange(&peer_id, &public_key).unwrap();
        
        // Encrypt a message
        let plaintext = b"Hello, world!";
        let ciphertext = encryption_manager.encrypt(&peer_id, plaintext).unwrap();
        
        // Decrypt the message
        let decrypted = peer_encryption_manager.decrypt(&peer_id, &ciphertext).unwrap();
        
        assert_eq!(plaintext, decrypted.as_slice());
    }
}