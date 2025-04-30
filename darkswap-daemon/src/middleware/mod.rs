pub mod auth;
pub mod error_handler;
pub mod logger;
pub mod rate_limiter;

#[cfg(test)]
mod tests;

use actix_web::web;
use auth::{AuthConfig, Auth};
use error_handler::log_error;
use logger::{LoggerConfig, RequestLogger};
use rate_limiter::{RateLimitConfig, RateLimiter};
use std::sync::Arc;

/// Register all middleware
pub fn register_middleware(config: &web::Data<crate::config::Config>) -> (RequestLogger, RateLimiter, Auth) {
    // Create logger middleware
    let logger_config = LoggerConfig {
        log_request_body: config.log.log_request_body,
        log_response_body: config.log.log_response_body,
        max_body_size: config.log.max_body_size,
        exclude_paths: config.log.exclude_paths.clone(),
        include_paths: config.log.include_paths.clone(),
    };
    let logger = logger::register_logger(logger_config);

    // Create rate limiter middleware
    let rate_limit_config = RateLimitConfig {
        limit: config.rate_limit.limit,
        window: config.rate_limit.window,
        sliding_window: config.rate_limit.sliding_window,
        exclude_paths: config.rate_limit.exclude_paths.clone(),
        include_paths: config.rate_limit.include_paths.clone(),
        authenticated_limit: config.rate_limit.authenticated_limit,
    };
    let rate_limiter = rate_limiter::register_rate_limiter(rate_limit_config);

    // Create authentication middleware
    let auth_config = AuthConfig {
        secret_key: config.auth.secret_key.clone(),
        token_expiration: config.auth.token_expiration,
        exclude_paths: config.auth.exclude_paths.clone(),
        include_paths: config.auth.include_paths.clone(),
    };
    let auth = auth::register_auth(auth_config);

    (logger, rate_limiter, auth)
}

/// Register error handlers
pub fn register_error_handlers() -> impl Fn(&actix_web::dev::ServiceResponse, &actix_web::Error) -> actix_web::Error + Clone {
    |res, err| {
        log_error(err);
        err.clone()
    }
}