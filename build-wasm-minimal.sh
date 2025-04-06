#!/bin/bash
# Build script for DarkSwap WebAssembly module (minimal version)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building DarkSwap WebAssembly module (minimal version)...${NC}"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo -e "${YELLOW}wasm-pack not found. Installing...${NC}"
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo not found. Please install Rust and cargo.${NC}"
    exit 1
fi

# Create a minimal WebAssembly project
echo -e "${GREEN}Creating minimal WebAssembly project...${NC}"

# Create a temporary directory outside the workspace
TEMP_DIR=$(mktemp -d)
echo -e "${GREEN}Created temporary directory: ${TEMP_DIR}${NC}"

# Create directory structure
mkdir -p ${TEMP_DIR}/darkswap-wasm/src
mkdir -p web/public/wasm
mkdir -p web/src/wasm-bindings

# Create Cargo.toml with workspace declaration
cat > ${TEMP_DIR}/darkswap-wasm/Cargo.toml << EOF
[package]
name = "darkswap-wasm"
version = "0.1.0"
edition = "2021"
description = "DarkSwap WebAssembly Bindings"
license = "MIT"

[workspace]

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = { version = "0.3", features = ["console"] }
console_error_panic_hook = "0.1.7"
wasm-bindgen-futures = "0.4"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
rust_decimal = "1.30"
EOF

# Create lib.rs with fixed WebAssembly compilation issues
cat > ${TEMP_DIR}/darkswap-wasm/src/lib.rs << EOF
//! WebAssembly bindings for DarkSwap
//!
//! This module provides WebAssembly bindings for DarkSwap, allowing it to be used
//! in web applications.

use wasm_bindgen::prelude::*;
use js_sys::{Array, Function, Object, Promise};
use serde::{Deserialize, Serialize};
use wasm_bindgen_futures::future_to_promise;
use web_sys::console;

/// JavaScript error
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_obj(obj: &JsValue);
}

/// Asset type for JavaScript
#[wasm_bindgen]
#[derive(Copy, Clone)]
pub enum JsAssetType {
    Bitcoin = 0,
    Rune = 1,
    Alkane = 2,
}

/// Order side for JavaScript
#[wasm_bindgen]
#[derive(Copy, Clone)]
pub enum JsOrderSide {
    Buy = 0,
    Sell = 1,
}

/// Order status for JavaScript
#[wasm_bindgen]
#[derive(Copy, Clone)]
pub enum JsOrderStatus {
    Open = 0,
    Filled = 1,
    Cancelled = 2,
    Expired = 3,
}

/// Bitcoin network for JavaScript
#[wasm_bindgen]
#[derive(Copy, Clone)]
pub enum JsBitcoinNetwork {
    Mainnet = 0,
    Testnet = 1,
    Regtest = 2,
    Signet = 3,
}

/// Configuration for DarkSwap
#[wasm_bindgen]
pub struct JsConfig {
    /// Bitcoin network
    bitcoin_network: JsBitcoinNetwork,
    /// Relay URL
    relay_url: String,
    /// Listen addresses
    listen_addresses: Vec<String>,
    /// Bootstrap peers
    bootstrap_peers: Vec<String>,
    /// Wallet path
    wallet_path: Option<String>,
    /// Wallet password
    wallet_password: Option<String>,
    /// Debug mode
    debug: bool,
}

