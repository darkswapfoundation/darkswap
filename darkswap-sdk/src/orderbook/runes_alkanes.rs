//! Runes and Alkanes extensions for the orderbook
//!
//! This module provides extensions to the orderbook for runes and alkanes trading pairs.

use anyhow::Result;
use rust_decimal::Decimal;
use std::sync::Arc;

use crate::orderbook::{Order, OrderSide, Orderbook};
use crate::types::{AlkaneId, Asset, RuneId};

/// Runes and Alkanes extensions for the orderbook
impl Orderbook {
    /// Create a new order for a BTC/Rune trading pair
    pub async fn create_btc_rune_order(
        &self,
        rune_id: RuneId,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        match side {
            OrderSide::Buy => {
                // Buy rune with BTC
                self.create_order(
                    Asset::Rune(rune_id),
                    Asset::Bitcoin,
                    side,
                    amount,
                    price,
                    expiry,
                )
                .await
            }
            OrderSide::Sell => {
                // Sell rune for BTC
                self.create_order(
                    Asset::Rune(rune_id),
                    Asset::Bitcoin,
                    side,
                    amount,
                    price,
                    expiry,
                )
                .await
            }
        }
    }

    /// Create a new order for a BTC/Alkane trading pair
    pub async fn create_btc_alkane_order(
        &self,
        alkane_id: AlkaneId,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        match side {
            OrderSide::Buy => {
                // Buy alkane with BTC
                self.create_order(
                    Asset::Alkane(alkane_id),
                    Asset::Bitcoin,
                    side,
                    amount,
                    price,
                    expiry,
                )
                .await
            }
            OrderSide::Sell => {
                // Sell alkane for BTC
                self.create_order(
                    Asset::Alkane(alkane_id),
                    Asset::Bitcoin,
                    side,
                    amount,
                    price,
                    expiry,
                )
                .await
            }
        }
    }

    /// Create a new order for a Rune/Rune trading pair
    pub async fn create_rune_rune_order(
        &self,
        base_rune_id: RuneId,
        quote_rune_id: RuneId,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        self.create_order(
            Asset::Rune(base_rune_id),
            Asset::Rune(quote_rune_id),
            side,
            amount,
            price,
            expiry,
        )
        .await
    }

    /// Create a new order for a Rune/Alkane trading pair
    pub async fn create_rune_alkane_order(
        &self,
        rune_id: RuneId,
        alkane_id: AlkaneId,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        match side {
            OrderSide::Buy => {
                // Buy alkane with rune
                self.create_order(
                    Asset::Alkane(alkane_id),
                    Asset::Rune(rune_id),
                    side,
                    amount,
                    price,
                    expiry,
                )
                .await
            }
            OrderSide::Sell => {
                // Sell alkane for rune
                self.create_order(
                    Asset::Alkane(alkane_id),
                    Asset::Rune(rune_id),
                    side,
                    amount,
                    price,
                    expiry,
                )
                .await
            }
        }
    }

    /// Create a new order for an Alkane/Alkane trading pair
    pub async fn create_alkane_alkane_order(
        &self,
        base_alkane_id: AlkaneId,
        quote_alkane_id: AlkaneId,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        self.create_order(
            Asset::Alkane(base_alkane_id),
            Asset::Alkane(quote_alkane_id),
            side,
            amount,
            price,
            expiry,
        )
        .await
    }

    /// Get orders for a BTC/Rune trading pair
    pub async fn get_btc_rune_orders(&self, rune_id: RuneId) -> Result<Vec<Order>> {
        self.get_orders(&Asset::Rune(rune_id), &Asset::Bitcoin).await
    }

    /// Get orders for a BTC/Alkane trading pair
    pub async fn get_btc_alkane_orders(&self, alkane_id: AlkaneId) -> Result<Vec<Order>> {
        self.get_orders(&Asset::Alkane(alkane_id), &Asset::Bitcoin).await
    }

    /// Get orders for a Rune/Rune trading pair
    pub async fn get_rune_rune_orders(
        &self,
        base_rune_id: RuneId,
        quote_rune_id: RuneId,
    ) -> Result<Vec<Order>> {
        self.get_orders(&Asset::Rune(base_rune_id), &Asset::Rune(quote_rune_id))
            .await
    }

    /// Get orders for a Rune/Alkane trading pair
    pub async fn get_rune_alkane_orders(
        &self,
        rune_id: RuneId,
        alkane_id: AlkaneId,
    ) -> Result<Vec<Order>> {
        self.get_orders(&Asset::Alkane(alkane_id), &Asset::Rune(rune_id))
            .await
    }

