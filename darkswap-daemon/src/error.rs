use actix_web::{
    error::ResponseError,
    http::{header::ContentType, StatusCode},
    HttpResponse,
};
use derive_more::{Display, Error};
use serde::{Deserialize, Serialize};
use std::fmt;

/// API error response
#[derive(Serialize, Deserialize)]
pub struct ErrorResponse {
    /// Whether the request was successful
    pub success: bool,
    /// Error message
    pub error: String,
    /// Error code
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    /// Error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

/// API error
#[derive(Debug, Display, Error)]
pub enum ApiError {
    /// 400 Bad Request
    #[display(fmt = "Bad Request: {}", _0)]
    BadRequest(String),

    /// 401 Unauthorized
    #[display(fmt = "Unauthorized: {}", _0)]
    Unauthorized(String),

    /// 403 Forbidden
    #[display(fmt = "Forbidden: {}", _0)]
    Forbidden(String),

    /// 404 Not Found
    #[display(fmt = "Not Found: {}", _0)]
    NotFound(String),

    /// 409 Conflict
    #[display(fmt = "Conflict: {}", _0)]
    Conflict(String),

    /// 422 Unprocessable Entity
    #[display(fmt = "Unprocessable Entity: {}", _0)]
    UnprocessableEntity(String),

    /// 429 Too Many Requests
    #[display(fmt = "Too Many Requests: {}", _0)]
    TooManyRequests(String),

    /// 500 Internal Server Error
    #[display(fmt = "Internal Server Error: {}", _0)]
    InternalServerError(String),

    /// 503 Service Unavailable
    #[display(fmt = "Service Unavailable: {}", _0)]
    ServiceUnavailable(String),
}

impl ApiError {
    /// Create a new API error with the given message
    pub fn new<T: Into<String>>(kind: ApiErrorKind, message: T) -> Self {
        match kind {
            ApiErrorKind::BadRequest => ApiError::BadRequest(message.into()),
            ApiErrorKind::Unauthorized => ApiError::Unauthorized(message.into()),
            ApiErrorKind::Forbidden => ApiError::Forbidden(message.into()),
            ApiErrorKind::NotFound => ApiError::NotFound(message.into()),
            ApiErrorKind::Conflict => ApiError::Conflict(message.into()),
            ApiErrorKind::UnprocessableEntity => ApiError::UnprocessableEntity(message.into()),
            ApiErrorKind::TooManyRequests => ApiError::TooManyRequests(message.into()),
            ApiErrorKind::InternalServerError => ApiError::InternalServerError(message.into()),
            ApiErrorKind::ServiceUnavailable => ApiError::ServiceUnavailable(message.into()),
        }
    }

    /// Get the error code
    pub fn code(&self) -> Option<String> {
        match self {
            ApiError::BadRequest(_) => Some("BAD_REQUEST".to_string()),
            ApiError::Unauthorized(_) => Some("UNAUTHORIZED".to_string()),
            ApiError::Forbidden(_) => Some("FORBIDDEN".to_string()),
            ApiError::NotFound(_) => Some("NOT_FOUND".to_string()),
            ApiError::Conflict(_) => Some("CONFLICT".to_string()),
            ApiError::UnprocessableEntity(_) => Some("UNPROCESSABLE_ENTITY".to_string()),
            ApiError::TooManyRequests(_) => Some("TOO_MANY_REQUESTS".to_string()),
            ApiError::InternalServerError(_) => Some("INTERNAL_SERVER_ERROR".to_string()),
            ApiError::ServiceUnavailable(_) => Some("SERVICE_UNAVAILABLE".to_string()),
        }
    }
}

/// API error kind
#[derive(Debug, Clone, Copy)]
pub enum ApiErrorKind {
    /// 400 Bad Request
    BadRequest,
    /// 401 Unauthorized
    Unauthorized,
    /// 403 Forbidden
    Forbidden,
    /// 404 Not Found
    NotFound,
    /// 409 Conflict
    Conflict,
    /// 422 Unprocessable Entity
    UnprocessableEntity,
    /// 429 Too Many Requests
    TooManyRequests,
    /// 500 Internal Server Error
    InternalServerError,
    /// 503 Service Unavailable
    ServiceUnavailable,
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
        }
    }

    fn error_response(&self) -> HttpResponse {
        let status_code = self.status_code();
        let error_response = ErrorResponse {
            success: false,
            error: self.to_string(),
            code: self.code(),
            details: None,
        };

        HttpResponse::build(status_code)
            .insert_header(ContentType::json())
            .json(error_response)
    }
}

/// Result type for API operations
pub type ApiResult<T> = Result<T, ApiError>;

/// Convert a string to an API error
impl From<&str> for ApiError {
    fn from(error: &str) -> Self {
        ApiError::InternalServerError(error.to_string())
    }
}

/// Convert a string to an API error
impl From<String> for ApiError {
    fn from(error: String) -> Self {
        ApiError::InternalServerError(error)
    }
}

/// Convert a database error to an API error
#[cfg(feature = "database")]
impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        match error {
            sqlx::Error::RowNotFound => ApiError::NotFound("Resource not found".to_string()),
            sqlx::Error::Database(e) => {
                if e.code().map_or(false, |c| c == "23505") {
                    ApiError::Conflict("Resource already exists".to_string())
                } else {
                    ApiError::InternalServerError(format!("Database error: {}", e))
                }
            }
            _ => ApiError::InternalServerError(format!("Database error: {}", error)),
        }
    }
}

/// Convert a JSON error to an API error
impl From<serde_json::Error> for ApiError {
    fn from(error: serde_json::Error) -> Self {
        ApiError::BadRequest(format!("Invalid JSON: {}", error))
    }
}

