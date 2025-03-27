//! Orderbook management for DarkSwap
//!
//! This module provides orderbook management functionality for DarkSwap, including
//! order creation, matching, and management.

use crate::error::{Error, Result};
use crate::types::{Asset, OrderId, PeerId};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Order side (buy or sell)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderSide {
    /// Buy order
    Buy,
    /// Sell order
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

impl std::str::FromStr for OrderSide {
    type Err = crate::error::Error;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "buy" => Ok(OrderSide::Buy),
            "sell" => Ok(OrderSide::Sell),
            _ => Err(crate::error::Error::InvalidOrderSide(s.to_string())),
        }
    }
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum OrderStatus {
    /// Open order
    Open,
    /// Filled order
    Filled,
    /// Canceled order
    Canceled,
    /// Expired order
    Expired,
}

/// Order data structure
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Order {
    /// Order ID
    pub id: OrderId,
    /// Maker peer ID
    pub maker: PeerId,
    /// Base asset
    pub base_asset: Asset,
    /// Quote asset
    pub quote_asset: Asset,
    /// Order side
    pub side: OrderSide,
    /// Order amount
    pub amount: Decimal,
    /// Order price
    pub price: Decimal,
    /// Order status
    pub status: OrderStatus,
    /// Order timestamp
    pub timestamp: u64,
    /// Order expiry
    pub expiry: u64,
}

impl Order {
    /// Create a new order
    pub fn new(
        maker: PeerId,
        base_asset: Asset,
        quote_asset: Asset,
        side: OrderSide,
        amount: Decimal,
        price: Decimal,
        expiry: u64,
    ) -> Self {
        let id = OrderId::new();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            id,
            maker,
            base_asset,
            quote_asset,
            side,
            amount,
            price,
            status: OrderStatus::Open,
            timestamp,
            expiry,
        }
    }

    /// Check if the order is expired
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        now >= self.expiry
    }

    /// Get the total value of the order
    pub fn total_value(&self) -> Decimal {
        self.amount * self.price
    }

    /// Cancel the order
    pub fn cancel(&mut self) {
        self.status = OrderStatus::Canceled;
    }

    /// Check if the order can be matched with another order
    pub fn can_match(&self, other: &Order) -> bool {
        // Orders must be for the same assets
        if self.base_asset != other.base_asset || self.quote_asset != other.quote_asset {
            return false;
        }

        // Orders must be on opposite sides
        if self.side == other.side {
            return false;
        }

        // Orders must be open
        if self.status != OrderStatus::Open || other.status != OrderStatus::Open {
            return false;
        }

        // Check if the prices match
        match self.side {
            OrderSide::Buy => self.price >= other.price,
            OrderSide::Sell => self.price <= other.price,
        }
    }
}

/// Orderbook data structure
#[derive(Debug)]
pub struct Orderbook {
    /// Orders by ID
    orders: HashMap<OrderId, Order>,
    /// Buy orders by asset pair
    buy_orders: HashMap<(Asset, Asset), Vec<OrderId>>,
    /// Sell orders by asset pair
    sell_orders: HashMap<(Asset, Asset), Vec<OrderId>>,
    /// Orders by maker
    maker_orders: HashMap<PeerId, HashSet<OrderId>>,
    /// Last cleanup time
    last_cleanup: u64,
}

