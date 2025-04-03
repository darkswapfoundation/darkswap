use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorTooManyRequests,
    http::header::{HeaderName, HeaderValue},
    web::Data,
    Error, HttpResponse,
};
use futures_util::future::{ok, LocalBoxFuture, Ready};
use serde::{Deserialize, Serialize};

/// Rate limit configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    /// The maximum number of requests allowed per window
    pub limit: u32,
    /// The window duration in seconds
    pub window: u64,
    /// Whether to use a sliding window
    pub sliding_window: bool,
    /// The paths to exclude from rate limiting
    pub exclude_paths: Vec<String>,
    /// The paths to include in rate limiting (if empty, all paths are included)
    pub include_paths: Vec<String>,
    /// The limit for authenticated users
    pub authenticated_limit: u32,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            limit: 100,
            window: 60,
            sliding_window: true,
            exclude_paths: vec!["/health".to_string()],
            include_paths: vec![],
            authenticated_limit: 1000,
        }
    }
}

/// Rate limiter entry
struct RateLimiterEntry {
    /// The number of requests made
    count: u32,
    /// The time of the first request in the current window
    first_request: Instant,
    /// The time of the last request
    last_request: Instant,
}

/// Rate limiter state
struct RateLimiterState {
    /// The rate limiter entries by IP address
    entries: HashMap<IpAddr, RateLimiterEntry>,
    /// The rate limiter configuration
    config: RateLimitConfig,
}

impl RateLimiterState {
    /// Create a new rate limiter state
    fn new(config: RateLimitConfig) -> Self {
        Self {
            entries: HashMap::new(),
            config,
        }
    }

    /// Check if a request is allowed
    fn is_allowed(&mut self, ip: IpAddr, authenticated: bool) -> (bool, u32, u32, u64) {
        let now = Instant::now();
        let window = Duration::from_secs(self.config.window);
        let limit = if authenticated {
            self.config.authenticated_limit
        } else {
            self.config.limit
        };

        // Get or create the entry for this IP
        let entry = self.entries.entry(ip).or_insert_with(|| RateLimiterEntry {
            count: 0,
            first_request: now,
            last_request: now,
        });

        // Update the entry
        entry.last_request = now;

        // Check if the window has expired
        if self.config.sliding_window {
            // Sliding window: check if the first request is outside the window
            if now.duration_since(entry.first_request) > window {
                // Reset the entry
                entry.count = 1;
                entry.first_request = now;
                return (true, 1, limit, self.config.window);
            }
        } else {
            // Fixed window: check if the first request is in a different window
            let window_start = now
                .checked_sub(Duration::from_secs(now.elapsed().as_secs() % self.config.window))
                .unwrap_or(now);
            if entry.first_request < window_start {
                // Reset the entry
                entry.count = 1;
                entry.first_request = now;
                return (true, 1, limit, self.config.window);
            }
        }

        // Increment the count
        entry.count += 1;

        // Check if the limit has been exceeded
        let allowed = entry.count <= limit;
        let remaining = if allowed {
            limit - entry.count
        } else {
            0
        };
        let reset = if self.config.sliding_window {
            // Sliding window: reset after window duration from the first request
            let elapsed = now.duration_since(entry.first_request).as_secs();
            if elapsed < self.config.window {
                self.config.window - elapsed
            } else {
                0
            }
        } else {
            // Fixed window: reset at the end of the current window
            let elapsed = now.elapsed().as_secs() % self.config.window;
            self.config.window - elapsed
        };

        (allowed, entry.count, remaining, reset)
    }

    /// Clean up expired entries
    fn cleanup(&mut self) {
        let now = Instant::now();
        let window = Duration::from_secs(self.config.window);
        self.entries.retain(|_, entry| {
            now.duration_since(entry.last_request) <= window
        });
    }
}

/// Rate limiter middleware
pub struct RateLimiter {
    /// The rate limiter state
    state: Arc<Mutex<RateLimiterState>>,
}

impl RateLimiter {
    /// Create a new rate limiter
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            state: Arc::new(Mutex::new(RateLimiterState::new(config))),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for RateLimiter
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = RateLimiterMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(RateLimiterMiddleware {
            service,
            state: self.state.clone(),
        })
    }
}

/// Rate limiter middleware
pub struct RateLimiterMiddleware<S> {
    /// The service
    service: S,
    /// The rate limiter state
    state: Arc<Mutex<RateLimiterState>>,
}

impl<S, B> Service<ServiceRequest> for RateLimiterMiddleware<S>
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
        // Clean up expired entries periodically
        if rand::random::<f32>() < 0.01 {
            if let Ok(mut state) = self.state.lock() {
                state.cleanup();
            }
        }

        // Check if the path is excluded
        let path = req.path().to_string();
        if let Ok(state) = self.state.lock() {
            if state.config.exclude_paths.contains(&path) {
                return Box::pin(self.service.call(req));
            }

            if !state.config.include_paths.is_empty() && !state.config.include_paths.iter().any(|p| path.starts_with(p)) {
                return Box::pin(self.service.call(req));
            }
        }

        // Get the client IP
        let ip = req.connection_info().realip_remote_addr()
            .and_then(|addr| addr.parse::<IpAddr>().ok())
            .unwrap_or_else(|| "0.0.0.0".parse().unwrap());

        // Check if the user is authenticated
        let authenticated = req.headers().contains_key("Authorization");

        // Check if the request is allowed
        let (allowed, count, remaining, reset) = match self.state.lock() {
            Ok(mut state) => state.is_allowed(ip, authenticated),
            Err(_) => (true, 0, 0, 0), // Allow the request if the lock fails
        };

        if !allowed {
            // Return a 429 Too Many Requests response
            let mut response = HttpResponse::TooManyRequests()
                .append_header(("X-RateLimit-Limit", HeaderValue::from(count)))
                .append_header(("X-RateLimit-Remaining", HeaderValue::from(remaining)))
                .append_header(("X-RateLimit-Reset", HeaderValue::from(reset)))
                .body("Too many requests");
            return Box::pin(async move { Ok(req.into_response(response.into_body())) });
        }

        // Add rate limit headers to the response
        let state = self.state.clone();
        let fut = self.service.call(req);

        Box::pin(async move {
            let mut res = fut.await?;
            if let Ok(state) = state.lock() {
                let limit = if authenticated {
                    state.config.authenticated_limit
                } else {
                    state.config.limit
                };
                res.headers_mut().append(
                    HeaderName::from_static("x-ratelimit-limit"),
                    HeaderValue::from(limit),
                );
                res.headers_mut().append(
                    HeaderName::from_static("x-ratelimit-remaining"),
                    HeaderValue::from(remaining),
                );
                res.headers_mut().append(
                    HeaderName::from_static("x-ratelimit-reset"),
                    HeaderValue::from(reset),
                );
            }
            Ok(res)
        })
    }
}

/// Register the rate limiter middleware
pub fn register_rate_limiter(config: RateLimitConfig) -> RateLimiter {
    RateLimiter::new(config)
}