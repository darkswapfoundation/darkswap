

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
            
            // Process event based on type
            match &event {
                Event::OrderCreated(order) => {
                    log::info!("Order created: {}", order.id);
                    // Forward event to clients via WebSocket
                    // This will be handled by the WebSocket handler
                },
                Event::OrderCancelled(order_id) => {
                    log::info!("Order cancelled: {}", order_id);
                    // Additional processing if needed
                },
                Event::OrderFilled(order_id) => {
                    log::info!("Order filled: {}", order_id);
                    // Additional processing if needed
                },
                Event::OrderExpired(order_id) => {
                    log::info!("Order expired: {}", order_id);
                    // Additional processing if needed
                },
                Event::OrderUpdated(order) => {
                    log::info!("Order updated: {}", order.id);
                    // Additional processing if needed
                },
                Event::TradeStarted(trade) => {
                    log::info!("Trade started: {}", trade.0);
                    // Additional processing if needed
                },
                Event::TradeCompleted(trade) => {
                    log::info!("Trade completed: {}", trade.0);
                    // Additional processing if needed
                },
                Event::TradeFailed(trade) => {
                    log::info!("Trade failed: {}", trade.0);
                    // Additional processing if needed
                },
                Event::TradeCreated(trade) => {
                    log::info!("Trade created: {}", trade.0);
                    // Additional processing if needed
                },
                Event::TradeUpdated(trade) => {
                    log::info!("Trade updated: {}", trade.0);
                    // Additional processing if needed
                },
                Event::TradeCancelled(trade_id) => {
                    log::info!("Trade cancelled: {}", trade_id.0);
                    // Additional processing if needed
                },
                Event::TradeExpired(trade_id) => {
                    log::info!("Trade expired: {}", trade_id.0);
                    // Additional processing if needed
                },
                Event::PeerConnected(peer_id) => {
                    log::info!("Peer connected: {:?}", peer_id);
                    // Additional processing if needed
                },
                Event::PeerDisconnected(peer_id) => {
                    log::info!("Peer disconnected: {:?}", peer_id);
                    // Additional processing if needed
                },
                _ => {
                    // Handle other event types
                    log::debug!("Unhandled event type: {:?}", event);
                }
            }
            
            // Forward event to event_sender for WebSocket clients
            if let Err(e) = event_sender.send(event).await {
                log::error!("Failed to forward event: {}", e);
            }
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