impl Orderbook {
    /// Create a new orderbook
    pub fn new() -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            orders: HashMap::new(),
            buy_orders: HashMap::new(),
            sell_orders: HashMap::new(),
            maker_orders: HashMap::new(),
            last_cleanup: now,
        }
    }

    /// Add an order to the orderbook
    pub fn add_order(&mut self, order: Order) {
        let order_id = order.id.clone();
        let maker = order.maker.clone();
        let base_asset = order.base_asset.clone();
        let quote_asset = order.quote_asset.clone();
        let side = order.side;

        // Add the order to the orders map
        self.orders.insert(order_id.clone(), order);

        // Add the order to the appropriate side map
        let side_map = match side {
            OrderSide::Buy => &mut self.buy_orders,
            OrderSide::Sell => &mut self.sell_orders,
        };

        let asset_pair = (base_asset, quote_asset);
        let orders = side_map.entry(asset_pair).or_insert_with(Vec::new);
        orders.push(order_id.clone());

        // Add the order to the maker's orders
        let maker_orders = self.maker_orders.entry(maker).or_insert_with(HashSet::new);
        maker_orders.insert(order_id);

        // Sort the orders by price (best price first)
        self.sort_orders();
    }

    /// Remove an order from the orderbook
    pub fn remove_order(&mut self, order_id: &OrderId) {
        if let Some(order) = self.orders.remove(order_id) {
            // Remove the order from the appropriate side map
            let side_map = match order.side {
                OrderSide::Buy => &mut self.buy_orders,
                OrderSide::Sell => &mut self.sell_orders,
            };

            let asset_pair = (order.base_asset, order.quote_asset);
            if let Some(orders) = side_map.get_mut(&asset_pair) {
                orders.retain(|id| id != order_id);
            }

            // Remove the order from the maker's orders
            if let Some(maker_orders) = self.maker_orders.get_mut(&order.maker) {
                maker_orders.remove(order_id);
            }
        }
    }

    /// Get an order by ID
    pub fn get_order(&self, order_id: &OrderId) -> Option<&Order> {
        self.orders.get(order_id)
    }

    /// Cancel an order by ID
    pub fn cancel_order(&mut self, order_id: &OrderId) -> Result<()> {
        let order = self.orders.get_mut(order_id)
            .ok_or_else(|| Error::OrderNotFound(order_id.to_string()))?;
        
        // Update order status
        order.status = OrderStatus::Canceled;
        
        Ok(())
    }

    /// Get all orders for a given asset pair
    pub fn get_orders(&self, base_asset: &Asset, quote_asset: &Asset) -> Vec<Order> {
        let asset_pair = (base_asset.clone(), quote_asset.clone());
        let mut orders = Vec::new();

        // Get buy orders
        if let Some(buy_order_ids) = self.buy_orders.get(&asset_pair) {
            for order_id in buy_order_ids {
                if let Some(order) = self.orders.get(order_id) {
                    orders.push(order.clone());
                }
            }
        }

        // Get sell orders
        if let Some(sell_order_ids) = self.sell_orders.get(&asset_pair) {
            for order_id in sell_order_ids {
                if let Some(order) = self.orders.get(order_id) {
                    orders.push(order.clone());
                }
            }
        }

        orders
    }

    /// Get the best bid and ask for a given asset pair
    pub fn get_best_bid_ask(&self, base_asset: &Asset, quote_asset: &Asset) -> (Option<Decimal>, Option<Decimal>) {
        let asset_pair = (base_asset.clone(), quote_asset.clone());
        let mut best_bid = None;
        let mut best_ask = None;

        // Get the best bid (highest buy price)
        if let Some(buy_order_ids) = self.buy_orders.get(&asset_pair) {
            for order_id in buy_order_ids {
                if let Some(order) = self.orders.get(order_id) {
                    if order.status == OrderStatus::Open {
                        match best_bid {
                            Some(bid) if order.price > bid => best_bid = Some(order.price),
                            None => best_bid = Some(order.price),
                            _ => {}
                        }
                    }
                }
            }
        }

        // Get the best ask (lowest sell price)
        if let Some(sell_order_ids) = self.sell_orders.get(&asset_pair) {
            for order_id in sell_order_ids {
                if let Some(order) = self.orders.get(order_id) {
                    if order.status == OrderStatus::Open {
                        match best_ask {
                            Some(ask) if order.price < ask => best_ask = Some(order.price),
                            None => best_ask = Some(order.price),
                            _ => {}
                        }
                    }
                }
            }
        }

        (best_bid, best_ask)
    }

    /// Get all orders for a given maker
    pub fn get_maker_orders(&self, maker: &PeerId) -> Vec<Order> {
        let mut orders = Vec::new();

        if let Some(order_ids) = self.maker_orders.get(maker) {
            for order_id in order_ids {
                if let Some(order) = self.orders.get(order_id) {
                    orders.push(order.clone());
                }
            }
        }

        orders
    }

    /// Match an order with existing orders
    pub fn match_order(&mut self, order: &Order) -> Vec<Order> {
        let mut matches = Vec::new();

        // Get the appropriate side map to match against
        let side_map = match order.side {
            OrderSide::Buy => &self.sell_orders,
            OrderSide::Sell => &self.buy_orders,
        };

        let asset_pair = (order.base_asset.clone(), order.quote_asset.clone());
        if let Some(order_ids) = side_map.get(&asset_pair) {
            for order_id in order_ids {
                if let Some(other_order) = self.orders.get(order_id) {
                    if order.can_match(other_order) {
                        matches.push(other_order.clone());
                    }
                }
            }
        }

        // Sort matches by price (best price first)
        matches.sort_by(|a, b| {
            match order.side {
                OrderSide::Buy => b.price.cmp(&a.price), // For buy orders, sort by lowest sell price
                OrderSide::Sell => a.price.cmp(&b.price), // For sell orders, sort by highest buy price
            }
        });

        matches
    }

    /// Clean up expired orders
    pub fn cleanup_expired_orders(&mut self) -> Vec<Order> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        // Only clean up every 60 seconds
        if now - self.last_cleanup < 60 {
            return Vec::new();
        }

        self.last_cleanup = now;
        let mut expired_orders = Vec::new();

        // Find expired orders
        let expired_order_ids: Vec<OrderId> = self.orders
            .iter()
            .filter(|(_, order)| order.is_expired() && order.status == OrderStatus::Open)
            .map(|(order_id, order)| {
                expired_orders.push(order.clone());
                order_id.clone()
            })
            .collect();

        // Remove expired orders
        for order_id in expired_order_ids {
            self.remove_order(&order_id);
        }

        expired_orders
    }

    /// Sort orders by price
    fn sort_orders(&mut self) {
        // Sort buy orders by price (highest first)
        for (_, order_ids) in self.buy_orders.iter_mut() {
            order_ids.sort_by(|a, b| {
                let order_a = self.orders.get(a).unwrap();
                let order_b = self.orders.get(b).unwrap();
                order_b.price.cmp(&order_a.price)
            });
        }

        // Sort sell orders by price (lowest first)
        for (_, order_ids) in self.sell_orders.iter_mut() {
            order_ids.sort_by(|a, b| {
                let order_a = self.orders.get(a).unwrap();
                let order_b = self.orders.get(b).unwrap();
                order_a.price.cmp(&order_b.price)
            });
        }
    }
}

