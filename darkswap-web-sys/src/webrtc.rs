//! WebRTC implementation for the browser
//!
//! This module provides WebRTC functionality for the browser using web-sys.

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{
    RtcConfiguration, RtcDataChannel, RtcDataChannelInit, RtcIceCandidate, RtcIceCandidateInit,
    RtcPeerConnection, RtcPeerConnectionIceEvent, RtcSdpType, RtcSessionDescription,
    RtcSessionDescriptionInit,
};
use js_sys::{Array, Object, Promise, Reflect};
use std::{
    cell::RefCell,
    collections::HashMap,
    rc::Rc,
};

/// WebRTC connection
pub struct WebRtcConnection {
    /// Peer connection
    pub peer_connection: RtcPeerConnection,
    /// Data channels
    pub data_channels: HashMap<String, RtcDataChannel>,
    /// On message callback
    pub on_message: Option<Closure<dyn FnMut(web_sys::MessageEvent)>>,
    /// On ice candidate callback
    pub on_ice_candidate: Option<Closure<dyn FnMut(RtcPeerConnectionIceEvent)>>,
}

impl WebRtcConnection {
    /// Create a new WebRTC connection
    pub fn new() -> Result<Self, JsValue> {
        // Create RTCPeerConnection configuration
        let mut rtc_config = RtcConfiguration::new();
        let ice_servers = Array::new();
        
        // Add STUN servers
        let stun_server = Object::new();
        Reflect::set(&stun_server, &JsValue::from_str("urls"), &JsValue::from_str("stun:stun.l.google.com:19302"))?;
        ice_servers.push(&stun_server);
        
        rtc_config.ice_servers(&ice_servers);
        
        // Create RTCPeerConnection
        let peer_connection = RtcPeerConnection::new_with_configuration(&rtc_config)?;
        
        Ok(WebRtcConnection {
            peer_connection,
            data_channels: HashMap::new(),
            on_message: None,
            on_ice_candidate: None,
        })
    }
    
    /// Create a data channel
    pub fn create_data_channel(&mut self, label: &str, ordered: bool) -> Result<RtcDataChannel, JsValue> {
        let mut data_channel_init = RtcDataChannelInit::new();
        data_channel_init.ordered(ordered);
        
        let data_channel = self.peer_connection.create_data_channel_with_data_channel_dict(label, &data_channel_init);
        self.data_channels.insert(label.to_string(), data_channel.clone());
        
        Ok(data_channel)
    }
    
    /// Create an offer
    pub async fn create_offer(&self) -> Result<RtcSessionDescription, JsValue> {
        let offer_promise = self.peer_connection.create_offer();
        let offer = wasm_bindgen_futures::JsFuture::from(offer_promise).await?;
        
        let mut offer_obj = RtcSessionDescriptionInit::new(RtcSdpType::Offer);
        offer_obj.sdp(&js_sys::Reflect::get(&offer, &JsValue::from_str("sdp"))?.as_string().unwrap());
        
        let set_local_promise = self.peer_connection.set_local_description(&offer_obj);
        wasm_bindgen_futures::JsFuture::from(set_local_promise).await?;
        
        Ok(self.peer_connection.local_description().unwrap())
    }
    
    /// Create an answer
    pub async fn create_answer(&self) -> Result<RtcSessionDescription, JsValue> {
        let answer_promise = self.peer_connection.create_answer();
        let answer = wasm_bindgen_futures::JsFuture::from(answer_promise).await?;
        
        let mut answer_obj = RtcSessionDescriptionInit::new(RtcSdpType::Answer);
        answer_obj.sdp(&js_sys::Reflect::get(&answer, &JsValue::from_str("sdp"))?.as_string().unwrap());
        
        let set_local_promise = self.peer_connection.set_local_description(&answer_obj);
        wasm_bindgen_futures::JsFuture::from(set_local_promise).await?;
        
        Ok(self.peer_connection.local_description().unwrap())
    }
    
    /// Set remote description
    pub async fn set_remote_description(&self, sdp: &str, sdp_type: RtcSdpType) -> Result<(), JsValue> {
        let mut remote_desc = RtcSessionDescriptionInit::new(sdp_type);
        remote_desc.sdp(sdp);
        
        let promise = self.peer_connection.set_remote_description(&remote_desc);
        wasm_bindgen_futures::JsFuture::from(promise).await?;
        
        Ok(())
    }
    
