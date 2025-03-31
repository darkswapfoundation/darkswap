//! Orderbook module for DarkSwap
//!
//! This module provides orderbook functionality for DarkSwap, including order creation,
//! cancellation, and matching.

mod runes_alkanes;

use std::collections::{BTreeMap, HashMap};
use std::fmt;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context as AnyhowContext, Result};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

use crate::p2p::P2PNetwork;
use crate::types::{Asset, Event};
use crate::wallet::WalletInterface;

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

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open
    Open,
    /// Filled
    Filled,
    /// Canceled
    Canceled,
    /// Expired
    Expired,
}

/// Order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    /// Order ID
    pub id: OrderId,
    /// Maker peer ID
    pub maker: String,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Order side
    pub side: OrderSide,
    /// Amount
    pub amount: Decimal,
    /// Price
    pub price: Decimal,
    /// Status
    pub status: OrderStatus,
    /// Created timestamp
    pub timestamp: u64,
    /// Expiry timestamp
    pub expiry: u64,
}

impl Order {
    /// Create a new order
    pub fn new(
        maker: String,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let expiry_time = match expiry {
            Some(expiry) => now + expiry,
            None => now + 86400, // Default expiry: 24 hours
        };
        
        Self {
            id: OrderId(Uuid::new_v4().to_string()),
            maker,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status: OrderStatus::Open,
            timestamp: now,
            expiry: expiry_time,
        }
    }

    /// Check if the order is expired
    pub fn is_expired(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        self.expiry < now
    }

    /// Get the total value of the order
    pub fn total_value(&self) -> Decimal {
        self.amount * self.price
    }
}

/// Orderbook error
#[derive(Debug, Error)]
pub enum OrderbookError {
    /// Order not found
    #[error("Order not found: {0}")]
    NotFound(OrderId),
    /// Invalid order
    #[error("Invalid order: {0}")]
    InvalidOrder(String),
    /// Insufficient funds
    #[error("Insufficient funds")]
    InsufficientFunds,
    /// Network error
    #[error("Network error: {0}")]
    NetworkError(String),
    /// Other error
    #[error("Orderbook error: {0}")]
    Other(String),
}

/// Order message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrderMessage {
    /// New order
    NewOrder(Order),
    /// Cancel order
    CancelOrder {
        /// Order ID
        order_id: OrderId,
        /// Maker peer ID
        maker: String,
    },
    /// Update order
    UpdateOrder {
        /// Order ID
        order_id: OrderId,
        /// Maker peer ID
        maker: String,
        /// New amount
        amount: Decimal,
    },
}

/// Orderbook
pub struct Orderbook {
    /// Orders by ID
    orders: Arc<RwLock<HashMap<OrderId, Order>>>,
    /// Buy orders by price (highest first)
    buy_orders: Arc<RwLock<BTreeMap<Decimal, Vec<OrderId>>>>,
    /// Sell orders by price (lowest first)
    sell_orders: Arc<RwLock<BTreeMap<Decimal, Vec<OrderId>>>>,
    /// P2P network
    network: Arc<RwLock<P2PNetwork>>,
    /// Wallet
    wallet: Arc<dyn WalletInterface>,
    /// Event sender
    event_sender: mpsc::Sender<Event>,
    /// Order topic
    order_topic: String,
}

impl Orderbook {
    /// Create a new orderbook
    pub fn new(
        network: Arc<RwLock<P2PNetwork>>,
        wallet: Arc<dyn WalletInterface>,
        event_sender: mpsc::Sender<Event>,
    ) -> Self {
        Self {
            orders: Arc::new(RwLock::new(HashMap::new())),
            buy_orders: Arc::new(RwLock::new(BTreeMap::new())),
            sell_orders: Arc::new(RwLock::new(BTreeMap::new())),
            network,
            wallet,
            event_sender,
            order_topic: "darkswap/orders/v1".to_string(),
        }
    }

    /// Start the orderbook
    pub async fn start(&self) -> Result<()> {
        // Subscribe to order topic
        let mut network = self.network.write().await;
        network.subscribe(&self.order_topic).await?;
        
        // Start order expiry checker
        self.start_expiry_checker().await?;
        
        Ok(())
    }

