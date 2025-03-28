//! REST API for DarkSwap daemon
//!
//! This module provides a REST API for interacting with the DarkSwap daemon.
use futures_util::future::TryFutureExt;
use axum::{
    extract::ws::WebSocketUpgrade,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use darkswap_sdk::{
    config::Config,
    types::{Asset, RuneId, AlkaneId, Event},
    orderbook::{Order, OrderId, OrderSide, OrderStatus},
    DarkSwap,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

/// API state
pub struct ApiState {
    /// DarkSwap instance
    pub darkswap: Arc<Mutex<DarkSwap>>,
    /// Event sender
    pub event_sender: mpsc::Sender<Event>,
}

/// API error
#[derive(Debug, Serialize)]
pub struct ApiError {
    /// Error message
    pub message: String,
    /// Error code
    pub code: u16,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = StatusCode::from_u16(self.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        let body = Json(self);
        (status, body).into_response()
    }
}

/// Create order request
#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    /// Base asset
    pub base_asset: String,
    /// Quote asset
    pub quote_asset: String,
    /// Order side
    pub side: String,
    /// Amount
    pub amount: String,
    /// Price
    pub price: String,
    /// Expiry in seconds
    pub expiry: Option<u64>,
}

/// Cancel order request
#[derive(Debug, Deserialize)]
pub struct CancelOrderRequest {
    /// Order ID
    pub order_id: String,
}

/// Take order request
#[derive(Debug, Deserialize)]
pub struct TakeOrderRequest {
    /// Order ID
    pub order_id: String,
    /// Amount
    pub amount: String,
}

/// List orders query
#[derive(Debug, Deserialize)]
pub struct ListOrdersQuery {
    /// Base asset
    pub base_asset: Option<String>,
    /// Quote asset
    pub quote_asset: Option<String>,
    /// Order side
    #[serde(default = "default_side")]
    pub side: String,
    /// Order status
    #[serde(default = "default_status")]
    pub status: String,
}

/// Default side
fn default_side() -> String {
    "all".to_string()
}

/// Default status
fn default_status() -> String {
    "open".to_string()
}

/// Market data query
#[derive(Debug, Deserialize)]
pub struct MarketDataQuery {
    /// Base asset
    pub base_asset: String,
    /// Quote asset
    pub quote_asset: String,
}

/// Parse asset from string
fn parse_asset(asset_str: &str) -> Result<Asset, ApiError> {
    if asset_str == "BTC" {
        Ok(Asset::Bitcoin)
    } else if asset_str.starts_with("RUNE:") {
        let id = asset_str.strip_prefix("RUNE:").unwrap();
        let id_num = id.parse::<u128>().map_err(|_| ApiError {
            message: format!("Invalid rune ID: {}", id),
            code: 400,
        })?;
        Ok(Asset::Rune(id_num))
    } else if asset_str.starts_with("ALKANE:") {
        let id = asset_str.strip_prefix("ALKANE:").unwrap();
        let alkane_id = AlkaneId(format!("ALKANE:{}", id));
        Ok(Asset::Alkane(alkane_id))
    } else {
        Err(ApiError {
            message: format!("Invalid asset: {}", asset_str),
            code: 400,
        })
    }
}

/// Parse order side from string
fn parse_order_side(side_str: &str) -> Result<OrderSide, ApiError> {
    match side_str.to_lowercase().as_str() {
        "buy" => Ok(OrderSide::Buy),
        "sell" => Ok(OrderSide::Sell),
        _ => Err(ApiError {
            message: format!("Invalid order side: {}", side_str),
            code: 400,
        }),
    }
}

/// Parse order status from string
fn parse_order_status(status_str: &str) -> Result<OrderStatus, ApiError> {
    match status_str.to_lowercase().as_str() {
        "open" => Ok(OrderStatus::Open),
        "filled" => Ok(OrderStatus::Filled),
        "canceled" => Ok(OrderStatus::Canceled),
        "expired" => Ok(OrderStatus::Expired),
        _ => Err(ApiError {
            message: format!("Invalid order status: {}", status_str),
            code: 400,
        }),
    }
}

/// Create API router
pub fn create_router(state: Arc<ApiState>) -> Router {
    use crate::handlers::ws_handler;
    
    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Create router
    Router::new()
        .route("/health", get(health_handler))
        .route("/orders", get(list_orders_handler).post(create_order_handler))
        .route("/orders/:id", get(get_order_handler).delete(cancel_order_handler))
        .route("/orders/:id/take", post(take_order_handler))
        .route("/market", get(get_market_data_handler))
        .route("/runes", get(list_runes_handler))
        .route("/runes/:id", get(get_rune_handler))
        .route("/alkanes", get(list_alkanes_handler))
        .route("/alkanes/:id", get(get_alkane_handler))
        .route("/ws", get(ws_handler)) // WebSocket endpoint
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}

/// Health check handler
async fn health_handler() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

/// Create order handler
async fn create_order_handler(
    State(state): State<Arc<ApiState>>,
    Json(request): Json<CreateOrderRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let base_asset = parse_asset(&request.base_asset)?;
    let quote_asset = parse_asset(&request.quote_asset)?;
    let side = parse_order_side(&request.side)?;
    let amount = request.amount.parse::<Decimal>().map_err(|_| ApiError {
        message: "Invalid amount".to_string(),
        code: 400,
    })?;
    let price = request.price.parse::<Decimal>().map_err(|_| ApiError {
        message: "Invalid price".to_string(),
        code: 400,
    })?;

    // Create order
    let order = {
        let mut darkswap = state.darkswap.lock().await;
        darkswap.create_order(base_asset, quote_asset, side, amount, price, request.expiry)
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to create order: {}", e),
                code: 500,
            })?
    };

    // Return order
    Ok(Json(order))
}

