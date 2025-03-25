mod types;

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    http::StatusCode,
    routing::get,
    Router,
};
use clap::Parser;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use darkswap_sdk::DarkSwap;
use types::AppState;

/// DarkSwap daemon
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Listen address
    #[arg(short, long, default_value = "127.0.0.1:3000")]
    addr: String,
}

/// Health check
async fn health() -> StatusCode {
    StatusCode::OK
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // Parse arguments
    let args = Args::parse();

    // Initialize DarkSwap
    let config = darkswap_sdk::config::Config::default();
    let darkswap = DarkSwap::new(config).map_err(|e| {
        log::error!("Failed to initialize DarkSwap: {}", e);
        Box::new(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())) as Box<dyn std::error::Error>
    })?;

    // Create application state
    let state = Arc::new(AppState {
        darkswap: Mutex::new(darkswap),
        clients: Mutex::new(HashMap::new()),
    });

    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Create router
    let app = Router::new()
        .route("/health", get(health))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Parse address
    let addr: SocketAddr = args.addr.parse().unwrap();

    // Start server
    log::info!("Starting server on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    Ok(())
}