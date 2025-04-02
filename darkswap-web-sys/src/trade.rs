//! WebAssembly bindings for the DarkSwap trade functionality
//!
//! This module provides WebAssembly bindings for the DarkSwap trade functionality.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Array, Object, Promise, Reflect};
use web_sys::{console, window};
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use darkswap_sdk::trade::{Trade as SdkTrade, TradeConfig, TradeStatus};
use darkswap_sdk::orderbook::{Order as SdkOrder};

use crate::{to_js_error, from_js_value, to_js_value};
use crate::orderbook::Order;

// Global trade instance
static TRADE: Mutex<Option<Arc<Mutex<SdkTrade>>>> = Mutex::new(None);

/// Initialize the trade module
pub async fn initialize() -> Result<(), JsValue> {
    log::info!("Initializing trade module");
    
    // Initialize the trade with default configuration
    let config = TradeConfig::default();
    let trade = SdkTrade::new(config).map_err(to_js_error)?;
    
    // Store the trade instance
    let mut global_trade = TRADE.lock().unwrap();
    *global_trade = Some(Arc::new(Mutex::new(trade)));
    
    log::info!("Trade module initialized successfully");
    Ok(())
}

/// Check if the trade module is initialized
pub fn is_initialized() -> bool {
    TRADE.lock().unwrap().is_some()
}

/// Get the trade instance
fn get_trade() -> Result<Arc<Mutex<SdkTrade>>, JsValue> {
    TRADE.lock().unwrap()
        .clone()
        .ok_or_else(|| JsValue::from_str("Trade not initialized"))
}

/// Trade execution information
#[derive(Serialize, Deserialize)]
pub struct TradeExecution {
    pub id: String,
    pub maker_order: Order,
    pub taker_order: Order,
    pub status: String,
    pub timestamp: u64,
    pub completed_at: Option<u64>,
}

impl From<darkswap_sdk::trade::TradeExecution> for TradeExecution {
    fn from(trade: darkswap_sdk::trade::TradeExecution) -> Self {
        TradeExecution {
            id: trade.id.clone(),
            maker_order: Order::from(trade.maker_order.clone()),
            taker_order: Order::from(trade.taker_order.clone()),
            status: match trade.status {
                TradeStatus::Pending => "pending".to_string(),
                TradeStatus::Completed => "completed".to_string(),
                TradeStatus::Failed => "failed".to_string(),
            },
            timestamp: trade.timestamp,
            completed_at: trade.completed_at,
        }
    }
}

/// Trade class for JavaScript
#[wasm_bindgen]
pub struct Trade {
    inner: Arc<Mutex<SdkTrade>>,
}

