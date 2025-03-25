use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
    Json,
};
use futures_util::stream::Stream;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use uuid::Uuid;

use crate::types::{
    AppState, CreateOrderRequest, CreateOrderResponse, CancelOrderResponse, ListOrdersQuery,
    ListOrdersResponse, MarketQuery, MarketResponse, OrderResponse, TakeOrderRequest,
    TakeOrderResponse,
};
use darkswap_sdk::{
    types::{Asset, OrderId},
    orderbook::OrderSide,
    error::Error,
};

/// List orders
pub async fn list_orders(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListOrdersQuery>,
) -> (StatusCode, Json<ListOrdersResponse>) {
    // Parse assets
    let base_asset = match Asset::from_str(&query.base) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ListOrdersResponse {
                    orders: vec![],
                    error: Some(format!("Invalid base asset: {}", e)),
                }),
            )
        }
    };

    let quote_asset = match Asset::from_str(&query.quote) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ListOrdersResponse {
                    orders: vec![],
                    error: Some(format!("Invalid quote asset: {}", e)),
                }),
            )
        }
    };

    // Get orders
    let orders = match state.darkswap.lock().await.get_orders(&base_asset, &quote_asset).await {
        Ok(orders) => orders,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ListOrdersResponse {
                    orders: vec![],
                    error: Some(format!("Failed to get orders: {}", e)),
                }),
            )
        }
    };

    // Convert to response
    let order_responses = orders
        .into_iter()
        .map(|order| OrderResponse {
            id: order.id.to_string(),
            base_asset: order.base_asset.to_string(),
            quote_asset: order.quote_asset.to_string(),
            side: order.side.to_string(),
            amount: order.amount,
            price: order.price,
            status: order.status.to_string(),
            created_at: order.created_at,
            expires_at: order.expires_at,
        })
        .collect();

    (
        StatusCode::OK,
        Json(ListOrdersResponse {
            orders: order_responses,
            error: None,
        }),
    )
}

/// Create order
pub async fn create_order(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateOrderRequest>,
) -> (StatusCode, Json<CreateOrderResponse>) {
    // Parse assets
    let base_asset = match Asset::from_str(&request.base_asset) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(CreateOrderResponse {
                    order_id: None,
                    error: Some(format!("Invalid base asset: {}", e)),
                }),
            )
        }
    };

    let quote_asset = match Asset::from_str(&request.quote_asset) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(CreateOrderResponse {
                    order_id: None,
                    error: Some(format!("Invalid quote asset: {}", e)),
                }),
            )
        }
    };

    // Parse side
    let side = match request.side.as_str() {
        "buy" => OrderSide::Buy,
        "sell" => OrderSide::Sell,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(CreateOrderResponse {
                    order_id: None,
                    error: Some("Invalid side, must be 'buy' or 'sell'".to_string()),
                }),
            )
        }
    };

    // Parse expiry
    let expiry = match request.expiry {
        Some(expiry) => expiry,
        None => chrono::Utc::now().timestamp() + 3600, // Default to 1 hour
    };

    // Create order
    match state
        .darkswap
        .lock()
        .await
        .create_order(base_asset, quote_asset, side, request.amount, request.price, Some(expiry))
        .await
    {
        Ok(order) => (
            StatusCode::CREATED,
            Json(CreateOrderResponse {
                order_id: Some(order.id.to_string()),
                error: None,
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(CreateOrderResponse {
                order_id: None,
                error: Some(format!("Failed to create order: {}", e)),
            }),
        ),
    }
}

/// Cancel order
pub async fn cancel_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
) -> (StatusCode, Json<CancelOrderResponse>) {
    // Parse order ID
    let order_id = match OrderId::from_str(&order_id) {
        Ok(order_id) => order_id,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(CancelOrderResponse {
                    success: false,
                    error: Some(format!("Invalid order ID: {}", e)),
                }),
            )
        }
    };

    // Cancel order
    match state.darkswap.lock().await.cancel_order(&order_id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(CancelOrderResponse {
                success: true,
                error: None,
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(CancelOrderResponse {
                success: false,
                error: Some(format!("Failed to cancel order: {}", e)),
            }),
        ),
    }
}

/// Take order
pub async fn take_order(
    State(state): State<Arc<AppState>>,
    Path(order_id): Path<String>,
    Json(request): Json<TakeOrderRequest>,
) -> (StatusCode, Json<TakeOrderResponse>) {
    // Parse order ID
    let order_id = match OrderId::from_str(&order_id) {
        Ok(order_id) => order_id,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(TakeOrderResponse {
                    trade_id: None,
                    error: Some(format!("Invalid order ID: {}", e)),
                }),
            )
        }
    };

    // Take order
    match state
        .darkswap
        .lock()
        .await
        .take_order(&order_id, request.amount)
        .await
    {
        Ok(trade) => (
            StatusCode::OK,
            Json(TakeOrderResponse {
                trade_id: Some(trade.id.to_string()),
                error: None,
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(TakeOrderResponse {
                trade_id: None,
                error: Some(format!("Failed to take order: {}", e)),
            }),
        ),
    }
}

/// Get market data
pub async fn get_market(
    State(state): State<Arc<AppState>>,
    Query(query): Query<MarketQuery>,
) -> (StatusCode, Json<MarketResponse>) {
    // Parse assets
    let base_asset = match Asset::from_str(&query.base) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(MarketResponse {
                    best_bid: None,
                    best_ask: None,
                    error: Some(format!("Invalid base asset: {}", e)),
                }),
            )
        }
    };

    let quote_asset = match Asset::from_str(&query.quote) {
        Ok(asset) => asset,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(MarketResponse {
                    best_bid: None,
                    best_ask: None,
                    error: Some(format!("Invalid quote asset: {}", e)),
                }),
            )
        }
    };

    // Get best bid/ask
    match state
        .darkswap
        .lock()
        .await
        .get_best_bid_ask(&base_asset, &quote_asset)
        .await
    {
        Ok((best_bid, best_ask)) => (
            StatusCode::OK,
            Json(MarketResponse {
                best_bid,
                best_ask,
                error: None,
            }),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(MarketResponse {
                best_bid: None,
                best_ask: None,
                error: Some(format!("Failed to get market data: {}", e)),
            }),
        ),
    }
}

/// Subscribe to events
pub async fn subscribe_events(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, axum::Error>>> {
    // Create channel for events
    let (tx, rx) = mpsc::channel(100);
    let rx_stream = ReceiverStream::new(rx);

    // Register client
    let client_id = Uuid::new_v4().to_string();
    state.clients.lock().await.insert(client_id.clone(), tx);

    // Create stream
    let stream = rx_stream.map(|event| {
        Ok(Event::default()
            .event("message")
            .data(event.unwrap_or_else(|| "error".to_string())))
    });

    // Return SSE response
    Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(15)))
}

/// Health check
pub async fn health() -> StatusCode {
    StatusCode::OK
}