/// Cancel order handler
async fn cancel_order_handler(
    State(state): State<Arc<ApiState>>,
    Path(order_id_str): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let order_id = OrderId(order_id_str);

    // Cancel order
    {
        let mut darkswap = state.darkswap.lock().await;
        darkswap.cancel_order(&order_id)
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to cancel order: {}", e),
                code: 500,
            })?;
    }

    // Return success
    Ok(Json(serde_json::json!({
        "success": true,
        "order_id": order_id.0,
    })))
}

/// Take order handler
async fn take_order_handler(
    State(state): State<Arc<ApiState>>,
    Path(order_id_str): Path<String>,
    Json(request): Json<TakeOrderRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let order_id = OrderId(order_id_str);
    let amount = request.amount.parse::<Decimal>().map_err(|_| ApiError {
        message: "Invalid amount".to_string(),
        code: 400,
    })?;

    // Take order
    let trade = {
        let mut darkswap = state.darkswap.lock().await;
        darkswap.take_order(&order_id, amount)
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to take order: {}", e),
                code: 500,
            })?
    };

    // Return trade
    Ok(Json(trade))
}

/// Get order handler
async fn get_order_handler(
    State(state): State<Arc<ApiState>>,
    Path(order_id_str): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let order_id = OrderId(order_id_str);

    // Get order
    let order = {
        let darkswap = state.darkswap.lock().await;
        // TODO: Implement get_order in DarkSwap
        // For now, return a dummy order
        Order {
            id: order_id.clone(),
            maker: "unknown".to_string(),
            base_asset: Asset::Bitcoin,
            quote_asset: Asset::Bitcoin,
            side: OrderSide::Buy,
            amount: Decimal::new(1, 0),
            price: Decimal::new(1, 0),
            status: OrderStatus::Open,
            timestamp: 0,
            expiry: 0,
        }
    };

    // Return order
    Ok(Json(order))
}

