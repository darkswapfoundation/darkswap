use std::sync::Arc;

use actix_web::{
    http::StatusCode,
    test::{self, TestRequest},
    web, App,
};
use serde_json::json;

use crate::controllers::auth::{AuthController, LoginRequest, RegisterRequest};
use crate::middleware::auth::{AuthConfig, AuthService, UserInfo};

#[actix_rt::test]
async fn test_login_success() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let controller = web::Data::new(AuthController::new(auth_service));

    // Create a test app with the auth controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/auth/login", web::post().to(|controller: web::Data<AuthController>, req: web::Json<LoginRequest>| async move {
                controller.login(req).await
            })),
    )
    .await;

    // Send a login request with valid credentials
    let req = TestRequest::post()
        .uri("/auth/login")
        .set_json(json!({
            "username": "admin",
            "password": "password"
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check the response body
    let body = test::read_body(resp).await;
    let response: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(response.get("token").is_some());
    assert!(response.get("expires_at").is_some());
    assert!(response.get("user").is_some());
    assert_eq!(response["user"]["id"], "user123");
    assert_eq!(response["user"]["roles"][0], "user");
    assert_eq!(response["user"]["roles"][1], "admin");
}

#[actix_rt::test]
async fn test_login_invalid_credentials() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let controller = web::Data::new(AuthController::new(auth_service));

    // Create a test app with the auth controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/auth/login", web::post().to(|controller: web::Data<AuthController>, req: web::Json<LoginRequest>| async move {
                controller.login(req).await
            })),
    )
    .await;

    // Send a login request with invalid credentials
    let req = TestRequest::post()
        .uri("/auth/login")
        .set_json(json!({
            "username": "invalid",
            "password": "invalid"
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[actix_rt::test]
async fn test_login_missing_credentials() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let controller = web::Data::new(AuthController::new(auth_service));

    // Create a test app with the auth controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/auth/login", web::post().to(|controller: web::Data<AuthController>, req: web::Json<LoginRequest>| async move {
                controller.login(req).await
            })),
    )
    .await;

    // Send a login request with missing credentials
    let req = TestRequest::post()
        .uri("/auth/login")
        .set_json(json!({
            "username": "",
            "password": ""
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[actix_rt::test]
async fn test_register_success() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let controller = web::Data::new(AuthController::new(auth_service));

    // Create a test app with the auth controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/auth/register", web::post().to(|controller: web::Data<AuthController>, req: web::Json<RegisterRequest>| async move {
                controller.register(req).await
            })),
    )
    .await;

    // Send a register request with valid data
    let req = TestRequest::post()
        .uri("/auth/register")
        .set_json(json!({
            "username": "newuser",
            "password": "password",
            "email": "newuser@example.com"
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::CREATED);

    // Check the response body
    let body = test::read_body(resp).await;
    let response: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(response.get("token").is_some());
    assert!(response.get("expires_at").is_some());
    assert!(response.get("user").is_some());
    assert!(response["user"]["id"].as_str().unwrap().starts_with("user_"));
    assert_eq!(response["user"]["roles"][0], "user");
}

#[actix_rt::test]
async fn test_register_missing_data() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let controller = web::Data::new(AuthController::new(auth_service));

    // Create a test app with the auth controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/auth/register", web::post().to(|controller: web::Data<AuthController>, req: web::Json<RegisterRequest>| async move {
                controller.register(req).await
            })),
    )
    .await;

    // Send a register request with missing data
    let req = TestRequest::post()
        .uri("/auth/register")
        .set_json(json!({
            "username": "",
            "password": "",
            "email": ""
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[actix_rt::test]
async fn test_register_username_taken() {
    // Create an auth service with a secret key
    let config = AuthConfig {
        secret_key: "test_secret_key".to_string(),
        token_expiration: 3600,
        exclude_paths: vec![],
        include_paths: vec![],
    };
    let auth_service = Arc::new(AuthService::new(config));
    let controller = web::Data::new(AuthController::new(auth_service));

    // Create a test app with the auth controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/auth/register", web::post().to(|controller: web::Data<AuthController>, req: web::Json<RegisterRequest>| async move {
                controller.register(req).await
            })),
    )
    .await;

    // Send a register request with a taken username
    let req = TestRequest::post()
        .uri("/auth/register")
        .set_json(json!({
            "username": "admin",
            "password": "password",
            "email": "admin@example.com"
        }))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::CONFLICT);
}

#[actix_rt::test]
async fn test_me_endpoint() {
    // Create a test app with the me endpoint
    let app = test::init_service(
        App::new()
            .route("/auth/me", web::get().to(AuthController::me)),
    )
    .await;

    // Create a user info
    let user_info = UserInfo {
        id: "user123".to_string(),
        roles: vec!["user".to_string(), "admin".to_string()],
    };

    // Send a request to the me endpoint with user info
    let req = TestRequest::get()
        .uri("/auth/me")
        .app_data(web::ReqData::new(user_info.clone()))
        .to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check the response body
    let body = test::read_body(resp).await;
    let response: UserInfo = serde_json::from_slice(&body).unwrap();
    assert_eq!(response.id, user_info.id);
    assert_eq!(response.roles, user_info.roles);
}