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
        AssetType,
    },
    wallet::Wallet,
    Result,
};
use bitcoin::{
    psbt::Psbt,
    Address, Network, OutPoint, Script, Transaction, TxIn, TxOut, Txid,
};
use std::{collections::HashMap, sync::Arc};

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
        psbt_handler: &PsbtHandlerWasm,
        rune_handler: &RuneHandlerWasm,
        alkane_handler: &AlkaneHandlerWasm,
        local_peer_id: &str,
    ) -> Self {
        let trade_protocol = TradeProtocol::new(
            psbt_handler.inner.clone(),
            rune_handler.inner.clone(),
            alkane_handler.inner.clone(),
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
            expiration_seconds,
        ).await.map_err(|e| JsValue::from_str(&format!("Failed to create trade offer: {}", e)))?;
        
        // Convert the offer to JSON
        let offer_json = serde_json::to_string(&offer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?;
        
        Ok(offer_json)
    }
    
    /// Accept a trade offer
    #[wasm_bindgen]
    pub async fn accept_offer(&self, offer_id: &str) -> Result<(), JsValue> {
        self.inner.accept_offer(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to accept trade offer: {}", e)))
    }
    
    /// Create maker PSBT
    #[wasm_bindgen]
    pub async fn create_maker_psbt(&self, offer_id: &str) -> Result<String, JsValue> {
        let psbt = self.inner.create_maker_psbt(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create maker PSBT: {}", e)))?;
        
        // Convert the PSBT to base64
        let psbt_base64 = base64::encode(&psbt.serialize());
        
        Ok(psbt_base64)
    }
    
    /// Create taker PSBT
    #[wasm_bindgen]
    pub async fn create_taker_psbt(&self, offer_id: &str) -> Result<String, JsValue> {
        let psbt = self.inner.create_taker_psbt(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create taker PSBT: {}", e)))?;
        
        // Convert the PSBT to base64
        let psbt_base64 = base64::encode(&psbt.serialize());
        
        Ok(psbt_base64)
    }
    
    /// Sign PSBTs
    #[wasm_bindgen]
    pub async fn sign_psbts(&self, offer_id: &str) -> Result<JsValue, JsValue> {
        let (maker_psbt, taker_psbt) = self.inner.sign_psbts(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to sign PSBTs: {}", e)))?;
        
        // Convert the PSBTs to base64
        let maker_psbt_base64 = base64::encode(&maker_psbt.serialize());
        let taker_psbt_base64 = base64::encode(&taker_psbt.serialize());
        
        // Create a JavaScript object with the PSBTs
        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &JsValue::from_str("makerPsbt"), &JsValue::from_str(&maker_psbt_base64))
            .map_err(|_| JsValue::from_str("Failed to set makerPsbt"))?;
        js_sys::Reflect::set(&obj, &JsValue::from_str("takerPsbt"), &JsValue::from_str(&taker_psbt_base64))
            .map_err(|_| JsValue::from_str("Failed to set takerPsbt"))?;
        
        Ok(obj.into())
    }
    
    /// Finalize and broadcast PSBTs
    #[wasm_bindgen]
    pub async fn finalize_and_broadcast(&self, offer_id: &str) -> Result<JsValue, JsValue> {
        let (maker_txid, taker_txid) = self.inner.finalize_and_broadcast(offer_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to finalize and broadcast PSBTs: {}", e)))?;
        
        // Create a JavaScript object with the transaction IDs
        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &JsValue::from_str("makerTxid"), &JsValue::from_str(&maker_txid.to_string()))
            .map_err(|_| JsValue::from_str("Failed to set makerTxid"))?;
        js_sys::Reflect::set(&obj, &JsValue::from_str("takerTxid"), &JsValue::from_str(&taker_txid.to_string()))
            .map_err(|_| JsValue::from_str("Failed to set takerTxid"))?;
        
        Ok(obj.into())
    }
    
    /// Get the trade state
    #[wasm_bindgen]
    pub fn get_trade_state(&self, offer_id: &str) -> Result<String, JsValue> {
        self.inner.get_trade_state(offer_id)
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade state: {}", e)))
    }
    
    /// Get the trade offer
    #[wasm_bindgen]
    pub fn get_trade_offer(&self, offer_id: &str) -> Result<String, JsValue> {
        let offer = self.inner.get_trade_offer(offer_id)
            .map_err(|e| JsValue::from_str(&format!("Failed to get trade offer: {}", e)))?;
        
        // Convert the offer to JSON
        let offer_json = serde_json::to_string(&offer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?;
        
        Ok(offer_json)
    }
    
    /// Get all active trade offers
    #[wasm_bindgen]
    pub fn get_active_trade_offers(&self) -> Result<String, JsValue> {
        let offers = self.inner.get_active_trade_offers();
        
        // Convert the offers to JSON
        let offers_json = serde_json::to_string(&offers)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offers: {}", e)))?;
        
        Ok(offers_json)
    }
}

/// WebAssembly bindings for the PSBT handler
#[wasm_bindgen]
pub struct PsbtHandlerWasm {
    /// Inner PSBT handler
    inner: Arc<PsbtHandler>,
}

#[wasm_bindgen]
impl PsbtHandlerWasm {
    /// Create a new PSBT handler
    #[wasm_bindgen(constructor)]
    pub fn new(wallet: &WalletWasm) -> Self {
        let psbt_handler = PsbtHandler::new(wallet.inner.clone());
        
        Self {
            inner: Arc::new(psbt_handler),
        }
    }
    
    /// Create a PSBT for a trade
    #[wasm_bindgen]
    pub async fn create_trade_psbt(
        &self,
        outputs_json: &str,
        fee_rate: f64,
    ) -> Result<String, JsValue> {
        // Parse the outputs
        let outputs: Vec<TxOut> = serde_json::from_str(outputs_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse outputs: {}", e)))?;
        
        // Create the PSBT
        let psbt = self.inner.create_trade_psbt(outputs, fee_rate)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create trade PSBT: {}", e)))?;
        
        // Convert the PSBT to base64
        let psbt_base64 = base64::encode(&psbt.serialize());
        
        Ok(psbt_base64)
    }
    
    /// Sign a PSBT
    #[wasm_bindgen]
    pub async fn sign_psbt(&self, psbt_base64: &str) -> Result<String, JsValue> {
        // Parse the PSBT
        let psbt_bytes = base64::decode(psbt_base64)
            .map_err(|e| JsValue::from_str(&format!("Failed to decode PSBT: {}", e)))?;
        
        let psbt = Psbt::deserialize(&psbt_bytes)
            .map_err(|e| JsValue::from_str(&format!("Failed to deserialize PSBT: {}", e)))?;
        
        // Sign the PSBT
        let signed_psbt = self.inner.sign_psbt(psbt)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to sign PSBT: {}", e)))?;
        
        // Convert the PSBT to base64
        let signed_psbt_base64 = base64::encode(&signed_psbt.serialize());
        
        Ok(signed_psbt_base64)
    }
    
    /// Finalize a PSBT
    #[wasm_bindgen]
    pub async fn finalize_psbt(&self, psbt_base64: &str) -> Result<String, JsValue> {
        // Parse the PSBT
        let psbt_bytes = base64::decode(psbt_base64)
            .map_err(|e| JsValue::from_str(&format!("Failed to decode PSBT: {}", e)))?;
        
        let psbt = Psbt::deserialize(&psbt_bytes)
            .map_err(|e| JsValue::from_str(&format!("Failed to deserialize PSBT: {}", e)))?;
        
        // Finalize the PSBT
        let tx = self.inner.finalize_psbt(psbt)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to finalize PSBT: {}", e)))?;
        
        // Convert the transaction to hex
        let tx_hex = hex::encode(tx.serialize());
        
        Ok(tx_hex)
    }
    
    /// Broadcast a transaction
    #[wasm_bindgen]
    pub async fn broadcast_transaction(&self, tx_hex: &str) -> Result<String, JsValue> {
        // Parse the transaction
        let tx_bytes = hex::decode(tx_hex)
            .map_err(|e| JsValue::from_str(&format!("Failed to decode transaction: {}", e)))?;
        
        let tx = Transaction::deserialize(&tx_bytes)
            .map_err(|e| JsValue::from_str(&format!("Failed to deserialize transaction: {}", e)))?;
        
        // Broadcast the transaction
        let txid = self.inner.broadcast_transaction(tx)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to broadcast transaction: {}", e)))?;
        
        Ok(txid.to_string())
    }
}

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
        let rune_handler = RuneHandler::new(wallet.inner.clone());
        
        Self {
            inner: Arc::new(rune_handler),
        }
    }
    
    /// Get the rune balance
    #[wasm_bindgen]
    pub async fn balance(&self) -> Result<String, JsValue> {
        let balances = self.inner.balance()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get rune balance: {}", e)))?;
        
        // Convert the balances to JSON
        let balances_json = serde_json::to_string(&balances)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize balances: {}", e)))?;
        
        Ok(balances_json)
    }
    
    /// Get the balance of a specific rune
    #[wasm_bindgen]
    pub async fn balance_of(&self, rune_id: &str) -> Result<u64, JsValue> {
        self.inner.balance_of(rune_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get rune balance: {}", e)))
    }
    
    /// Create a PSBT for a rune transfer
    #[wasm_bindgen]
    pub async fn create_transfer_psbt(
        &self,
        rune_id: &str,
        amount: u64,
        recipient: &str,
        fee_rate: f64,
    ) -> Result<String, JsValue> {
        // Parse the recipient address
        let recipient_address = Address::from_str(recipient)
            .map_err(|e| JsValue::from_str(&format!("Invalid recipient address: {}", e)))?;
        
        // Create the PSBT
        let psbt = self.inner.create_transfer_psbt(rune_id, amount, recipient_address, fee_rate)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create rune transfer PSBT: {}", e)))?;
        
        // Convert the PSBT to base64
        let psbt_base64 = base64::encode(&psbt.serialize());
        
        Ok(psbt_base64)
    }
    
    /// Verify a rune transfer
    #[wasm_bindgen]
    pub async fn verify_transfer(
        &self,
        psbt_base64: &str,
        rune_id: &str,
        amount: u64,
    ) -> Result<(), JsValue> {
        // Parse the PSBT
        let psbt_bytes = base64::decode(psbt_base64)
            .map_err(|e| JsValue::from_str(&format!("Failed to decode PSBT: {}", e)))?;
        
        let psbt = Psbt::deserialize(&psbt_bytes)
            .map_err(|e| JsValue::from_str(&format!("Failed to deserialize PSBT: {}", e)))?;
        
        // Verify the transfer
        self.inner.verify_transfer(&psbt, rune_id, amount)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to verify rune transfer: {}", e)))
    }
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
        let alkane_handler = AlkaneHandler::new(wallet.inner.clone());
        
        Self {
            inner: Arc::new(alkane_handler),
        }
    }
    
    /// Get the alkane balance
    #[wasm_bindgen]
    pub async fn balance(&self) -> Result<String, JsValue> {
        let balances = self.inner.balance()
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get alkane balance: {}", e)))?;
        
        // Convert the balances to JSON
        let balances_json = serde_json::to_string(&balances)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize balances: {}", e)))?;
        
        Ok(balances_json)
    }
    
    /// Get the balance of a specific alkane
    #[wasm_bindgen]
    pub async fn balance_of(&self, alkane_id: &str) -> Result<u64, JsValue> {
        self.inner.balance_of(alkane_id)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to get alkane balance: {}", e)))
    }
    
    /// Create a PSBT for an alkane transfer
    #[wasm_bindgen]
    pub async fn create_transfer_psbt(
        &self,
        alkane_id: &str,
        amount: u64,
        recipient: &str,
        fee_rate: f64,
    ) -> Result<String, JsValue> {
        // Parse the recipient address
        let recipient_address = Address::from_str(recipient)
            .map_err(|e| JsValue::from_str(&format!("Invalid recipient address: {}", e)))?;
        
        // Create the PSBT
        let psbt = self.inner.create_transfer_psbt(alkane_id, amount, recipient_address, fee_rate)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to create alkane transfer PSBT: {}", e)))?;
        
        // Convert the PSBT to base64
        let psbt_base64 = base64::encode(&psbt.serialize());
        
        Ok(psbt_base64)
    }
    
    /// Verify an alkane transfer
    #[wasm_bindgen]
    pub async fn verify_transfer(
        &self,
        psbt_base64: &str,
        alkane_id: &str,
        amount: u64,
    ) -> Result<(), JsValue> {
        // Parse the PSBT
        let psbt_bytes = base64::decode(psbt_base64)
            .map_err(|e| JsValue::from_str(&format!("Failed to decode PSBT: {}", e)))?;
        
        let psbt = Psbt::deserialize(&psbt_bytes)
            .map_err(|e| JsValue::from_str(&format!("Failed to deserialize PSBT: {}", e)))?;
        
        // Verify the transfer
        self.inner.verify_transfer(&psbt, alkane_id, amount)
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to verify alkane transfer: {}", e)))
    }
}

/// WebAssembly bindings for the wallet
#[wasm_bindgen]
pub struct WalletWasm {
    /// Inner wallet
    inner: Arc<dyn Wallet + Send + Sync>,
}

/// Parse an asset type from strings
fn parse_asset_type(asset_type: &str, asset_id: &str) -> Result<AssetType> {
    match asset_type {
        "bitcoin" => Ok(AssetType::Bitcoin),
        "rune" => Ok(AssetType::Rune(asset_id.to_string())),
        "alkane" => Ok(AssetType::Alkane(asset_id.to_string())),
        _ => Err(Error::InvalidAssetType(asset_type.to_string())),
    }
}