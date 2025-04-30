//! WebRTC compression
//!
//! This module provides compression for WebRTC data channels.

#![cfg(feature = "webrtc")]

use crate::error::{Error, Result};
use flate2::read::{GzDecoder, ZlibDecoder};
use flate2::write::{GzEncoder, ZlibEncoder};
use flate2::Compression;
use std::io::{Read, Write};

/// Compression algorithm
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompressionAlgorithm {
    /// No compression
    None,
    /// Gzip compression
    Gzip,
    /// Zlib compression
    Zlib,
}

/// Compression level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompressionLevel {
    /// No compression
    None,
    /// Fast compression
    Fast,
    /// Default compression
    Default,
    /// Best compression
    Best,
}

impl CompressionLevel {
    /// Convert to flate2 compression level
    pub fn to_flate2(&self) -> Compression {
        match self {
            CompressionLevel::None => Compression::none(),
            CompressionLevel::Fast => Compression::fast(),
            CompressionLevel::Default => Compression::default(),
            CompressionLevel::Best => Compression::best(),
        }
    }
}

/// Compress data
pub fn compress(data: &[u8], algorithm: CompressionAlgorithm, level: CompressionLevel) -> Result<Vec<u8>> {
    match algorithm {
        CompressionAlgorithm::None => Ok(data.to_vec()),
        CompressionAlgorithm::Gzip => compress_gzip(data, level),
        CompressionAlgorithm::Zlib => compress_zlib(data, level),
    }
}

/// Decompress data
pub fn decompress(data: &[u8], algorithm: CompressionAlgorithm) -> Result<Vec<u8>> {
    match algorithm {
        CompressionAlgorithm::None => Ok(data.to_vec()),
        CompressionAlgorithm::Gzip => decompress_gzip(data),
        CompressionAlgorithm::Zlib => decompress_zlib(data),
    }
}

/// Compress data using gzip
fn compress_gzip(data: &[u8], level: CompressionLevel) -> Result<Vec<u8>> {
    let mut encoder = GzEncoder::new(Vec::new(), level.to_flate2());
    encoder.write_all(data).map_err(|e| Error::CompressionError(format!("Failed to compress data: {}", e)))?;
    encoder.finish().map_err(|e| Error::CompressionError(format!("Failed to finish compression: {}", e)))
}

/// Decompress data using gzip
fn decompress_gzip(data: &[u8]) -> Result<Vec<u8>> {
    let mut decoder = GzDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder.read_to_end(&mut decompressed).map_err(|e| Error::CompressionError(format!("Failed to decompress data: {}", e)))?;
    Ok(decompressed)
}

/// Compress data using zlib
fn compress_zlib(data: &[u8], level: CompressionLevel) -> Result<Vec<u8>> {
    let mut encoder = ZlibEncoder::new(Vec::new(), level.to_flate2());
    encoder.write_all(data).map_err(|e| Error::CompressionError(format!("Failed to compress data: {}", e)))?;
    encoder.finish().map_err(|e| Error::CompressionError(format!("Failed to finish compression: {}", e)))
}

/// Decompress data using zlib
fn decompress_zlib(data: &[u8]) -> Result<Vec<u8>> {
    let mut decoder = ZlibDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder.read_to_end(&mut decompressed).map_err(|e| Error::CompressionError(format!("Failed to decompress data: {}", e)))?;
    Ok(decompressed)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_compression_none() {
        let data = b"Hello, world!";
        let compressed = compress(data, CompressionAlgorithm::None, CompressionLevel::None).unwrap();
        assert_eq!(compressed, data);
        
        let decompressed = decompress(&compressed, CompressionAlgorithm::None).unwrap();
        assert_eq!(decompressed, data);
    }
    
    #[test]
    fn test_compression_gzip() {
        let data = b"Hello, world!";
        let compressed = compress(data, CompressionAlgorithm::Gzip, CompressionLevel::Default).unwrap();
        assert_ne!(compressed, data);
        
        let decompressed = decompress(&compressed, CompressionAlgorithm::Gzip).unwrap();
        assert_eq!(decompressed, data);
    }
    
    #[test]
    fn test_compression_zlib() {
        let data = b"Hello, world!";
        let compressed = compress(data, CompressionAlgorithm::Zlib, CompressionLevel::Default).unwrap();
        assert_ne!(compressed, data);
        
        let decompressed = decompress(&compressed, CompressionAlgorithm::Zlib).unwrap();
        assert_eq!(decompressed, data);
    }
    
    #[test]
    fn test_compression_levels() {
        let data = vec![0; 1000];
        
        // Test different compression levels
        let compressed_none = compress(&data, CompressionAlgorithm::Gzip, CompressionLevel::None).unwrap();
        let compressed_fast = compress(&data, CompressionAlgorithm::Gzip, CompressionLevel::Fast).unwrap();
        let compressed_default = compress(&data, CompressionAlgorithm::Gzip, CompressionLevel::Default).unwrap();
        let compressed_best = compress(&data, CompressionAlgorithm::Gzip, CompressionLevel::Best).unwrap();
        
        // Higher compression levels should result in smaller compressed data
        // But this is not guaranteed, so we don't assert it
        println!("None: {}", compressed_none.len());
        println!("Fast: {}", compressed_fast.len());
        println!("Default: {}", compressed_default.len());
        println!("Best: {}", compressed_best.len());
        
        // All compression levels should decompress correctly
        assert_eq!(decompress(&compressed_none, CompressionAlgorithm::Gzip).unwrap(), data);
        assert_eq!(decompress(&compressed_fast, CompressionAlgorithm::Gzip).unwrap(), data);
        assert_eq!(decompress(&compressed_default, CompressionAlgorithm::Gzip).unwrap(), data);
        assert_eq!(decompress(&compressed_best, CompressionAlgorithm::Gzip).unwrap(), data);
    }
    
    #[test]
    fn test_large_data() {
        // Create a large data set with some repetition
        let mut data = Vec::with_capacity(100000);
        for i in 0..10000 {
            data.extend_from_slice(&[i as u8, (i >> 8) as u8, 0, 0, 0]);
        }
        
        // Compress and decompress
        let compressed = compress(&data, CompressionAlgorithm::Gzip, CompressionLevel::Default).unwrap();
        let decompressed = decompress(&compressed, CompressionAlgorithm::Gzip).unwrap();
        
        // Verify
        assert_eq!(decompressed, data);
        
        // Check compression ratio
        let ratio = compressed.len() as f64 / data.len() as f64;
        println!("Compression ratio: {:.2}", ratio);
        assert!(ratio < 0.5); // Should compress to less than 50% of original size
    }
}