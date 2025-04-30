//! WebAssembly bindings for the DarkSwap orderbook functionality
//!
//! This module provides WebAssembly bindings for the DarkSwap orderbook functionality.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Array, Object, Promise, Reflect};
use web_sys::{console, window};
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use darkswap_sdk::orderbook::{Orderbook as SdkOrderbook, OrderbookConfig, Order as SdkOrder, OrderSide, OrderStatus};

use crate::{to_js_error, from_js_value, to_js_value};

// Global orderbook instance
static ORDERBOOK: Mutex<Option<Arc<Mutex<SdkOrderbook>>>> = Mutex::new(None);

/// Initialize the orderbook module
pub async fn initialize() -> Result<(), JsValue> {
    log::info!("Initializing orderbook module");
    
    // Initialize the orderbook with default configuration
    let config = OrderbookConfig::default();
    let orderbook = SdkOrderbook::new(config).map_err(to_js_error)?;
    
    // Store the orderbook instance
    let mut global_orderbook = ORDERBOOK.lock().unwrap();
    *global_orderbook = Some(Arc::new(Mutex::new(orderbook)));
    
    log::info!("Orderbook module initialized successfully");
    Ok(())
}

/// Check if the orderbook module is initialized
pub fn is_initialized() -> bool {
    ORDERBOOK.lock().unwrap().is_some()
}

/// Get the orderbook instance
fn get_orderbook() -> Result<Arc<Mutex<SdkOrderbook>>, JsValue> {
    ORDERBOOK.lock().unwrap()
        .clone()
        .ok_or_else(|| JsValue::from_str("Orderbook not initialized"))
}

/// Order information
#[derive(Serialize, Deserialize)]
pub struct Order {
    pub id: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub side: String,
    pub amount: String,
    pub price: String,
    pub timestamp: u64,
    pub expiry: u64,
    pub status: String,
    pub maker: String,
}

impl From<SdkOrder> for Order {
    fn from(order: SdkOrder) -> Self {
        Order {
            id: order.id.clone(),
            base_asset: order.base_asset.clone(),
            quote_asset: order.quote_asset.clone(),
            side: match order.side {
                OrderSide::Buy => "buy".to_string(),
                OrderSide::Sell => "sell".to_string(),
            },
            amount: order.amount.to_string(),
            price: order.price.to_string(),
            timestamp: order.timestamp,
            expiry: order.expiry,
            status: match order.status {
                OrderStatus::Open => "open".to_string(),
                OrderStatus::Filled => "filled".to_string(),
                OrderStatus::Cancelled => "cancelled".to_string(),
                OrderStatus::Expired => "expired".to_string(),
            },
            maker: order.maker.to_string(),
        }
    }
}

impl TryFrom<Order> for SdkOrder {
    type Error = JsValue;
    
    fn try_from(order: Order) -> Result<Self, Self::Error> {
        Ok(SdkOrder {
            id: order.id,
            base_asset: order.base_asset,
            quote_asset: order.quote_asset,
            side: match order.side.as_str() {
                "buy" => OrderSide::Buy,
                "sell" => OrderSide::Sell,
                _ => return Err(JsValue::from_str("Invalid order side")),
            },
            amount: order.amount.parse().map_err(to_js_error)?,
            price: order.price.parse().map_err(to_js_error)?,
            timestamp: order.timestamp,
            expiry: order.expiry,
            status: match order.status.as_str() {
                "open" => OrderStatus::Open,
                "filled" => OrderStatus::Filled,
                "cancelled" => OrderStatus::Cancelled,
                "expired" => OrderStatus::Expired,
                _ => return Err(JsValue::from_str("Invalid order status")),
            },
            maker: order.maker,
        })
    }
}

/// Orderbook class for JavaScript
#[wasm_bindgen]
pub struct Orderbook {
    inner: Arc<Mutex<SdkOrderbook>>,
}

