use actix_web::{
    error::{Error, JsonPayloadError, PathError, QueryPayloadError, UrlencodedError},
    http::StatusCode,
    test::{self, TestRequest},
    web, App, HttpResponse, ResponseError,
};
use serde_json::json;

use crate::middleware::error_handler::{ApiError, ErrorResponse};

async fn test_handler() -> Result<HttpResponse, ApiError> {
    Ok(HttpResponse::Ok().body("OK"))
}

async fn error_handler() -> Result<HttpResponse, ApiError> {
    Err(ApiError::BadRequest("Bad request".to_string()))
}

async fn json_error_handler(payload: web::Json<serde_json::Value>) -> HttpResponse {
    HttpResponse::Ok().json(payload)
}

#[actix_rt::test]
async fn test_api_error_response() {
    // Create a test app with an error handler
    let app = test::init_service(
        App::new()
            .route("/test", web::get().to(test_handler))
            .route("/error", web::get().to(error_handler)),
    )
    .await;

    // Send a request to the test handler, it should succeed
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Send a request to the error handler, it should return a 400 Bad Request
    let req = TestRequest::get().uri("/error").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

    // Check the response body
    let body = test::read_body(resp).await;
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();
    assert_eq!(error_response.code, "bad_request");
    assert_eq!(error_response.message, "Bad Request: Bad request");
    assert!(error_response.details.is_none());
}

#[actix_rt::test]
async fn test_api_error_status_codes() {
    // Test that each ApiError variant returns the correct status code
    assert_eq!(ApiError::BadRequest("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::Unauthorized("".to_string()).status_code(), StatusCode::UNAUTHORIZED);
    assert_eq!(ApiError::Forbidden("".to_string()).status_code(), StatusCode::FORBIDDEN);
    assert_eq!(ApiError::NotFound("".to_string()).status_code(), StatusCode::NOT_FOUND);
    assert_eq!(ApiError::Conflict("".to_string()).status_code(), StatusCode::CONFLICT);
    assert_eq!(ApiError::UnprocessableEntity("".to_string()).status_code(), StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(ApiError::TooManyRequests("".to_string()).status_code(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(ApiError::InternalServerError("".to_string()).status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(ApiError::ServiceUnavailable("".to_string()).status_code(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(ApiError::DatabaseError("".to_string()).status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(ApiError::ValidationError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::JsonError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::AuthenticationError("".to_string()).status_code(), StatusCode::UNAUTHORIZED);
    assert_eq!(ApiError::AuthorizationError("".to_string()).status_code(), StatusCode::FORBIDDEN);
    assert_eq!(ApiError::ExternalServiceError("".to_string()).status_code(), StatusCode::BAD_GATEWAY);
    assert_eq!(ApiError::BitcoinError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::RuneError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::AlkaneError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::WalletError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::P2PError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::TradeError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::OrderError("".to_string()).status_code(), StatusCode::BAD_REQUEST);
}

#[actix_rt::test]
async fn test_api_error_codes() {
    // Test that each ApiError variant returns the correct error code
    assert_eq!(ApiError::BadRequest("".to_string()).code(), "bad_request");
    assert_eq!(ApiError::Unauthorized("".to_string()).code(), "unauthorized");
    assert_eq!(ApiError::Forbidden("".to_string()).code(), "forbidden");
    assert_eq!(ApiError::NotFound("".to_string()).code(), "not_found");
    assert_eq!(ApiError::Conflict("".to_string()).code(), "conflict");
    assert_eq!(ApiError::UnprocessableEntity("".to_string()).code(), "unprocessable_entity");
    assert_eq!(ApiError::TooManyRequests("".to_string()).code(), "too_many_requests");
    assert_eq!(ApiError::InternalServerError("".to_string()).code(), "internal_server_error");
    assert_eq!(ApiError::ServiceUnavailable("".to_string()).code(), "service_unavailable");
    assert_eq!(ApiError::DatabaseError("".to_string()).code(), "database_error");
    assert_eq!(ApiError::ValidationError("".to_string()).code(), "validation_error");
    assert_eq!(ApiError::JsonError("".to_string()).code(), "json_error");
    assert_eq!(ApiError::AuthenticationError("".to_string()).code(), "authentication_error");
    assert_eq!(ApiError::AuthorizationError("".to_string()).code(), "authorization_error");
    assert_eq!(ApiError::ExternalServiceError("".to_string()).code(), "external_service_error");
    assert_eq!(ApiError::BitcoinError("".to_string()).code(), "bitcoin_error");
    assert_eq!(ApiError::RuneError("".to_string()).code(), "rune_error");
    assert_eq!(ApiError::AlkaneError("".to_string()).code(), "alkane_error");
    assert_eq!(ApiError::WalletError("".to_string()).code(), "wallet_error");
    assert_eq!(ApiError::P2PError("".to_string()).code(), "p2p_error");
    assert_eq!(ApiError::TradeError("".to_string()).code(), "trade_error");
    assert_eq!(ApiError::OrderError("".to_string()).code(), "order_error");
}

#[actix_rt::test]
async fn test_json_payload_error_conversion() {
    // Create a test app with a JSON handler
    let app = test::init_service(
        App::new()
            .route("/json", web::post().to(json_error_handler)),
    )
    .await;

    // Send a request with invalid JSON, it should return a 400 Bad Request
    let req = TestRequest::post()
        .uri("/json")
        .insert_header(("Content-Type", "application/json"))
        .set_payload("{invalid-json}")
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

    // Check the response body
    let body = test::read_body(resp).await;
    let error_response: ErrorResponse = serde_json::from_slice(&body).unwrap();
    assert_eq!(error_response.code, "bad_request");
    assert!(error_response.message.contains("JSON deserialize error"));
}

#[actix_rt::test]
async fn test_error_conversion() {
    // Test conversion from std::io::Error
    let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
    let api_error: ApiError = io_error.into();
    assert_eq!(api_error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(api_error.to_string().contains("IO error"));

    // Test conversion from serde_json::Error
    let json_error = serde_json::from_str::<serde_json::Value>("{invalid-json}").unwrap_err();
    let api_error: ApiError = json_error.into();
    assert_eq!(api_error.status_code(), StatusCode::BAD_REQUEST);
    assert!(api_error.to_string().contains("JSON error"));

    // Test conversion from anyhow::Error
    let anyhow_error = anyhow::anyhow!("Something went wrong");
    let api_error: ApiError = anyhow_error.into();
    assert_eq!(api_error.status_code(), StatusCode::INTERNAL_SERVER_ERROR);
    assert!(api_error.to_string().contains("Internal error"));
}