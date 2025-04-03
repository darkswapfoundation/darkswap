use actix_web::{
    error::{Error, JsonPayloadError, PathError, QueryPayloadError, UrlencodedError},
    http::{header::ContentType, StatusCode},
    HttpResponse, ResponseError,
};
use derive_more::{Display, Error};
use serde::{Deserialize, Serialize};
use std::fmt;

/// API error response
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    /// The error code
    pub code: String,
    /// The error message
    pub message: String,
    /// Additional error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

/// API error
#[derive(Debug, Display, Error)]
pub enum ApiError {
    /// Bad request
    #[display(fmt = "Bad Request: {}", _0)]
    BadRequest(String),

    /// Unauthorized
    #[display(fmt = "Unauthorized: {}", _0)]
    Unauthorized(String),

    /// Forbidden
    #[display(fmt = "Forbidden: {}", _0)]
    Forbidden(String),

    /// Not found
    #[display(fmt = "Not Found: {}", _0)]
    NotFound(String),

    /// Conflict
    #[display(fmt = "Conflict: {}", _0)]
    Conflict(String),

    /// Unprocessable entity
    #[display(fmt = "Unprocessable Entity: {}", _0)]
    UnprocessableEntity(String),

    /// Too many requests
    #[display(fmt = "Too Many Requests: {}", _0)]
    TooManyRequests(String),

    /// Internal server error
    #[display(fmt = "Internal Server Error: {}", _0)]
    InternalServerError(String),

    /// Service unavailable
    #[display(fmt = "Service Unavailable: {}", _0)]
    ServiceUnavailable(String),

    /// Database error
    #[display(fmt = "Database Error: {}", _0)]
    DatabaseError(String),

    /// Validation error
    #[display(fmt = "Validation Error: {}", _0)]
    ValidationError(String),

    /// JSON error
    #[display(fmt = "JSON Error: {}", _0)]
    JsonError(String),

    /// Authentication error
    #[display(fmt = "Authentication Error: {}", _0)]
    AuthenticationError(String),

    /// Authorization error
    #[display(fmt = "Authorization Error: {}", _0)]
    AuthorizationError(String),

    /// External service error
    #[display(fmt = "External Service Error: {}", _0)]
    ExternalServiceError(String),

    /// Bitcoin error
    #[display(fmt = "Bitcoin Error: {}", _0)]
    BitcoinError(String),

    /// Rune error
    #[display(fmt = "Rune Error: {}", _0)]
    RuneError(String),

    /// Alkane error
    #[display(fmt = "Alkane Error: {}", _0)]
    AlkaneError(String),

    /// Wallet error
    #[display(fmt = "Wallet Error: {}", _0)]
    WalletError(String),

    /// P2P error
    #[display(fmt = "P2P Error: {}", _0)]
    P2PError(String),

    /// Trade error
    #[display(fmt = "Trade Error: {}", _0)]
    TradeError(String),

    /// Order error
    #[display(fmt = "Order Error: {}", _0)]
    OrderError(String),
}

impl ApiError {
    /// Get the error code
    pub fn code(&self) -> String {
        match self {
            ApiError::BadRequest(_) => "bad_request".to_string(),
            ApiError::Unauthorized(_) => "unauthorized".to_string(),
            ApiError::Forbidden(_) => "forbidden".to_string(),
            ApiError::NotFound(_) => "not_found".to_string(),
            ApiError::Conflict(_) => "conflict".to_string(),
            ApiError::UnprocessableEntity(_) => "unprocessable_entity".to_string(),
            ApiError::TooManyRequests(_) => "too_many_requests".to_string(),
            ApiError::InternalServerError(_) => "internal_server_error".to_string(),
            ApiError::ServiceUnavailable(_) => "service_unavailable".to_string(),
            ApiError::DatabaseError(_) => "database_error".to_string(),
            ApiError::ValidationError(_) => "validation_error".to_string(),
            ApiError::JsonError(_) => "json_error".to_string(),
            ApiError::AuthenticationError(_) => "authentication_error".to_string(),
            ApiError::AuthorizationError(_) => "authorization_error".to_string(),
            ApiError::ExternalServiceError(_) => "external_service_error".to_string(),
            ApiError::BitcoinError(_) => "bitcoin_error".to_string(),
            ApiError::RuneError(_) => "rune_error".to_string(),
            ApiError::AlkaneError(_) => "alkane_error".to_string(),
            ApiError::WalletError(_) => "wallet_error".to_string(),
            ApiError::P2PError(_) => "p2p_error".to_string(),
            ApiError::TradeError(_) => "trade_error".to_string(),
            ApiError::OrderError(_) => "order_error".to_string(),
        }
    }