#[wasm_bindgen]
impl Orderbook {
    /// Create a new orderbook instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Orderbook, JsValue> {
        let inner = get_orderbook()?;
        Ok(Orderbook { inner })
    }
    
    /// Add an order to the orderbook
    #[wasm_bindgen]
    pub fn add_order(&self, order: JsValue) -> Promise {
        let orderbook = self.inner.clone();
        
        future_to_promise(async move {
            // Parse order
            let order: Order = from_js_value(&order)?;
            
            // Convert to SDK order
            let sdk_order = SdkOrder::try_from(order)?;
            
            // Add order to orderbook
            let mut orderbook = orderbook.lock().unwrap();
            let order_id = orderbook.add_order(sdk_order).await.map_err(to_js_error)?;
            
            Ok(JsValue::from_str(&order_id))
        })
    }
    
    /// Remove an order from the orderbook
    #[wasm_bindgen]
    pub fn remove_order(&self, order_id: &str) -> Promise {
        let orderbook = self.inner.clone();
        let order_id = order_id.to_string();
        
        future_to_promise(async move {
            // Remove order from orderbook
            let mut orderbook = orderbook.lock().unwrap();
            let result = orderbook.remove_order(&order_id).await.map_err(to_js_error)?;
            
            Ok(JsValue::from_bool(result))
        })
    }
    
    /// Get all orders from the orderbook
    #[wasm_bindgen]
    pub fn get_orders(&self) -> Promise {
        let orderbook = self.inner.clone();
        
        future_to_promise(async move {
            // Get orders from orderbook
            let orderbook = orderbook.lock().unwrap();
            let orders = orderbook.get_orders().await.map_err(to_js_error)?;
            
            // Convert to JavaScript orders
            let js_orders = orders.into_iter()
                .map(|order| Order::from(order))
                .collect::<Vec<_>>();
            
            to_js_value(&js_orders)
        })
    }
    
    /// Get an order by ID
    #[wasm_bindgen]
    pub fn get_order_by_id(&self, order_id: &str) -> Promise {
        let orderbook = self.inner.clone();
        let order_id = order_id.to_string();
        
        future_to_promise(async move {
            // Get order from orderbook
            let orderbook = orderbook.lock().unwrap();
            let order = orderbook.get_order_by_id(&order_id).await.map_err(to_js_error)?;
            
            // Convert to JavaScript order
            match order {
                Some(order) => {
                    let js_order = Order::from(order);
                    to_js_value(&js_order)
                },
                None => Ok(JsValue::null()),
            }
        })
    }
    
    /// Get orders by trading pair
    #[wasm_bindgen]
    pub fn get_orders_by_pair(&self, base_asset: &str, quote_asset: &str) -> Promise {
        let orderbook = self.inner.clone();
        let base_asset = base_asset.to_string();
        let quote_asset = quote_asset.to_string();
        
        future_to_promise(async move {
            // Get orders from orderbook
            let orderbook = orderbook.lock().unwrap();
            let orders = orderbook.get_orders_by_pair(&base_asset, &quote_asset).await.map_err(to_js_error)?;
            
            // Convert to JavaScript orders
            let js_orders = orders.into_iter()
                .map(|order| Order::from(order))
                .collect::<Vec<_>>();
            
            to_js_value(&js_orders)
        })
    }
    
    /// Match an order with existing orders
    #[wasm_bindgen]
    pub fn match_orders(&self, order: JsValue) -> Promise {
        let orderbook = self.inner.clone();
        
        future_to_promise(async move {
            // Parse order
            let order: Order = from_js_value(&order)?;
            
            // Convert to SDK order
            let sdk_order = SdkOrder::try_from(order)?;
            
            // Match orders
            let orderbook = orderbook.lock().unwrap();
            let matching_orders = orderbook.match_orders(&sdk_order).await.map_err(to_js_error)?;
            
            // Convert to JavaScript orders
            let js_orders = matching_orders.into_iter()
                .map(|order| Order::from(order))
                .collect::<Vec<_>>();
            
            to_js_value(&js_orders)
        })
    }
}