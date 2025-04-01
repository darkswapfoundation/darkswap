//! WebAssembly bindings for wallet functionality
//!
//! This module provides WebAssembly bindings for wallet functionality,
//! allowing it to be used in web browsers.

use wasm_bindgen::prelude::*;
use web_sys::console;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

#[cfg(feature = "bitcoin")]
use bitcoin::{Address, Network, PrivateKey, PublicKey, Script};
use rand::rngs::OsRng;
use std::collections::HashMap;

/// Wallet error
#[wasm_bindgen]
pub struct WalletError {
    message: String,
}

#[wasm_bindgen]
impl WalletError {
    /// Get error message
    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }
}

/// Asset type
#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum AssetType {
    Bitcoin,
    Rune,
    Alkane,
}

/// Asset
#[wasm_bindgen]
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Asset {
    asset_type: AssetType,
    id: Option<String>,
}

#[wasm_bindgen]
impl Asset {
    /// Create a new Bitcoin asset
    #[wasm_bindgen(constructor)]
    pub fn new(asset_type: AssetType, id: Option<String>) -> Self {
        Self { asset_type, id }
    }

    /// Create a new Bitcoin asset
    #[wasm_bindgen(js_name = "bitcoin")]
    pub fn bitcoin() -> Self {
        Self {
            asset_type: AssetType::Bitcoin,
            id: None,
        }
    }

    /// Create a new Rune asset
    #[wasm_bindgen(js_name = "rune")]
    pub fn rune(id: String) -> Self {
        Self {
            asset_type: AssetType::Rune,
            id: Some(id),
        }
    }

    /// Create a new Alkane asset
    #[wasm_bindgen(js_name = "alkane")]
    pub fn alkane(id: String) -> Self {
        Self {
            asset_type: AssetType::Alkane,
            id: Some(id),
        }
    }

    /// Get asset type
    #[wasm_bindgen(getter)]
    pub fn asset_type(&self) -> AssetType {
        self.asset_type.clone()
    }

    /// Get asset ID
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> Option<String> {
        self.id.clone()
    }
}

/// Wallet configuration
#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct WalletConfig {
    /// Network (mainnet, testnet, regtest, signet)
    network: String,
    /// Private key (WIF format)
    private_key: Option<String>,
    /// Mnemonic phrase
    mnemonic: Option<String>,
    /// Derivation path
    derivation_path: Option<String>,
}

#[wasm_bindgen]
impl WalletConfig {
    /// Create a new wallet configuration
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            network: "testnet".to_string(),
            private_key: None,
            mnemonic: None,
            derivation_path: None,
        }
    }

    /// Set network
    #[wasm_bindgen(setter)]
    pub fn set_network(&mut self, network: String) {
        self.network = network;
    }

    /// Get network
    #[wasm_bindgen(getter)]
    pub fn network(&self) -> String {
        self.network.clone()
    }

    /// Set private key
    #[wasm_bindgen(setter)]
    pub fn set_private_key(&mut self, private_key: Option<String>) {
        self.private_key = private_key;
    }

    /// Get private key
    #[wasm_bindgen(getter)]
    pub fn private_key(&self) -> Option<String> {
        self.private_key.clone()
    }

    /// Set mnemonic
    #[wasm_bindgen(setter)]
    pub fn set_mnemonic(&mut self, mnemonic: Option<String>) {
        self.mnemonic = mnemonic;
    }

    /// Get mnemonic
    #[wasm_bindgen(getter)]
    pub fn mnemonic(&self) -> Option<String> {
        self.mnemonic.clone()
    }

    /// Set derivation path
    #[wasm_bindgen(setter)]
    pub fn set_derivation_path(&mut self, derivation_path: Option<String>) {
        self.derivation_path = derivation_path;
    }

    /// Get derivation path
    #[wasm_bindgen(getter)]
    pub fn derivation_path(&self) -> Option<String> {
        self.derivation_path.clone()
    }
}

/// Simple wallet implementation for WebAssembly
#[wasm_bindgen]
pub struct Wallet {
    #[cfg(feature = "bitcoin")]
    private_key: PrivateKey,
    #[cfg(feature = "bitcoin")]
    public_key: PublicKey,
    #[cfg(feature = "bitcoin")]
    network: Network,
    balances: Arc<Mutex<HashMap<String, u64>>>,
}

