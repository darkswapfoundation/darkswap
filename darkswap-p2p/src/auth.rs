//! Authentication and authorization for P2P connections
//!
//! This module provides functionality for authenticating and authorizing
//! peers in the P2P network, with a focus on relay nodes.

use crate::error::Error;
use libp2p::PeerId;
use ring::hmac::{self, Key, Tag};
use ring::rand::{SecureRandom, SystemRandom};
use std::{
    collections::{HashMap, HashSet},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tracing::{debug, info, warn};

/// Authentication method
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthMethod {
    /// No authentication
    None,
    /// Shared key authentication
    SharedKey,
    /// Challenge-response authentication
    ChallengeResponse,
    /// Public key authentication
    PublicKey,
}

/// Authentication result
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthResult {
    /// Authentication succeeded
    Success,
    /// Authentication failed
    Failure(String),
    /// Authentication pending
    Pending,
}

/// Authorization level
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum AuthorizationLevel {
    /// No authorization
    None = 0,
    /// Basic authorization (can connect)
    Basic = 1,
    /// Relay authorization (can relay traffic)
    Relay = 2,
    /// Admin authorization (can perform administrative tasks)
    Admin = 3,
}

/// Authentication token
#[derive(Debug, Clone)]
pub struct AuthToken {
    /// Peer ID
    pub peer_id: PeerId,
    /// Token value
    pub token: Vec<u8>,
    /// Expiration time
    pub expires_at: Instant,
    /// Authorization level
    pub level: AuthorizationLevel,
}

impl AuthToken {
    /// Create a new authentication token
    pub fn new(peer_id: PeerId, token: Vec<u8>, ttl: Duration, level: AuthorizationLevel) -> Self {
        Self {
            peer_id,
            token,
            expires_at: Instant::now() + ttl,
            level,
        }
    }

    /// Check if the token is expired
    pub fn is_expired(&self) -> bool {
        Instant::now() > self.expires_at
    }

    /// Get the remaining time until expiration
    pub fn time_remaining(&self) -> Duration {
        if self.is_expired() {
            Duration::from_secs(0)
        } else {
            self.expires_at - Instant::now()
        }
    }
}

/// Authentication challenge
#[derive(Debug, Clone)]
pub struct AuthChallenge {
    /// Peer ID
    pub peer_id: PeerId,
    /// Challenge value
    pub challenge: Vec<u8>,
    /// Expiration time
    pub expires_at: Instant,
}

impl AuthChallenge {
    /// Create a new authentication challenge
    pub fn new(peer_id: PeerId, challenge: Vec<u8>, ttl: Duration) -> Self {
        Self {
            peer_id,
            challenge,
            expires_at: Instant::now() + ttl,
        }
    }

    /// Check if the challenge is expired
    pub fn is_expired(&self) -> bool {
        Instant::now() > self.expires_at
    }
}

/// Authentication manager configuration
#[derive(Debug, Clone)]
pub struct AuthManagerConfig {
    /// Authentication method
    pub auth_method: AuthMethod,
    /// Shared key (for SharedKey authentication)
    pub shared_key: Option<Vec<u8>>,
    /// Token TTL
    pub token_ttl: Duration,
    /// Challenge TTL
    pub challenge_ttl: Duration,
    /// Trusted peers (automatically authorized)
    pub trusted_peers: HashSet<PeerId>,
    /// Banned peers
    pub banned_peers: HashSet<PeerId>,
    /// Default authorization level for authenticated peers
    pub default_auth_level: AuthorizationLevel,
    /// Whether to require authentication for all connections
    pub require_auth: bool,
}

impl Default for AuthManagerConfig {
    fn default() -> Self {
        Self {
            auth_method: AuthMethod::None,
            shared_key: None,
            token_ttl: Duration::from_secs(3600), // 1 hour
            challenge_ttl: Duration::from_secs(60), // 1 minute
            trusted_peers: HashSet::new(),
            banned_peers: HashSet::new(),
            default_auth_level: AuthorizationLevel::Basic,
            require_auth: false,
        }
    }
}

/// Authentication manager
pub struct AuthManager {
    /// Configuration
    config: AuthManagerConfig,
    /// Active tokens
    tokens: Mutex<HashMap<PeerId, AuthToken>>,
    /// Active challenges
    challenges: Mutex<HashMap<PeerId, AuthChallenge>>,
    /// Peer authorization levels
    auth_levels: Mutex<HashMap<PeerId, AuthorizationLevel>>,
    /// Random number generator
    rng: SystemRandom,
}

impl AuthManager {
    /// Create a new authentication manager
    pub fn new(config: AuthManagerConfig) -> Self {
        // Initialize authorization levels for trusted peers
        let mut auth_levels = HashMap::new();
        for peer_id in &config.trusted_peers {
            auth_levels.insert(peer_id.clone(), AuthorizationLevel::Admin);
        }

        Self {
            config,
            tokens: Mutex::new(HashMap::new()),
            challenges: Mutex::new(HashMap::new()),
            auth_levels: Mutex::new(auth_levels),
            rng: SystemRandom::new(),
        }
    }

    /// Check if a peer is banned
    pub fn is_banned(&self, peer_id: &PeerId) -> bool {
        self.config.banned_peers.contains(peer_id)
    }

    /// Check if a peer is trusted
    pub fn is_trusted(&self, peer_id: &PeerId) -> bool {
        self.config.trusted_peers.contains(peer_id)
    }

    /// Get the authorization level for a peer
    pub fn get_auth_level(&self, peer_id: &PeerId) -> AuthorizationLevel {
        let auth_levels = self.auth_levels.lock().unwrap();
        auth_levels
            .get(peer_id)
            .copied()
            .unwrap_or(AuthorizationLevel::None)
    }

    /// Set the authorization level for a peer
    pub fn set_auth_level(&self, peer_id: &PeerId, level: AuthorizationLevel) {
        let mut auth_levels = self.auth_levels.lock().unwrap();
        auth_levels.insert(peer_id.clone(), level);
    }

    /// Check if a peer is authorized for a specific level
    pub fn is_authorized(&self, peer_id: &PeerId, level: AuthorizationLevel) -> bool {
        let auth_level = self.get_auth_level(peer_id);
        auth_level >= level
    }

    /// Generate a new authentication token
    pub fn generate_token(&self, peer_id: &PeerId, level: AuthorizationLevel) -> Result<AuthToken, Error> {
        // Generate a random token
        let mut token = vec![0u8; 32];
        self.rng.fill(&mut token).map_err(|_| Error::AuthError("Failed to generate random token".to_string()))?;

        // Create the token
        let auth_token = AuthToken::new(peer_id.clone(), token, self.config.token_ttl, level);

        // Store the token
        let mut tokens = self.tokens.lock().unwrap();
        tokens.insert(peer_id.clone(), auth_token.clone());

        Ok(auth_token)
    }

    /// Validate an authentication token
    pub fn validate_token(&self, peer_id: &PeerId, token: &[u8]) -> AuthResult {
        // Check if the peer is banned
        if self.is_banned(peer_id) {
            return AuthResult::Failure("Peer is banned".to_string());
        }

        // Check if the peer is trusted
        if self.is_trusted(peer_id) {
            return AuthResult::Success;
        }

        // Get the stored token
        let tokens = self.tokens.lock().unwrap();
        if let Some(auth_token) = tokens.get(peer_id) {
            // Check if the token is expired
            if auth_token.is_expired() {
                return AuthResult::Failure("Token expired".to_string());
            }

            // Check if the token matches
            if auth_token.token == token {
                return AuthResult::Success;
            } else {
                return AuthResult::Failure("Invalid token".to_string());
            }
        }

        // No token found
        if self.config.require_auth {
            AuthResult::Failure("Authentication required".to_string())
        } else {
            AuthResult::Success
        }
    }

    /// Generate a new authentication challenge
    pub fn generate_challenge(&self, peer_id: &PeerId) -> Result<AuthChallenge, Error> {
        // Generate a random challenge
        let mut challenge = vec![0u8; 32];
        self.rng.fill(&mut challenge).map_err(|_| Error::AuthError("Failed to generate random challenge".to_string()))?;

        // Create the challenge
        let auth_challenge = AuthChallenge::new(peer_id.clone(), challenge, self.config.challenge_ttl);

        // Store the challenge
        let mut challenges = self.challenges.lock().unwrap();
        challenges.insert(peer_id.clone(), auth_challenge.clone());

        Ok(auth_challenge)
    }

    /// Verify a challenge response
    pub fn verify_challenge_response(&self, peer_id: &PeerId, response: &[u8]) -> AuthResult {
        // Check if the peer is banned
        if self.is_banned(peer_id) {
            return AuthResult::Failure("Peer is banned".to_string());
        }

        // Check if the peer is trusted
        if self.is_trusted(peer_id) {
            return AuthResult::Success;
        }

        // Get the stored challenge
        let mut challenges = self.challenges.lock().unwrap();
        if let Some(auth_challenge) = challenges.remove(peer_id) {
            // Check if the challenge is expired
            if auth_challenge.is_expired() {
                return AuthResult::Failure("Challenge expired".to_string());
            }

            // Verify the response
            match self.config.auth_method {
                AuthMethod::SharedKey => {
                    // For shared key authentication, the response should be HMAC(shared_key, challenge)
                    if let Some(shared_key) = &self.config.shared_key {
                        let key = Key::new(hmac::HMAC_SHA256, shared_key);
                        let expected_tag = hmac::sign(&key, &auth_challenge.challenge);
                        let expected_response = expected_tag.as_ref();

                        if response == expected_response {
                            // Authentication succeeded, generate a token
                            if let Ok(token) = self.generate_token(peer_id, self.config.default_auth_level) {
                                // Set the authorization level
                                self.set_auth_level(peer_id, token.level);
                                return AuthResult::Success;
                            } else {
                                return AuthResult::Failure("Failed to generate token".to_string());
                            }
                        } else {
                            return AuthResult::Failure("Invalid response".to_string());
                        }
                    } else {
                        return AuthResult::Failure("Shared key not configured".to_string());
                    }
                }
                AuthMethod::ChallengeResponse => {
                    // For challenge-response authentication, the response should be a signature of the challenge
                    // This is a simplified implementation, in a real system we would verify the signature
                    // using the peer's public key
                    if response.len() == 64 {
                        // Authentication succeeded, generate a token
                        if let Ok(token) = self.generate_token(peer_id, self.config.default_auth_level) {
                            // Set the authorization level
                            self.set_auth_level(peer_id, token.level);
                            return AuthResult::Success;
                        } else {
                            return AuthResult::Failure("Failed to generate token".to_string());
                        }
                    } else {
                        return AuthResult::Failure("Invalid response".to_string());
                    }
                }
                AuthMethod::PublicKey => {
                    // For public key authentication, the response should be a signature of the challenge
                    // This is a simplified implementation, in a real system we would verify the signature
                    // using the peer's public key
                    if response.len() == 64 {
                        // Authentication succeeded, generate a token
                        if let Ok(token) = self.generate_token(peer_id, self.config.default_auth_level) {
                            // Set the authorization level
                            self.set_auth_level(peer_id, token.level);
                            return AuthResult::Success;
                        } else {
                            return AuthResult::Failure("Failed to generate token".to_string());
                        }
                    } else {
                        return AuthResult::Failure("Invalid response".to_string());
                    }
                }
                AuthMethod::None => {
                    // No authentication required
                    return AuthResult::Success;
                }
            }
        }

        // No challenge found
        if self.config.require_auth {
            AuthResult::Failure("Authentication required".to_string())
        } else {
            AuthResult::Success
        }
    }

    /// Revoke a token
    pub fn revoke_token(&self, peer_id: &PeerId) {
        let mut tokens = self.tokens.lock().unwrap();
        tokens.remove(peer_id);
    }

    /// Prune expired tokens and challenges
    pub fn prune_expired(&self) {
        // Prune expired tokens
        let mut tokens = self.tokens.lock().unwrap();
        tokens.retain(|_, token| !token.is_expired());

        // Prune expired challenges
        let mut challenges = self.challenges.lock().unwrap();
        challenges.retain(|_, challenge| !challenge.is_expired());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_auth_token() {
        let peer_id = PeerId::random();
        let token = vec![1, 2, 3, 4];
        let ttl = Duration::from_secs(1);
        let level = AuthorizationLevel::Basic;

        let auth_token = AuthToken::new(peer_id.clone(), token.clone(), ttl, level);

        assert_eq!(auth_token.peer_id, peer_id);
        assert_eq!(auth_token.token, token);
        assert_eq!(auth_token.level, level);
        assert!(!auth_token.is_expired());

        // Wait for the token to expire
        std::thread::sleep(Duration::from_secs(2));
        assert!(auth_token.is_expired());
    }

    #[test]
    fn test_auth_challenge() {
        let peer_id = PeerId::random();
        let challenge = vec![1, 2, 3, 4];
        let ttl = Duration::from_secs(1);

        let auth_challenge = AuthChallenge::new(peer_id.clone(), challenge.clone(), ttl);

        assert_eq!(auth_challenge.peer_id, peer_id);
        assert_eq!(auth_challenge.challenge, challenge);
        assert!(!auth_challenge.is_expired());

        // Wait for the challenge to expire
        std::thread::sleep(Duration::from_secs(2));
        assert!(auth_challenge.is_expired());
    }

    #[test]
    fn test_auth_manager_trusted_peers() {
        let peer_id = PeerId::random();
        let mut trusted_peers = HashSet::new();
        trusted_peers.insert(peer_id.clone());

        let config = AuthManagerConfig {
            trusted_peers,
            ..Default::default()
        };

        let auth_manager = AuthManager::new(config);

        assert!(auth_manager.is_trusted(&peer_id));
        assert!(auth_manager.is_authorized(&peer_id, AuthorizationLevel::Admin));
    }

    #[test]
    fn test_auth_manager_banned_peers() {
        let peer_id = PeerId::random();
        let mut banned_peers = HashSet::new();
        banned_peers.insert(peer_id.clone());

        let config = AuthManagerConfig {
            banned_peers,
            ..Default::default()
        };

        let auth_manager = AuthManager::new(config);

        assert!(auth_manager.is_banned(&peer_id));
        assert_eq!(
            auth_manager.validate_token(&peer_id, &[1, 2, 3, 4]),
            AuthResult::Failure("Peer is banned".to_string())
        );
    }

    #[test]
    fn test_auth_manager_token_validation() {
        let peer_id = PeerId::random();
        let config = AuthManagerConfig {
            auth_method: AuthMethod::SharedKey,
            shared_key: Some(vec![1, 2, 3, 4]),
            ..Default::default()
        };

        let auth_manager = AuthManager::new(config);

        // Generate a token
        let token = auth_manager.generate_token(&peer_id, AuthorizationLevel::Basic).unwrap();

        // Validate the token
        let result = auth_manager.validate_token(&peer_id, &token.token);
        assert_eq!(result, AuthResult::Success);

        // Validate with an invalid token
        let result = auth_manager.validate_token(&peer_id, &[5, 6, 7, 8]);
        assert_eq!(result, AuthResult::Failure("Invalid token".to_string()));
    }

    #[test]
    fn test_auth_manager_challenge_response() {
        let peer_id = PeerId::random();
        let shared_key = vec![1, 2, 3, 4];
        let config = AuthManagerConfig {
            auth_method: AuthMethod::SharedKey,
            shared_key: Some(shared_key.clone()),
            ..Default::default()
        };

        let auth_manager = AuthManager::new(config);

        // Generate a challenge
        let challenge = auth_manager.generate_challenge(&peer_id).unwrap();

        // Create a response
        let key = Key::new(hmac::HMAC_SHA256, &shared_key);
        let tag = hmac::sign(&key, &challenge.challenge);
        let response = tag.as_ref().to_vec();

        // Verify the response
        let result = auth_manager.verify_challenge_response(&peer_id, &response);
        assert_eq!(result, AuthResult::Success);

        // Verify with an invalid response
        let result = auth_manager.verify_challenge_response(&peer_id, &[5, 6, 7, 8]);
        assert_eq!(result, AuthResult::Failure("Invalid response".to_string()));
    }
}