    /// Get the error details
    pub fn details(&self) -> Option<serde_json::Value> {
        None
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::BadRequest(_) => StatusCode::BAD_REQUEST,
            ApiError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            ApiError::Forbidden(_) => StatusCode::FORBIDDEN,
            ApiError::NotFound(_) => StatusCode::NOT_FOUND,
            ApiError::Conflict(_) => StatusCode::CONFLICT,
            ApiError::UnprocessableEntity(_) => StatusCode::UNPROCESSABLE_ENTITY,
            ApiError::TooManyRequests(_) => StatusCode::TOO_MANY_REQUESTS,
            ApiError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            ApiError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ApiError::ValidationError(_) => StatusCode::BAD_REQUEST,
            ApiError::JsonError(_) => StatusCode::BAD_REQUEST,
            ApiError::AuthenticationError(_) => StatusCode::UNAUTHORIZED,
            ApiError::AuthorizationError(_) => StatusCode::FORBIDDEN,
            ApiError::ExternalServiceError(_) => StatusCode::BAD_GATEWAY,
            ApiError::BitcoinError(_) => StatusCode::BAD_REQUEST,
            ApiError::RuneError(_) => StatusCode::BAD_REQUEST,
            ApiError::AlkaneError(_) => StatusCode::BAD_REQUEST,
            ApiError::WalletError(_) => StatusCode::BAD_REQUEST,
            ApiError::P2PError(_) => StatusCode::BAD_REQUEST,
            ApiError::TradeError(_) => StatusCode::BAD_REQUEST,
            ApiError::OrderError(_) => StatusCode::BAD_REQUEST,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let status_code = self.status_code();
        let error_response = ErrorResponse {
            code: self.code(),
            message: self.to_string(),
            details: self.details(),
        };

        HttpResponse::build(status_code)
            .insert_header(ContentType::json())
            .json(error_response)
    }
}

/// Convert JsonPayloadError to ApiError
impl From<JsonPayloadError> for ApiError {
    fn from(error: JsonPayloadError) -> Self {
        match error {
            JsonPayloadError::ContentType => ApiError::BadRequest("Content type must be application/json".to_string()),
            JsonPayloadError::Deserialize(err) => ApiError::BadRequest(format!("JSON deserialize error: {}", err)),
            JsonPayloadError::Payload(err) => ApiError::BadRequest(format!("JSON payload error: {}", err)),
            _ => ApiError::BadRequest("Invalid JSON payload".to_string()),
        }
    }
}

/// Convert QueryPayloadError to ApiError
impl From<QueryPayloadError> for ApiError {
    fn from(error: QueryPayloadError) -> Self {
        match error {
            QueryPayloadError::Deserialize(err) => ApiError::BadRequest(format!("Query deserialize error: {}", err)),
            _ => ApiError::BadRequest("Invalid query parameters".to_string()),
        }
    }
}

/// Convert PathError to ApiError
impl From<PathError> for ApiError {
    fn from(error: PathError) -> Self {
        match error {
            PathError::Deserialize(err) => ApiError::BadRequest(format!("Path deserialize error: {}", err)),
            _ => ApiError::BadRequest("Invalid path parameters".to_string()),
        }
    }
}

/// Convert UrlencodedError to ApiError
impl From<UrlencodedError> for ApiError {
    fn from(error: UrlencodedError) -> Self {
        match error {
            UrlencodedError::ContentType => ApiError::BadRequest("Content type must be application/x-www-form-urlencoded".to_string()),
            UrlencodedError::Deserialize(err) => ApiError::BadRequest(format!("Form deserialize error: {}", err)),
            UrlencodedError::Payload(err) => ApiError::BadRequest(format!("Form payload error: {}", err)),
            _ => ApiError::BadRequest("Invalid form data".to_string()),
        }
    }
}

/// Convert std::io::Error to ApiError
impl From<std::io::Error> for ApiError {
    fn from(error: std::io::Error) -> Self {
        ApiError::InternalServerError(format!("IO error: {}", error))
    }
}

/// Convert serde_json::Error to ApiError
impl From<serde_json::Error> for ApiError {
    fn from(error: serde_json::Error) -> Self {
        ApiError::JsonError(format!("JSON error: {}", error))
    }
}

/// Convert anyhow::Error to ApiError
impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        ApiError::InternalServerError(format!("Internal error: {}", error))
    }
}

/// Error logger middleware
pub fn log_error(err: &Error) {
    match err.as_response_error() {
        Some(err) => {
            let status = err.status_code();
            if status.is_server_error() {
                log::error!("Server error: {}", err);
            } else if status.is_client_error() {
                log::warn!("Client error: {}", err);
            } else {
                log::info!("Error: {}", err);
            }
        }
        None => {
            log::error!("Unknown error: {}", err);
        }
    }
}