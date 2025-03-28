//! Orderbook module for DarkSwap
//!
//! This module provides orderbook functionality for DarkSwap, including order creation,
//! cancellation, and matching.

use std::collections::{BTreeMap, HashMap};
use std::fmt;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::{Context as AnyhowContext, Result};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

use crate::types::{Asset, Event};

/// Order ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct OrderId(pub String);

impl fmt::Display for OrderId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Order side
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy
    Buy,
    /// Sell
    Sell,
}

impl fmt::Display for OrderSide {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OrderSide::Buy => write!(f, "buy"),
            OrderSide::Sell => write!(f, "sell"),
        }
    }
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
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

impl fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
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
    /// Order side
    pub side: OrderSide,
    /// Order amount
    pub amount: Decimal,
    /// Filled amount
    pub filled: Decimal,
    /// Order price
    pub price: Decimal,
    /// Order status
    pub status: OrderStatus,
    /// Order creation time
    pub created_at: u64,
    /// Order expiry time
    pub expires_at: Option<u64>,
    /// Order maker
    pub maker: String,
}

/// Orderbook error
#[derive(Debug, Error)]
pub enum OrderbookError {
    /// Order not found
    #[error("Order not found: {0}")]
    OrderNotFound(OrderId),
    /// Invalid order
    #[error("Invalid order: {0}")]
    InvalidOrder(String),
    /// Invalid amount
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
    /// Invalid price
    #[error("Invalid price: {0}")]
    InvalidPrice(String),
    /// Invalid asset
    #[error("Invalid asset: {0}")]
    InvalidAsset(String),
    /// Order already exists
    #[error("Order already exists: {0}")]
    OrderAlreadyExists(OrderId),
    /// Order expired
    #[error("Order expired: {0}")]
    OrderExpired(OrderId),
    /// Order cancelled
    #[error("Order cancelled: {0}")]
    OrderCancelled(OrderId),
    /// Order filled
    #[error("Order filled: {0}")]
    OrderFilled(OrderId),
    /// Other error
    #[error("Orderbook error: {0}")]
    Other(String),
}

/// Orderbook
pub struct Orderbook {
    /// Base asset
    base_asset: Asset,
    /// Quote asset
    quote_asset: Asset,
    /// Buy orders
    buy_orders: RwLock<BTreeMap<Decimal, Vec<Order>>>,
    /// Sell orders
    sell_orders: RwLock<BTreeMap<Decimal, Vec<Order>>>,
    /// Orders by ID
    orders_by_id: RwLock<HashMap<OrderId, Order>>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
}

impl Orderbook {
    /// Create a new orderbook
    pub fn new(
        base_asset: Asset,
        quote_asset: Asset,
        event_sender: mpsc::Sender<Event>,
    ) -> Self {
        Self {
            base_asset,
            quote_asset,
            buy_orders: RwLock::new(BTreeMap::new()),
            sell_orders: RwLock::new(BTreeMap::new()),
            orders_by_id: RwLock::new(HashMap::new()),
            event_sender,
        }
    }

