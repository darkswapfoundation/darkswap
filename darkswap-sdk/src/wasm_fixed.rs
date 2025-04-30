//! WebAssembly bindings for DarkSwap SDK
//!
//! This module provides WebAssembly bindings for the DarkSwap SDK, allowing it to be used
//! in web applications.

#[cfg(feature = "wasm")]
mod wasm_impl {
    use std::str::FromStr;
    use std::sync::Arc;
    use std::time::Duration;

    use anyhow::{Context as AnyhowContext, Result};
    use js_sys::{Array, Function, Object, Promise, Reflect};
    use rust_decimal::Decimal;
    use serde::{Deserialize, Serialize};
    use wasm_bindgen::prelude::*;
    use wasm_bindgen::JsCast;
    use wasm_bindgen_futures::future_to_promise;
    use web_sys::{console, window};

    use crate::config::{BitcoinNetwork, Config};
    use crate::orderbook::{Order, OrderId, OrderSide, OrderStatus};
    use crate::trade::{Trade, TradeId};
    use crate::types::{Asset, AlkaneId, Event, SerializablePeerId};
    use crate::DarkSwap;

    /// JavaScript error
    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = console)]
        fn log(s: &str);

        #[wasm_bindgen(js_namespace = console, js_name = log)]
        fn log_obj(obj: &JsValue);
    }

    /// Asset type for JavaScript
    #[wasm_bindgen]
    pub enum JsAssetType {
        Bitcoin = 0,
        Rune = 1,
        Alkane = 2,
    }

    /// Order side for JavaScript
    #[wasm_bindgen]
    pub enum JsOrderSide {
        Buy = 0,
        Sell = 1,
    }

    /// Order status for JavaScript
    #[wasm_bindgen]
    pub enum JsOrderStatus {
        Open = 0,
        Filled = 1,
        Canceled = 2,
        Expired = 3,
    }

    /// Bitcoin network for JavaScript
    #[wasm_bindgen]
    pub enum JsBitcoinNetwork {
        Mainnet = 0,
        Testnet = 1,
        Regtest = 2,
        Signet = 3,
    }

    /// DarkSwap configuration for JavaScript
    #[wasm_bindgen]
    pub struct JsConfig {
        /// Bitcoin network
        pub network: JsBitcoinNetwork,
        /// Wallet type
        pub wallet_type: String,
        /// Private key
        pub private_key: Option<String>,
        /// Mnemonic
        pub mnemonic: Option<String>,
        /// Derivation path
        pub derivation_path: Option<String>,
        /// Enable WebRTC
        pub enable_webrtc: bool,
        /// WebRTC ICE servers
        pub ice_servers: Vec<String>,
        /// Signaling server URL
        pub signaling_server_url: Option<String>,
    }

    /// DarkSwap SDK for JavaScript
    #[wasm_bindgen]
    pub struct JsDarkSwap {
        /// Inner DarkSwap instance
        darkswap: Arc<tokio::sync::Mutex<DarkSwap>>,
        /// Event callback
        event_callback: Option<Function>,
    }

    /// Convert JsAssetType to Asset
    fn js_asset_type_to_asset(asset_type: JsAssetType, id: &str) -> Result<Asset> {
        match asset_type {
            JsAssetType::Bitcoin => Ok(Asset::Bitcoin),
            JsAssetType::Rune => {
                let rune_id = u128::from_str(id).context("Invalid rune ID")?;
                Ok(Asset::Rune(rune_id))
            }
            JsAssetType::Alkane => {
                let alkane_id = AlkaneId(id.to_string());
                Ok(Asset::Alkane(alkane_id))
            }
        }
    }

    /// Convert JsOrderSide to OrderSide
    fn js_order_side_to_order_side(side: JsOrderSide) -> OrderSide {
        match side {
            JsOrderSide::Buy => OrderSide::Buy,
            JsOrderSide::Sell => OrderSide::Sell,
        }
    }

    /// Convert OrderSide to JsOrderSide
    fn order_side_to_js_order_side(side: OrderSide) -> JsOrderSide {
        match side {
            OrderSide::Buy => JsOrderSide::Buy,
            OrderSide::Sell => JsOrderSide::Sell,
        }
    }

    /// Convert OrderStatus to JsOrderStatus
    fn order_status_to_js_order_status(status: OrderStatus) -> JsOrderStatus {
        match status {
            OrderStatus::Open => JsOrderStatus::Open,
            OrderStatus::Filled => JsOrderStatus::Filled,
            OrderStatus::Canceled => JsOrderStatus::Canceled,
            OrderStatus::Expired => JsOrderStatus::Expired,
        }
    }

    /// Convert JsBitcoinNetwork to BitcoinNetwork
    fn js_bitcoin_network_to_bitcoin_network(network: JsBitcoinNetwork) -> BitcoinNetwork {
        match network {
            JsBitcoinNetwork::Mainnet => BitcoinNetwork::Mainnet,
            JsBitcoinNetwork::Testnet => BitcoinNetwork::Testnet,
            JsBitcoinNetwork::Regtest => BitcoinNetwork::Regtest,
            JsBitcoinNetwork::Signet => BitcoinNetwork::Signet,
        }
    }

    /// Convert JsConfig to Config
    fn js_config_to_config(js_config: &JsConfig) -> Config {
        let mut config = Config::default();
        
        // Set Bitcoin network
        config.bitcoin.network = js_bitcoin_network_to_bitcoin_network(js_config.network);
        
        // Set wallet configuration
        config.wallet.wallet_type = js_config.wallet_type.clone();
        config.wallet.private_key = js_config.private_key.clone();
        config.wallet.mnemonic = js_config.mnemonic.clone();
        config.wallet.derivation_path = js_config.derivation_path.clone();
        
        // Set P2P configuration
        config.p2p.enable_webrtc = js_config.enable_webrtc;
        config.p2p.ice_servers = js_config.ice_servers.clone();
        config.p2p.signaling_server_url = js_config.signaling_server_url.clone();
        
        config
    }

    /// Convert Order to JsValue
    fn order_to_js_value(order: &Order) -> Result<JsValue> {
        let obj = Object::new();
        
        Reflect::set(&obj, &JsValue::from_str("id"), &JsValue::from_str(&order.id.0))?;
        Reflect::set(&obj, &JsValue::from_str("maker"), &JsValue::from_str(&order.maker))?;
        Reflect::set(&obj, &JsValue::from_str("baseAsset"), &JsValue::from_str(&order.base_asset.to_string()))?;
        Reflect::set(&obj, &JsValue::from_str("quoteAsset"), &JsValue::from_str(&order.quote_asset.to_string()))?;
        Reflect::set(&obj, &JsValue::from_str("side"), &JsValue::from_f64(order_side_to_js_order_side(order.side) as u8 as f64))?;
        Reflect::set(&obj, &JsValue::from_str("amount"), &JsValue::from_str(&order.amount.to_string()))?;
        Reflect::set(&obj, &JsValue::from_str("price"), &JsValue::from_str(&order.price.to_string()))?;
        Reflect::set(&obj, &JsValue::from_str("status"), &JsValue::from_f64(order_status_to_js_order_status(order.status) as u8 as f64))?;
        Reflect::set(&obj, &JsValue::from_str("timestamp"), &JsValue::from_f64(order.timestamp as f64))?;
        Reflect::set(&obj, &JsValue::from_str("expiry"), &JsValue::from_f64(order.expiry as f64))?;
        
        Ok(obj.into())
    }

    /// Convert Trade to JsValue
    fn trade_to_js_value(trade_id: &TradeId) -> Result<JsValue> {
        let obj = Object::new();
        
        Reflect::set(&obj, &JsValue::from_str("id"), &JsValue::from_str(&trade_id.0))?;
        
        Ok(obj.into())
    }

    /// Convert Event to JsValue
    fn event_to_js_value(event: &Event) -> Result<JsValue> {
        let obj = Object::new();
        
        match event {
            Event::OrderCreated { order_id } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("orderCreated"))?;
                Reflect::set(&obj, &JsValue::from_str("orderId"), &JsValue::from_str(&order_id.0))?;
            }
            Event::OrderCancelled { order_id } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("orderCancelled"))?;
                Reflect::set(&obj, &JsValue::from_str("orderId"), &JsValue::from_str(&order_id.0))?;
            }
            Event::OrderMatched { order_id, trade_id } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("orderMatched"))?;
                Reflect::set(&obj, &JsValue::from_str("orderId"), &JsValue::from_str(&order_id.0))?;
                Reflect::set(&obj, &JsValue::from_str("tradeId"), &JsValue::from_str(&trade_id.0))?;
            }
            Event::OrderExpired { order_id } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("orderExpired"))?;
                Reflect::set(&obj, &JsValue::from_str("orderId"), &JsValue::from_str(&order_id.0))?;
            }
            Event::TradeCreated { trade_id } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("tradeCreated"))?;
                Reflect::set(&obj, &JsValue::from_str("tradeId"), &JsValue::from_str(&trade_id.0))?;
            }
            Event::TradeCompleted { trade_id } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("tradeCompleted"))?;
                Reflect::set(&obj, &JsValue::from_str("tradeId"), &JsValue::from_str(&trade_id.0))?;
            }
            Event::TradeFailed { trade_id, error } => {
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("tradeFailed"))?;
                Reflect::set(&obj, &JsValue::from_str("tradeId"), &JsValue::from_str(&trade_id.0))?;
                Reflect::set(&obj, &JsValue::from_str("error"), &JsValue::from_str(error))?;
            }
            _ => {
                // Handle other event types
                Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("unknown"))?;
            }
        }
        
        Ok(obj.into())
    }

    #[wasm_bindgen]
    impl JsDarkSwap {
        /// Create a new DarkSwap instance
        #[wasm_bindgen(constructor)]
        pub fn new(js_config: JsConfig) -> Result<JsDarkSwap, JsValue> {
            // Set panic hook
            console_error_panic_hook::set_once();
            
            // Convert JsConfig to Config
            let config = js_config_to_config(&js_config);
            
            // Create DarkSwap instance
            let darkswap = match DarkSwap::new(config) {
                Ok(darkswap) => darkswap,
                Err(e) => return Err(JsValue::from_str(&format!("Failed to create DarkSwap: {}", e))),
            };
            
            Ok(JsDarkSwap {
                darkswap: Arc::new(tokio::sync::Mutex::new(darkswap)),
                event_callback: None,
            })
        }

        /// Start DarkSwap
        #[wasm_bindgen]
        pub fn start(&self) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let mut darkswap = darkswap.lock().await;
                
                match darkswap.start().await {
                    Ok(_) => Ok(JsValue::from_bool(true)),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to start DarkSwap: {}", e))),
                }
            })
        }

        /// Stop DarkSwap
        #[wasm_bindgen]
        pub fn stop(&self) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let mut darkswap = darkswap.lock().await;
                
                match darkswap.stop().await {
                    Ok(_) => Ok(JsValue::from_bool(true)),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to stop DarkSwap: {}", e))),
                }
            })
        }

        /// Set event callback
        #[wasm_bindgen]
        pub fn set_event_callback(&mut self, callback: Function) -> Promise {
            let darkswap = self.darkswap.clone();
            self.event_callback = Some(callback);
            let callback = self.event_callback.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Create a task to poll for events
                wasm_bindgen_futures::spawn_local(async move {
                    loop {
                        // Get the next event
                        match darkswap.next_event().await {
                            Ok(Some(event)) => {
                                if let Some(callback) = &callback {
                                    match event_to_js_value(&event) {
                                        Ok(js_event) => {
                                            let _ = callback.call1(&JsValue::NULL, &js_event);
                                        }
                                        Err(e) => {
                                            console::error_1(&JsValue::from_str(&format!("Failed to convert event to JS value: {}", e)));
                                        }
                                    }
                                }
                            }
                            Ok(None) => {
                                // No more events, wait a bit before checking again
                                wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
                                    window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(
                                        &resolve,
                                        100, // 100ms
                                    ).unwrap();
                                })).await.unwrap();
                            }
                            Err(e) => {
                                console::error_1(&JsValue::from_str(&format!("Failed to get event: {}", e)));
                                // Wait a bit before trying again
                                wasm_bindgen_futures::JsFuture::from(js_sys::Promise::new(&mut |resolve, _| {
                                    window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(
                                        &resolve,
                                        1000, // 1s
                                    ).unwrap();
                                })).await.unwrap();
                            }
                        }
                    }
                });
                
                Ok(JsValue::from_bool(true))
            })
        }

        /// Get wallet address
        #[wasm_bindgen]
        pub fn get_address(&self) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                match darkswap.get_address().await {
                    Ok(address) => Ok(JsValue::from_str(&address.to_string())),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to get address: {}", e))),
                }
            })
        }

        /// Get wallet balance
        #[wasm_bindgen]
        pub fn get_balance(&self) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                match darkswap.get_balance().await {
                    Ok(balance) => Ok(JsValue::from_f64(balance as f64)),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to get balance: {}", e))),
                }
            })
        }

        /// Get asset balance
        #[wasm_bindgen]
        pub fn get_asset_balance(&self, asset_type: JsAssetType, id: String) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Convert JsAssetType to Asset
                let asset = match js_asset_type_to_asset(asset_type, &id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid asset: {}", e))),
                };
                
                match darkswap.get_asset_balance(&asset).await {
                    Ok(balance) => Ok(JsValue::from_f64(balance as f64)),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to get asset balance: {}", e))),
                }
            })
        }

        /// Create an order
        #[wasm_bindgen]
        pub fn create_order(
            &self,
            base_asset_type: JsAssetType,
            base_asset_id: String,
            quote_asset_type: JsAssetType,
            quote_asset_id: String,
            side: JsOrderSide,
            amount: String,
            price: String,
            maker_address: String,
            expiry_seconds: u64,
        ) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Convert JsAssetType to Asset
                let base_asset = match js_asset_type_to_asset(base_asset_type, &base_asset_id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid base asset: {}", e))),
                };
                
                let quote_asset = match js_asset_type_to_asset(quote_asset_type, &quote_asset_id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid quote asset: {}", e))),
                };
                
                // Convert JsOrderSide to OrderSide
                let order_side = js_order_side_to_order_side(side);
                
                // Parse amount and price
                let amount_decimal = match Decimal::from_str(&amount) {
                    Ok(amount) => amount,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid amount: {}", e))),
                };
                
                let price_decimal = match Decimal::from_str(&price) {
                    Ok(price) => price,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid price: {}", e))),
                };
                
                // Convert expiry_seconds to Duration
                let expiry = Duration::from_secs(expiry_seconds);
                
                // Create order
                match darkswap.create_order(
                    base_asset,
                    quote_asset,
                    order_side,
                    amount_decimal,
                    price_decimal,
                    maker_address,
                    expiry,
                ).await {
                    Ok(order) => {
                        match order_to_js_value(&order) {
                            Ok(js_order) => Ok(js_order),
                            Err(e) => Err(JsValue::from_str(&format!("Failed to convert order to JS value: {}", e))),
                        }
                    }
                    Err(e) => Err(JsValue::from_str(&format!("Failed to create order: {}", e))),
                }
            })
        }

        /// Cancel an order
        #[wasm_bindgen]
        pub fn cancel_order(&self, order_id: String) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Create OrderId
                let order_id = OrderId(order_id);
                
                match darkswap.cancel_order(&order_id).await {
                    Ok(_) => Ok(JsValue::from_bool(true)),
                    Err(e) => Err(JsValue::from_str(&format!("Failed to cancel order: {}", e))),
                }
            })
        }

        /// Get an order by ID
        #[wasm_bindgen]
        pub fn get_order(&self, order_id: String) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Create OrderId
                let order_id = OrderId(order_id);
                
                match darkswap.get_order(&order_id).await {
                    Ok(order) => {
                        match order_to_js_value(&order) {
                            Ok(js_order) => Ok(js_order),
                            Err(e) => Err(JsValue::from_str(&format!("Failed to convert order to JS value: {}", e))),
                        }
                    }
                    Err(e) => Err(JsValue::from_str(&format!("Failed to get order: {}", e))),
                }
            })
        }

        /// Get orders for a pair
        #[wasm_bindgen]
        pub fn get_orders(
            &self,
            base_asset_type: JsAssetType,
            base_asset_id: String,
            quote_asset_type: JsAssetType,
            quote_asset_id: String,
        ) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Convert JsAssetType to Asset
                let base_asset = match js_asset_type_to_asset(base_asset_type, &base_asset_id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid base asset: {}", e))),
                };
                
                let quote_asset = match js_asset_type_to_asset(quote_asset_type, &quote_asset_id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid quote asset: {}", e))),
                };
                
                // Use the orderbook directly to get orders
                match darkswap.orderbook.get_orders(Some(base_asset), Some(quote_asset), None, None).await {
                    Ok(orders) => {
                        let js_orders = Array::new();
                        
                        for (i, order) in orders.iter().enumerate() {
                            match order_to_js_value(order) {
                                Ok(js_order) => {
                                    js_orders.set(i as u32, js_order);
                                }
                                Err(e) => {
                                    return Err(JsValue::from_str(&format!("Failed to convert order to JS value: {}", e)));
                                }
                            }
                        }
                        
                        Ok(js_orders.into())
                    }
                    Err(e) => Err(JsValue::from_str(&format!("Failed to get orders: {}", e))),
                }
            })
        }

        /// Take an order
        #[wasm_bindgen]
        pub fn take_order(&self, order_id: String, amount: String) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Create OrderId
                let order_id = OrderId(order_id);
                
                // Parse amount
                let amount_decimal = match Decimal::from_str(&amount) {
                    Ok(amount) => amount,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid amount: {}", e))),
                };
                
                match darkswap.take_order(&order_id, amount_decimal).await {
                    Ok(trade_id) => {
                        match trade_to_js_value(&trade_id) {
                            Ok(js_trade) => Ok(js_trade),
                            Err(e) => Err(JsValue::from_str(&format!("Failed to convert trade to JS value: {}", e))),
                        }
                    }
                    Err(e) => Err(JsValue::from_str(&format!("Failed to take order: {}", e))),
                }
            })
        }

        /// Get best bid and ask prices for a pair
        #[wasm_bindgen]
        pub fn get_best_bid_ask(
            &self,
            base_asset_type: JsAssetType,
            base_asset_id: String,
            quote_asset_type: JsAssetType,
            quote_asset_id: String,
        ) -> Promise {
            let darkswap = self.darkswap.clone();
            
            future_to_promise(async move {
                let darkswap = darkswap.lock().await;
                
                // Convert JsAssetType to Asset
                let base_asset = match js_asset_type_to_asset(base_asset_type, &base_asset_id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid base asset: {}", e))),
                };
                
                let quote_asset = match js_asset_type_to_asset(quote_asset_type, &quote_asset_id) {
                    Ok(asset) => asset,
                    Err(e) => return Err(JsValue::from_str(&format!("Invalid quote asset: {}", e))),
                };
                
                match darkswap.get_best_bid_ask(&base_asset, &quote_asset).await {
                    Ok((bid, ask)) => {
                        let obj = Object::new();
                        
                        if let Some(bid) = bid {
                            Reflect::set(&obj, &JsValue::from_str("bid"), &JsValue::from_str(&bid.to_string()))?;
                        } else {
                            Reflect::set(&obj, &JsValue::from_str("bid"), &JsValue::null())?;
                        }
                        
                        if let Some(ask) = ask {
                            Reflect::set(&obj, &JsValue::from_str("ask"), &JsValue::from_str(&ask.to_string()))?;
                        } else {
                            Reflect::set(&obj, &JsValue::from_str("ask"), &JsValue::null())?;
                        }
                        
                        Ok(obj.into())
                    }
                    Err(e) => Err(JsValue::from_str(&format!("Failed to get best bid and ask: {}", e))),
                }
            })
        }
    }
}