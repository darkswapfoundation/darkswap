//! Error types for darkswap-p2p

use darkswap_support::types::Error as SupportError;
use thiserror::Error;

/// Error type for darkswap-p2p
#[derive(Debug, Error)]
pub enum Error {
    /// Support error
    #[error("Support error: {0}")]
    Support(#[from] SupportError),

    /// libp2p error
    #[error("libp2p error: {0}")]
    Libp2p(String),

    /// I/O error
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Transport error
    #[error("Transport error: {0}")]
    Transport(String),

    /// Circuit relay error
    #[error("Circuit relay error: {0}")]
    CircuitRelay(String),

    /// WebRTC error
    #[error("WebRTC error: {0}")]
    WebRtc(String),

    /// WebSocket error
    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Timeout error
    #[error("Timeout error: {0}")]
    Timeout(String),

    /// Other error
    #[error("Other error: {0}")]
    Other(String),
}

impl From<libp2p::swarm::DialError> for Error {
    fn from(err: libp2p::swarm::DialError) -> Self {
        Error::Libp2p(format!("Dial error: {}", err))
    }
}

impl From<libp2p::TransportError<std::io::Error>> for Error {
    fn from(err: libp2p::TransportError<std::io::Error>) -> Self {
        match err {
            libp2p::TransportError::MultiaddrNotSupported(addr) => {
                Error::Transport(format!("Multiaddr not supported: {}", addr))
            }
            libp2p::TransportError::Other(err) => Error::Io(err),
        }
    }
}