    /// Add ICE candidate
    pub async fn add_ice_candidate(&self, candidate: &str, sdp_mid: &str, sdp_m_line_index: u16) -> Result<(), JsValue> {
        let mut candidate_init = RtcIceCandidateInit::new(candidate);
        candidate_init.sdp_mid(Some(sdp_mid));
        candidate_init.sdp_m_line_index(Some(sdp_m_line_index));
        
        let ice_candidate = RtcIceCandidate::new(&candidate_init)?;
        let promise = self.peer_connection.add_ice_candidate_with_opt_rtc_ice_candidate(Some(&ice_candidate));
        wasm_bindgen_futures::JsFuture::from(promise).await?;
        
        Ok(())
    }
    
    /// Set up ICE candidate handler
    pub fn setup_ice_candidate_handler(&mut self, callback: impl Fn(String, String, u16) + 'static) -> Result<(), JsValue> {
        let callback = Rc::new(RefCell::new(callback));
        
        let on_ice_candidate = Closure::wrap(Box::new(move |event: RtcPeerConnectionIceEvent| {
            if let Some(candidate) = event.candidate() {
                let sdp_mid = candidate.sdp_mid().unwrap_or_default();
                let sdp_m_line_index = candidate.sdp_m_line_index().unwrap_or(0);
                let candidate_str = candidate.candidate();
                
                callback.borrow()(candidate_str, sdp_mid, sdp_m_line_index);
            }
        }) as Box<dyn FnMut(RtcPeerConnectionIceEvent)>);
        
        self.peer_connection.set_onicecandidate(Some(on_ice_candidate.as_ref().unchecked_ref()));
        self.on_ice_candidate = Some(on_ice_candidate);
        
        Ok(())
    }
    
    /// Set up data channel message handler
    pub fn setup_data_channel_message_handler(&mut self, label: &str, callback: impl Fn(Vec<u8>) + 'static) -> Result<(), JsValue> {
        let data_channel = self.data_channels.get(label).ok_or_else(|| JsValue::from_str("Data channel not found"))?;
        let callback = Rc::new(RefCell::new(callback));
        
        let on_message = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
            if let Ok(array_buffer) = event.data().dyn_into::<js_sys::ArrayBuffer>() {
                let uint8_array = js_sys::Uint8Array::new(&array_buffer);
                let mut data = vec![0; uint8_array.length() as usize];
                uint8_array.copy_to(&mut data);
                
                callback.borrow()(data);
            }
        }) as Box<dyn FnMut(web_sys::MessageEvent)>);
        
        data_channel.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
        self.on_message = Some(on_message);
        
        Ok(())
    }
    
    /// Send data through a data channel
    pub fn send_data(&self, label: &str, data: &[u8]) -> Result<(), JsValue> {
        let data_channel = self.data_channels.get(label).ok_or_else(|| JsValue::from_str("Data channel not found"))?;
        let array = js_sys::Uint8Array::new_with_length(data.len() as u32);
        array.copy_from(data);
        
        data_channel.send_with_array_buffer_view(&array)
    }
}

/// WebRTC manager
pub struct WebRtcManager {
    /// Connections
    pub connections: HashMap<String, WebRtcConnection>,
}

impl WebRtcManager {
    /// Create a new WebRTC manager
    pub fn new() -> Self {
        WebRtcManager {
            connections: HashMap::new(),
        }
    }
    
    /// Create a new connection
    pub fn create_connection(&mut self, peer_id: &str) -> Result<&mut WebRtcConnection, JsValue> {
        let connection = WebRtcConnection::new()?;
        self.connections.insert(peer_id.to_string(), connection);
        
        Ok(self.connections.get_mut(peer_id).unwrap())
    }
    
    /// Get a connection
    pub fn get_connection(&mut self, peer_id: &str) -> Option<&mut WebRtcConnection> {
        self.connections.get_mut(peer_id)
    }
    
    /// Remove a connection
    pub fn remove_connection(&mut self, peer_id: &str) -> Option<WebRtcConnection> {
        self.connections.remove(peer_id)
    }
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Log a message to the console
pub fn console_log(msg: &str) {
    log(msg);
}