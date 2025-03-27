//! WebRTC WebAssembly bindings for DarkSwap
//!
//! This module provides WebAssembly bindings for the WebRTC functionality of the DarkSwap SDK.

#![cfg(all(feature = "wasm", feature = "webrtc"))]

use crate::error::{Error, Result};
use crate::types::PeerId;
use crate::webrtc_signaling::{SessionDescription, SessionDescriptionType, IceCandidate};
use crate::webrtc_data_channel::{WebRtcDataChannel, ChannelState};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::{console, RtcPeerConnection, RtcSessionDescription, RtcIceCandidate};

/// Convert error to JsValue
fn error_to_js_value(error: Error) -> JsValue {
    JsValue::from_str(&error.to_string())
}

/// Convert result to JsValue
fn result_to_js_value<T: Into<JsValue>>(result: Result<T>) -> Result<JsValue, JsValue> {
    result.map(|value| value.into()).map_err(error_to_js_value)
}

/// Session description type for JavaScript
#[wasm_bindgen]
pub enum JsSessionDescriptionType {
    /// Offer
    Offer,
    /// Answer
    Answer,
}

/// Session description for JavaScript
#[wasm_bindgen]
#[derive(Clone)]
pub struct JsSessionDescription {
    /// Type
    pub type_: JsSessionDescriptionType,
    /// SDP
    pub sdp: String,
}

#[wasm_bindgen]
impl JsSessionDescription {
    /// Create a new session description
    #[wasm_bindgen(constructor)]
    pub fn new(type_: JsSessionDescriptionType, sdp: String) -> Self {
        Self { type_, sdp }
    }

    /// Convert to RtcSessionDescription
    pub fn to_rtc_session_description(&self) -> Result<RtcSessionDescription, JsValue> {
        let mut init = web_sys::RtcSessionDescriptionInit::new(match self.type_ {
            JsSessionDescriptionType::Offer => web_sys::RtcSdpType::Offer,
            JsSessionDescriptionType::Answer => web_sys::RtcSdpType::Answer,
        });
        init.sdp(&self.sdp);
        RtcSessionDescription::new(&init).map_err(|e| e)
    }

    /// Convert from RtcSessionDescription
    pub fn from_rtc_session_description(desc: &RtcSessionDescription) -> Self {
        let type_ = match desc.type_() {
            web_sys::RtcSdpType::Offer => JsSessionDescriptionType::Offer,
            web_sys::RtcSdpType::Answer => JsSessionDescriptionType::Answer,
            _ => JsSessionDescriptionType::Offer, // Default to offer for other types
        };
        Self {
            type_,
            sdp: desc.sdp(),
        }
    }

    /// Convert to internal SessionDescription
    pub fn to_internal(&self) -> SessionDescription {
        SessionDescription {
            type_: match self.type_ {
                JsSessionDescriptionType::Offer => SessionDescriptionType::Offer,
                JsSessionDescriptionType::Answer => SessionDescriptionType::Answer,
            },
            sdp: self.sdp.clone(),
        }
    }

    /// Convert from internal SessionDescription
    pub fn from_internal(desc: &SessionDescription) -> Self {
        Self {
            type_: match desc.type_ {
                SessionDescriptionType::Offer => JsSessionDescriptionType::Offer,
                SessionDescriptionType::Answer => JsSessionDescriptionType::Answer,
            },
            sdp: desc.sdp.clone(),
        }
    }
}

/// ICE candidate for JavaScript
#[wasm_bindgen]
#[derive(Clone)]
pub struct JsIceCandidate {
    /// Candidate string
    pub candidate: String,
    /// SDP mid
    pub sdp_mid: Option<String>,
    /// SDP m-line index
    pub sdp_m_line_index: Option<u16>,
}

#[wasm_bindgen]
impl JsIceCandidate {
    /// Create a new ICE candidate
    #[wasm_bindgen(constructor)]
    pub fn new(candidate: String, sdp_mid: Option<String>, sdp_m_line_index: Option<u16>) -> Self {
        Self {
            candidate,
            sdp_mid,
            sdp_m_line_index,
        }
    }

