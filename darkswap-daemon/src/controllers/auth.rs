use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::middleware::auth::{AuthService, UserInfo};
use crate::middleware::error_handler::ApiError;

/// Login request
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    /// The username
    pub username: String,
    /// The password
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    /// The JWT token
    pub token: String,
    /// The token expiration time
    pub expires_at: u64,
    /// The user information
    pub user: UserInfo,
}

/// Register request
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    /// The username
    pub username: String,
    /// The password
    pub password: String,
    /// The email
    pub email: String,
}

/// Register response
#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    /// The JWT token
    pub token: String,
    /// The token expiration time
    pub expires_at: u64,
    /// The user information
    pub user: UserInfo,
}

/// Authentication controller
pub struct AuthController {
    /// The authentication service
    auth_service: Arc<AuthService>,
}

impl AuthController {
    /// Create a new authentication controller
    pub fn new(auth_service: Arc<AuthService>) -> Self {
        Self { auth_service }
    }

    /// Login
    pub async fn login(&self, req: web::Json<LoginRequest>) -> Result<impl Responder, ApiError> {
        // In a real application, you would validate the username and password against a database
        // For this example, we'll just check if the username and password are not empty
        if req.username.is_empty() || req.password.is_empty() {
            return Err(ApiError::BadRequest("Username and password are required".to_string()));
        }

        // In a real application, you would check if the username and password are correct
        // For this example, we'll just check if the username is "admin" and the password is "password"
        if req.username != "admin" || req.password != "password" {
            return Err(ApiError::Unauthorized("Invalid username or password".to_string()));
        }

        // Generate a token
        let user_id = "user123".to_string();
        let roles = vec!["user".to_string(), "admin".to_string()];
        let token = self.auth_service.generate_token(&user_id, roles.clone())
            .map_err(|e| ApiError::InternalServerError(format!("Failed to generate token: {}", e)))?;

        // Calculate the expiration time
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        let expires_at = now + self.auth_service.config.token_expiration;

        // Create the response
        let response = LoginResponse {
            token,
            expires_at,
            user: UserInfo {
                id: user_id,
                roles,
            },
        };

        Ok(HttpResponse::Ok().json(response))
    }

    /// Register
    pub async fn register(&self, req: web::Json<RegisterRequest>) -> Result<impl Responder, ApiError> {
        // In a real application, you would validate the username, password, and email
        // For this example, we'll just check if they are not empty
        if req.username.is_empty() || req.password.is_empty() || req.email.is_empty() {
            return Err(ApiError::BadRequest("Username, password, and email are required".to_string()));
        }

        // In a real application, you would check if the username is already taken
        // For this example, we'll just check if the username is "admin"
        if req.username == "admin" {
            return Err(ApiError::Conflict("Username is already taken".to_string()));
        }

        // In a real application, you would create a new user in the database
        // For this example, we'll just generate a random user ID
        let user_id = format!("user_{}", rand::random::<u32>());
        let roles = vec!["user".to_string()];

        // Generate a token
        let token = self.auth_service.generate_token(&user_id, roles.clone())
            .map_err(|e| ApiError::InternalServerError(format!("Failed to generate token: {}", e)))?;

        // Calculate the expiration time
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        let expires_at = now + self.auth_service.config.token_expiration;

        // Create the response
        let response = RegisterResponse {
            token,
            expires_at,
            user: UserInfo {
                id: user_id,
                roles,
            },
        };

        Ok(HttpResponse::Created().json(response))
    }

    /// Get the current user
    pub async fn me(user_info: web::ReqData<UserInfo>) -> Result<impl Responder, ApiError> {
        Ok(HttpResponse::Ok().json(user_info.into_inner()))
    }
}

/// Register the authentication routes
pub fn register_routes(
    config: &web::ServiceConfig,
    auth_service: Arc<AuthService>,
) {
    let controller = web::Data::new(AuthController::new(auth_service));

    config.service(
        web::scope("/auth")
            .app_data(controller.clone())
            .route("/login", web::post().to(|controller: web::Data<AuthController>, req: web::Json<LoginRequest>| async move {
                controller.login(req).await
            }))
            .route("/register", web::post().to(|controller: web::Data<AuthController>, req: web::Json<RegisterRequest>| async move {
                controller.register(req).await
            }))
            .route("/me", web::get().to(AuthController::me))
    );
}