//! WebRTC transport for the DarkSwap WebAssembly bindings
//!
//! This module provides WebRTC transport functionality for the DarkSwap WebAssembly bindings.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Array, Object, Promise, Reflect, Function};
use web_sys::{
    RtcPeerConnection, RtcConfiguration, RtcDataChannel, RtcDataChannelInit,
    RtcSdpType, RtcSessionDescriptionInit, RtcIceCandidate, RtcIceCandidateInit,
    MessageEvent, Event,
};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

use crate::{to_js_error, from_js_value, to_js_value};

// Global WebRTC instance
static WEBRTC: Mutex<Option<Arc<Mutex<WebRtcManager>>>> = Mutex::new(None);

/// Initialize the WebRTC module
pub async fn initialize() -> Result<(), JsValue> {
    log::info!("Initializing WebRTC module");
    
    // Initialize the WebRTC manager
    let manager = WebRtcManager::new()?;
    
    // Store the WebRTC manager instance
    let mut global_webrtc = WEBRTC.lock().unwrap();
    *global_webrtc = Some(Arc::new(Mutex::new(manager)));
    
    log::info!("WebRTC module initialized successfully");
    Ok(())
}

/// Check if the WebRTC module is initialized
pub fn is_initialized() -> bool {
    WEBRTC.lock().unwrap().is_some()
}

/// Get the WebRTC manager instance
fn get_webrtc() -> Result<Arc<Mutex<WebRtcManager>>, JsValue> {
    WEBRTC.lock().unwrap()
        .clone()
        .ok_or_else(|| JsValue::from_str("WebRTC not initialized"))
}

/// WebRTC connection information
#[derive(Serialize, Deserialize)]
pub struct WebRtcConnectionInfo {
    pub peer_id: String,
    pub connection_id: String,
    pub local_description: Option<String>,
    pub remote_description: Option<String>,
    pub ice_candidates: Vec<String>,
    pub state: String,
    pub data_channels: Vec<String>,
}

/// WebRTC manager
pub struct WebRtcManager {
    connections: HashMap<String, WebRtcConnection>,
    ice_servers: Vec<String>,
}

impl WebRtcManager {
    /// Create a new WebRTC manager
    pub fn new() -> Result<Self, JsValue> {
        Ok(Self {
            connections: HashMap::new(),
            ice_servers: vec![
                "stun:stun.l.google.com:19302".to_string(),
                "stun:stun1.l.google.com:19302".to_string(),
                "stun:stun2.l.google.com:19302".to_string(),
                "stun:stun3.l.google.com:19302".to_string(),
                "stun:stun4.l.google.com:19302".to_string(),
            ],
        })
    }
    
    /// Add an ICE server
    pub fn add_ice_server(&mut self, url: String) {
        self.ice_servers.push(url);
    }
    
    /// Create a new WebRTC connection
    pub fn create_connection(&mut self, peer_id: &str) -> Result<String, JsValue> {
        // Create a new connection ID
        let connection_id = format!("{}_{}", peer_id, js_sys::Date::now());
        
        // Create a new connection
        let connection = WebRtcConnection::new(peer_id.to_string(), connection_id.clone(), self.ice_servers.clone())?;
        
        // Store the connection
        self.connections.insert(connection_id.clone(), connection);
        
        Ok(connection_id)
    }
    
    /// Get a WebRTC connection
    pub fn get_connection(&self, connection_id: &str) -> Option<&WebRtcConnection> {
        self.connections.get(connection_id)
    }
    
    /// Get a mutable WebRTC connection
    pub fn get_connection_mut(&mut self, connection_id: &str) -> Option<&mut WebRtcConnection> {
        self.connections.get_mut(connection_id)
    }
    
    /// Remove a WebRTC connection
    pub fn remove_connection(&mut self, connection_id: &str) -> Option<WebRtcConnection> {
        self.connections.remove(connection_id)
    }
    
    /// Get all WebRTC connections
    pub fn get_connections(&self) -> Vec<WebRtcConnectionInfo> {
        self.connections.values()
            .map(|connection| connection.get_info())
            .collect()
    }
}

/// WebRTC connection
pub struct WebRtcConnection {
    peer_id: String,
    connection_id: String,
    peer_connection: RtcPeerConnection,
    data_channels: HashMap<String, RtcDataChannel>,
    ice_candidates: Vec<RtcIceCandidate>,
    on_ice_candidate: Option<js_sys::Function>,
    on_data_channel: Option<js_sys::Function>,
    on_negotiation_needed: Option<js_sys::Function>,
    on_connection_state_change: Option<js_sys::Function>,
}

