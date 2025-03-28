pub mod proto {
    include!(concat!(env!("OUT_DIR"), "/darkswap.p2p.rs"));
    include!(concat!(env!("OUT_DIR"), "/darkswap.orderbook.rs"));
    include!(concat!(env!("OUT_DIR"), "/darkswap.trade.rs"));
}

pub mod types {
    use serde::{Deserialize, Serialize};
    use std::fmt;
    use thiserror::Error;

    #[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
    pub struct PeerId(pub String);

    impl fmt::Display for PeerId {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{}", self.0)
        }
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Address {
        pub protocol: String,
        pub value: String,
    }

    impl fmt::Display for Address {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{}://{}", self.protocol, self.value)
        }
    }

    #[derive(Debug, Clone, Error, Serialize, Deserialize)]
    pub enum Error {
        #[error("Network error: {0}")]
        Network(String),
        
        #[error("Protocol error: {0}")]
        Protocol(String),
        
        #[error("Timeout error: {0}")]
        Timeout(String),
        
        #[error("Internal error: {0}")]
        Internal(String),
    }
}

pub mod utils {
    use crate::types::{Address, Error, PeerId};
    use std::time::{SystemTime, UNIX_EPOCH};

    pub fn parse_peer_id(s: &str) -> Result<PeerId, Error> {
        // Simple validation for now
        if s.is_empty() {
            return Err(Error::Protocol("Empty peer ID".to_string()));
        }
        Ok(PeerId(s.to_string()))
    }

    pub fn parse_address(s: &str) -> Result<Address, Error> {
        let parts: Vec<&str> = s.split("://").collect();
        if parts.len() != 2 {
            return Err(Error::Protocol(format!("Invalid address format: {}", s)));
        }
        
        Ok(Address {
            protocol: parts[0].to_string(),
            value: parts[1].to_string(),
        })
    }

    pub fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs()
    }
}