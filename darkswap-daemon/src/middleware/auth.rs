use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header::{HeaderName, HeaderValue},
    web::Data,
    Error, HttpMessage,
};
use futures_util::future::{ok, LocalBoxFuture, Ready};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Authentication configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    /// The secret key for JWT signing
    pub secret_key: String,
    /// The token expiration time in seconds
    pub token_expiration: u64,
    /// The paths to exclude from authentication
    pub exclude_paths: Vec<String>,
    /// The paths to include in authentication (if empty, all paths are included)
    pub include_paths: Vec<String>,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            secret_key: "default_secret_key".to_string(),
            token_expiration: 86400, // 24 hours
            exclude_paths: vec!["/health".to_string(), "/auth/login".to_string()],
            include_paths: vec![],
        }
    }
}

/// JWT claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// The subject (user ID)
    pub sub: String,
    /// The expiration time
    pub exp: u64,
    /// The issued at time
    pub iat: u64,
    /// The issuer
    pub iss: String,
    /// The audience
    pub aud: String,
    /// The roles
    pub roles: Vec<String>,
}

/// User information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    /// The user ID
    pub id: String,
    /// The roles
    pub roles: Vec<String>,
}

/// Authentication service
#[derive(Clone)]
pub struct AuthService {
    /// The authentication configuration
    config: AuthConfig,
}

impl AuthService {
    /// Create a new authentication service
    pub fn new(config: AuthConfig) -> Self {
        Self { config }
    }

    /// Generate a JWT token
    pub fn generate_token(&self, user_id: &str, roles: Vec<String>) -> Result<String, jsonwebtoken::errors::Error> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
        let claims = Claims {
            sub: user_id.to_string(),
            exp: now + self.config.token_expiration,
            iat: now,
            iss: "darkswap".to_string(),
            aud: "darkswap-api".to_string(),
            roles,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.secret_key.as_bytes()),
        )
    }

    /// Validate a JWT token
    pub fn validate_token(&self, token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        let validation = Validation::new(jsonwebtoken::Algorithm::HS256);
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.config.secret_key.as_bytes()),
            &validation,
        )?;

        Ok(token_data.claims)
    }
}

/// Authentication middleware
pub struct Auth {
    /// The authentication service
    service: Arc<AuthService>,
}

impl Auth {
    /// Create a new authentication middleware
    pub fn new(service: Arc<AuthService>) -> Self {
        Self { service }
    }
}

impl<S, B> Transform<S, ServiceRequest> for Auth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddleware {
            service,
            auth_service: self.service.clone(),
        })
    }
}

/// Authentication middleware
pub struct AuthMiddleware<S> {
    /// The service
    service: S,
    /// The authentication service
    auth_service: Arc<AuthService>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
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
        let config = &self.auth_service.config;
        if config.exclude_paths.contains(&path) || config.exclude_paths.iter().any(|p| path.starts_with(p)) {
            return Box::pin(self.service.call(req));
        }

        if !config.include_paths.is_empty() && !config.include_paths.iter().any(|p| path.starts_with(p)) {
            return Box::pin(self.service.call(req));
        }

        // Get the authorization header
        let auth_header = req.headers().get("Authorization");
        if auth_header.is_none() {
            return Box::pin(async move {
                Err(ErrorUnauthorized("Missing Authorization header"))
            });
        }

        // Parse the token
        let auth_header = auth_header.unwrap().to_str().unwrap_or("");
        if !auth_header.starts_with("Bearer ") {
            return Box::pin(async move {
                Err(ErrorUnauthorized("Invalid Authorization header format"))
            });
        }

        let token = &auth_header[7..];
        let auth_service = self.auth_service.clone();

        // Validate the token
        match auth_service.validate_token(token) {
            Ok(claims) => {
                // Add user info to the request extensions
                let user_info = UserInfo {
                    id: claims.sub.clone(),
                    roles: claims.roles.clone(),
                };
                req.extensions_mut().insert(user_info);

                // Call the service
                Box::pin(self.service.call(req))
            }
            Err(err) => {
                Box::pin(async move {
                    Err(ErrorUnauthorized(format!("Invalid token: {}", err)))
                })
            }
        }
    }
}

/// Register the authentication middleware
pub fn register_auth(config: AuthConfig) -> Auth {
    let service = Arc::new(AuthService::new(config));
    Auth::new(service)
}

/// Get the current user from the request
pub fn get_current_user(req: &ServiceRequest) -> Option<UserInfo> {
    req.extensions().get::<UserInfo>().cloned()
}

/// Check if the current user has a specific role
pub fn has_role(req: &ServiceRequest, role: &str) -> bool {
    if let Some(user) = get_current_user(req) {
        user.roles.contains(&role.to_string())
    } else {
        false
    }
}

/// Require a specific role
pub fn require_role(req: &ServiceRequest, role: &str) -> Result<(), Error> {
    if has_role(req, role) {
        Ok(())
    } else {
        Err(ErrorUnauthorized(format!("Requires role: {}", role)))
    }
}