#[cfg(feature = "bitcoin")]
#[wasm_bindgen]
impl Wallet {
    /// Create a new wallet
    #[wasm_bindgen(constructor)]
    pub fn new(config: WalletConfig) -> Result<Wallet, JsValue> {
        console::log_1(&JsValue::from_str("Creating new wallet..."));

        // Convert network string to bitcoin::Network
        let bitcoin_network = match config.network.as_str() {
            "mainnet" => Network::Bitcoin,
            "testnet" => Network::Testnet,
            "regtest" => Network::Regtest,
            "signet" => Network::Signet,
            _ => return Err(JsValue::from_str(&format!("Invalid network: {}", config.network))),
        };

        // Generate or use provided private key
        let private_key = if let Some(wif) = config.private_key {
            match PrivateKey::from_wif(&wif) {
                Ok(pk) => pk,
                Err(e) => return Err(JsValue::from_str(&format!("Invalid private key WIF format: {}", e))),
            }
        } else {
            let secp = bitcoin::secp256k1::Secp256k1::new();
            let (secret_key, _) = secp.generate_keypair(&mut OsRng);
            PrivateKey::new(secret_key, bitcoin_network)
        };

        // Derive public key
        let secp = bitcoin::secp256k1::Secp256k1::new();
        let public_key = PublicKey::from_private_key(&secp, &private_key);

        // Initialize balances
        let mut balances = HashMap::new();
        balances.insert("BTC".to_string(), 100_000_000); // 1 BTC
        balances.insert("RUNE:0x123".to_string(), 1000); // 1000 RUNE:0x123
        balances.insert("ALKANE:0x456".to_string(), 500); // 500 ALKANE:0x456

        console::log_1(&JsValue::from_str("Wallet created successfully"));

        Ok(Wallet {
            private_key,
            public_key,
            network: bitcoin_network,
            balances: Arc::new(Mutex::new(balances)),
        })
    }

    /// Get wallet address
    #[wasm_bindgen]
    pub fn get_address(&self) -> Result<String, JsValue> {
        // Create a P2WPKH address from the public key
        match Address::p2wpkh(&self.public_key, self.network) {
            Ok(address) => Ok(address.to_string()),
            Err(e) => Err(JsValue::from_str(&format!("Failed to create P2WPKH address: {}", e))),
        }
    }

    /// Get wallet balance
    #[wasm_bindgen]
    pub fn get_balance(&self) -> u64 {
        let balances = self.balances.lock().unwrap();
        *balances.get("BTC").unwrap_or(&0)
    }

    /// Get asset balance
    #[wasm_bindgen]
    pub fn get_asset_balance(&self, asset: &Asset) -> u64 {
        let balances = self.balances.lock().unwrap();
        let key = match asset.asset_type {
            AssetType::Bitcoin => "BTC".to_string(),
            AssetType::Rune => {
                if let Some(id) = &asset.id {
                    format!("RUNE:{}", id)
                } else {
                    return 0;
                }
            },
            AssetType::Alkane => {
                if let Some(id) = &asset.id {
                    format!("ALKANE:{}", id)
                } else {
                    return 0;
                }
            },
        };
        *balances.get(&key).unwrap_or(&0)
    }

    /// Create and sign a PSBT for an order
    #[wasm_bindgen]
    pub fn create_order_psbt(
        &self,
        order_id: String,
        base_asset: &Asset,
        quote_asset: &Asset,
        amount: u64,
        price: u64,
    ) -> Result<String, JsValue> {
        // Check if we have enough balance
        let balances = self.balances.lock().unwrap();
        let base_key = match base_asset.asset_type {
            AssetType::Bitcoin => "BTC".to_string(),
            AssetType::Rune => {
                if let Some(id) = &base_asset.id {
                    format!("RUNE:{}", id)
                } else {
                    return Err(JsValue::from_str("Rune asset must have an ID"));
                }
            },
            AssetType::Alkane => {
                if let Some(id) = &base_asset.id {
                    format!("ALKANE:{}", id)
                } else {
                    return Err(JsValue::from_str("Alkane asset must have an ID"));
                }
            },
        };
        let base_balance = *balances.get(&base_key).unwrap_or(&0);
        
        if base_balance < amount {
            return Err(JsValue::from_str("Insufficient funds"));
        }
        
        // In a real implementation, we would create a PSBT
        // For now, just return a dummy PSBT
        Ok("dummy_psbt_base64_string")
    }

