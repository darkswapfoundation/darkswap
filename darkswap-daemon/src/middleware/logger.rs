use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error,
};
use futures_util::future::{ok, LocalBoxFuture, Ready};
use serde::{Deserialize, Serialize};
use std::{
    future::Future,
    pin::Pin,
    task::{Context, Poll},
    time::Instant,
};
use uuid::Uuid;

/// Logger configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggerConfig {
    /// Whether to log request bodies
    pub log_request_body: bool,
    /// Whether to log response bodies
    pub log_response_body: bool,
    /// The maximum body size to log (in bytes)
    pub max_body_size: usize,
    /// The paths to exclude from logging
    pub exclude_paths: Vec<String>,
    /// The paths to include in logging (if empty, all paths are included)
    pub include_paths: Vec<String>,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        Self {
            log_request_body: false,
            log_response_body: false,
            max_body_size: 1024,
            exclude_paths: vec!["/health".to_string()],
            include_paths: vec![],
        }
    }
}

/// Request logger middleware
pub struct RequestLogger {
    /// The logger configuration
    config: LoggerConfig,
}

impl RequestLogger {
    /// Create a new request logger
    pub fn new(config: LoggerConfig) -> Self {
        Self { config }
    }
}

impl<S, B> Transform<S, ServiceRequest> for RequestLogger
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = RequestLoggerMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(RequestLoggerMiddleware {
            service,
            config: self.config.clone(),
        })
    }
}

/// Request logger middleware
pub struct RequestLoggerMiddleware<S> {
    /// The service
    service: S,
    /// The logger configuration
    config: LoggerConfig,
}

impl<S, B> Service<ServiceRequest> for RequestLoggerMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Check if the path is excluded
        let path = req.path().to_string();
        if self.config.exclude_paths.contains(&path) {
            return Box::pin(self.service.call(req));
        }

        if !self.config.include_paths.is_empty() && !self.config.include_paths.iter().any(|p| path.starts_with(p)) {
            return Box::pin(self.service.call(req));
        }

        // Generate a request ID
        let request_id = Uuid::new_v4().to_string();

        // Get the start time
        let start_time = Instant::now();

        // Log the request
        let method = req.method().to_string();
        let path = req.path().to_string();
        let query = req.query_string().to_string();
        let remote_addr = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
        let user_agent = req.headers().get("User-Agent").and_then(|h| h.to_str().ok()).unwrap_or("unknown").to_string();
        let content_length = req.headers().get("Content-Length").and_then(|h| h.to_str().ok()).unwrap_or("0").to_string();
        let content_type = req.headers().get("Content-Type").and_then(|h| h.to_str().ok()).unwrap_or("unknown").to_string();

        log::info!(
            "Request: id={} method={} path={} query={} remote_addr={} user_agent={} content_length={} content_type={}",
            request_id,
            method,
            path,
            query,
            remote_addr,
            user_agent,
            content_length,
            content_type
        );

        // Call the service
        let fut = self.service.call(req);
        let config = self.config.clone();

        Box::pin(async move {
            // Get the response
            let res = fut.await?;

            // Calculate the elapsed time
            let elapsed = start_time.elapsed();

            // Log the response
            let status = res.status().as_u16();
            let content_length = res.headers().get("Content-Length").and_then(|h| h.to_str().ok()).unwrap_or("0").to_string();
            let content_type = res.headers().get("Content-Type").and_then(|h| h.to_str().ok()).unwrap_or("unknown").to_string();

            log::info!(
                "Response: id={} status={} elapsed={:?} content_length={} content_type={}",
                request_id,
                status,
                elapsed,
                content_length,
                content_type
            );

            // Return the response
            Ok(res)
        })
    }
}

/// Register the request logger middleware
pub fn register_logger(config: LoggerConfig) -> RequestLogger {
    RequestLogger::new(config)
}