#[wasm_bindgen]
impl Trade {
    /// Create a new trade instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Trade, JsValue> {
        let inner = get_trade()?;
        Ok(Trade { inner })
    }
    
    /// Create a trade between a maker and taker order
    #[wasm_bindgen]
    pub fn create_trade(&self, maker_order: JsValue, taker_order: JsValue) -> Promise {
        let trade_instance = self.inner.clone();
        
        future_to_promise(async move {
            // Parse orders
            let maker_order: Order = from_js_value(&maker_order)?;
            let taker_order: Order = from_js_value(&taker_order)?;
            
            // Convert to SDK orders
            let sdk_maker_order = SdkOrder::try_from(maker_order)?;
            let sdk_taker_order = SdkOrder::try_from(taker_order)?;
            
            // Create trade
            let mut trade = trade_instance.lock().unwrap();
            let trade_execution = trade.create_trade(sdk_maker_order, sdk_taker_order).await.map_err(to_js_error)?;
            
            // Convert to JavaScript trade execution
            let js_trade_execution = TradeExecution::from(trade_execution);
            
            to_js_value(&js_trade_execution)
        })
    }
    
    /// Execute a trade
    #[wasm_bindgen]
    pub fn execute_trade(&self, trade_id: &str) -> Promise {
        let trade_instance = self.inner.clone();
        let trade_id = trade_id.to_string();
        
        future_to_promise(async move {
            // Execute trade
            let mut trade = trade_instance.lock().unwrap();
            let result = trade.execute_trade(&trade_id).await.map_err(to_js_error)?;
            
            Ok(JsValue::from_bool(result))
        })
    }
    
    /// Get all trades
    #[wasm_bindgen]
    pub fn get_trades(&self) -> Promise {
        let trade_instance = self.inner.clone();
        
        future_to_promise(async move {
            // Get trades
            let trade = trade_instance.lock().unwrap();
            let trades = trade.get_trades().await.map_err(to_js_error)?;
            
            // Convert to JavaScript trade executions
            let js_trades = trades.into_iter()
                .map(|trade| TradeExecution::from(trade))
                .collect::<Vec<_>>();
            
            to_js_value(&js_trades)
        })
    }
    
    /// Get a trade by ID
    #[wasm_bindgen]
    pub fn get_trade_by_id(&self, trade_id: &str) -> Promise {
        let trade_instance = self.inner.clone();
        let trade_id = trade_id.to_string();
        
        future_to_promise(async move {
            // Get trade
            let trade = trade_instance.lock().unwrap();
            let trade_execution = trade.get_trade_by_id(&trade_id).await.map_err(to_js_error)?;
            
            // Convert to JavaScript trade execution
            match trade_execution {
                Some(trade_execution) => {
                    let js_trade_execution = TradeExecution::from(trade_execution);
                    to_js_value(&js_trade_execution)
                },
                None => Ok(JsValue::null()),
            }
        })
    }
    
    /// Get trades by maker address
    #[wasm_bindgen]
    pub fn get_trades_by_maker(&self, maker_address: &str) -> Promise {
        let trade_instance = self.inner.clone();
        let maker_address = maker_address.to_string();
        
        future_to_promise(async move {
            // Get trades
            let trade = trade_instance.lock().unwrap();
            let trades = trade.get_trades_by_maker(&maker_address).await.map_err(to_js_error)?;
            
            // Convert to JavaScript trade executions
            let js_trades = trades.into_iter()
                .map(|trade| TradeExecution::from(trade))
                .collect::<Vec<_>>();
            
            to_js_value(&js_trades)
        })
    }
    
    /// Get trades by taker address
    #[wasm_bindgen]
    pub fn get_trades_by_taker(&self, taker_address: &str) -> Promise {
        let trade_instance = self.inner.clone();
        let taker_address = taker_address.to_string();
        
        future_to_promise(async move {
            // Get trades
            let trade = trade_instance.lock().unwrap();
            let trades = trade.get_trades_by_taker(&taker_address).await.map_err(to_js_error)?;
            
            // Convert to JavaScript trade executions
            let js_trades = trades.into_iter()
                .map(|trade| TradeExecution::from(trade))
                .collect::<Vec<_>>();
            
            to_js_value(&js_trades)
        })
    }
    
    /// Get trades by status
    #[wasm_bindgen]
    pub fn get_trades_by_status(&self, status: &str) -> Promise {
        let trade_instance = self.inner.clone();
        let status = status.to_string();
        
        future_to_promise(async move {
            // Convert status
            let sdk_status = match status.as_str() {
                "pending" => TradeStatus::Pending,
                "completed" => TradeStatus::Completed,
                "failed" => TradeStatus::Failed,
                _ => return Err(JsValue::from_str("Invalid trade status")),
            };
            
            // Get trades
            let trade = trade_instance.lock().unwrap();
            let trades = trade.get_trades_by_status(sdk_status).await.map_err(to_js_error)?;
            
            // Convert to JavaScript trade executions
            let js_trades = trades.into_iter()
                .map(|trade| TradeExecution::from(trade))
                .collect::<Vec<_>>();
            
            to_js_value(&js_trades)
        })
    }
}