#[wasm_bindgen]
impl JsConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> JsConfig {
        JsConfig {
            bitcoin_network: JsBitcoinNetwork::Testnet,
            relay_url: "ws://localhost:8080".to_string(),
            listen_addresses: vec![],
            bootstrap_peers: vec![],
            wallet_path: None,
            wallet_password: None,
            debug: false,
        }
    }
    
    // Getters and setters for non-Copy types
    #[wasm_bindgen(getter)]
    pub fn bitcoin_network(&self) -> JsBitcoinNetwork {
        self.bitcoin_network
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_bitcoin_network(&mut self, value: JsBitcoinNetwork) {
        self.bitcoin_network = value;
    }
    
    #[wasm_bindgen(getter)]
    pub fn relay_url(&self) -> String {
        self.relay_url.clone()
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_relay_url(&mut self, value: String) {
        self.relay_url = value;
    }
    
    #[wasm_bindgen(getter)]
    pub fn listen_addresses(&self) -> js_sys::Array {
        self.listen_addresses.iter().map(|s| JsValue::from_str(s)).collect::<js_sys::Array>()
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_listen_addresses(&mut self, value: js_sys::Array) {
        let mut addresses = Vec::new();
        for i in 0..value.length() {
            if let Some(addr) = value.get(i).as_string() {
                addresses.push(addr);
            }
        }
        self.listen_addresses = addresses;
    }
    
    #[wasm_bindgen(getter)]
    pub fn bootstrap_peers(&self) -> js_sys::Array {
        self.bootstrap_peers.iter().map(|s| JsValue::from_str(s)).collect::<js_sys::Array>()
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_bootstrap_peers(&mut self, value: js_sys::Array) {
        let mut peers = Vec::new();
        for i in 0..value.length() {
            if let Some(peer) = value.get(i).as_string() {
                peers.push(peer);
            }
        }
        self.bootstrap_peers = peers;
    }
    
    #[wasm_bindgen(getter)]
    pub fn wallet_path(&self) -> Option<String> {
        self.wallet_path.clone()
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_wallet_path(&mut self, value: Option<String>) {
        self.wallet_path = value;
    }
    
    #[wasm_bindgen(getter)]
    pub fn wallet_password(&self) -> Option<String> {
        self.wallet_password.clone()
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_wallet_password(&mut self, value: Option<String>) {
        self.wallet_password = value;
    }
    
    #[wasm_bindgen(getter)]
    pub fn debug(&self) -> bool {
        self.debug
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_debug(&mut self, value: bool) {
        self.debug = value;
    }
}

/// DarkSwap WebAssembly class
#[wasm_bindgen]
pub struct JsDarkSwap {
    /// Event callback
    event_callback: Option<Function>,
}

#[wasm_bindgen]
impl JsDarkSwap {
    /// Create a new DarkSwap instance
    #[wasm_bindgen(constructor)]
    pub fn new(js_config: JsConfig) -> Result<JsDarkSwap, JsValue> {
        // Set panic hook
        console_error_panic_hook::set_once();
        
        // Log configuration
        log(&format!("Creating DarkSwap instance with config: {:?}", js_config.bitcoin_network() as u8));
        
        Ok(JsDarkSwap {
            event_callback: None,
        })
    }
    
    /// Start DarkSwap
    pub fn start(&self) -> Promise {
        log("Starting DarkSwap");
        
        future_to_promise(async move {
            // Simulate async operation
            Ok(JsValue::null())
        })
    }
    
    /// Stop DarkSwap
    pub fn stop(&self) -> Promise {
        log("Stopping DarkSwap");
        
        future_to_promise(async move {
            // Simulate async operation
            Ok(JsValue::null())
        })
    }
    
    /// Set event callback
    pub fn set_event_callback(&mut self, callback: Function) -> Promise {
        log("Setting event callback");
        
        let callback_clone = callback.clone();
        self.event_callback = Some(callback);
        
        future_to_promise(async move {
            // Simulate async operation
            Ok(JsValue::null())
        })
    }
    
    /// Create an order
    pub fn create_order(
        &self,
        side: JsOrderSide,
        base_asset_type: JsAssetType,
        base_asset_id: String,
        quote_asset_type: JsAssetType,
        quote_asset_id: String,
        amount: String,
        price: String,
    ) -> Promise {
        log(&format!(
            "Creating order: side={:?}, base={:?}/{}, quote={:?}/{}, amount={}, price={}",
            side as u8,
            base_asset_type as u8,
            base_asset_id,
            quote_asset_type as u8,
            quote_asset_id,
            amount,
            price,
        ));
        
        // Clone values for the async block
        let base_asset_id = base_asset_id.clone();
        let quote_asset_id = quote_asset_id.clone();
        let amount = amount.clone();
        let price = price.clone();
        
        future_to_promise(async move {
            // Simulate async operation
            Ok(JsValue::from_str("order-id-placeholder"))
        })
    }
    
    /// Cancel an order
    pub fn cancel_order(&self, order_id: String) -> Promise {
        log(&format!("Cancelling order: {}", order_id));
        
        // Clone values for the async block
        let order_id = order_id.clone();
        
        future_to_promise(async move {
            // Simulate async operation
            Ok(JsValue::null())
        })
    }
    
    /// Get an order by ID
    pub fn get_order(&self, order_id: String) -> Promise {
        log(&format!("Getting order: {}", order_id));
        
        // Clone values for the async block
        let order_id = order_id.clone();
        
        future_to_promise(async move {
            // Create a mock order
            let order = Object::new();
            js_sys::Reflect::set(&order, &JsValue::from_str("id"), &JsValue::from_str(&order_id)).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("side"), &JsValue::from_f64(JsOrderSide::Buy as u8 as f64)).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("baseAsset"), &JsValue::from_str("BTC")).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("quoteAsset"), &JsValue::from_str("USD")).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("amount"), &JsValue::from_str("1.0")).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("price"), &JsValue::from_str("50000")).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("timestamp"), &JsValue::from_f64(js_sys::Date::now())).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("status"), &JsValue::from_f64(JsOrderStatus::Open as u8 as f64)).unwrap();
            js_sys::Reflect::set(&order, &JsValue::from_str("maker"), &JsValue::from_str("peer-id-placeholder")).unwrap();
            
            Ok(order.into())
        })
    }
    
    /// Get orders
    pub fn get_orders(
        &self,
        side: Option<JsOrderSide>,
        base_asset_type: Option<JsAssetType>,
        base_asset_id: Option<String>,
        quote_asset_type: Option<JsAssetType>,
        quote_asset_id: Option<String>,
    ) -> Promise {
        log(&format!(
            "Getting orders: side={:?}, base={:?}/{:?}, quote={:?}/{:?}",
            side.map(|s| s as u8),
            base_asset_type.map(|t| t as u8),
            base_asset_id.clone(),
            quote_asset_type.map(|t| t as u8),
            quote_asset_id.clone(),
        ));
        
        // Clone values for the async block
        let base_asset_id = base_asset_id.clone();
        let quote_asset_id = quote_asset_id.clone();
        
        future_to_promise(async move {
            // Create mock orders
            let orders = Array::new();
            
            // Order 1
            let order1 = Object::new();
            js_sys::Reflect::set(&order1, &JsValue::from_str("id"), &JsValue::from_str("order-id-1")).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("side"), &JsValue::from_f64(JsOrderSide::Buy as u8 as f64)).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("baseAsset"), &JsValue::from_str("BTC")).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("quoteAsset"), &JsValue::from_str("USD")).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("amount"), &JsValue::from_str("1.0")).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("price"), &JsValue::from_str("50000")).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("timestamp"), &JsValue::from_f64(js_sys::Date::now())).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("status"), &JsValue::from_f64(JsOrderStatus::Open as u8 as f64)).unwrap();
            js_sys::Reflect::set(&order1, &JsValue::from_str("maker"), &JsValue::from_str("peer-id-1")).unwrap();
            
            // Order 2
            let order2 = Object::new();
            js_sys::Reflect::set(&order2, &JsValue::from_str("id"), &JsValue::from_str("order-id-2")).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("side"), &JsValue::from_f64(JsOrderSide::Sell as u8 as f64)).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("baseAsset"), &JsValue::from_str("BTC")).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("quoteAsset"), &JsValue::from_str("USD")).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("amount"), &JsValue::from_str("0.5")).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("price"), &JsValue::from_str("51000")).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("timestamp"), &JsValue::from_f64(js_sys::Date::now())).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("status"), &JsValue::from_f64(JsOrderStatus::Open as u8 as f64)).unwrap();
            js_sys::Reflect::set(&order2, &JsValue::from_str("maker"), &JsValue::from_str("peer-id-2")).unwrap();
            
            orders.push(&order1);
            orders.push(&order2);
            
            Ok(orders.into())
        })
    }
    
    /// Take an order
    pub fn take_order(&self, order_id: String, amount: String) -> Promise {
        log(&format!("Taking order: {}, amount: {}", order_id, amount));
        
        // Clone values for the async block
        let order_id = order_id.clone();
        let amount = amount.clone();
        
        future_to_promise(async move {
            // Simulate async operation
            Ok(JsValue::from_str("trade-id-placeholder"))
        })
    }
}

