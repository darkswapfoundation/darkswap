//! WebAssembly bindings for the DarkSwap wallet functionality
//!
//! This module provides WebAssembly bindings for the DarkSwap wallet functionality.

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::{Array, Object, Promise, Reflect};
use web_sys::{console, window};
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use darkswap_sdk::wallet::{Wallet as SdkWallet, WalletConfig};
use bitcoin::{Address, Network, Transaction};
use bitcoin::psbt::PartiallySignedTransaction as Psbt;

use crate::{to_js_error, from_js_value, to_js_value};

// Global wallet instance
static WALLET: Mutex<Option<Arc<Mutex<SdkWallet>>>> = Mutex::new(None);

/// Initialize the wallet module
pub async fn initialize() -> Result<(), JsValue> {
    log::info!("Initializing wallet module");
    
    // Initialize the wallet with default configuration
    let config = WalletConfig::default();
    let wallet = SdkWallet::new(config).map_err(to_js_error)?;
    
    // Store the wallet instance
    let mut global_wallet = WALLET.lock().unwrap();
    *global_wallet = Some(Arc::new(Mutex::new(wallet)));
    
    log::info!("Wallet module initialized successfully");
    Ok(())
}

/// Check if the wallet module is initialized
pub fn is_initialized() -> bool {
    WALLET.lock().unwrap().is_some()
}

/// Get the wallet instance
fn get_wallet() -> Result<Arc<Mutex<SdkWallet>>, JsValue> {
    WALLET.lock().unwrap()
        .clone()
        .ok_or_else(|| JsValue::from_str("Wallet not initialized"))
}

/// Wallet balance information
#[derive(Serialize, Deserialize)]
pub struct Balance {
    pub btc: String,
    pub runes: Vec<RuneBalance>,
    pub alkanes: Vec<AlkaneBalance>,
}

/// Rune balance information
#[derive(Serialize, Deserialize)]
pub struct RuneBalance {
    pub id: String,
    pub ticker: String,
    pub amount: String,
}

/// Alkane balance information
#[derive(Serialize, Deserialize)]
pub struct AlkaneBalance {
    pub id: String,
    pub ticker: String,
    pub amount: String,
}

/// Transaction input
#[derive(Serialize, Deserialize)]
pub struct TxInput {
    pub txid: String,
    pub vout: u32,
    pub value: u64,
    pub address: Option<String>,
    pub script_pubkey: Option<String>,
}

/// Transaction output
#[derive(Serialize, Deserialize)]
pub struct TxOutput {
    pub address: String,
    pub value: u64,
    pub script: Option<String>,
}

/// Wallet class for JavaScript
#[wasm_bindgen]
pub struct Wallet {
    inner: Arc<Mutex<SdkWallet>>,
}