/// Thread-safe orderbook
pub struct ThreadSafeOrderbook {
    /// Inner orderbook
    inner: Arc<Mutex<Orderbook>>,
}

impl ThreadSafeOrderbook {
    /// Create a new thread-safe orderbook
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(Orderbook::new())),
        }
    }

    /// Add an order to the orderbook
    pub fn add_order(&self, order: Order) -> Result<()> {
        let mut orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        orderbook.add_order(order);
        Ok(())
    }

    /// Remove an order from the orderbook
    pub fn remove_order(&self, order_id: &OrderId) -> Result<()> {
        let mut orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        orderbook.remove_order(order_id);
        Ok(())
    }

    /// Get an order by ID
    pub fn get_order(&self, order_id: &OrderId) -> Result<Option<Order>> {
        let orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        Ok(orderbook.get_order(order_id).cloned())
    }

    /// Get all orders for a given asset pair
    pub fn get_orders(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<Vec<Order>> {
        let orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        Ok(orderbook.get_orders(base_asset, quote_asset))
    }

    /// Get the best bid and ask for a given asset pair
    pub fn get_best_bid_ask(&self, base_asset: &Asset, quote_asset: &Asset) -> Result<(Option<Decimal>, Option<Decimal>)> {
        let orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        Ok(orderbook.get_best_bid_ask(base_asset, quote_asset))
    }

    /// Get all orders for a given maker
    pub fn get_maker_orders(&self, maker: &PeerId) -> Result<Vec<Order>> {
        let orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        Ok(orderbook.get_maker_orders(maker))
    }

    /// Match an order with existing orders
    pub fn match_order(&self, order: &Order) -> Result<Vec<Order>> {
        let mut orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        Ok(orderbook.match_order(order))
    }

    /// Clean up expired orders
    pub fn cleanup_expired_orders(&self) -> Result<Vec<Order>> {
        let mut orderbook = self.inner.lock().map_err(|_| Error::OrderbookLockError)?;
        Ok(orderbook.cleanup_expired_orders())
    }
}

impl Clone for ThreadSafeOrderbook {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_order_creation() {
        let maker = PeerId("test_maker".to_string());
        let base_asset = Asset::Bitcoin;
        let quote_asset = Asset::Rune(123456789);
        let side = OrderSide::Buy;
        let amount = Decimal::new(100, 0);
        let price = Decimal::new(50000, 0);
        let expiry = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600; // 1 hour from now

