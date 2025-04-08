//! Trade protocol for DarkSwap
//!
//! This module provides the trade protocol for DarkSwap.

use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use bitcoin::{Address, Network, Script, Transaction};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::error::Error;
use crate::orderbook::OrderId;
use crate::types::{Asset, TradeId};
use crate::wallet::Wallet;

/// Trade offer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeOffer {
    /// Offer ID
    pub id: TradeId,
    /// Order ID
    pub order_id: OrderId,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Amount
    pub amount: u64,
    /// Price
    pub price: u64,
    /// Maker
    pub maker: String,
    /// Maker address
    pub maker_address: String,
    /// Maker PSBT
    pub maker_psbt: String,
    /// Created at
    pub created_at: u64,
    /// Expires at
    pub expires_at: u64,
}

/// Trade state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeState {
    /// Offer
    Offer {
        /// Offer
        offer: TradeOffer,
    },
    /// Accepted
    Accepted {
        /// Offer
        offer: TradeOffer,
        /// Taker
        taker: String,
        /// Taker address
        taker_address: String,
        /// Taker PSBT
        taker_psbt: String,
        /// Accepted at
        accepted_at: u64,
    },
    /// Completed
    Completed {
        /// Offer
        offer: TradeOffer,
        /// Taker
        taker: String,
        /// Taker address
        taker_address: String,
        /// Taker PSBT
        taker_psbt: String,
        /// Maker final PSBT
        maker_final_psbt: String,
        /// Taker final PSBT
        taker_final_psbt: String,
        /// Transaction ID
        txid: String,
        /// Completed at
        completed_at: u64,
    },
    /// Cancelled
    Cancelled {
        /// Offer
        offer: TradeOffer,
        /// Cancelled by
        cancelled_by: String,
        /// Cancelled at
        cancelled_at: u64,
    },
    /// Failed
    Failed {
        /// Offer
        offer: TradeOffer,
        /// Error
        error: String,
        /// Failed at
        failed_at: u64,
    },
}

/// Trade protocol
pub struct TradeProtocol {
    /// Wallet
    wallet: Arc<dyn Wallet + Send + Sync>,
    /// Local peer ID
    local_peer_id: String,
    /// Active trades
    active_trades: Arc<RwLock<HashMap<TradeId, TradeState>>>,
}

impl TradeProtocol {
    /// Create a new trade protocol
    pub fn new(wallet: Arc<dyn Wallet + Send + Sync>, local_peer_id: String) -> Self {
        Self {
            wallet,
            local_peer_id,
            active_trades: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a trade offer
    pub async fn create_offer(
        &self,
        order_id: OrderId,
        base_asset: Asset,
        quote_asset: Asset,
        amount: u64,
        price: u64,
        expiry: Duration,
    ) -> Result<TradeOffer> {
        // Get the maker address
        let maker_address = self.wallet.get_address()?;

        // Create a PSBT for the offer
        let maker_psbt = "dummy_psbt".to_string();

        // Create the offer
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let offer = TradeOffer {
            id: TradeId(Uuid::new_v4().to_string()),
            order_id,
            base_asset,
            quote_asset,
            amount,
            price,
            maker: self.local_peer_id.clone(),
            maker_address,
            maker_psbt,
            created_at: now,
            expires_at: now + expiry.as_secs(),
        };

        // Add to active trades
        let mut active_trades = self.active_trades.write().await;
        active_trades.insert(
            offer.id.clone(),
            TradeState::Offer {
                offer: offer.clone(),
            },
        );

        Ok(offer)
    }

    /// Accept a trade offer
    pub async fn accept_offer(&self, offer_id: &TradeId) -> Result<TradeState> {
        // Get the trade state
        let active_trades = self.active_trades.read().await;
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;

        // Check if the offer is still valid
        match trade_state {
            TradeState::Offer { offer } => {
                // Check if the offer has expired
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                if offer.expires_at <= now {
                    return Err(Error::TradeExpired(offer_id.to_string()).into());
                }

                // Check if we're the maker
                if offer.maker == self.local_peer_id {
                    return Err(Error::NotMaker(offer_id.to_string()).into());
                }

                // Get the taker address
                let taker_address = Address::p2wpkh(
                    &bitcoin::PublicKey::from_str("02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619").unwrap(),
                    Network::Testnet,
                ).unwrap().to_string();

                // Create a PSBT for the trade
                let taker_psbt = "dummy_psbt".to_string();

                // Create the accepted state
                let accepted_state = TradeState::Accepted {
                    offer: offer.clone(),
                    taker: self.local_peer_id.clone(),
                    taker_address,
                    taker_psbt,
                    accepted_at: now,
                };

                // Clone the trade state for returning
                let trade_state_clone = accepted_state.clone();

                // Update the active trades
                // We need to drop the read lock and acquire a write lock
                drop(active_trades);
                let mut active_trades = self.active_trades.write().await;
                active_trades.insert(offer_id.clone(), accepted_state);

                Ok(trade_state_clone)
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Cannot accept trade in state: {:?}",
                trade_state
            )).into()),
        }
    }