    /// Convert to RtcIceCandidate
    pub fn to_rtc_ice_candidate(&self) -> Result<RtcIceCandidate, JsValue> {
        let mut init = web_sys::RtcIceCandidateInit::new(&self.candidate);
        if let Some(sdp_mid) = &self.sdp_mid {
            init.sdp_mid(Some(sdp_mid));
        }
        if let Some(sdp_m_line_index) = self.sdp_m_line_index {
            init.sdp_m_line_index(Some(sdp_m_line_index as u16));
        }
        RtcIceCandidate::new(&init).map_err(|e| e)
    }

    /// Convert from RtcIceCandidate
    pub fn from_rtc_ice_candidate(candidate: &RtcIceCandidate) -> Self {
        Self {
            candidate: candidate.candidate(),
            sdp_mid: candidate.sdp_mid(),
            sdp_m_line_index: candidate.sdp_m_line_index(),
        }
    }

    /// Convert to internal IceCandidate
    pub fn to_internal(&self) -> IceCandidate {
        IceCandidate {
            candidate: self.candidate.clone(),
            sdp_mid: self.sdp_mid.clone(),
            sdp_m_line_index: self.sdp_m_line_index,
        }
    }

    /// Convert from internal IceCandidate
    pub fn from_internal(candidate: &IceCandidate) -> Self {
        Self {
            candidate: candidate.candidate.clone(),
            sdp_mid: candidate.sdp_mid.clone(),
            sdp_m_line_index: candidate.sdp_m_line_index,
        }
    }
}

/// WebRTC relay reservation for JavaScript
#[wasm_bindgen]
#[derive(Clone)]
pub struct JsRelayReservation {
    /// Relay peer ID
    pub relay_peer_id: String,
    /// Reservation ID
    pub reservation_id: String,
    /// Expiration time (Unix timestamp)
    pub expires_at: u64,
}

#[wasm_bindgen]
impl JsRelayReservation {
    /// Create a new relay reservation
    #[wasm_bindgen(constructor)]
    pub fn new(relay_peer_id: String, reservation_id: String, expires_at: u64) -> Self {
        Self {
            relay_peer_id,
            reservation_id,
            expires_at,
        }
    }
}

/// WebRTC connection for JavaScript
#[wasm_bindgen]
pub struct WebRtcConnection {
    /// Peer connection
    peer_connection: RtcPeerConnection,
    /// Local peer ID
    local_peer_id: PeerId,
    /// Remote peer ID
    remote_peer_id: PeerId,
    /// ICE candidate callback
    ice_candidate_callback: Option<js_sys::Function>,
    /// Data channel
    data_channel: Option<web_sys::RtcDataChannel>,
    /// Data channel open callback
    data_channel_open_callback: Option<js_sys::Function>,
    /// Data channel message callback
    data_channel_message_callback: Option<js_sys::Function>,
    /// Data channel close callback
    data_channel_close_callback: Option<js_sys::Function>,
    /// Using relay
    using_relay: bool,
    /// Relay peer ID
    relay_peer_id: Option<PeerId>,
}

#[wasm_bindgen]
impl WebRtcConnection {
    /// Create a new WebRTC connection
    #[wasm_bindgen(constructor)]
    pub fn new(local_peer_id: String, remote_peer_id: String) -> Result<WebRtcConnection, JsValue> {
        // Create RTCPeerConnection
        let rtc_config = web_sys::RtcConfiguration::new();
        let ice_server = web_sys::RtcIceServer::new();
        ice_server.urls(&JsValue::from_str("stun:stun.l.google.com:19302"));
        let ice_servers = js_sys::Array::new();
        ice_servers.push(&ice_server);
        rtc_config.ice_servers(&ice_servers);
        
        let peer_connection = RtcPeerConnection::new_with_configuration(&rtc_config)?;
        
        Ok(WebRtcConnection {
            peer_connection,
            local_peer_id: PeerId(local_peer_id),
            remote_peer_id: PeerId(remote_peer_id),
            ice_candidate_callback: None,
            data_channel: None,
            data_channel_open_callback: None,
            data_channel_message_callback: None,
            data_channel_close_callback: None,
            using_relay: false,
            relay_peer_id: None,
        })
    }
    
