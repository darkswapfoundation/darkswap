//! Utility functions for the DarkSwap Relay Server
//!
//! This module provides utility functions for the DarkSwap Relay Server.

use crate::Result;
use std::{
    net::{IpAddr, Ipv4Addr, SocketAddr},
    str::FromStr,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tracing::{debug, error, info, warn};

/// Get the current timestamp in seconds
pub fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0))
        .as_secs()
}

/// Get the current timestamp in milliseconds
pub fn current_timestamp_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0))
        .as_millis()
}

/// Parse a socket address from a string
pub fn parse_socket_addr(addr: &str) -> Result<SocketAddr> {
    // Try to parse as a socket address
    if let Ok(addr) = addr.parse::<SocketAddr>() {
        return Ok(addr);
    }
    
    // Try to parse as an IP address
    if let Ok(ip) = addr.parse::<IpAddr>() {
        return Ok(SocketAddr::new(ip, 0));
    }
    
    // Try to parse as a hostname:port
    if let Some((host, port)) = addr.rsplit_once(':') {
        if let Ok(port) = port.parse::<u16>() {
            // Try to parse the host as an IP address
            if let Ok(ip) = host.parse::<IpAddr>() {
                return Ok(SocketAddr::new(ip, port));
            }
            
            // Assume the host is a hostname
            // In a real implementation, we would resolve the hostname
            // For now, just return a placeholder
            return Ok(SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), port));
        }
    }
    
    // Default to localhost:0
    Err(crate::error::Error::Other(format!("Failed to parse socket address: {}", addr)))
}

/// Format a duration as a human-readable string
pub fn format_duration(duration: Duration) -> String {
    let seconds = duration.as_secs();
    
    if seconds < 60 {
        return format!("{}s", seconds);
    }
    
    let minutes = seconds / 60;
    let seconds = seconds % 60;
    
    if minutes < 60 {
        return format!("{}m {}s", minutes, seconds);
    }
    
    let hours = minutes / 60;
    let minutes = minutes % 60;
    
    if hours < 24 {
        return format!("{}h {}m {}s", hours, minutes, seconds);
    }
    
    let days = hours / 24;
    let hours = hours % 24;
    
    format!("{}d {}h {}m {}s", days, hours, minutes, seconds)
}

/// Format a size in bytes as a human-readable string
pub fn format_size(size: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;
    const TB: u64 = GB * 1024;
    
    if size < KB {
        return format!("{} B", size);
    }
    
    if size < MB {
        return format!("{:.2} KB", size as f64 / KB as f64);
    }
    
    if size < GB {
        return format!("{:.2} MB", size as f64 / MB as f64);
    }
    
    if size < TB {
        return format!("{:.2} GB", size as f64 / GB as f64);
    }
    
    format!("{:.2} TB", size as f64 / TB as f64)
}

/// Generate a random string of the specified length
pub fn random_string(length: usize) -> String {
    use rand::{distributions::Alphanumeric, Rng};
    
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect()
}

/// Generate a random peer ID
pub fn random_peer_id() -> String {
    format!("peer-{}", random_string(8))
}