impl WebRtcConnection {
    /// Create a new WebRTC connection
    pub fn new(peer_id: String, connection_id: String, ice_servers: Vec<String>) -> Result<Self, JsValue> {
        // Create RTCConfiguration
        let config = RtcConfiguration::new();
        let ice_servers_array = Array::new();
        
        for server in ice_servers {
            let server_obj = Object::new();
            Reflect::set(&server_obj, &JsValue::from_str("urls"), &JsValue::from_str(&server))?;
            ice_servers_array.push(&server_obj);
        }
        
        config.ice_servers(&ice_servers_array);
        
        // Create RTCPeerConnection
        let peer_connection = RtcPeerConnection::new_with_configuration(&config)?;
        
        Ok(Self {
            peer_id,
            connection_id,
            peer_connection,
            data_channels: HashMap::new(),
            ice_candidates: Vec::new(),
            on_ice_candidate: None,
            on_data_channel: None,
            on_negotiation_needed: None,
            on_connection_state_change: None,
        })
    }
    
    /// Get connection information
    pub fn get_info(&self) -> WebRtcConnectionInfo {
        WebRtcConnectionInfo {
            peer_id: self.peer_id.clone(),
            connection_id: self.connection_id.clone(),
            local_description: self.peer_connection.local_description().map(|desc| desc.sdp()),
            remote_description: self.peer_connection.remote_description().map(|desc| desc.sdp()),
            ice_candidates: self.ice_candidates.iter().map(|candidate| candidate.candidate()).collect(),
            state: self.peer_connection.connection_state().as_string().unwrap_or_else(|| "unknown".to_string()),
            data_channels: self.data_channels.keys().cloned().collect(),
        }
    }
    
    /// Create a data channel
    pub fn create_data_channel(&mut self, label: &str) -> Result<RtcDataChannel, JsValue> {
        // Create data channel options
        let mut options = RtcDataChannelInit::new();
        options.ordered(true);
        
        // Create data channel
        let data_channel = self.peer_connection.create_data_channel_with_data_channel_dict(label, &options);
        
        // Store data channel
        self.data_channels.insert(label.to_string(), data_channel.clone());
        
        Ok(data_channel)
    }
    
    /// Set on ice candidate callback
    pub fn set_on_ice_candidate(&mut self, callback: js_sys::Function) -> Result<(), JsValue> {
        let connection_weak = self.peer_connection.clone();
        
        // Set onicecandidate callback
        let onicecandidate_callback = Closure::wrap(Box::new(move |event: web_sys::RtcPeerConnectionIceEvent| {
            if let Some(candidate) = event.candidate() {
                let _ = callback.call1(&JsValue::NULL, &candidate);
            }
        }) as Box<dyn FnMut(web_sys::RtcPeerConnectionIceEvent)>);
        
        self.peer_connection.set_onicecandidate(Some(onicecandidate_callback.as_ref().unchecked_ref()));
        onicecandidate_callback.forget();
        
        self.on_ice_candidate = Some(callback);
        
        Ok(())
    }
    
    /// Set on data channel callback
    pub fn set_on_data_channel(&mut self, callback: js_sys::Function) -> Result<(), JsValue> {
        let connection_weak = self.peer_connection.clone();
        
        // Set ondatachannel callback
        let ondatachannel_callback = Closure::wrap(Box::new(move |event: web_sys::RtcDataChannelEvent| {
            if let Some(data_channel) = event.channel() {
                let _ = callback.call1(&JsValue::NULL, &data_channel);
            }
        }) as Box<dyn FnMut(web_sys::RtcDataChannelEvent)>);
        
        self.peer_connection.set_ondatachannel(Some(ondatachannel_callback.as_ref().unchecked_ref()));
        ondatachannel_callback.forget();
        
        self.on_data_channel = Some(callback);
        
        Ok(())
    }
    
    /// Set on negotiation needed callback
    pub fn set_on_negotiation_needed(&mut self, callback: js_sys::Function) -> Result<(), JsValue> {
        let connection_weak = self.peer_connection.clone();
        
        // Set onnegotiationneeded callback
        let onnegotiationneeded_callback = Closure::wrap(Box::new(move |event: web_sys::Event| {
            let _ = callback.call0(&JsValue::NULL);
        }) as Box<dyn FnMut(web_sys::Event)>);
        
        self.peer_connection.set_onnegotiationneeded(Some(onnegotiationneeded_callback.as_ref().unchecked_ref()));
        onnegotiationneeded_callback.forget();
        
        self.on_negotiation_needed = Some(callback);
        
        Ok(())
    }
    