    /// Create a new WebRTC connection with relay
    #[wasm_bindgen]
    pub fn new_with_relay(local_peer_id: String, remote_peer_id: String, relay_peer_id: String) -> Result<WebRtcConnection, JsValue> {
        // Create RTCPeerConnection
        let rtc_config = web_sys::RtcConfiguration::new();
        let ice_server = web_sys::RtcIceServer::new();
        ice_server.urls(&JsValue::from_str("stun:stun.l.google.com:19302"));
        let ice_servers = js_sys::Array::new();
        ice_servers.push(&ice_server);
        rtc_config.ice_servers(&ice_servers);
        
        let peer_connection = RtcPeerConnection::new_with_configuration(&rtc_config)?;
        
        Ok(WebRtcConnection {
            peer_connection,
            local_peer_id: PeerId(local_peer_id),
            remote_peer_id: PeerId(remote_peer_id),
            ice_candidate_callback: None,
            data_channel: None,
            data_channel_open_callback: None,
            data_channel_message_callback: None,
            data_channel_close_callback: None,
            using_relay: true,
            relay_peer_id: Some(PeerId(relay_peer_id)),
        })
    }

    /// Set ICE candidate callback
    #[wasm_bindgen]
    pub fn on_ice_candidate(&mut self, callback: js_sys::Function) {
        self.ice_candidate_callback = Some(callback);
        
        let callback = self.ice_candidate_callback.clone();
        let peer_connection_clone = self.peer_connection.clone();
        
        let onicecandidate_callback = Closure::wrap(Box::new(move |event: web_sys::RtcPeerConnectionIceEvent| {
            if let Some(candidate) = event.candidate() {
                if let Some(callback) = &callback {
                    let js_candidate = JsIceCandidate::from_rtc_ice_candidate(&candidate);
                    let _ = callback.call1(&JsValue::NULL, &JsValue::from(js_candidate));
                }
            }
        }) as Box<dyn FnMut(web_sys::RtcPeerConnectionIceEvent)>);
        
        self.peer_connection.set_onicecandidate(Some(onicecandidate_callback.as_ref().unchecked_ref()));
        onicecandidate_callback.forget();
    }

    /// Create offer
    #[wasm_bindgen]
    pub fn create_offer(&self) -> js_sys::Promise {
        let peer_connection = self.peer_connection.clone();
        
        future_to_promise(async move {
            let offer = JsFuture::from(peer_connection.create_offer()).await?;
            let offer_sdp = JsFuture::from(peer_connection.set_local_description(&offer)).await?;
            
            let js_offer = JsSessionDescription::from_rtc_session_description(
                &peer_connection.local_description().unwrap()
            );
            
            Ok(JsValue::from(js_offer))
        })
    }

    /// Create answer
    #[wasm_bindgen]
    pub fn create_answer(&self) -> js_sys::Promise {
        let peer_connection = self.peer_connection.clone();
        
        future_to_promise(async move {
            let answer = JsFuture::from(peer_connection.create_answer()).await?;
            let answer_sdp = JsFuture::from(peer_connection.set_local_description(&answer)).await?;
            
            let js_answer = JsSessionDescription::from_rtc_session_description(
                &peer_connection.local_description().unwrap()
            );
            
            Ok(JsValue::from(js_answer))
        })
    }

    /// Set remote description
    #[wasm_bindgen]
    pub fn set_remote_description(&self, description: JsSessionDescription) -> js_sys::Promise {
        let peer_connection = self.peer_connection.clone();
        let rtc_description = description.to_rtc_session_description().unwrap();
        
        future_to_promise(async move {
            JsFuture::from(peer_connection.set_remote_description(&rtc_description)).await?;
            Ok(JsValue::undefined())
        })
    }

    /// Add ICE candidate
    #[wasm_bindgen]
    pub fn add_ice_candidate(&self, candidate: JsIceCandidate) -> js_sys::Promise {
        let peer_connection = self.peer_connection.clone();
        let rtc_candidate = candidate.to_rtc_ice_candidate().unwrap();
        
        future_to_promise(async move {
            JsFuture::from(peer_connection.add_ice_candidate_with_rtc_ice_candidate(&rtc_candidate)).await?;
            Ok(JsValue::undefined())
        })
    }

