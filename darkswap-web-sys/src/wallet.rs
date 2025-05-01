//! WebAssembly bindings for the DarkSwap wallet functionality
//!
//! This module provides WebAssembly bindings for the DarkSwap wallet functionality.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Promise, JsValue, Array, Object, Reflect}; // Added Array, Object, Reflect for get_utxos
use std::sync::Arc;
use darkswap_sdk::{wallet::Wallet as SdkWallet, config::WalletConfig, wallet::Utxo}; // Added Utxo
use bitcoin::{Address, Network, Transaction}; // Keep if needed elsewhere, though not directly used by Wallet trait methods here
use bitcoin::psbt::PartiallySignedTransaction as Psbt; // Keep if needed elsewhere

use std::str::FromStr; // Keep if needed elsewhere

// Global wallet instance (adapted to the trait object)
static WALLET: Option<Arc<dyn SdkWallet + Send + Sync>> = None;

/// Initialize the wallet module
#[wasm_bindgen] // Added wasm_bindgen macro
pub async fn initialize() -> Result<(), JsValue> {
    log::info!("Initializing wallet module");

    // Set up panic hook
    console_error_panic_hook::set_once();

    // Initialize the wallet with default configuration
    // Note: WalletConfig might need to be passed in or loaded from storage in a real scenario
    let config = WalletConfig::default();
    let wallet = darkswap_sdk::wallet::create_wallet(&config).map_err(to_js_error)?; // Use create_wallet function

    // Store the wallet instance
    unsafe {
        WALLET = Some(wallet);
    }

    log::info!("Wallet module initialized successfully");
    Ok(())
}

/// Check if the wallet module is initialized
#[wasm_bindgen] // Added wasm_bindgen macro
pub fn is_initialized() -> bool {
    unsafe {
        WALLET.is_some()
    }
}

/// Get the wallet instance
fn get_wallet() -> Result<Arc<dyn SdkWallet + Send + Sync>, JsValue> {
    unsafe {
        WALLET.clone()
            .ok_or_else(|| JsValue::from_str("Wallet not initialized"))
    }
}


/// Wallet class for JavaScript
#[wasm_bindgen]
pub struct WalletWasm {
    inner: Arc<dyn SdkWallet + Send + Sync>,
}

#[wasm_bindgen]
impl WalletWasm {
    /// Create a new wallet instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WalletWasm, JsValue> {
        let inner = get_wallet()?;
        Ok(WalletWasm { inner })
    }

    /// Get the wallet address
    #[wasm_bindgen]
    pub fn get_address(&self) -> Promise {
        let wallet = self.inner.clone();

        future_to_promise(async move {
            let address = wallet.get_address().map_err(to_js_error)?;
            Ok(JsValue::from_str(&address))
        })
    }

    /// Get the wallet balance
    #[wasm_bindgen]
    pub fn get_balance(&self) -> Promise {
        let wallet = self.inner.clone();

        future_to_promise(async move {
            let balance = wallet.get_balance().map_err(to_js_error)?;
            Ok(JsValue::from_f64(balance as f64)) // Return balance as f64 for JS
        })
    }

    /// Get wallet UTXOs
    #[wasm_bindgen]
    pub fn get_utxos(&self) -> Promise {
        let wallet = self.inner.clone();

        future_to_promise(async move {
            let utxos = wallet.get_utxos().map_err(to_js_error)?;

            // Convert UTXOs to a format suitable for JavaScript
            let js_utxos = js_sys::Array::new();
            for utxo in utxos {
                let obj = js_sys::Object::new();
                js_sys::Reflect::set(&obj, &JsValue::from_str("txid"), &JsValue::from_str(&utxo.txid))?;
                js_sys::Reflect::set(&obj, &JsValue::from_str("vout"), &JsValue::from_f64(utxo.vout as f64))?;
                js_sys::Reflect::set(&obj, &JsValue::from_str("amount"), &JsValue::from_f64(utxo.amount as f64))?;
                js_sys::Reflect::set(&obj, &JsValue::from_str("scriptPubkey"), &JsValue::from_str(&utxo.script_pubkey))?;
                js_utxos.push(&obj);
            }

            Ok(js_utxos.into())
        })
    }
}

// Helper functions for converting between Rust and JsValue (assuming these are defined elsewhere)
// fn from_js_value<'a, T: Deserialize<'a>>(js_value: &'a JsValue) -> Result<T, JsValue> { ... }
// fn to_js_value<T: Serialize>(value: &T) -> Result<JsValue, JsValue> { ... }
