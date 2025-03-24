//! WebAssembly bindings for DarkSwap
//!
//! This module provides WebAssembly bindings for the DarkSwap SDK, allowing it to be used in browsers.

#![cfg(feature = "wasm")]

use crate::config::{BitcoinNetwork, Config};
use crate::error::{Error, Result};
use crate::orderbook::{Order, OrderSide, OrderStatus};
use crate::trade::{Trade, TradeStatus};
use crate::types::{Asset, OrderId, PeerId, RuneId, AlkaneId};
use crate::DarkSwap;
use rust_decimal::Decimal;
use std::str::FromStr;
use std::sync::Arc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::{console, Window};

/// Initialize panic hook for better error messages in the browser
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

/// Parse asset from string
fn parse_asset(asset_str: &str) -> Result<Asset> {
    if asset_str == "BTC" {
        Ok(Asset::Bitcoin)
    } else if asset_str.starts_with("RUNE:") {
        let id = asset_str.strip_prefix("RUNE:").unwrap();
        Ok(Asset::Rune(RuneId(id.to_string())))
    } else if asset_str.starts_with("ALKANE:") {
        let id = asset_str.strip_prefix("ALKANE:").unwrap();
        Ok(Asset::Alkane(AlkaneId(id.to_string())))
    } else {
        Err(Error::InvalidAsset(format!("Invalid asset: {}", asset_str)))
    }
}

/// Parse order side from string
fn parse_order_side(side_str: &str) -> Result<OrderSide> {
    match side_str.to_lowercase().as_str() {
        "buy" => Ok(OrderSide::Buy),
        "sell" => Ok(OrderSide::Sell),
        _ => Err(Error::InvalidOrder(format!("Invalid order side: {}", side_str))),
    }
}

/// Parse Bitcoin network from string
fn parse_bitcoin_network(network_str: &str) -> Result<BitcoinNetwork> {
    match network_str.to_lowercase().as_str() {
        "mainnet" => Ok(BitcoinNetwork::Mainnet),
        "testnet" => Ok(BitcoinNetwork::Testnet),
        "regtest" => Ok(BitcoinNetwork::Regtest),
        "signet" => Ok(BitcoinNetwork::Signet),
        _ => Err(Error::ConfigError(format!("Invalid Bitcoin network: {}", network_str))),
    }
}

/// Convert error to JsValue
fn error_to_js_value(error: Error) -> JsValue {
    JsValue::from_str(&error.to_string())
}

/// Convert result to JsValue
fn result_to_js_value<T: Into<JsValue>>(result: Result<T>) -> Result<JsValue, JsValue> {
    result.map(|value| value.into()).map_err(error_to_js_value)
}

/// Order summary for JavaScript
#[wasm_bindgen]
#[derive(Clone)]
pub struct OrderSummary {
    /// Order ID
    pub id: String,
    /// Maker
    pub maker: String,
    /// Base asset
    pub base_asset: String,
    /// Quote asset
    pub quote_asset: String,
    /// Side
    pub side: String,
    /// Amount
    pub amount: String,
    /// Price
    pub price: String,
    /// Status
    pub status: String,
    /// Timestamp
    pub timestamp: u64,
    /// Expiry
    pub expiry: u64,
}

#[wasm_bindgen]
impl OrderSummary {
    /// Create a new order summary
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        maker: String,
        base_asset: String,
        quote_asset: String,
        side: String,
        amount: String,
        price: String,
        status: String,
        timestamp: u64,
        expiry: u64,
    ) -> Self {
        Self {
            id,
            maker,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status,
            timestamp,
            expiry,
        }
    }
}

/// Trade summary for JavaScript
#[wasm_bindgen]
#[derive(Clone)]
pub struct TradeSummary {
    /// Trade ID
    pub id: String,
    /// Order ID
    pub order_id: String,
    /// Maker
    pub maker: String,
    /// Taker
    pub taker: String,
    /// Base asset
    pub base_asset: String,
    /// Quote asset
    pub quote_asset: String,
    /// Side
    pub side: String,
    /// Amount
    pub amount: String,
    /// Price
    pub price: String,
    /// Status
    pub status: String,
    /// Timestamp
    pub timestamp: u64,
    /// Transaction ID
    pub txid: Option<String>,
}

#[wasm_bindgen]
impl TradeSummary {
    /// Create a new trade summary
    #[wasm_bindgen(constructor)]
    pub fn new(
        id: String,
        order_id: String,
        maker: String,
        taker: String,
        base_asset: String,
        quote_asset: String,
        side: String,
        amount: String,
        price: String,
        status: String,
        timestamp: u64,
        txid: Option<String>,
    ) -> Self {
        Self {
            id,
            order_id,
            maker,
            taker,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status,
            timestamp,
            txid,
        }
    }
}

/// DarkSwap WebAssembly bindings
#[wasm_bindgen]
pub struct DarkSwapWasm {
    /// DarkSwap instance
    darkswap: Arc<DarkSwap>,
    /// Order created callback
    order_created_callback: Option<js_sys::Function>,
    /// Order canceled callback
    order_canceled_callback: Option<js_sys::Function>,
    /// Order filled callback
    order_filled_callback: Option<js_sys::Function>,
    /// Trade started callback
    trade_started_callback: Option<js_sys::Function>,
    /// Trade completed callback
    trade_completed_callback: Option<js_sys::Function>,
    /// Trade failed callback
    trade_failed_callback: Option<js_sys::Function>,
}