    /// Get local peer ID
    #[wasm_bindgen]
    pub fn local_peer_id(&self) -> String {
        self.local_peer_id.0.clone()
    }

    /// Get remote peer ID
    #[wasm_bindgen]
    pub fn remote_peer_id(&self) -> String {
        self.remote_peer_id.0.clone()
    }
    
    /// Create a data channel
    #[wasm_bindgen]
    pub fn create_data_channel(&mut self, label: &str) -> Result<(), JsValue> {
        // Create the data channel
        let data_channel = self.peer_connection.create_data_channel(label);
        
        // Set up event handlers
        let open_callback = self.data_channel_open_callback.clone();
        let message_callback = self.data_channel_message_callback.clone();
        let close_callback = self.data_channel_close_callback.clone();
        
        // Set up onopen handler
        let onopen_callback = Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(callback) = &open_callback {
                let _ = callback.call0(&JsValue::NULL);
            }
        }) as Box<dyn FnMut(web_sys::Event)>);
        
        data_channel.set_onopen(Some(onopen_callback.as_ref().unchecked_ref()));
        onopen_callback.forget();
        
        // Set up onmessage handler
        let onmessage_callback = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
            if let Some(callback) = &message_callback {
                let _ = callback.call1(&JsValue::NULL, &event.data());
            }
        }) as Box<dyn FnMut(web_sys::MessageEvent)>);
        
        data_channel.set_onmessage(Some(onmessage_callback.as_ref().unchecked_ref()));
        onmessage_callback.forget();
        
        // Set up onclose handler
        let onclose_callback = Closure::wrap(Box::new(move |_event: web_sys::Event| {
            if let Some(callback) = &close_callback {
                let _ = callback.call0(&JsValue::NULL);
            }
        }) as Box<dyn FnMut(web_sys::Event)>);
        
        data_channel.set_onclose(Some(onclose_callback.as_ref().unchecked_ref()));
        onclose_callback.forget();
        
        // Store the data channel
        self.data_channel = Some(data_channel);
        
        Ok(())
    }
    
    /// Send a message over the data channel
    #[wasm_bindgen]
    pub fn send_message(&self, message: &[u8]) -> Result<(), JsValue> {
        if let Some(data_channel) = &self.data_channel {
            // Create an ArrayBuffer from the message
            let array = js_sys::Uint8Array::new_with_length(message.len() as u32);
            array.copy_from(message);
            
            // Send the message
            data_channel.send_with_array_buffer(&array.buffer())?;
            
            Ok(())
        } else {
            Err(JsValue::from_str("Data channel not created"))
        }
    }
    
    /// Set data channel open callback
    #[wasm_bindgen]
    pub fn on_data_channel_open(&mut self, callback: js_sys::Function) {
        self.data_channel_open_callback = Some(callback);
    }
    
    /// Set data channel message callback
    #[wasm_bindgen]
    pub fn on_data_channel_message(&mut self, callback: js_sys::Function) {
        self.data_channel_message_callback = Some(callback);
    }
    
    /// Set data channel close callback
    #[wasm_bindgen]
    pub fn on_data_channel_close(&mut self, callback: js_sys::Function) {
        self.data_channel_close_callback = Some(callback);
    }
    
    /// Close the data channel
    #[wasm_bindgen]
    pub fn close_data_channel(&mut self) -> Result<(), JsValue> {
        if let Some(data_channel) = &self.data_channel {
            data_channel.close();
            self.data_channel = None;
            Ok(())
        } else {
            Err(JsValue::from_str("Data channel not created"))
        }
    }
    
    /// Check if the connection is using a relay
    #[wasm_bindgen]
    pub fn is_using_relay(&self) -> bool {
        self.using_relay
    }
    
    /// Get the relay peer ID
    #[wasm_bindgen]
    pub fn relay_peer_id(&self) -> Option<String> {
        self.relay_peer_id.as_ref().map(|id| id.0.clone())
    }
}

use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;