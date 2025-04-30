//! DarkSwap Library
//!
//! This library provides common functionality for the DarkSwap platform.

pub mod error;
pub mod types;
pub mod utils;

/// Re-export common types
pub use error::Error;
pub use error::Result;

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