/// Convert an IO error to an API error
impl From<std::io::Error> for ApiError {
    fn from(error: std::io::Error) -> Self {
        ApiError::InternalServerError(format!("IO error: {}", error))
    }
}

/// Convert a validation error to an API error
#[cfg(feature = "validator")]
impl From<validator::ValidationErrors> for ApiError {
    fn from(error: validator::ValidationErrors) -> Self {
        ApiError::BadRequest(format!("Validation error: {}", error))
    }
}

/// Convert a reqwest error to an API error
#[cfg(feature = "reqwest")]
impl From<reqwest::Error> for ApiError {
    fn from(error: reqwest::Error) -> Self {
        if error.is_timeout() {
            ApiError::ServiceUnavailable(format!("Request timeout: {}", error))
        } else if error.is_connect() {
            ApiError::ServiceUnavailable(format!("Connection error: {}", error))
        } else {
            ApiError::InternalServerError(format!("HTTP error: {}", error))
        }
    }
}

/// Convert a WebSocket error to an API error
#[cfg(feature = "websocket")]
impl From<actix_web_actors::ws::ProtocolError> for ApiError {
    fn from(error: actix_web_actors::ws::ProtocolError) -> Self {
        ApiError::InternalServerError(format!("WebSocket error: {}", error))
    }
}

/// Convert a Bitcoin error to an API error
#[cfg(feature = "bitcoin")]
impl From<bitcoin::Error> for ApiError {
    fn from(error: bitcoin::Error) -> Self {
        ApiError::BadRequest(format!("Bitcoin error: {}", error))
    }
}

/// Convert a BDK error to an API error
#[cfg(feature = "bdk")]
impl From<bdk::Error> for ApiError {
    fn from(error: bdk::Error) -> Self {
        ApiError::BadRequest(format!("BDK error: {}", error))
    }
}

/// Convert a libp2p error to an API error
#[cfg(feature = "libp2p")]
impl From<libp2p::core::transport::TransportError<std::io::Error>> for ApiError {
    fn from(error: libp2p::core::transport::TransportError<std::io::Error>) -> Self {
        ApiError::InternalServerError(format!("libp2p error: {}", error))
    }
}

/// Convert a WebRTC error to an API error
#[cfg(feature = "webrtc")]
impl From<webrtc::Error> for ApiError {
    fn from(error: webrtc::Error) -> Self {
        ApiError::InternalServerError(format!("WebRTC error: {}", error))
    }
}

/// Convert a DarkSwap error to an API error
#[cfg(feature = "darkswap")]
impl From<darkswap::Error> for ApiError {
    fn from(error: darkswap::Error) -> Self {
        match error {
            darkswap::Error::NotFound(_) => ApiError::NotFound(format!("DarkSwap error: {}", error)),
            darkswap::Error::AlreadyExists(_) => {
                ApiError::Conflict(format!("DarkSwap error: {}", error))
            }
            darkswap::Error::InvalidInput(_) => {
                ApiError::BadRequest(format!("DarkSwap error: {}", error))
            }
            darkswap::Error::Unauthorized(_) => {
                ApiError::Unauthorized(format!("DarkSwap error: {}", error))
            }
            darkswap::Error::Forbidden(_) => {
                ApiError::Forbidden(format!("DarkSwap error: {}", error))
            }
            _ => ApiError::InternalServerError(format!("DarkSwap error: {}", error)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test;

    #[test]
    fn test_api_error_bad_request() {
        let error = ApiError::BadRequest("Invalid input".to_string());
        assert_eq!(error.status_code(), StatusCode::BAD_REQUEST);
        assert_eq!(error.to_string(), "Bad Request: Invalid input");
        assert_eq!(error.code(), Some("BAD_REQUEST".to_string()));

        let resp = test::call_service(
            &actix_web::App::new().service(
                actix_web::web::resource("/test").to(|| async { Err::<(), _>(error.clone()) }),
            ),
            test::TestRequest::get().uri("/test").to_request(),
        )
        .await;

        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn test_api_error_unauthorized() {
        let error = ApiError::Unauthorized("Invalid token".to_string());
        assert_eq!(error.status_code(), StatusCode::UNAUTHORIZED);
        assert_eq!(error.to_string(), "Unauthorized: Invalid token");
        assert_eq!(error.code(), Some("UNAUTHORIZED".to_string()));

        let resp = test::call_service(
            &actix_web::App::new().service(
                actix_web::web::resource("/test").to(|| async { Err::<(), _>(error.clone()) }),
            ),
            test::TestRequest::get().uri("/test").to_request(),
        )
        .await;

        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_api_error_not_found() {
        let error = ApiError::NotFound("Resource not found".to_string());
        assert_eq!(error.status_code(), StatusCode::NOT_FOUND);
        assert_eq!(error.to_string(), "Not Found: Resource not found");
        assert_eq!(error.code(), Some("NOT_FOUND".to_string()));

        let resp = test::call_service(
            &actix_web::App::new().service(
                actix_web::web::resource("/test").to(|| async { Err::<(), _>(error.clone()) }),
            ),
            test::TestRequest::get().uri("/test").to_request(),
        )
        .await;

        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
    }

    #[test]
    fn test_api_error_internal_server_error() {
        let error = ApiError::InternalServerError("Something went wrong".to_string());
        assert_eq!(error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(error.to_string(), "Internal Server Error: Something went wrong");
        assert_eq!(error.code(), Some("INTERNAL_SERVER_ERROR".to_string()));

        let resp = test::call_service(
            &actix_web::App::new().service(
                actix_web::web::resource("/test").to(|| async { Err::<(), _>(error.clone()) }),
            ),
            test::TestRequest::get().uri("/test").to_request(),
        )
        .await;

        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }
}