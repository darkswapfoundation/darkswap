use actix_web::{
    http::StatusCode,
    test::{self, TestRequest},
    web, App,
};

use crate::controllers::health::{HealthController, HealthResponse};

#[actix_rt::test]
async fn test_health_endpoint() {
    // Create a health controller
    let controller = web::Data::new(HealthController::new(
        "1.0.0".to_string(),
        "test".to_string(),
    ));

    // Create a test app with the health controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/health", web::get().to(|controller: web::Data<HealthController>| async move {
                controller.health().await
            })),
    )
    .await;

    // Send a request to the health endpoint
    let req = TestRequest::get().uri("/health").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check the response body
    let body = test::read_body(resp).await;
    let response: HealthResponse = serde_json::from_slice(&body).unwrap();
    assert_eq!(response.status, "ok");
    assert_eq!(response.version, "1.0.0");
    assert_eq!(response.environment, "test");
    assert!(response.uptime >= 0);
    assert!(response.timestamp > 0);
    assert_eq!(response.components.api.status, "ok");
    assert_eq!(response.components.p2p.status, "ok");
    assert_eq!(response.components.database.status, "ok");
    assert_eq!(response.components.bitcoin.status, "ok");
}

#[actix_rt::test]
async fn test_ready_endpoint() {
    // Create a health controller
    let controller = web::Data::new(HealthController::new(
        "1.0.0".to_string(),
        "test".to_string(),
    ));

    // Create a test app with the health controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/health/ready", web::get().to(|controller: web::Data<HealthController>| async move {
                controller.ready().await
            })),
    )
    .await;

    // Send a request to the ready endpoint
    let req = TestRequest::get().uri("/health/ready").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check the response body
    let body = test::read_body(resp).await;
    let response: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(response["status"], "ready");
}

#[actix_rt::test]
async fn test_live_endpoint() {
    // Create a health controller
    let controller = web::Data::new(HealthController::new(
        "1.0.0".to_string(),
        "test".to_string(),
    ));

    // Create a test app with the health controller
    let app = test::init_service(
        App::new()
            .app_data(controller.clone())
            .route("/health/live", web::get().to(|controller: web::Data<HealthController>| async move {
                controller.live().await
            })),
    )
    .await;

    // Send a request to the live endpoint
    let req = TestRequest::get().uri("/health/live").to_request();
    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Check the response body
    let body = test::read_body(resp).await;
    let response: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(response["status"], "alive");
}