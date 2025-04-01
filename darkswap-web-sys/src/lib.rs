//! WebAssembly bindings for darkswap-p2p
//!
//! This crate provides WebAssembly bindings for darkswap-p2p,
//! allowing it to be used in web browsers.

pub mod webrtc;
pub mod wallet_mock;

// Re-export wallet_mock as wallet for compatibility
pub use wallet_mock as wallet;

use darkswap_p2p::{
    network::{Network, NetworkConfig, NetworkEvent},
    Error,
};
use darkswap_support::types::PeerId;
use std::sync::{Arc, Mutex};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use web_sys::console;
use crate::webrtc::WebRtcManager;

// Initialize logging
fn init_logging() {
    console_log::init_with_level(log::Level::Info).unwrap();
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}

/// DarkSwap network for WebAssembly
#[wasm_bindgen]
pub struct DarkSwapNetwork {
    network: Arc<Mutex<Network>>,
    callbacks: Arc<Mutex<Callbacks>>,
    webrtc_manager: Arc<Mutex<WebRtcManager>>,
}

struct Callbacks {
    on_peer_connected: Option<js_sys::Function>,
    on_peer_disconnected: Option<js_sys::Function>,
    on_message: Option<js_sys::Function>,
    on_relay_reserved: Option<js_sys::Function>,
    on_connected_through_relay: Option<js_sys::Function>,
}

#[wasm_bindgen]
impl DarkSwapNetwork {
    /// Create a new DarkSwapNetwork
    #[wasm_bindgen(constructor)]
    pub async fn new() -> Result<DarkSwapNetwork, JsValue> {
        init_logging();
        
        // Create a default network config
        let config = NetworkConfig::default();
        
        // Create the network
        let network = Network::new(config).await
            .map_err(|e| JsValue::from_str(&format!("Failed to create network: {}", e)))?;
        
        // Create the callbacks
        let callbacks = Callbacks {
            on_peer_connected: None,
            on_peer_disconnected: None,
            on_message: None,
            on_relay_reserved: None,
            on_connected_through_relay: None,
        };
        
        // Create the WebRTC manager
        let webrtc_manager = WebRtcManager::new();
        
        // Create the DarkSwapNetwork
        let result = DarkSwapNetwork {
            network: Arc::new(Mutex::new(network)),
            callbacks: Arc::new(Mutex::new(callbacks)),
            webrtc_manager: Arc::new(Mutex::new(webrtc_manager)),
        };
        
        // Start the event loop
        let network_clone = result.network.clone();
        let callbacks_clone = result.callbacks.clone();
        spawn_local(async move {
            let mut network = network_clone.lock().unwrap();
            
            while let Some(event) = network.next_event().await {
                let callbacks = callbacks_clone.lock().unwrap();
                
                match event {
                    NetworkEvent::PeerConnected(peer_id) => {
                        if let Some(callback) = &callbacks.on_peer_connected {
                            let this = JsValue::null();
                            let peer_id_js = JsValue::from_str(&peer_id.0);
                            let _ = callback.call1(&this, &peer_id_js);
                        }
                    }
                    NetworkEvent::PeerDisconnected(peer_id) => {
                        if let Some(callback) = &callbacks.on_peer_disconnected {
                            let this = JsValue::null();
                            let peer_id_js = JsValue::from_str(&peer_id.0);
                            let _ = callback.call1(&this, &peer_id_js);
                        }
                    }
                    NetworkEvent::MessageReceived { peer_id, topic, message } => {
                        if let Some(callback) = &callbacks.on_message {
                            let this = JsValue::null();
                            let peer_id_js = JsValue::from_str(&peer_id.0);
                            let topic_js = JsValue::from_str(&topic);
                            let message_js = unsafe {
                                js_sys::Uint8Array::view(&message)
                            };
                            let _ = callback.call3(&this, &peer_id_js, &topic_js, &message_js);
                        }
                    }
                    NetworkEvent::RelayReserved { relay_peer_id, reservation_id } => {
                        if let Some(callback) = &callbacks.on_relay_reserved {
                            let this = JsValue::null();
                            let relay_peer_id_js = JsValue::from_str(&relay_peer_id.0);
                            let reservation_id_js = JsValue::from_f64(reservation_id as f64);
                            let _ = callback.call2(&this, &relay_peer_id_js, &reservation_id_js);
                        }
                    }
                    NetworkEvent::ConnectedThroughRelay { relay_peer_id, dst_peer_id } => {
                        if let Some(callback) = &callbacks.on_connected_through_relay {
                            let this = JsValue::null();
                            let relay_peer_id_js = JsValue::from_str(&relay_peer_id.0);
                            let dst_peer_id_js = JsValue::from_str(&dst_peer_id.0);
                            let _ = callback.call2(&this, &relay_peer_id_js, &dst_peer_id_js);
                        }
                    }
                }
            }
        });
        
        Ok(result)
    }
    
