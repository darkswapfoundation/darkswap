//! DarkSwap Support Library
//!
//! This library provides support functionality for the DarkSwap platform.

pub mod crypto;
pub mod format;
pub mod validation;

/// Re-export common types from darkswap-lib
pub use darkswap_lib::{Error, Result};

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Library name
pub const NAME: &str = env!("CARGO_PKG_NAME");

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}