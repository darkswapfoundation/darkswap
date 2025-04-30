//! Trading bot example
//!
//! This example demonstrates how to create a simple trading bot using the DarkSwap SDK.

use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::Result;
use darkswap_sdk::{
    config::Config,
    orderbook::{Order, OrderId, OrderSide, OrderStatus},
    types::{Asset, Event},
    DarkSwap,
};
use rust_decimal::Decimal;
use tokio::sync::Mutex;
use tokio::time::sleep;

/// Trading bot
struct TradingBot {
    /// DarkSwap instance
    darkswap: DarkSwap,
    /// Base asset
    base_asset: Asset,
    /// Quote asset
    quote_asset: Asset,
    /// Minimum spread (percentage)
    min_spread: Decimal,
    /// Maximum order amount
    max_order_amount: Decimal,
    /// Order expiry (seconds)
    order_expiry: u64,
    /// Active orders
    active_orders: Arc<Mutex<HashMap<OrderId, Order>>>,
    /// Last update time
    last_update: Arc<Mutex<Instant>>,
    /// Update interval
    update_interval: Duration,
}

impl TradingBot {
    /// Create a new trading bot
    pub fn new(
        darkswap: DarkSwap,
        base_asset: Asset,
        quote_asset: Asset,
        min_spread: Decimal,
        max_order_amount: Decimal,
        order_expiry: u64,
        update_interval: Duration,
    ) -> Self {
        Self {
            darkswap,
            base_asset,
            quote_asset,
            min_spread,
            max_order_amount,
            order_expiry,
            active_orders: Arc::new(Mutex::new(HashMap::new())),
            last_update: Arc::new(Mutex::new(Instant::now())),
            update_interval,
        }
    }

    /// Start the trading bot
    pub async fn start(&mut self) -> Result<()> {
        println!("Starting trading bot...");
        
        // Start DarkSwap
        self.darkswap.start().await?;
        
        // Get wallet address
        let address = self.darkswap.get_address().await?;
        println!("Wallet address: {}", address);
        
        // Get wallet balance
        let balance = self.darkswap.get_balance().await?;
        println!("Wallet balance: {} satoshis", balance);
        
        // Spawn a task to process events
        let active_orders = self.active_orders.clone();
        let last_update = self.last_update.clone();
        let update_interval = self.update_interval;
        
        let mut event_receiver = self.darkswap.subscribe_to_events().await;
        
        tokio::spawn(async move {
            while let Some(event) = event_receiver.recv().await {
                match event {
                    Event::OrderCreated { order_id } => {
                        println!("Order created: {:?}", order);
                    }
                    Event::OrderCancelled { order_id } => {
                        println!("Order canceled: {:?}", order_id);
                        active_orders.lock().await.remove(&order_id);
                    }
                    Event::OrderMatched { order_id, trade_id: _ } => {
                        println!("Order filled: {:?}", order_id);
                        active_orders.lock().await.remove(&order_id);
                    }
                    Event::OrderExpired { order_id } => {
                        println!("Order expired: {:?}", order_id);
                        active_orders.lock().await.remove(&order_id);
                    }
                    Event::TradeCreated { trade_id } => {
                        println!("Trade started: {:?}", trade);
                    }
                    Event::TradeCompleted { trade_id } => {
                        println!("Trade completed: {:?}", trade);
                        
                        // Update last update time to trigger a market check
                        *last_update.lock().await = Instant::now() - update_interval;
                    }
                    Event::TradeFailed { trade_id, error } => {
                        println!("Trade failed: {:?}", trade);
                    }
                    _ => {}
                }
            }
        });
        
        // Main loop
        loop {
            // Check if it's time to update
            let now = Instant::now();
            let last = *self.last_update.lock().await;
            
            if now.duration_since(last) >= self.update_interval {
                // Update last update time
                *self.last_update.lock().await = now;
                
                // Check market and create orders
                if let Err(e) = self.check_market_and_create_orders().await {
                    println!("Error checking market: {}", e);
                }
            }
            
            // Sleep for a bit
            sleep(Duration::from_secs(1)).await;
        }
    }