#[wasm_bindgen]
impl Wallet {
    /// Create a new wallet instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Wallet, JsValue> {
        let inner = get_wallet()?;
        Ok(Wallet { inner })
    }
    
    /// Connect to the wallet
    #[wasm_bindgen]
    pub fn connect(&self) -> Promise {
        let wallet = self.inner.clone();
        
        future_to_promise(async move {
            let mut wallet = wallet.lock().unwrap();
            wallet.connect().await.map_err(to_js_error)?;
            Ok(JsValue::from_bool(true))
        })
    }
    
    /// Disconnect from the wallet
    #[wasm_bindgen]
    pub fn disconnect(&self) {
        let wallet = self.inner.lock().unwrap();
        wallet.disconnect();
    }
    
    /// Check if the wallet is connected
    #[wasm_bindgen]
    pub fn is_connected(&self) -> bool {
        let wallet = self.inner.lock().unwrap();
        wallet.is_connected()
    }
    
    /// Get the wallet address
    #[wasm_bindgen]
    pub fn get_address(&self) -> String {
        let wallet = self.inner.lock().unwrap();
        wallet.get_address().to_string()
    }
    
    /// Get the wallet balance
    #[wasm_bindgen]
    pub fn get_balance(&self) -> Promise {
        let wallet = self.inner.clone();
        
        future_to_promise(async move {
            let wallet = wallet.lock().unwrap();
            
            // Get BTC balance
            let btc_balance = wallet.get_btc_balance().await.map_err(to_js_error)?;
            
            // Get rune balances
            let rune_balances = wallet.get_rune_balances().await.map_err(to_js_error)?;
            let runes = rune_balances.iter().map(|(id, balance)| {
                RuneBalance {
                    id: id.to_string(),
                    ticker: balance.ticker.clone(),
                    amount: balance.amount.to_string(),
                }
            }).collect::<Vec<_>>();
            
            // Get alkane balances
            let alkane_balances = wallet.get_alkane_balances().await.map_err(to_js_error)?;
            let alkanes = alkane_balances.iter().map(|(id, balance)| {
                AlkaneBalance {
                    id: id.to_string(),
                    ticker: balance.ticker.clone(),
                    amount: balance.amount.to_string(),
                }
            }).collect::<Vec<_>>();
            
            // Create balance object
            let balance = Balance {
                btc: btc_balance.to_string(),
                runes,
                alkanes,
            };
            
            to_js_value(&balance)
        })
    }
    
    /// Sign a message
    #[wasm_bindgen]
    pub fn sign_message(&self, message: &str) -> Promise {
        let wallet = self.inner.clone();
        let message = message.to_string();
        
        future_to_promise(async move {
            let wallet = wallet.lock().unwrap();
            let signature = wallet.sign_message(&message).await.map_err(to_js_error)?;
            Ok(JsValue::from_str(&signature))
        })
    }
    
    /// Sign a transaction
    #[wasm_bindgen]
    pub fn sign_transaction(&self, tx_hex: &str) -> Promise {
        let wallet = self.inner.clone();
        let tx_hex = tx_hex.to_string();
        
        future_to_promise(async move {
            let wallet = wallet.lock().unwrap();
            
            // Parse transaction hex
            let tx = Transaction::from_hex(&tx_hex).map_err(to_js_error)?;
            
            // Sign transaction
            let signed_tx = wallet.sign_transaction(tx).await.map_err(to_js_error)?;
            
            // Convert to hex
            let signed_tx_hex = signed_tx.to_hex();
            
            Ok(JsValue::from_str(&signed_tx_hex))
        })
    }
    
    /// Create a PSBT
    #[wasm_bindgen]
    pub fn create_psbt(&self, inputs: JsValue, outputs: JsValue) -> Promise {
        let wallet = self.inner.clone();
        
        future_to_promise(async move {
            // Parse inputs
            let inputs: Vec<TxInput> = from_js_value(&inputs)?;
            
            // Parse outputs
            let outputs: Vec<TxOutput> = from_js_value(&outputs)?;
            
            // Convert inputs to SDK format
            let sdk_inputs = inputs.iter().map(|input| {
                darkswap_sdk::wallet::TxInput {
                    txid: input.txid.clone(),
                    vout: input.vout,
                    value: input.value,
                    address: input.address.clone(),
                    script_pubkey: input.script_pubkey.clone(),
                }
            }).collect::<Vec<_>>();
            
            // Convert outputs to SDK format
            let sdk_outputs = outputs.iter().map(|output| {
                darkswap_sdk::wallet::TxOutput {
                    address: output.address.clone(),
                    value: output.value,
                    script: output.script.clone(),
                }
            }).collect::<Vec<_>>();
            
            // Create PSBT
            let wallet = wallet.lock().unwrap();
            let psbt = wallet.create_psbt(&sdk_inputs, &sdk_outputs).await.map_err(to_js_error)?;
            
            // Convert to base64
            let psbt_base64 = psbt.to_string();
            
            Ok(JsValue::from_str(&psbt_base64))
        })
    }
    
    /// Sign a PSBT
    #[wasm_bindgen]
    pub fn sign_psbt(&self, psbt_base64: &str) -> Promise {
        let wallet = self.inner.clone();
        let psbt_base64 = psbt_base64.to_string();
        
        future_to_promise(async move {
            // Parse PSBT
            let psbt = Psbt::from_str(&psbt_base64).map_err(to_js_error)?;
            
            // Sign PSBT
            let wallet = wallet.lock().unwrap();
            let signed_psbt = wallet.sign_psbt(psbt).await.map_err(to_js_error)?;
            
            // Convert to base64
            let signed_psbt_base64 = signed_psbt.to_string();
            
            Ok(JsValue::from_str(&signed_psbt_base64))
        })
    }
    
    /// Finalize a PSBT
    #[wasm_bindgen]
    pub fn finalize_psbt(&self, psbt_base64: &str) -> Promise {
        let wallet = self.inner.clone();
        let psbt_base64 = psbt_base64.to_string();
        
        future_to_promise(async move {
            // Parse PSBT
            let psbt = Psbt::from_str(&psbt_base64).map_err(to_js_error)?;
            
            // Finalize PSBT
            let wallet = wallet.lock().unwrap();
            let finalized_psbt = wallet.finalize_psbt(psbt).await.map_err(to_js_error)?;
            
            // Convert to base64
            let finalized_psbt_base64 = finalized_psbt.to_string();
            
            Ok(JsValue::from_str(&finalized_psbt_base64))
        })
    }
    
    /// Extract transaction from a PSBT
    #[wasm_bindgen]
    pub fn extract_tx(&self, psbt_base64: &str) -> Promise {
        let wallet = self.inner.clone();
        let psbt_base64 = psbt_base64.to_string();
        
        future_to_promise(async move {
            // Parse PSBT
            let psbt = Psbt::from_str(&psbt_base64).map_err(to_js_error)?;
            
            // Extract transaction
            let wallet = wallet.lock().unwrap();
            let tx = wallet.extract_tx(psbt).await.map_err(to_js_error)?;
            
            // Convert to hex
            let tx_hex = tx.to_hex();
            
            Ok(JsValue::from_str(&tx_hex))
        })
    }
    
    /// Broadcast a transaction
    #[wasm_bindgen]
    pub fn broadcast_tx(&self, tx_hex: &str) -> Promise {
        let wallet = self.inner.clone();
        let tx_hex = tx_hex.to_string();
        
        future_to_promise(async move {
            // Parse transaction hex
            let tx = Transaction::from_hex(&tx_hex).map_err(to_js_error)?;
            
            // Broadcast transaction
            let wallet = wallet.lock().unwrap();
            let txid = wallet.broadcast_tx(tx).await.map_err(to_js_error)?;
            
            Ok(JsValue::from_str(&txid.to_string()))
        })
    }
}
