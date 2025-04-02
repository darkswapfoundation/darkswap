//! WebAssembly bindings for the DarkSwap utility functions
//!
//! This module provides WebAssembly bindings for the DarkSwap utility functions.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Array, Object, Promise, Reflect};
use web_sys::{console, window};
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use darkswap_sdk::utils::{self, RuneInfo, AlkaneInfo};

use crate::{to_js_error, from_js_value, to_js_value};

/// Rune information
#[derive(Serialize, Deserialize)]
pub struct Rune {
    pub id: String,
    pub ticker: String,
    pub name: String,
    pub supply: String,
    pub decimals: u8,
    pub description: Option<String>,
    pub icon_url: Option<String>,
}

impl From<RuneInfo> for Rune {
    fn from(rune: RuneInfo) -> Self {
        Rune {
            id: rune.id.clone(),
            ticker: rune.ticker.clone(),
            name: rune.name.clone(),
            supply: rune.supply.to_string(),
            decimals: rune.decimals,
            description: rune.description,
            icon_url: rune.icon_url,
        }
    }
}

/// Alkane information
#[derive(Serialize, Deserialize)]
pub struct Alkane {
    pub id: String,
    pub ticker: String,
    pub name: String,
    pub supply: String,
    pub decimals: u8,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub predicate_type: Option<String>,
}

impl From<AlkaneInfo> for Alkane {
    fn from(alkane: AlkaneInfo) -> Self {
        Alkane {
            id: alkane.id.clone(),
            ticker: alkane.ticker.clone(),
            name: alkane.name.clone(),
            supply: alkane.supply.to_string(),
            decimals: alkane.decimals,
            description: alkane.description,
            icon_url: alkane.icon_url,
            predicate_type: alkane.predicate_type,
        }
    }
}

/// Market data
#[derive(Serialize, Deserialize)]
pub struct MarketData {
    pub base_asset: String,
    pub quote_asset: String,
    pub last_price: String,
    pub bid_price: String,
    pub ask_price: String,
    pub high_24h: String,
    pub low_24h: String,
    pub volume_24h: String,
    pub change_24h: String,
    pub change_percentage_24h: String,
}

/// Get information about a rune
#[wasm_bindgen]
pub fn get_rune_info(rune_id: &str) -> Promise {
    let rune_id = rune_id.to_string();
    
    future_to_promise(async move {
        // Get rune information
        let rune_info = utils::get_rune_info(&rune_id).await.map_err(to_js_error)?;
        
        // Convert to JavaScript rune
        let js_rune = Rune::from(rune_info);
        
        to_js_value(&js_rune)
    })
}

/// Get information about an alkane
#[wasm_bindgen]
pub fn get_alkane_info(alkane_id: &str) -> Promise {
    let alkane_id = alkane_id.to_string();
    
    future_to_promise(async move {
        // Get alkane information
        let alkane_info = utils::get_alkane_info(&alkane_id).await.map_err(to_js_error)?;
        
        // Convert to JavaScript alkane
        let js_alkane = Alkane::from(alkane_info);
        
        to_js_value(&js_alkane)
    })
}

/// Get market data for a trading pair
#[wasm_bindgen]
pub fn get_market_data(base_asset: &str, quote_asset: &str) -> Promise {
    let base_asset = base_asset.to_string();
    let quote_asset = quote_asset.to_string();
    
    future_to_promise(async move {
        // Get market data
        let market_data = utils::get_market_data(&base_asset, &quote_asset).await.map_err(to_js_error)?;
        
        // Convert to JavaScript market data
        let js_market_data = MarketData {
            base_asset: market_data.base_asset,
            quote_asset: market_data.quote_asset,
            last_price: market_data.last_price.to_string(),
            bid_price: market_data.bid_price.to_string(),
            ask_price: market_data.ask_price.to_string(),
            high_24h: market_data.high_24h.to_string(),
            low_24h: market_data.low_24h.to_string(),
            volume_24h: market_data.volume_24h.to_string(),
            change_24h: market_data.change_24h.to_string(),
            change_percentage_24h: market_data.change_percentage_24h.to_string(),
        };
        
        to_js_value(&js_market_data)
    })
}

/// Get all runes
#[wasm_bindgen]
pub fn get_all_runes() -> Promise {
    future_to_promise(async move {
        // Get all runes
        let runes = utils::get_all_runes().await.map_err(to_js_error)?;
        
        // Convert to JavaScript runes
        let js_runes = runes.into_iter()
            .map(|rune| Rune::from(rune))
            .collect::<Vec<_>>();
        
        to_js_value(&js_runes)
    })
}

/// Get all alkanes
#[wasm_bindgen]
pub fn get_all_alkanes() -> Promise {
    future_to_promise(async move {
        // Get all alkanes
        let alkanes = utils::get_all_alkanes().await.map_err(to_js_error)?;
        
        // Convert to JavaScript alkanes
        let js_alkanes = alkanes.into_iter()
            .map(|alkane| Alkane::from(alkane))
            .collect::<Vec<_>>();
        
        to_js_value(&js_alkanes)
    })
}

/// Get the current Bitcoin price in USD
#[wasm_bindgen]
pub fn get_bitcoin_price() -> Promise {
    future_to_promise(async move {
        // Get Bitcoin price
        let price = utils::get_bitcoin_price().await.map_err(to_js_error)?;
        
        Ok(JsValue::from_f64(price))
    })
}

/// Validate a Bitcoin address
#[wasm_bindgen]
pub fn validate_bitcoin_address(address: &str) -> bool {
    utils::validate_bitcoin_address(address)
}

/// Validate a rune ID
#[wasm_bindgen]
pub fn validate_rune_id(rune_id: &str) -> bool {
    utils::validate_rune_id(rune_id)
}

/// Validate an alkane ID
#[wasm_bindgen]
pub fn validate_alkane_id(alkane_id: &str) -> bool {
    utils::validate_alkane_id(alkane_id)
}

/// Format a Bitcoin amount with the appropriate number of decimal places
#[wasm_bindgen]
pub fn format_bitcoin_amount(amount: f64) -> String {
    utils::format_bitcoin_amount(amount)
}

/// Format a rune amount with the appropriate number of decimal places
#[wasm_bindgen]
pub fn format_rune_amount(amount: f64, decimals: u8) -> String {
    utils::format_rune_amount(amount, decimals)
}

/// Format an alkane amount with the appropriate number of decimal places
#[wasm_bindgen]
pub fn format_alkane_amount(amount: f64, decimals: u8) -> String {
    utils::format_alkane_amount(amount, decimals)
}

/// Parse a Bitcoin amount from a string
#[wasm_bindgen]
pub fn parse_bitcoin_amount(amount: &str) -> Result<f64, JsValue> {
    utils::parse_bitcoin_amount(amount).map_err(to_js_error)
}

/// Parse a rune amount from a string
#[wasm_bindgen]
pub fn parse_rune_amount(amount: &str) -> Result<f64, JsValue> {
    utils::parse_rune_amount(amount).map_err(to_js_error)
}

/// Parse an alkane amount from a string
#[wasm_bindgen]
pub fn parse_alkane_amount(amount: &str) -> Result<f64, JsValue> {
    utils::parse_alkane_amount(amount).map_err(to_js_error)
}