    /// Set on connection state change callback
    pub fn set_on_connection_state_change(&mut self, callback: js_sys::Function) -> Result<(), JsValue> {
        let connection_weak = self.peer_connection.clone();
        
        // Set onconnectionstatechange callback
        let onconnectionstatechange_callback = Closure::wrap(Box::new(move |event: web_sys::Event| {
            let _ = callback.call0(&JsValue::NULL);
        }) as Box<dyn FnMut(web_sys::Event)>);
        
        self.peer_connection.set_onconnectionstatechange(Some(onconnectionstatechange_callback.as_ref().unchecked_ref()));
        onconnectionstatechange_callback.forget();
        
        self.on_connection_state_change = Some(callback);
        
        Ok(())
    }
    
    /// Create an offer
    pub async fn create_offer(&self) -> Result<RtcSessionDescriptionInit, JsValue> {
        // Create offer
        let offer = JsFuture::from(self.peer_connection.create_offer()).await?;
        
        // Create session description
        let mut session_description = RtcSessionDescriptionInit::new(RtcSdpType::Offer);
        session_description.sdp(&js_sys::Reflect::get(&offer, &JsValue::from_str("sdp"))?.as_string().unwrap());
        
        Ok(session_description)
    }
    
    /// Create an answer
    pub async fn create_answer(&self) -> Result<RtcSessionDescriptionInit, JsValue> {
        // Create answer
        let answer = JsFuture::from(self.peer_connection.create_answer()).await?;
        
        // Create session description
        let mut session_description = RtcSessionDescriptionInit::new(RtcSdpType::Answer);
        session_description.sdp(&js_sys::Reflect::get(&answer, &JsValue::from_str("sdp"))?.as_string().unwrap());
        
        Ok(session_description)
    }
    
    /// Set local description
    pub async fn set_local_description(&self, session_description: &RtcSessionDescriptionInit) -> Result<(), JsValue> {
        JsFuture::from(self.peer_connection.set_local_description(session_description)).await?;
        Ok(())
    }
    
    /// Set remote description
    pub async fn set_remote_description(&self, session_description: &RtcSessionDescriptionInit) -> Result<(), JsValue> {
        JsFuture::from(self.peer_connection.set_remote_description(session_description)).await?;
        Ok(())
    }
    
    /// Add ICE candidate
    pub async fn add_ice_candidate(&mut self, candidate: &RtcIceCandidateInit) -> Result<(), JsValue> {
        // Create ICE candidate
        let ice_candidate = RtcIceCandidate::new(candidate)?;
        
        // Add ICE candidate to peer connection
        JsFuture::from(self.peer_connection.add_ice_candidate_with_opt_rtc_ice_candidate(Some(&ice_candidate))).await?;
        
        // Store ICE candidate
        self.ice_candidates.push(ice_candidate);
        
        Ok(())
    }
    
    /// Close the connection
    pub fn close(&self) {
        self.peer_connection.close();
    }
}

/// WebRTC class for JavaScript
#[wasm_bindgen]
pub struct WebRtc {
    inner: Arc<Mutex<WebRtcManager>>,
}

