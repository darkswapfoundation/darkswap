//! Models for the REST API
//!
//! This module provides models for the REST API.

use serde::{Deserialize, Serialize};

/// API error response
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    /// Error message
    pub message: String,
    /// Error code
    pub code: String,
}

/// API success response
#[derive(Debug, Serialize)]
pub struct SuccessResponse<T> {
    /// Success message
    pub message: String,
    /// Data
    pub data: T,
}

/// API pagination parameters
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    /// Page number (1-based)
    #[serde(default = "default_page")]
    pub page: usize,
    /// Page size
    #[serde(default = "default_page_size")]
    pub page_size: usize,
}

/// Default page number
fn default_page() -> usize {
    1
}

/// Default page size
fn default_page_size() -> usize {
    10
}

/// API pagination response
#[derive(Debug, Serialize)]
pub struct PaginationResponse<T> {
    /// Items
    pub items: Vec<T>,
    /// Total items
    pub total: usize,
    /// Page number (1-based)
    pub page: usize,
    /// Page size
    pub page_size: usize,
    /// Total pages
    pub total_pages: usize,
}

impl<T> PaginationResponse<T> {
    /// Create a new pagination response
    pub fn new(items: Vec<T>, total: usize, page: usize, page_size: usize) -> Self {
        let total_pages = (total + page_size - 1) / page_size;
        Self {
            items,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}