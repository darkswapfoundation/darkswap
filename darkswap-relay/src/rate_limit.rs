//! Rate limiting for the DarkSwap Relay Server
//!
//! This module provides rate limiting functionality for the relay server.
//! It helps protect against DoS attacks and ensures fair resource usage.

use crate::{
    config::Config,
    error::Error,
    Result,
};
use dashmap::DashMap;
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};

/// Rate limiter type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RateLimiterType {
    /// Connection rate limiter
    Connection,
    /// Message rate limiter
    Message,
    /// Bandwidth rate limiter
    Bandwidth,
}

/// Rate limiter configuration
#[derive(Debug, Clone)]
pub struct RateLimiterConfig {
    /// Maximum number of requests
    pub max_requests: u32,
    /// Time window in seconds
    pub window_seconds: u64,
}

/// Rate limiter entry
#[derive(Debug)]
struct RateLimiterEntry {
    /// Requests in the current window
    requests: u32,
    /// Window start time
    window_start: Instant,
}

/// Rate limiter
pub struct RateLimiter {
    /// Configuration
    config: RateLimiterConfig,
    /// Entries
    entries: DashMap<String, RateLimiterEntry>,
    /// Type
    limiter_type: RateLimiterType,
}

impl RateLimiter {
    /// Create a new rate limiter
    pub fn new(config: RateLimiterConfig, limiter_type: RateLimiterType) -> Self {
        Self {
            config,
            entries: DashMap::new(),
            limiter_type,
        }
    }
    
    /// Check if a request is allowed
    pub fn is_allowed(&self, key: &str) -> bool {
        let now = Instant::now();
        let window_duration = Duration::from_secs(self.config.window_seconds);
        
        // Get or create the entry
        let mut entry = self.entries.entry(key.to_string()).or_insert_with(|| RateLimiterEntry {
            requests: 0,
            window_start: now,
        });
        
        // Check if the window has expired
        if now.duration_since(entry.window_start) > window_duration {
            // Reset the window
            entry.requests = 0;
            entry.window_start = now;
        }
        
        // Check if the request is allowed
        if entry.requests >= self.config.max_requests {
            return false;
        }
        
        // Increment the request count
        entry.requests += 1;
        
        true
    }
    
    /// Get the number of remaining requests
    pub fn remaining(&self, key: &str) -> u32 {
        let now = Instant::now();
        let window_duration = Duration::from_secs(self.config.window_seconds);
        
        // Get the entry
        if let Some(entry) = self.entries.get(key) {
            // Check if the window has expired
            if now.duration_since(entry.window_start) > window_duration {
                return self.config.max_requests;
            }
            
            // Return the remaining requests
            self.config.max_requests.saturating_sub(entry.requests)
        } else {
            // No entry, so all requests are available
            self.config.max_requests
        }
    }
    
    /// Get the time until the window resets
    pub fn reset_in(&self, key: &str) -> Duration {
        let now = Instant::now();
        let window_duration = Duration::from_secs(self.config.window_seconds);
        
        // Get the entry
        if let Some(entry) = self.entries.get(key) {
            // Calculate the time until the window resets
            let elapsed = now.duration_since(entry.window_start);
            if elapsed > window_duration {
                Duration::from_secs(0)
            } else {
                window_duration - elapsed
            }
        } else {
            // No entry, so the window is already reset
            Duration::from_secs(0)
        }
    }
    
    /// Clean up expired entries
    pub fn cleanup(&self) {
        let now = Instant::now();
        let window_duration = Duration::from_secs(self.config.window_seconds);
        
        // Remove expired entries
        self.entries.retain(|_, entry| {
            now.duration_since(entry.window_start) <= window_duration
        });
    }
}

/// Rate limiting manager
pub struct RateLimitManager {
    /// Configuration
    config: Config,
    /// Connection rate limiter
    connection_limiter: Arc<RateLimiter>,
    /// Message rate limiter
    message_limiter: Arc<RateLimiter>,
    /// Bandwidth rate limiter
    bandwidth_limiter: Arc<RateLimiter>,
    /// Enabled flag
    enabled: bool,
}

impl RateLimitManager {
    /// Create a new rate limit manager
    pub fn new(config: Config) -> Result<Self> {
        // Check if rate limiting is enabled
        let enabled = std::env::var("DARKSWAP_RELAY_ENABLE_RATE_LIMITING")
            .ok()
            .and_then(|s| s.parse::<bool>().ok())
            .unwrap_or(false);
        
        // Get rate limiting settings from environment variables
        let connection_limit = std::env::var("DARKSWAP_RELAY_RATE_LIMIT_CONNECTIONS")
            .ok()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(100);
        
        let message_limit = std::env::var("DARKSWAP_RELAY_RATE_LIMIT_MESSAGES")
            .ok()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(1000);
        
        let bandwidth_limit = std::env::var("DARKSWAP_RELAY_RATE_LIMIT_BANDWIDTH")
            .ok()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(10 * 1024 * 1024); // 10 MB
        
        let window_seconds = std::env::var("DARKSWAP_RELAY_RATE_LIMIT_WINDOW")
            .ok()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(60); // 1 minute
        
        // Create rate limiters
        let connection_limiter = Arc::new(RateLimiter::new(
            RateLimiterConfig {
                max_requests: connection_limit,
                window_seconds,
            },
            RateLimiterType::Connection,
        ));
        
        let message_limiter = Arc::new(RateLimiter::new(
            RateLimiterConfig {
                max_requests: message_limit,
                window_seconds,
            },
            RateLimiterType::Message,
        ));
        
        let bandwidth_limiter = Arc::new(RateLimiter::new(
            RateLimiterConfig {
                max_requests: bandwidth_limit,
                window_seconds,
            },
            RateLimiterType::Bandwidth,
        ));
        
        Ok(Self {
            config,
            connection_limiter,
            message_limiter,
            bandwidth_limiter,
            enabled,
        })
    }
    