        let order = Order::new(
            maker.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            side,
            amount,
            price,
            expiry,
        );

        assert_eq!(order.maker, maker);
        assert_eq!(order.base_asset, base_asset);
        assert_eq!(order.quote_asset, quote_asset);
        assert_eq!(order.side, side);
        assert_eq!(order.amount, amount);
        assert_eq!(order.price, price);
        assert_eq!(order.status, OrderStatus::Open);
        assert!(order.expiry > 0);
    }

    #[test]
    fn test_order_matching() {
        let maker1 = PeerId("maker1".to_string());
        let maker2 = PeerId("maker2".to_string());
        let base_asset = Asset::Bitcoin;
        let quote_asset = Asset::Rune(123456789);
        let expiry = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600; // 1 hour from now

        // Create a buy order
        let buy_order = Order::new(
            maker1.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Buy,
            Decimal::new(100, 0),
            Decimal::new(50000, 0),
            expiry,
        );

        // Create a matching sell order
        let matching_sell_order = Order::new(
            maker2.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Sell,
            Decimal::new(100, 0),
            Decimal::new(50000, 0),
            expiry,
        );

        // Create a non-matching sell order (price too high)
        let non_matching_sell_order = Order::new(
            maker2.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Sell,
            Decimal::new(100, 0),
            Decimal::new(60000, 0),
            expiry,
        );

        assert!(buy_order.can_match(&matching_sell_order));
        assert!(!buy_order.can_match(&non_matching_sell_order));
    }

    #[test]
    fn test_orderbook() {
        let mut orderbook = Orderbook::new();
        let maker1 = PeerId("maker1".to_string());
        let maker2 = PeerId("maker2".to_string());
        let base_asset = Asset::Bitcoin;
        let quote_asset = Asset::Rune(123456789);
        let expiry = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() + 3600; // 1 hour from now

        // Create a buy order
        let buy_order = Order::new(
            maker1.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Buy,
            Decimal::new(100, 0),
            Decimal::new(50000, 0),
            expiry,
        );
        let buy_order_id = buy_order.id.clone();

        // Create a sell order
        let sell_order = Order::new(
            maker2.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Sell,
            Decimal::new(100, 0),
            Decimal::new(55000, 0),
            expiry,
        );
        let sell_order_id = sell_order.id.clone();

        // Add orders to the orderbook
        orderbook.add_order(buy_order.clone());
        orderbook.add_order(sell_order.clone());

        // Test get_order
        assert_eq!(orderbook.get_order(&buy_order_id), Some(&buy_order));
        assert_eq!(orderbook.get_order(&sell_order_id), Some(&sell_order));

        // Test get_orders
        let orders = orderbook.get_orders(&base_asset, &quote_asset);
        assert_eq!(orders.len(), 2);
        assert!(orders.contains(&buy_order));
        assert!(orders.contains(&sell_order));

        // Test get_best_bid_ask
        let (bid, ask) = orderbook.get_best_bid_ask(&base_asset, &quote_asset);
        assert_eq!(bid, Some(Decimal::new(50000, 0)));
        assert_eq!(ask, Some(Decimal::new(55000, 0)));

        // Test get_maker_orders
        let maker1_orders = orderbook.get_maker_orders(&maker1);
        assert_eq!(maker1_orders.len(), 1);
        assert_eq!(maker1_orders[0], buy_order);

        let maker2_orders = orderbook.get_maker_orders(&maker2);
        assert_eq!(maker2_orders.len(), 1);
        assert_eq!(maker2_orders[0], sell_order);

        // Test match_order
        let new_buy_order = Order::new(
            maker1.clone(),
            base_asset.clone(),
            quote_asset.clone(),
            OrderSide::Buy,
            Decimal::new(100, 0),
            Decimal::new(60000, 0),
            expiry,
        );
        let matches = orderbook.match_order(&new_buy_order);
        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0], sell_order);

        // Test remove_order
        orderbook.remove_order(&buy_order_id);
        assert_eq!(orderbook.get_order(&buy_order_id), None);
        let orders = orderbook.get_orders(&base_asset, &quote_asset);
        assert_eq!(orders.len(), 1);
        assert!(orders.contains(&sell_order));
    }
}