/// List orders handler
async fn list_orders_handler(
    State(state): State<Arc<ApiState>>,
    Query(query): Query<ListOrdersQuery>,
) -> Result<impl IntoResponse, ApiError> {
    // Get orders
    let orders = {
        let mut darkswap = state.darkswap.lock().await;
        
        if let (Some(base_asset_str), Some(quote_asset_str)) = (&query.base_asset, &query.quote_asset) {
            let base_asset = parse_asset(base_asset_str)?;
            let quote_asset = parse_asset(quote_asset_str)?;
            darkswap.get_orders(&base_asset, &quote_asset)
                .await
                .map_err(|e| ApiError {
                    message: format!("Failed to get orders: {}", e),
                    code: 500,
                })?
        } else {
            // TODO: Get all orders
            Vec::new()
        }
    };

    // Filter orders by side and status
    let filtered_orders = if query.side == "all" && query.status == "all" {
        orders
    } else {
        let side = if query.side == "all" {
            None
        } else {
            Some(parse_order_side(&query.side)?)
        };

        let status = if query.status == "all" {
            None
        } else {
            Some(parse_order_status(&query.status)?)
        };

        orders
            .into_iter()
            .filter(|order| {
                let side_match = side.map_or(true, |s| order.side == s);
                let status_match = status.map_or(true, |s| order.status == s);
                side_match && status_match
            })
            .collect()
    };

    // Return orders
    Ok(Json(filtered_orders))
}

/// Get market data handler
async fn get_market_data_handler(
    State(state): State<Arc<ApiState>>,
    Query(query): Query<MarketDataQuery>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let base_asset = parse_asset(&query.base_asset)?;
    let quote_asset = parse_asset(&query.quote_asset)?;

    // Get best bid and ask
    let (bid, ask) = {
        let mut darkswap = state.darkswap.lock().await;
        darkswap.get_best_bid_ask(&base_asset, &quote_asset)
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to get market data: {}", e),
                code: 500,
            })?
    };

    // Calculate spread
    let spread = match (bid, ask) {
        (Some(bid), Some(ask)) => Some(ask - bid),
        _ => None,
    };

    // Return market data
    Ok(Json(serde_json::json!({
        "base_asset": query.base_asset,
        "quote_asset": query.quote_asset,
        "bid": bid,
        "ask": ask,
        "spread": spread,
    })))
}

/// List runes handler
async fn list_runes_handler(
    State(state): State<Arc<ApiState>>,
) -> Result<impl IntoResponse, ApiError> {
    // Get runes
    let runes = {
        let darkswap = state.darkswap.lock().await;
        darkswap.get_runes()
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to get runes: {}", e),
                code: 500,
            })?
    };

    // Return runes
    Ok(Json(runes))
}

/// Get rune handler
async fn get_rune_handler(
    State(state): State<Arc<ApiState>>,
    Path(rune_id_str): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let rune_id = rune_id_str.parse::<u128>().map_err(|_| ApiError {
        message: format!("Invalid rune ID: {}", rune_id_str),
        code: 400,
    })?;

    // Get rune
    let rune = {
        let darkswap = state.darkswap.lock().await;
        darkswap.get_rune(rune_id)
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to get rune: {}", e),
                code: 500,
            })?
            .ok_or_else(|| ApiError {
                message: format!("Rune not found: {}", rune_id),
                code: 404,
            })?
    };

    // Return rune
    Ok(Json(rune))
}

/// List alkanes handler
async fn list_alkanes_handler(
    State(state): State<Arc<ApiState>>,
) -> Result<impl IntoResponse, ApiError> {
    // Get alkanes
    let alkanes = {
        let darkswap = state.darkswap.lock().await;
        darkswap.get_alkanes()
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to get alkanes: {}", e),
                code: 500,
            })?
    };

    // Return alkanes
    Ok(Json(alkanes))
}

/// Get alkane handler
async fn get_alkane_handler(
    State(state): State<Arc<ApiState>>,
    Path(alkane_id_str): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Parse parameters
    let alkane_id = AlkaneId(alkane_id_str);

    // Get alkane
    let alkane = {
        let darkswap = state.darkswap.lock().await;
        darkswap.get_alkane(&alkane_id)
            .await
            .map_err(|e| ApiError {
                message: format!("Failed to get alkane: {}", e),
                code: 500,
            })?
            .ok_or_else(|| ApiError {
                message: format!("Alkane not found: {}", alkane_id.0),
                code: 404,
            })?
    };

    // Return alkane
    Ok(Json(alkane))
}