#[wasm_bindgen]
impl DarkSwapWasm {
    /// Create a new DarkSwap instance
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<DarkSwapWasm, JsValue> {
        // Parse configuration
        let config: Config = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse configuration: {}", e)))?;

        // Create DarkSwap instance
        let darkswap = DarkSwap::new(config)
            .map_err(|e| JsValue::from_str(&format!("Failed to create DarkSwap: {}", e)))?;

        Ok(Self {
            darkswap: Arc::new(darkswap),
            order_created_callback: None,
            order_canceled_callback: None,
            order_filled_callback: None,
            trade_started_callback: None,
            trade_completed_callback: None,
            trade_failed_callback: None,
        })
    }

    /// Create a new DarkSwap instance with default configuration
    #[wasm_bindgen]
    pub fn new_with_defaults(network: &str) -> Result<DarkSwapWasm, JsValue> {
        // Parse Bitcoin network
        let bitcoin_network = parse_bitcoin_network(network)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse Bitcoin network: {}", e)))?;

        // Create default configuration
        let mut config = Config::default();
        config.bitcoin.network = bitcoin_network;

        // Create DarkSwap instance
        let darkswap = DarkSwap::new(config)
            .map_err(|e| JsValue::from_str(&format!("Failed to create DarkSwap: {}", e)))?;

        Ok(Self {
            darkswap: Arc::new(darkswap),
            order_created_callback: None,
            order_canceled_callback: None,
            order_filled_callback: None,
            trade_started_callback: None,
            trade_completed_callback: None,
            trade_failed_callback: None,
        })
    }

    /// Start DarkSwap
    #[wasm_bindgen]
    pub fn start(&self) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();

