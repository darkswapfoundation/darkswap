//! DarkSwap Daemon
//!
//! Background service for hosting an orderbook and facilitating trades.

use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, delete},
    Json, Router,
};
use clap::Parser;
use darkswap_sdk::{DarkSwap, Config, Asset, OrderId, OrderSide, Event};
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

/// DarkSwap Daemon
#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    /// Config file path
    #[clap(short, long, value_parser)]
    config: Option<String>,
    
    /// Bitcoin network
    #[clap(short, long, value_parser, default_value = "testnet")]
    network: String,
    
    /// Listen address
    #[clap(short, long, value_parser, default_value = "127.0.0.1:8000")]
    listen: String,
    
    /// Log level
    #[clap(short, long, value_parser, default_value = "info")]
    log_level: String,
}

/// Application state
struct AppState {
    /// DarkSwap instance
    darkswap: Arc<Mutex<DarkSwap>>,
    
    /// Event sender
    event_tx: broadcast::Sender<ServerEvent>,
}

/// Server event
#[derive(Clone, Debug, Serialize)]
struct ServerEvent {
    /// Event type
    event_type: String,
    
    /// Event data
    data: serde_json::Value,
}

/// Create order request
#[derive(Debug, Deserialize)]
struct CreateOrderRequest {
    /// Base asset
    base_asset: String,
    
    /// Quote asset
    quote_asset: String,
    
    /// Side
    side: String,
    
    /// Amount
    amount: f64,
    
    /// Price
    price: f64,
    
    /// Expiry
    #[serde(default)]
    expiry: Option<u64>,
}

/// Create order response
#[derive(Debug, Serialize)]
struct CreateOrderResponse {
    /// Order ID
    order_id: String,
}

/// Take order request
#[derive(Debug, Deserialize)]
struct TakeOrderRequest {
    /// Amount
    amount: f64,
}

/// Take order response
#[derive(Debug, Serialize)]
struct TakeOrderResponse {
    /// Transaction ID
    txid: String,
}

/// List orders query
#[derive(Debug, Deserialize)]
struct ListOrdersQuery {
    /// Base asset
    base: String,
    
    /// Quote asset
    quote: String,
}

/// Market query
#[derive(Debug, Deserialize)]
struct MarketQuery {
    /// Base asset
    base: String,
    
    /// Quote asset
    quote: String,
}

/// Market response
#[derive(Debug, Serialize)]
struct MarketResponse {
    /// Best bid
    bid: Option<f64>,
    
    /// Best ask
    ask: Option<f64>,
}

/// Error response
#[derive(Debug, Serialize)]
struct ErrorResponse {
    /// Error message
    error: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Parse command line arguments
    let cli = Cli::parse();
    
    // Initialize logger
    env_logger::Builder::new()
        .filter_level(match cli.log_level.as_str() {
            "trace" => log::LevelFilter::Trace,
            "debug" => log::LevelFilter::Debug,
            "info" => log::LevelFilter::Info,
            "warn" => log::LevelFilter::Warn,
            "error" => log::LevelFilter::Error,
            _ => log::LevelFilter::Info,
        })
        .init();
    
    // Load config
    let config = if let Some(config_path) = cli.config {
        // Load config from file
        Config::from_file(&config_path)?
    } else {
        // Use default config
        Config::default()
    };
    
    // Set Bitcoin network
    let mut config = config;
    config.bitcoin.network = match cli.network.as_str() {
        "mainnet" => darkswap_sdk::config::BitcoinNetwork::Mainnet,
        "testnet" => darkswap_sdk::config::BitcoinNetwork::Testnet,
        "signet" => darkswap_sdk::config::BitcoinNetwork::Signet,
        "regtest" => darkswap_sdk::config::BitcoinNetwork::Regtest,
        _ => return Err(format!("Invalid Bitcoin network: {}", cli.network).into()),
    };
    
    // Create DarkSwap instance
    let darkswap = DarkSwap::with_config(config);
    let darkswap = Arc::new(Mutex::new(darkswap));
    
    // Initialize DarkSwap
    darkswap.lock().unwrap().init().await?;
    
    // Create event channel
    let (event_tx, _) = broadcast::channel(100);
    let event_tx_clone = event_tx.clone();
    
