//! REST API for DarkSwap Bridge
//!
//! This module provides a REST API for the DarkSwap Bridge.

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};
use log::{debug, error, info, warn};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};

use crate::bridge::Bridge;
use crate::error::Result;

mod auth;
mod handlers;
mod middleware;
mod models;
mod routes;

/// API server
pub struct ApiServer {
    /// Bridge
    bridge: Arc<Mutex<Bridge>>,
    /// Address to bind to
    addr: SocketAddr,
}

impl ApiServer {
    /// Create a new API server
    pub fn new(bridge: Arc<Mutex<Bridge>>, addr: SocketAddr) -> Self {
        Self { bridge, addr }
    }

    /// Start the API server
    pub async fn start(&self) -> Result<()> {
        info!("Starting API server on {}", self.addr);
        
        // Create CORS layer
        let cors = CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any);
        
        // Create router
        let router = Router::new()
            // Auth routes
            .route("/api/auth/login", post(auth::handlers::login))
            .route("/api/auth/register", post(auth::handlers::register))
            
            // Wallet routes
            .route("/api/bridge/wallet", post(routes::wallet::handle_wallet_message))
            .route("/api/bridge/wallet/status", get(routes::wallet::get_wallet_status))
            .route("/api/bridge/wallet/balance", get(routes::wallet::get_wallet_balance))
            .route("/api/bridge/wallet/addresses", get(routes::wallet::get_wallet_addresses))
            .route("/api/bridge/wallet/transactions", get(routes::wallet::get_wallet_transactions))
            .route("/api/bridge/wallet/utxos", get(routes::wallet::get_wallet_utxos))
            
            // Network routes
            .route("/api/bridge/network", post(routes::network::handle_network_message))
            .route("/api/bridge/network/status", get(routes::network::get_network_status))
            .route("/api/bridge/network/peers", get(routes::network::get_network_peers))
            
            // Order routes
            .route("/api/bridge/orders", get(routes::orders::get_orders))
            .route("/api/bridge/orders", post(routes::orders::create_order))
            .route("/api/bridge/orders/:id", get(routes::orders::get_order))
            .route("/api/bridge/orders/:id", delete(routes::orders::cancel_order))
            .route("/api/bridge/orders/:id/take", post(routes::orders::take_order))
            
            // Trade routes
            .route("/api/bridge/trades", get(routes::trades::get_trades))
            .route("/api/bridge/trades/:id", get(routes::trades::get_trade))
            .route("/api/bridge/trades/:id/accept", post(routes::trades::accept_trade))
            .route("/api/bridge/trades/:id/reject", post(routes::trades::reject_trade))
            .route("/api/bridge/trades/:id/execute", post(routes::trades::execute_trade))
            .route("/api/bridge/trades/:id/confirm", post(routes::trades::confirm_trade))
            .route("/api/bridge/trades/:id/cancel", post(routes::trades::cancel_trade))
            
            // System routes
            .route("/api/bridge/system", post(routes::system::handle_system_message))
            .route("/api/bridge/system/status", get(routes::system::get_system_status))
            .route("/api/bridge/system/settings", get(routes::system::get_system_settings))
            .route("/api/bridge/system/settings", post(routes::system::save_system_settings))
            
            // Apply middleware
            .layer(cors)
            .layer(middleware::auth::auth_layer())
            .with_state(self.bridge.clone());
        
        // Start server
        axum::Server::bind(&self.addr)
            .serve(router.into_make_service())
            .await
            .map_err(|e| {
                error!("API server error: {}", e);
                crate::error::Error::ApiError(format!("API server error: {}", e))
            })?;
        
        Ok(())
    }
}