//! WebAssembly bindings for DarkSwap
//!
//! This crate provides WebAssembly bindings for the DarkSwap SDK.

mod trade;
mod wallet;
mod p2p;

use wasm_bindgen::prelude::*;
use darkswap_sdk::{
    DarkSwap,
    config::Config,
    p2p::PeerId,
    types::Event,
};

// Re-export types
pub use trade::{
    AlkaneHandlerWasm,
    PsbtHandlerWasm,
    RuneHandlerWasm,
    TradeProtocolWasm,
};
pub use wallet::WalletWasm;
pub use p2p::P2PNetworkWasm;

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
        let darkswap = DarkSwap::new(config, tx)
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
    pub fn local_peer_id(&self) -> String {
        self.inner.local_peer_id().to_string()
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
    
    /// Connect to a peer via relay
    #[wasm_bindgen]
    pub async fn connect_via_relay(&mut self, peer_id: &str) -> Result<String, JsValue> {
        // Parse the peer ID
        let peer_id = PeerId::from_str(peer_id)
            .map_err(|e| JsValue::from_str(&format!("Invalid peer ID: {}", e)))?;
        
        // Connect to the peer via relay
        self.inner.connect_via_relay(peer_id).await
            .map_err(|e| JsValue::from_str(&format!("Failed to connect via relay: {}", e)))
    }
    
    /// Send data to a peer via relay
    #[wasm_bindgen]
    pub async fn send_via_relay(&mut self, peer_id: &str, relay_id: &str, data: &[u8]) -> Result<(), JsValue> {
        // Parse the peer ID
        let peer_id = PeerId::from_str(peer_id)
            .map_err(|e| JsValue::from_str(&format!("Invalid peer ID: {}", e)))?;
        
        // Send data via relay
        self.inner.send_via_relay(peer_id, relay_id, data.to_vec()).await
            .map_err(|e| JsValue::from_str(&format!("Failed to send via relay: {}", e)))
    }
    
    /// Close a relay connection
    #[wasm_bindgen]
    pub async fn close_relay(&mut self, relay_id: &str) -> Result<(), JsValue> {
        // Close the relay connection
        self.inner.close_relay(relay_id).await
            .map_err(|e| JsValue::from_str(&format!("Failed to close relay: {}", e)))
    }
    
    /// Create a trade offer
    #[wasm_bindgen]
    pub async fn create_trade_offer(
        &self,
        maker_asset_type: &str,
        maker_asset_id: &str,
        maker_amount: u64,
        taker_asset_type: &str,
        taker_asset_id: &str,
        taker_amount: u64,
        expiration_seconds: u64,
    ) -> Result<String, JsValue> {
        // Create the trade offer
        self.inner.create_trade_offer(
            maker_asset_type,
            maker_asset_id,
            maker_amount,
            taker_asset_type,
            taker_asset_id,
            taker_amount,
            expiration_seconds,
        ).await.map_err(|e| JsValue::from_str(&format!("Failed to create trade offer: {}", e)))
    }
    
    /// Accept a trade offer
    #[wasm_bindgen]
    pub async fn accept_trade_offer(&self, offer_id: &str) -> Result<(), JsValue> {
        self.inner.accept_trade_offer(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to accept trade offer: {}", e)))
    }
    
    /// Get the Bitcoin balance
    #[wasm_bindgen]
    pub async fn get_bitcoin_balance(&self) -> Result<u64, JsValue> {
        self.inner.get_bitcoin_balance()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get Bitcoin balance: {}", e)))
    }
    
    /// Get the rune balance
    #[wasm_bindgen]
    pub async fn get_rune_balance(&self, rune_id: &str) -> Result<u64, JsValue> {
        self.inner.get_rune_balance(rune_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get rune balance: {}", e)))
    }
    
    /// Get the alkane balance
    #[wasm_bindgen]
    pub async fn get_alkane_balance(&self, alkane_id: &str) -> Result<u64, JsValue> {
        self.inner.get_alkane_balance(alkane_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get alkane balance: {}", e)))
    }
    
    /// Get all trade offers
    #[wasm_bindgen]
    pub async fn get_trade_offers(&self) -> Result<String, JsValue> {
        let offers = self.inner.get_trade_offers()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade offers: {}", e)))?;
        
        // Convert the offers to JSON
        let offers_json = serde_json::to_string(&offers)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offers: {}", e)))?;
        
        Ok(offers_json)
    }
    
    /// Get a trade offer
    #[wasm_bindgen]
    pub async fn get_trade_offer(&self, offer_id: &str) -> Result<String, JsValue> {
        let offer = self.inner.get_trade_offer(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade offer: {}", e)))?;
        
        // Convert the offer to JSON
        let offer_json = serde_json::to_string(&offer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?;
        
        Ok(offer_json)
    }
    
    /// Get the trade state
    #[wasm_bindgen]
    pub async fn get_trade_state(&self, offer_id: &str) -> Result<String, JsValue> {
        self.inner.get_trade_state(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade state: {}", e)))
    }
}