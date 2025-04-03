use std::net::IpAddr;
use std::time::{Duration, Instant};

use actix_web::{
    http::{header::HeaderName, StatusCode},
    test::{self, TestRequest},
    web, App, HttpResponse,
};

use crate::middleware::rate_limiter::{RateLimitConfig, RateLimiter};

async fn test_handler() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_rt::test]
async fn test_rate_limiter_allows_requests_within_limit() {
    // Create a rate limiter with a limit of 5 requests per 60 seconds
    let config = RateLimitConfig {
        limit: 5,
        window: 60,
        sliding_window: true,
        exclude_paths: vec![],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }
}

#[actix_rt::test]
async fn test_rate_limiter_blocks_requests_over_limit() {
    // Create a rate limiter with a limit of 5 requests per 60 seconds
    let config = RateLimitConfig {
        limit: 5,
        window: 60,
        sliding_window: true,
        exclude_paths: vec![],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
}

#[actix_rt::test]
async fn test_rate_limiter_excludes_paths() {
    // Create a rate limiter with a limit of 5 requests per 60 seconds
    // and exclude the /health path
    let config = RateLimitConfig {
        limit: 5,
        window: 60,
        sliding_window: true,
        exclude_paths: vec!["/health".to_string()],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler))
            .route("/health", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests to /test, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request to /test, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);

    // Send 10 requests to /health, all should be allowed
    for _ in 0..10 {
        let req = TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }
}

#[actix_rt::test]
async fn test_rate_limiter_includes_paths() {
    // Create a rate limiter with a limit of 5 requests per 60 seconds
    // and include only the /api path
    let config = RateLimitConfig {
        limit: 5,
        window: 60,
        sliding_window: true,
        exclude_paths: vec![],
        include_paths: vec!["/api".to_string()],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/api/test", web::get().to(test_handler))
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests to /api/test, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/api/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request to /api/test, it should be blocked
    let req = TestRequest::get().uri("/api/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);

    // Send 10 requests to /test, all should be allowed
    for _ in 0..10 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }
}

#[actix_rt::test]
async fn test_rate_limiter_authenticated_limit() {
    // Create a rate limiter with different limits for authenticated and unauthenticated users
    let config = RateLimitConfig {
        limit: 5,
        window: 60,
        sliding_window: true,
        exclude_paths: vec![],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests without authentication, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request without authentication, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);

    // Send 10 requests with authentication, all should be allowed
    for _ in 0..10 {
        let req = TestRequest::get()
            .uri("/test")
            .insert_header(("Authorization", "Bearer token"))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request with authentication, it should be blocked
    let req = TestRequest::get()
        .uri("/test")
        .insert_header(("Authorization", "Bearer token"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
}

#[actix_rt::test]
async fn test_rate_limiter_adds_headers() {
    // Create a rate limiter with a limit of 5 requests per 60 seconds
    let config = RateLimitConfig {
        limit: 5,
        window: 60,
        sliding_window: true,
        exclude_paths: vec![],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request and check the headers
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check that the rate limit headers are present
    assert!(resp.headers().contains_key("x-ratelimit-limit"));
    assert!(resp.headers().contains_key("x-ratelimit-remaining"));
    assert!(resp.headers().contains_key("x-ratelimit-reset"));

    // Check the values of the headers
    let limit = resp.headers().get("x-ratelimit-limit").unwrap().to_str().unwrap();
    let remaining = resp.headers().get("x-ratelimit-remaining").unwrap().to_str().unwrap();
    let reset = resp.headers().get("x-ratelimit-reset").unwrap().to_str().unwrap();

    assert_eq!(limit, "5");
    assert_eq!(remaining, "4");
    assert!(reset.parse::<u64>().is_ok());
}

#[actix_rt::test]
async fn test_rate_limiter_sliding_window() {
    // Create a rate limiter with a limit of 5 requests per 1 second
    // and a sliding window
    let config = RateLimitConfig {
        limit: 5,
        window: 1,
        sliding_window: true,
        exclude_paths: vec![],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);

    // Wait for the window to expire
    std::thread::sleep(Duration::from_secs(1));

    // Send 5 more requests, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }
}

#[actix_rt::test]
async fn test_rate_limiter_fixed_window() {
    // Create a rate limiter with a limit of 5 requests per 1 second
    // and a fixed window
    let config = RateLimitConfig {
        limit: 5,
        window: 1,
        sliding_window: false,
        exclude_paths: vec![],
        include_paths: vec![],
        authenticated_limit: 10,
    };
    let rate_limiter = RateLimiter::new(config);

    // Create a test app with the rate limiter middleware
    let app = test::init_service(
        App::new()
            .wrap(rate_limiter)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send 5 requests, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // Send 1 more request, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);

    // Wait for the window to expire
    std::thread::sleep(Duration::from_secs(1));

    // Send 5 more requests, all should be allowed
    for _ in 0..5 {
        let req = TestRequest::get().uri("/test").to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status(), StatusCode::OK);
    }
}