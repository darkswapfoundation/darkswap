mod types;
mod api;
mod handlers;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use clap::Parser;
use tokio::sync::{Mutex, mpsc};
use tower_http::trace::TraceLayer;

use darkswap_sdk::{DarkSwap, types::Event};
use api::{ApiState, create_router};

/// DarkSwap daemon
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Listen address
    #[arg(short, long, default_value = "127.0.0.1:3000")]
    addr: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // Parse arguments
    let args = Args::parse();

    // Initialize DarkSwap
    let config = darkswap_sdk::config::Config::default();
    let mut darkswap = DarkSwap::new(config).map_err(|e| {
        log::error!("Failed to initialize DarkSwap: {}", e);
        Box::new(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())) as Box<dyn std::error::Error>
    })?;

    // Start DarkSwap
    darkswap.start().await.map_err(|e| {
        log::error!("Failed to start DarkSwap: {}", e);
        Box::new(std::io::Error::new(std::io::ErrorKind::Other, e.to_string())) as Box<dyn std::error::Error>
    })?;

    // Create event channel
    let (event_sender, mut event_receiver) = mpsc::channel::<Event>(100);

    // Create API state
    let api_state = Arc::new(ApiState {
        darkswap: Arc::new(Mutex::new(darkswap)),
        event_sender: event_sender.clone(),
    });

    // Create router
    let app = create_router(api_state.clone())
        .layer(TraceLayer::new_for_http());

    // Parse address
    let addr: SocketAddr = args.addr.parse().unwrap();

    // Start event processing task
    tokio::spawn(async move {
        while let Some(event) = event_receiver.recv().await {
            log::info!("Event: {:?}", event);
            // Process event
            // TODO: Implement event processing
        }
    });

    // Start server
    log::info!("Starting server on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    Ok(())
}