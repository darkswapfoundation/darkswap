//! WebRTC methods for DarkSwapWasm
//!
//! This module provides WebRTC-specific methods for the DarkSwapWasm struct.

#![cfg(all(feature = "wasm", feature = "webrtc"))]

use crate::error::Error;
use crate::types::PeerId;
use crate::wasm::DarkSwapWasm;
use crate::wasm_webrtc::{JsSessionDescription, JsIceCandidate, WebRtcConnection};
use crate::webrtc_signaling::{SignalingEvent};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{future_to_promise, JsFuture};
use web_sys::console;

#[wasm_bindgen]
impl DarkSwapWasm {
    /// Create a WebRTC connection
    #[wasm_bindgen]
    pub fn create_webrtc_connection(&mut self, remote_peer_id: &str) -> Result<WebRtcConnection, JsValue> {
        let local_peer_id = self.local_peer_id();
        let connection = WebRtcConnection::new(local_peer_id, remote_peer_id.to_string())?;
        
        // Store the connection
        self.webrtc_connections.insert(remote_peer_id.to_string(), connection.clone());
        
        Ok(connection)
    }

    /// Set WebRTC offer callback
    #[wasm_bindgen]
    pub fn on_webrtc_offer(&mut self, callback: js_sys::Function) {
        self.webrtc_offer_callback = Some(callback);
        
        // Start listening for WebRTC events
        self.start_webrtc_event_listener();
    }

    /// Set WebRTC answer callback
    #[wasm_bindgen]
    pub fn on_webrtc_answer(&mut self, callback: js_sys::Function) {
        self.webrtc_answer_callback = Some(callback);
        
        // Start listening for WebRTC events
        self.start_webrtc_event_listener();
    }

    /// Set WebRTC ICE candidate callback
    #[wasm_bindgen]
    pub fn on_webrtc_ice_candidate(&mut self, callback: js_sys::Function) {
        self.webrtc_ice_candidate_callback = Some(callback);
        
        // Start listening for WebRTC events
        self.start_webrtc_event_listener();
    }

    /// Send WebRTC offer
    #[wasm_bindgen]
    pub fn send_webrtc_offer(&self, peer_id: &str, offer: JsSessionDescription) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let peer_id_obj = PeerId(peer_id.to_string());
        let offer_obj = offer.to_internal();
        
        future_to_promise(async move {
            darkswap.network().send_webrtc_offer(&peer_id_obj, &offer_obj).await
                .map_err(|e| JsValue::from_str(&format!("Failed to send WebRTC offer: {}", e)))?;
            
            Ok(JsValue::undefined())
        })
    }

    /// Send WebRTC answer
    #[wasm_bindgen]
    pub fn send_webrtc_answer(&self, peer_id: &str, answer: JsSessionDescription) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let peer_id_obj = PeerId(peer_id.to_string());
        let answer_obj = answer.to_internal();
        
        future_to_promise(async move {
            darkswap.network().send_webrtc_answer(&peer_id_obj, &answer_obj).await
                .map_err(|e| JsValue::from_str(&format!("Failed to send WebRTC answer: {}", e)))?;
            
            Ok(JsValue::undefined())
        })
    }

    /// Send WebRTC ICE candidate
    #[wasm_bindgen]
    pub fn send_webrtc_ice_candidate(&self, peer_id: &str, candidate: JsIceCandidate) -> js_sys::Promise {
        let darkswap = self.darkswap.clone();
        let peer_id_obj = PeerId(peer_id.to_string());
        let candidate_obj = candidate.to_internal();
        
        future_to_promise(async move {
            darkswap.network().send_webrtc_ice_candidate(&peer_id_obj, &candidate_obj).await
                .map_err(|e| JsValue::from_str(&format!("Failed to send WebRTC ICE candidate: {}", e)))?;
            
            Ok(JsValue::undefined())
        })
    }

    /// Start WebRTC event listener
    fn start_webrtc_event_listener(&self) {
        // Clone what we need for the event loop
        let darkswap = self.darkswap.clone();
        let offer_callback = self.webrtc_offer_callback.clone();
        let answer_callback = self.webrtc_answer_callback.clone();
        let ice_candidate_callback = self.webrtc_ice_candidate_callback.clone();
        
        // Start the event loop
        wasm_bindgen_futures::spawn_local(async move {
            // Create a mutable network instance
            let mut network = darkswap.network();
            
            loop {
                // Wait for a WebRTC event
                match network.receive_webrtc_event().await {
                    Ok(event) => {
                        match event {
                            SignalingEvent::OfferReceived { from, offer } => {
                                if let Some(callback) = &offer_callback {
                                    let js_offer = JsSessionDescription::from_internal(&offer);
                                    let _ = callback.call2(
                                        &JsValue::NULL,
                                        &JsValue::from_str(&from.0),
                                        &JsValue::from(js_offer),
                                    );
                                }
                            },
                            SignalingEvent::AnswerReceived { from, answer } => {
                                if let Some(callback) = &answer_callback {
                                    let js_answer = JsSessionDescription::from_internal(&answer);
                                    let _ = callback.call2(
                                        &JsValue::NULL,
                                        &JsValue::from_str(&from.0),
                                        &JsValue::from(js_answer),
                                    );
                                }
                            },
                            SignalingEvent::IceCandidateReceived { from, candidate } => {
                                if let Some(callback) = &ice_candidate_callback {
                                    let js_candidate = JsIceCandidate::from_internal(&candidate);
                                    let _ = callback.call2(
                                        &JsValue::NULL,
                                        &JsValue::from_str(&from.0),
                                        &JsValue::from(js_candidate),
                                    );
                                }
                            },
                        }
                    },
                    Err(_) => {
                        // Wait a bit before trying again
                        wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
                            web_sys::window()
                                .unwrap()
                                .set_timeout_with_callback_and_timeout_and_arguments_0(
                                    &resolve,
                                    1000,
                                )
                                .unwrap();
                        }))
                        .await
                        .unwrap();
                    },
                }
            }
        });
    }
}