/// Check if a string is a valid peer ID
pub fn is_valid_peer_id(peer_id: &str) -> bool {
    // Peer IDs must be at least 4 characters long
    if peer_id.len() < 4 {
        return false;
    }
    
    // Peer IDs must only contain alphanumeric characters, hyphens, and underscores
    peer_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

/// Parse a multiaddr string into a socket address
pub fn parse_multiaddr(addr: &str) -> Result<SocketAddr> {
    // Parse the multiaddr
    let multiaddr = libp2p::multiaddr::Multiaddr::from_str(addr)
        .map_err(|e| crate::error::Error::Other(format!("Failed to parse multiaddr: {}", e)))?;
    
    // Extract the IP address and port
    let mut ip = None;
    let mut port = None;
    
    for protocol in multiaddr.iter() {
        match protocol {
            libp2p::multiaddr::Protocol::Ip4(ipv4) => {
                ip = Some(IpAddr::V4(ipv4));
            }
            libp2p::multiaddr::Protocol::Ip6(ipv6) => {
                ip = Some(IpAddr::V6(ipv6));
            }
            libp2p::multiaddr::Protocol::Tcp(p) => {
                port = Some(p);
            }
            _ => {}
        }
    }
    
    // Create the socket address
    match (ip, port) {
        (Some(ip), Some(port)) => Ok(SocketAddr::new(ip, port)),
        _ => Err(crate::error::Error::Other(format!("Failed to extract IP address and port from multiaddr: {}", addr))),
    }
}

/// Convert a socket address to a multiaddr
pub fn socket_addr_to_multiaddr(addr: SocketAddr) -> libp2p::multiaddr::Multiaddr {
    let mut multiaddr = libp2p::multiaddr::Multiaddr::empty();
    
    match addr.ip() {
        IpAddr::V4(ipv4) => {
            multiaddr.push(libp2p::multiaddr::Protocol::Ip4(ipv4));
        }
        IpAddr::V6(ipv6) => {
            multiaddr.push(libp2p::multiaddr::Protocol::Ip6(ipv6));
        }
    }
    
    multiaddr.push(libp2p::multiaddr::Protocol::Tcp(addr.port()));
    
    multiaddr
}

/// Convert a peer ID to a multiaddr
pub fn peer_id_to_multiaddr(peer_id: &str, addr: SocketAddr) -> libp2p::multiaddr::Multiaddr {
    let mut multiaddr = socket_addr_to_multiaddr(addr);
    
    // Parse the peer ID
    if let Ok(peer_id) = libp2p::PeerId::from_str(peer_id) {
        multiaddr.push(libp2p::multiaddr::Protocol::P2p(peer_id.into()));
    }
    
    multiaddr
}

/// Get the version information
pub fn version_info() -> String {
    format!(
        "DarkSwap Relay Server v{}",
        crate::VERSION
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_current_timestamp() {
        let timestamp = current_timestamp();
        assert!(timestamp > 0);
    }
    
    #[test]
    fn test_current_timestamp_millis() {
        let timestamp = current_timestamp_millis();
        assert!(timestamp > 0);
    }
    
    #[test]
    fn test_parse_socket_addr() {
        // Test valid socket addresses
        assert!(parse_socket_addr("127.0.0.1:8080").is_ok());
        assert!(parse_socket_addr("[::1]:8080").is_ok());
        
        // Test invalid socket addresses
        assert!(parse_socket_addr("invalid").is_err());
        assert!(parse_socket_addr("127.0.0.1:invalid").is_err());
    }
    
    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(Duration::from_secs(30)), "30s");
        assert_eq!(format_duration(Duration::from_secs(90)), "1m 30s");
        assert_eq!(format_duration(Duration::from_secs(3600)), "1h 0m 0s");
        assert_eq!(format_duration(Duration::from_secs(86400)), "1d 0h 0m 0s");
    }
    
    #[test]
    fn test_format_size() {
        assert_eq!(format_size(500), "500 B");
        assert_eq!(format_size(1500), "1.46 KB");
        assert_eq!(format_size(1500000), "1.43 MB");
        assert_eq!(format_size(1500000000), "1.40 GB");
    }
    
    #[test]
    fn test_random_string() {
        let s1 = random_string(10);
        let s2 = random_string(10);
        
        assert_eq!(s1.len(), 10);
        assert_eq!(s2.len(), 10);
        assert_ne!(s1, s2);
    }
    
    #[test]
    fn test_random_peer_id() {
        let peer_id = random_peer_id();
        assert!(peer_id.starts_with("peer-"));
        assert_eq!(peer_id.len(), 13); // "peer-" + 8 random chars
    }
    
    #[test]
    fn test_is_valid_peer_id() {
        assert!(is_valid_peer_id("peer-123"));
        assert!(is_valid_peer_id("peer_123"));
        assert!(!is_valid_peer_id("p"));
        assert!(!is_valid_peer_id("peer 123"));
    }
}