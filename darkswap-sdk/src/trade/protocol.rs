//! Trade protocol for DarkSwap
//!
//! This module provides functionality for secure trading of Bitcoin, runes, and alkanes.

use crate::{
    error::Error,
    trade::{
        alkane::AlkaneHandler,
        psbt::PsbtHandler,
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
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;

/// Trade offer
#[derive(Debug, Clone)]
pub struct TradeOffer {
    /// Offer ID
    pub id: String,
    /// Maker peer ID
    pub maker_peer_id: String,
    /// Maker asset type
    pub maker_asset_type: AssetType,
    /// Maker asset amount
    pub maker_amount: u64,
    /// Taker asset type
    pub taker_asset_type: AssetType,
    /// Taker asset amount
    pub taker_amount: u64,
    /// Expiration time (Unix timestamp)
    pub expiration: u64,
}

/// Trade state
#[derive(Debug, Clone)]
enum TradeState {
    /// Offer created
    OfferCreated(TradeOffer),
    /// Offer accepted
    OfferAccepted {
        /// Offer
        offer: TradeOffer,
        /// Taker peer ID
        taker_peer_id: String,
    },
    /// Maker PSBT created
    MakerPsbtCreated {
        /// Offer
        offer: TradeOffer,
        /// Taker peer ID
        taker_peer_id: String,
        /// Maker PSBT
        maker_psbt: Psbt,
    },
    /// Taker PSBT created
    TakerPsbtCreated {
        /// Offer
        offer: TradeOffer,
        /// Taker peer ID
        taker_peer_id: String,
        /// Maker PSBT
        maker_psbt: Psbt,
        /// Taker PSBT
        taker_psbt: Psbt,
    },
    /// PSBTs signed
    PsbtsSigned {
        /// Offer
        offer: TradeOffer,
        /// Taker peer ID
        taker_peer_id: String,
        /// Maker PSBT
        maker_psbt: Psbt,
        /// Taker PSBT
        taker_psbt: Psbt,
    },
    /// Trade completed
    TradeCompleted {
        /// Offer
        offer: TradeOffer,
        /// Taker peer ID
        taker_peer_id: String,
        /// Maker transaction ID
        maker_txid: Txid,
        /// Taker transaction ID
        taker_txid: Txid,
    },
    /// Trade failed
    TradeFailed {
        /// Offer
        offer: TradeOffer,
        /// Error
        error: String,
    },
}

/// Trade protocol
pub struct TradeProtocol {
    /// PSBT handler
    psbt_handler: Arc<PsbtHandler>,
    /// Rune handler
    rune_handler: Arc<RuneHandler>,
    /// Alkane handler
    alkane_handler: Arc<AlkaneHandler>,
    /// Active trades
    active_trades: Arc<Mutex<HashMap<String, TradeState>>>,
    /// Local peer ID
    local_peer_id: String,
}

impl TradeProtocol {
    /// Create a new trade protocol
    pub fn new(
        psbt_handler: Arc<PsbtHandler>,
        rune_handler: Arc<RuneHandler>,
        alkane_handler: Arc<AlkaneHandler>,
        local_peer_id: String,
    ) -> Self {
        Self {
            psbt_handler,
            rune_handler,
            alkane_handler,
            active_trades: Arc::new(Mutex::new(HashMap::new())),
            local_peer_id,
        }
    }
    
    /// Create a trade offer
    pub async fn create_offer(
        &self,
        maker_asset_type: AssetType,
        maker_amount: u64,
        taker_asset_type: AssetType,
        taker_amount: u64,
        expiration_seconds: u64,
    ) -> Result<TradeOffer> {
        // Generate a random offer ID
        let id = Uuid::new_v4().to_string();
        
        // Calculate the expiration time
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let expiration = now + expiration_seconds;
        
        // Create the offer
        let offer = TradeOffer {
            id,
            maker_peer_id: self.local_peer_id.clone(),
            maker_asset_type,
            maker_amount,
            taker_asset_type,
            taker_amount,
            expiration,
        };
        
        // Store the offer
        let mut active_trades = self.active_trades.lock().unwrap();
        active_trades.insert(offer.id.clone(), TradeState::OfferCreated(offer.clone()));
        
        Ok(offer)
    }
    
    /// Accept a trade offer
    pub async fn accept_offer(&self, offer_id: &str) -> Result<()> {
        let mut active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Check if the offer is still valid
        match trade_state {
            TradeState::OfferCreated(offer) => {
                // Check if the offer has expired
                let current_time = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                if current_time > offer.expiration {
                    return Err(Error::TradeExpired(offer_id.to_string()));
                }
                
                // Update the trade state
                active_trades.insert(
                    offer_id.to_string(),
                    TradeState::OfferAccepted {
                        offer: offer.clone(),
                        taker_peer_id: self.local_peer_id.clone(),
                    },
                );
                
                Ok(())
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Trade {} is not in the OfferCreated state",
                offer_id
            ))),
        }
    }
    
    /// Create maker PSBT
    pub async fn create_maker_psbt(&self, offer_id: &str) -> Result<Psbt> {
        let mut active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Check if the offer has been accepted
        match trade_state {
            TradeState::OfferAccepted { offer, taker_peer_id } => {
                // Check that we are the maker
                if offer.maker_peer_id != self.local_peer_id {
                    return Err(Error::NotMaker(offer_id.to_string()));
                }
                
                // Get the taker's address
                // In a real implementation, we would need to get the taker's address from the P2P network
                // For now, we'll just use a dummy address
                let taker_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
                
                // Create the maker PSBT
                let maker_psbt = match &offer.maker_asset_type {
                    AssetType::Bitcoin => {
                        // Create a Bitcoin transfer PSBT
                        let outputs = vec![
                            TxOut {
                                value: offer.maker_amount,
                                script_pubkey: taker_address.script_pubkey(),
                            },
                        ];
                        
                        self.psbt_handler.create_trade_psbt(outputs, 1.0).await?
                    }
                    AssetType::Rune(rune_id) => {
                        // Create a rune transfer PSBT
                        self.rune_handler.create_transfer_psbt(rune_id, offer.maker_amount, taker_address, 1.0).await?
                    }
                    AssetType::Alkane(alkane_id) => {
                        // Create an alkane transfer PSBT
                        self.alkane_handler.create_transfer_psbt(alkane_id, offer.maker_amount, taker_address, 1.0).await?
                    }
                };
                
                // Update the trade state
                active_trades.insert(
                    offer_id.to_string(),
                    TradeState::MakerPsbtCreated {
                        offer: offer.clone(),
                        taker_peer_id: taker_peer_id.clone(),
                        maker_psbt: maker_psbt.clone(),
                    },
                );
                
                Ok(maker_psbt)
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Trade {} is not in the OfferAccepted state",
                offer_id
            ))),
        }
    }
    
    /// Create taker PSBT
    pub async fn create_taker_psbt(&self, offer_id: &str) -> Result<Psbt> {
        let mut active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Check if the maker PSBT has been created
        match trade_state {
            TradeState::MakerPsbtCreated { offer, taker_peer_id, maker_psbt } => {
                // Check that we are the taker
                if taker_peer_id != &self.local_peer_id {
                    return Err(Error::NotTaker(offer_id.to_string()));
                }
                
                // Get the maker's address
                // In a real implementation, we would need to get the maker's address from the P2P network
                // For now, we'll just use a dummy address
                let maker_address = Address::from_str("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx").unwrap();
                
                // Create the taker PSBT
                let taker_psbt = match &offer.taker_asset_type {
                    AssetType::Bitcoin => {
                        // Create a Bitcoin transfer PSBT
                        let outputs = vec![
                            TxOut {
                                value: offer.taker_amount,
                                script_pubkey: maker_address.script_pubkey(),
                            },
                        ];
                        
                        self.psbt_handler.create_trade_psbt(outputs, 1.0).await?
                    }
                    AssetType::Rune(rune_id) => {
                        // Create a rune transfer PSBT
                        self.rune_handler.create_transfer_psbt(rune_id, offer.taker_amount, maker_address, 1.0).await?
                    }
                    AssetType::Alkane(alkane_id) => {
                        // Create an alkane transfer PSBT
                        self.alkane_handler.create_transfer_psbt(alkane_id, offer.taker_amount, maker_address, 1.0).await?
                    }
                };
                
                // Update the trade state
                active_trades.insert(
                    offer_id.to_string(),
                    TradeState::TakerPsbtCreated {
                        offer: offer.clone(),
                        taker_peer_id: taker_peer_id.clone(),
                        maker_psbt: maker_psbt.clone(),
                        taker_psbt: taker_psbt.clone(),
                    },
                );
                
                Ok(taker_psbt)
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Trade {} is not in the MakerPsbtCreated state",
                offer_id
            ))),
        }
    }
    
    /// Sign PSBTs
    pub async fn sign_psbts(&self, offer_id: &str) -> Result<(Psbt, Psbt)> {
        let mut active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Check if the taker PSBT has been created
        match trade_state {
            TradeState::TakerPsbtCreated { offer, taker_peer_id, maker_psbt, taker_psbt } => {
                // Check if we are the maker or the taker
                let is_maker = offer.maker_peer_id == self.local_peer_id;
                let is_taker = taker_peer_id == &self.local_peer_id;
                
                if !is_maker && !is_taker {
                    return Err(Error::NotParticipant(offer_id.to_string()));
                }
                
                // Sign the PSBTs
                let signed_maker_psbt = if is_maker {
                    self.psbt_handler.sign_psbt(maker_psbt.clone()).await?
                } else {
                    maker_psbt.clone()
                };
                
                let signed_taker_psbt = if is_taker {
                    self.psbt_handler.sign_psbt(taker_psbt.clone()).await?
                } else {
                    taker_psbt.clone()
                };
                
                // Update the trade state
                active_trades.insert(
                    offer_id.to_string(),
                    TradeState::PsbtsSigned {
                        offer: offer.clone(),
                        taker_peer_id: taker_peer_id.clone(),
                        maker_psbt: signed_maker_psbt.clone(),
                        taker_psbt: signed_taker_psbt.clone(),
                    },
                );
                
                Ok((signed_maker_psbt, signed_taker_psbt))
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Trade {} is not in the TakerPsbtCreated state",
                offer_id
            ))),
        }
    }
    
    /// Finalize and broadcast PSBTs
    pub async fn finalize_and_broadcast(&self, offer_id: &str) -> Result<(Txid, Txid)> {
        let mut active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Check if the PSBTs have been signed
        match trade_state {
            TradeState::PsbtsSigned { offer, taker_peer_id, maker_psbt, taker_psbt } => {
                // Finalize the PSBTs
                let maker_tx = self.psbt_handler.finalize_psbt(maker_psbt.clone()).await?;
                let taker_tx = self.psbt_handler.finalize_psbt(taker_psbt.clone()).await?;
                
                // Broadcast the transactions
                let maker_txid = self.psbt_handler.broadcast_transaction(maker_tx).await?;
                let taker_txid = self.psbt_handler.broadcast_transaction(taker_tx).await?;
                
                // Update the trade state
                active_trades.insert(
                    offer_id.to_string(),
                    TradeState::TradeCompleted {
                        offer: offer.clone(),
                        taker_peer_id: taker_peer_id.clone(),
                        maker_txid,
                        taker_txid,
                    },
                );
                
                Ok((maker_txid, taker_txid))
            }
            _ => Err(Error::InvalidTradeState(format!(
                "Trade {} is not in the PsbtsSigned state",
                offer_id
            ))),
        }
    }
    
    /// Get the trade state
    pub fn get_trade_state(&self, offer_id: &str) -> Result<String> {
        let active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Return the state as a string
        match trade_state {
            TradeState::OfferCreated(_) => Ok("OfferCreated".to_string()),
            TradeState::OfferAccepted { .. } => Ok("OfferAccepted".to_string()),
            TradeState::MakerPsbtCreated { .. } => Ok("MakerPsbtCreated".to_string()),
            TradeState::TakerPsbtCreated { .. } => Ok("TakerPsbtCreated".to_string()),
            TradeState::PsbtsSigned { .. } => Ok("PsbtsSigned".to_string()),
            TradeState::TradeCompleted { .. } => Ok("TradeCompleted".to_string()),
            TradeState::TradeFailed { .. } => Ok("TradeFailed".to_string()),
        }
    }
    
    /// Get the trade offer
    pub fn get_trade_offer(&self, offer_id: &str) -> Result<TradeOffer> {
        let active_trades = self.active_trades.lock().unwrap();
        
        // Get the offer
        let trade_state = active_trades.get(offer_id).ok_or_else(|| Error::TradeNotFound(offer_id.to_string()))?;
        
        // Return the offer
        match trade_state {
            TradeState::OfferCreated(offer) => Ok(offer.clone()),
            TradeState::OfferAccepted { offer, .. } => Ok(offer.clone()),
            TradeState::MakerPsbtCreated { offer, .. } => Ok(offer.clone()),
            TradeState::TakerPsbtCreated { offer, .. } => Ok(offer.clone()),
            TradeState::PsbtsSigned { offer, .. } => Ok(offer.clone()),
            TradeState::TradeCompleted { offer, .. } => Ok(offer.clone()),
            TradeState::TradeFailed { offer, .. } => Ok(offer.clone()),
        }
    }
    
    /// Get all active trade offers
    pub fn get_active_trade_offers(&self) -> Vec<TradeOffer> {
        let active_trades = self.active_trades.lock().unwrap();
        
        // Get all offers
        let mut offers = Vec::new();
        
        for (_, trade_state) in active_trades.iter() {
            match trade_state {
                TradeState::OfferCreated(offer) => offers.push(offer.clone()),
                TradeState::OfferAccepted { offer, .. } => offers.push(offer.clone()),
                TradeState::MakerPsbtCreated { offer, .. } => offers.push(offer.clone()),
                TradeState::TakerPsbtCreated { offer, .. } => offers.push(offer.clone()),
                TradeState::PsbtsSigned { offer, .. } => offers.push(offer.clone()),
                TradeState::TradeCompleted { offer, .. } => offers.push(offer.clone()),
                TradeState::TradeFailed { offer, .. } => offers.push(offer.clone()),
            }
        }
        
        offers
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wallet::bdk_wallet::BdkWallet;
    use std::sync::Arc;
    
    #[tokio::test]
    async fn test_create_offer() {
        // Create a wallet
        let (wallet, _) = BdkWallet::generate(
            Network::Testnet,
            "ssl://electrum.blockstream.info:60002",
        ).unwrap();
        
        // Create handlers
        let wallet_arc = Arc::new(wallet);
        let psbt_handler = Arc::new(PsbtHandler::new(wallet_arc.clone()));
        let rune_handler = Arc::new(RuneHandler::new(wallet_arc.clone()));
        let alkane_handler = Arc::new(AlkaneHandler::new(wallet_arc.clone()));
        
        // Create a trade protocol
        let trade_protocol = TradeProtocol::new(
            psbt_handler,
            rune_handler,
            alkane_handler,
            "test_peer_id".to_string(),
        );
        
        // Create an offer
        let offer = trade_protocol.create_offer(
            AssetType::Bitcoin,
            1000,
            AssetType::Rune("test_rune".to_string()),
            500,
            3600,
        ).await.unwrap();
        
        // Check the offer
        assert_eq!(offer.maker_peer_id, "test_peer_id");
        assert_eq!(offer.maker_asset_type, AssetType::Bitcoin);
        assert_eq!(offer.maker_amount, 1000);
        assert_eq!(offer.taker_asset_type, AssetType::Rune("test_rune".to_string()));
        assert_eq!(offer.taker_amount, 500);
        
        // Check that the offer is stored
        let state = trade_protocol.get_trade_state(&offer.id).unwrap();
        assert_eq!(state, "OfferCreated");
    }
}