    /// Sign a PSBT
    #[wasm_bindgen]
    pub fn sign_psbt(&self, psbt_base64: String) -> Result<String, JsValue> {
        // In a real implementation, we would sign the PSBT
        // For now, just return the same PSBT
        Ok(psbt_base64)
    }
    
    #[cfg(not(feature = "bitcoin"))]
    #[wasm_bindgen]
    impl Wallet {
        /// Create a new wallet
        #[wasm_bindgen(constructor)]
        pub fn new(_config: WalletConfig) -> Result<Wallet, JsValue> {
            console::log_1(&JsValue::from_str("Creating new wallet (mock)..."));
    
            // Initialize balances
            let mut balances = HashMap::new();
            balances.insert("BTC".to_string(), 100_000_000); // 1 BTC
            balances.insert("RUNE:0x123".to_string(), 1000); // 1000 RUNE:0x123
            balances.insert("ALKANE:0x456".to_string(), 500); // 500 ALKANE:0x456
    
            console::log_1(&JsValue::from_str("Wallet created successfully (mock)"));
    
            Ok(Wallet {
                balances: Arc::new(Mutex::new(balances)),
            })
        }
    
        /// Get wallet address
        #[wasm_bindgen]
        pub fn get_address(&self) -> Result<String, JsValue> {
            // Return a dummy address
            Ok("bc1qmock000000000000000000000000000000000000".to_string())
        }
    
        /// Get wallet balance
        #[wasm_bindgen]
        pub fn get_balance(&self) -> u64 {
            let balances = self.balances.lock().unwrap();
            *balances.get("BTC").unwrap_or(&0)
        }
    
        /// Get asset balance
        #[wasm_bindgen]
        pub fn get_asset_balance(&self, asset: &Asset) -> u64 {
            let balances = self.balances.lock().unwrap();
            let key = match asset.asset_type {
                AssetType::Bitcoin => "BTC".to_string(),
                AssetType::Rune => {
                    if let Some(id) = &asset.id {
                        format!("RUNE:{}", id)
                    } else {
                        return 0;
                    }
                },
                AssetType::Alkane => {
                    if let Some(id) = &asset.id {
                        format!("ALKANE:{}", id)
                    } else {
                        return 0;
                    }
                },
            };
            *balances.get(&key).unwrap_or(&0)
        }
    
        /// Create and sign a PSBT for an order
        #[wasm_bindgen]
        pub fn create_order_psbt(
            &self,
            _order_id: String,
            _base_asset: &Asset,
            _quote_asset: &Asset,
            _amount: u64,
            _price: u64,
        ) -> Result<String, JsValue> {
            // Return a dummy PSBT
            Ok("dummy_psbt_base64_string".to_string())
        }
    
        /// Sign a PSBT
        #[wasm_bindgen]
        pub fn sign_psbt(&self, psbt_base64: String) -> Result<String, JsValue> {
            // Return the same PSBT
            Ok(psbt_base64)
        }
    
        /// Finalize and broadcast a PSBT
        #[wasm_bindgen]
        pub fn finalize_and_broadcast_psbt(&self, _psbt_base64: String) -> Result<String, JsValue> {
            // Return a dummy txid
            Ok("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string())
        }
    
        /// Verify a PSBT
        #[wasm_bindgen]
        pub fn verify_psbt(&self, _psbt_base64: String) -> Result<bool, JsValue> {
            // Return true
            Ok(true)
        }
    }

    /// Finalize and broadcast a PSBT
    #[wasm_bindgen]
    pub fn finalize_and_broadcast_psbt(&self, psbt_base64: String) -> Result<String, JsValue> {
        // In a real implementation, we would finalize and broadcast the PSBT
        // For now, just return a dummy txid
        Ok("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string())
    }

    /// Verify a PSBT
    #[wasm_bindgen]
    pub fn verify_psbt(&self, psbt_base64: String) -> Result<bool, JsValue> {
        // In a real implementation, we would verify the PSBT
        // For now, just return true
        Ok(true)
    }
}