    /// Check market and create orders
    async fn check_market_and_create_orders(&mut self) -> Result<()> {
        println!("Checking market...");
        
        // Get best bid and ask
        let (bid, ask) = self.darkswap.get_best_bid_ask(&self.base_asset, &self.quote_asset).await?;
        
        println!("Best bid: {:?}", bid);
        println!("Best ask: {:?}", ask);
        
        // Calculate mid price
        let mid_price = match (bid, ask) {
            (Some(bid), Some(ask)) => (bid + ask) / Decimal::from(2),
            (Some(bid), None) => bid,
            (None, Some(ask)) => ask,
            (None, None) => {
                println!("No market data available");
                return Ok(());
            }
        };
        
        println!("Mid price: {}", mid_price);
        
        // Calculate spread
        let spread_percentage = match (bid, ask) {
            (Some(bid), Some(ask)) => {
                let spread = ask - bid;
                (spread / bid) * Decimal::from(100)
            }
            _ => Decimal::ZERO,
        };
        
        println!("Spread: {}%", spread_percentage);
        
        // Check if spread is large enough
        if spread_percentage < self.min_spread {
            println!("Spread too small, not creating orders");
            return Ok(());
        }
        
        // Cancel existing orders
        let active_orders = self.active_orders.lock().await.clone();
        for (order_id, _) in active_orders {
            println!("Canceling order: {:?}", order_id);
            if let Err(e) = self.darkswap.cancel_order(&order_id).await {
                println!("Error canceling order: {}", e);
            }
        }
        
        // Clear active orders
        self.active_orders.lock().await.clear();
        
        // Get wallet balances
        let btc_balance = self.darkswap.get_asset_balance(&Asset::Bitcoin).await?;
        println!("BTC balance: {} satoshis", btc_balance);
        
        // Calculate order amounts
        let buy_amount = (Decimal::from(btc_balance) / mid_price)
            .min(self.max_order_amount);
        
        let sell_amount = Decimal::from(btc_balance)
            .min(self.max_order_amount);
        
        // Create buy order (slightly below mid price)
        let buy_price = mid_price * Decimal::from_str("0.99")?;
        
        if buy_amount > Decimal::ZERO {
            println!("Creating buy order: {} {} @ {}", buy_amount, self.base_asset, buy_price);
            
            let buy_order = self.darkswap.create_order(
                self.base_asset.clone(),
                self.quote_asset.clone(),
                OrderSide::Buy,
                buy_amount,
                buy_price,
                Some(self.order_expiry),
            ).await?;
            
            println!("Buy order created: {:?}", buy_order);
            
            // Add to active orders
            self.active_orders.lock().await.insert(buy_order.id.clone(), buy_order);
        }
        
        // Create sell order (slightly above mid price)
        let sell_price = mid_price * Decimal::from_str("1.01")?;
        
        if sell_amount > Decimal::ZERO {
            println!("Creating sell order: {} {} @ {}", sell_amount, self.base_asset, sell_price);
            
            let sell_order = self.darkswap.create_order(
                self.base_asset.clone(),
                self.quote_asset.clone(),
                OrderSide::Sell,
                sell_amount,
                sell_price,
                Some(self.order_expiry),
            ).await?;
            
            println!("Sell order created: {:?}", sell_order);
            
            // Add to active orders
            self.active_orders.lock().await.insert(sell_order.id.clone(), sell_order);
        }
        
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    println!("Starting DarkSwap trading bot example...");

    // Create configuration
    let mut config = Config::default();
    
    // Set wallet type to simple (in-memory wallet)
    config.wallet.wallet_type = "simple".to_string();
    
    // Create DarkSwap instance
    let darkswap = DarkSwap::new(config)?;
    
    // Create trading bot
    let mut bot = TradingBot::new(
        darkswap,
        Asset::Bitcoin,
        Asset::Bitcoin,
        Decimal::from_str("1.0")?, // 1% minimum spread
        Decimal::from_str("0.1")?, // 0.1 BTC maximum order amount
        3600, // 1 hour order expiry
        Duration::from_secs(60), // 1 minute update interval
    );
    
    // Start trading bot
    bot.start().await?;
    
    Ok(())
}