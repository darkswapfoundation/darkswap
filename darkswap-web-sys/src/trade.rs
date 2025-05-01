//! WebAssembly bindings for the trade module
//!
//! This module provides WebAssembly bindings for the trade module.

use wasm_bindgen::prelude::*;
use darkswap_sdk::{
    error::Error,
    trade::{
        alkane::AlkaneHandler,
        psbt::PsbtHandler,
        protocol::{TradeOffer, TradeProtocol},
        rune::RuneHandler,
    },
    types::{Asset, TradeId},
    wallet::Wallet,
    Result,
};
use bitcoin::{
    psbt::Psbt,
    Address, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid,
};
use std::{collections::HashMap, sync::Arc, str::FromStr};

/// WebAssembly bindings for the trade protocol
#[wasm_bindgen]
pub struct TradeProtocolWasm {
    /// Inner trade protocol
    inner: Arc<TradeProtocol>,
}

#[wasm_bindgen]
impl TradeProtocolWasm {
    /// Create a new trade protocol
    #[wasm_bindgen(constructor)]
    pub fn new(
        wallet: &WalletWasm, // Take WalletWasm instance
        local_peer_id: &str,
    ) -> Self {
        let trade_protocol = TradeProtocol::new(
            wallet.inner.clone(), // Pass the inner SdkWallet (trait object)
            local_peer_id.to_string(),
        );

        Self {
            inner: Arc::new(trade_protocol),
        }
    }

    /// Create a trade offer
    #[wasm_bindgen]
    pub async fn create_offer(
        &self,
        maker_asset_type: &str,
        maker_asset_id: &str,
        maker_amount: u64,
        taker_asset_type: &str,
        taker_asset_id: &str,
        taker_amount: u64,
        expiration_seconds: u64,
    ) -> Result<String, JsValue> {
        // Parse the asset types
        let maker_asset = parse_asset_type(maker_asset_type, maker_asset_id)
            .map_err(|e| JsValue::from_str(&format!("Invalid maker asset type: {}", e)))?;

        let taker_asset = parse_asset_type(taker_asset_type, taker_asset_id)
            .map_err(|e| JsValue::from_str(&format!("Invalid taker asset type: {}", e)))?;

        // Create the trade offer
        let offer = self.inner.create_offer(
            maker_asset,
            maker_amount,
            taker_asset,
            taker_amount,
            std::time::Duration::from_secs(expiration_seconds), // Convert u64 to Duration
        ).await.map_err(|e| JsValue::from_str(&format!("Failed to create trade offer: {}", e)))?;

        // Convert the offer to JSON
        let offer_json = serde_json::to_string(&offer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?;

        Ok(offer_json)
    }

    /// Accept a trade offer
    #[wasm_bindgen]
    pub async fn accept_offer(&self, offer_id: &str) -> Result<(), JsValue> {
        // Convert offer_id string to TradeId
        let offer_id = darkswap_sdk::types::TradeId(offer_id.to_string());
        self.inner.accept_offer(&offer_id) // Pass &TradeId
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to accept trade offer: {}", e)))
    }

    // Removed create_maker_psbt, create_taker_psbt, sign_psbts, finalize_and_broadcast as they are not in TradeProtocol

    /// Get the trade state
    #[wasm_bindgen]
    pub async fn get_trade_state(&self, offer_id: &str) -> Result<String, JsValue> {
        // Convert offer_id string to TradeId
        let offer_id = darkswap_sdk::types::TradeId(offer_id.to_string());
        let state = self.inner.get_trade(&offer_id) // Use get_trade instead of get_trade_state
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade state: {}", e)))?;

        // Convert the state to JSON
        let state_json = serde_json::to_string(&state)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize trade state: {}", e)))?;

        Ok(state_json)
    }

    /// Get the trade offer
    #[wasm_bindgen]
    pub async fn get_trade_offer(&self, offer_id: &str) -> Result<String, JsValue> {
        // Convert offer_id string to TradeId
        let offer_id = darkswap_sdk::types::TradeId(offer_id.to_string());
        let offer = self.inner.get_trade(&offer_id) // Use get_trade instead of get_trade_offer
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade offer: {}", e)))?;

        // Convert the offer to JSON
        let offer_json = serde_json::to_string(&offer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?;

        Ok(offer_json)
    }

    /// Get all active trade offers
    #[wasm_bindgen]
    pub async fn get_active_trade_offers(&self) -> Result<String, JsValue> {
        let offers = self.inner.get_trades_by_state("offer"); // Use get_trades_by_state("offer")

        // Convert the offers to JSON
        let offers_json = serde_json::to_string(&offers)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offers: {}", e)))?;

        Ok(offers_json)
    }
}

// Removed PsbtHandlerWasm as PsbtHandler does not implement Wallet trait

/// WebAssembly bindings for the rune handler
#[wasm_bindgen]
pub struct RuneHandlerWasm {
    /// Inner rune handler
    inner: Arc<RuneHandler>,
}

#[wasm_bindgen]
impl RuneHandlerWasm {
    /// Create a new rune handler
    #[wasm_bindgen(constructor)]
    pub fn new(wallet: &WalletWasm) -> Self {
        let rune_handler = RuneHandler::new(wallet.inner.clone(), bitcoin::Network::Regtest); // Assuming Regtest for wasm

        Self {
            inner: Arc::new(rune_handler),
        }
    }

    // Removed balance, balance_of, create_transfer_psbt, verify_transfer as they are not in AlkaneHandler
}

/// WebAssembly bindings for the alkane handler
#[wasm_bindgen]
pub struct AlkaneHandlerWasm {
    /// Inner alkane handler
    inner: Arc<AlkaneHandler>,
}

#[wasm_bindgen]
impl AlkaneHandlerWasm {
    /// Create a new alkane handler
    #[wasm_bindgen(constructor)]
    pub fn new(wallet: &WalletWasm) -> Self {
        let alkane_handler = AlkaneHandler::new(wallet.inner.clone(), bitcoin::Network::Regtest); // Assuming Regtest for wasm

        Self {
            inner: Arc::new(alkane_handler),
        }
    }

    // Removed balance, balance_of, create_transfer_psbt, verify_transfer as they are not in AlkaneHandler
}

/// WebAssembly bindings for the wallet
#[wasm_bindgen]
pub struct WalletWasm {
    /// Inner wallet
    inner: Arc<dyn Wallet + Send + Sync>,
}

/// Parse an asset from strings
fn parse_asset_type(asset_type: &str, asset_id: &str) -> Result<Asset> {
    match asset_type {
        "bitcoin" => Ok(Asset::Bitcoin),
        "rune" => Ok(Asset::Rune(asset_id.parse().map_err(|_| Error::Validation(format!("Invalid rune ID: {}", asset_id)))?)),
        "alkane" => Ok(Asset::Alkane(asset_id.parse().map_err(|_| Error::Validation(format!("Invalid alkane ID: {}", asset_id)))?)),
        _ => Err(Error::Validation(format!("Invalid asset type: {}", asset_type))),
    }
}