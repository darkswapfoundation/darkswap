use std::sync::Arc;

use actix_web::{
    http::StatusCode,
    test::{self, TestRequest},
    web, App, HttpResponse,
};

use crate::middleware::auth::{AuthConfig, AuthService, Auth, UserInfo};

async fn test_handler(user_info: web::ReqData<UserInfo>) -> HttpResponse {
    HttpResponse::Ok().json(user_info.into_inner())
}

async fn public_handler() -> HttpResponse {
    HttpResponse::Ok().body("OK")
}

#[actix_rt::test]
async fn test_auth_middleware_blocks_unauthenticated_requests() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let auth = Auth::new(auth_service);

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request without authentication, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_rt::test]
async fn test_auth_middleware_allows_authenticated_requests() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config.clone()));
    let auth = Auth::new(auth_service.clone());

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Generate a token
    let token = auth_service.generate_token("user123", vec!["user".to_string()]).unwrap();

    // Send a request with authentication, it should be allowed
    let req = TestRequest::get()
        .uri("/test")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check that the response contains the user info
    let user_info: UserInfo = test::read_body_json(resp).await;
    assert_eq!(user_info.id, "user123");
    assert_eq!(user_info.roles, vec!["user"]);
}

#[actix_rt::test]
async fn test_auth_middleware_excludes_paths() {
    // Create an auth service with a secret key
    // and exclude the /public path
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec!["/public".to_string()],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let auth = Auth::new(auth_service);

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/test", web::get().to(test_handler))
            .route("/public", web::get().to(public_handler)),
    )
    .await;

    // Send a request to /test without authentication, it should be blocked
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    // Send a request to /public without authentication, it should be allowed
    let req = TestRequest::get().uri("/public").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_auth_middleware_includes_paths() {
    // Create an auth service with a secret key
    // and include only the /api path
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec!["/api".to_string()],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let auth = Auth::new(auth_service);

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/api/test", web::get().to(test_handler))
            .route("/test", web::get().to(public_handler)),
    )
    .await;

    // Send a request to /api/test without authentication, it should be blocked
    let req = TestRequest::get().uri("/api/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    // Send a request to /test without authentication, it should be allowed
    let req = TestRequest::get().uri("/test").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);
}

#[actix_rt::test]
async fn test_auth_middleware_rejects_invalid_token() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let auth = Auth::new(auth_service);

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request with an invalid token, it should be blocked
    let req = TestRequest::get()
        .uri("/test")
        .insert_header(("Authorization", "Bearer invalid-token"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_rt::test]
async fn test_auth_middleware_rejects_expired_token() {
    // Create an auth service with a secret key
    // and a token expiration of 0 seconds
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 0,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config.clone()));
    let auth = Auth::new(auth_service.clone());

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Generate a token (it will be expired immediately)
    let token = auth_service.generate_token("user123", vec!["user".to_string()]).unwrap();

    // Wait a moment to ensure the token is expired
    std::thread::sleep(std::time::Duration::from_secs(1));

    // Send a request with the expired token, it should be blocked
    let req = TestRequest::get()
        .uri("/test")
        .insert_header(("Authorization", format!("Bearer {}", token)))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_rt::test]
async fn test_auth_middleware_rejects_invalid_header_format() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let auth = Auth::new(auth_service);

    // Create a test app with the auth middleware
    let app = test::init_service(
        App::new()
            .wrap(auth)
            .route("/test", web::get().to(test_handler)),
    )
    .await;

    // Send a request with an invalid header format, it should be blocked
    let req = TestRequest::get()
        .uri("/test")
        .insert_header(("Authorization", "invalid-format"))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_rt::test]
async fn test_auth_service_generate_and_validate_token() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = AuthService::new(config);

    // Generate a token
    let token = auth_service.generate_token("user123", vec!["user".to_string()]).unwrap();

    // Validate the token
    let claims = auth_service.validate_token(&token).unwrap();
    assert_eq!(claims.sub, "user123");
    assert_eq!(claims.roles, vec!["user"]);
    assert_eq!(claims.iss, "darkswap");
    assert_eq!(claims.aud, "darkswap-api");
}