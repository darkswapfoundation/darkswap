//! WebAssembly bindings for DarkSwap
//!
//! This crate provides WebAssembly bindings for the DarkSwap SDK.

mod trade;
mod wallet;
use wasm_bindgen::prelude::*;
use darkswap_sdk::{
    DarkSwap,
    config::Config,
    p2p::PeerId,
    types::{Event, Asset}, // Import Asset
};
use darkswap_support::{hex, base64}; // Import hex and base64 from darkswap_support

// Re-export types
pub use trade::{
    AlkaneHandlerWasm,
    RuneHandlerWasm,
    TradeProtocolWasm,
};
pub use wallet::WalletWasm;
/// WebAssembly bindings for DarkSwap
#[wasm_bindgen]
pub struct DarkSwapWasm {
    /// Inner DarkSwap instance
    inner: DarkSwap,
    /// Event callback
    callback: js_sys::Function,
}

#[wasm_bindgen]
impl DarkSwapWasm {
    /// Create a new DarkSwap instance
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str, callback: js_sys::Function) -> Result<DarkSwapWasm, JsValue> {
        // Set up panic hook
        console_error_panic_hook::set_once();

        // Parse the configuration
        let config: Config = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;

        // Create the event channel
        let (tx, mut rx) = tokio::sync::mpsc::channel(100);

        // Create the DarkSwap instance
        let darkswap = DarkSwap::new(config)
            .map_err(|e| JsValue::from_str(&format!("Failed to create DarkSwap: {}", e)))?;

        // Create the wrapper
        let wrapper = DarkSwapWasm {
            inner: darkswap,
            callback,
        };

        // Spawn a task to handle events
        let callback = wrapper.callback.clone();
        wasm_bindgen_futures::spawn_local(async move {
            while let Some(event) = rx.recv().await {
                // Convert the event to JSON
                let event_json = serde_json::to_string(&event)
                    .unwrap_or_else(|e| format!("{{\"error\": \"Failed to serialize event: {}\"}}", e));

                // Call the callback
                let _ = callback.call1(
                    &JsValue::NULL,
                    &JsValue::from_str(&event_json),
                );
            }
        });

        Ok(wrapper)
    }

    /// Start the DarkSwap instance
    #[wasm_bindgen]
    pub async fn start(&mut self) -> Result<(), JsValue> {
        self.inner.start().await
            .map_err(|e| JsValue::from_str(&format!("Failed to start DarkSwap: {}", e)))
    }

    /// Stop the DarkSwap instance
    #[wasm_bindgen]
    pub async fn stop(&mut self) -> Result<(), JsValue> {
        self.inner.stop().await
            .map_err(|e| JsValue::from_str(&format!("Failed to stop DarkSwap: {}", e)))
    }

    /// Get the local peer ID
    #[wasm_bindgen]
    pub async fn local_peer_id(&self) -> Result<String, JsValue> {
        let network = self.inner.network.read().await;
        Ok(network.local_peer_id().to_string())
    }

    /// Connect to a peer
    #[wasm_bindgen]
    pub async fn connect_to_peer(&mut self, peer_id: &str) -> Result<(), JsValue> {
        // Parse the peer ID
        let peer_id = PeerId::from_str(peer_id)
            .map_err(|e| JsValue::from_str(&format!("Invalid peer ID: {}", e)))?;

        // Connect to the peer
        self.inner.connect_to_peer(peer_id).await
            .map_err(|e| JsValue::from_str(&format!("Failed to connect to peer: {}", e)))
    }

    // Removed connect_via_relay, send_via_relay, close_relay as they are not in DarkSwap

    // Removed create_trade_offer, accept_trade_offer, get_bitcoin_balance, get_rune_balance, get_alkane_balance, get_trade_offers, get_trade_offer, get_trade_state as they are not in DarkSwap
}

// Helper function for converting Rust errors to JsValue
fn to_js_error(e: anyhow::Error) -> JsValue {
    JsValue::from_str(&format!("Rust error: {}", e))
}