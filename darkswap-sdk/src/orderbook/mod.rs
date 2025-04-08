//! Orderbook module for DarkSwap
//!
//! This module provides orderbook functionality for DarkSwap.

use std::collections::{HashMap, BTreeMap};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::Result;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

use crate::error::Error;
use crate::types::{Asset, Event};
use crate::wallet::WalletInterface;

/// Order ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct OrderId(pub String);

impl OrderId {
    /// Create a new order ID
    pub fn new() -> Self {
        Self(Uuid::new_v4().to_string())
    }
}

impl std::fmt::Display for OrderId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Order side
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy
    Buy,
    /// Sell
    Sell,
}

impl std::fmt::Display for OrderSide {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrderSide::Buy => write!(f, "buy"),
            OrderSide::Sell => write!(f, "sell"),
        }
    }
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open
    Open,
    /// Partially filled
    PartiallyFilled,
    /// Filled
    Filled,
    /// Cancelled
    Cancelled,
    /// Expired
    Expired,
}

impl std::fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrderStatus::Open => write!(f, "open"),
            OrderStatus::PartiallyFilled => write!(f, "partially_filled"),
            OrderStatus::Filled => write!(f, "filled"),
            OrderStatus::Cancelled => write!(f, "cancelled"),
            OrderStatus::Expired => write!(f, "expired"),
        }
    }
}

/// Order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    /// Order ID
    pub id: OrderId,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Side
    pub side: OrderSide,
    /// Amount
    pub amount: Decimal,
    /// Price
    pub price: Decimal,
    /// Status
    pub status: OrderStatus,
    /// Filled amount
    pub filled_amount: Decimal,
    /// Created at
    pub created_at: u64,
    /// Updated at
    pub updated_at: u64,
    /// Expires at
    pub expires_at: u64,
    /// Maker
    pub maker: String,
    /// Signature
    pub signature: Option<String>,
}

impl Order {
    /// Create a new order
    pub fn new(
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        maker: String,
        expiry: Duration,
    ) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            id: OrderId::new(),
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status: OrderStatus::Open,
            filled_amount: Decimal::ZERO,
            created_at: now,
            updated_at: now,
            expires_at: now + expiry.as_secs(),
            maker,
            signature: None,
        }
    }

    /// Check if the order is expired
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        self.expires_at <= now
    }

    /// Get the remaining amount
    pub fn remaining_amount(&self) -> Decimal {
        self.amount - self.filled_amount
    }

    /// Get the total value
    pub fn total_value(&self) -> Decimal {
        self.amount * self.price
    }

    /// Get the filled value
    pub fn filled_value(&self) -> Decimal {
        self.filled_amount * self.price
    }

    /// Get the remaining value
    pub fn remaining_value(&self) -> Decimal {
        self.remaining_amount() * self.price
    }

    /// Fill the order
    pub fn fill(&mut self, amount: Decimal) -> Result<()> {
        if amount > self.remaining_amount() {
            return Err(Error::OrderBookError("Fill amount exceeds remaining amount".to_string()).into());
        }

        self.filled_amount += amount;
        self.updated_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if self.filled_amount == self.amount {
            self.status = OrderStatus::Filled;
        } else {
            self.status = OrderStatus::PartiallyFilled;
        }

        Ok(())
    }

    /// Cancel the order
    pub fn cancel(&mut self) -> Result<()> {
        if self.status == OrderStatus::Filled {
            return Err(Error::OrderBookError("Cannot cancel filled order".to_string()).into());
        }

        self.status = OrderStatus::Cancelled;
        self.updated_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Ok(())
    }

    /// Expire the order
    pub fn expire(&mut self) -> Result<()> {
        if self.status == OrderStatus::Filled {
            return Err(Error::OrderBookError("Cannot expire filled order".to_string()).into());
        }

        self.status = OrderStatus::Expired;
        self.updated_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Ok(())
    }
}

