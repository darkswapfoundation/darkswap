use actix_web::{
    http::StatusCode,
    test::{self, TestRequest},
    web, App, HttpResponse,
};

use crate::middleware::logger::{LoggerConfig, RequestLogger};

async fn test_handler() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_rt::test]
async fn test_logger_middleware_allows_requests() {
    // Create a logger with default configuration
    let config = LoggerConfig::default();
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request, it should be allowed
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_logger_middleware_excludes_paths() {
    // Create a logger that excludes the /health path
    let config = LoggerConfig {
        exclude_paths: vec!["/health".to_string()],
        ..LoggerConfig::default()
    };
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/test", web::get().to(test_handler))
            .route("/health", web::get().to(test_handler)),
    )
    .await;

    // Send a request to /test, it should be logged
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Send a request to /health, it should not be logged
    let req = TestRequest::get().uri("/health").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_logger_middleware_includes_paths() {
    // Create a logger that includes only the /api path
    let config = LoggerConfig {
        include_paths: vec!["/api".to_string()],
        ..LoggerConfig::default()
    };
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/api/test", web::get().to(test_handler))
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request to /api/test, it should be logged
    let req = TestRequest::get().uri("/api/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Send a request to /test, it should not be logged
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_logger_middleware_logs_request_info() {
    // Create a logger with default configuration
    let config = LoggerConfig::default();
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request with headers
    let req = TestRequest::get()
        .uri("/test?param=value")
        .insert_header(("User-Agent", "test-agent"))
        .insert_header(("Content-Type", "text/plain"))
        .insert_header(("Content-Length", "10"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_logger_middleware_logs_response_info() {
    // Create a logger with default configuration
    let config = LoggerConfig::default();
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/test", web::get().to(|| async {
                HttpResponse::Ok()
                    .insert_header(("Content-Type", "application/json"))
                    .insert_header(("Content-Length", "10"))
                    .body("{\"ok\":true}")
            })),
    )
    .await;

    // Send a request
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_logger_middleware_with_error_response() {
    // Create a logger with default configuration
    let config = LoggerConfig::default();
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/error", web::get().to(|| async {
                HttpResponse::BadRequest().body("Bad Request")
            })),
    )
    .await;

    // Send a request that will result in an error
    let req = TestRequest::get().uri("/error").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[actix_rt::test]
async fn test_logger_middleware_with_not_found_response() {
    // Create a logger with default configuration
    let config = LoggerConfig::default();
    let logger = RequestLogger::new(config);

    // Create a test app with the logger middleware
    let app = test::init_service(
        App::new()
            .wrap(logger)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request to a non-existent route
    let req = TestRequest::get().uri("/not-found").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}