#[wasm_bindgen]
impl WebRtc {
    /// Create a new WebRTC instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WebRtc, JsValue> {
        let inner = get_webrtc()?;
        Ok(WebRtc { inner })
    }
    
    /// Add an ICE server
    #[wasm_bindgen]
    pub fn add_ice_server(&self, url: &str) {
        let mut webrtc = self.inner.lock().unwrap();
        webrtc.add_ice_server(url.to_string());
    }
    
    /// Create a new WebRTC connection
    #[wasm_bindgen]
    pub fn create_connection(&self, peer_id: &str) -> Result<String, JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        webrtc.create_connection(peer_id)
    }
    
    /// Get all WebRTC connections
    #[wasm_bindgen]
    pub fn get_connections(&self) -> Promise {
        let webrtc = self.inner.clone();
        
        future_to_promise(async move {
            let webrtc = webrtc.lock().unwrap();
            let connections = webrtc.get_connections();
            to_js_value(&connections)
        })
    }
    
    /// Create a data channel
    #[wasm_bindgen]
    pub fn create_data_channel(&self, connection_id: &str, label: &str) -> Result<RtcDataChannel, JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        
        // Get connection
        let connection = webrtc.get_connection_mut(connection_id)
            .ok_or_else(|| JsValue::from_str("Connection not found"))?;
        
        // Create data channel
        connection.create_data_channel(label)
    }
    
    /// Set on ice candidate callback
    #[wasm_bindgen]
    pub fn set_on_ice_candidate(&self, connection_id: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        
        // Get connection
        let connection = webrtc.get_connection_mut(connection_id)
            .ok_or_else(|| JsValue::from_str("Connection not found"))?;
        
        // Set callback
        connection.set_on_ice_candidate(callback)
    }
    
    /// Set on data channel callback
    #[wasm_bindgen]
    pub fn set_on_data_channel(&self, connection_id: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        
        // Get connection
        let connection = webrtc.get_connection_mut(connection_id)
            .ok_or_else(|| JsValue::from_str("Connection not found"))?;
        
        // Set callback
        connection.set_on_data_channel(callback)
    }
    
    /// Set on negotiation needed callback
    #[wasm_bindgen]
    pub fn set_on_negotiation_needed(&self, connection_id: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        
        // Get connection
        let connection = webrtc.get_connection_mut(connection_id)
            .ok_or_else(|| JsValue::from_str("Connection not found"))?;
        
        // Set callback
        connection.set_on_negotiation_needed(callback)
    }
    
    /// Set on connection state change callback
    #[wasm_bindgen]
    pub fn set_on_connection_state_change(&self, connection_id: &str, callback: js_sys::Function) -> Result<(), JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        
        // Get connection
        let connection = webrtc.get_connection_mut(connection_id)
            .ok_or_else(|| JsValue::from_str("Connection not found"))?;
        
        // Set callback
        connection.set_on_connection_state_change(callback)
    }
    
    /// Create an offer
    #[wasm_bindgen]
    pub fn create_offer(&self, connection_id: &str) -> Promise {
        let webrtc = self.inner.clone();
        let connection_id = connection_id.to_string();
        
        future_to_promise(async move {
            let webrtc = webrtc.lock().unwrap();
            
            // Get connection
            let connection = webrtc.get_connection(&connection_id)
                .ok_or_else(|| JsValue::from_str("Connection not found"))?;
            
            // Create offer
            let offer = connection.create_offer().await?;
            
            Ok(offer.into())
        })
    }
    
    /// Create an answer
    #[wasm_bindgen]
    pub fn create_answer(&self, connection_id: &str) -> Promise {
        let webrtc = self.inner.clone();
        let connection_id = connection_id.to_string();
        
        future_to_promise(async move {
            let webrtc = webrtc.lock().unwrap();
            
            // Get connection
            let connection = webrtc.get_connection(&connection_id)
                .ok_or_else(|| JsValue::from_str("Connection not found"))?;
            
            // Create answer
            let answer = connection.create_answer().await?;
            
            Ok(answer.into())
        })
    }
    
    /// Set local description
    #[wasm_bindgen]
    pub fn set_local_description(&self, connection_id: &str, session_description: &RtcSessionDescriptionInit) -> Promise {
        let webrtc = self.inner.clone();
        let connection_id = connection_id.to_string();
        let session_description = session_description.clone();
        
        future_to_promise(async move {
            let webrtc = webrtc.lock().unwrap();
            
            // Get connection
            let connection = webrtc.get_connection(&connection_id)
                .ok_or_else(|| JsValue::from_str("Connection not found"))?;
            
            // Set local description
            connection.set_local_description(&session_description).await?;
            
            Ok(JsValue::from_bool(true))
        })
    }
    
    /// Set remote description
    #[wasm_bindgen]
    pub fn set_remote_description(&self, connection_id: &str, session_description: &RtcSessionDescriptionInit) -> Promise {
        let webrtc = self.inner.clone();
        let connection_id = connection_id.to_string();
        let session_description = session_description.clone();
        
        future_to_promise(async move {
            let webrtc = webrtc.lock().unwrap();
            
            // Get connection
            let connection = webrtc.get_connection(&connection_id)
                .ok_or_else(|| JsValue::from_str("Connection not found"))?;
            
            // Set remote description
            connection.set_remote_description(&session_description).await?;
            
            Ok(JsValue::from_bool(true))
        })
    }
    
    /// Add ICE candidate
    #[wasm_bindgen]
    pub fn add_ice_candidate(&self, connection_id: &str, candidate: &RtcIceCandidateInit) -> Promise {
        let webrtc = self.inner.clone();
        let connection_id = connection_id.to_string();
        let candidate = candidate.clone();
        
        future_to_promise(async move {
            let mut webrtc = webrtc.lock().unwrap();
            
            // Get connection
            let connection = webrtc.get_connection_mut(&connection_id)
                .ok_or_else(|| JsValue::from_str("Connection not found"))?;
            
            // Add ICE candidate
            connection.add_ice_candidate(&candidate).await?;
            
            Ok(JsValue::from_bool(true))
        })
    }
    
    /// Close a connection
    #[wasm_bindgen]
    pub fn close_connection(&self, connection_id: &str) -> Result<(), JsValue> {
        let mut webrtc = self.inner.lock().unwrap();
        
        // Get connection
        let connection = webrtc.get_connection(connection_id)
            .ok_or_else(|| JsValue::from_str("Connection not found"))?;
        
        // Close connection
        connection.close();
        
        // Remove connection
        webrtc.remove_connection(connection_id);
        
        Ok(())
    }
}