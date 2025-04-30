//! Authentication models for the REST API
//!
//! This module provides authentication models for the REST API.

use serde::{Deserialize, Serialize};

/// User
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    /// User ID
    pub id: String,
    /// Username
    pub username: String,
    /// Password hash
    pub password_hash: String,
    /// Created at timestamp
    pub created_at: u64,
    /// Updated at timestamp
    pub updated_at: u64,
}

/// User role
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum UserRole {
    /// Admin role
    Admin,
    /// User role
    User,
}

/// User with roles
#[derive(Debug, Serialize, Deserialize)]
pub struct UserWithRoles {
    /// User
    pub user: User,
    /// Roles
    pub roles: Vec<UserRole>,
}

/// User settings
#[derive(Debug, Serialize, Deserialize)]
pub struct UserSettings {
    /// User ID
    pub user_id: String,
    /// Theme
    pub theme: String,
    /// Language
    pub language: String,
    /// Notifications enabled
    pub notifications_enabled: bool,
    /// Created at timestamp
    pub created_at: u64,
    /// Updated at timestamp
    pub updated_at: u64,
}