    /// Check if a connection is allowed
    pub fn allow_connection(&self, peer_id: &str) -> bool {
        if !self.enabled {
            return true;
        }
        
        self.connection_limiter.is_allowed(peer_id)
    }
    
    /// Check if a message is allowed
    pub fn allow_message(&self, peer_id: &str) -> bool {
        if !self.enabled {
            return true;
        }
        
        self.message_limiter.is_allowed(peer_id)
    }
    
    /// Check if bandwidth usage is allowed
    pub fn allow_bandwidth(&self, peer_id: &str, bytes: u32) -> bool {
        if !self.enabled {
            return true;
        }
        
        // For bandwidth, we need to check if the total bytes used is within the limit
        // This is a simplification - in a real implementation, we would track the actual
        // bandwidth usage over time
        let key = format!("{}:{}", peer_id, Instant::now().elapsed().as_secs() / self.bandwidth_limiter.config.window_seconds);
        
        // Check if adding these bytes would exceed the limit
        let remaining = self.bandwidth_limiter.remaining(&key);
        if bytes > remaining {
            return false;
        }
        
        // Use up the bandwidth
        for _ in 0..bytes {
            if !self.bandwidth_limiter.is_allowed(&key) {
                return false;
            }
        }
        
        true
    }
    
    /// Get the connection limit
    pub fn connection_limit(&self) -> u32 {
        self.connection_limiter.config.max_requests
    }
    
    /// Get the message limit
    pub fn message_limit(&self) -> u32 {
        self.message_limiter.config.max_requests
    }
    
    /// Get the bandwidth limit
    pub fn bandwidth_limit(&self) -> u32 {
        self.bandwidth_limiter.config.max_requests
    }
    
    /// Get the window duration
    pub fn window_duration(&self) -> Duration {
        Duration::from_secs(self.connection_limiter.config.window_seconds)
    }
    
    /// Clean up expired entries
    pub fn cleanup(&self) {
        self.connection_limiter.cleanup();
        self.message_limiter.cleanup();
        self.bandwidth_limiter.cleanup();
    }
    
    /// Check if rate limiting is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }
}

/// Rate limiting middleware for the signaling server
pub struct RateLimitMiddleware {
    /// Rate limit manager
    rate_limit_manager: Arc<RateLimitManager>,
}

impl RateLimitMiddleware {
    /// Create a new rate limiting middleware
    pub fn new(rate_limit_manager: Arc<RateLimitManager>) -> Self {
        Self {
            rate_limit_manager,
        }
    }
    
    /// Check if a connection is allowed
    pub fn allow_connection(&self, peer_id: &str) -> bool {
        self.rate_limit_manager.allow_connection(peer_id)
    }
    
    /// Check if a message is allowed
    pub fn allow_message(&self, peer_id: &str) -> bool {
        self.rate_limit_manager.allow_message(peer_id)
    }
    
    /// Check if bandwidth usage is allowed
    pub fn allow_bandwidth(&self, peer_id: &str, bytes: u32) -> bool {
        self.rate_limit_manager.allow_bandwidth(peer_id, bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_rate_limiter() {
        let config = RateLimiterConfig {
            max_requests: 5,
            window_seconds: 1,
        };
        
        let limiter = RateLimiter::new(config, RateLimiterType::Connection);
        
        // First 5 requests should be allowed
        for _ in 0..5 {
            assert!(limiter.is_allowed("test"));
        }
        
        // 6th request should be denied
        assert!(!limiter.is_allowed("test"));
        
        // Wait for the window to expire
        std::thread::sleep(Duration::from_secs(1));
        
        // Next request should be allowed
        assert!(limiter.is_allowed("test"));
    }
    
    #[test]
    fn test_remaining() {
        let config = RateLimiterConfig {
            max_requests: 5,
            window_seconds: 1,
        };
        
        let limiter = RateLimiter::new(config, RateLimiterType::Connection);
        
        // Initially, all requests are available
        assert_eq!(limiter.remaining("test"), 5);
        
        // After 1 request, 4 remain
        assert!(limiter.is_allowed("test"));
        assert_eq!(limiter.remaining("test"), 4);
        
        // After 4 more requests, 0 remain
        for _ in 0..4 {
            assert!(limiter.is_allowed("test"));
        }
        assert_eq!(limiter.remaining("test"), 0);
    }
    
    #[test]
    fn test_reset_in() {
        let config = RateLimiterConfig {
            max_requests: 5,
            window_seconds: 1,
        };
        
        let limiter = RateLimiter::new(config, RateLimiterType::Connection);
        
        // Initially, the window is already reset
        assert_eq!(limiter.reset_in("test").as_secs(), 0);
        
        // After a request, the window will reset in about 1 second
        assert!(limiter.is_allowed("test"));
        assert!(limiter.reset_in("test").as_secs() <= 1);
    }
    
    #[test]
    fn test_cleanup() {
        let config = RateLimiterConfig {
            max_requests: 5,
            window_seconds: 1,
        };
        
        let limiter = RateLimiter::new(config, RateLimiterType::Connection);
        
        // Add some entries
        assert!(limiter.is_allowed("test1"));
        assert!(limiter.is_allowed("test2"));
        
        // Wait for the window to expire
        std::thread::sleep(Duration::from_secs(1));
        
        // Clean up expired entries
        limiter.cleanup();
        
        // Entries should be removed
        assert_eq!(limiter.entries.len(), 0);
    }
}