    // Register event handler
    {
        let mut darkswap = darkswap.lock().unwrap();
        darkswap.on_event(move |event| {
            let server_event = match event {
                Event::NetworkStarted => ServerEvent {
                    event_type: "network_started".to_string(),
                    data: serde_json::json!({}),
                },
                Event::NetworkStopped => ServerEvent {
                    event_type: "network_stopped".to_string(),
                    data: serde_json::json!({}),
                },
                Event::PeerConnected(peer_id) => ServerEvent {
                    event_type: "peer_connected".to_string(),
                    data: serde_json::json!({
                        "peer_id": peer_id.to_string(),
                    }),
                },
                Event::PeerDisconnected(peer_id) => ServerEvent {
                    event_type: "peer_disconnected".to_string(),
                    data: serde_json::json!({
                        "peer_id": peer_id.to_string(),
                    }),
                },
                Event::OrderCreated(order_id) => ServerEvent {
                    event_type: "order_created".to_string(),
                    data: serde_json::json!({
                        "order_id": order_id.to_string(),
                    }),
                },
                Event::OrderUpdated(order_id) => ServerEvent {
                    event_type: "order_updated".to_string(),
                    data: serde_json::json!({
                        "order_id": order_id.to_string(),
                    }),
                },
                Event::OrderCancelled(order_id) => ServerEvent {
                    event_type: "order_cancelled".to_string(),
                    data: serde_json::json!({
                        "order_id": order_id.to_string(),
                    }),
                },
                Event::OrderFilled(order_id) => ServerEvent {
                    event_type: "order_filled".to_string(),
                    data: serde_json::json!({
                        "order_id": order_id.to_string(),
                    }),
                },
                Event::OrderExpired(order_id) => ServerEvent {
                    event_type: "order_expired".to_string(),
                    data: serde_json::json!({
                        "order_id": order_id.to_string(),
                    }),
                },
                Event::TradeStarted(trade_id) => ServerEvent {
                    event_type: "trade_started".to_string(),
                    data: serde_json::json!({
                        "trade_id": trade_id.to_string(),
                    }),
                },
                Event::TradeCompleted(trade_id, txid) => ServerEvent {
                    event_type: "trade_completed".to_string(),
                    data: serde_json::json!({
                        "trade_id": trade_id.to_string(),
                        "txid": txid,
                    }),
                },
                Event::TradeFailed(trade_id, reason) => ServerEvent {
                    event_type: "trade_failed".to_string(),
                    data: serde_json::json!({
                        "trade_id": trade_id.to_string(),
                        "reason": reason,
                    }),
                },
                Event::WalletConnected => ServerEvent {
                    event_type: "wallet_connected".to_string(),
                    data: serde_json::json!({}),
                },
                Event::WalletDisconnected => ServerEvent {
                    event_type: "wallet_disconnected".to_string(),
                    data: serde_json::json!({}),
                },
                Event::TransactionConfirmed(txid) => ServerEvent {
                    event_type: "transaction_confirmed".to_string(),
                    data: serde_json::json!({
                        "txid": txid,
                    }),
                },
            };
            
            // Send event
            let _ = event_tx_clone.send(server_event);
        });
    }
    
    // Create application state
    let app_state = Arc::new(AppState {
        darkswap,
        event_tx,
    });
    
    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    
    // Create router
    let app = Router::new()
        // Orders
        .route("/orders", get(list_orders))
        .route("/orders", post(create_order))
        .route("/orders/:order_id", delete(cancel_order))
        .route("/orders/:order_id/take", post(take_order))
        
        // Market
        .route("/market", get(get_market))
        
        // Events
        .route("/events", get(subscribe_events))
        
        // Health
        .route("/health", get(health))
        
        // Add state
        .with_state(app_state)
        
        // Add middleware
        .layer(cors)
        .layer(TraceLayer::new_for_http());
    
    // Parse listen address
    let addr: SocketAddr = cli.listen.parse()?;
    