    /// Complete a trade
    pub async fn complete_trade(&self, offer_id: &TradeId) -> Result<TradeState> {
        // Get the trade state
        let active_trades = self.active_trades.read().await;
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;

        // Check if the trade is in the accepted state
        match trade_state {
            TradeState::Accepted {
                offer,
                taker,
                taker_address,
                taker_psbt,
                accepted_at,
            } => {
                // Check if we're the maker
                let is_maker = offer.maker == self.local_peer_id;
                let is_taker = taker == &self.local_peer_id;

                if !is_maker && !is_taker {
                    return Err(Error::NotParticipant(offer_id.to_string()).into());
                }

                // Create the final PSBTs
                let maker_final_psbt = "dummy_maker_final_psbt".to_string();
                let taker_final_psbt = "dummy_taker_final_psbt".to_string();

                // Create the transaction ID
                let txid = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string();

                // Create the completed state
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                let completed_state = TradeState::Completed {
                    offer: offer.clone(),
                    taker: taker.clone(),
                    taker_address: taker_address.clone(),
                    taker_psbt: taker_psbt.clone(),
                    maker_final_psbt,
                    taker_final_psbt,
                    txid,
                    completed_at: now,
                };

                // Clone the trade state for returning
                let trade_state_clone = completed_state.clone();

                // Update the active trades
                // We need to drop the read lock and acquire a write lock
                drop(active_trades);
                let mut active_trades = self.active_trades.write().await;
                active_trades.insert(offer_id.clone(), completed_state);

                Ok(trade_state_clone)
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Cannot complete trade in state: {:?}",
                trade_state
            )).into()),
        }
    }

    /// Cancel a trade
    pub async fn cancel_trade(&self, offer_id: &TradeId) -> Result<TradeState> {
        // Get the trade state
        let active_trades = self.active_trades.read().await;
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;

        // Check if the trade can be cancelled
        match trade_state {
            TradeState::Offer { offer } => {
                // Check if we're the maker
                if offer.maker != self.local_peer_id {
                    return Err(Error::NotMaker(offer_id.to_string()).into());
                }

                // Create the cancelled state
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                let cancelled_state = TradeState::Cancelled {
                    offer: offer.clone(),
                    cancelled_by: self.local_peer_id.clone(),
                    cancelled_at: now,
                };

                // Clone the trade state for returning
                let trade_state_clone = cancelled_state.clone();

                // Update the active trades
                // We need to drop the read lock and acquire a write lock
                drop(active_trades);
                let mut active_trades = self.active_trades.write().await;
                active_trades.insert(offer_id.clone(), cancelled_state);

                Ok(trade_state_clone)
            }
            TradeState::Accepted {
                offer,
                taker,
                taker_address,
                taker_psbt,
                accepted_at,
            } => {
                // Check if we're the maker or taker
                let is_maker = offer.maker == self.local_peer_id;
                let is_taker = taker == &self.local_peer_id;

                if !is_maker && !is_taker {
                    return Err(Error::NotParticipant(offer_id.to_string()).into());
                }

                // Create the cancelled state
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                let cancelled_state = TradeState::Cancelled {
                    offer: offer.clone(),
                    cancelled_by: self.local_peer_id.clone(),
                    cancelled_at: now,
                };

                // Clone the trade state for returning
                let trade_state_clone = cancelled_state.clone();

                // Update the active trades
                // We need to drop the read lock and acquire a write lock
                drop(active_trades);
                let mut active_trades = self.active_trades.write().await;
                active_trades.insert(offer_id.clone(), cancelled_state);

                Ok(trade_state_clone)
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Cannot cancel trade in state: {:?}",
                trade_state
            )).into()),
        }
    }

    /// Get a trade
    pub async fn get_trade(&self, offer_id: &TradeId) -> Result<TradeState> {
        // Get the trade state
        let active_trades = self.active_trades.read().await;
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;

        Ok(trade_state.clone())
    }

    /// Get all trades
    pub async fn get_trades(&self) -> Result<Vec<TradeState>> {
        // Get all trades
        let active_trades = self.active_trades.read().await;
        let trades = active_trades.values().cloned().collect();

        Ok(trades)
    }

    /// Get trades by state
    pub async fn get_trades_by_state(&self, state: &str) -> Result<Vec<TradeState>> {
        // Get all trades
        let active_trades = self.active_trades.read().await;
        let trades = active_trades
            .values()
            .filter(|trade_state| match (trade_state, state) {
                (TradeState::Offer { .. }, "offer") => true,
                (TradeState::Accepted { .. }, "accepted") => true,
                (TradeState::Completed { .. }, "completed") => true,
                (TradeState::Cancelled { .. }, "cancelled") => true,
                (TradeState::Failed { .. }, "failed") => true,
                _ => false,
            })
            .cloned()
            .collect();

        Ok(trades)
    }

    /// Get trades by asset
    pub async fn get_trades_by_asset(&self, asset: &Asset) -> Result<Vec<TradeState>> {
        // Get all trades
        let active_trades = self.active_trades.read().await;
        let trades = active_trades
            .values()
            .filter(|trade_state| match trade_state {
                TradeState::Offer { offer } => &offer.base_asset == asset || &offer.quote_asset == asset,
                TradeState::Accepted { offer, .. } => &offer.base_asset == asset || &offer.quote_asset == asset,
                TradeState::Completed { offer, .. } => &offer.base_asset == asset || &offer.quote_asset == asset,
                TradeState::Cancelled { offer, .. } => &offer.base_asset == asset || &offer.quote_asset == asset,
                TradeState::Failed { offer, .. } => &offer.base_asset == asset || &offer.quote_asset == asset,
            })
            .cloned()
            .collect();

        Ok(trades)
    }
}