    /// Get orders for an Alkane/Alkane trading pair
    pub async fn get_alkane_alkane_orders(
        &self,
        base_alkane_id: AlkaneId,
        quote_alkane_id: AlkaneId,
    ) -> Result<Vec<Order>> {
        self.get_orders(
            &Asset::Alkane(base_alkane_id),
            &Asset::Alkane(quote_alkane_id),
        )
        .await
    }

    /// Get best bid and ask for a BTC/Rune trading pair
    pub async fn get_btc_rune_best_bid_ask(
        &self,
        rune_id: RuneId,
    ) -> Result<(Option<Decimal>, Option<Decimal>)> {
        self.get_best_bid_ask(&Asset::Rune(rune_id), &Asset::Bitcoin)
            .await
    }

    /// Get best bid and ask for a BTC/Alkane trading pair
    pub async fn get_btc_alkane_best_bid_ask(
        &self,
        alkane_id: AlkaneId,
    ) -> Result<(Option<Decimal>, Option<Decimal>)> {
        self.get_best_bid_ask(&Asset::Alkane(alkane_id), &Asset::Bitcoin)
            .await
    }

    /// Get best bid and ask for a Rune/Rune trading pair
    pub async fn get_rune_rune_best_bid_ask(
        &self,
        base_rune_id: RuneId,
        quote_rune_id: RuneId,
    ) -> Result<(Option<Decimal>, Option<Decimal>)> {
        self.get_best_bid_ask(&Asset::Rune(base_rune_id), &Asset::Rune(quote_rune_id))
            .await
    }

    /// Get best bid and ask for a Rune/Alkane trading pair
    pub async fn get_rune_alkane_best_bid_ask(
        &self,
        rune_id: RuneId,
        alkane_id: AlkaneId,
    ) -> Result<(Option<Decimal>, Option<Decimal>)> {
        self.get_best_bid_ask(&Asset::Alkane(alkane_id), &Asset::Rune(rune_id))
            .await
    }

    /// Get best bid and ask for an Alkane/Alkane trading pair
    pub async fn get_alkane_alkane_best_bid_ask(
        &self,
        base_alkane_id: AlkaneId,
        quote_alkane_id: AlkaneId,
    ) -> Result<(Option<Decimal>, Option<Decimal>)> {
        self.get_best_bid_ask(
            &Asset::Alkane(base_alkane_id),
            &Asset::Alkane(quote_alkane_id),
        )
        .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    use crate::p2p::P2PNetwork;
    use crate::wallet::simple_wallet::SimpleWallet;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_create_btc_rune_order() -> Result<()> {
        // Create event channel
        let (event_sender, _) = mpsc::channel(100);

        // Create network
        let config = Config::default();
        let network = Arc::new(tokio::sync::RwLock::new(P2PNetwork::new(&config, event_sender.clone())?));

        // Create wallet
        let wallet = Arc::new(SimpleWallet::new(None, config.bitcoin.network)?);

        // Create orderbook
        let orderbook = Orderbook::new(network, wallet, event_sender);
        orderbook.start().await?;

        // Create a BTC/Rune order
        let rune_id = 123456789;
        let order = orderbook
            .create_btc_rune_order(rune_id, OrderSide::Buy, Decimal::new(1, 0), Decimal::new(1, 0), None)
            .await?;

        // Check that the order was created correctly
        assert_eq!(order.base_asset, Asset::Rune(rune_id));
        assert_eq!(order.quote_asset, Asset::Bitcoin);
        assert_eq!(order.side, OrderSide::Buy);

        Ok(())
    }

    #[tokio::test]
    async fn test_create_btc_alkane_order() -> Result<()> {
        // Create event channel
        let (event_sender, _) = mpsc::channel(100);

        // Create network
        let config = Config::default();
        let network = Arc::new(tokio::sync::RwLock::new(P2PNetwork::new(&config, event_sender.clone())?));

        // Create wallet
        let wallet = Arc::new(SimpleWallet::new(None, config.bitcoin.network)?);

        // Create orderbook
        let orderbook = Orderbook::new(network, wallet, event_sender);
        orderbook.start().await?;

        // Create a BTC/Alkane order
        let alkane_id = AlkaneId("test_alkane".to_string());
        let order = orderbook
            .create_btc_alkane_order(
                alkane_id.clone(),
                OrderSide::Sell,
                Decimal::new(1, 0),
                Decimal::new(1, 0),
                None,
            )
            .await?;

        // Check that the order was created correctly
        assert_eq!(order.base_asset, Asset::Alkane(alkane_id));
        assert_eq!(order.quote_asset, Asset::Bitcoin);
        assert_eq!(order.side, OrderSide::Sell);

        Ok(())
    }
}