    /// Add an order to the orderbook
    pub async fn add_order(&self, order: Order) -> Result<()> {
        // Validate order
        if order.base_asset != self.base_asset {
            return Err(OrderbookError::InvalidAsset(format!(
                "Base asset mismatch: expected {}, got {}",
                self.base_asset, order.base_asset
            ))
            .into());
        }

        if order.quote_asset != self.quote_asset {
            return Err(OrderbookError::InvalidAsset(format!(
                "Quote asset mismatch: expected {}, got {}",
                self.quote_asset, order.quote_asset
            ))
            .into());
        }

        if order.amount <= dec!(0) {
            return Err(OrderbookError::InvalidAmount(format!(
                "Amount must be positive: {}",
                order.amount
            ))
            .into());
        }

        if order.price <= dec!(0) {
            return Err(OrderbookError::InvalidPrice(format!(
                "Price must be positive: {}",
                order.price
            ))
            .into());
        }

        // Check if order already exists
        let orders_by_id = self.orders_by_id.read().await;
        if orders_by_id.contains_key(&order.id) {
            return Err(OrderbookError::OrderAlreadyExists(order.id.clone()).into());
        }
        drop(orders_by_id);

        // Add order to orders by ID
        self.orders_by_id.write().await.insert(order.id.clone(), order.clone());

        // Add order to price level
        match order.side {
            OrderSide::Buy => {
                let mut buy_orders = self.buy_orders.write().await;
                let price_level = buy_orders.entry(order.price).or_insert_with(Vec::new);
                price_level.push(order.clone());
            }
            OrderSide::Sell => {
                let mut sell_orders = self.sell_orders.write().await;
                let price_level = sell_orders.entry(order.price).or_insert_with(Vec::new);
                price_level.push(order.clone());
            }
        }

        // Send event
        self.event_sender
            .send(Event::OrderCreated(order))
            .await
            .context("Failed to send order created event")?;

        Ok(())
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &OrderId) -> Result<()> {
        // Get order
        let mut orders_by_id = self.orders_by_id.write().await;
        let order = orders_by_id
            .get_mut(order_id)
            .ok_or_else(|| OrderbookError::OrderNotFound(order_id.clone()))?;

        // Check if order is already cancelled
        if order.status == OrderStatus::Cancelled {
            return Err(OrderbookError::OrderCancelled(order_id.clone()).into());
        }

        // Check if order is already filled
        if order.status == OrderStatus::Filled {
            return Err(OrderbookError::OrderFilled(order_id.clone()).into());
        }

        // Check if order is already expired
        if order.status == OrderStatus::Expired {
            return Err(OrderbookError::OrderExpired(order_id.clone()).into());
        }

        // Update order status
        order.status = OrderStatus::Cancelled;

        // Remove order from price level
        match order.side {
            OrderSide::Buy => {
                let mut buy_orders = self.buy_orders.write().await;
                if let Some(price_level) = buy_orders.get_mut(&order.price) {
                    price_level.retain(|o| o.id != *order_id);
                    if price_level.is_empty() {
                        buy_orders.remove(&order.price);
                    }
                }
            }
            OrderSide::Sell => {
                let mut sell_orders = self.sell_orders.write().await;
                if let Some(price_level) = sell_orders.get_mut(&order.price) {
                    price_level.retain(|o| o.id != *order_id);
                    if price_level.is_empty() {
                        sell_orders.remove(&order.price);
                    }
                }
            }
        }

        // Send event
        self.event_sender
            .send(Event::OrderCancelled(order_id.clone()))
            .await
            .context("Failed to send order cancelled event")?;

        Ok(())
    }

    /// Get an order by ID
    pub async fn get_order(&self, order_id: &OrderId) -> Result<Order> {
        // Get order
        let orders_by_id = self.orders_by_id.read().await;
        let order = orders_by_id
            .get(order_id)
            .ok_or_else(|| OrderbookError::OrderNotFound(order_id.clone()))?;

        Ok(order.clone())
    }

    /// Get all orders
    pub async fn get_orders(&self) -> Vec<Order> {
        // Get orders
        let orders_by_id = self.orders_by_id.read().await;
        orders_by_id.values().cloned().collect()
    }

    /// Get buy orders
    pub async fn get_buy_orders(&self) -> Vec<Order> {
        // Get buy orders
        let buy_orders = self.buy_orders.read().await;
        buy_orders
            .values()
            .flat_map(|orders| orders.iter().cloned())
            .collect()
    }

    /// Get sell orders
    pub async fn get_sell_orders(&self) -> Vec<Order> {
        // Get sell orders
        let sell_orders = self.sell_orders.read().await;
        sell_orders
            .values()
            .flat_map(|orders| orders.iter().cloned())
            .collect()
    }