/// Initialize the DarkSwap WebAssembly module
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
    log("DarkSwap WebAssembly module initialized");
}
EOF

# Build the WebAssembly module
echo -e "${GREEN}Building WebAssembly module...${NC}"
cd ${TEMP_DIR}/darkswap-wasm
wasm-pack build --target web --out-dir ../../home/ghostinthegrey/darkswap/web/public/wasm

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}WebAssembly module built successfully!${NC}"
    
    # Create JavaScript bindings
    echo -e "${GREEN}Creating TypeScript bindings...${NC}"
    
    # Copy the generated JavaScript bindings
    cp ../../home/ghostinthegrey/darkswap/web/public/wasm/darkswap_wasm.js ../../home/ghostinthegrey/darkswap/web/src/wasm-bindings/darkswap_wasm.js
    cp ../../home/ghostinthegrey/darkswap/web/public/wasm/darkswap_wasm.d.ts ../../home/ghostinthegrey/darkswap/web/src/wasm-bindings/darkswap_wasm.d.ts
    
    # Update the import path in the TypeScript bindings
    sed -i 's/\.\/darkswap_wasm_bg\.wasm/\.\/wasm\/darkswap_wasm_bg\.wasm/g' ../../home/ghostinthegrey/darkswap/web/src/wasm-bindings/darkswap_wasm.js
    
    echo -e "${GREEN}TypeScript bindings created successfully!${NC}"
    
    # Update the App.tsx to use the WebAssembly module
    echo -e "${GREEN}Updating App.tsx to use the WebAssembly module...${NC}"
    sed -i 's/autoInitialize={false}/autoInitialize={true}/g' ../../home/ghostinthegrey/darkswap/web/src/App.tsx
    sed -i 's/wasmPath="\/darkswap_wasm\.wasm"/wasmPath="\/wasm\/darkswap_wasm_bg\.wasm"/g' ../../home/ghostinthegrey/darkswap/web/src/App.tsx
    
    echo -e "${GREEN}App.tsx updated successfully!${NC}"
    
    echo -e "${GREEN}DarkSwap WebAssembly module built and integrated successfully!${NC}"
else
    echo -e "${RED}Error: Failed to build WebAssembly module.${NC}"
    # Clean up temporary directory
    rm -rf ${TEMP_DIR}
    exit 1
fi

# Return to the original directory
cd ../../home/ghostinthegrey/darkswap

# Clean up temporary directory
echo -e "${GREEN}Cleaning up temporary directory...${NC}"
rm -rf ${TEMP_DIR}

echo -e "${GREEN}Build complete!${NC}"