/// Orderbook
pub struct Orderbook {
    /// Orders
    orders: Arc<RwLock<HashMap<OrderId, Order>>>,
    /// Buy orders by price
    buy_orders: Arc<RwLock<BTreeMap<(Asset, Asset, Decimal), Vec<OrderId>>>>,
    /// Sell orders by price
    sell_orders: Arc<RwLock<BTreeMap<(Asset, Asset, Decimal), Vec<OrderId>>>>,
    /// Wallet
    wallet: Arc<dyn WalletInterface + Send + Sync>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
    /// Cleanup interval
    cleanup_interval: Duration,
}

impl Orderbook {
    /// Create a new orderbook
    pub fn new(
        wallet: Arc<dyn WalletInterface + Send + Sync>,
        event_sender: mpsc::Sender<Event>,
        cleanup_interval: Duration,
    ) -> Self {
        Self {
            orders: Arc::new(RwLock::new(HashMap::new())),
            buy_orders: Arc::new(RwLock::new(BTreeMap::new())),
            sell_orders: Arc::new(RwLock::new(BTreeMap::new())),
            wallet,
            event_sender,
            cleanup_interval,
        }
    }

    /// Start the orderbook
    pub async fn start(&self) -> Result<()> {
        // Start the cleanup task
        let orders = self.orders.clone();
        let buy_orders = self.buy_orders.clone();
        let sell_orders = self.sell_orders.clone();
        let event_sender = self.event_sender.clone();
        let cleanup_interval = self.cleanup_interval;

        tokio::spawn(async move {
            loop {
                // Sleep for the cleanup interval
                tokio::time::sleep(cleanup_interval).await;

                // Get the current time
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();

                // Get all orders
                let mut orders_lock = orders.write().await;
                let mut buy_orders_lock = buy_orders.write().await;
                let mut sell_orders_lock = sell_orders.write().await;

                // Find expired orders
                let mut expired_order_ids = Vec::new();
                for (order_id, order) in orders_lock.iter_mut() {
                    if order.expires_at <= now && order.status == OrderStatus::Open {
                        // Expire the order
                        if let Err(e) = order.expire() {
                            eprintln!("Failed to expire order {}: {}", order_id, e);
                            continue;
                        }

                        // Add to expired order IDs
                        expired_order_ids.push(order_id.clone());

                        // Send event
                        if let Err(e) = event_sender.send(Event::OrderExpired(order_id.clone())).await {
                            eprintln!("Failed to send order expired event: {}", e);
                        }
                    }
                }

                // Remove expired orders from buy/sell orders
                for order_id in &expired_order_ids {
                    if let Some(order) = orders_lock.get(order_id) {
                        let key = (order.base_asset.clone(), order.quote_asset.clone(), order.price);
                        match order.side {
                            OrderSide::Buy => {
                                if let Some(order_ids) = buy_orders_lock.get_mut(&key) {
                                    order_ids.retain(|id| id != order_id);
                                    if order_ids.is_empty() {
                                        buy_orders_lock.remove(&key);
                                    }
                                }
                            }
                            OrderSide::Sell => {
                                if let Some(order_ids) = sell_orders_lock.get_mut(&key) {
                                    order_ids.retain(|id| id != order_id);
                                    if order_ids.is_empty() {
                                        sell_orders_lock.remove(&key);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        Ok(())
    }

    /// Create an order
    pub async fn create_order(
        &self,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        maker: String,
        expiry: Duration,
    ) -> Result<Order> {
        // Create the order
        let order = Order::new(
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            maker,
            expiry,
        );

        // Add the order to the orderbook
        let mut orders = self.orders.write().await;
        orders.insert(order.id.clone(), order.clone());

        // Add the order to the appropriate price level
        let key = (base_asset, quote_asset, price);
        match side {
            OrderSide::Buy => {
                let mut buy_orders = self.buy_orders.write().await;
                buy_orders
                    .entry(key)
                    .or_insert_with(Vec::new)
                    .push(order.id.clone());
            }
            OrderSide::Sell => {
                let mut sell_orders = self.sell_orders.write().await;
                sell_orders
                    .entry(key)
                    .or_insert_with(Vec::new)
                    .push(order.id.clone());
            }
        }

        // Send event
        self.event_sender.send(Event::OrderCreated(order.clone())).await
            .map_err(|e| Error::OrderBookError(format!("Failed to send order created event: {}", e)))?;

        Ok(order)
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &OrderId) -> Result<Order> {
        // Get the order
        let mut orders = self.orders.write().await;
        let order = orders.get_mut(order_id)
            .ok_or_else(|| Error::OrderBookError(format!("Order not found: {}", order_id)))?;

        // Cancel the order
        order.cancel()?;

        // Remove the order from the appropriate price level
        let key = (order.base_asset.clone(), order.quote_asset.clone(), order.price);
        match order.side {
            OrderSide::Buy => {
                let mut buy_orders = self.buy_orders.write().await;
                if let Some(order_ids) = buy_orders.get_mut(&key) {
                    order_ids.retain(|id| id != order_id);
                    if order_ids.is_empty() {
                        buy_orders.remove(&key);
                    }
                }
            }
            OrderSide::Sell => {
                let mut sell_orders = self.sell_orders.write().await;
                if let Some(order_ids) = sell_orders.get_mut(&key) {
                    order_ids.retain(|id| id != order_id);
                    if order_ids.is_empty() {
                        sell_orders.remove(&key);
                    }
                }
            }
        }

        // Send event
        self.event_sender.send(Event::OrderCancelled(order_id.clone())).await
            .map_err(|e| Error::OrderBookError(format!("Failed to send order cancelled event: {}", e)))?;

        Ok(order.clone())
    }

    /// Get an order
    pub async fn get_order(&self, order_id: &OrderId) -> Result<Order> {
        // Get the order
        let orders = self.orders.read().await;
        let order = orders.get(order_id)
            .ok_or_else(|| Error::OrderBookError(format!("Order not found: {}", order_id)))?;

        Ok(order.clone())
    }

    /// Get orders
    pub async fn get_orders(
        &self,
        base_asset: Option<Asset>,
        quote_asset: Option<Asset>,
        side: Option<OrderSide>,
        status: Option<OrderStatus>,
    ) -> Result<Vec<Order>> {
        // Get all orders
        let orders = self.orders.read().await;

        // Filter orders
        let filtered_orders = orders.values()
            .filter(|order| {
                if let Some(base) = &base_asset {
                    if &order.base_asset != base {
                        return false;
                    }
                }
                if let Some(quote) = &quote_asset {
                    if &order.quote_asset != quote {
                        return false;
                    }
                }
                if let Some(s) = side {
                    if order.side != s {
                        return false;
                    }
                }
                if let Some(s) = status {
                    if order.status != s {
                        return false;
                    }
                }
                true
            })
            .cloned()
            .collect();

        Ok(filtered_orders)
    }

    /// Get the best bid price
    pub async fn get_best_bid_price(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<Option<Decimal>> {
        // Get all buy orders
        let buy_orders = self.buy_orders.read().await;

        // Find the highest bid price
        let mut best_price = None;
        for ((base, quote, price), _) in buy_orders.iter().rev() {
            if base == base_asset && quote == quote_asset {
                best_price = Some(*price);
                break;
            }
        }

        Ok(best_price)
    }

    /// Get the best ask price
    pub async fn get_best_ask_price(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<Option<Decimal>> {
        // Get all sell orders
        let sell_orders = self.sell_orders.read().await;

        // Find the lowest ask price
        let mut best_price = None;
        for ((base, quote, price), _) in sell_orders.iter() {
            if base == base_asset && quote == quote_asset {
                best_price = Some(*price);
                break;
            }
        }

        Ok(best_price)
    }

    /// Get the order book
    pub async fn get_order_book(
        &self,
        base_asset: &Asset,
        quote_asset: &Asset,
        depth: usize,
    ) -> Result<(Vec<(Decimal, Decimal)>, Vec<(Decimal, Decimal)>)> {
        // Get all buy orders
        let buy_orders = self.buy_orders.read().await;
        let orders = self.orders.read().await;

        // Get the bids
        let mut bids = Vec::new();
        for ((base, quote, price), order_ids) in buy_orders.iter().rev() {
            if base == base_asset && quote == quote_asset {
                // Calculate the total amount at this price level
                let mut total_amount = Decimal::ZERO;
                for order_id in order_ids {
                    if let Some(order) = orders.get(order_id) {
                        if order.status == OrderStatus::Open || order.status == OrderStatus::PartiallyFilled {
                            total_amount += order.remaining_amount();
                        }
                    }
                }

                // Add to bids
                bids.push((*price, total_amount));

                // Check if we have enough bids
                if bids.len() >= depth {
                    break;
                }
            }
        }

        // Get all sell orders
        let sell_orders = self.sell_orders.read().await;

        // Get the asks
        let mut asks = Vec::new();
        for ((base, quote, price), order_ids) in sell_orders.iter() {
            if base == base_asset && quote == quote_asset {
                // Calculate the total amount at this price level
                let mut total_amount = Decimal::ZERO;
                for order_id in order_ids {
                    if let Some(order) = orders.get(order_id) {
                        if order.status == OrderStatus::Open || order.status == OrderStatus::PartiallyFilled {
                            total_amount += order.remaining_amount();
                        }
                    }
                }

                // Add to asks
                asks.push((*price, total_amount));

                // Check if we have enough asks
                if asks.len() >= depth {
                    break;
                }
            }
        }

        Ok((bids, asks))
    }

    /// Match orders
    pub async fn match_orders(&self, order: &Order) -> Result<Vec<Order>> {
        // Get all orders
        let mut orders = self.orders.write().await;
        let mut matched_orders = Vec::new();

        // Match the order
        match order.side {
            OrderSide::Buy => {
                // Get all sell orders
                let mut sell_orders = self.sell_orders.write().await;

                // Find matching sell orders
                let mut remaining_amount = order.amount;
                for ((base, quote, price), order_ids) in sell_orders.iter_mut() {
                    if base == &order.base_asset && quote == &order.quote_asset && *price <= order.price {
                        // Match orders at this price level
                        for order_id in order_ids.iter() {
                            if let Some(sell_order) = orders.get_mut(order_id) {
                                if sell_order.status == OrderStatus::Open || sell_order.status == OrderStatus::PartiallyFilled {
                                    // Calculate the match amount
                                    let match_amount = remaining_amount.min(sell_order.remaining_amount());

                                    // Fill the sell order
                                    sell_order.fill(match_amount)?;

                                    // Add to matched orders
                                    matched_orders.push(sell_order.clone());

                                    // Update remaining amount
                                    remaining_amount -= match_amount;

                                    // Send event
                                    self.event_sender.send(Event::OrderUpdated(sell_order.clone())).await
                                        .map_err(|e| Error::OrderBookError(format!("Failed to send order updated event: {}", e)))?;

                                    // Check if we've matched the entire order
                                    if remaining_amount.is_zero() {
                                        break;
                                    }
                                }
                            }
                        }

                        // Check if we've matched the entire order
                        if remaining_amount.is_zero() {
                            break;
                        }
                    }
                }
            }
            OrderSide::Sell => {
                // Get all buy orders
                let mut buy_orders = self.buy_orders.write().await;

                // Find matching buy orders
                let mut remaining_amount = order.amount;
                for ((base, quote, price), order_ids) in buy_orders.iter_mut().rev() {
                    if base == &order.base_asset && quote == &order.quote_asset && *price >= order.price {
                        // Match orders at this price level
                        for order_id in order_ids.iter() {
                            if let Some(buy_order) = orders.get_mut(order_id) {
                                if buy_order.status == OrderStatus::Open || buy_order.status == OrderStatus::PartiallyFilled {
                                    // Calculate the match amount
                                    let match_amount = remaining_amount.min(buy_order.remaining_amount());

                                    // Fill the buy order
                                    buy_order.fill(match_amount)?;

                                    // Add to matched orders
                                    matched_orders.push(buy_order.clone());

                                    // Update remaining amount
                                    remaining_amount -= match_amount;

                                    // Send event
                                    self.event_sender.send(Event::OrderUpdated(buy_order.clone())).await
                                        .map_err(|e| Error::OrderBookError(format!("Failed to send order updated event: {}", e)))?;

                                    // Check if we've matched the entire order
                                    if remaining_amount.is_zero() {
                                        break;
                                    }
                                }
                            }
                        }

                        // Check if we've matched the entire order
                        if remaining_amount.is_zero() {
                            break;
                        }
                    }
                }
            }
        }

        Ok(matched_orders)
    }
}