    /// Get the local peer ID
    #[wasm_bindgen]
    pub fn local_peer_id(&self) -> String {
        let network = self.network.lock().unwrap();
        network.local_peer_id().0.clone()
    }
    
    /// Connect to a peer
    #[wasm_bindgen]
    pub async fn connect(&self, addr: String) -> Result<(), JsValue> {
        let mut network = self.network.lock().unwrap();
        let peer_id_str = addr.split("/").last().unwrap_or("");
        let peer_id = PeerId(peer_id_str.to_string());
        let multiaddr = addr.parse()
            .map_err(|e| JsValue::from_str(&format!("Invalid multiaddr: {}", e)))?;
        
        network.dial_peer_with_addr(&peer_id, &multiaddr).await
            .map_err(|e| JsValue::from_str(&format!("Failed to connect: {}", e)))
    }
    
    /// Connect to a peer through a relay
    #[wasm_bindgen]
    pub async fn connect_through_relay(&self, relay_peer_id: String, dst_peer_id: String) -> Result<(), JsValue> {
        let mut network = self.network.lock().unwrap();
        let relay_peer = PeerId(relay_peer_id);
        let dst_peer = PeerId(dst_peer_id);
        
        network.connect_through_relay(&relay_peer, &dst_peer).await
            .map_err(|e| JsValue::from_str(&format!("Failed to connect through relay: {}", e)))
    }
    
    /// Listen on the given address
    #[wasm_bindgen]
    pub async fn listen_on(&self, addr: String) -> Result<(), JsValue> {
        let mut network = self.network.lock().unwrap();
        
        network.listen_on(&addr).await
            .map_err(|e| JsValue::from_str(&format!("Failed to listen: {}", e)))
    }
    
    /// Subscribe to a topic
    #[wasm_bindgen]
    pub fn subscribe(&self, topic: String) -> Result<(), JsValue> {
        let mut network = self.network.lock().unwrap();
        
        network.subscribe(&topic)
            .map_err(|e| JsValue::from_str(&format!("Failed to subscribe: {}", e)))
    }
    
    /// Unsubscribe from a topic
    #[wasm_bindgen]
    pub fn unsubscribe(&self, topic: String) -> Result<(), JsValue> {
        let mut network = self.network.lock().unwrap();
        
        network.unsubscribe(&topic)
            .map_err(|e| JsValue::from_str(&format!("Failed to unsubscribe: {}", e)))
    }
    
    /// Publish a message to a topic
    #[wasm_bindgen]
    pub async fn publish(&self, topic: String, message: js_sys::Uint8Array) -> Result<(), JsValue> {
        let mut network = self.network.lock().unwrap();
        let message_vec = message.to_vec();
        
        network.publish(&topic, message_vec).await
            .map_err(|e| JsValue::from_str(&format!("Failed to publish: {}", e)))
    }
    