    /// Get best buy price
    pub async fn get_best_buy_price(&self) -> Option<Decimal> {
        // Get buy orders
        let buy_orders = self.buy_orders.read().await;
        buy_orders.keys().next_back().cloned()
    }

    /// Get best sell price
    pub async fn get_best_sell_price(&self) -> Option<Decimal> {
        // Get sell orders
        let sell_orders = self.sell_orders.read().await;
        sell_orders.keys().next().cloned()
    }

    /// Clean expired orders
    pub async fn clean_expired_orders(&self) -> Result<()> {
        // Get current time
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .context("Failed to get current time")?
            .as_secs();

        // Get orders
        let mut orders_by_id = self.orders_by_id.write().await;
        let mut expired_orders = Vec::new();

        for (order_id, order) in orders_by_id.iter_mut() {
            if let Some(expires_at) = order.expires_at {
                if expires_at <= now && order.status == OrderStatus::Open {
                    // Order is expired
                    order.status = OrderStatus::Expired;
                    expired_orders.push((order_id.clone(), order.price, order.side));
                }
            }
        }

        // Remove expired orders from price levels
        for (order_id, price, side) in &expired_orders {
            match side {
                OrderSide::Buy => {
                    let mut buy_orders = self.buy_orders.write().await;
                    if let Some(price_level) = buy_orders.get_mut(price) {
                        price_level.retain(|o| o.id != *order_id);
                        if price_level.is_empty() {
                            buy_orders.remove(price);
                        }
                    }
                }
                OrderSide::Sell => {
                    let mut sell_orders = self.sell_orders.write().await;
                    if let Some(price_level) = sell_orders.get_mut(price) {
                        price_level.retain(|o| o.id != *order_id);
                        if price_level.is_empty() {
                            sell_orders.remove(price);
                        }
                    }
                }
            }
        }

        // Send events
        for (order_id, _, _) in expired_orders {
            self.event_sender
                .send(Event::OrderExpired(order_id))
                .await
                .context("Failed to send order expired event")?;
        }

        Ok(())
    }
}

/// Orderbook manager
pub struct OrderbookManager {
    /// Orderbooks
    orderbooks: RwLock<HashMap<(Asset, Asset), Arc<Orderbook>>>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
}

impl OrderbookManager {
    /// Create a new orderbook manager
    pub fn new(event_sender: mpsc::Sender<Event>) -> Self {
        Self {
            orderbooks: RwLock::new(HashMap::new()),
            event_sender,
        }
    }

    /// Get or create an orderbook
    pub async fn get_or_create_orderbook(
        &self,
        base_asset: Asset,
        quote_asset: Asset,
    ) -> Arc<Orderbook> {
        let mut orderbooks = self.orderbooks.write().await;
        let key = (base_asset.clone(), quote_asset.clone());

        if let Some(orderbook) = orderbooks.get(&key) {
            orderbook.clone()
        } else {
            let orderbook = Arc::new(Orderbook::new(
                base_asset,
                quote_asset,
                self.event_sender.clone(),
            ));
            orderbooks.insert(key, orderbook.clone());
            orderbook
        }
    }

    /// Get an orderbook
    pub async fn get_orderbook(
        &self,
        base_asset: &Asset,
        quote_asset: &Asset,
    ) -> Option<Arc<Orderbook>> {
        let orderbooks = self.orderbooks.read().await;
        let key = (base_asset.clone(), quote_asset.clone());
        orderbooks.get(&key).cloned()
    }

    /// Get all orderbooks
    pub async fn get_orderbooks(&self) -> Vec<Arc<Orderbook>> {
        let orderbooks = self.orderbooks.read().await;
        orderbooks.values().cloned().collect()
    }

    /// Clean expired orders
    pub async fn clean_expired_orders(&self) -> Result<()> {
        let orderbooks = self.orderbooks.read().await;
        for orderbook in orderbooks.values() {
            orderbook.clean_expired_orders().await?;
        }
        Ok(())
    }
}