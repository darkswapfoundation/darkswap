pub mod auth;
pub mod health;

#[cfg(test)]
mod tests;

use actix_web::web;
use std::sync::Arc;

use crate::middleware::auth::AuthService;

/// Register all controllers
pub fn register_controllers(
    config: &mut web::ServiceConfig,
    auth_service: Arc<AuthService>,
    version: String,
    environment: String,
) {
    // Register authentication routes
    auth::register_routes(config, auth_service);

    // Register health check routes
    health::register_routes(config, version, environment);

    // Register other controllers here
    // ...
}