    /// Register a callback for peer connection events
    #[wasm_bindgen]
    pub fn on_peer_connected(&self, callback: js_sys::Function) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.on_peer_connected = Some(callback);
    }
    
    /// Register a callback for peer disconnection events
    #[wasm_bindgen]
    pub fn on_peer_disconnected(&self, callback: js_sys::Function) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.on_peer_disconnected = Some(callback);
    }
    
    /// Register a callback for message events
    #[wasm_bindgen]
    pub fn on_message(&self, callback: js_sys::Function) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.on_message = Some(callback);
    }
    
    /// Register a callback for relay reservation events
    #[wasm_bindgen]
    pub fn on_relay_reserved(&self, callback: js_sys::Function) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.on_relay_reserved = Some(callback);
    }
    
    /// Register a callback for connected through relay events
    #[wasm_bindgen]
    pub fn on_connected_through_relay(&self, callback: js_sys::Function) {
        let mut callbacks = self.callbacks.lock().unwrap();
        callbacks.on_connected_through_relay = Some(callback);
    }
    
    /// Create a WebRTC connection to a peer
    #[wasm_bindgen]
    pub async fn create_webrtc_connection(&self, peer_id: String) -> Result<(), JsValue> {
        let mut webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Create a new WebRTC connection
        let connection = webrtc_manager.create_connection(&peer_id)?;
        
        // Create a data channel
        connection.create_data_channel("data", true)?;
        
        // Create an offer
        let offer = connection.create_offer().await?;
        
        // Send the offer to the peer (this would normally be done through the signaling server)
        console::log_1(&JsValue::from_str(&format!("Created WebRTC offer for peer {}: {}", peer_id, offer.sdp())));
        
        Ok(())
    }
    
    /// Process a WebRTC offer from a peer
    #[wasm_bindgen]
    pub async fn process_webrtc_offer(&self, peer_id: String, offer: String) -> Result<String, JsValue> {
        let mut webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Get or create a connection for the peer
        let connection = match webrtc_manager.get_connection(&peer_id) {
            Some(conn) => conn,
            None => webrtc_manager.create_connection(&peer_id)?,
        };
        
        // Set the remote description (offer)
        connection.set_remote_description(&offer, web_sys::RtcSdpType::Offer).await?;
        
        // Create an answer
        let answer = connection.create_answer().await?;
        
        // Return the answer
        Ok(answer.sdp())
    }
    
    /// Process a WebRTC answer from a peer
    #[wasm_bindgen]
    pub async fn process_webrtc_answer(&self, peer_id: String, answer: String) -> Result<(), JsValue> {
        let mut webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Get the connection for the peer
        let connection = webrtc_manager.get_connection(&peer_id)
            .ok_or_else(|| JsValue::from_str("No WebRTC connection found for peer"))?;
        
        // Set the remote description (answer)
        connection.set_remote_description(&answer, web_sys::RtcSdpType::Answer).await?;
        
        Ok(())
    }
    
    /// Add an ICE candidate from a peer
    #[wasm_bindgen]
    pub async fn add_ice_candidate(&self, peer_id: String, candidate: String, sdp_mid: String, sdp_m_line_index: u16) -> Result<(), JsValue> {
        let mut webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Get the connection for the peer
        let connection = webrtc_manager.get_connection(&peer_id)
            .ok_or_else(|| JsValue::from_str("No WebRTC connection found for peer"))?;
        
        // Add the ICE candidate
        connection.add_ice_candidate(&candidate, &sdp_mid, sdp_m_line_index).await?;
        
        Ok(())
    }
    
    /// Send data through a WebRTC data channel
    #[wasm_bindgen]
    pub fn send_webrtc_data(&self, peer_id: String, data: js_sys::Uint8Array) -> Result<(), JsValue> {
        let webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Get the connection for the peer
        let connection = webrtc_manager.get_connection(&peer_id)
            .ok_or_else(|| JsValue::from_str("No WebRTC connection found for peer"))?;
        
        // Send the data
        connection.send_data("data", &data.to_vec())?;
        
        Ok(())
    }
    
    /// Set up a WebRTC data channel message handler
    #[wasm_bindgen]
    pub fn on_webrtc_message(&self, peer_id: String, callback: js_sys::Function) -> Result<(), JsValue> {
        let mut webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Get the connection for the peer
        let connection = webrtc_manager.get_connection(&peer_id)
            .ok_or_else(|| JsValue::from_str("No WebRTC connection found for peer"))?;
        
        // Set up the message handler
        connection.setup_data_channel_message_handler("data", move |data| {
            let this = JsValue::null();
            let data_js = unsafe { js_sys::Uint8Array::view(&data) };
            let _ = callback.call1(&this, &data_js);
        })?;
        
        Ok(())
    }
    
    /// Set up a WebRTC ICE candidate handler
    #[wasm_bindgen]
    pub fn on_ice_candidate(&self, peer_id: String, callback: js_sys::Function) -> Result<(), JsValue> {
        let mut webrtc_manager = self.webrtc_manager.lock().unwrap();
        
        // Get the connection for the peer
        let connection = webrtc_manager.get_connection(&peer_id)
            .ok_or_else(|| JsValue::from_str("No WebRTC connection found for peer"))?;
        
        // Set up the ICE candidate handler
        connection.setup_ice_candidate_handler(move |candidate, sdp_mid, sdp_m_line_index| {
            let this = JsValue::null();
            let candidate_js = JsValue::from_str(&candidate);
            let sdp_mid_js = JsValue::from_str(&sdp_mid);
            let sdp_m_line_index_js = JsValue::from_f64(sdp_m_line_index as f64);
            let _ = callback.call3(&this, &candidate_js, &sdp_mid_js, &sdp_m_line_index_js);
        })?;
        
        Ok(())
    }
}