    // Start server
    log::info!("Starting server on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    
    Ok(())
}

/// List orders
async fn list_orders(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListOrdersQuery>,
) -> impl IntoResponse {
    // Parse assets
    let base_asset = match Asset::from_str(&query.base) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid base asset: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    let quote_asset = match Asset::from_str(&query.quote) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid quote asset: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    // Get orders
    let orders = state.darkswap.lock().unwrap().get_orders(&base_asset, &quote_asset);
    
    // Convert to JSON
    let orders_json = orders
        .into_iter()
        .map(|order| {
            serde_json::json!({
                "id": order.id.to_string(),
                "maker": order.maker,
                "base_asset": order.base_asset.to_string(),
                "quote_asset": order.quote_asset.to_string(),
                "side": order.side.to_string(),
                "amount": order.amount.to_string(),
                "filled_amount": order.filled_amount.to_string(),
                "price": order.price.to_string(),
                "status": order.status.to_string(),
                "timestamp": order.timestamp,
                "expiry": order.expiry,
            })
        })
        .collect::<Vec<_>>();
    
    // Return response
    (StatusCode::OK, Json(orders_json)).into_response()
}

/// Create order
async fn create_order(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateOrderRequest>,
) -> impl IntoResponse {
    // Parse assets
    let base_asset = match Asset::from_str(&request.base_asset) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid base asset: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    let quote_asset = match Asset::from_str(&request.quote_asset) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid quote asset: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    // Parse side
    let side = match OrderSide::from_str(&request.side) {
        Ok(side) => side,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid side: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    // Parse amount and price
    let amount = match rust_decimal::Decimal::from_f64(request.amount) {
        Some(amount) => amount,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid amount".to_string(),
                }),
            )
                .into_response();
        }
    };
    
    let price = match rust_decimal::Decimal::from_f64(request.price) {
        Some(price) => price,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid price".to_string(),
                }),
            )
                .into_response();
        }
    };
    
    // Calculate expiry
    let expiry = request.expiry.unwrap_or(24 * 60 * 60); // Default: 24 hours
    let expiry = darkswap_sdk::types::current_time() + expiry;
    
    // Create order
    match state
        .darkswap
        .lock()
        .unwrap()
        .create_order(base_asset, quote_asset, side, amount, price, expiry)
        .await
    {
        Ok(order_id) => (
            StatusCode::CREATED,
            Json(CreateOrderResponse {
                order_id: order_id.to_string(),
            }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to create order: {}", e),
            }),
        )
            .into_response(),
    }
}

/// Cancel order
async fn cancel_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> impl IntoResponse {
    // Parse order ID
    let order_id = match OrderId::from_str(&order_id) {
        Ok(order_id) => order_id,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid order ID: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    // Cancel order
    match state.darkswap.lock().unwrap().cancel_order(order_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to cancel order: {}", e),
            }),
        )
            .into_response(),
    }
}

/// Take order
async fn take_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(request): Json<TakeOrderRequest>,
) -> impl IntoResponse {
    // Parse order ID
    let order_id = match OrderId::from_str(&order_id) {
        Ok(order_id) => order_id,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid order ID: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    // Parse amount
    let amount = match rust_decimal::Decimal::from_f64(request.amount) {
        Some(amount) => amount,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Invalid amount".to_string(),
                }),
            )
                .into_response();
        }
    };
    
    // Take order
    match state.darkswap.lock().unwrap().take_order(order_id, amount).await {
        Ok(txid) => (
            StatusCode::OK,
            Json(TakeOrderResponse { txid }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("Failed to take order: {}", e),
            }),
        )
            .into_response(),
    }
}

/// Get market data
async fn get_market(
    State(state): State<Arc<AppState>>,
    Query(query): Query<MarketQuery>,
) -> impl IntoResponse {
    // Parse assets
    let base_asset = match Asset::from_str(&query.base) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid base asset: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    let quote_asset = match Asset::from_str(&query.quote) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Invalid quote asset: {}", e),
                }),
            )
                .into_response();
        }
    };
    
    // Get best bid and ask
    let (bid, ask) = state
        .darkswap
        .lock()
        .unwrap()
        .get_best_bid_ask(&base_asset, &quote_asset);
    
    // Convert to f64
    let bid = bid.map(|b| b.to_f64().unwrap_or(0.0));
    let ask = ask.map(|a| a.to_f64().unwrap_or(0.0));
    
    // Return response
    (StatusCode::OK, Json(MarketResponse { bid, ask })).into_response()
}

/// Subscribe to events
async fn subscribe_events(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    // Create event stream
    let mut rx = state.event_tx.subscribe();
    
    // Create SSE stream
    let stream = async_stream::stream! {
        loop {
            match rx.recv().await {
                Ok(event) => {
                    let json = serde_json::to_string(&event).unwrap();
                    yield format!("data: {}\n\n", json);
                }
                Err(_) => {
                    // Reconnect on error
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    rx = state.event_tx.subscribe();
                }
            }
        }
    };
    
    // Return SSE response
    axum::response::sse::Sse::new(stream)
        .keep_alive(axum::response::sse::KeepAlive::new().interval(Duration::from_secs(15)))
        .into_response()
}

/// Health check
async fn health() -> impl IntoResponse {
    StatusCode::OK
}