        future_to_promise(async move {
            darkswap.start().await.map_err(error_to_js_value)?;
            Ok(JsValue::UNDEFINED)
        })
    }

    /// Stop DarkSwap
    #[wasm_bindgen]
    pub fn stop(&self) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();

        future_to_promise(async move {
            darkswap.stop().await.map_err(error_to_js_value)?;
            Ok(JsValue::UNDEFINED)
        })
    }

    /// Create an order
    #[wasm_bindgen]
    pub fn create_order(
        &self,
        base_asset: &str,
        quote_asset: &str,
        side: &str,
        amount: &str,
        price: &str,
        expiry: Option<u64>,
    ) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let base_asset = base_asset.to_string();
        let quote_asset = quote_asset.to_string();
        let side = side.to_string();
        let amount = amount.to_string();
        let price = price.to_string();

        future_to_promise(async move {
            // Parse parameters
            let base_asset = parse_asset(&base_asset).map_err(error_to_js_value)?;
            let quote_asset = parse_asset(&quote_asset).map_err(error_to_js_value)?;
            let side = parse_order_side(&side).map_err(error_to_js_value)?;
            let amount = Decimal::from_str(&amount)
                .map_err(|e| JsValue::from_str(&format!("Invalid amount: {}", e)))?;
            let price = Decimal::from_str(&price)
                .map_err(|e| JsValue::from_str(&format!("Invalid price: {}", e)))?;

            // Create order
            let order = darkswap
                .create_order(base_asset, quote_asset, side, amount, price, expiry)
                .await
                .map_err(error_to_js_value)?;

            // Convert to OrderSummary
            let summary = OrderSummary {
                id: order.id.0.clone(),
                maker: order.maker.0.clone(),
                base_asset: order.base_asset.to_string(),
                quote_asset: order.quote_asset.to_string(),
                side: match order.side {
                    OrderSide::Buy => "buy".to_string(),
                    OrderSide::Sell => "sell".to_string(),
                },
                amount: order.amount.to_string(),
                price: order.price.to_string(),
                status: match order.status {
                    OrderStatus::Open => "open".to_string(),
                    OrderStatus::Filled => "filled".to_string(),
                    OrderStatus::Canceled => "canceled".to_string(),
                    OrderStatus::Expired => "expired".to_string(),
                },
                timestamp: order.timestamp,
                expiry: order.expiry,
            };

            Ok(JsValue::from(summary))
        })
    }

    /// Cancel an order
    #[wasm_bindgen]
    pub fn cancel_order(&self, order_id: &str) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let order_id = order_id.to_string();

        future_to_promise(async move {
            // Parse parameters
            let order_id = OrderId(order_id);

            // Cancel order
            darkswap
                .cancel_order(&order_id)
                .await
                .map_err(error_to_js_value)?;

            Ok(JsValue::UNDEFINED)
        })
    }

    /// Take an order
    #[wasm_bindgen]
    pub fn take_order(&self, order_id: &str, amount: &str) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let order_id = order_id.to_string();
        let amount = amount.to_string();

        future_to_promise(async move {
            // Parse parameters
            let order_id = OrderId(order_id);
            let amount = Decimal::from_str(&amount)
                .map_err(|e| JsValue::from_str(&format!("Invalid amount: {}", e)))?;

            // Take order
            let trade = darkswap
                .take_order(&order_id, amount)
                .await
                .map_err(error_to_js_value)?;

            // Convert to TradeSummary
            let summary = TradeSummary {
                id: trade.id.0.clone(),
                order_id: trade.order_id.0.clone(),
                maker: trade.maker.0.clone(),
                taker: trade.taker.0.clone(),
                base_asset: trade.base_asset.to_string(),
                quote_asset: trade.quote_asset.to_string(),
                side: match trade.side {
                    OrderSide::Buy => "buy".to_string(),
                    OrderSide::Sell => "sell".to_string(),
                },
                amount: trade.amount.to_string(),
                price: trade.price.to_string(),
                status: match trade.status {
                    TradeStatus::Pending => "pending".to_string(),
                    TradeStatus::Completed => "completed".to_string(),
                    TradeStatus::Failed => "failed".to_string(),
                },
                timestamp: trade.timestamp,
                txid: trade.txid.clone(),
            };

            Ok(JsValue::from(summary))
        })
    }

    /// Get all orders for a given asset pair
    #[wasm_bindgen]
    pub fn get_orders(&self, base_asset: &str, quote_asset: &str) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let base_asset = base_asset.to_string();
        let quote_asset = quote_asset.to_string();

        future_to_promise(async move {
            // Parse parameters
            let base_asset = parse_asset(&base_asset).map_err(error_to_js_value)?;
            let quote_asset = parse_asset(&quote_asset).map_err(error_to_js_value)?;

            // Get orders
            let orders = darkswap
                .get_orders(&base_asset, &quote_asset)
                .map_err(error_to_js_value)?;

            // Convert to OrderSummary array
            let summaries = orders
                .into_iter()
                .map(|order| {
                    OrderSummary {
                        id: order.id.0.clone(),
                        maker: order.maker.0.clone(),
                        base_asset: order.base_asset.to_string(),
                        quote_asset: order.quote_asset.to_string(),
                        side: match order.side {
                            OrderSide::Buy => "buy".to_string(),
                            OrderSide::Sell => "sell".to_string(),
                        },
                        amount: order.amount.to_string(),
                        price: order.price.to_string(),
                        status: match order.status {
                            OrderStatus::Open => "open".to_string(),
                            OrderStatus::Filled => "filled".to_string(),
                            OrderStatus::Canceled => "canceled".to_string(),
                            OrderStatus::Expired => "expired".to_string(),
                        },
                        timestamp: order.timestamp,
                        expiry: order.expiry,
                    }
                })
                .collect::<Vec<_>>();

            Ok(js_sys::Array::from_iter(summaries.into_iter().map(JsValue::from)).into())
        })
    }

    /// Get the best bid and ask for a given asset pair
    #[wasm_bindgen]
    pub fn get_best_bid_ask(&self, base_asset: &str, quote_asset: &str) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let base_asset = base_asset.to_string();
        let quote_asset = quote_asset.to_string();

        future_to_promise(async move {
            // Parse parameters
            let base_asset = parse_asset(&base_asset).map_err(error_to_js_value)?;
            let quote_asset = parse_asset(&quote_asset).map_err(error_to_js_value)?;

            // Get best bid and ask
            let (bid, ask) = darkswap
                .get_best_bid_ask(&base_asset, &quote_asset)
                .map_err(error_to_js_value)?;

            // Create result object
            let result = js_sys::Object::new();
            js_sys::Reflect::set(
                &result,
                &JsValue::from_str("bid"),
                &JsValue::from_str(&bid.map_or("null".to_string(), |b| b.to_string())),
            )
            .unwrap();
            js_sys::Reflect::set(
                &result,
                &JsValue::from_str("ask"),
                &JsValue::from_str(&ask.map_or("null".to_string(), |a| a.to_string())),
            )
            .unwrap();

            Ok(result.into())
        })
    }

    /// Set order created callback
    #[wasm_bindgen]
    pub fn on_order_created(&mut self, callback: js_sys::Function) {
        self.order_created_callback = Some(callback);
    }

    /// Set order canceled callback
    #[wasm_bindgen]
    pub fn on_order_canceled(&mut self, callback: js_sys::Function) {
        self.order_canceled_callback = Some(callback);
    }

    /// Set order filled callback
    #[wasm_bindgen]
    pub fn on_order_filled(&mut self, callback: js_sys::Function) {
        self.order_filled_callback = Some(callback);
    }

    /// Set trade started callback
    #[wasm_bindgen]
    pub fn on_trade_started(&mut self, callback: js_sys::Function) {
        self.trade_started_callback = Some(callback);
    }

    /// Set trade completed callback
    #[wasm_bindgen]
    pub fn on_trade_completed(&mut self, callback: js_sys::Function) {
        self.trade_completed_callback = Some(callback);
    }

    /// Set trade failed callback
    #[wasm_bindgen]
    pub fn on_trade_failed(&mut self, callback: js_sys::Function) {
        self.trade_failed_callback = Some(callback);
    }
}