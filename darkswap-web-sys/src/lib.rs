//! WebAssembly bindings for the DarkSwap SDK
//!
//! This crate provides WebAssembly bindings for the DarkSwap SDK, allowing it to be used in web applications.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Array, Object, Promise, Reflect};
use web_sys::{console, window};
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// Re-export modules
pub mod wallet;
pub mod orderbook;
pub mod trade;
pub mod webrtc;
pub mod utils;

// Initialize panic hook and logger
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
    wasm_logger::init(wasm_logger::Config::default());
    log::info!("DarkSwap WebAssembly bindings initialized");
}

/// Initialize the WebAssembly bindings
#[wasm_bindgen]
pub async fn initialize() -> Result<(), JsValue> {
    log::info!("Initializing DarkSwap WebAssembly bindings");
    
    // Initialize the wallet module
    wallet::initialize().await?;
    
    // Initialize the orderbook module
    orderbook::initialize().await?;
    
    // Initialize the trade module
    trade::initialize().await?;
    
    // Initialize the WebRTC module
    webrtc::initialize().await?;
    
    log::info!("DarkSwap WebAssembly bindings initialized successfully");
    Ok(())
}

/// Check if the WebAssembly bindings are initialized
#[wasm_bindgen]
pub fn is_initialized() -> bool {
    wallet::is_initialized() && orderbook::is_initialized() && trade::is_initialized() && webrtc::is_initialized()
}

/// Get the version of the WebAssembly bindings
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get the name of the WebAssembly bindings
#[wasm_bindgen]
pub fn name() -> String {
    env!("CARGO_PKG_NAME").to_string()
}

/// Get the description of the WebAssembly bindings
#[wasm_bindgen]
pub fn description() -> String {
    env!("CARGO_PKG_DESCRIPTION").to_string()
}

/// Convert a Rust error to a JavaScript error
pub fn to_js_error<E: std::fmt::Display>(error: E) -> JsValue {
    JsValue::from_str(&format!("{}", error))
}

/// Convert a JavaScript value to a Rust value
pub fn from_js_value<T: for<'a> Deserialize<'a>>(value: &JsValue) -> Result<T, JsValue> {
    serde_wasm_bindgen::from_value(value.clone())
        .map_err(|e| to_js_error(e))
}

/// Convert a Rust value to a JavaScript value
pub fn to_js_value<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(value)
        .map_err(|e| to_js_error(e))
}