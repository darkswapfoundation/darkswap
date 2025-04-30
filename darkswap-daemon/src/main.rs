use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use std::path::Path;
use std::sync::Arc;

mod config;
mod controllers;
mod middleware as app_middleware;

use config::Config;
use controllers::register_controllers;
use app_middleware::auth::AuthService;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // Load configuration
    let config_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.json".to_string());
    let config = match Config::load(&config_path) {
        Ok(config) => config,
        Err(err) => {
            log::error!("Failed to load configuration: {}", err);
            log::info!("Creating default configuration");
            let config = Config::default();
            if let Err(err) = config.save(&config_path) {
                log::error!("Failed to save default configuration: {}", err);
            }
            config
        }
    };

    // Create data directory if it doesn't exist
    let data_dir = Path::new(&config.data_dir);
    if !data_dir.exists() {
        log::info!("Creating data directory: {}", config.data_dir);
        if let Err(err) = std::fs::create_dir_all(data_dir) {
            log::error!("Failed to create data directory: {}", err);
        }
    }

    // Create shared configuration
    let config = web::Data::new(config.clone());

    // Create authentication service
    let auth_service = Arc::new(AuthService::new(config.auth.clone()));

    // Register middleware
    let (logger, rate_limiter, auth) = app_middleware::register_middleware(&config);

    // Start HTTP server
    log::info!("Starting HTTP server at {}", config.api.listen_address);
    HttpServer::new(move || {
        // Create CORS middleware
        let cors = if config.api.enable_cors {
            let mut cors = Cors::default();
            for origin in &config.api.cors_allowed_origins {
                if origin == "*" {
                    cors = cors.allow_any_origin();
                    break;
                } else {
                    cors = cors.allowed_origin(origin);
                }
            }
            cors.allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
                .allowed_headers(vec!["Authorization", "Content-Type"])
                .max_age(3600)
        } else {
            Cors::default()
        };

        // Create app
        App::new()
            // Add shared data
            .app_data(config.clone())
            // Add middleware
            .wrap(logger.clone())
            .wrap(rate_limiter.clone())
            .wrap(auth.clone())
            .wrap(cors)
            .wrap(middleware::Compress::default())
            .wrap(middleware::NormalizePath::trim())
            // Register controllers
            .configure(|cfg| {
                register_controllers(
                    cfg,
                    auth_service.clone(),
                    env!("CARGO_PKG_VERSION").to_string(),
                    std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
                );
            })
    })
    .bind(&config.api.listen_address)?
    .run()
    .await
}