    /// Start order expiry checker
    async fn start_expiry_checker(&self) -> Result<()> {
        let orders = self.orders.clone();
        let buy_orders = self.buy_orders.clone();
        let sell_orders = self.sell_orders.clone();
        let event_sender = self.event_sender.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            
            loop {
                interval.tick().await;
                
                // Check for expired orders
                let mut orders_write = orders.write().await;
                let mut buy_orders_write = buy_orders.write().await;
                let mut sell_orders_write = sell_orders.write().await;
                
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                let mut expired_orders = Vec::new();
                
                for (order_id, order) in orders_write.iter_mut() {
                    if order.expiry < now && order.status == OrderStatus::Open {
                        // Update order status
                        order.status = OrderStatus::Expired;
                        expired_orders.push(order_id.clone());
                        
                        // Send event
                        let _ = event_sender
                            .send(Event::OrderExpired(order_id.clone()))
                            .await;
                    }
                }
                
                // Remove expired orders from price maps
                for order_id in &expired_orders {
                    if let Some(order) = orders_write.get(order_id) {
                        match order.side {
                            OrderSide::Buy => {
                                if let Some(orders_at_price) = buy_orders_write.get_mut(&order.price) {
                                    orders_at_price.retain(|id| id != order_id);
                                    if orders_at_price.is_empty() {
                                        buy_orders_write.remove(&order.price);
                                    }
                                }
                            }
                            OrderSide::Sell => {
                                if let Some(orders_at_price) = sell_orders_write.get_mut(&order.price) {
                                    orders_at_price.retain(|id| id != order_id);
                                    if orders_at_price.is_empty() {
                                        sell_orders_write.remove(&order.price);
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

    /// Create a new order
    pub async fn create_order(
        &self,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: Option<u64>,
    ) -> Result<Order> {
        // Check if amount and price are valid
        if amount <= Decimal::ZERO {
            return Err(OrderbookError::InvalidOrder("Amount must be positive".to_string()).into());
        }
        
        if price <= Decimal::ZERO {
            return Err(OrderbookError::InvalidOrder("Price must be positive".to_string()).into());
        }
        
        // Get local peer ID
        let network = self.network.read().await;
        let local_peer_id = network.local_peer_id().to_string();
        
        // Create order
        let order = Order::new(
            local_peer_id,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            expiry,
        );
        
        // Store order
        let mut orders = self.orders.write().await;
        orders.insert(order.id.clone(), order.clone());
        
        // Add to price map
        match side {
            OrderSide::Buy => {
                let mut buy_orders = self.buy_orders.write().await;
                buy_orders
                    .entry(price)
                    .or_insert_with(Vec::new)
                    .push(order.id.clone());
            }
            OrderSide::Sell => {
                let mut sell_orders = self.sell_orders.write().await;
                sell_orders
                    .entry(price)
                    .or_insert_with(Vec::new)
                    .push(order.id.clone());
            }
        }
        
        // Send event
        let _ = self.event_sender
            .send(Event::OrderCreated(order.clone()))
            .await;
        
        // Broadcast order
        self.broadcast_order(&order).await?;
        
        Ok(order)
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &OrderId) -> Result<()> {
        // Get order
        let mut orders = self.orders.write().await;
        let order = orders.get_mut(order_id)
            .ok_or_else(|| OrderbookError::NotFound(order_id.clone()))?;
        
        // Check if order can be canceled
        if order.status != OrderStatus::Open {
            return Err(OrderbookError::InvalidOrder(format!("Order is not open: {:?}", order.status)).into());
        }
        
        // Get local peer ID
        let network = self.network.read().await;
        let local_peer_id = network.local_peer_id().to_string();
        
        // Check if user is the maker
        if order.maker != local_peer_id {
            return Err(OrderbookError::InvalidOrder("Only the maker can cancel an order".to_string()).into());
        }
        
        // Update order status
        order.status = OrderStatus::Canceled;
        
        // Remove from price map
        match order.side {
            OrderSide::Buy => {
                let mut buy_orders = self.buy_orders.write().await;
                if let Some(orders_at_price) = buy_orders.get_mut(&order.price) {
                    orders_at_price.retain(|id| id != order_id);
                    if orders_at_price.is_empty() {
                        buy_orders.remove(&order.price);
                    }
                }
            }
            OrderSide::Sell => {
                let mut sell_orders = self.sell_orders.write().await;
                if let Some(orders_at_price) = sell_orders.get_mut(&order.price) {
                    orders_at_price.retain(|id| id != order_id);
                    if orders_at_price.is_empty() {
                        sell_orders.remove(&order.price);
                    }
                }
            }
        }
        
        // Send event
        let _ = self.event_sender
            .send(Event::OrderCancelled(order_id.clone()))
            .await;
        
        // Broadcast cancel message
        self.broadcast_cancel_order(order_id, &local_peer_id).await?;
        
        Ok(())
    }

    /// Get an order by ID
    pub async fn get_order(&self, order_id: &OrderId) -> Result<Order> {
        let orders = self.orders.read().await;
        orders.get(order_id)
            .cloned()
            .ok_or_else(|| OrderbookError::NotFound(order_id.clone()).into())
    }

    /// Get orders for a pair
    pub async fn get_orders(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<Vec<Order>> {
        let orders = self.orders.read().await;
        
        let filtered_orders = orders.values()
            .filter(|order| {
                order.base_asset == *base_asset && 
                order.quote_asset == *quote_asset &&
                order.status == OrderStatus::Open
            })
            .cloned()
            .collect();
        
        Ok(filtered_orders)
    }

    /// Get best bid and ask for a pair
    pub async fn get_best_bid_ask(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<(Option<Decimal>, Option<Decimal>)> {
        let orders = self.orders.read().await;
        let buy_orders = self.buy_orders.read().await;
        let sell_orders = self.sell_orders.read().await;
        
        // Find best bid (highest buy price)
        let mut best_bid = None;
        for (price, order_ids) in buy_orders.iter().rev() {
            for order_id in order_ids {
                if let Some(order) = orders.get(order_id) {
                    if order.base_asset == *base_asset && 
                       order.quote_asset == *quote_asset &&
                       order.status == OrderStatus::Open {
                        best_bid = Some(*price);
                        break;
                    }
                }
            }
            if best_bid.is_some() {
                break;
            }
        }
        
        // Find best ask (lowest sell price)
        let mut best_ask = None;
        for (price, order_ids) in sell_orders.iter() {
            for order_id in order_ids {
                if let Some(order) = orders.get(order_id) {
                    if order.base_asset == *base_asset && 
                       order.quote_asset == *quote_asset &&
                       order.status == OrderStatus::Open {
                        best_ask = Some(*price);
                        break;
                    }
                }
            }
            if best_ask.is_some() {
                break;
            }
        }
        
        Ok((best_bid, best_ask))
    }

    /// Handle order message
    pub async fn handle_order_message(
        &self,
        message: OrderMessage,
        peer_id: &str,
    ) -> Result<()> {
        match message {
            OrderMessage::NewOrder(order) => {
                // Check if order is valid
                if order.maker != peer_id {
                    return Err(OrderbookError::InvalidOrder("Order maker does not match peer ID".to_string()).into());
                }
                
                if order.amount <= Decimal::ZERO {
                    return Err(OrderbookError::InvalidOrder("Amount must be positive".to_string()).into());
                }
                
                if order.price <= Decimal::ZERO {
                    return Err(OrderbookError::InvalidOrder("Price must be positive".to_string()).into());
                }
                
                // Check if order is expired
                if order.is_expired() {
                    return Ok(());
                }
                
                // Store order
                let mut orders = self.orders.write().await;
                
                // Check if order already exists
                if orders.contains_key(&order.id) {
                    return Ok(());
                }
                
                orders.insert(order.id.clone(), order.clone());
                
                // Add to price map
                match order.side {
                    OrderSide::Buy => {
                        let mut buy_orders = self.buy_orders.write().await;
                        buy_orders
                            .entry(order.price)
                            .or_insert_with(Vec::new)
                            .push(order.id.clone());
                    }
                    OrderSide::Sell => {
                        let mut sell_orders = self.sell_orders.write().await;
                        sell_orders
                            .entry(order.price)
                            .or_insert_with(Vec::new)
                            .push(order.id.clone());
                    }
                }
                
                // Send event
                let _ = self.event_sender
                    .send(Event::OrderCreated(order))
                    .await;
            }
            OrderMessage::CancelOrder { order_id, maker } => {
                // Check if maker matches peer ID
                if maker != peer_id {
                    return Err(OrderbookError::InvalidOrder("Order maker does not match peer ID".to_string()).into());
                }
                
                // Get order
                let mut orders = self.orders.write().await;
                let order = match orders.get_mut(&order_id) {
                    Some(order) => order,
                    None => return Ok(()),
                };
                
                // Check if maker matches
                if order.maker != maker {
                    return Err(OrderbookError::InvalidOrder("Order maker does not match".to_string()).into());
                }
                
                // Update order status
                order.status = OrderStatus::Canceled;
                
                // Remove from price map
                match order.side {
                    OrderSide::Buy => {
                        let mut buy_orders = self.buy_orders.write().await;
                        if let Some(orders_at_price) = buy_orders.get_mut(&order.price) {
                            orders_at_price.retain(|id| id != &order_id);
                            if orders_at_price.is_empty() {
                                buy_orders.remove(&order.price);
                            }
                        }
                    }
                    OrderSide::Sell => {
                        let mut sell_orders = self.sell_orders.write().await;
                        if let Some(orders_at_price) = sell_orders.get_mut(&order.price) {
                            orders_at_price.retain(|id| id != &order_id);
                            if orders_at_price.is_empty() {
                                sell_orders.remove(&order.price);
                            }
                        }
                    }
                }
                
                // Send event
                let _ = self.event_sender
                    .send(Event::OrderCancelled(order_id))
                    .await;
            }
            OrderMessage::UpdateOrder { order_id, maker, amount } => {
                // Check if maker matches peer ID
                if maker != peer_id {
                    return Err(OrderbookError::InvalidOrder("Order maker does not match peer ID".to_string()).into());
                }
                
                // Check if amount is valid
                if amount <= Decimal::ZERO {
                    return Err(OrderbookError::InvalidOrder("Amount must be positive".to_string()).into());
                }
                
                // Get order
                let mut orders = self.orders.write().await;
                let order = match orders.get_mut(&order_id) {
                    Some(order) => order,
                    None => return Ok(()),
                };
                
                // Check if maker matches
                if order.maker != maker {
                    return Err(OrderbookError::InvalidOrder("Order maker does not match".to_string()).into());
                }
                
                // Check if order is open
                if order.status != OrderStatus::Open {
                    return Err(OrderbookError::InvalidOrder(format!("Order is not open: {:?}", order.status)).into());
                }
                
                // Update amount
                order.amount = amount;
                
                // Send event
                let _ = self.event_sender
                    .send(Event::OrderUpdated(order.clone()))
                    .await;
            }
        }
        
        Ok(())
    }

    /// Broadcast an order
    async fn broadcast_order(&self, order: &Order) -> Result<()> {
        // Create order message
        let message = OrderMessage::NewOrder(order.clone());
        
        // Serialize message
        let message_data = serde_json::to_vec(&message)
            .context("Failed to serialize order message")?;
        
        // Publish message to order topic
        let mut network = self.network.write().await;
        network.publish(&self.order_topic, message_data).await?;
        
        Ok(())
    }

    /// Broadcast cancel order
    async fn broadcast_cancel_order(&self, order_id: &OrderId, maker: &str) -> Result<()> {
        // Create cancel message
        let message = OrderMessage::CancelOrder {
            order_id: order_id.clone(),
            maker: maker.to_string(),
        };
        
        // Serialize message
        let message_data = serde_json::to_vec(&message)
            .context("Failed to serialize cancel order message")?;
        
        // Publish message to order topic
        let mut network = self.network.write().await;
        network.publish(&self.order_topic, message_data).await?;
        
        Ok(())
    }
}