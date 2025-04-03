use actix_web::{web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Health check response
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    /// The status of the service
    pub status: String,
    /// The version of the service
    pub version: String,
    /// The uptime of the service in seconds
    pub uptime: u64,
    /// The timestamp of the response
    pub timestamp: u64,
    /// The environment
    pub environment: String,
    /// The components status
    pub components: ComponentsStatus,
}

/// Components status
#[derive(Debug, Serialize)]
pub struct ComponentsStatus {
    /// The status of the API
    pub api: ComponentStatus,
    /// The status of the P2P network
    pub p2p: ComponentStatus,
    /// The status of the database
    pub database: ComponentStatus,
    /// The status of the Bitcoin node
    pub bitcoin: ComponentStatus,
}

/// Component status
#[derive(Debug, Serialize)]
pub struct ComponentStatus {
    /// The status of the component
    pub status: String,
    /// The details of the component status
    pub details: Option<String>,
}

/// Health check controller
pub struct HealthController {
    /// The start time of the service
    start_time: SystemTime,
    /// The version of the service
    version: String,
    /// The environment
    environment: String,
}

impl HealthController {
    /// Create a new health check controller
    pub fn new(version: String, environment: String) -> Self {
        Self {
            start_time: SystemTime::now(),
            version,
            environment,
        }
    }

    /// Get the health status
    pub async fn health(&self) -> impl Responder {
        // Calculate the uptime
        let uptime = SystemTime::now()
            .duration_since(self.start_time)
            .unwrap_or(Duration::from_secs(0))
            .as_secs();

        // Get the current timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or(Duration::from_secs(0))
            .as_secs();

        // Create the response
        let response = HealthResponse {
            status: "ok".to_string(),
            version: self.version.clone(),
            uptime,
            timestamp,
            environment: self.environment.clone(),
            components: ComponentsStatus {
                api: ComponentStatus {
                    status: "ok".to_string(),
                    details: None,
                },
                p2p: ComponentStatus {
                    status: "ok".to_string(),
                    details: None,
                },
                database: ComponentStatus {
                    status: "ok".to_string(),
                    details: None,
                },
                bitcoin: ComponentStatus {
                    status: "ok".to_string(),
                    details: None,
                },
            },
        };

        HttpResponse::Ok().json(response)
    }

    /// Get the readiness status
    pub async fn ready(&self) -> impl Responder {
        // In a real application, you would check if the service is ready to accept requests
        // For this example, we'll just return a 200 OK response
        HttpResponse::Ok().json(serde_json::json!({
            "status": "ready"
        }))
    }

    /// Get the liveness status
    pub async fn live(&self) -> impl Responder {
        // In a real application, you would check if the service is alive
        // For this example, we'll just return a 200 OK response
        HttpResponse::Ok().json(serde_json::json!({
            "status": "alive"
        }))
    }
}

/// Register the health check routes
pub fn register_routes(
    config: &mut web::ServiceConfig,
    version: String,
    environment: String,
) {
    let controller = web::Data::new(HealthController::new(version, environment));

    config.service(
        web::scope("/health")
            .app_data(controller.clone())
            .route("", web::get().to(|controller: web::Data<HealthController>| async move {
                controller.health().await
            }))
            .route("/ready", web::get().to(|controller: web::Data<HealthController>| async move {
                controller.ready().await
            }))
            .route("/live", web::get().to(|controller: web::Data<HealthController>| async move {
                controller.live().await
            }))
    );
}